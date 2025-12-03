import React, { useState, useEffect, useRef } from 'react';
import { Search, Plane, MapPin, Globe, Info, X, Hotel, Ship, Shield, ExternalLink, Lock, Users, ChevronDown, Plus, Minus, ChevronRight, TrendingUp, CreditCard, AlertTriangle, Calendar, Check, Share2, Mail, HelpCircle, FileText } from 'lucide-react';

const API_URL_BASE = 'https://travpn-backend-x82z.onrender.com/api'; 

const EXCHANGE_RATES = {
  'EUR': 1.0, 'USD': 0.92, 'BRL': 0.18, 'ARS': 0.0011, 'INR': 0.011, 'TRY': 0.029, 
  'JPY': 0.0062, 'MXN': 0.054, 'CZK': 0.039, 'PLN': 0.23, 'HUF': 0.0025,
  'COP': 0.00024, 'CLP': 0.0010, 'PEN': 0.25, 'IDR': 0.000060, 'THB': 0.026, 
  'VND': 0.000038, 'EGP': 0.020, 'ZAR': 0.050, 'MYR': 0.20, 'RON': 0.20, 'BGN': 0.51
};

// --- DATOS PSICOLÓGICOS (LIVE TICKER) ---
const LIVE_SAVINGS = [
  { user: "Laura (Madrid)", action: "ahorró 320€ en vuelo a Bali 🇮🇩", time: "hace 2 min" },
  { user: "Carlos (BCN)", action: "pagó 40% menos en hotel NYC 🇺🇸", time: "hace 5 min" },
  { user: "Ana (Valencia)", action: "encontró vuelo a Tokio por 550€ 🇯🇵", time: "hace 1 min" },
  { user: "David (Sevilla)", action: "ahorró 150€ usando IP Turquía 🇹🇷", time: "hace 12 min" },
  { user: "Elena (Bilbao)", action: "consiguió hotel 5★ a precio de 3★", time: "hace 8 min" }
];

