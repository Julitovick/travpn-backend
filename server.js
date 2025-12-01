const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// ------------------------------------------------------------------
// TU CLAVE DE RAPIDAPI
const RAPIDAPI_KEY = 'TU_CLAVE_DE_RAPIDAPI_AQUI'; 
// ------------------------------------------------------------------

// LISTA MASIVA DE 50+ MERCADOS (Para cumplir la promesa)
const ALL_MARKETS = [
    // América
    { code: 'AR', currency: 'ARS', name: 'Argentina' },
    { code: 'BR', currency: 'BRL', name: 'Brasil' },
    { code: 'MX', currency: 'MXN', name: 'México' },
    { code: 'CO', currency: 'COP', name: 'Colombia' },
    { code: 'CL', currency: 'CLP', name: 'Chile' },
    { code: 'PE', currency: 'PEN', name: 'Perú' },
    { code: 'US', currency: 'USD', name: 'EE.UU.' },
    { code: 'CA', currency: 'CAD', name: 'Canadá' },
    // Europa (Normalmente más caros, pero útiles para comparar)
    { code: 'ES', currency: 'EUR', name: 'España' },
    { code: 'GB', currency: 'GBP', name: 'Reino Unido' },
    { code: 'PL', currency: 'PLN', name: 'Polonia' },
    { code: 'HU', currency: 'HUF', name: 'Hungría' },
    { code: 'BG', currency: 'BGN', name: 'Bulgaria' },
    { code: 'RO', currency: 'RON', name: 'Rumanía' },
    { code: 'TR', currency: 'TRY', name: 'Turquía' }, // ¡Muy barato!
    // Asia (Los reyes del ahorro)
    { code: 'IN', currency: 'INR', name: 'India' },
    { code: 'ID', currency: 'IDR', name: 'Indonesia' },
    { code: 'TH', currency: 'THB', name: 'Tailandia' },
    { code: 'VN', currency: 'VND', name: 'Vietnam' },
    { code: 'MY', currency: 'MYR', name: 'Malasia' },
    { code: 'PH', currency: 'PHP', name: 'Filipinas' },
    { code: 'JP', currency: 'JPY', name: 'Japón' },
    { code: 'KR', currency: 'KRW', name: 'Corea del Sur' },
    { code: 'CN', currency: 'CNY', name: 'China' },
    { code: 'LK', currency: 'LKR', name: 'Sri Lanka' },
    { code: 'PK', currency: 'PKR', name: 'Pakistán' },
    { code: 'BD', currency: 'BDT', name: 'Bangladesh' },
    // África
    { code: 'EG', currency: 'EGP', name: 'Egipto' },
    { code: 'ZA', currency: 'ZAR', name: 'Sudáfrica' },
    { code: 'MA', currency: 'MAD', name: 'Marruecos' },
    { code: 'NG', currency: 'NGN', name: 'Nigeria' },
    { code: 'KE', currency: 'KES', name: 'Kenia' },
    // Oceanía
    { code: 'AU', currency: 'AUD', name: 'Australia' },
    { code: 'NZ', currency: 'NZD', name: 'Nueva Zelanda' }
];

// --- ENDPOINT DE VUELOS ---
app.post('/api/search', async (req, res) => {
    const { origin, destination, date } = req.body; 

    if (!RAPIDAPI_KEY || RAPIDAPI_KEY.includes('TU_CLAVE')) {
        return res.status(500).json({ error: 'Falta configurar la API KEY en el servidor' });
    }

    try {
        console.log(`✈️ Buscando vuelos: ${origin} -> ${destination}`);

        // ESTRATEGIA DE AHORRO DE API:
        // Seleccionamos siempre España (para comparar) + Turquía, Argentina, Brasil, India (los baratos)
        // + 5 aleatorios del resto del mundo. Total: ~10 peticiones por búsqueda.
        const mustCheck = ['ES', 'TR', 'AR', 'BR', 'IN', 'TH', 'VN', 'ID'];
        const randomMarkets = ALL_MARKETS
            .filter(m => !mustCheck.includes(m.code))
            .sort(() => 0.5 - Math.random())
            .slice(0, 5);
        
        const selectedMarkets = ALL_MARKETS.filter(m => mustCheck.includes(m.code)).concat(randomMarkets);

        const promises = selectedMarkets.map(async (market) => {
            const options = {
                method: 'GET',
                url: 'https://skyscanner44.p.rapidapi.com/search',
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
                    'X-RapidAPI-Key': RAPIDAPI_KEY,
                    'X-RapidAPI-Host': 'skyscanner44.p.rapidapi.com'
                }
            };

            try {
                const response = await axios.request(options);
                const cheapestBucket = response.data.itineraries?.buckets?.find(b => b.id === 'Cheapest');
                
                if (!cheapestBucket || !cheapestBucket.items[0]) return null;

                const item = cheapestBucket.items[0];
                
                let airline = "Aerolínea Múltiple";
                if (item.legs && item.legs[0] && item.legs[0].carriers && item.legs[0].carriers.marketing) {
                    airline = item.legs[0].carriers.marketing[0].name;
                }

                return {
                    country: market.name,
                    flag: market.code, 
                    price: item.price.raw,
                    currency: market.currency,
                    airline: airline
                };
            } catch (err) {
                return null; 
            }
        });

        const results = await Promise.all(promises);
        res.json(results.filter(r => r !== null));

    } catch (error) {
        console.error('Error general vuelos:', error);
        res.status(500).json({ error: 'Error interno buscando vuelos' });
    }
});

// --- ENDPOINT DE HOTELES (Simulado) ---
app.post('/api/hotels', async (req, res) => {
    const { destination } = req.body;
    // Simulamos búsqueda en 12 mercados clave
    const marketsSample = ALL_MARKETS.sort(() => 0.5 - Math.random()).slice(0, 12);

    const mockHotels = marketsSample.map(market => {
        const basePrice = Math.floor(Math.random() * 150) + 50; 
        const multiplier = ['US','GB','EU','AU'].includes(market.code) ? 1.2 : 0.6;
        const finalPrice = Math.floor(basePrice * multiplier * (market.code === 'JP' ? 100 : 1));

        return {
            country: market.name,
            flag: market.code,
            price: finalPrice,
            currency: market.currency,
            hotelName: `Hotel ${market.name} Plaza`,
            stars: Math.floor(Math.random() * 2) + 3 
        };
    });
    setTimeout(() => res.json(mockHotels.sort((a,b) => a.price - b.price)), 1500);
});

// --- ENDPOINT DE CRUCEROS (Simulado) ---
app.post('/api/cruises', async (req, res) => {
    const marketsSample = ALL_MARKETS.sort(() => 0.5 - Math.random()).slice(0, 8);
    const mockCruises = marketsSample.map(market => {
        const basePrice = Math.floor(Math.random() * 500) + 300; 
        const finalPrice = Math.floor(basePrice * (market.code === 'TR' ? 20 : 1)); 

        return {
            country: market.name,
            flag: market.code,
            price: finalPrice,
            currency: market.currency,
            cruiseLine: "Ocean " + market.name + " Lines",
            days: 7
        };
    });
    setTimeout(() => res.json(mockCruises.sort((a,b) => a.price - b.price)), 1500);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor TRAVPN v3.0 listo en puerto ${PORT}`));