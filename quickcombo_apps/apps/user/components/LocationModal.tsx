'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Loader2, Navigation } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  onDetect: () => void;
  isLocating: boolean;
}

export default function LocationModal({ isOpen, onClose, onSelect, onDetect, isLocating }: LocationModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      searchLocation();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const searchLocation = async () => {
    setSearching(true);
    try {
      const r = await axios.get(`${API}/api/location/autocomplete/`, { params: { q: query } });
      setResults(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-[95%] max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 z-[120] shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black">Change Location</h2>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                autoFocus
                placeholder="Search for area, street name..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-green-500/50 transition-all font-medium text-white"
              />
              {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-green-500" size={18} />}
            </div>

            <button
              onClick={() => { onDetect(); onClose(); }}
              disabled={isLocating}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all mb-4 group"
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                <Navigation size={20} />
              </div>
              <div className="text-left">
                <div className="font-bold text-green-400">Detect current location</div>
                <div className="text-xs text-green-500/60 font-medium italic">Using GPS Technology</div>
              </div>
            </button>

            <div className="space-y-2 max-h-[300px] overflow-y-auto no-scrollbar">
              {results.map((res, i) => (
                <button
                  key={i}
                  onClick={() => {
                    onSelect(res.display, res.lat, res.lng);
                    onClose();
                  }}
                  className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-all text-left"
                >
                  <MapPin size={18} className="text-gray-500 mt-1 shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-white">{res.name || res.display.split(',')[0]}</div>
                    <div className="text-xs text-gray-400 line-clamp-1">{res.display}</div>
                  </div>
                </button>
              ))}
              {query.length >= 3 && results.length === 0 && !searching && (
                <div className="text-center py-8 text-gray-500 text-sm italic">No locations found. Try a different search.</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
