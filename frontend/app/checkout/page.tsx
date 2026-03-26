'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Navigation, Banknote, ShieldCheck, CheckCircle2, ChevronRight, ChevronUp, Clock, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';

const ManualMap = dynamic(() => import('@/components/ManualMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-80 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'ayushtomar061004-1@okaxis';
const UPI_NAME = process.env.NEXT_PUBLIC_UPI_NAME || 'Ayush Tomar';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, updateQuantity, clearCart } = useCart();
  const { user, setShowAuthModal } = useAuth();
  
  const [address, setAddress] = useState('');
  const [typedAddress, setTypedAddress] = useState('');
  const [autoLocation, setAutoLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  
  const [payment, setPayment] = useState<'upi' | 'cod'>('cod');
  const [notes, setNotes] = useState('');
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [finalTotal, setFinalTotal] = useState(0);

  useEffect(() => {
    if (items.length === 0 && !success) router.replace('/menu');
    
    // Try to get default address
    if (user) {
      axios.get(`${API}/api/user/addresses/`, { headers: { 'X-User-Email': user.email } })
        .then(res => {
          setSavedAddresses(res.data);
          if (res.data.length > 0 && !address) {
            const def = res.data.find((a: any) => a.is_default) || res.data[0];
            setAddress(`${def.line1}, ${def.city} - ${def.pincode}`);
            setLat(def.lat);
            setLng(def.lng);
          }
        }).catch(err => console.error(err));
    }
    
    // Auto populate macro location from global context
    if (typeof window !== 'undefined') {
      const savedLoc = localStorage.getItem('qc_location');
      const savedLat = localStorage.getItem('qc_lat');
      const savedLng = localStorage.getItem('qc_lng');
      if (savedLoc) setAutoLocation(savedLoc);
      if (savedLat && !lat) setLat(parseFloat(savedLat));
      if (savedLng && !lng) setLng(parseFloat(savedLng));
    }
  }, [user, items]);

  const handleLocate = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        axios.get(`${API}/api/location/reverse/?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`)
          .then(res => {
            if (res.data.address) {
              setAddress(res.data.address);
              toast.success('Location found!');
            }
          })
          .catch(() => toast.error('Could not map coordinates to address'))
          .finally(() => setLocating(false));
      },
      () => {
        toast.error('Location permission denied');
        setLocating(false);
      }
    );
  };

  const currentCalculatedTotal = items.length > 0 ? (total - Math.floor(total * 0.1) + 40) : 0;

  const hasFood = items.some(i => !['essentials', 'grocery'].includes(i.category_name?.toLowerCase() || ''));
  const hasEssentials = items.some(i => ['essentials', 'grocery'].includes(i.category_name?.toLowerCase() || ''));
  let etaRange = '30-35 mins'; 
  if (hasFood && hasEssentials) etaRange = '40-45 mins';
  else if (hasEssentials && !hasFood) etaRange = '20 mins';

  const handlePlaceOrder = async () => {
    if (!user) {
      toast.error('Please log in to place your order', { icon: '🙋' });
      setShowAuthModal(true);
      return;
    }
    
    const finalAddress = address ? address.trim() : (typedAddress.trim() ? `${typedAddress}, ${autoLocation || 'India'}` : '');
    if (!finalAddress) { toast.error('Delivery address is required (House/Flat No.)'); return; }
    
    setLoading(true);
    try {
      const payload = {
        email: user?.email,
        name: user?.name,
        phone: user?.phone,
        address: finalAddress,
        lat,
        lng,
        payment_method: payment,
        notes: scheduledTime ? `[SCHEDULED: ${scheduledTime}] ${notes}` : notes,
        items: items.map(i => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity }))
      };
      
      const res = await axios.post(`${API}/api/orders/place/`, payload);
      setOrderId(res.data.order_id);
      localStorage.setItem('activeOrderId', res.data.order_id.toString());
      setFinalTotal(currentCalculatedTotal);
      setSuccess(true);
      clearCart();
      setTimeout(() => router.push(`/orders/${res.data.order_id}`), 1000);
    } catch (err) {
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center text-center px-4 overflow-y-auto pt-20 pb-10">
        <Confetti width={typeof window !== 'undefined' ? window.innerWidth : 400} height={typeof window !== 'undefined' ? window.innerHeight : 800} recycle={false} numberOfPieces={500} />
        
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
          <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
        </motion.div>
        
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="text-3xl font-black mb-2">
          Order Confirmed! 🎉
        </motion.h1>
        
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-gray-400 mb-8">
          Your food is being prepared. Check your email for details.
        </motion.p>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="text-green-400 text-sm font-bold bg-green-500/10 px-6 py-3 rounded-full border border-green-500/20">
          Redirecting to live tracking...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-40 bg-black min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 sticky top-14 z-20 bg-[#0a0a0a] border-b border-white/5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white hover:text-green-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <h1 className="text-lg font-black leading-tight text-white mb-0.5">Checkout</h1>
          <p className="text-[#22c55e] text-xs font-bold leading-none">{items.length} items</p>
        </div>
      </div>

      <div className="p-3 space-y-3">
        
        {/* Top Floating Savings Strip */}
        <div className="bg-gradient-to-r from-green-500/20 to-green-600/10 border-l-4 border-green-500 rounded-lg p-3 flex items-center justify-center gap-2">
          <span>🎉</span> 
          <span className="text-green-400 font-bold text-sm">You saved ₹{Math.floor(total * 0.1)} with PRO</span>
        </div>

        {/* 1. Added Items Card */}
        <section className="bg-[#1c1c1c] rounded-[20px] p-4">
          <h2 className="font-bold text-white mb-3">Items Added</h2>
          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-white/5">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0 border border-white/5">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xs">🍔</span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-tight max-w-[140px] truncate">{item.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[11px] text-green-400 font-bold">₹{(item.price || 0)}</p>
                      <div className="flex items-center gap-2 bg-white/5 rounded-lg px-2 py-1 ml-1 scale-90 origin-left border border-white/10">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-gray-400 hover:text-white transition-colors">-</button>
                        <span className="text-[10px] font-black text-white w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-green-500 hover:text-white transition-colors">+</button>
                      </div>
                    </div>
                  </div>
                </div>
                <span className="font-black text-white text-sm">₹{(item.price || 0) * (item.quantity || 1)}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Delivery Estimate Card */}
        <section className="bg-[#1c1c1c] rounded-[20px] p-4 flex gap-4">
          <div className="text-green-500 mt-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M11 21L12.5 13H7.5L13 3L11.5 11H16.5L11 21Z"/></svg>
          </div>
          <div>
            <h2 className="font-bold text-white mb-1">
              {scheduledTime ? `Scheduled for ${scheduledTime}` : `Delivery in ${etaRange}`}
            </h2>
            <p className="text-gray-400 text-xs">
              {scheduledTime ? 'Changed your mind?' : 'Want this later?'} 
              <button onClick={() => setShowScheduleModal(true)} className="ml-1 text-white underline decoration-dashed">
                {scheduledTime ? 'Change Time' : 'Schedule it'}
              </button>
            </p>
          </div>
        </section>

        {/* 2. Address Card */}
        <section className="bg-[#1c1c1c] rounded-[20px] p-4">
          <div className="flex gap-4">
            <div className="text-gray-400 mt-1">
              <MapPin size={20} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-3">
                <h2 className="font-bold text-white">Delivery Address</h2>
                <div className="flex gap-2">
                  <button onClick={() => setShowAddressModal(true)} className="text-white text-[10px] font-bold bg-white/10 px-2 py-1 rounded uppercase tracking-wider">
                    SAVED
                  </button>
                  {address && (
                    <button onClick={() => setAddress('')} className="text-red-400 text-[10px] font-bold bg-red-400/10 px-2 py-1 rounded uppercase tracking-wider">
                      CLEAR
                    </button>
                  )}
                </div>
              </div>
              
              {address ? (
                <div className="bg-black/30 p-3 rounded-xl border border-white/5 mb-3">
                  <p className="text-gray-300 text-sm leading-relaxed">{address}</p>
                </div>
              ) : (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 bg-green-500/10 p-2.5 rounded-xl border border-green-500/20">
                     <span className="flex w-5 h-5 bg-green-500/20 items-center justify-center rounded-full text-green-500 shrink-0 text-xs">📍</span>
                     <span className="text-green-400 text-xs font-bold leading-tight line-clamp-2">
                       {autoLocation || 'Auto-detecting location...'}
                     </span>
                  </div>
                  <input
                    className="w-full bg-black/50 text-white text-sm p-3 rounded-xl border border-white/10 outline-none focus:border-green-500 transition-colors"
                    placeholder="House/Flat No., Building Name"
                    onChange={(e) => setTypedAddress(e.target.value)}
                    value={typedAddress}
                  />
                </div>
              )}

              <input
                className="w-full bg-transparent text-white text-xs border-b border-gray-700 pb-2 mb-4 outline-none placeholder:text-gray-500"
                placeholder="Add instructions for delivery partner"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />

              <div className="flex justify-between items-center py-3 border-y border-white/5">
                <span className="text-white text-sm font-semibold">{user?.name || 'Guest'}, {user?.phone || 'Add phone number'}</span>
                <ChevronRight size={16} className="text-gray-500" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. Bill Details Card */}
        <section className="bg-[#1c1c1c] rounded-[20px] p-4">
          <h2 className="font-bold text-white mb-3">Bill Details</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Item Total</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between text-green-400">
              <span>Platform Discount</span>
              <span>-₹{Math.floor(total * 0.1)}</span>
            </div>
            <div className="flex justify-between text-gray-400 border-b border-white/5 pb-3">
              <span>Delivery Partner Fee</span>
              <span>₹40</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-white pt-1">
              <span>Total Bill</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm line-through">₹{(total || 0) + 40}</span>
                <span>₹{(total || 0) - Math.floor((total || 0) * 0.1) + 40}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Donation/Extra Card (Optional) */}
        <section className="bg-gradient-to-br from-[#2a1b1b] to-[#1c1212] rounded-[20px] p-4 border border-red-900/30">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-white mb-1">Let's serve a brighter future</h3>
              <p className="text-gray-400 text-xs w-4/5">Empower young minds through nutritious meals.</p>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
            <span className="font-bold text-sm">Donate to Feeding India</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 border border-gray-600 rounded px-2 py-1">₹3 <span className="ml-1 text-[10px]">✏️</span></span>
              <button className="text-red-400 font-bold text-sm bg-red-400/10 px-4 py-1.5 rounded-lg">ADD</button>
            </div>
          </div>
        </section>

        {/* 4. Payment Method Selection */}
        <section className="bg-[#1c1c1c] rounded-[20px] p-4">
          <h2 className="font-bold text-white mb-4">Payment Method</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayment('upi')}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                payment === 'upi' ? 'bg-green-500/10 border-green-500' : 'bg-black/40 border-white/5 opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center p-2">
                <svg viewBox="0 0 512 512" fill="none" className="w-full h-full text-blue-400"><path d="M414.9 144.9l-159-159L96.9 144.9l45.2 45.2 81.9-81.9V498.4h64V108.2l81.9 81.9 45.1-45.2z" fill="currentColor"/></svg>
              </div>
              <span className="text-xs font-black text-white uppercase tracking-wider text-center">Pay via UPI</span>
            </button>

            <button
              onClick={() => setPayment('cod')}
              className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                payment === 'cod' ? 'bg-green-500/10 border-green-500' : 'bg-black/40 border-white/5 opacity-60'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Banknote size={22} className="text-green-400" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-wider text-center">Cash on Delivery</span>
            </button>
          </div>
        </section>

        {/* Payment Prompt QR */}
        <AnimatePresence>
          {payment === 'upi' && (
            <motion.section 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }}
              className="bg-[#1c1c1c] rounded-[20px] p-4 border border-green-500/20 overflow-hidden"
            >
              <h2 className="font-bold text-white mb-3 text-center">Scan to Pay</h2>
              <div className="bg-white p-3 rounded-xl mx-auto w-fit mb-3">
                <QRCodeSVG value={`upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${currentCalculatedTotal}&cu=INR&tn=QuickCombo Order`} size={150} level="H" includeMargin={false} />
              </div>
              <p className="text-center text-green-400 font-black text-lg">₹{currentCalculatedTotal}</p>
              <p className="text-center text-gray-500 text-xs font-medium">UPI ID: {UPI_ID}</p>
            </motion.section>
          )}
        </AnimatePresence>

      </div>

      {/* Floating Action Bar (Zomato Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-[#1c1c1c] border-t border-white/5 p-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        
        {/* Payment Method Display */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
            {payment === 'upi' ? (
              <svg viewBox="0 0 512 512" fill="none" className="w-5 h-5 text-blue-400"><path d="M414.9 144.9l-159-159L96.9 144.9l45.2 45.2 81.9-81.9V498.4h64V108.2l81.9 81.9 45.1-45.2z" fill="currentColor"/></svg>
            ) : (
              <Banknote size={20} className="text-green-500" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Payment</span>
            <span className="text-xs font-black text-white">{payment === 'upi' ? 'UPI' : 'Cash on Delivery'}</span>
          </div>
        </div>

        {/* Place Order Button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handlePlaceOrder}
          disabled={loading || items.length === 0}
          className="bg-green-500 hover:bg-green-400 text-black rounded-[14px] px-6 py-3.5 flex items-center gap-3 min-w-[160px] shadow-[0_4px_16px_rgba(34,197,94,0.3)] disabled:opacity-50"
        >
          <div className="flex flex-col items-start border-r border-black/20 pr-3">
            <span className="text-[15px] font-black leading-none">₹{currentCalculatedTotal}</span>
            <span className="text-[10px] font-bold text-black/70">TOTAL</span>
          </div>
          <div className="flex items-center font-black text-[15px]">
            Place Order <ChevronRight size={18} strokeWidth={3} className="ml-1" />
          </div>
        </motion.button>
      </div>

      {/* Address Selection Modal */}
      <AnimatePresence>
        {showAddressModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[110] bg-[#1a1a1a] rounded-t-3xl p-5 pb-8 max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-6" />
              <h2 className="text-xl font-black text-white mb-4">Select Delivery Address</h2>
              
              {savedAddresses.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No saved addresses found. Please enter one manually or use GPS.</p>
              ) : (
                <div className="space-y-3">
                  {savedAddresses.map(addr => (
                    <button 
                      key={addr.id}
                      onClick={() => {
                        setAddress(`${addr.line1}, ${addr.city} - ${addr.pincode}`);
                        setLat(addr.lat);
                        setLng(addr.lng);
                        setShowAddressModal(false);
                      }}
                      className="w-full text-left bg-black/50 p-4 rounded-2xl border border-white/10 flex items-start gap-3 active:scale-[0.98] transition-all"
                    >
                      <MapPin className="text-green-500 shrink-0 mt-0.5" size={20} />
                      <div>
                        <p className="font-bold text-white text-sm flex items-center gap-2">
                          {addr.label} {addr.is_default && <span className="bg-green-500/20 text-green-400 text-[10px] px-2 py-0.5 rounded uppercase">Default</span>}
                        </p>
                        <p className="text-gray-400 text-xs mt-1 leading-relaxed">{addr.line1}, {addr.city} - {addr.pincode}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Schedule Modal */}
      <AnimatePresence>
        {showScheduleModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowScheduleModal(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[110] bg-[#1a1a1a] rounded-t-3xl p-6 pb-10"
            >
              <h2 className="text-xl font-black text-white mb-6">Schedule Delivery</h2>
              <div className="grid grid-cols-2 gap-3 pb-4">
                {['Today, 8:00 PM', 'Today, 9:00 PM', 'Tomorrow, 10:00 AM', 'Tomorrow, 1:00 PM'].map(th => (
                  <button 
                    key={th}
                    onClick={() => { setScheduledTime(th); setShowScheduleModal(false); }}
                    className="p-4 rounded-2xl bg-black/40 border border-white/5 text-sm font-bold text-gray-300 hover:border-green-500 hover:text-green-500 transition-all text-center"
                  >
                    {th}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => { setScheduledTime(null); setShowScheduleModal(false); }}
                className="w-full py-4 text-gray-500 font-bold text-sm"
              >
                Reset to instant delivery
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manual Map Picker Modal */}
      <AnimatePresence>
        {showMapModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowMapModal(false)}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-4 md:inset-x-auto md:max-w-md md:mx-auto top-20 bottom-20 z-[110] bg-[#1a1a1a] rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-white/10"
            >
              <div className="flex-1 relative bg-gray-900">
                <ManualMap 
                  lat={lat || 28.6139} 
                  lng={lng || 77.2090} 
                  onSelect={(lt, ln) => {
                    setLat(lt);
                    setLng(ln);
                  }}
                />
                <div className="absolute top-4 left-4 right-4 z-[400]">
                   <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                         <Navigation size={16} />
                      </div>
                      <p className="text-[10px] text-gray-300 font-medium leading-tight">Drag marker to your exact location for precise delivery.</p>
                   </div>
                </div>
              </div>
              <div className="p-6 bg-[#1a1a1a] border-t border-white/5">
                <button 
                  onClick={() => {
                    if (lat && lng) {
                       setLocating(true);
                       axios.get(`${API}/api/location/reverse/?lat=${lat}&lng=${lng}`)
                        .then(res => {
                          if (res.data.address) setAddress(res.data.address);
                        })
                        .finally(() => {
                           setLocating(false);
                           setShowMapModal(false);
                        });
                    } else {
                       setShowMapModal(false);
                    }
                  }}
                  className="w-full bg-green-500 text-black font-black py-4 rounded-2xl shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                  Confirm This Location
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
