import React, { useState, useEffect } from 'react';
import { Search, Plane, MapPin, Globe, Info, X, Hotel, Ship, Shield, CheckCircle, ExternalLink, AlertTriangle, EyeOff, CreditCard, ChevronRight, Lock } from 'lucide-react';

// URL DE TU BACKEND (Asegúrate de que es la de Render)
const API_URL_BASE = 'https://travpn-backend-x82z.onrender.com/api'; 

const EXCHANGE_RATES = {
  'EUR': 1.0, 'USD': 0.92, 'BRL': 0.18, 'ARS': 0.0011,
  'INR': 0.011, 'TRY': 0.029, 'JPY': 0.0062, 'MXN': 0.054
};

// --- LISTA DE IMÁGENES DE FONDO ---
const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop', // Suiza
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop', // París
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2038&auto=format&fit=crop', // Bali
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2070&auto=format&fit=crop', // Maldivas
  'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2092&auto=format&fit=crop', // Japón
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2066&auto=format&fit=crop', // Italia
  'https://images.unsplash.com/photo-1512453979798-5ea904ac6666?q=80&w=2070&auto=format&fit=crop', // Dubai
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073&auto=format&fit=crop', // Tailandia
  'https://images.unsplash.com/photo-1499856871940-a09627c6dcf6?q=80&w=2020&auto=format&fit=crop', // Nueva York
];

