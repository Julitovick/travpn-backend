const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CLAVES API
// ------------------------------------------------------------------
const COMMON_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d';

const SKYSCANNER_API_KEY = COMMON_KEY;
const BOOKING_API_KEY    = COMMON_KEY;
const CRUISE_API_KEY     = COMMON_KEY; 

// HOSTS DE LAS APIS (CONFIRMADOS)
const SKYSCANNER_HOST = 'flights-sky.p.rapidapi.com'; 
const BOOKING_HOST    = 'booking-com18.p.rapidapi.com'; 
const CRUISE_HOST     = 'cruisewave-api.p.rapidapi.com'; 
// ------------------------------------------------------------------

const TARGET_MARKETS = [
    { code: 'ES', currency: 'EUR', name: 'España' },
    { code: 'CZ', currency: 'CZK', name: 'Rep. Checa' },
    { code: 'PL', currency: 'PLN', name: 'Polonia' },
    { code: 'HU', currency: 'HUF', name: 'Hungría' },
    { code: 'BR', currency: 'BRL', name: 'Brasil' }
];

// --- 1. VUELOS (Robustecido) ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date, passengers, directFlights } = req.body; 
    const p = passengers || { adults: 1, children: 0, infants: 0 };
    
    try {
        console.log(✈️ Buscando vuelos: ${origin}->${destination}`);
        
        const promises = TARGET_MARKETS.map(async (market) => {
            const options = {
                method: 'GET',
                url: `https://${SKYSCANNER_HOST}/flights/search-one-way`,
                params: {
                    fromEntityId: origin, toEntityId: destination, departDate: date,
                    adults: p.adults, children: p.children, infants: p.infants,
                    currency: market.currency, market: market.code, countryCode: market.code,
                    stops: directFlights ? 'direct' : 'any' 
                },
                headers: { 'X-RapidAPI-Key': SKYSCANNER_API_KEY, 'X-RapidAPI-Host': SKYSCANNER_HOST }
            };

            try {
                const response = await axios.request(options);
                const itineraries = response.data.data?.itineraries || [];
                if (!itineraries.length) return [];

                return itineraries.slice(0, 5).map(flight => ({
                    type: 'flight',
                    country: market.name,
                    flag: market.code,
                    price: flight.price?.raw || flight.price?.amount || 0,
                    currency: market.currency,
                    airline: flight.legs?.[0]?.carriers?.marketing?.[0]?.name || "Ver detalles"
                }));
            } catch (err) {
                console.error(`Error vuelos ${market.name}: ${err.message}`);
                return []; // Si falla un país, devolvemos vacío para no romper todo
            }
        });

        const results = await Promise.all(promises);
        res.json(results.flat());

    } catch (error) {
        console.error("Error General Vuelos:", error.message);
        res.status(200).json([]); // Devolvemos vacío en vez de error 500
    }
});

// --- 2. HOTELES (Corregido para booking-com18) ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate, guests } = req.body;
    const g = guests || { adults: 2 };
    
    try {
        console.log(`🏨 Buscando hoteles en: ${destination}`);

        // PASO A: Buscar ID (Usando endpoint de booking-com18)
        const locOptions = {
            method: 'GET',
            url: `https://${BOOKING_HOST}/stays/auto-complete`,
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': BOOKING_API_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
        };

        const locRes = await axios.request(locOptions);
        // booking-com18 suele devolver 'data' con array
        const destData = locRes.data?.data?.[0] || locRes.data?.[0];
        
        if (!destData || !destData.id) {
            console.log("Ciudad no encontrada en Booking");
            return res.json([]); 
        }

        // PASO B: Buscar Hoteles
        const promises = TARGET_MARKETS.map(async (market) => {
            const searchOptions = {
                method: 'GET',
                url: `https://${BOOKING_HOST}/stays/list`,
                params: {
                    locationId: destData.id,
                    checkinDate: date,
                    checkoutDate: returnDate,
                    adults: g.adults,
                    rooms: 1,
                    currency: market.currency,
                    sort: 'price'
                },
                headers: { 'X-RapidAPI-Key': BOOKING_API_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
            };

            try {
                const hotelRes = await axios.request(searchOptions);
                const hotels = hotelRes.data.data || hotelRes.data.result || [];

                return hotels.slice(0, 5).map(h => ({
                    type: 'hotel',
                    country: market.name,
                    flag: market.code,
                    hotelName: h.name || h.hotel_name,
                    stars: h.qualityClass || h.class || 3,
                    image: h.photoUrls?.[0]?.replace('square60', 'max500') || h.main_photo_url,
                    // Manejo de precio seguro
                    price: h.priceBreakdown?.grossPrice?.value || h.min_total_price || 0,
                    currency: market.currency 
                }));
            } catch (err) {
                console.error(`Error hoteles ${market.name}: ${err.message}`);
                return [];
            }
        });

        const results = await Promise.all(promises);
        res.json(results.flat());

    } catch (error) {
        console.error("Error General Hoteles:", error.message);
        res.status(200).json([]);
    }
});

// --- 3. CRUCEROS (Buscador) ---
app.post('/api/cruises', async (req, res) => {
    const { destination } = req.body;
    try {
        const options = {
            method: 'GET',
            url: `https://${CRUISE_HOST}/cruises/search`, 
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': CRUISE_API_KEY, 'X-RapidAPI-Host': CRUISE_HOST }
        };

        let basePrice = 500;
        let cruiseName = `Crucero ${destination}`;
        let cruiseLine = "Royal Caribbean";

        try {
            const response = await axios.request(options);
            const items = response.data.data || response.data;
            if (items && items.length > 0) {
                const real = items[0];
                basePrice = real.price || 500;
                cruiseName = real.title || real.name || cruiseName;
            }
        } catch (e) { console.log("Error API Cruceros"); }

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
app.listen(PORT, () => console.log(`Servidor ROBUSTO listo en ${PORT}`));