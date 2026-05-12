'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  MapPin, Phone, Package, ArrowLeft, MoreVertical, 
  Compass, Star, QrCode, MessageSquare, PhoneCall,
  RefreshCw, ChevronRight, X
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
    <div className="page-wrapper min-h-screen bg-[#F4F4F4] flex flex-col">
      {/* Zomato Style Green Header */}
      <div className="bg-[#27A152] text-white pt-12 pb-8 px-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 border-8 border-white rounded-full" />
            <div className="absolute top-20 -left-10 w-20 h-20 bg-white rounded-full" />
        </div>

        <div className="flex items-center justify-between mb-6 relative z-10">
            <Link href="/orders" className="p-2 -ml-2"><ArrowLeft size={24} /></Link>
            <span className="font-bold text-sm opacity-80">{order.restaurant_name || 'QuickCombo'}</span>
            <button className="p-2 -mr-2" onClick={() => { fetchOrder(); pollTracking(); }}><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
        </div>

        <div className="text-center relative z-10">
            <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                key={tracking.status}
                className="text-3xl font-black mb-4 tracking-tight"
            >
                {tracking.status === 'delivered' ? 'Order Delivered 🎉' : 
                 tracking.status === 'out_for_delivery' ? 'Order is on the way 🤘' : 
                 tracking.status === 'preparing' ? 'Food is Preparing 👨‍🍳' : 
                 'Order Confirmed ✅'}
            </motion.h1>
            
            <div className="inline-flex items-center gap-3 bg-black/10 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/20">
                <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-[0_0_10px_white]" />
                <span className="font-bold">
                    {tracking.status === 'delivered' ? 'Arrived' : `Arriving in `}
                    {tracking.status !== 'delivered' && <span className="text-yellow-300">{tracking.eta_string || '8 mins'}</span>}
                </span>
                <div className="w-px h-4 bg-white/20 mx-1" />
                <button onClick={pollTracking}><RefreshCw size={14} /></button>
            </div>
        </div>
      </div>

      {/* Message Notification */}
      <AnimatePresence>
        {showMessage && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-4 relative"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                <MessageSquare size={20} />
            </div>
            <div className="flex-1">
                <p className="text-[13px] font-medium text-gray-600 leading-tight">
                    You have <span className="font-bold text-black">1 new message</span> from the delivery partner
                </p>
            </div>
            <button onClick={() => toast("Chat is currently unavailable. Please call the rider.", { icon: '⚠️' })} className="text-[#E23744] font-bold text-xs uppercase tracking-wider">Chat Now</button>
            <button onClick={() => setShowMessage(false)} className="ml-2 text-gray-300"><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative">
        {/* Full Width Map */}
        <div className="absolute inset-0 z-0">
          <TrackingMap 
            riderLat={tracking.rider_lat} riderLng={tracking.rider_lng}
            deliveryLat={tracking.delivery_lat} deliveryLng={tracking.delivery_lng}
            restaurantLat={tracking.restaurant_lat} restaurantLng={tracking.restaurant_lng}
          />
        </div>

        {/* Floating Actions */}
        <div className="absolute bottom-6 left-0 w-full px-5 flex flex-col gap-3 z-10">
            {/* Rider Info Card */}
            <div className="bg-white rounded-3xl p-5 shadow-[0_10px_30px_rgba(0,0,0,0.1)] flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-full overflow-hidden relative">
                        <img src="https://ui-avatars.com/api/?name=Rider&background=27A152&color=fff" alt="Rider" />
                    </div>
                    <div>
                        <h3 className="font-black text-gray-900 leading-none mb-1">Dinesh (Rider)</h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Star size={10} fill="#FFD700" className="text-[#FFD700]" /> 4.9 • Delivery Partner
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => toast("Chat is currently unavailable.", { icon: '⚠️' })} className="w-11 h-11 bg-gray-50 rounded-full flex items-center justify-center text-gray-700 border border-gray-100 active:scale-90 transition-all">
                        <MessageSquare size={18} />
                    </button>
                    <button onClick={() => toast("Calling rider...", { icon: '📞' })} className="w-11 h-11 bg-[#27A152] rounded-full flex items-center justify-center text-white shadow-[0_5px_15px_rgba(39,161,82,0.3)] active:scale-90 transition-all">
                        <PhoneCall size={18} />
                    </button>
                </div>
            </div>

            {/* Collected Coupons Pill */}
            <button className="bg-[#4169E1] text-white rounded-full py-3.5 px-6 self-end flex items-center gap-2 shadow-lg active:scale-95 transition-all">
                <Star size={16} fill="white" />
                <span className="text-sm font-bold">Collected coupons</span>
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