const App = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [userCurrency, setUserCurrency] = useState('EUR');
  
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [bgImage, setBgImage] = useState('');

  const [formData, setFormData] = useState({
    origin: '', destination: '', date: '', returnDate: ''
  });

  // Efecto para elegir imagen al azar al cargar
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * BACKGROUND_IMAGES.length);
    setBgImage(BACKGROUND_IMAGES[randomIndex]);
  }, []);

  const getDealLink = () => {
    if (activeTab === 'flights') {
        const dateFormatted = formData.date.slice(2).replace(/-/g, ''); 
        return `https://www.skyscanner.es/transport/flights/${formData.origin}/${formData.destination}/${dateFormatted}`;
    } else if (activeTab === 'hotels') {
        return `https://www.booking.com/searchresults.html?ss=${formData.destination}`;
    } else {
        return `https://www.cruisecritic.com/search?q=${formData.destination}`;
    }
  };

  const convertPrice = (price, fromCurrency) => {
    if (fromCurrency === userCurrency) return null;
    const rateToEur = EXCHANGE_RATES[fromCurrency] || 1;
    const priceInEur = price * rateToEur;
    const rateFromEur = 1 / (EXCHANGE_RATES[userCurrency] || 1);
    const finalPrice = priceInEur * rateFromEur;
    return Math.round(finalPrice).toLocaleString();
  };

  const getFlagEmoji = (countryCode) => {
    if (!countryCode) return '🌍';
    const codePoints = countryCode.toUpperCase().split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.destination) return alert("Por favor indica un destino");

    setLoading(true);
    setResults(null);

    let endpoint = '/search';
    if (activeTab === 'hotels') endpoint = '/hotels';
    if (activeTab === 'cruises') endpoint = '/cruises';

    try {
      const response = await fetch(`${API_URL_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Error servidor');
      const data = await response.json();
      
      const processed = data.map(item => ({
        ...item,
        flag: item.flag?.length === 2 ? getFlagEmoji(item.flag) : '🌍',
        price: Number(item.price) || 0
      }));

      processed.sort((a, b) => {
        const priceA = a.price * (EXCHANGE_RATES[a.currency] || 1);
        const priceB = b.price * (EXCHANGE_RATES[b.currency] || 1);
        return priceA - priceB;
      });

      setResults(processed);

    } catch (error) {
      console.error(error);
      // Fallback para demo si falla el backend
      setResults([
        { country: 'Brasil', flag: '🇧🇷', price: 1500, currency: 'BRL', airline: 'Latam', hotelName: 'Rio Palace', cruiseLine: 'MSC Brazil' },
        { country: 'Turquía', flag: '🇹🇷', price: 8500, currency: 'TRY', airline: 'Turkish Airlines', hotelName: 'Grand Istanbul', cruiseLine: 'Bosphorus Lines' },
        { country: 'España', flag: '🇪🇸', price: 450, currency: 'EUR', airline: 'Iberia', hotelName: 'Madrid Central', cruiseLine: 'Costa Cruceros' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      
      {/* --- HEADER CON FONDO DINÁMICO --- */}
      <div className="bg-blue-900 text-white pb-48 relative overflow-hidden transition-all duration-1000">
        
        {/* Selector de Moneda */}
        <div className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/20 hover:bg-black/40 transition">
            <span className="text-xs text-slate-200 uppercase font-semibold">Moneda:</span>
            <select 
                value={userCurrency} 
                onChange={(e) => setUserCurrency(e.target.value)}
                className="bg-transparent font-bold text-white outline-none cursor-pointer"
            >
                <option value="EUR" className="text-slate-900">EUR (€)</option>
                <option value="USD" className="text-slate-900">USD ($)</option>
                <option value="GBP" className="text-slate-900">GBP (£)</option>
            </select>
        </div>

        {/* Imagen de Fondo Dinámica */}
        {bgImage && (
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out"
                style={{ backgroundImage: `url('${bgImage}')` }}
            />
        )}
        
        {/* Overlay degradado */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-900/40 to-blue-900/90" />

        <div className="relative container mx-auto px-4 pt-10">
          <nav className="flex items-center gap-2 mb-12">
            <Globe className="text-teal-400 h-8 w-8 drop-shadow-md" /> 
            <span className="text-2xl font-bold tracking-tighter drop-shadow-md">TRAVPN</span>
          </nav>

          <div className="text-center mb-10">
            <span className="inline-block py-1 px-3 rounded-full bg-blue-600/30 backdrop-blur-sm border border-blue-400/50 text-blue-100 text-xs font-bold uppercase tracking-wider mb-4 shadow-lg">
              Ahora buscando en 50+ países 🌍
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-lg">
              Ubicación virtual.<br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-200">Ahorro real.</span>
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto font-light drop-shadow-md">
              Las aerolíneas cambian los precios según tu ubicación. Nosotros te decimos desde dónde conectarte para pagar menos.
            </p>
          </div>
        </div>
      </div>

      {/* --- BUSCADOR --- */}
      <div className="container mx-auto px-4 -mt-32 relative z-10 mb-24">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl mx-auto border border-slate-100">
          
          <div className="flex bg-slate-50 p-2 border-b border-slate-200 gap-1">
            <button onClick={() => setActiveTab('flights')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${activeTab === 'flights' ? 'bg-white shadow text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}><Plane className="h-5 w-5" /> Vuelos</button>
            <button onClick={() => setActiveTab('hotels')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${activeTab === 'hotels' ? 'bg-white shadow text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}><Hotel className="h-5 w-5" /> Hoteles</button>
            <button onClick={() => setActiveTab('cruises')} className={`flex-1 py-4 flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${activeTab === 'cruises' ? 'bg-white shadow text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}><Ship className="h-5 w-5" /> Cruceros</button>
          </div>

          <form onSubmit={handleSearch} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-white">
            {activeTab === 'flights' && (
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Origen</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                        <input type="text" placeholder="Madrid (MAD)" className="w-full pl-10 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={formData.origin} onChange={(e) => setFormData({...formData, origin: e.target.value})} />
                    </div>
                </div>
            )}
            <div className={`${activeTab === 'flights' ? 'md:col-span-3' : 'md:col-span-6'}`}>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Destino</label>
                <div className="relative">
                    <Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" />
                    <input type="text" placeholder={activeTab === 'hotels' ? "París, Centro" : "Tokio (HND)"} className="w-full pl-10 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} />
                </div>
            </div>
            <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Fecha</label>
                <input type="date" className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 font-medium" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="md:col-span-3">
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-blue-200 active:scale-95">
                {loading ? <span className="animate-spin">⌛</span> : <><Search className="h-5 w-5" /> Buscar Ahorro</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* --- RESULTADOS --- */}
      {results ? (
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow animate-fade-in-up">
            <h2 className="text-3xl font-bold mb-8 text-slate-800 flex items-center gap-3">
                Precios encontrados en {results.length} países
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, idx) => {
                const converted = convertPrice(item.price, item.currency);
                return (
                  <div key={idx} className={`bg-white rounded-2xl p-6 border transition hover:shadow-xl hover:-translate-y-1 duration-300 relative group flex flex-col ${idx === 0 ? 'border-teal-400 shadow-lg ring-1 ring-teal-50' : 'border-slate-100 shadow-sm'}`}>
                    {idx === 0 && <div className="absolute -top-3 left-6 bg-teal-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-md z-10">Mejor Precio Detectado</div>}
                    
                    <div className="flex justify-between items-start mb-4 mt-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl shadow-sm rounded-full bg-slate-50 w-12 h-12 flex items-center justify-center">{item.flag}</span>
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg leading-tight">{item.country}</h3>
                                <div className="text-xs text-slate-400 font-medium flex items-center gap-1"><Lock className="w-3 h-3"/> IP Necesaria</div>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <div className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            {item.price.toLocaleString()} <span className="text-sm text-slate-500 font-normal">{item.currency}</span>
                        </div>
                        {converted && (
                            <div className="text-sm font-bold text-blue-600 mt-1 flex items-center justify-center gap-1 bg-blue-100/50 py-1 rounded">
                                ≈ {converted} {userCurrency}
                            </div>
                        )}
                    </div>

                    <div className="flex-grow">
                        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4 border-t border-slate-50 pt-4">
                            {activeTab === 'flights' && <><Plane className="h-4 w-4 text-blue-400 flex-shrink-0"/> <span className="truncate">{item.airline}</span></>}
                            {activeTab === 'hotels' && <><Hotel className="h-4 w-4 text-blue-400 flex-shrink-0"/> <span className="truncate">{item.hotelName}</span></>}
                            {activeTab === 'cruises' && <><Ship className="h-4 w-4 text-blue-400 flex-shrink-0"/> <span className="truncate">{item.cruiseLine}</span></>}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => { setSelectedDeal(item); setShowTutorial(true); }} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition text-sm flex items-center justify-center gap-2">
                            <Info className="h-4 w-4" /> Truco
                        </button>
                        <a 
                            href={getDealLink()} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition border border-blue-200 flex items-center justify-center"
                            title="Ir a web de compra"
                        >
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    </div>
                  </div>
                )
              })}
            </div>
        </div>
      ) : (
        /* --- LANDING EXPLICATIVA --- */
        <div className="bg-white py-20 flex-grow">
            <div className="container mx-auto px-4 max-w-6xl">
                
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">¿Cómo funciona la magia?</h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        Es simple: las webs de viajes te cobran más si detectan que tienes dinero. Nosotros te enseñamos a parecer un local.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10"></div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow text-center group">
                        <div className="w-20 h-20 mx-auto bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                            <Globe className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">1. Escaneo Global</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Nuestro algoritmo rastrea precios en tiempo real en más de <strong className="text-blue-600">50 países</strong> simultáneamente.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow text-center group relative top-0 md:-top-6">
                        <div className="w-20 h-20 mx-auto bg-teal-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform">
                            <Shield className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">2. Selección de IP</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Detectamos dónde está más barata la moneda o dónde hay menos impuestos y te decimos <strong className="text-teal-600">qué país elegir</strong>.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition-shadow text-center group">
                        <div className="w-20 h-20 mx-auto bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform">
                            <CreditCard className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">3. Ahorro Directo</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Activas tu VPN, entras en modo incógnito y compras el billete al <strong className="text-purple-600">precio local</strong> sin comisiones extra.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL TUTORIAL CON AFILIACIÓN --- */}
      {showTutorial && selectedDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-0 overflow-hidden shadow-2xl animate-fade-in-up max-h-[95vh] overflow-y-auto">
            
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10"><Globe className="w-32 h-32" /></div>
                <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition z-10"><X className="h-5 w-5"/></button>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="bg-green-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Ahorro detectado</span>
                        <span className="text-slate-400 text-xs">Vuelo a {formData.destination}</span>
                    </div>
                    <h3 className="text-3xl font-bold mb-1">Misión: {selectedDeal.country}</h3>
                    <p className="text-slate-400 text-sm">Sigue estos 3 pasos para desbloquear el precio.</p>
                </div>
            </div>

            <div className="p-8">
                {/* Paso 1: CON AFILIACIÓN INTEGRADA */}
                <div className="flex gap-5 mb-8 relative">
                    <div className="absolute left-6 top-10 bottom-[-20px] w-0.5 bg-slate-100"></div>
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold text-xl flex items-center justify-center border border-blue-100 z-10 shadow-sm">1</div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">Conecta tu VPN</h4>
                        
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                            <p className="text-slate-600 text-sm mb-3">Conéctate a un servidor en <strong>{selectedDeal.country}</strong>.</p>
                            
                            {/* CAJA DE AFILIADO - MODIFICA ESTE LINK */}
                            <a 
                                href="https://surfshark.club/friend" 
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between bg-white border border-blue-200 p-3 rounded-lg hover:shadow-md transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white p-1.5 rounded">
                                        <Shield className="h-4 w-4"/>
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900 text-sm">¿No tienes VPN?</p>
                                        <p className="text-xs text-green-600 font-bold">Oferta: 82% DTO + Meses Gratis</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600"/>
                            </a>
                        </div>
                    </div>
                </div>

                {/* Paso 2 */}
                <div className="flex gap-5 mb-8 relative">
                    <div className="absolute left-6 top-10 bottom-[-20px] w-0.5 bg-slate-100"></div>
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 font-bold text-xl flex items-center justify-center border border-purple-100 z-10 shadow-sm">2</div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">Abre Incógnito</h4>
                        <p className="text-slate-600 text-sm mt-1">Usa <strong>Ctrl + Shift + N</strong>. Es vital para limpiar cookies.</p>
                    </div>
                </div>

                {/* Paso 3 */}
                <div className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-green-50 text-green-600 font-bold text-xl flex items-center justify-center border border-green-100 z-10 shadow-sm">3</div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">Paga en local</h4>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mt-2 text-sm text-yellow-800">
                            <p className="font-bold mb-1">⚠️ Importante:</p>
                            <p>Paga siempre en <strong>{selectedDeal.currency}</strong>. No dejes que la web convierta a {userCurrency}.</p>
                        </div>
                        <a href={getDealLink()} target="_blank" rel="noopener noreferrer" className="w-full mt-4 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                            Ir a la web de compra <ExternalLink className="h-4 w-4"/>
                        </a>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* --- FOOTER --- */}
      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm mt-auto">
        <p>© 2024 TRAVPN.com - Comparador de precios global.</p>
      </footer>

    </div>
  );
};

export default App;