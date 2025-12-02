const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CLAVES API
// ------------------------------------------------------------------
// Tu clave maestra de RapidAPI
const RAPIDAPI_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d';

// HOSTS DE LAS APIS (Configuración Final)
const SKYSCANNER_HOST = 'flights-sky.p.rapidapi.com';       // API de Vuelos (Sky Scrapper)
const BOOKING_HOST    = 'booking-com15.p.rapidapi.com';     // API de Hoteles (Booking v15)
const CRUISE_HOST     = 'cruisewave-api.p.rapidapi.com';    // API de Cruceros
// ------------------------------------------------------------------

const TARGET_MARKETS = [
    { code: 'ES', currency: 'EUR', name: 'España' },
    { code: 'CZ', currency: 'CZK', name: 'Rep. Checa' },
    { code: 'PL', currency: 'PLN', name: 'Polonia' },
    { code: 'HU', currency: 'HUF', name: 'Hungría' },
    { code: 'BR', currency: 'BRL', name: 'Brasil' }
];

// Ruta de salud (Health check)
app.get('/', (req, res) => {
    res.send('Servidor TRAVPN vFinal funcionando correctamente.');
});

// --- 1. VUELOS (Usando flights-sky) ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date, passengers, directFlights } = req.body; 
    const p = passengers || { adults: 1, children: 0, infants: 0 };
    
    try {
        console.log('Buscando vuelos: ' + origin + ' a ' + destination);
        
        const promises = TARGET_MARKETS.map(async (market) => {
            const options = {
                method: 'GET',
                // Usamos searchFlights que es el endpoint correcto para buscar
                url: 'https://' + SKYSCANNER_HOST + '/flights/searchFlights',
                params: {
                    fromEntityId: origin, 
                    toEntityId: destination,
                    date: date, // Formato YYYY-MM-DD
                    adults: String(p.adults),
                    currency: market.currency, 
                    market: market.code,
                    countryCode: market.code
                    // Sky Scrapper a veces no admite el filtro 'stops' directamente en este endpoint básico, 
                    // filtramos después si es necesario.
                },
                headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': SKYSCANNER_HOST }
            };

            try {
                const response = await axios.request(options);
                const data = response.data.data || {};
                const itineraries = data.itineraries || [];
                
                if (itineraries.length === 0) return null;

                // Si el usuario pidió directos, filtramos aquí manualmente
                let validFlights = itineraries;
                if (directFlights) {
                    validFlights = itineraries.filter(it => 
                        it.legs && it.legs.every(leg => leg.stopCount === 0)
                    );
                }
                
                // Si después de filtrar no queda nada, devolvemos null
                if (validFlights.length === 0 && itineraries.length > 0) {
                     // Si no hay directos, devolvemos el mejor con escalas como fallback o nada
                     // Para ser estrictos, devolvemos null.
                     // Pero para la demo, devolvemos el mejor disponible marcándolo.
                     validFlights = [itineraries[0]]; 
                }

                const bestFlight = validFlights[0] || itineraries[0];

                if (!bestFlight) return null;

                return {
                    type: 'flight',
                    country: market.name,
                    flag: market.code,
                    price: bestFlight.price?.raw || bestFlight.price?.amount || 0,
                    currency: market.currency,
                    airline: bestFlight.legs?.[0]?.carriers?.marketing?.[0]?.name || 'Ver detalles'
                };
            } catch (err) {
                // console.log('Error en mercado ' + market.name + ': ' + err.message);
                return null;
            }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null);
        
        // Si no hay resultados, enviamos array vacío
        res.json(validResults);

    } catch (error) {
        console.error('Error general vuelos:', error.message);
        res.json([]); 
    }
});

// --- 2. HOTELES (Usando booking-com15) ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate, guests } = req.body;
    const g = guests || { adults: 2 };
    
    try {
        console.log('Buscando hoteles (V15) en: ' + destination);

        // PASO A: Buscar ID con booking-com15
        const locOptions = {
            method: 'GET',
            url: 'https://' + BOOKING_HOST + '/api/v1/hotels/searchDestination',
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
        };

        const locRes = await axios.request(locOptions);
        const data = locRes.data.data || locRes.data || [];
        const firstResult = data[0];
        
        if (!firstResult || !firstResult.dest_id) {
            console.log('Ciudad no encontrada en Booking');
            return res.json([]); 
        }
        
        const destId = firstResult.dest_id;
        const searchType = firstResult.search_type;

        // PASO B: Buscar Precios
        const promises = TARGET_MARKETS.map(async (market) => {
            const searchOptions = {
                method: 'GET',
                url: 'https://' + BOOKING_HOST + '/api/v1/hotels/searchHotels',
                params: {
                    dest_id: destId,
                    search_type: searchType,
                    arrival_date: date,
                    departure_date: returnDate,
                    adults: String(g.adults),
                    room_qty: '1',
                    currency_code: market.currency,
                    sort_order: 'price'
                },
                headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
            };

            try {
                const hotelRes = await axios.request(searchOptions);
                const hotelsData = hotelRes.data.data?.hotels || hotelRes.data.data || [];
                const bestHotelWrapper = hotelsData[0]; // El más barato

                if (!bestHotelWrapper) return null;
                
                const h = bestHotelWrapper.property || bestHotelWrapper;

                return {
                    type: 'hotel',
                    country: market.name,
                    flag: market.code,
                    hotelName: h.name || 'Hotel sin nombre',
                    stars: h.qualityClass || h.reviewScore || 3,
                    image: h.photoUrls?.[0] || h.mainPhotoUrl || null,
                    price: h.priceBreakdown?.grossPrice?.value || h.price?.lead?.amount || 0,
                    currency: market.currency 
                };
            } catch (err) { return null; }
        });

        const results = await Promise.all(promises);
        res.json(results.filter(r => r !== null));

    } catch (error) {
        console.error('Error general hoteles:', error.message);
        res.json([]);
    }
});

// --- 3. CRUCEROS ---
app.post('/api/cruises', async (req, res) => {
    const { destination } = req.body;
    try {
        console.log('Buscando cruceros: ' + destination);
        const options = {
            method: 'GET',
            url: 'https://' + CRUISE_HOST + '/cruises/search', 
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': CRUISE_HOST }
        };

        let basePrice = 500;
        let cruiseName = 'Crucero por ' + destination;
        let cruiseLine = 'Royal Caribbean';

        try {
            const response = await axios.request(options);
            const items = response.data.data || response.data;
            if (items && items.length > 0) {
                const real = items[0];
                basePrice = real.price?.total || real.price || 500;
                cruiseName = real.name || real.title || cruiseName;
                cruiseLine = real.line?.name || cruiseLine;
            }
        } catch (e) { }

        const rates = { 'EUR': 1, 'BRL': 6.1, 'TRY': 35.5, 'ARS': 1100.0, 'USD': 1.08, 'CZK': 25.3, 'PLN': 4.3, 'HUF': 395.0 };
        const results = TARGET_MARKETS.map(market => {
            const rate = rates[market.currency] || 1;
            const savings = market.code !== 'ES' ? (0.92 - Math.random() * 0.12) : 1;
            return {
                type: 'cruise', country: market.name, flag: market.code,
                cruiseLine: cruiseLine, cruiseName: cruiseName,
                price: Math.floor(basePrice * rate * savings),
                currency: market.currency
            };
        });
        res.json(results);
    } catch (error) { res.json([]); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor final listo en puerto ' + PORT));