// --- TRADUCCIONES COMPLETAS ---
const TRANSLATIONS = {
  ES: {
    searching_badge: "Buscando en 50+ países reales 🌍",
    hero_title_1: "Ubicación virtual.", hero_title_2: "Ahorro real.",
    hero_subtitle: "Las aerolíneas cambian los precios según tu ubicación. Nosotros te decimos desde dónde conectarte para pagar menos.",
    tab_flights: "Vuelos", tab_hotels: "Hoteles", tab_cruises: "Cruceros",
    label_roundtrip: "Ida y vuelta", label_oneway: "Solo ida", label_direct: "Solo vuelos directos",
    label_origin: "Origen", label_destination: "Destino",
    label_date_start: "Ida", label_date_end: "Vuelta",
    label_checkin: "Entrada", label_checkout: "Salida",
    label_passengers: "Pasajeros", label_guests: "Huéspedes",
    btn_search: "Buscar Ahorro Real", btn_loading: "Buscando en tiempo real...",
    error_no_results: "No se encontraron resultados reales. Intenta otra fecha.",
    error_server: "El servidor no responde. Verifica tu conexión.",
    result_title: "Resultados para", result_best_option: "Mejor Opción",
    result_vpn: "VPN:", result_pay_here: "Pagar desde aquí", result_trick: "Truco",
    magic_title: "¿Cómo funciona la magia?",
    magic_subtitle: "Es simple: las webs de viajes te cobran más si detectan que tienes dinero. Nosotros te enseñamos a parecer un local.",
    step_1_title: "1. Escaneo Global", step_1_desc: "Rastreamos precios en tiempo real en más de 50 países.",
    step_2_title: "2. Selección de IP", step_2_desc: "Te decimos qué país elegir para pagar menos impuestos.",
    step_3_title: "3. Ahorro Directo", step_3_desc: "Activas tu VPN y compras al precio local.",
    legality_title: "¿Es legal hacer esto?",
    legality_subtitle: "Absolutamente. Estás ejerciendo tu derecho como consumidor digital.",
    legal_point_1_title: "Discriminación de Precios", legal_point_1_desc: "Las empresas te cobran más solo por vivir en un país con mayor poder adquisitivo. Usar una VPN solo nivela el terreno de juego.",
    legal_point_2_title: "Mercado Libre Global", legal_point_2_desc: "Estás comprando un producto digital (un billete). Tienes derecho a buscar la mejor oferta disponible en internet, sin importar la frontera virtual.",
    newsletter_title: "Únete al Club de Hackers 🕵️‍♂️",
    newsletter_subtitle: "Recibe alertas de errores de precio y trucos semanales en tu email.",
    newsletter_placeholder: "Tu mejor email...", newsletter_btn: "Unirme Gratis",
    modal_title: "Misión:", modal_subtitle: "Sigue estos 3 pasos para desbloquear el precio.",
    modal_step_1: "Conecta tu VPN", modal_step_1_desc: "Conéctate a un servidor en",
    modal_vpn_offer: "¿No tienes VPN?", modal_vpn_deal: "Oferta: 72% DTO en NordVPN",
    modal_step_2: "Abre Incógnito", modal_step_2_desc: "Usa Ctrl + Shift + N. Vital para limpiar cookies.",
    modal_step_3: "Paga en local",
    modal_warning: "⚠️ Importante:", modal_warning_desc: "Paga siempre en moneda local. No dejes que la web convierta.",
    modal_btn_go: "Ir a la web de compra",
    adults: "Adultos", children: "Niños", infants: "Bebés",
    traveler: "Viajero", travelers: "Viajeros", guest: "Huésped", guests: "Huéspedes",
    age_adult: "12+ años", age_child: "2-11 años", age_infant: "< 2 años",
    footer_text: "TRAVPN © 2024 - El comparador inteligente.",
    share_text: "¡Mira este precio! Viajando con VPN desde"
  },
  EN: {
    searching_badge: "Searching in 50+ real countries 🌍",
    hero_title_1: "Virtual location.", hero_title_2: "Real savings.",
    hero_subtitle: "Airlines change prices based on location. We tell you where to connect to pay less.",
    tab_flights: "Flights", tab_hotels: "Hotels", tab_cruises: "Cruises",
    label_roundtrip: "Roundtrip", label_oneway: "One way", label_direct: "Direct flights only",
    label_origin: "Origin", label_destination: "Destination",
    label_date_start: "Depart", label_date_end: "Return",
    label_checkin: "Check-in", label_checkout: "Check-out",
    label_passengers: "Passengers", label_guests: "Guests",
    btn_search: "Search Real Savings", btn_loading: "Searching real time...",
    error_no_results: "No results found. Try different dates.",
    error_server: "Server not responding.",
    result_title: "Results for", result_best_option: "Best Option",
    result_vpn: "VPN:", result_pay_here: "Pay from here", result_trick: "Trick",
    magic_title: "How it works?", magic_subtitle: "Travel sites charge more if they detect money. Look like a local.",
    step_1_title: "1. Global Scan", step_1_desc: "We track real-time prices in 50+ countries.",
    step_2_title: "2. IP Selection", step_2_desc: "We tell you which country to choose.",
    step_3_title: "3. Direct Savings", step_3_desc: "Use VPN and buy at local price.",
    legality_title: "Is this legal?", legality_subtitle: "Absolutely. You are exercising your rights as a digital consumer.",
    legal_point_1_title: "Price Discrimination", legal_point_1_desc: "Companies charge you more just for living in a richer country. Using a VPN just levels the playing field.",
    legal_point_2_title: "Global Free Market", legal_point_2_desc: "You are buying a digital product. You have the right to seek the best offer available on the internet.",
    newsletter_title: "Join the Hacker Club 🕵️‍♂️",
    newsletter_subtitle: "Get price error alerts and weekly tricks in your email.",
    newsletter_placeholder: "Your best email...", newsletter_btn: "Join Free",
    modal_title: "Mission:", modal_subtitle: "Follow these 3 steps.",
    modal_step_1: "Connect VPN", modal_step_1_desc: "Connect to server in",
    modal_vpn_offer: "No VPN?", modal_vpn_deal: "Deal: 72% OFF NordVPN",
    modal_step_2: "Incognito Mode", modal_step_2_desc: "Use Ctrl + Shift + N.",
    modal_step_3: "Pay Local",
    modal_warning: "⚠️ Important:", modal_warning_desc: "Always pay in local currency.",
    modal_btn_go: "Go to booking site",
    adults: "Adults", children: "Children", infants: "Infants",
    traveler: "Traveler", travelers: "Travelers", guest: "Guest", guests: "Guests",
    age_adult: "12+ years", age_child: "2-11 years", age_infant: "< 2 years",
    footer_text: "TRAVPN © 2024 - Smart comparator.",
    share_text: "Check this price! Traveling with VPN from"
  },
  // ... (Otros idiomas simplificados para brevedad, se asume que están)
};

// --- BASE DE DATOS AEROPUERTOS (Abreviada para el ejemplo, usa la completa anterior) ---
const AIRPORTS = [
  {city:"Madrid Barajas",code:"MAD",country:"España"},{city:"Barcelona El Prat",code:"BCN",country:"España"},
  {city:"Palma de Mallorca",code:"PMI",country:"España"},{city:"Málaga Costa del Sol",code:"AGP",country:"España"},
  {city:"Londres Heathrow",code:"LHR",country:"Reino Unido"},{city:"París CDG",code:"CDG",country:"Francia"},
  {city:"Nueva York JFK",code:"JFK",country:"EE.UU."},{city:"Tokio Haneda",code:"HND",country:"Japón"},
  {city:"Estambul",code:"IST",country:"Turquía"},{city:"Buenos Aires",code:"EZE",country:"Argentina"}
  // ... (Añade aquí el resto de la lista masiva anterior)
];

const BACKGROUND_IMAGES = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=2073',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=2038',
  'https://images.unsplash.com/photo-1528164344705-47542687000d?q=80&w=2092'
];

const LANGUAGES = [
    { code: 'ES', label: 'Español', flagUrl: 'https://flagcdn.com/w40/es.png' },
    { code: 'EN', label: 'English', flagUrl: 'https://flagcdn.com/w40/gb.png' },
    { code: 'FR', label: 'Français', flagUrl: 'https://flagcdn.com/w40/fr.png' },
    { code: 'IT', label: 'Italiano', flagUrl: 'https://flagcdn.com/w40/it.png' },
    { code: 'DE', label: 'Deutsch', flagUrl: 'https://flagcdn.com/w40/de.png' }
];

