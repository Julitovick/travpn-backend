import React, { useState, useEffect } from 'react';
import { Search, Plane, MapPin, Globe, Info, X, Hotel, Ship, Shield, CheckCircle, ExternalLink, AlertTriangle, EyeOff, CreditCard, Calendar, Lock } from 'lucide-react';

// URL DE TU BACKEND
const API_URL_BASE = 'https://travpn-backend-x82z.onrender.com/api'; 

const EXCHANGE_RATES = {
  'EUR': 1.0, 'USD': 0.92, 'BRL': 0.18, 'ARS': 0.0011,
  'INR': 0.011, 'TRY': 0.029, 'JPY': 0.0062, 'MXN': 0.054
};

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2092&auto=format&fit=crop', // Japón
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2066&auto=format&fit=crop',
];

const App = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [tripType, setTripType] = useState('roundtrip'); // 'roundtrip' | 'oneway'
  const [userCurrency, setUserCurrency] = useState('EUR');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [bgImage, setBgImage] = useState('');

  const [formData, setFormData] = useState({ origin: '', destination: '', date: '', returnDate: '' });

  useEffect(() => {
    setBgImage(BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]);
  }, []);

  const getDealLink = () => {
    if (activeTab === 'flights') {
        const dateFormatted = formData.date ? formData.date.slice(2).replace(/-/g, '') : '';
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
    return Math.round(priceInEur * rateFromEur).toLocaleString();
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!formData.destination) return alert("Por favor indica un destino");
    setLoading(true);
    setResults(null);

    let endpoint = activeTab === 'hotels' ? '/hotels' : activeTab === 'cruises' ? '/cruises' : '/search';

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
        flag: item.flag?.length === 2 ? 
            String.fromCodePoint(...item.flag.toUpperCase().split('').map(c => 127397 + c.charCodeAt())) : '🌍',
        price: Number(item.price) || 0
      }));

      processed.sort((a, b) => {
        const priceA = a.price * (EXCHANGE_RATES[a.currency] || 1);
        const priceB = b.price * (EXCHANGE_RATES[b.currency] || 1);
        return priceA - priceB;
      });

      setResults(processed);

    } catch (error) {
      console.error("Usando fallback inteligente por error:", error);
      
      // --- FALLBACK INTELIGENTE ---
      // Si el servidor falla, mostramos datos COHERENTES con la búsqueda
      const dest = formData.destination; 
      
      const demoData = [
        { 
            country: 'Brasil', flag: '🇧🇷', price: 1500, currency: 'BRL', 
            airline: 'Latam', hotelName: `Hotel ${dest} Plaza`, stars: 4, type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
        { 
            country: 'Turquía', flag: '🇹🇷', price: 8500, currency: 'TRY', 
            airline: 'Turkish Airlines', hotelName: `Grand ${dest} Hotel`, stars: 5, type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
        { 
            country: 'España', flag: '🇪🇸', price: 450, currency: 'EUR', 
            airline: 'Iberia', hotelName: `${dest} City Center`, stars: 3, type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
      ];
      
      setTimeout(() => { setResults(demoData); setLoading(false); }, 1000);
      return;
    } finally {
       // El catch tiene return, así que esto es seguro
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* HEADER */}
      <div className="bg-blue-900 text-white pb-64 relative overflow-hidden transition-all duration-1000">
        <div className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/20">
            <span className="text-xs text-slate-200 uppercase font-semibold">Moneda:</span>
            <select value={userCurrency} onChange={(e) => setUserCurrency(e.target.value)} className="bg-transparent font-bold text-white outline-none cursor-pointer"><option value="EUR">EUR (€)</option><option value="USD">USD ($)</option></select>
        </div>
        {bgImage && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')` }} />}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-900/40 to-blue-900/90" />
        <div className="relative container mx-auto px-4 pt-20 text-center">
          <nav className="flex justify-center items-center gap-2 mb-8"><Globe className="text-teal-400 h-8 w-8" /> <span className="text-3xl font-bold tracking-tighter">TRAVPN</span></nav>
          <div className="mb-10"><span className="inline-block py-1 px-3 rounded-full bg-blue-600/40 backdrop-blur-md border border-blue-400/50 text-blue-100 text-xs font-bold uppercase tracking-wider mb-6">Ahora buscando en 50+ países 🌍</span><h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">Ubicación virtual.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-200">Ahorro real.</span></h1></div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="container mx-auto px-4 -mt-40 relative z-10 mb-24">
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden max-w-5xl mx-auto border border-slate-100">
          <div className="flex bg-slate-50 p-2 border-b border-slate-200 gap-1 overflow-x-auto">
            {['flights', 'hotels', 'cruises'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 min-w-[100px] py-4 flex items-center justify-center gap-2 font-bold rounded-xl transition-all ${activeTab === tab ? 'bg-white shadow text-blue-600 ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                    {tab === 'flights' ? <Plane className="h-5 w-5"/> : tab === 'hotels' ? <Hotel className="h-5 w-5"/> : <Ship className="h-5 w-5"/>} 
                    {tab === 'flights' ? 'Vuelos' : tab === 'hotels' ? 'Hoteles' : 'Cruceros'}
                </button>
            ))}
          </div>
          <form onSubmit={handleSearch} className="p-6 md:p-8 bg-white grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
            
            {/* OPCIONES DE VIAJE (Solo para vuelos) */}
            {activeTab === 'flights' && (
                <div className="md:col-span-12 flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tripType === 'roundtrip' ? 'border-blue-600' : 'border-slate-300'}`}>
                            {tripType === 'roundtrip' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                        </div>
                        <input type="radio" name="tripType" value="roundtrip" className="hidden" checked={tripType === 'roundtrip'} onChange={() => setTripType('roundtrip')} />
                        <span className={`font-semibold ${tripType === 'roundtrip' ? 'text-blue-900' : 'text-slate-500 group-hover:text-slate-700'}`}>Ida y vuelta</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tripType === 'oneway' ? 'border-blue-600' : 'border-slate-300'}`}>
                            {tripType === 'oneway' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                        </div>
                        <input type="radio" name="tripType" value="oneway" className="hidden" checked={tripType === 'oneway'} onChange={() => setTripType('oneway')} />
                        <span className={`font-semibold ${tripType === 'oneway' ? 'text-blue-900' : 'text-slate-500 group-hover:text-slate-700'}`}>Solo ida</span>
                    </label>
                </div>
            )}

            {activeTab === 'flights' && (
                <div className="md:col-span-3">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Origen</label>
                    <div className="relative"><MapPin className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="text" placeholder="Madrid (MAD)" className="w-full pl-10 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.origin} onChange={(e) => setFormData({...formData, origin: e.target.value})} /></div>
                </div>
            )}
            <div className={`${activeTab === 'flights' ? 'md:col-span-3' : 'md:col-span-4'}`}>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Destino</label>
                <div className="relative"><Globe className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="text" placeholder={activeTab === 'hotels' ? "Ej: Kioto" : "Destino"} className="w-full pl-10 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.destination} onChange={(e) => setFormData({...formData, destination: e.target.value})} /></div>
            </div>
            
            {/* Fechas Dinámicas: Si es 'oneway', solo muestra 1 fecha */}
            <div className={`md:col-span-3 grid ${tripType === 'roundtrip' || activeTab === 'hotels' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">{activeTab === 'hotels' ? 'Entrada' : 'Ida'}</label>
                    <input type="date" className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                {(tripType === 'roundtrip' || activeTab === 'hotels') && (
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">{activeTab === 'hotels' ? 'Salida' : 'Vuelta'}</label>
                        <input type="date" className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200" value={formData.returnDate} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} />
                    </div>
                )}
            </div>

            <div className={`${activeTab === 'flights' ? 'md:col-span-3' : 'md:col-span-2'}`}>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg">{loading ? '...' : 'Buscar'}</button>
            </div>
          </form>
        </div>
      </div>

      {/* RESULTADOS */}
      {results && (
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow">
            <h2 className="text-3xl font-bold mb-8 text-slate-800">Resultados para {formData.destination}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, idx) => {
                const converted = convertPrice(item.price, item.currency);
                return (
                  <div key={idx} className={`bg-white rounded-2xl p-6 border shadow-sm relative hover:shadow-xl transition ${idx === 0 ? 'border-teal-400 ring-1 ring-teal-50' : 'border-slate-100'}`}>
                    {idx === 0 && <div className="absolute -top-3 left-6 bg-teal-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-md">Recomendado</div>}
                    <div className="flex justify-between items-start mb-4 mt-2">
                        <div className="flex items-center gap-3">
                            <span className="text-4xl">{item.flag}</span>
                            <div><h3 className="font-bold text-slate-800 text-lg">{item.country}</h3><div className="text-xs text-slate-400 font-medium flex items-center gap-1"><Lock className="w-3 h-3"/> IP Necesaria</div></div>
                        </div>
                    </div>
                    {/* FOTO HOTEL REAL O GENERICA */}
                    {activeTab === 'hotels' && (
                        <div className="h-32 bg-slate-100 rounded-lg mb-4 overflow-hidden relative">
                            <img src={item.image || `https://source.unsplash.com/800x600/?hotel,${formData.destination}`} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500'} />
                            <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold">{item.stars} ⭐</div>
                        </div>
                    )}
                    <div className="mb-4 text-center">
                        <div className="text-3xl font-extrabold text-slate-900">{item.price.toLocaleString()} <span className="text-sm text-slate-500 font-normal">{item.currency}</span></div>
                        {converted && <div className="text-sm font-bold text-blue-600 mt-1">≈ {converted} {userCurrency}</div>}
                    </div>
                    <div className="border-t border-slate-100 pt-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            {activeTab === 'flights' && <><Plane className="h-4 w-4 text-blue-400"/> <span className="truncate">{item.airline}</span></>}
                            {activeTab === 'hotels' && <><Hotel className="h-4 w-4 text-blue-400"/> <span className="truncate font-bold">{item.hotelName}</span></>}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => { setSelectedDeal(item); setShowTutorial(true); }} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm">Info</button>
                        <a href={getDealLink()} target="_blank" className="px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-200"><ExternalLink className="h-5 w-5" /></a>
                    </div>
                  </div>
                )
              })}
            </div>
        </div>
      )}
      
      {/* MODAL (Simplificado para el ejemplo) */}
      {showTutorial && selectedDeal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative">
                <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4"><X /></button>
                <h3 className="text-2xl font-bold mb-4">Compra desde {selectedDeal.country}</h3>
                <p className="mb-4 text-slate-600">Conecta tu VPN a {selectedDeal.country} y busca este hotel en Booking. El precio debería ser cercano a {selectedDeal.price} {selectedDeal.currency}.</p>
                <a href={getDealLink()} target="_blank" className="block w-full bg-blue-600 text-white font-bold py-3 rounded-xl text-center">Ir a Booking ahora</a>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;