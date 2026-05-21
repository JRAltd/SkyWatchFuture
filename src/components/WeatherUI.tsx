import React from 'react';
import { motion } from 'motion/react';
import { Cloud, CloudRain, Sun, CloudLightning, CloudSnow, Wind, Droplets, Thermometer, Eye, Gauge, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export const WeatherIcon = ({ code, className = "w-6 h-6", isDay = true }: { code: number; className?: string; isDay?: boolean }) => {
  if (code === 0) return <Sun className={`${className} text-yellow-400`} />;
  if (code <= 3) return <Cloud className={`${className} text-blue-300`} />;
  if (code >= 95) return <CloudLightning className={`${className} text-purple-400`} />;
  if (code >= 71 && code <= 77 || code >= 85) return <CloudSnow className={`${className} text-slate-100`} />;
  if (code >= 51 && code <= 67 || code >= 80) return <CloudRain className={`${className} text-blue-500`} />;
  return <Cloud className={`${className} text-slate-400`} />;
};

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  color: string;
}

export const MetricCard = ({ label, value, subValue, icon, color }: MetricCardProps) => (
  <div className="bg-slate-900/40 backdrop-blur-md border border-slate-700/50 p-4 rounded-xl flex items-center gap-4 hover:border-slate-500/50 transition-colors group">
    <div className={`p-3 rounded-lg ${color} bg-opacity-20 text-${color.split('-')[1]}-400`}>
      {icon}
    </div>
    <div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
      <div className="text-xl font-bold text-white group-hover:text-cyan-400 transition-colors">{value}</div>
      {subValue && <div className="text-[10px] text-slate-500">{subValue}</div>}
    </div>
  </div>
);

export const HourlyCard = ({ time, temp, code }: { time: string; temp: number; code: number }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="flex flex-col items-center gap-2 min-w-[80px] p-4 bg-slate-900/30 rounded-xl border border-slate-800/50"
  >
    <div className="text-xs text-slate-500 font-mono italic">{format(new Date(time), 'h:mm a')}</div>
    <WeatherIcon code={code} className="w-8 h-8" />
    <div className="text-lg font-bold text-white tracking-tighter">{Math.round(temp)}°</div>
  </motion.div>
);

export const DayCard = ({ date, min, max, code, pop }: { date: string; min: number; max: number; code: number; pop: number }) => (
  <div className="flex items-center justify-between p-4 bg-slate-900/20 rounded-xl border border-white/5 hover:bg-slate-900/40 transition-all cursor-default">
    <div className="flex items-center gap-4 w-1/3">
      <div className="text-sm font-bold text-slate-300 w-12">{format(new Date(date), 'EEE')}</div>
      <WeatherIcon code={code} className="w-6 h-6" />
    </div>
    
    <div className="flex items-center gap-2 text-[10px] text-blue-400 font-bold uppercase tracking-tighter w-1/4">
      <Droplets className="w-3 h-3" />
      {pop}%
    </div>

    <div className="flex items-center gap-3 w-1/3 justify-end font-mono">
      <span className="text-white font-bold">{Math.round(max)}°</span>
      <span className="text-slate-500 text-sm">{Math.round(min)}°</span>
    </div>
  </div>
);

export const AlertBanner = ({ children }: { children: React.ReactNode }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-start gap-4 mb-6"
  >
    <div className="bg-red-500 p-2 rounded-lg text-white">
      <ShieldAlert className="w-5 h-5" />
    </div>
    <div>
      <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1 font-mono">Atmospheric Alert</div>
      <div className="text-sm text-slate-300 leading-relaxed">{children}</div>
    </div>
  </motion.div>
);
