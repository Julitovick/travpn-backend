const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CLAVES API (PROPORCIONADAS POR TI)
// ------------------------------------------------------------------
const RAPIDAPI_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d';

// HOSTS EXACTOS SEGÚN TUS CURLs
const SKYSCANNER_HOST = 'flights-sky.p.rapidapi.com';
const BOOKING_HOST    = 'booking-com15.p.rapidapi.com';
const CRUISE_HOST     = 'cruise-api1.p.rapidapi.com';

// MERCADOS PARA COMPARAR PRECIOS (5 PAÍSES)
const TARGET_MARKETS = [
    { code: 'ES', currency: 'EUR', name: 'España' },
    { code: 'TR', currency: 'TRY', name: 'Turquía' },
    { code: 'AR', currency: 'ARS', name: 'Argentina' },
    { code: 'BR', currency: 'BRL', name: 'Brasil' },
    { code: 'PL', currency: 'PLN', name: 'Polonia' }
];

// --- 1. VUELOS (flights-sky) ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date, passengers } = req.body; 
    const p = passengers || { adults: 1 };

    console.log(`✈️ Buscando vuelos en flights-sky: ${origin}->${destination}`);

    try {
        // Lanzamos 5 peticiones paralelas a los distintos mercados
        const promises = TARGET_MARKETS.map(async (market) => {
            const options = {
                method: 'GET',
                url: `https://${SKYSCANNER_HOST}/flights/search-one-way`,
                params: {
                    fromEntityId: origin, // Ej: MAD
                    toEntityId: destination, // Ej: JFK
                    departDate: date,
                    adults: String(p.adults),
                    currency: market.currency,
                    market: market.code,
                    countryCode: market.code
                },
                headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': SKYSCANNER_HOST }
            };

            try {
                const response = await axios.request(options);
                // La estructura de flights-sky suele devolver 'data.itineraries'
                const itineraries = response.data.data?.itineraries || [];
                
                if (itineraries.length === 0) return null;

                // Cogemos el primer resultado (el más barato por defecto)
                const flight = itineraries[0];
                const price = flight.price?.amount || flight.price?.raw || 0;
                const airline = flight.legs?.[0]?.carriers?.marketing?.[0]?.name || "Varios";

                return {
                    type: 'flight',
                    country: market.name,
                    flag: market.code,
                    price: price,
                    currency: market.currency,
                    airline: airline
                };
            } catch (err) { return null; }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null);
        
        if (validResults.length === 0) return res.json([]);
        res.json(validResults);

    } catch (error) {
        console.error("Error Vuelos:", error.message);
        res.json([]);
    }
});

