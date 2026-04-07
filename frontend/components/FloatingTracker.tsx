'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Bike, ChevronRight, X, Clock, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function FloatingTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrder = useCallback(async () => {
    if (!user?.email) {
      setVisible(false);
      return;
    }
    try {
      const res = await axios.get(`${API}/api/orders/active/`, {
        headers: { 'X-User-Email': user.email }
      });
      
      if (res.data && !['delivered', 'cancelled'].includes(res.data.status)) {
        setActiveOrder(res.data);
        setVisible(true);
        // Save to local storage for instant flash on next load
        localStorage.setItem('activeOrderId', res.data.id.toString());
      } else {
        setVisible(false);
        localStorage.removeItem('activeOrderId');
      }
    } catch (err) {
      console.error('Tracker sync failed', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchActiveOrder();
    const interval = setInterval(fetchActiveOrder, 20000); // 20s sync
    return () => clearInterval(interval);
  }, [fetchActiveOrder]);

  if (pathname.includes('/admin') || pathname.includes('/portal')) return null;
  if (!visible || !activeOrder) return null;

  const getStepLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Order Sent';
      case 'confirmed': return 'Confirmed';
      case 'preparing': return 'Preparing your food';
      case 'out_for_delivery': return 'Rider is on the way';
      default: return status;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 100, opacity: 0, scale: 0.9 }}
        className="fixed bottom-24 left-3 right-3 z-[90] max-w-sm mx-auto"
      >
        <Link href={`/orders/${activeOrder.id}`}>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden bg-[#1a1a1a]/80 backdrop-blur-2xl rounded-[24px] p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-between transition-all hover:border-green-500/30"
          >
            {/* Animated background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex items-center gap-3.5 relative z-10">
              <div className="relative">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-400/20 to-green-600/10 flex items-center justify-center text-green-500 border border-green-500/20">
                   <Bike className={activeOrder.status === 'out_for_delivery' ? "animate-bounce" : ""} size={20} />
                </div>
                {activeOrder.status === 'preparing' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-[#1a1a1a]">
                    <Clock size={8} className="text-black" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 mb-0.5">
                   <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em]">Live Tracking</span>
                   <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                </div>
                <h4 className="text-white font-black text-sm leading-tight">
                  {getStepLabel(activeOrder.status)}
                </h4>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center gap-1">
                   Order #QC{activeOrder.id.toString().padStart(4, '0')} <ChevronRight size={10} />
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 relative z-10">
               <div className="text-right mr-1">
                  <p className="text-[10px] font-black text-white">ETA</p>
                  <p className="text-xs font-bold text-gray-500">Soon</p>
               </div>
               <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-green-500 group-hover:text-black transition-all">
                  <ChevronRight size={18} />
               </div>
            </div>
          </motion.div>
        </Link>
        
        {/* Compact close trigger */}
        <button 
          onClick={(e) => { e.preventDefault(); setVisible(false); }}
          className="absolute -top-1 -right-1 w-6 h-6 bg-black/80 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors z-20 shadow-lg"
        >
          <X size={12} />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
