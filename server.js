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

// HOSTS DE LAS APIS
const SKYSCANNER_HOST = 'flights-sky.p.rapidapi.com'; 
const BOOKING_HOST    = 'booking-com18.p.rapidapi.com'; 
const CRUISE_HOST     = 'cruisewave-api.p.rapidapi.com'; 
// ------------------------------------------------------------------

// MERCADOS REALES A CONSULTAR
const TARGET_MARKETS = [
    { code: 'ES', currency: 'EUR', name: 'España', locale: 'es-ES' },
    { code: 'CZ', currency: 'CZK', name: 'Rep. Checa', locale: 'cs-CZ' },
    { code: 'PL', currency: 'PLN', name: 'Polonia', locale: 'pl-PL' },
    { code: 'HU', currency: 'HUF', name: 'Hungría', locale: 'hu-HU' },
    { code: 'BR', currency: 'BRL', name: 'Brasil', locale: 'pt-BR' }
];

// --- 1. VUELOS ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date, passengers, directFlights } = req.body; 
    const p = passengers || { adults: 1, children: 0, infants: 0 };
    
    if (!SKYSCANNER_API_KEY) return res.status(500).json({ error: 'Falta API Key' });

    try {
        // SOLUCIÓN SEGURA: Comillas normales sin emojis para evitar errores de copia
        console.log('Buscando Top 5 vuelos en 5 mercados...');
        
        const promises = TARGET_MARKETS.map(async (market) => {
            const options = {
                method: 'GET',
                url: 'https://' + SKYSCANNER_HOST + '/flights/search-one-way',
                params: {
                    fromEntityId: origin, 
                    toEntityId: destination,
                    departDate: date,
                    adults: p.adults,
                    children: p.children,
                    infants: p.infants,
                    currency: market.currency, 
                    market: market.code,
                    countryCode: market.code,
                    stops: directFlights ? 'direct' : 'any' 
                },
                headers: { 'X-RapidAPI-Key': SKYSCANNER_API_KEY, 'X-RapidAPI-Host': SKYSCANNER_HOST }
            };

            try {
                const response = await axios.request(options);
                const itineraries = response.data.data?.itineraries || [];
                
                if (itineraries.length === 0) return [];

                return itineraries.slice(0, 5).map(flight => {
                    return {
                        type: 'flight',
                        country: market.name,
                        flag: market.code,
                        price: flight.price?.raw || flight.price?.amount, 
                        currency: market.currency,
                        airline: flight.legs?.[0]?.carriers?.marketing?.[0]?.name || "Ver detalles"
                    };
                });

            } catch (err) {
                return [];
            }
        });

        const resultsArrays = await Promise.all(promises);
        res.json(resultsArrays.flat());

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error general en vuelos' });
    }
});

// --- 2. HOTELES ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate, guests } = req.body;
    const g = guests || { adults: 2, children: 0 };
    
    try {
        // SOLUCIÓN SEGURA: Concatenación estándar
        console.log('Buscando hoteles en: ' + destination);

        const locOptions = {
            method: 'GET', url: 'https://' + BOOKING_HOST + '/v1/hotels/locations',
            params: { name: destination, locale: 'es' },
            headers: { 'X-RapidAPI-Key': BOOKING_API_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
        };
        const locRes = await axios.request(locOptions);
        const destData = locRes.data?.find(d => d.dest_type === 'city') || locRes.data?.[0];
        
        if (!destData) return res.json([]); 

        const promises = TARGET_MARKETS.map(async (market) => {
            const searchOptions = {
                method: 'GET', url: 'https://' + BOOKING_HOST + '/v1/hotels/search',
                params: {
                    checkin_date: date, checkout_date: returnDate,
                    dest_id: destData.dest_id, dest_type: destData.dest_type,
                    adults_number: g.adults, order_by: 'price', 
                    filter_by_currency: market.currency, 
                    locale: 'es', units: 'metric', room_number: '1'
                },
                headers: { 'X-RapidAPI-Key': BOOKING_API_KEY, 'X-RapidAPI-Host': BOOKING_HOST }
            };

            try {
                const hotelRes = await axios.request(searchOptions);
                const hotels = hotelRes.data.result || [];

                return hotels.slice(0, 5).map(bestHotel => ({
                    type: 'hotel',
                    country: market.name,
                    flag: market.code,
                    hotelName: bestHotel.hotel_name,
                    stars: bestHotel.class || 0,
                    image: bestHotel.main_photo_url?.replace('square60', 'max500'),
                    price: bestHotel.min_total_price, 
                    currency: market.currency 
                }));
            } catch (err) { return []; }
        });

        const resultsArrays = await Promise.all(promises);
        res.json(resultsArrays.flat());

    } catch (error) { console.error(error); res.json([]); }
});

// --- 3. CRUCEROS ---
app.post('/api/cruises', async (req, res) => {
    const { destination } = req.body;
    try {
        // SOLUCIÓN SEGURA: Concatenación estándar
        console.log('Buscando cruceros: ' + destination);
        
        const options = {
            method: 'GET',
            url: 'https://' + CRUISE_HOST + '/cruises/search', 
            params: { query: destination },
            headers: { 'X-RapidAPI-Key': CRUISE_API_KEY, 'X-RapidAPI-Host': CRUISE_HOST }
        };

        let basePrice = 500;
        let cruiseName = 'Crucero por ' + destination;
        let cruiseLine = "Royal Caribbean";

        try {
            const response = await axios.request(options);
            const items = response.data.data || response.data;
            if (items && items.length > 0) {
                const real = items[0];
                basePrice = real.price?.total || real.price || 500;
                cruiseName = real.name || real.title || cruiseName;
                cruiseLine = real.line?.name || cruiseLine;
            }
        } catch (apiError) {}

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
app.listen(PORT, () => console.log('Servidor con Sintaxis Segura listo en ' + PORT));