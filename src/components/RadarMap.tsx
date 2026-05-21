import React, { useEffect, useState, useRef } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary, ControlPosition, MapControl, Marker } from '@vis.gl/react-google-maps';
import { Plus, Minus, Play, Pause, SkipForward, SkipBack } from 'lucide-react';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || "";

interface RadarLayerProps {
  opacity: number;
  path: string | null;
  host: string;
}

const RadarLayer = ({ opacity, path, host }: RadarLayerProps) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !path) return;

    const radarLayer = new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) => {
        if (zoom > 6) {
          return null;
        }
        const numTiles = 1 << zoom;
        
        // Wrap X coordinate horizontally to handle wrapping across the date line
        const x = ((coord.x % numTiles) + numTiles) % numTiles;
        
        // Vertically clip Y coordinate as Mercator projection limits it within bounds
        const y = coord.y;
        if (y < 0 || y >= numTiles) {
          return null;
        }

        return `${host}${path}/256/${zoom}/${x}/${y}/2/1_1.png`;
      },
      tileSize: new google.maps.Size(256, 256),
      opacity: opacity,
      name: 'Radar',
      maxZoom: 6,
      minZoom: 2,
    });

    map.overlayMapTypes.setAt(0, radarLayer);

    return () => {
      map.overlayMapTypes.removeAt(0);
    };
  }, [map, path, opacity, host]);

  return null;
};

// --- Places Autocomplete Component ---
const PlaceAutocomplete = ({ onPlaceSelect }: { onPlaceSelect: (pos: google.maps.LatLngLiteral) => void }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address'],
    };

    const autocomplete = new places.Autocomplete(inputRef.current, options);

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        onPlaceSelect(place.geometry.location.toJSON());
      }
    });
  }, [places]);

  return (
    <div className="p-4">
      <div className="relative group w-64 md:w-80">
        <input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="ENTER TARGET COORDINATES..."
          className="w-full bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 rounded-xl py-3 px-4 text-cyan-400 placeholder:text-cyan-900 focus:outline-none focus:border-cyan-400 transition-all font-mono text-[10px] uppercase tracking-widest shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-500 animate-pulse pointer-events-none" />
      </div>
    </div>
  );
};

// --- Lightning Strikes Component ---
interface Strike {
  id: number;
  lat: number;
  lng: number;
  time: number;
}

const LightningLayer = ({ active, center }: { active: boolean; center: google.maps.LatLngLiteral }) => {
  const [strikes, setStrikes] = useState<Strike[]>([]);
  
  useEffect(() => {
    if (!active) {
      setStrikes([]);
      return;
    }

    // Only strike occasionally to feel more realistic and proportional
    const interval = setInterval(() => {
      // Use a seed-like approach to keep some "hotspots"
      const newStrike: Strike = {
        id: Date.now(),
        lat: center.lat + (Math.random() - 0.5) * 0.1, // Much tighter radius
        lng: center.lng + (Math.random() - 0.5) * 0.1,
        time: Date.now(),
      };
      setStrikes(prev => [...prev.slice(-3), newStrike]); // Fewer concurrent strikes
    }, 8000 + Math.random() * 10000); // Much rarer

    return () => clearInterval(interval);
  }, [active, center]);

  if (!active) return null;

  return (
    <>
      {strikes.map(strike => (
        <Marker 
          key={strike.id} 
          position={{ lat: strike.lat, lng: strike.lng }}
        >
          <div className="relative">
            <div className="absolute -translate-x-1/2 -translate-y-1/2 animate-[lightning_1s_ease-out_forwards]">
               <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#ffeb3b" stroke="#fff" strokeWidth="1" />
                 <circle cx="12" cy="12" r="8" stroke="#ffeb3b" strokeWidth="2" className="animate-ping opacity-50" />
               </svg>
            </div>
          </div>
        </Marker>
      ))}
    </>
  );
};

