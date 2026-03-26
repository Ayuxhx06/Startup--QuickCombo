'use client';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Phone, Package, ArrowLeft, MoreVertical, Compass, Star, QrCode } from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { AnimatePresence } from 'framer-motion';

// Map component must be loaded dynamically in Next.js to avoid SSR window errors
import dynamic from 'next/dynamic';
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full shimmer bg-gray-800" />
});

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  
  const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'ayushtomar061004-1@okaxis';
  const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || 'Ayush Tomar';

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    
    // Fetch initial order details
    axios.get(`${API}/api/orders/${params.id}/`)
      .then(res => {
        setOrder(res.data);
        if (res.data.payment_method === 'upi' && res.data.payment_status === 'pending') {
          setShowQr(true);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/orders');
        setLoading(false);
      });

    // Start tracking poll
    const p = setInterval(pollTracking, 5000);
    pollTracking(); // initial call
    
    return () => clearInterval(p);
  }, [params.id, user]);

  const pollTracking = () => {
    axios.get(`${API}/api/orders/${params.id}/tracking/`)
      .then(res => setTracking(res.data))
      .catch(console.error);
  };

  if (loading) return (
    <div className="page-wrapper min-h-screen bg-black flex flex-col pt-14 p-4 space-y-4">
      <div className="h-64 rounded-3xl shimmer" />
      <div className="h-40 rounded-3xl shimmer" />
    </div>
  );
  if (!order || !tracking) return null;

  return (
    <div className="page-wrapper min-h-screen bg-black flex flex-col pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-2 sticky top-0 z-20 bg-black/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/orders"><ArrowLeft className="text-gray-400 hover:text-white" /></Link>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <span className="text-gray-500">Order</span> #{order.id}
          </h1>
        </div>
        <div className="flex gap-2">
          {order.payment_method === 'upi' && (
            <button 
               onClick={() => setShowQr(true)} 
               className="p-2 bg-green-500/10 text-green-400 rounded-lg shadow-sm border border-green-500/20 active:scale-95 transition-all"
            >
              <QrCode size={18} />
            </button>
          )}
          <button className="p-2 glass rounded-lg"><MoreVertical size={18} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Map Section */}
        <div className="h-64 w-full rounded-3xl overflow-hidden glass border-2 border-white/5 relative z-0">
          {(tracking.rider_lat && tracking.delivery_lat) ? (
            <TrackingMap 
              riderLat={tracking.rider_lat} riderLng={tracking.rider_lng}
              deliveryLat={tracking.delivery_lat} deliveryLng={tracking.delivery_lng}
              restaurantLat={tracking.restaurant_lat} restaurantLng={tracking.restaurant_lng}
            />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50">
               <Compass size={32} className="text-gray-600 mb-2 animate-pulse" />
               <p className="text-gray-500 text-sm font-medium">Map available when out for delivery</p>
             </div>
          )}
          
          {/* Estimated ETA pill over map */}
          {tracking.status === 'out_for_delivery' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full z-[400] shadow-lg flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 pulse-green" />
              <span className="font-bold text-sm">Arriving in <span className="text-green-400">{tracking.eta_string || 'few min'}</span></span>
            </div>
          )}
        </div>

        {/* Timeline Status */}
        <div className="glass-green rounded-3xl p-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Package size={18} className="text-green-400" /> Tracking Status
          </h2>
          
          <div className="relative pl-6 space-y-6">
            <div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-gray-800 rounded-full" />
            
            {tracking.steps.map((step: any, i: number) => {
              const prevDone = i === 0 || tracking.steps[i - 1].done;
              const isCurrent = step.done && (i === tracking.steps.length - 1 || !tracking.steps[i + 1].done);
              
              return (
                <div key={step.key} className="relative flex items-center gap-4">
                  {/* Line overlap for active state */}
                  {step.done && i > 0 && (
                    <div className="absolute top-0 bottom-full -mt-6 left-[-5px] w-0.5 bg-green-500 rounded-full" />
                  )}
                  
                  {/* Dot */}
                  <div className={`absolute -left-6 w-5 h-5 rounded-full border-[3px] z-10 bg-black ${
                    isCurrent ? 'border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]' :
                    step.done ? 'border-green-500 bg-green-500' : 'border-gray-700' // Changed to valid colors
                  }`}>
                    {step.done && !isCurrent && <div className="absolute inset-0 m-auto w-1 h-1 bg-black rounded-full" />}
                  </div>
                  
                  {/* Text */}
                  <div className={`flex-1 ${!prevDone ? 'opacity-40' : ''}`}>
                    <h3 className={`font-bold text-sm ${step.done ? 'text-white' : 'text-gray-500'}`}>
                      {step.label}
                    </h3>
                    {isCurrent && (
                      <p className="text-green-400 text-xs font-medium mt-0.5">
                        {step.key === 'out_for_delivery' ? 'Rider is on the way' : 'We are processing your order'}
                      </p>
                    )}
                  </div>
                  <div className={`text-xl ${!prevDone ? 'opacity-40 grayscale' : ''}`}>{step.icon}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rider / Delivery Details */}
        <div className="glass rounded-3xl p-5">
          <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-3">Delivery Details</h3>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-500/10 rounded-xl text-green-400"><MapPin size={18} /></div>
            <div>
              <p className="font-medium text-sm text-gray-300">{order.delivery_address}</p>
              {order.notes && <p className="text-xs text-yellow-500 mt-1 pl-2 border-l-2 border-yellow-500/30">Note: {order.notes}</p>}
            </div>
          </div>
        </div>
      </div>
      
      {/* Persistent QR Code Modal */}
      <AnimatePresence>
        {showQr && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowQr(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed w-[90%] max-w-sm left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-[110] bg-[#1a1a1a] rounded-[32px] p-6 shadow-2xl border border-white/10 text-center"
            >
              <h2 className="font-bold text-white mb-4 tracking-widest uppercase text-xs">Scan to Pay</h2>
              <div className="bg-white p-4 rounded-3xl mx-auto inline-block mb-4 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                <QRCodeSVG value={`upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${order.total}&cu=INR&tn=QuickCombo Order`} size={180} level="H" includeMargin={false} />
              </div>
              <p className="text-green-400 font-black text-3xl mb-1">₹{order.total}</p>
              <p className="text-gray-500 text-xs font-medium bg-black/30 py-2.5 rounded-xl mx-4 mb-6">UPI ID: {UPI_ID}</p>
              
              <button 
                onClick={() => setShowQr(false)}
                className="w-full py-4 glass hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
              >
                Close
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
