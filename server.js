const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors()); // Permite que Vercel conecte aquí
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURACIÓN IMPORTANTE
// ------------------------------------------------------------------
// 1. Regístrate en rapidapi.com
// 2. Busca "Skyscanner" y suscríbete al plan gratuito (Basic)
// 3. Copia tu 'X-RapidAPI-Key' y pégala abajo dentro de las comillas
const RAPIDAPI_KEY = '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d'; 
// ------------------------------------------------------------------

const MARKETS = [
    { code: 'ES', currency: 'EUR', name: 'España' },
    { code: 'US', currency: 'USD', name: 'Estados Unidos' },
    { code: 'BR', currency: 'BRL', name: 'Brasil' },
    { code: 'AR', currency: 'ARS', name: 'Argentina' },
    { code: 'IN', currency: 'INR', name: 'India' },
    { code: 'TR', currency: 'TRY', name: 'Turquía' }
];

app.post('/api/search', async (req, res) => {
    const { origin, destination, date } = req.body; 

    if (!RAPIDAPI_KEY || RAPIDAPI_KEY === '1989077d03mshb8c66c4fa42d362p1f2868jsn997c43a1736d') {
        return res.status(500).json({ error: 'Falta configurar la API KEY en el servidor' });
    }

    try {
        console.log(`Buscando vuelo ${origin} -> ${destination} para ${date}`);
        
        // Lanzamos todas las peticiones en paralelo
        const promises = MARKETS.map(async (market) => {
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
                // Intentamos sacar el precio más barato
                const cheapestBucket = response.data.itineraries?.buckets?.find(b => b.id === 'Cheapest');
                const priceRaw = cheapestBucket ? cheapestBucket.items[0].price.raw : null;

                if (!priceRaw) return null;

                return {
                    country: market.name,
                    flag: market.code, 
                    price: priceRaw,
                    currency: market.currency
                };
            } catch (err) {
                console.error(`Error en ${market.name}:`, err.message);
                return null;
            }
        });

        const results = await Promise.all(promises);
        const validResults = results.filter(r => r !== null);
        
        res.json(validResults);

    } catch (error) {
        console.error('Error general:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor TRAVPN listo en puerto ${PORT}`));