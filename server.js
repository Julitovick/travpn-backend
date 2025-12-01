const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CLAVES API
// ------------------------------------------------------------------
const SKYSCANNER_API_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d';
const BOOKING_API_KEY    = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d';
const CRUISE_API_KEY     = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d'; 

const SKYSCANNER_HOST = 'skyscanner44.p.rapidapi.com';
const BOOKING_HOST    = 'booking-com.p.rapidapi.com';
const CRUISE_HOST     = 'cruise-data.p.rapidapi.com'; 
// ------------------------------------------------------------------

// MERCADOS REALES A CONSULTAR (5 PAÍSES FIJOS)
// Cambiado: Rep. Checa -> Turquía
const TARGET_MARKETS = [
    { code: 'ES', currency: 'EUR', name: 'España', locale: 'es-ES' },
    { code: 'TR', currency: 'TRY', name: 'Turquía', locale: 'tr-TR' }, // ¡Nuevo!
    { code: 'PL', currency: 'PLN', name: 'Polonia', locale: 'pl-PL' },
    { code: 'HU', currency: 'HUF', name: 'Hungría', locale: 'hu-HU' },
    { code: 'BR', currency: 'BRL', name: 'Brasil', locale: 'pt-BR' }
];

// --- 1. VUELOS (100% REAL - 5 Peticiones) ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date } = req.body; 
    
    if (!SKYSCANNER_API_KEY) return res.status(500).json({ error: 'Falta API Key Vuelos' });

    try {
        console.log(`✈️ Buscando vuelos reales en 5 mercados: ${origin}->${destination}`);
        
        const promises = TARGET_MARKETS.map(async (market) => {
            const options = {
                method: 'GET',
                url: `https://${SKYSCANNER_HOST}/search`,
                params: {
                    adults: '1',
                    origin: origin,
                    destination: destination,
                    departureDate: date,
                    currency: market.currency,
                    countryCode: market.code,
                    market: market.code
                },
                headers: {
                    'X-RapidAPI-Key': SKYSCANNER_API_KEY,
                    'X-RapidAPI-Host': SKYSCANNER_HOST
                }
            };

            try {
                const response = await axios.request(options);
                const bucket = response.data.itineraries?.buckets?.find(b => b.id === 'Cheapest');
                
                if (!bucket || !bucket.items[0]) return null;

                const flightData = bucket.items[0];
                let airline = "Ver detalles";
                try { airline = flightData.legs[0].carriers.marketing[0].name; } catch(e){}

                return {
                    type: 'flight',
                    country: market.name,
                    flag: market.code,
                    price: flightData.price.raw,
                    currency: market.currency,
                    airline: airline
                };
            } catch (err) {
                return null;
            }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null);
        
        res.json(validResults);

    } catch (error) {
        res.status(500).json({ error: 'Error general en vuelos' });
    }
});

// --- 2. HOTELES (100% REAL - 5 Peticiones) ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate } = req.body;
    console.log(`🏨 Buscando hoteles reales en: ${destination}`);

    try {
        // PASO A: Buscar ID Ciudad
        const locOptions = {
            method: 'GET', url: `https://${BOOKING_HOST}/v1/hotels/locations`,
            params: { name: destination, locale: 'es' },
            headers: { 'X-RapidAPI-Key': BOOKING_API_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
        };
        const locRes = await axios.request(locOptions);
        const destData = locRes.data?.find(d => d.dest_type === 'city') || locRes.data?.[0];
        
        if (!destData) return res.json([]); 

        // PASO B: Consultar precios en los 5 mercados REALES
        const promises = TARGET_MARKETS.map(async (market) => {
            const searchOptions = {
                method: 'GET',
                url: `https://${BOOKING_HOST}/v1/hotels/search`,
                params: {
                    checkin_date: date,
                    checkout_date: returnDate,
                    dest_id: destData.dest_id,
                    dest_type: destData.dest_type,
                    adults_number: '1',
                    order_by: 'price',
                    filter_by_currency: market.currency,
                    locale: 'es',
                    units: 'metric',
                    room_number: '1'
                },
                headers: { 'X-RapidAPI-Key': BOOKING_API_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
            };

            try {
                const hotelRes = await axios.request(searchOptions);
                const bestHotel = hotelRes.data.result?.[0]; 

                if (!bestHotel) return null;

                return {
                    type: 'hotel',
                    country: market.name,
                    flag: market.code,
                    hotelName: bestHotel.hotel_name,
                    stars: bestHotel.class || 0,
                    image: bestHotel.main_photo_url?.replace('square60', 'max500'),
                    price: bestHotel.min_total_price,
                    currency: market.currency 
                };
            } catch (err) { return null; }
        });

        const results = await Promise.all(promises);
        res.json(results.filter(r => r !== null));

    } catch (error) {
        console.error("Error Hoteles:", error.message);
        res.json([]); 
    }
});

// --- 3. CRUCEROS ---
app.post('/api/cruises', async (req, res) => {
    res.json([]); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor 5-Mercados (con Turquía) listo en ${PORT}`));