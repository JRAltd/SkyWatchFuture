import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Thermometer, Wind, Layers, RefreshCw, BrainCircuit, Zap, ShieldAlert } from 'lucide-react';
import { AppSettings, TempUnit, WindUnit } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const SettingsModal = ({ isOpen, onClose, settings, updateSettings }: SettingsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="w-full max-w-lg bg-[#111] border border-white/10 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">System <span className="text-cyan-400">Configuration</span></h2>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Adjust core functional parameters</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 flex flex-col gap-6 max-h-[60vh] overflow-y-auto">
              {/* Temp Units */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Thermometer className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Temperature Scale</span>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  {(['c', 'f'] as TempUnit[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => updateSettings({ tempUnit: unit })}
                      className={`flex-1 py-3 rounded-lg text-sm font-bold uppercase transition-all ${
                        settings.tempUnit === unit ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {unit === 'c' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Wind Units */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">Velocity Metrics</span>
                </div>
                <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
                  {(['kmh', 'mph', 'kn'] as WindUnit[]).map((unit) => (
                    <button
                      key={unit}
                      onClick={() => updateSettings({ windUnit: unit })}
                      className={`flex-1 py-3 rounded-lg text-xs font-bold uppercase transition-all ${
                        settings.windUnit === unit ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/20' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {/* Radar Opacity */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold uppercase tracking-widest">Radar Density</span>
                  </div>
                  <span className="text-xs font-mono text-cyan-400">{Math.round(settings.radarOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={settings.radarOpacity * 100}
                  onChange={(e) => updateSettings({ radarOpacity: parseInt(e.target.value) / 100 })}
                  className="w-full h-1.5 bg-cyan-900/40 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 gap-3">
                 <ToggleRow 
                    icon={<BrainCircuit className="w-5 h-5" />} 
                    label="AI Neural Insights" 
                    sub="Predictive Analysis"
                    active={settings.showAiInsights}
                    onToggle={() => updateSettings({ showAiInsights: !settings.showAiInsights })}
                 />
                 <ToggleRow 
                    icon={<Zap className="w-5 h-5" />} 
                    label="Tactical Lightning" 
                    sub="Real-time Strikes"
                    active={settings.showLightning}
                    onToggle={() => updateSettings({ showLightning: !settings.showLightning })}
                 />
                 <ToggleRow 
                    icon={<ShieldAlert className="w-5 h-5" />} 
                    label="Severe Threat Map" 
                    sub="NWS Warning Overlays"
                    active={settings.showAlerts}
                    onToggle={() => updateSettings({ showAlerts: !settings.showAlerts })}
                 />
                 <ToggleRow 
                    icon={<RefreshCw className="w-5 h-5" />} 
                    label="Autonomous Sync" 
                    sub="Adaptive Refresh"
                    active={settings.autoRefresh}
                    onToggle={() => updateSettings({ autoRefresh: !settings.autoRefresh })}
                 />
              </div>
            </div>

            <div className="p-8 bg-white/5 flex gap-4">
              <button 
                onClick={onClose}
                className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/10"
              >
                Apply Directives
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ToggleRow = ({ icon, label, sub, active, onToggle }: { icon: React.ReactNode; label: string; sub: string; active: boolean; onToggle: () => void }) => (
  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-cyan-500/30 transition-colors">
    <div className="flex items-center gap-4">
       <div className={`p-2 rounded-lg transition-colors ${active ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-500'}`}>
          {icon}
       </div>
       <div>
          <div className="text-sm font-bold text-white">{label}</div>
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{sub}</div>
       </div>
    </div>
    <button 
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-all relative ${active ? 'bg-cyan-500' : 'bg-slate-700'}`}
    >
       <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${active ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);
