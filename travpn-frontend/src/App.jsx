import React, { useState, useEffect } from 'react';
import { Search, Plane, MapPin, Globe, Info, X, Hotel, Ship, Shield, CheckCircle, ExternalLink, AlertTriangle, EyeOff, CreditCard, Calendar, Lock, ChevronRight } from 'lucide-react';

// URL DE TU BACKEND
const API_URL_BASE = 'https://travpn-backend-x82z.onrender.com/api'; 

const EXCHANGE_RATES = {
  'EUR': 1.0, 
  'USD': 0.92, 
  'BRL': 0.18, 
  'ARS': 0.0011,
  'INR': 0.011, 
  'TRY': 0.029, 
  'JPY': 0.0062, 
  'MXN': 0.054,
  'CZK': 0.039, // Corona Checa
  'PLN': 0.23,  // Zloty Polaco
  'HUF': 0.0025 // Florín Húngaro
};

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2092&auto=format&fit=crop', 
  'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2066&auto=format&fit=crop',
];

const App = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [tripType, setTripType] = useState('roundtrip'); 
  const [userCurrency, setUserCurrency] = useState('EUR');
  const [userLanguage, setUserLanguage] = useState('ES');
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
      
      const dest = formData.destination; 
      
      // DATOS DEMO: Turquía + Polonia + Brasil + Hungría + España
      const demoData = [
        { 
            country: 'Turquía', flag: 'TR', price: 8500, currency: 'TRY', 
            airline: 'Turkish Airlines', hotelName: `Grand ${dest} Istanbul`, stars: 5, 
            image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=60`,
            type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
        { 
            country: 'Polonia', flag: 'PL', price: 750, currency: 'PLN', 
            airline: 'LOT Polish', hotelName: `${dest} Warsaw Inn`, stars: 3, 
            image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=60`,
            type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
        { 
            country: 'Brasil', flag: 'BR', price: 1500, currency: 'BRL', 
            airline: 'Latam', hotelName: `Hotel ${dest} Plaza`, stars: 4, 
            image: `https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500&q=60`,
            type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
        { 
            country: 'Hungría', flag: 'HU', price: 65000, currency: 'HUF', 
            airline: 'Wizz Air', hotelName: `Grand ${dest} Budapest`, stars: 5, 
            image: `https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=500&q=60`,
            type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
        { 
            country: 'España', flag: 'ES', price: 450, currency: 'EUR', 
            airline: 'Iberia', hotelName: `${dest} City Center`, stars: 3, 
            image: `https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=500&q=60`,
            type: activeTab === 'hotels' ? 'hotel' : 'flight'
        },
      ];
      
      setTimeout(() => { setResults(demoData); setLoading(false); }, 1500);
      return;
    } finally {
        // Nada aquí
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* HEADER */}
      <div className="bg-blue-900 text-white pb-64 relative overflow-hidden transition-all duration-1000">
        <div className="absolute top-4 right-4 z-20 flex gap-3">
            {/* Selector Idioma */}
            <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/20 hover:bg-black/40 transition">
                <Globe className="h-3 w-3 text-slate-300"/>
                <select 
                    value={userLanguage} 
                    onChange={(e) => setUserLanguage(e.target.value)}
                    className="bg-transparent font-bold text-white text-xs outline-none cursor-pointer uppercase"
                >
                    <option value="ES" className="text-slate-900">ES</option>
                    <option value="EN" className="text-slate-900">EN</option>
                    <option value="FR" className="text-slate-900">FR</option>
                    <option value="PT" className="text-slate-900">PT</option>
                </select>
            </div>

            {/* Selector Moneda */}
            <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-2 flex items-center gap-2 border border-white/20 hover:bg-black/40 transition">
                <span className="text-xs text-slate-200 uppercase font-semibold">Moneda:</span>
                <select value={userCurrency} onChange={(e) => setUserCurrency(e.target.value)} className="bg-transparent font-bold text-white outline-none cursor-pointer"><option value="EUR" className="text-slate-900">EUR (€)</option><option value="USD" className="text-slate-900">USD ($)</option></select>
            </div>
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
            
            {activeTab === 'flights' && (
                <div className="md:col-span-12 flex gap-4 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tripType === 'roundtrip' ? 'border-blue-600' : 'border-slate-300'}`}>{tripType === 'roundtrip' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}</div>
                        <input type="radio" name="tripType" value="roundtrip" className="hidden" checked={tripType === 'roundtrip'} onChange={() => setTripType('roundtrip')} />
                        <span className={`font-semibold ${tripType === 'roundtrip' ? 'text-blue-900' : 'text-slate-500 group-hover:text-slate-700'}`}>Ida y vuelta</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${tripType === 'oneway' ? 'border-blue-600' : 'border-slate-300'}`}>{tripType === 'oneway' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}</div>
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

      {/* RESULTADOS O TUTORIAL */}
      {results ? (
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow animate-fade-in-up">
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
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg">VPN: {item.country}</h3>
                                <div className="text-xs text-slate-400 font-medium flex items-center gap-1"><Lock className="w-3 h-3"/> Pagar desde aquí</div>
                            </div>
                        </div>
                    </div>

                    {activeTab === 'hotels' && (
                        <div className="h-40 bg-slate-100 rounded-lg mb-4 overflow-hidden relative">
                            <img src={item.image || `https://source.unsplash.com/800x600/?hotel,${formData.destination}`} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500'} />
                            <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold shadow">{item.stars} ⭐</div>
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
                        {/* BOTÓN TRUCO */}
                        <button onClick={() => { setSelectedDeal(item); setShowTutorial(true); }} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition">
                            <Info className="h-4 w-4" /> Truco
                        </button>
                        <a href={getDealLink()} target="_blank" className="px-4 py-3 rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-200"><ExternalLink className="h-5 w-5" /></a>
                    </div>
                  </div>
                )
              })}
            </div>
        </div>
      ) : (
        /* --- LANDING / TUTORIAL (VISIBLE CUANDO NO HAY RESULTADOS) --- */
        <div className="bg-white py-20 flex-grow">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">¿Cómo funciona la magia?</h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">Es simple: las webs de viajes te cobran más si detectan que tienes dinero. Nosotros te enseñamos a parecer un local.</p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 relative">
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10"></div>
                    {/* Paso 1 */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center group">
                        <div className="w-20 h-20 mx-auto bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform"><Globe className="h-10 w-10" /></div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">1. Escaneo Global</h3>
                        <p className="text-slate-500 leading-relaxed">Rastreamos precios en tiempo real en más de <strong className="text-blue-600">50 países</strong>.</p>
                    </div>
                    {/* Paso 2 */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center group relative top-0 md:-top-6">
                        <div className="w-20 h-20 mx-auto bg-teal-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform"><Shield className="h-10 w-10" /></div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">2. Selección de IP</h3>
                        <p className="text-slate-500 leading-relaxed">Te decimos <strong className="text-teal-600">qué país elegir</strong> para pagar menos impuestos y divisa.</p>
                    </div>
                    {/* Paso 3 */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl text-center group">
                        <div className="w-20 h-20 mx-auto bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform"><CreditCard className="h-10 w-10" /></div>
                        <h3 className="text-xl font-bold mb-3 text-slate-800">3. Ahorro Directo</h3>
                        <p className="text-slate-500 leading-relaxed">Activas tu VPN y compras el billete al <strong className="text-purple-600">precio local</strong>.</p>
                    </div>
                </div>
            </div>
        </div>
      )}
      
      {/* MODAL TUTORIAL COMPLETO */}
      {showTutorial && selectedDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-0 overflow-hidden shadow-2xl animate-fade-in-up max-h-[95vh] overflow-y-auto">
            <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition z-10"><X className="h-5 w-5"/></button>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2"><span className="bg-green-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Ahorro detectado</span><span className="text-slate-400 text-xs">Destino: {formData.destination}</span></div>
                    <h3 className="text-3xl font-bold mb-1">Misión: {selectedDeal.country}</h3>
                    <p className="text-slate-400 text-sm">Sigue estos 3 pasos para desbloquear el precio.</p>
                </div>
            </div>
            <div className="p-8">
                {/* Paso 1: CON TU AFILIADO DE NORDVPN */}
                <div className="flex gap-5 mb-8 relative">
                    <div className="absolute left-6 top-10 bottom-[-20px] w-0.5 bg-slate-100"></div>
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold text-xl flex items-center justify-center border border-blue-100 z-10 shadow-sm">1</div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">Conecta tu VPN</h4>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                            <p className="text-slate-600 text-sm mb-3">Conéctate a un servidor en <strong>{selectedDeal.country}</strong>.</p>
                            
                            {/* TU ENLACE DE NORDVPN AQUÍ */}
                            <a 
                                href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=136277&url_id=902" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center justify-between bg-white border border-blue-200 p-3 rounded-lg hover:shadow-md transition group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white p-1.5 rounded"><Shield className="h-4 w-4"/></div>
                                    <div><p className="font-bold text-slate-900 text-sm">¿No tienes VPN?</p><p className="text-xs text-green-600 font-bold">Oferta: 72% DTO en NordVPN</p></div>
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
                    <div className="flex-grow"><h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">Abre Incógnito</h4><p className="text-slate-600 text-sm mt-1">Usa <strong>Ctrl + Shift + N</strong>. Es vital para limpiar cookies.</p></div>
                </div>
                {/* Paso 3 */}
                <div className="flex gap-5">
                    <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-green-50 text-green-600 font-bold text-xl flex items-center justify-center border border-green-100 z-10 shadow-sm">3</div>
                    <div className="flex-grow">
                        <h4 className="font-bold text-lg text-slate-800 flex items-center gap-2">Paga en local</h4>
                        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mt-2 text-sm text-yellow-800"><p className="font-bold mb-1">⚠️ Importante:</p><p>Paga siempre en <strong>{selectedDeal.currency}</strong>. No dejes que la web convierta a {userCurrency}.</p></div>
                        <a href={getDealLink()} target="_blank" rel="noopener noreferrer" className="w-full mt-4 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2">Ir a la web de compra <ExternalLink className="h-4 w-4"/></a>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;