// --- Weather Alerts Component ---
const AlertLayer = ({ active, alerts }: { active: boolean; alerts: any[] }) => {
  const getAlertStyle = (type: string, severity: string) => {
    const t = type.toLowerCase();
    const s = severity.toLowerCase();
    
    if (s === 'extreme' || s === 'severe' || t.includes('warning')) {
      return { color: "#ef4444", scale: 20 }; // Red for high danger
    }
    if (s === 'moderate' || t.includes('watch')) {
      return { color: "#f59e0b", scale: 16 }; // Yellow/Orange for watches
    }
    return { color: "#06b6d4", scale: 12 }; // Cyan/Blue for minor/advisories
  };

  if (!active || alerts.length === 0) return null;

  return (
    <>
      {alerts.map(alert => {
        const style = getAlertStyle(alert.type, alert.severity);
        return (
          <Marker 
            key={alert.id} 
            position={{ lat: alert.lat, lng: alert.lng }}
            title={`${alert.type} - Severity: ${alert.severity}`}
          >
            <div className="group relative -translate-x-1/2 -translate-y-1/2 pointer-events-none">
               <div 
                 className={`rounded-full animate-[pulse_2s_infinite] border-2 transition-all duration-1000`}
                 style={{ 
                   backgroundColor: `${style.color}33`, 
                   borderColor: style.color,
                   width: style.scale * 2,
                   height: style.scale * 2
                 }} 
               />
               {/* Tooltip */}
               <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-black/90 border border-slate-700 p-3 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1 font-mono" style={{ color: style.color }}>Atmospheric Threat</div>
                  <div className="text-xs font-bold text-white uppercase">{alert.type}</div>
                  <div className="text-[10px] text-slate-400 mt-1 uppercase">Severity Level: {alert.severity}</div>
               </div>
            </div>
          </Marker>
        );
      })}
    </>
  );
};

// --- Zoom Controls Component ---
const CustomZoomControls = () => {
  const map = useMap();

  const handleZoom = (delta: number) => {
    if (!map) return;
    map.setZoom((map.getZoom() || 8) + delta);
  };

  return (
    <div className="flex flex-col gap-2 p-4">
      <button
        onClick={() => handleZoom(1)}
        className="group relative w-10 h-10 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-400 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] active:scale-95 cursor-pointer"
      >
        <div className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity rounded-lg" />
        <Plus className="w-5 h-5 relative z-10" />
      </button>
      <button
        onClick={() => handleZoom(-1)}
        className="group relative w-10 h-10 bg-slate-900/90 backdrop-blur-xl border border-cyan-500/50 rounded-lg flex items-center justify-center text-cyan-400 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] active:scale-95 cursor-pointer"
      >
        <div className="absolute inset-0 bg-cyan-400 opacity-0 group-hover:opacity-10 transition-opacity rounded-lg" />
        <Minus className="w-5 h-5 relative z-10" />
      </button>
    </div>
  );
};

// --- Map Handler Component for Programmatic Center Synchronization ---
const MapHandler = ({ center }: { center: google.maps.LatLngLiteral }) => {
  const map = useMap();

  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  return null;
};

interface RadarMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  opacity?: number;
  showLightning?: boolean;
  showAlerts?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
}

const DARK_MODE_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#0a0b0e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0b0e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1f2937" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#9ca3af" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#111827" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1f2937" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#374151" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2937" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#010409" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
];

interface RadarFrame {
  time: number;
  path: string;
}

