const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CLAVES API
// ------------------------------------------------------------------
const RAPIDAPI_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d';

// HOSTS
const SKYSCANNER_HOST = 'flights-sky.p.rapidapi.com'; 
const BOOKING_HOST    = 'booking-com15.p.rapidapi.com'; 
const CRUISE_HOST     = 'cruisewave-api.p.rapidapi.com'; 
// ------------------------------------------------------------------

const TARGET_MARKETS = [
    { code: 'BG', currency: 'BGN', name: 'Bulgaria', locale: 'bg-BG' },
    { code: 'IN', currency: 'INR', name: 'India', locale: 'en-IN' },
    { code: 'MX', currency: 'MXN', name: 'México', locale: 'es-MX' },
    { code: 'ES', currency: 'EUR', name: 'España', locale: 'es-ES' },
    { code: 'TH', currency: 'THB', name: 'Tailandia', locale: 'th-TH' }
];

// Ruta de salud
app.get('/', (req, res) => {
    res.send('Servidor TRAVPN funcionando correctamente.');
});

// --- 1. VUELOS (Top 5 por País) ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date, passengers, directFlights } = req.body; 
    const p = passengers || { adults: 1, children: 0, infants: 0 };
    
    try {
        console.log('Buscando vuelos (Top 5/país): ' + origin + ' a ' + destination);
        
        const promises = TARGET_MARKETS.map(async (market) => {
            const options = {
                method: 'GET',
                url: 'https://' + SKYSCANNER_HOST + '/flights/search-one-way',
                params: {
                    fromEntityId: origin, 
                    toEntityId: destination,
                    departDate: date,
                    adults: String(p.adults),
                    children: String(p.children),
                    infants: String(p.infants),
                    currency: market.currency, 
                    market: market.code,
                    countryCode: market.code
                },
                headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': SKYSCANNER_HOST }
            };

            try {
                const response = await axios.request(options);
                const data = response.data.data || {};
                let itineraries = data.itineraries || [];
                
                // Filtro opcional de vuelos directos
                if (directFlights) {
                    itineraries = itineraries.filter(it => 
                        it.legs && it.legs.every(leg => leg.stopCount === 0)
                    );
                }

                if (itineraries.length === 0) return [];

                // AQUÍ ESTÁ EL CAMBIO: Devolvemos los 5 primeros (slice 0,5)
                return itineraries.slice(0, 5).map(flight => ({
                    type: 'flight',
                    country: market.name,
                    flag: market.code,
                    price: flight.price?.raw || flight.price?.amount || 0,
                    currency: market.currency,
                    airline: flight.legs?.[0]?.carriers?.marketing?.[0]?.name || 'Ver detalles'
                }));

            } catch (err) {
                return [];
            }
        });

        const results = await Promise.all(promises);
        // Aplanamos el array de arrays para tener una lista única
        res.json(results.flat());

    } catch (error) {
        console.error('Error vuelos:', error.message);
        res.json([]); 
    }
});

// --- 2. HOTELES (Top 5 por País) ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate, guests } = req.body;
    const g = guests || { adults: 2 };
    
    try {
        console.log('Buscando hoteles (Top 5/país) en: ' + destination);

        const locOptions = {
            method: 'GET',
            url: 'https://' + BOOKING_HOST + '/api/v1/hotels/searchDestination',
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
        };

        const locRes = await axios.request(locOptions);
        const firstResult = locRes.data?.data?.[0] || locRes.data?.[0];
        
        if (!firstResult || !firstResult.dest_id) return res.json([]); 
        
        const destId = firstResult.dest_id;
        const searchType = firstResult.search_type;

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
                
                if (hotelsData.length === 0) return [];

                // AQUÍ ESTÁ EL CAMBIO: Devolvemos los 5 primeros
                return hotelsData.slice(0, 5).map(wrapper => {
                    const h = wrapper.property || wrapper;
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
                });

            } catch (err) { return []; }
        });

        const results = await Promise.all(promises);
        res.json(results.flat());

    } catch (error) {
        console.error('Error hoteles:', error.message);
        res.json([]);
    }
});

// --- 3. CRUCEROS (Top 5 por País) ---
app.post('/api/cruises', async (req, res) => {
    const { destination } = req.body;
    try {
        console.log('Buscando cruceros: ' + destination);
        
        // 1. Obtenemos una lista REAL de cruceros desde la API
        const options = {
            method: 'GET',
            url: 'https://' + CRUISE_HOST + '/cruises/search', 
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': CRUISE_HOST }
        };

        let realCruises = [];
        try {
            const response = await axios.request(options);
            const items = response.data.data || response.data;
            // Cogemos hasta 5 cruceros diferentes reales
            if (items && items.length > 0) {
                realCruises = items.slice(0, 5);
            }
        } catch (e) { }

        // Si no hay cruceros reales, usamos uno base de seguridad
        if (realCruises.length === 0) {
            realCruises = [{ title: 'Crucero ' + destination, price: 500, line: { name: 'Royal Caribbean' } }];
        }

        // 2. Para cada país, calculamos el precio de esos 5 cruceros
        const rates = { 'EUR': 1, 'BGN': 1.95, 'INR': 90.5, 'MXN': 18.2, 'THB': 39.5, 'USD': 1.08 };
        
        const resultsArrays = TARGET_MARKETS.map(market => {
            const rate = rates[market.currency] || 1;
            const savings = market.code !== 'ES' ? (0.92 - Math.random() * 0.12) : 1;

            // Mapeamos los 5 cruceros para ESTE país
            return realCruises.map(cruise => {
                const basePrice = cruise.price?.total || cruise.price || cruise.minPrice || 500;
                return {
                    type: 'cruise',
                    country: market.name,
                    flag: market.code,
                    cruiseLine: cruise.line?.name || cruise.cruiseLine || 'Naviera',
                    cruiseName: cruise.title || cruise.name,
                    price: Math.floor(basePrice * rate * savings),
                    currency: market.currency
                };
            });
        });

        res.json(resultsArrays.flat());

    } catch (error) { res.json([]); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Servidor Multi-Resultados listo en ' + PORT));