// --- 2. HOTELES (booking-com15) ---
app.post('/api/hotels', async (req, res) => {
    const { destination, date, returnDate, guests } = req.body;
    const g = guests || { adults: 2 };

    console.log(`🏨 Buscando hoteles en booking-com15: ${destination}`);

    try {
        // PASO A: Obtener el ID numérico de la ciudad (dest_id)
        // Nota: booking-com15 usa searchDestination
        const locOptions = {
            method: 'GET',
            url: `https://${BOOKING_HOST}/api/v1/hotels/searchDestination`,
            params: { query: destination },
            headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': BOOKING_HOST }
        };

        const locRes = await axios.request(locOptions);
        const destData = locRes.data?.data?.[0]; // Cogemos el primer resultado

        if (!destData) return res.json([]); 

        // PASO B: Buscar precios en los 5 mercados
        const promises = TARGET_MARKETS.map(async (market) => {
            const searchOptions = {
                method: 'GET',
                url: `https://${BOOKING_HOST}/api/v1/hotels/searchHotels`,
                params: {
                    dest_id: destData.dest_id,
                    search_type: destData.search_type,
                    arrival_date: date,
                    departure_date: returnDate,
                    adults: String(g.adults),
                    room_qty: '1',
                    page_number: '1',
                    units: 'metric',
                    temperature_unit: 'c',
                    languagecode: 'es',
                    currency_code: market.currency
                },
                headers: { 'x-rapidapi-key': RAPIDAPI_KEY, 'x-rapidapi-host': BOOKING_HOST }
            };

            try {
                const hotelRes = await axios.request(searchOptions);
                // La estructura de booking-com15 suele ser data.data.hotels
                const hotels = hotelRes.data?.data?.hotels || [];
                
                if (hotels.length === 0) return null;

                const hotel = hotels[0].property; // Cogemos el primero

                return {
                    type: 'hotel',
                    country: market.name,
                    flag: market.code,
                    hotelName: hotel.name,
                    stars: hotel.qualityClass || 3,
                    image: hotel.photoUrls?.[0]?.replace('square60', 'max500'),
                    price: hotel.priceBreakdown?.grossPrice?.value || 0,
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

// --- 3. CRUCEROS (cruise-api1 - REAL POST) ---
app.post('/api/cruises', async (req, res) => {
    const { destination, date } = req.body;
    console.log(`🚢 Buscando cruceros en cruise-api1: ${destination}`);

    try {
        // Mapeo básico de destinos de texto a códigos de región de cruceros (ejemplo simplificado)
        let regionCodes = [];
        const destLower = destination.toLowerCase();
        if (destLower.includes('alaska')) regionCodes = ['AK'];
        else if (destLower.includes('caribe') || destLower.includes('caribbean')) regionCodes = ['CB', 'CE', 'CW'];
        else if (destLower.includes('mediterraneo') || destLower.includes('mediterranean')) regionCodes = ['EM', 'WM'];
        else regionCodes = []; // Búsqueda abierta si no coincide

        // Construimos el payload JSON que pide la API
        const payload = {
            cruiseTypes: ["OCEAN_TOUR"],
            destinations: regionCodes.length > 0 ? regionCodes : undefined, // Solo enviamos si tenemos códigos
            minDuration: 3,
            maxDuration: 14,
            page: 1,
            pageSize: 5,
            sortOrder: "asc",
            sortBy: "price" // Queremos los más baratos
        };

        // Hacemos UNA búsqueda real (base USD) y luego calculamos las conversiones VPN
        // (Cruceros rara vez tiene diferencias tan marcadas por VPN, pero simulamos la conversión real)
        const options = {
            method: 'POST',
            url: `https://${CRUISE_HOST}/cruises/search`,
            headers: { 
                'content-type': 'application/json',
                'x-rapidapi-key': RAPIDAPI_KEY, 
                'x-rapidapi-host': CRUISE_HOST 
            },
            data: payload
        };

        const response = await axios.request(options);
        const cruises = response.data?.results || response.data?.cruises || [];

        if (cruises.length === 0) return res.json([]);

        const realCruise = cruises[0]; // El más barato real
        const basePriceUSD = realCruise.price?.total || realCruise.priceWithTaxesFees?.total || 500;

        // Tasas de cambio manuales para la comparativa (Cruceros suele ser en USD/EUR base)
        const rates = { 'EUR': 0.92, 'BRL': 5.0, 'TRY': 32.0, 'ARS': 850.0, 'USD': 1.0 };

        const results = TARGET_MARKETS.map(market => {
            const rate = rates[market.currency] || 1;
            // Simulamos la conversión de divisa
            const localPrice = Math.floor(basePriceUSD * rate);
            
            return {
                type: 'cruise',
                country: market.name,
                flag: market.code,
                cruiseLine: realCruise.cruiseLine?.name || "Naviera",
                cruiseName: realCruise.ship?.name || "Crucero",
                price: localPrice,
                currency: market.currency
            };
        });

        res.json(results);

    } catch (error) {
        console.error("Error Cruceros:", error.message);
        res.json([]); 
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor V7 REAL-APIS listo en puerto ${PORT}`));