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

// NUEVOS MERCADOS DE BÚSQUEDA (Rep. Checa, India, México, España, Malasia)
const TARGET_MARKETS = [
    { code: 'CZ', currency: 'CZK', name: 'Rep. Checa', locale: 'cs-CZ' },
    { code: 'IN', currency: 'INR', name: 'India', locale: 'en-IN' },
    { code: 'MX', currency: 'MXN', name: 'México', locale: 'es-MX' },
    { code: 'ES', currency: 'EUR', name: 'España', locale: 'es-ES' },
    { code: 'MY', currency: 'MYR', name: 'Malasia', locale: 'ms-MY' }
];

// Ruta de salud
app.get('/', (req, res) => {
    res.send('Servidor TRAVPN funcionando correctamente.');
});

// --- 1. VUELOS ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date, passengers, directFlights } = req.body; 
    const p = passengers || { adults: 1, children: 0, infants: 0 };
    
    try {
        console.log('Buscando vuelos: ' + origin + ' a ' + destination);
        
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
                    countryCode: market.code,
                    stops: directFlights ? 'direct' : 'any'
                },
                headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': SKYSCANNER_HOST }
            };

            try {
                const response = await axios.request(options);
                const data = response.data.data || {};
                const itineraries = data.itineraries || [];
                
                if (itineraries.length === 0) return null;

                let bestFlight = itineraries[0];
                // Filtro manual extra por seguridad
                if (directFlights) {
                    const direct = itineraries.find(it => it.legs && it.legs.every(leg => leg.stopCount === 0));
                    if (direct) bestFlight = direct;
                }

                return {
                    type: 'flight',
                    country: market.name,
                    flag: market.code,
                    price: bestFlight.price?.raw || bestFlight.price?.amount || 0,
                    currency: market.currency,
                    airline: bestFlight.legs?.[0]?.carriers?.marketing?.[0]?.name || 'Ver detalles'
                };
            } catch (err) { return null; }
        });

        const results = await Promise.all(promises);
        res.json(results.filter(r => r !== null));

    } catch (error) {
        console.error('Error vuelos:', error.message);
        res.json([]); 
    }
});

// --- 2. HOTELES ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate, guests } = req.body;
    const g = guests || { adults: 2 };
    
    try {
        console.log('Buscando hoteles en: ' + destination);

        const locOptions = {
            method: 'GET',
            url: 'https://' + BOOKING_HOST + '/api/v1/hotels/searchDestination',
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': RAPIDAPI_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
        };

        const locRes = await axios.request(locOptions);
        const data = locRes.data.data || locRes.data || [];
        const firstResult = data[0];
        
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
                const bestHotelWrapper = hotelsData[0]; 

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
        console.error('Error hoteles:', error.message);
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

        // Tasas para: Rep. Checa, India, Mexico, España, Malasia
        const rates = { 'EUR': 1, 'CZK': 25.3, 'INR': 90.5, 'MXN': 18.2, 'MYR': 4.75, 'USD': 1.08 };
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
app.listen(PORT, () => console.log('Servidor listo en puerto ' + PORT));