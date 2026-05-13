'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  MapPin, Phone, Package, ArrowLeft, MoreVertical, 
  Compass, Star, QrCode, MessageSquare, PhoneCall,
  RefreshCw, ChevronRight, X, Store
} from 'lucide-react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';

// Map component must be loaded dynamically in Next.js to avoid SSR window errors
import dynamic from 'next/dynamic';
const TrackingMap = dynamic(() => import('@/components/TrackingMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full shimmer bg-gray-800" />
});

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [order, setOrder] = useState<any>(null);
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQr, setShowQr] = useState(false);
  const [showMessage, setShowMessage] = useState(true);

  const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'ayushtomar061004-1@okaxis';
  const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || 'Ayush Tomar';

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    
    // Fetch initial order details
    fetchOrder();

    // Ultra-fast Polling for smooth animation (2 seconds matches the Map animation duration)
    const p = setInterval(pollTracking, 2000);
    pollTracking(); // initial call
    
    return () => {
        clearInterval(p);
    };
  }, [params.id, user]);

  const fetchOrder = () => {
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
  };

  const pollTracking = () => {
    axios.get(`${API}/api/orders/${params.id}/tracking/`)
      .then(res => {
          setTracking(res.data);
      })
      .catch(console.error);
  };

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mb-4" />
      <p className="text-gray-500 font-bold animate-pulse">Syncing order details...</p>
    </div>
  );

  if (!order || !tracking) return null;

  return (
    <div className="h-screen w-full bg-black overflow-hidden flex flex-col relative font-sans">
      {/* Dynamic Background Map */}
      <div className="absolute inset-0 z-0">
        <TrackingMap 
          riderLat={tracking.rider_lat} riderLng={tracking.rider_lng}
          deliveryLat={tracking.delivery_lat} deliveryLng={tracking.delivery_lng}
          restaurantLat={tracking.restaurant_lat} restaurantLng={tracking.restaurant_lng}
        />
      </div>

      {/* Floating Header UI */}
      <div className="absolute top-0 left-0 w-full p-5 z-20 pointer-events-none">
        <div className="flex items-center justify-between mb-4 pointer-events-auto">
            <Link href="/orders" className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-black shadow-lg border border-white/20"><ArrowLeft size={20} /></Link>
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white/20 flex items-center gap-2">
                <Store size={14} className="text-green-600" />
                <span className="font-black text-[10px] uppercase tracking-wider text-gray-900">{order.restaurant_name || 'QuickCombo'}</span>
            </div>
            <button onClick={() => { fetchOrder(); pollTracking(); }} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center text-black shadow-lg border border-white/20"><RefreshCw size={18} className={loading ? 'animate-spin' : ''} /></button>
        </div>

        {/* Premium Status Pill */}
        <motion.div 
            initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="w-full bg-[#27A152] text-white p-6 rounded-[2.5rem] shadow-[0_20px_40px_rgba(39,161,82,0.3)] border border-white/20 pointer-events-auto relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl rounded-full -mr-16 -mt-16" />
            
            <div className="relative z-10 flex flex-col items-center text-center">
                <motion.h1 
                    key={tracking.status}
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-black mb-3 tracking-tighter"
                >
                    {tracking.status === 'delivered' ? 'Order Delivered 🎉' : 
                     tracking.status === 'out_for_delivery' ? 'Order is on the way 🤘' : 
                     tracking.status === 'preparing' ? 'Food is Preparing 👨‍🍳' : 
                     'Order Confirmed ✅'}
                </motion.h1>
                
                <div className="flex items-center gap-3 bg-white/20 px-5 py-2.5 rounded-full border border-white/20">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-widest">
                        {tracking.status === 'delivered' ? 'Arrived' : `Arriving in `}
                        {tracking.status !== 'delivered' && <span className="text-yellow-300">{tracking.eta_string || '8 mins'}</span>}
                    </span>
                </div>
            </div>
        </motion.div>
      </div>

      {/* Floating Bottom Action */}
      <div className="absolute bottom-10 left-0 w-full px-5 z-20 flex flex-col gap-4">
          <div className="flex justify-between items-end">
              <button onClick={() => setShowQr(true)} className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-black shadow-xl border border-gray-100 active:scale-90 transition-all">
                  <QrCode size={24} />
              </button>

              <button className="bg-blue-600 text-white rounded-full py-4 px-8 flex items-center gap-3 shadow-[0_10px_30px_rgba(37,99,235,0.4)] active:scale-95 transition-all border border-blue-400/20">
                  <Star size={18} fill="white" />
                  <span className="text-sm font-black uppercase tracking-widest italic">Collected coupons</span>
              </button>
          </div>
      </div>

      {/* QR Modal remains the same but styled more premium */}
      <AnimatePresence>
        {showQr && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowQr(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-0 left-0 w-full z-[110] bg-white rounded-t-[40px] p-8 shadow-2xl text-center"
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-8" />
              <h2 className="font-black text-2xl text-gray-900 mb-2">Scan to Pay</h2>
              <p className="text-gray-500 text-sm mb-8 font-medium">Please pay ₹{order.total} to confirm your order</p>
              
              <div className="bg-gray-50 p-6 rounded-[32px] mx-auto inline-block mb-8 border border-gray-100">
                <QRCodeSVG value={`upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${order.total}&cu=INR&tn=QuickCombo Order`} size={200} level="H" />
              </div>
              
              <div className="bg-green-50 text-green-700 py-4 px-6 rounded-2xl mb-8 font-bold text-lg">
                Total Amount: ₹{order.total}
              </div>
              
              <button onClick={() => setShowQr(false)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-bold text-lg active:scale-95 transition-all">
                Done
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .shimmer {
          background: linear-gradient(90deg, #f0f0f0 25%, #f8f8f8 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
