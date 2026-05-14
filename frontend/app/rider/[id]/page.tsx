'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin, Package, CheckCircle2, AlertTriangle, Play, Pause, Compass } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function RiderTrackingPage() {
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState<{lat: number, lng: number} | null>(null);
  const [loading, setLoading] = useState(true);
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    fetchOrder();

    return () => {
        stopTracking();
    };
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await axios.get(`${API}/api/orders/${params.id}/`);
      setOrder(res.data);
    } catch (err) {
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    toast.success('Live tracking started!');

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentPos({ lat: latitude, lng: longitude });
        
        // Sync to DB (Persistent and available for ultra-fast polling on customer side)
        updateLocationOnServer(latitude, longitude);
      },
      (error) => {
        console.error(error);
        toast.error('Location error: ' + error.message);
        stopTracking();
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setIsTracking(false);
    toast.error('Tracking paused');
  };

  const updateLocationOnServer = async (lat: number, lng: number) => {
    try {
      await axios.post(`${API}/api/orders/${params.id}/update-location/`, { lat, lng });
    } catch (err) {
      console.error('Failed to sync location to DB');
    }
  };

  const updateStatus = async (newStatus: string) => {
    try {
      await axios.get(`${API}/api/orders/${params.id}/?new_status=${newStatus}`);
      setOrder({...order, status: newStatus});
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}`);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
       <AlertTriangle className="text-yellow-500 mb-4" size={48} />
       <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
       <p className="text-gray-400">Please verify the order ID or contact support.</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 pb-24 font-sans">
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-[32px] p-6 mb-4 border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-gray-500 text-xs font-black uppercase tracking-widest mb-1">Active Delivery</p>
            <h1 className="text-2xl font-black">Order #{order.id}</h1>
          </div>
          <div className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-full text-xs font-bold border border-green-500/20">
            {order.status.replace('_', ' ')}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/5 rounded-xl text-gray-400"><MapPin size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Delivery Address</p>
              <p className="font-medium text-gray-200">{order.delivery_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white/5 rounded-xl text-gray-400"><Package size={20} /></div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Customer Details</p>
              <p className="font-medium text-gray-200">{order.user_name} • {order.user_phone}</p>
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Order Contents Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-[32px] p-6 mb-4 border border-white/5"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest">Order Contents</h3>
          <div className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase text-gray-400 border border-white/5">
            {order.items?.length || 0} {order.items?.length === 1 ? 'Item' : 'Items'}
          </div>
        </div>
        
        <div className="space-y-3 mb-6">
          {order.items?.map((item: any, idx: number) => (
            <div key={idx} className="flex flex-col bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center text-green-500 font-black text-sm">
                    {item.quantity}
                  </div>
                  <div>
                    <span className="font-bold text-gray-200 block">{item.name}</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">📍 {item.restaurant_name}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-500 italic block">₹{item.price * item.quantity}</span>
                  <span className="text-[9px] text-gray-600 font-bold uppercase">₹{item.price} ea</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {order.notes && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2 text-amber-500">
               <AlertTriangle size={14} />
               <span className="text-[10px] font-black uppercase tracking-widest">Special Request</span>
            </div>
            <p className="text-sm text-amber-200/80 font-medium italic">"{order.notes}"</p>
          </div>
        )}

        {/* Payment Summary */}
        <div className="border-t border-white/5 pt-6 space-y-3 mb-6">
           <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold uppercase tracking-tighter">Item Total</span>
              <span className="font-mono text-gray-300">₹{order.subtotal}</span>
           </div>
           <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 font-bold uppercase tracking-tighter">Delivery Partner Fee</span>
              <span className="font-mono text-gray-300">₹{order.delivery_fee}</span>
           </div>
           
           {/* Dynamic Calculation for Packing/Taxes/Adjustments to ensure math adds up for the rider */}
           {(() => {
             const sub = parseFloat(order.subtotal) || 0;
             const del = parseFloat(order.delivery_fee) || 0;
             const disc = parseFloat(order.discount_amount) || 0;
             const total = parseFloat(order.total) || 0;
             const other = total - (sub + del - disc);
             
             if (Math.abs(other) > 0.01) {
               return (
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 font-bold uppercase tracking-tighter">
                      {other > 0 ? 'Packing & Taxes' : 'Adjustments'}
                    </span>
                    <span className={`font-mono ${other > 0 ? 'text-gray-300' : 'text-green-500'}`}>
                      {other > 0 ? '' : '-' }₹{Math.abs(other).toFixed(2)}
                    </span>
                 </div>
               );
             }
             return null;
           })()}

           {parseFloat(order.discount_amount) > 0 && (
             <div className="flex justify-between items-center text-xs">
                <span className="text-emerald-500/80 font-bold uppercase tracking-tighter">Coupon Discount</span>
                <span className="font-mono text-emerald-500">-₹{order.discount_amount}</span>
             </div>
           )}
           
           <div className="flex justify-between items-center pt-4 border-t border-white/5">
              <div>
                <span className="text-lg font-black uppercase italic text-white block leading-none">To Collect</span>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-2 px-2 py-0.5 rounded-md inline-block ${order.payment_method === 'cod' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {order.payment_method === 'cod' ? '💵 Cash on Delivery' : '📱 Paid Online'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-emerald-500 italic leading-none">₹{order.total}</span>
                <p className="text-[9px] text-gray-500 font-bold uppercase mt-1">Final Invoice Value</p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col justify-center">
                <p className="text-[9px] text-gray-500 font-bold uppercase mb-1 text-center">Customer</p>
                <p className="text-xs font-black text-white text-center truncate">{order.user_name || 'Guest'}</p>
            </div>
            <a href={`tel:${order.user_phone}`} className="bg-green-500/10 p-4 rounded-2xl border border-green-500/20 flex flex-col justify-center">
                <p className="text-[9px] text-green-500/70 font-bold uppercase mb-1 text-center">Call Now</p>
                <p className="text-xs font-black text-green-500 text-center">{order.user_phone}</p>
            </a>
        </div>
      </motion.div>



      {/* Tracking Controls */}
      <div className="grid grid-cols-1 gap-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={isTracking ? stopTracking : startTracking}
          className={`w-full py-6 rounded-[32px] flex flex-col items-center justify-center gap-3 transition-all border-2 ${
            isTracking 
            ? 'bg-red-500/10 border-red-500/20 text-red-500' 
            : 'bg-green-500 border-green-600 text-black'
          }`}
        >
          {isTracking ? (
            <>
              <div className="p-4 bg-red-500/20 rounded-full animate-pulse"><Pause size={32} fill="currentColor" /></div>
              <span className="font-black text-xl uppercase italic">Pause Tracking</span>
            </>
          ) : (
            <>
              <div className="p-4 bg-black/10 rounded-full"><Play size={32} fill="currentColor" /></div>
              <span className="font-black text-xl uppercase italic tracking-wider">Start Delivery</span>
            </>
          )}
        </motion.button>

        {/* Live Status Card */}
        <AnimatePresence>
          {isTracking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-[32px] p-6 border border-green-500/20 flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="absolute top-2 left-2 w-2 h-2 bg-green-500 rounded-full animate-ping" />
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-4">
                <Compass size={32} className="animate-[spin_4s_linear_infinite]" />
              </div>
              <h2 className="text-xl font-bold text-green-400 mb-1">Syncing Live Location</h2>
              <p className="text-gray-500 text-sm">Your coordinates are being shared with the customer every few seconds.</p>
              
              {currentPos && (
                <div className="mt-4 px-4 py-2 bg-white/5 rounded-full text-[10px] font-mono text-gray-500">
                  LAT: {currentPos.lat.toFixed(6)} • LNG: {currentPos.lng.toFixed(6)}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions */}
        <div className="glass rounded-[32px] p-6 border border-white/5">
          <h3 className="text-gray-500 text-xs font-black uppercase tracking-widest mb-4 text-center">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => updateStatus('out_for_delivery')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
            >
              <Package size={24} className="mb-2 text-blue-400" />
              <span className="text-xs font-bold text-gray-300">Picked Up</span>
            </button>
            <button 
              onClick={() => updateStatus('delivered')}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all"
            >
              <CheckCircle2 size={24} className="mb-2 text-green-500" />
              <span className="text-xs font-bold text-green-400">Delivered</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Status Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm glass backdrop-blur-2xl rounded-2xl p-4 border border-white/10 shadow-2xl z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-600'}`} />
          <span className="text-sm font-bold">{isTracking ? 'Live Tracking On' : 'Offline'}</span>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="text-xs font-black text-green-400 uppercase tracking-widest"
        >
          Refresh
        </button>
      </div>

      <style jsx global>{`
        .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); }
      `}</style>
    </div>
  );
}
