'use client';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingCart, MapPin, User, Loader2, Search, X, ClipboardList } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';
import AuthModal from './AuthModal';
import LocationModal from './LocationModal';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount, setIsOpen } = useCart();
  const { user, setShowAuthModal } = useAuth();
  const [locationName, setLocationName] = useState('Set delivery location');
  const [isLocating, setIsLocating] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('qc_location');
    if (saved) setLocationName(saved);
  }, []);

  if (pathname.includes('/admin') || pathname.includes('/portal')) return null;

  const onSelectLocation = (address: string, lat: number, lng: number) => {
    const shortName = address.split(',').slice(0, 2).join(', ');
    setLocationName(shortName);
    localStorage.setItem('qc_location', shortName);
    localStorage.setItem('qc_lat', lat.toString());
    localStorage.setItem('qc_lng', lng.toString());
    window.dispatchEvent(new Event('storage')); // Notify other components
  };

  const fetchLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      alert('❌ Geolocation is not supported by your browser. Please enter your address manually.');
      setIsLocating(false);
      return;
    }
    
    // Set a timeout for the location request
    const locationOptions = {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          console.log(`Detecting address for: ${latitude}, ${longitude}`);
          const r = await axios.get(`${API}/api/location/reverse/`, {
            params: { lat: latitude, lng: longitude }
          });
          const fetchedAddress = r.data.address;
          if (fetchedAddress) {
            onSelectLocation(fetchedAddress, latitude, longitude);
          } else {
            alert('⚠️ We found your coordinates but could not find a matching street address. Please select manually.');
          }
        } catch (e) {
          console.error('Reverse Geocode Error:', e);
          alert('❌ Could not fetch the full address. Please type it in the search box.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        switch(err.code) {
          case err.PERMISSION_DENIED:
            alert('🔒 Location permission denied. Please enable location access in your browser settings to use this feature.');
            break;
          case err.POSITION_UNAVAILABLE:
            alert('🚫 Your location information is unavailable. Try moving to a more open area or search manually.');
            break;
          case err.TIMEOUT:
            alert('⌛ Location request timed out. Please try again or search manually.');
            break;
          default:
            alert('⚠️ An unknown error occurred while detecting location.');
            break;
        }
      },
      locationOptions
    );
  };

  return (
    <>
      <nav className="sticky top-0 z-[100] bg-black border-b border-white/5 shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          
          {/* Left: Logo + Location Stack */}
          <div className="flex flex-col items-start justify-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1 group">
              <span className="font-black text-xl tracking-tight text-white mb-0.5">
                Quick<span className="text-green-500">Combo</span>
              </span>
            </Link>

            {/* Location */}
            <button
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1 text-[11px] text-gray-400 font-semibold max-w-[200px] hover:text-green-400 transition-colors"
            >
              {isLocating ? <Loader2 size={12} className="animate-spin text-green-500" /> : <MapPin size={12} className="text-green-500" />}
              <span className="truncate">{locationName}</span>
              <span className="text-gray-600 ml-0.5">▾</span>
            </button>
          </div>

          {/* Right actions: Search + Profile + Cart */}
          <div className="flex items-center gap-3">
            {/* Search Toggle / Input */}
            <div className="flex items-center">
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.form
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 160, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (search.trim()) {
                        router.push(`/menu?search=${encodeURIComponent(search.trim())}`);
                        setIsSearchOpen(false);
                      }
                    }}
                    className="relative"
                  >
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full bg-white/10 border border-white/10 rounded-full py-1.5 pl-3 pr-8 text-xs text-white outline-none focus:border-green-500/50 transition-all font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => { setIsSearchOpen(false); setSearch(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
              
              {!isSearchOpen && (
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSearchOpen(true)}
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
                >
                  <Search size={16} />
                </motion.button>
              )}
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <Link href="/orders">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
                  >
                    <ClipboardList size={16} />
                  </motion.button>
                </Link>
                <Link href="/profile">
                  <motion.div
                    whileTap={{ scale: 0.9 }}
                    className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400 text-sm font-black shadow-lg"
                  >
                    {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                  </motion.div>
                </Link>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAuthModal(true)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
              >
                <User size={16} />
              </motion.button>
            )}

            {/* Cart Circular Button */}
            <Link href="/checkout">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="relative w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white"
                id="cart-icon"
              >
                <ShoppingCart size={16} />
              <AnimatePresence>
                {itemCount > 0 && (
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 bg-green-500 text-black text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {itemCount > 9 ? '9+' : itemCount}
                  </motion.span>
                )}
              </AnimatePresence>
              </motion.button>
            </Link>
          </div>

        </div>
      </nav>
      <AuthModal />
      <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onDetect={fetchLocation}
        onSelect={onSelectLocation}
        isLocating={isLocating}
      />
    </>
  );
}