const CURRENCIES = [
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'USD', symbol: '$', label: 'Dólar' }
];

const App = () => {
  const [activeTab, setActiveTab] = useState('flights');
  const [tripType, setTripType] = useState('roundtrip'); 
  const [userCurrency, setUserCurrency] = useState('EUR');
  const [userLanguage, setUserLanguage] = useState('ES');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [bgImage, setBgImage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Ticker de ahorro
  const [savingsIndex, setSavingsIndex] = useState(0);

  // Estados menús
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isCurrencyMenuOpen, setIsCurrencyMenuOpen] = useState(false);
  const [isPassengerMenuOpen, setIsPassengerMenuOpen] = useState(false);
  
  const langMenuRef = useRef(null);
  const currencyMenuRef = useRef(null);
  const passengerMenuRef = useRef(null);
  const [suggestions, setSuggestions] = useState({ origin: [], destination: [] });
  const [showSuggestions, setShowSuggestions] = useState({ origin: false, destination: false });

  const [formData, setFormData] = useState({ 
    origin: '', destination: '', date: '', returnDate: '',
    passengers: { adults: 1, children: 0, infants: 0 }, 
    guests: { adults: 2, children: 0 },
    directFlights: false 
  });

  const t = (key) => TRANSLATIONS[userLanguage]?.[key] || TRANSLATIONS['ES'][key];

  useEffect(() => {
    setBgImage(BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)]);
    const tickerInterval = setInterval(() => {
        setSavingsIndex(prev => (prev + 1) % LIVE_SAVINGS.length);
    }, 4000);

    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) setIsLangMenuOpen(false);
      if (currencyMenuRef.current && !currencyMenuRef.current.contains(event.target)) setIsCurrencyMenuOpen(false);
      if (passengerMenuRef.current && !passengerMenuRef.current.contains(event.target)) setIsPassengerMenuOpen(false);
      if (!event.target.closest('.suggestion-box')) setShowSuggestions({ origin: false, destination: false });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        clearInterval(tickerInterval);
    };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (value.length > 1) {
      const filtered = AIRPORTS.filter(airport => 
        airport.city.toLowerCase().includes(value.toLowerCase()) || 
        airport.code.toLowerCase().includes(value.toLowerCase()) ||
        airport.country.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(prev => ({ ...prev, [field]: filtered.slice(0, 5) }));
      setShowSuggestions(prev => ({ ...prev, [field]: true }));
    } else {
      setShowSuggestions(prev => ({ ...prev, [field]: false }));
    }
  };

  const selectSuggestion = (field, airport) => {
    setFormData(prev => ({ ...prev, [field]: `${airport.city} (${airport.code})` }));
    setShowSuggestions(prev => ({ ...prev, [field]: false }));
  };

  const updateCount = (type, category, delta) => {
    setFormData(prev => {
        const current = type === 'flight' ? prev.passengers[category] : prev.guests[category];
        const newValue = Math.max(0, current + delta);
        if (category === 'adults' && newValue < 1) return prev;
        if (type === 'flight') return { ...prev, passengers: { ...prev.passengers, [category]: newValue } };
        else return { ...prev, guests: { ...prev.guests, [category]: newValue } };
    });
  };

  const getTotalTravelers = () => {
      if (activeTab === 'flights') {
          const { adults, children, infants } = formData.passengers;
          const count = adults + children + infants;
          return `${count} ${count !== 1 ? t('travelers') : t('traveler')}`;
      } else {
          const { adults, children } = formData.guests;
          const count = adults + children;
          return `${count} ${count !== 1 ? t('guests') : t('guest')}`;
      }
  };

  const getDealLink = () => {
    const originCode = formData.origin.match(/\(([^)]+)\)/)?.[1] || formData.origin;
    const destCode = formData.destination.match(/\(([^)]+)\)/)?.[1] || formData.destination;
    if (activeTab === 'flights') {
        const dateFormatted = formData.date ? formData.date.slice(2).replace(/-/g, '') : '';
        return `https://www.skyscanner.es/transport/flights/${originCode}/${destCode}/${dateFormatted}${formData.directFlights ? '?prefer_directs=true' : ''}`;
    } else if (activeTab === 'hotels') return `https://www.booking.com/searchresults.html?ss=${formData.destination}`;
    else return `https://www.cruisecritic.com/search?q=${formData.destination}`;
  };

  const convertPrice = (price, fromCurrency) => {
    if (fromCurrency === userCurrency) return null;
    const rateToEur = EXCHANGE_RATES[fromCurrency] || 1;
    const priceInEur = price * rateToEur;
    const rateFromEur = 1 / (EXCHANGE_RATES[userCurrency] || 1);
    return Math.round(priceInEur * rateFromEur).toLocaleString();
  };

  const handleShare = (item) => {
      const text = `${t('share_text')} ${item.country} (${item.flag}) ✈️ ${item.price.toLocaleString()} ${item.currency}. TRAVPN.com`;
      if (navigator.share) {
          navigator.share({ title: 'Ahorro TRAVPN', text: text, url: 'https://travpn.com' });
      } else {
          navigator.clipboard.writeText(text + ' https://travpn.com');
          alert('Enlace copiado!');
      }
  };

  const handleSubscribe = (e) => {
      e.preventDefault();
      if(email) setIsSubscribed(true);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (API_URL_BASE.includes('PON_AQUI')) return alert("Configura la URL del servidor en App.jsx");
    if (!formData.destination) return alert(t('error_no_results'));
    
    setLoading(true);
    setResults(null);
    setErrorMsg(null);
    setIsPassengerMenuOpen(false);
    setShowSuggestions({ origin: false, destination: false });

    const cleanOrigin = formData.origin.match(/\(([^)]+)\)/)?.[1] || formData.origin;
    const cleanDest = formData.destination.match(/\(([^)]+)\)/)?.[1] || formData.destination;
    const payload = { ...formData, origin: cleanOrigin, destination: cleanDest };
    let endpoint = activeTab === 'hotels' ? '/hotels' : activeTab === 'cruises' ? '/cruises' : '/search';

    try {
      const response = await fetch(`${API_URL_BASE}${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Error de conexión con el servidor');
      const data = await response.json();
      
      if (!data || data.length === 0) {
          setErrorMsg(t('error_no_results'));
      } else {
          const processed = data.map(item => ({
            ...item,
            flag: item.flag?.length === 2 ? String.fromCodePoint(...item.flag.toUpperCase().split('').map(c => 127397 + c.charCodeAt())) : '🌍',
            price: Number(item.price) || 0
          }));
          
          processed.sort((a, b) => {
            const priceA = a.price * (EXCHANGE_RATES[a.currency] || 1);
            const priceB = b.price * (EXCHANGE_RATES[b.currency] || 1);
            return priceA - priceB;
          });
          setResults(processed);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(t('error_server'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800 flex flex-col">
      {/* HEADER */}
      <div className="bg-blue-900 text-white pb-32 md:pb-64 relative overflow-hidden transition-all duration-1000">
        
        {/* TOP BAR */}
        <div className="absolute top-4 right-4 z-20 flex gap-2 md:gap-3 items-center">
            <div className="relative" ref={langMenuRef}>
                <button onClick={() => setIsLangMenuOpen(!isLangMenuOpen)} className="flex items-center gap-1 md:gap-2 bg-white/10 backdrop-blur-md px-2 py-1.5 md:px-3 md:py-2 rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition text-white">
                    <img src={LANGUAGES.find(l => l.code === userLanguage)?.flagUrl} alt="flag" className="w-4 h-auto md:w-5 rounded-sm" />
                    <span className="text-[10px] md:text-sm font-bold">{userLanguage}</span>
                    <ChevronDown className="h-3 w-3 text-white/70"/>
                </button>
                {isLangMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up z-50 text-slate-800">
                        {LANGUAGES.map((lang) => (
                            <button key={lang.code} onClick={() => { setUserLanguage(lang.code); setIsLangMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 transition text-slate-700 border-b border-slate-50 last:border-0">
                                <img src={lang.flagUrl} alt={lang.label} className="w-5 h-auto rounded-sm shadow-sm"/>
                                <span className="text-sm font-medium">{lang.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            <div className="relative" ref={currencyMenuRef}>
                <button onClick={() => setIsCurrencyMenuOpen(!isCurrencyMenuOpen)} className="flex items-center gap-1 md:gap-2 bg-white/10 backdrop-blur-md px-2 py-1.5 md:px-3 md:py-2 rounded-lg border border-white/20 cursor-pointer hover:bg-white/20 transition text-white">
                    <span className="text-[10px] md:text-sm font-bold text-teal-400">{CURRENCIES.find(c => c.code === userCurrency)?.symbol}</span>
                    <span className="text-[10px] md:text-sm font-bold">{userCurrency}</span>
                    <ChevronDown className="h-3 w-3 text-white/70"/>
                </button>
                {isCurrencyMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-fade-in-up z-50 text-slate-800">
                        {CURRENCIES.map((curr) => (
                            <button key={curr.code} onClick={() => { setUserCurrency(curr.code); setIsCurrencyMenuOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-blue-50 flex items-center gap-3 transition text-slate-700 border-b border-slate-50 last:border-0">
                                <span className="text-sm font-bold text-blue-600 w-5 text-center">{curr.symbol}</span>
                                <span className="text-sm font-medium">{curr.code}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>

        {/* LIVE TICKER */}
        <div className="absolute top-16 md:top-24 left-0 right-0 z-10 flex justify-center px-4 pointer-events-none">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 md:px-4 md:py-2 flex items-center gap-2 shadow-lg animate-fade-in-up w-auto max-w-full">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"></div>
                <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-300 hidden md:block" />
                <span className="text-[10px] md:text-sm text-white truncate font-medium">{LIVE_SAVINGS[savingsIndex].user} {LIVE_SAVINGS[savingsIndex].action}</span>
            </div>
        </div>

        {bgImage && <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${bgImage}')` }} />}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/60 via-blue-900/40 to-blue-900/90" />
        <div className="relative container mx-auto px-4 pt-24 md:pt-40 text-center">
          <nav className="flex justify-center items-center gap-3 mb-8 animate-fade-in-down">
            <Globe className="text-teal-400 h-10 w-10 drop-shadow-lg" /> 
            <span className="text-4xl font-extrabold tracking-tighter drop-shadow-lg">TRAVPN</span>
          </nav>
          <div className="mb-12">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-blue-500/20 backdrop-blur-md border border-blue-400/30 text-blue-100 text-xs font-bold uppercase tracking-wider mb-6 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span> {t('searching_badge')}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-xl">
              {t('hero_title_1')}<br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-blue-200">{t('hero_title_2')}</span>
            </h1>
            <p className="text-white/90 text-lg max-w-2xl mx-auto font-light drop-shadow-md">{t('hero_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* BUSCADOR */}
      <div className="container mx-auto px-4 -mt-20 md:-mt-40 relative z-10 mb-12 md:mb-24">
        <div className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl overflow-visible max-w-5xl mx-auto border border-slate-100">
          <div className="flex bg-slate-50 p-1 md:p-2 border-b border-slate-200 gap-1 overflow-x-auto rounded-t-2xl md:rounded-t-[2rem]">
            {['flights', 'hotels', 'cruises'].map(tab => (
                <button key={tab} onClick={() => {setActiveTab(tab); setResults(null); setErrorMsg(null);}} className={`flex-1 min-w-[90px] md:min-w-[120px] py-3 md:py-4 flex items-center justify-center gap-2 font-bold rounded-lg md:rounded-xl transition-all text-xs md:text-base whitespace-nowrap ${activeTab === tab ? 'bg-white shadow-md text-blue-600 ring-1 ring-slate-100' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/50'}`}>
                    {tab === 'flights' ? <Plane className="h-4 w-4 md:h-5 md:w-5"/> : tab === 'hotels' ? <Hotel className="h-4 w-4 md:h-5 md:w-5"/> : <Ship className="h-4 w-4 md:h-5 md:w-5"/>} {t(`tab_${tab}`)}
                </button>
            ))}
          </div>
          
          <form onSubmit={handleSearch} className="p-6 md:p-10 bg-white grid grid-cols-1 md:grid-cols-12 gap-6 items-end rounded-b-2xl md:rounded-b-[2rem]">
            {activeTab === 'flights' && (
                <div className="md:col-span-12 flex flex-wrap gap-6 mb-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none group"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${tripType === 'roundtrip' ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>{tripType === 'roundtrip' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}</div><input type="radio" name="tripType" value="roundtrip" className="hidden" checked={tripType === 'roundtrip'} onChange={() => setTripType('roundtrip')} /><span className={`font-semibold ${tripType === 'roundtrip' ? 'text-blue-900' : 'text-slate-500'}`}>{t('label_roundtrip')}</span></label>
                    <label className="flex items-center gap-2 cursor-pointer select-none group"><div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${tripType === 'oneway' ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}>{tripType === 'oneway' && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}</div><input type="radio" name="tripType" value="oneway" className="hidden" checked={tripType === 'oneway'} onChange={() => setTripType('oneway')} /><span className={`font-semibold ${tripType === 'oneway' ? 'text-blue-900' : 'text-slate-500'}`}>{t('label_oneway')}</span></label>
                    <label className="flex items-center gap-2 cursor-pointer group ml-auto select-none"><div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${formData.directFlights ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>{formData.directFlights && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}</div><input type="checkbox" className="hidden" checked={formData.directFlights} onChange={(e) => setFormData({...formData, directFlights: e.target.checked})} /><span className={`font-medium ${formData.directFlights ? 'text-blue-900' : 'text-slate-500'}`}>{t('label_direct')}</span></label>
                </div>
            )}
            
            {activeTab === 'flights' && (
                <div className="md:col-span-3 relative suggestion-box">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">{t('label_origin')}</label>
                    <div className="relative group"><MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition" /><input type="text" placeholder="MAD" className="w-full pl-11 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition text-sm md:text-base" value={formData.origin} onChange={(e) => handleInputChange('origin', e.target.value)} onFocus={() => formData.origin.length > 1 && setShowSuggestions(prev => ({...prev, origin: true}))} /></div>
                    {showSuggestions.origin && suggestions.origin.length > 0 && (<div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl mt-2 border border-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto">{suggestions.origin.map((airport, idx) => (<button key={idx} type="button" onClick={() => selectSuggestion('origin', airport)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition"><span className="font-bold text-slate-800 text-sm">{airport.city}</span> <span className="text-slate-400 text-xs">({airport.code})</span></button>))}</div>)}
                </div>
            )}

            <div className={`${activeTab === 'flights' ? 'md:col-span-3' : 'md:col-span-4'} relative suggestion-box`}>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">{t('label_destination')}</label>
                <div className="relative group"><Globe className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition" /><input type="text" placeholder={activeTab === 'hotels' ? "Paris" : "Tokyo"} className="w-full pl-11 p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none font-medium transition text-sm md:text-base" value={formData.destination} onChange={(e) => handleInputChange('destination', e.target.value)} onFocus={() => formData.destination.length > 1 && setShowSuggestions(prev => ({...prev, destination: true}))} /></div>
                {activeTab === 'flights' && showSuggestions.destination && suggestions.destination.length > 0 && (<div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-xl mt-2 border border-slate-100 z-50 overflow-hidden max-h-60 overflow-y-auto">{suggestions.destination.map((airport, idx) => (<button key={idx} type="button" onClick={() => selectSuggestion('destination', airport)} className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 transition"><span className="font-bold text-slate-800 text-sm">{airport.city}</span> <span className="text-slate-400 text-xs">({airport.code})</span></button>))}</div>)}
            </div>
            
            <div className={`md:col-span-3 grid ${tripType === 'roundtrip' || activeTab !== 'flights' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">{activeTab === 'hotels' ? t('label_checkin') : t('label_date_start')}</label><input type="date" className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-600 text-sm md:text-base" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} /></div>
                {(tripType === 'roundtrip' || activeTab !== 'flights') && (<div><label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">{activeTab === 'hotels' ? t('label_checkout') : t('label_date_end')}</label><input type="date" className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-600 text-sm md:text-base" value={formData.returnDate} onChange={(e) => setFormData({...formData, returnDate: e.target.value})} /></div>)}
            </div>

            <div className="md:col-span-3 relative" ref={passengerMenuRef}>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">{activeTab === 'flights' ? t('label_passengers') : t('label_guests')}</label>
                <button type="button" onClick={() => setIsPassengerMenuOpen(!isPassengerMenuOpen)} className="w-full p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-left font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition active:scale-[0.98] text-sm md:text-base"><div className="flex items-center gap-2 truncate"><Users className="h-5 w-5 text-slate-400" /><span className="text-sm">{getTotalTravelers()}</span></div><ChevronDown className="h-4 w-4 text-slate-400" /></button>
                {isPassengerMenuOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 p-4 z-50 animate-fade-in-up">
                        <div className="flex justify-between items-center mb-4"><div><p className="font-bold text-sm">{t('adults')}</p><p className="text-xs text-slate-400">{t('age_adult')}</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => updateCount(activeTab === 'flights' ? 'flight' : 'hotel', 'adults', -1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"><Minus className="h-4 w-4"/></button><span className="font-bold w-4 text-center">{activeTab === 'flights' ? formData.passengers.adults : formData.guests.adults}</span><button type="button" onClick={() => updateCount(activeTab === 'flights' ? 'flight' : 'hotel', 'adults', 1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"><Plus className="h-4 w-4"/></button></div></div>
                        <div className="flex justify-between items-center mb-4"><div><p className="font-bold text-sm">{t('children')}</p><p className="text-xs text-slate-400">{t('age_child')}</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => updateCount(activeTab === 'flights' ? 'flight' : 'hotel', 'children', -1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"><Minus className="h-4 w-4"/></button><span className="font-bold w-4 text-center">{activeTab === 'flights' ? formData.passengers.children : formData.guests.children}</span><button type="button" onClick={() => updateCount(activeTab === 'flights' ? 'flight' : 'hotel', 'children', 1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"><Plus className="h-4 w-4"/></button></div></div>
                        {activeTab === 'flights' && (<div className="flex justify-between items-center"><div><p className="font-bold text-sm">{t('infants')}</p><p className="text-xs text-slate-400">{t('age_infant')}</p></div><div className="flex items-center gap-3"><button type="button" onClick={() => updateCount('flight', 'infants', -1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"><Minus className="h-4 w-4"/></button><span className="font-bold w-4 text-center">{formData.passengers.infants}</span><button type="button" onClick={() => updateCount('flight', 'infants', 1)} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200"><Plus className="h-4 w-4"/></button></div></div>)}
                    </div>
                )}
            </div>
            <div className="md:col-span-12 mt-4">
              <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-bold py-3.5 md:py-4 px-4 rounded-xl shadow-lg hover:bg-blue-700 transition flex justify-center items-center gap-3 text-lg active:scale-[0.99]">{loading ? <span className="flex items-center gap-2 animate-pulse">{t('btn_loading')}</span> : <><Search className="h-5 w-5" /> {t('btn_search')}</>}</button>
            </div>
          </form>
        </div>
      </div>

      {errorMsg && (
          <div className="container mx-auto px-4 pb-20 max-w-6xl text-center animate-fade-in-up"><div className="bg-red-50 border border-red-100 text-red-600 px-8 py-6 rounded-2xl inline-block shadow-sm max-w-lg"><p className="font-bold text-lg mb-2 flex items-center justify-center gap-2"><AlertTriangle className="h-5 w-5"/> {t('error_no_results')}</p><p className="text-sm opacity-90">{errorMsg}</p></div></div>
      )}

      {results && !errorMsg && (
        <div className="container mx-auto px-4 py-8 max-w-6xl flex-grow animate-fade-in-up">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-slate-800">{t('result_title')} {formData.destination}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((item, idx) => {
                const converted = convertPrice(item.price, item.currency);
                return (
                  <div key={idx} className={`bg-white rounded-2xl p-6 border shadow-sm relative hover:shadow-xl transition duration-300 group ${idx === 0 ? 'border-teal-400 ring-1 ring-teal-50 shadow-md' : 'border-slate-100'}`}>
                    {idx === 0 && <div className="absolute -top-3 left-6 bg-teal-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full shadow-md z-10">{t('result_best_option')}</div>}
                    
                    {/* Botón de compartir */}
                    <button onClick={() => handleShare(item)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-blue-600 transition"><Share2 className="h-5 w-5"/></button>

                    <div className="flex justify-between items-start mb-4 mt-2">
                        <div className="flex items-center gap-3"><span className="text-4xl drop-shadow-sm">{item.flag}</span><div><h3 className="font-bold text-slate-800 text-lg leading-tight">{t('result_vpn')} {item.country}</h3><div className="text-xs text-slate-400 font-medium flex items-center gap-1"><Lock className="w-3 h-3"/> {t('result_pay_here')}</div></div></div>
                    </div>
                    {activeTab === 'hotels' && (
                        <div className="h-48 bg-slate-100 rounded-xl mb-4 overflow-hidden relative group-hover:shadow-inner transition">
                            <img src={item.image || `https://source.unsplash.com/800x600/?hotel,${formData.destination}`} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" onError={(e) => e.target.src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=500'} />
                            <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold shadow flex items-center gap-1">{item.stars} ⭐</div>
                        </div>
                    )}
                    <div className="mb-4 text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="text-3xl font-extrabold text-slate-900">{item.price.toLocaleString()} <span className="text-sm text-slate-500 font-normal">{item.currency}</span></div>
                        {converted && <div className="text-sm font-bold text-blue-600 mt-1 flex justify-center items-center gap-1">≈ {converted} {userCurrency} <span className="text-[10px] bg-blue-100 px-1 rounded uppercase">Est.</span></div>}
                    </div>
                    <div className="border-t border-slate-100 pt-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            {activeTab === 'flights' && <><Plane className="h-4 w-4 text-blue-400 flex-shrink-0"/> <span className="truncate font-medium">{item.airline}</span></>}
                            {activeTab === 'hotels' && <><Hotel className="h-4 w-4 text-blue-400 flex-shrink-0"/> <span className="truncate font-medium">{item.hotelName}</span></>}
                            {activeTab === 'cruises' && <><Ship className="h-4 w-4 text-blue-400 flex-shrink-0"/> <span className="truncate font-medium">{item.cruiseLine}</span></>}
                        </div>
                    </div>
                    <div className="flex gap-2 mt-auto">
                        <button onClick={() => { setSelectedDeal(item); setShowTutorial(true); }} className="flex-1 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition shadow-lg shadow-slate-200"><Info className="h-4 w-4" /> {t('result_trick')}</button>
                        <a href={getDealLink()} target="_blank" className="px-4 py-3 rounded-xl bg-white text-blue-600 font-bold border-2 border-blue-100 hover:border-blue-600 hover:bg-blue-50 transition flex items-center justify-center"><ExternalLink className="h-5 w-5" /></a>
                    </div>
                  </div>
                )
              })}
            </div>
        </div>
      )}

      {!results && !errorMsg && (
        <div className="bg-white py-16 md:py-20 flex-grow">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center mb-10 md:mb-16"><h2 className="text-2xl md:text-4xl font-bold text-slate-900 mb-4">{t('magic_title')}</h2><p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto">{t('magic_subtitle')}</p></div>
                <div className="grid md:grid-cols-3 gap-6 md:gap-8 relative">
                    <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-slate-100 -z-10"></div>
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition duration-300 text-center group"><div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform"><Globe className="h-8 w-8 md:h-10 md:w-10" /></div><h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-slate-800">{t('step_1_title')}</h3><p className="text-slate-500 text-sm md:text-base leading-relaxed">{t('step_1_desc')}</p></div>
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition duration-300 text-center group relative top-0 md:-top-6"><div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-teal-500 text-white rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-teal-200 group-hover:scale-110 transition-transform"><Shield className="h-8 w-8 md:h-10 md:w-10" /></div><h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-slate-800">{t('step_2_title')}</h3><p className="text-slate-500 text-sm md:text-base leading-relaxed">{t('step_2_desc')}</p></div>
                    <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-xl hover:shadow-2xl transition duration-300 text-center group"><div className="w-16 h-16 md:w-20 md:h-20 mx-auto bg-purple-600 text-white rounded-2xl flex items-center justify-center mb-4 md:mb-6 shadow-lg shadow-purple-200 group-hover:scale-110 transition-transform"><CreditCard className="h-8 w-8 md:h-10 md:w-10" /></div><h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 text-slate-800">{t('step_3_title')}</h3><p className="text-slate-500 text-sm md:text-base leading-relaxed">{t('step_3_desc')}</p></div>
                </div>

                {/* --- LEGALIDAD --- */}
                <div className="mt-16 md:mt-24 bg-slate-50 rounded-3xl p-8 md:p-16 border border-slate-200">
                    <div className="text-center mb-10">
                        <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase mb-3 inline-block">Transparencia Total</span>
                        <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">{t('legality_title')}</h3>
                        <p className="text-slate-500 max-w-2xl mx-auto">{t('legality_subtitle')}</p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0"><HelpCircle className="text-blue-500 h-6 w-6"/></div>
                            <div><h4 className="font-bold text-lg mb-1 text-slate-800">{t('legal_point_1_title')}</h4><p className="text-slate-500 text-sm leading-relaxed">{t('legal_point_1_desc')}</p></div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 flex-shrink-0"><FileText className="text-teal-500 h-6 w-6"/></div>
                            <div><h4 className="font-bold text-lg mb-1 text-slate-800">{t('legal_point_2_title')}</h4><p className="text-slate-500 text-sm leading-relaxed">{t('legal_point_2_desc')}</p></div>
                        </div>
                    </div>
                </div>

                {/* --- NEWSLETTER --- */}
                <div className="mt-16 container mx-auto px-4 max-w-4xl text-center">
                    <div className="bg-slate-900 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="relative z-10">
                            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">{t('newsletter_title')}</h3>
                            <p className="text-slate-300 mb-8 max-w-xl mx-auto text-sm md:text-base">{t('newsletter_subtitle')}</p>
                            
                            {!isSubscribed ? (
                                <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
                                    <input 
                                        type="email" 
                                        placeholder={t('newsletter_placeholder')} 
                                        className="flex-1 p-3 md:p-4 rounded-xl border-none outline-none focus:ring-2 focus:ring-teal-400 text-slate-900 text-sm md:text-base"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold py-3 md:py-4 px-6 md:px-8 rounded-xl transition flex items-center justify-center gap-2 text-sm md:text-base">
                                        {t('newsletter_btn')} <Mail className="h-4 w-4 md:h-5 md:w-5"/>
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-green-500/20 text-green-300 p-4 rounded-xl border border-green-500/50 inline-flex items-center gap-2">
                                    <Check className="h-5 w-5"/> ¡Suscrito! Revisa tu bandeja de entrada.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
      )}
      
      {showTutorial && selectedDeal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-0 overflow-hidden shadow-2xl animate-scale-up max-h-[95vh] overflow-y-auto">
            <div className="bg-slate-900 p-6 md:p-8 text-white relative overflow-hidden">
                <button onClick={() => setShowTutorial(false)} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition z-10"><X className="h-5 w-5"/></button>
                <div className="relative z-10"><div className="flex items-center gap-2 mb-2"><span className="bg-green-500 text-slate-900 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Ahorro detectado</span><span className="text-slate-400 text-xs">{t('result_title')} {formData.destination}</span></div><h3 className="text-2xl md:text-3xl font-bold mb-1">{t('modal_title')} {selectedDeal.country}</h3><p className="text-slate-400 text-sm">{t('modal_subtitle')}</p></div>
            </div>
            <div className="p-6 md:p-8">
                <div className="flex gap-4 md:gap-5 mb-6 md:mb-8 relative">
                    <div className="absolute left-5 md:left-6 top-10 bottom-[-20px] w-0.5 bg-slate-100"></div><div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-blue-50 text-blue-600 font-bold text-lg md:text-xl flex items-center justify-center border border-blue-100 z-10 shadow-sm">1</div>
                    <div className="flex-grow"><h4 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-2">{t('modal_step_1')}</h4><div className="bg-slate-50 border border-slate-200 rounded-xl p-3 md:p-4 mt-2"><p className="text-slate-600 text-xs md:text-sm mb-3">{t('modal_step_1_desc')} <strong>{selectedDeal.country}</strong>.</p><a href="https://go.nordvpn.net/aff_c?offer_id=15&aff_id=136277&url_id=902" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-white border border-blue-200 p-3 rounded-lg hover:shadow-md transition group"><div className="flex items-center gap-3"><div className="bg-blue-600 text-white p-1.5 rounded"><Shield className="h-4 w-4"/></div><div><p className="font-bold text-slate-900 text-xs md:text-sm">{t('modal_vpn_offer')}</p><p className="text-[10px] md:text-xs text-green-600 font-bold">{t('modal_vpn_deal')}</p></div></div><ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600"/></a></div></div>
                </div>
                <div className="flex gap-4 md:gap-5 mb-6 md:mb-8 relative">
                    <div className="absolute left-5 md:left-6 top-10 bottom-[-20px] w-0.5 bg-slate-100"></div><div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-purple-50 text-purple-600 font-bold text-lg md:text-xl flex items-center justify-center border border-purple-100 z-10 shadow-sm">2</div>
                    <div className="flex-grow"><h4 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-2">{t('modal_step_2')}</h4><p className="text-slate-600 text-xs md:text-sm mt-1">{t('modal_step_2_desc')}</p></div>
                </div>
                <div className="flex gap-4 md:gap-5">
                    <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-green-50 text-green-600 font-bold text-lg md:text-xl flex items-center justify-center border border-green-100 z-10 shadow-sm">3</div>
                    <div className="flex-grow"><h4 className="font-bold text-base md:text-lg text-slate-800 flex items-center gap-2">{t('modal_step_3')}</h4><div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 md:p-4 mt-2 text-xs md:text-sm text-yellow-800"><p className="font-bold mb-1">{t('modal_warning')}</p><p>{t('modal_warning_desc')}</p></div><a href={getDealLink()} target="_blank" rel="noopener noreferrer" className="w-full mt-4 bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm md:text-base">{t('modal_btn_go')} <ExternalLink className="h-4 w-4"/></a></div>
                </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-slate-900 text-slate-400 py-10 mt-auto">
          <div className="container mx-auto px-4 text-center">
            <Globe className="h-8 w-8 text-teal-400 mx-auto mb-4" />
            <p className="mb-2 font-bold text-white">TRAVPN © 2024</p>
            <p className="text-sm opacity-70">{t('footer_text')}</p>
          </div>
      </footer>
    </div>
  );
};

export default App;