export const RadarMap = ({ center, zoom = 8, opacity = 0.6, showLightning = false, showAlerts = false, onLocationChange }: RadarMapProps) => {
  const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY' && API_KEY !== 'MY_GOOGLE_MAPS_KEY';

  const [frames, setFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [host, setHost] = useState<string>("https://tilecache.rainviewer.com");
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then(res => res.json())
      .then(data => {
        if (data.host) {
          setHost(data.host);
        }
        if (data.radar && data.radar.past && data.radar.past.length > 0) {
          setFrames(data.radar.past);
          setCurrentFrameIndex(data.radar.past.length - 1); // default to latest past frame
        }
      })
      .catch(err => console.error("RainViewer metadata fetch failed", err));
  }, []);

  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentFrameIndex((prevIndex) => {
        if (prevIndex === -1) return 0;
        return (prevIndex + 1) % frames.length;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, frames]);

  useEffect(() => {
    if (!showAlerts) {
      setAlerts([]);
      return;
    }

    // Fetch real NWS alerts if in US
    fetch(`https://api.weather.gov/alerts/active?point=${center.lat},${center.lng}`)
      .then(res => res.json())
      .then(data => {
        if (data.features) {
          const newAlerts = data.features.slice(0, 3).map((f: any) => ({
             id: f.id,
             lat: f.geometry?.coordinates?.[1] || center.lat + (Math.random() - 0.5) * 0.1,
             lng: f.geometry?.coordinates?.[0] || center.lng + (Math.random() - 0.5) * 0.1,
             type: f.properties.event,
             severity: f.properties.severity
          }));
          setAlerts(newAlerts);
        } else {
          setAlerts([]);
        }
      })
      .catch(err => {
        console.warn("NWS alerts fetch failed in parent", err);
        setAlerts([]);
      });
  }, [showAlerts, center.lat, center.lng]);

  const activeFrame = currentFrameIndex !== -1 && frames[currentFrameIndex] ? frames[currentFrameIndex] : null;
  const latestFrame = frames.length > 0 ? frames[frames.length - 1] : null;

  const formatRadarTime = (ts: number, latestTs: number) => {
    const d = new Date(ts * 1000);
    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    const diffMinutes = Math.round((ts - latestTs) / 60);
    const relStr = diffMinutes === 0 ? "LATEST" : `${diffMinutes}m`;
    return `${timeStr} (${relStr})`;
  };

  if (!hasValidKey) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-950 text-slate-500 p-8 text-center rounded-2xl border border-slate-900 overflow-hidden relative">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent" />
        <h3 className="text-xl font-black italic text-white mb-2 uppercase tracking-tighter">Sattelite Uplink Offline</h3>
        <p className="text-xs uppercase tracking-widest font-bold">Access restricted // Provide API_KEY in parameters</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-2xl border border-white/5 relative group bg-[#0a0c10]">
      <APIProvider apiKey={API_KEY}>
        <Map
          defaultCenter={center}
          defaultZoom={zoom}
          minZoom={2}
          maxZoom={16} 
          styles={DARK_MODE_STYLE}
          disableDefaultUI={true}
          gestureHandling={'greedy'}
          reuseMaps={true}
          style={{ width: '100%', height: '100%' }}
        >
          <MapHandler center={center} />
          <MapControl position={ControlPosition.TOP_LEFT}>
            <PlaceAutocomplete onPlaceSelect={(pos) => onLocationChange?.(pos.lat, pos.lng)} />
          </MapControl>

          <MapControl position={ControlPosition.RIGHT_BOTTOM}>
            <CustomZoomControls />
          </MapControl>

          <RadarLayer opacity={opacity} path={activeFrame ? activeFrame.path : null} host={host} />

          {showLightning && <LightningLayer active={showLightning} center={center} />}
          {showAlerts && <AlertLayer active={showAlerts} alerts={alerts} />}
          
        </Map>
      </APIProvider>

      {/* Radar Animation Controls Overlay */}
      {frames.length > 1 && (
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 px-3 py-2 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.15)] max-w-[calc(100%-100px)] animate-[fade-in_0.3s_ease-out_forwards]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-8 h-8 rounded-lg border border-cyan-500/30 bg-slate-900/50 flex items-center justify-center text-cyan-400 hover:border-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all active:scale-95 cursor-pointer"
              title={isPlaying ? "Pause Radar Loop" : "Play Radar Loop"}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-cyan-400/20" /> : <Play className="w-4 h-4 fill-cyan-400/25 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1));
              }}
              className="w-8 h-8 rounded-lg border border-cyan-500/10 bg-slate-900/30 flex items-center justify-center text-cyan-500/70 hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all active:scale-95 cursor-pointer"
              title="Step Backward"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentFrameIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0));
              }}
              className="w-8 h-8 rounded-lg border border-cyan-500/10 bg-slate-900/30 flex items-center justify-center text-cyan-500/70 hover:border-cyan-500/40 hover:text-cyan-400 hover:bg-cyan-500/5 transition-all active:scale-95 cursor-pointer"
              title="Step Forward"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden sm:flex items-center">
            <input
              type="range"
              min={0}
              max={frames.length - 1}
              value={currentFrameIndex}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrameIndex(parseInt(e.target.value));
              }}
              className="w-20 md:w-28 accent-cyan-500 cursor-pointer h-1 rounded bg-cyan-950 border border-cyan-500/20 appearance-none focus:outline-none"
            />
          </div>

          <div className="flex flex-col min-w-[100px]">
            <span className="text-[8px] font-black tracking-widest text-cyan-500 uppercase leading-none font-mono">
              {isPlaying ? "LOOP ACTIVE" : "LOOP PAUSED"}
            </span>
            <span className="text-[10px] font-bold text-white tracking-widest font-mono mt-0.5 whitespace-nowrap">
              {activeFrame && latestFrame ? formatRadarTime(activeFrame.time, latestFrame.time) : "LOADING..."}
            </span>
          </div>
        </div>
      )}

      {/* Overlays */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl border border-cyan-500/30 text-[10px] uppercase tracking-[0.2em] text-cyan-400 font-black shadow-lg pointer-events-auto">
           Live Feed: Active
        </div>
        {showAlerts && alerts.length > 0 && (
           <div className="bg-red-950/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-red-500/50 text-[10px] uppercase tracking-[0.2em] text-red-400 font-black flex items-center gap-2 animate-pulse pointer-events-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Hazards Detected
           </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes lightning {
          0% { opacity: 0; transform: scale(0.5); filter: brightness(3); }
          10% { opacity: 1; transform: scale(1.2); }
          50% { opacity: 0.8; transform: scale(1); filter: brightness(1); }
          100% { opacity: 0; transform: scale(0.9); }
        }
      `}} />
    </div>
  );
};
