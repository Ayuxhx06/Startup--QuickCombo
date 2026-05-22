'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Cloud, Droplets, Wind, MapPin } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateWeather = () => {
      const savedLat = localStorage.getItem('qc_lat');
      const savedLng = localStorage.getItem('qc_lng');
      if (savedLat && savedLng) {
        fetchWeather(parseFloat(savedLat), parseFloat(savedLng));
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
          () => fetchWeather() // default Delhi
        );
      } else {
        fetchWeather();
      }
    };

    updateWeather();
    window.addEventListener('storage', updateWeather);
    return () => window.removeEventListener('storage', updateWeather);
  }, []);

  const fetchWeather = (lat?: number, lng?: number) => {
    const params = new URLSearchParams();
    if (lat && lng) {
      params.append('lat', lat.toString());
      params.append('lng', lng.toString());
    }
    axios.get(`${API}/api/weather/?${params.toString()}`)
      .then(res => {
        setWeather(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  if (loading) {
    return <div className="h-16 w-full shimmer rounded-2xl glass-green" />;
  }

  if (!weather) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-green rounded-2xl p-3 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black/40 rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/5">
          {weather.icon}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-black text-lg text-white leading-none">{weather.temperature}°C</span>
            <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{weather.description}</span>
          </div>
          <p className="text-green-400 text-xs font-bold mt-0.5 max-w-[180px] truncate leading-tight">
            {weather.suggestion}
          </p>
        </div>
      </div>
      
      <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-1"><Wind size={14} className="text-gray-400" /> {weather.windspeed} km/h</div>
      </div>
    </motion.div>
  );
}
