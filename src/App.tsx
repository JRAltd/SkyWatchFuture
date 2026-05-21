import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  Droplets, 
  Thermometer, 
  Eye, 
  Gauge, 
  MapPin, 
  Search, 
  Settings, 
  BrainCircuit, 
  ChevronLeft,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Sun
} from 'lucide-react';
import { fetchWeather, WeatherData } from './services/weatherService';
import { getWeatherInsights } from './services/geminiService';
import { RadarMap } from './components/RadarMap';
import { WeatherIcon, MetricCard, HourlyCard, DayCard, AlertBanner } from './components/WeatherUI';
import { SettingsModal } from './components/SettingsModal';
import { AppSettings, TempUnit, WindUnit } from './types';

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [coords, setCoords] = useState({ lat: 40.7128, lng: -74.0060 }); // Default NYC
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const hourlyScrollRef = useRef<HTMLDivElement>(null);

  const scrollHourly = (direction: 'left' | 'right') => {
    if (hourlyScrollRef.current) {
      const scrollAmount = 350;
      hourlyScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };
  
  const [settings, setSettings] = useState<AppSettings>({
    tempUnit: 'f',
    windUnit: 'mph',
    radarOpacity: 0.6,
    autoRefresh: true,
    showAiInsights: true,
    showLightning: true,
    showAlerts: true,
  });

  const convertTemp = (c: number) => {
    if (settings.tempUnit === 'f') return (c * 9/5) + 32;
    return c;
  };

  const convertWind = (kmh: number) => {
    if (settings.windUnit === 'mph') return kmh * 0.621371;
    if (settings.windUnit === 'kn') return kmh * 0.539957;
    return kmh;
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleLocationChange = (lat: number, lng: number) => {
    setCoords({ lat, lng });
  };

  useEffect(() => {
    // Initial fetch based on geolocation or default
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => console.log("Geolocation blocked, using default")
      );
    }
  }, []);

  const updateWeather = async () => {
    try {
      setLoading(true);
      const data = await fetchWeather(coords.lat, coords.lng);
      setWeather(data);
      
      if (settings.showAiInsights) {
        const aiResponse = await getWeatherInsights(data, settings.tempUnit, settings.windUnit);
        setInsights(aiResponse);
      } else {
        setInsights("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    updateWeather();
  }, [coords, settings.showAiInsights]);

  useEffect(() => {
    if (!settings.autoRefresh) return;
    const interval = setInterval(updateWeather, 300000); // 5 mins
    return () => clearInterval(interval);
  }, [settings.autoRefresh, coords]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    
    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();
      if (data && data[0]) {
        setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
        setIsSearchOpen(false);
      }
    } catch (err) {
      console.error("Search failed", err);
    }
  };

  if (loading && !weather) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-cyan-500/30 border-t-cyan-400 rounded-full"
        />
        <div className="absolute mt-24 text-[10px] uppercase tracking-[0.3em] font-bold text-cyan-400/50 animate-pulse">
           Establishing Uplink...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans selection:bg-cyan-500/30">
      {/* Background Atmosphere */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-cyan-900/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[100px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <Sun className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">SkyWatch<span className="text-cyan-400">.Future</span></h1>
            <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Sattelite Link v4.2 Stable
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
             onClick={() => setIsSearchOpen(true)}
             className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Search className="w-5 h-5 text-slate-400" />
          </button>
          <button 
             onClick={() => setIsSettingsOpen(true)}
             className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <Settings className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stats & Radar */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Main Hero Card */}
          <section className="relative overflow-hidden rounded-3xl bg-slate-900/40 border border-white/5 p-8 flex flex-col md:flex-row gap-8 min-h-[320px]">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-widest text-[10px] mb-4">
                <MapPin className="w-3 h-3" />
                {weather?.locationName}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-8xl font-black tracking-tighter text-white tabular-nums drop-shadow-xl">
                  {Math.round(convertTemp(weather?.current.temp || 0))}
                  <span className="text-cyan-400 text-4xl align-top ml-1">°</span>
                </span>
              </div>
              <p className="text-2xl text-slate-400 font-medium mt-2">{weather?.current.description}</p>
              
              <div className="mt-8 flex gap-4">
                <MetricCard icon={<Wind />} label="Wind Vector" value={`${Math.round(convertWind(weather?.current.windSpeed || 0))} ${settings.windUnit}`} color="bg-cyan-500" />
                <MetricCard icon={<Droplets />} label="Saturation" value={`${weather?.current.humidity}%`} color="bg-blue-500" />
              </div>
            </div>

            <div className="relative z-10 md:w-1/3 flex flex-col items-center justify-center bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6">
               <WeatherIcon code={weather?.current.weatherCode || 0} className="w-24 h-24 mb-4" />
               <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest">Atmospheric State</div>
               <div className="text-sm font-semibold text-white mt-1 uppercase tracking-tighter">
                  {weather?.current.isDay ? 'Diurnal' : 'Nocturnal'} Cycle
               </div>
            </div>
          </section>

          {/* AI Insights Panel */}
          {insights && (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-cyan-500/5 border border-cyan-500/20 rounded-2xl p-6 flex items-start gap-4"
            >
              <div className="bg-cyan-500/20 p-3 rounded-lg">
                <BrainCircuit className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-black text-cyan-400 mb-2">Tactical AI Assessment</div>
                <p className="text-slate-300 leading-relaxed italic italic font-medium">"{insights}"</p>
              </div>
            </motion.section>
          )}

          {/* Radar Section */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-slate-500">Live Environmental Radar</h2>
              <div className="flex items-center gap-2 text-[10px] font-bold text-cyan-400 uppercase">
                <Maximize2 className="w-3 h-3" />
                Expanding Grid
              </div>
            </div>
            <div className="h-[500px] relative">
              <RadarMap 
                center={coords} 
                opacity={settings.radarOpacity} 
                showLightning={settings.showLightning} 
                showAlerts={settings.showAlerts}
                onLocationChange={handleLocationChange}
              />
            </div>
          </section>

          {/* Hourly Forecast */}
          <section className="flex flex-col gap-4 overflow-hidden">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase tracking-[0.3em] font-black text-slate-500">Temporal Trajectory (24H)</h2>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => scrollHourly('left')}
                  className="w-8 h-8 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer active:scale-95"
                  title="Scroll Left"
                  aria-label="Scroll hourly forecast left"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollHourly('right')}
                  className="w-8 h-8 rounded-lg bg-slate-900/60 border border-white/5 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all cursor-pointer active:scale-95"
                  title="Scroll Right"
                  aria-label="Scroll hourly forecast right"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
                </button>
              </div>
            </div>
            <div 
              ref={hourlyScrollRef}
              className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar scroll-smooth"
            >
              {weather?.hourly.map((h, i) => (
                <HourlyCard key={i} {...h} temp={convertTemp(h.temp)} />
              ))}
            </div>
          </section>

        </div>

        {/* Right Column: Alerts & Weekly */}
        <aside className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricCard 
              label="UV Flux" 
              value={`${weather?.current.uvIndex}`} 
              subValue={weather && weather.current.uvIndex > 5 ? "High Exposure" : "Safe Range"}
              icon={<Thermometer />} 
              color="bg-orange-500" 
            />
            <MetricCard 
              label="Visibility" 
              value={weather ? `${(weather.current.visibility * 0.621371).toFixed(1)} mi` : "N/A"} 
              icon={<Eye />} 
              color="bg-indigo-500" 
            />
            <MetricCard 
              label="Pressure" 
              value={weather ? `${(weather.current.pressure * 0.02953).toFixed(2)} inHg` : "N/A"} 
              icon={<Gauge />} 
              color="bg-emerald-500" 
            />
            <MetricCard 
              label="Update" 
              value="SYNCED" 
              subValue={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              icon={<RefreshCw />} 
              color="bg-pink-500" 
            />
          </div>

          {/* Alerts */}
          {weather && weather.current.windSpeed > 30 && (
            <AlertBanner>
              High wind vectors detected in your sector. Tactical stability may be compromised for aerial craft or light structures.
            </AlertBanner>
          )}

          {/* Weekly Outlook */}
          <section className="bg-slate-900/30 border border-white/5 rounded-3xl p-6">
            <h2 className="text-sm uppercase tracking-[0.3em] font-black text-slate-500 mb-6 flex items-center justify-between">
              Long-Range Outlook
              <ChevronRight className="w-4 h-4" />
            </h2>
            <div className="flex flex-col gap-3">
              {weather?.daily.map((d, i) => (
                <DayCard 
                  key={i} 
                  {...d} 
                  max={convertTemp(d.maxTemp)} 
                  min={convertTemp(d.minTemp)} 
                />
              ))}
            </div>
          </section>

          {/* Mini Tech Footer */}
          <div className="mt-auto pt-8 border-t border-white/5 opacity-30 text-[9px] uppercase tracking-widest font-mono">
            <div>Global Grid Coord: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</div>
            <div className="mt-2">Core Kernel: React 19.x // Framer Motion 12</div>
          </div>
        </aside>
      </main>

      {/* Search Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-[#111] border border-white/10 rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Relocate <span className="text-cyan-400">Sensor Node</span></h2>
                <button onClick={() => setIsSearchOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  Close (ESC)
                </button>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Enter City, Region or Lat/Lng..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-16 pr-6 text-xl focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  className="mt-6 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-[0_10px_20px_rgba(6,182,212,0.2)]"
                >
                   Initiate Scan
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Overlay */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        updateSettings={updateSettings}
      />

      {/* Creator Attribution Footer */}
      <footer className="border-t border-white/5 bg-black/40 backdrop-blur-xl py-6 px-6 text-center mt-8 relative z-10">
        <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">
          This app is created by <span className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">JRAltd_Inc.</span>
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        
        /* Custom sleek horizontal scrollbar for hourly forecast */
        .custom-scrollbar::-webkit-scrollbar {
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 9999px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.2);
          border-radius: 9999px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.5);
        }
      `}} />
    </div>
  );
}
