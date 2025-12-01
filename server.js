const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CLAVES API
// ------------------------------------------------------------------
// Clave para VUELOS (Skyscanner) - La que me has facilitado
const SKYSCANNER_API_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d';

// Clave para HOTELES (Booking.com)
// NOTA: Si te suscribiste con la misma cuenta de RapidAPI, suele ser la misma clave.
// Si tienes una diferente para Booking, cámbiala aquí.
const BOOKING_API_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d'; 
// ------------------------------------------------------------------

// Hosts de las APIs
const SKYSCANNER_HOST = 'skyscanner44.p.rapidapi.com';
const BOOKING_HOST = 'booking-com.p.rapidapi.com';

// Países para comparar vuelos
const MARKETS = [
    { code: 'ES', currency: 'EUR', name: 'España' },
    { code: 'US', currency: 'USD', name: 'EE.UU.' },
    { code: 'BR', currency: 'BRL', name: 'Brasil' },
    { code: 'AR', currency: 'ARS', name: 'Argentina' },
    { code: 'TR', currency: 'TRY', name: 'Turquía' }
];

// --- 1. VUELOS (Usa SKYSCANNER_API_KEY) ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date } = req.body; 
    
    if (!SKYSCANNER_API_KEY) return res.status(500).json({ error: 'Falta API Key de Vuelos' });

    try {
        console.log(`✈️ Buscando vuelos: ${origin} -> ${destination}`);
        
        const promises = MARKETS.map(async (market) => {
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
                    'X-RapidAPI-Key': SKYSCANNER_API_KEY, // <--- Clave Específica
                    'X-RapidAPI-Host': SKYSCANNER_HOST
                }
            };

            try {
                const response = await axios.request(options);
                const bucket = response.data.itineraries?.buckets?.find(b => b.id === 'Cheapest');
                if (!bucket || !bucket.items[0]) return null;

                return {
                    type: 'flight',
                    country: market.name,
                    flag: market.code, 
                    price: bucket.items[0].price.raw,
                    currency: market.currency,
                    airline: "Ver en web"
                };
            } catch (err) { return null; }
        });

        const results = await Promise.all(promises);
        res.json(results.filter(r => r !== null));

    } catch (error) {
        res.status(500).json({ error: 'Error buscando vuelos' });
    }
});

// --- 2. HOTELES (Usa BOOKING_API_KEY) ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate } = req.body;
    console.log(`🏨 Buscando hoteles (Booking) en: ${destination}`);

    if (!BOOKING_API_KEY) return res.status(500).json({ error: 'Falta API Key de Hoteles' });

    try {
        // PASO A: Buscar el ID de la ciudad en Booking
        const locationOptions = {
            method: 'GET',
            url: `https://${BOOKING_HOST}/v1/hotels/locations`,
            params: { name: destination, locale: 'es' },
            headers: {
                'X-RapidAPI-Key': BOOKING_API_KEY, // <--- Clave Específica
                'X-RapidAPI-Host': BOOKING_HOST
            }
        };

        const locResponse = await axios.request(locationOptions);
        
        const destData = locResponse.data?.find(d => d.dest_type === 'city') || locResponse.data?.[0];

        if (!destData) {
            return res.json([]); 
        }
        
        const destId = destData.dest_id;
        const destType = destData.dest_type;

        // PASO B: Buscar hoteles reales usando ese ID
        const searchOptions = {
            method: 'GET',
            url: `https://${BOOKING_HOST}/v1/hotels/search`,
            params: {
                checkin_date: date,
                checkout_date: returnDate,
                dest_id: destId,
                dest_type: destType,
                adults_number: '1',
                order_by: 'price',
                filter_by_currency: 'EUR',
                locale: 'es',
                units: 'metric',
                room_number: '1'
            },
            headers: {
                'X-RapidAPI-Key': BOOKING_API_KEY, // <--- Clave Específica
                'X-RapidAPI-Host': BOOKING_HOST
            }
        };

        const hotelResponse = await axios.request(searchOptions);
        const hotels = hotelResponse.data.result || [];

        // PASO C: Formatear para el Frontend
        const realHotels = hotels.slice(0, 6).map(h => ({
            type: 'hotel',
            country: 'Global', 
            flag: 'globe',
            price: h.min_total_price, 
            currency: 'EUR', 
            hotelName: h.hotel_name,
            stars: h.class || 0,
            image: h.main_photo_url ? h.main_photo_url.replace('square60', 'max500') : 'https://images.unsplash.com/photo-1566073771259-6a8506099945'
        }));

        res.json(realHotels);

    } catch (error) {
        console.error("Error API Booking:", error.message);
        res.json([]); 
    }
});

// --- 3. CRUCEROS (Redirección Honesta) ---
app.post('/api/cruises', async (req, res) => {
    res.json([]); 
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor con claves separadas listo en puerto ${PORT}`));