'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import Confetti from 'react-confetti';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Navigation, Banknote, ShieldCheck, CheckCircle2, ChevronRight, ChevronUp, Clock, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import Script from 'next/script';

const ManualMap = dynamic(() => import('@/components/ManualMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-80 bg-gray-900 rounded-2xl flex items-center justify-center text-gray-400">Loading Map...</div>
});

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, updateQuantity, clearCart, specialRequests, clearSpecialRequests } = useCart();
  const { user, setShowAuthModal } = useAuth();
  
  const [address, setAddress] = useState('');
  const [typedAddress, setTypedAddress] = useState('');
  const [autoLocation, setAutoLocation] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  
  const [payment, setPayment] = useState<'cod' | 'online'>('online');
  const [notes, setNotes] = useState('');
  const [scheduledTime, setScheduledTime] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [finalTotal, setFinalTotal] = useState(0);
  
  // -- Delivery / Contact Details --
  const [fullName, setFullName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || '');
  const [ordersEnabled, setOrdersEnabled] = useState(true);
  const [ordersDisabledMessage, setOrdersDisabledMessage] = useState('');
  
  // -- Promo / Coupon States --
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [deliveryFee, setDeliveryFee] = useState(40);
  const [showAllCoupons, setShowAllCoupons] = useState(false);

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
    
    // Fetch available coupons
    axios.get(`${API}/api/coupons/`)
      .then(res => setAvailableCoupons(res.data))
      .catch(err => console.error('Error fetching coupons:', err));
    
    // Auto populate macro location from global context
    if (typeof window !== 'undefined') {
      const savedLoc = localStorage.getItem('qc_location');
      const savedLat = localStorage.getItem('qc_lat');
      const savedLng = localStorage.getItem('qc_lng');
      if (savedLoc) setAutoLocation(savedLoc);
      if (savedLat && !lat) setLat(parseFloat(savedLat));
      if (savedLng && !lng) setLng(parseFloat(savedLng));
    }

    // Fetch site config (ordering status)
    axios.get(`${API}/api/config/`)
      .then(res => {
        setOrdersEnabled(res.data.orders_enabled !== false);
        setOrdersDisabledMessage(res.data.orders_disabled_message || '');
      })
      .catch(err => console.error('Config fetch failed:', err));

  }, [user, items]);

  useEffect(() => {
    if (user) {
      if (!fullName) setFullName(user.name);
      if (!phoneNumber) setPhoneNumber(user.phone);
    }
  }, [user]);

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

  // -- Coupon Validation --
  const handleApplyCoupon = async () => {
    if (!user) {
      toast.error('Please login to apply coupons', { icon: '🙋' });
      return;
    }
    if (!couponInput) return;
    
    setValidatingCoupon(true);
    try {
      const res = await axios.post(`${API}/api/coupons/validate/`, {
        code: couponInput.trim().toUpperCase(),
        email: user.email,
        cart_value: total,
        subtotal: total
      });
      
      if (res.data.valid) {
        setAppliedCoupon({
          code: couponInput.toUpperCase(),
          discount_amount: res.data.discount_amount,
          discount_type: res.data.discount_type,
          discount_value: res.data.discount_value,
          is_free_delivery: res.data.is_free_delivery
        });
        setDiscountAmount(res.data.discount_amount);
        
        if (res.data.is_free_delivery) {
          setDeliveryFee(0);
        }
        
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-[24px] pointer-events-auto flex ring-1 ring-black ring-opacity-5 overflow-hidden border-2 border-green-500`}>
            <div className="flex-1 w-0 p-5">
              <div className="flex items-start">
                <div className="shrink-0 pt-0.5">
                  <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-2xl">🎉</div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight italic">Coupon Applied!</p>
                  <p className="mt-1 text-xs font-bold text-gray-500">
                    You saved ₹{res.data.discount_amount} {res.data.is_free_delivery ? 'and got Free Delivery!' : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ));
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid coupon code';
      toast.error(msg);
      setAppliedCoupon(null);
      setDiscountAmount(0);
    } finally {
      setValidatingCoupon(false);
    }
  };

  // -- Delivery Fee Logic --
  useEffect(() => {
    if (items.length === 0) {
      setDeliveryFee(40);
      return;
    }
    
    if (total > 210) {
      setDeliveryFee(0);
      return;
    }

    const uniqueRestaurants = new Set();
    let hasEssentials = false;
    
    items.forEach(item => {
      if (item.restaurant) uniqueRestaurants.add(item.restaurant);
      const cat = item.category_name?.toLowerCase() || '';
      if (cat.includes('essential') || cat.includes('grocery')) hasEssentials = true;
    });

    // Special items count as essentials
    if (specialRequests.length > 0) hasEssentials = true;

    const restCount = uniqueRestaurants.size;
    let fee = 30;
    if (restCount === 1 && !hasEssentials) {
      fee = 15;
    } else if (restCount >= 2 || hasEssentials || (restCount === 0 && hasEssentials)) {
      fee = 30;
    }
    
    // Override if free delivery coupon is applied
    if (appliedCoupon?.is_free_delivery) {
      fee = 0;
    }
    
    setDeliveryFee(fee);
  }, [items, total, specialRequests, appliedCoupon]);

  const packingCharge = 10;
  const currentCalculatedTotal = items.length > 0 ? (total - discountAmount + deliveryFee + packingCharge) : 0;

  const hasFood = items.some(i => i.restaurant || i.restaurant_name || i.category_name?.toLowerCase().includes('bundle'));
  const hasEssentials = items.some(i => ['essentials', 'grocery', 'snacks', 'beverages', 'drinks'].includes(i.category_name?.toLowerCase() || ''));
  
  // An order is only essentials if there's NO restaurant item or bundle present
  const onlyEssentials = !hasFood && (items.length > 0 || specialRequests.length > 0);


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
    
    if (!fullName || fullName.length < 3) { toast.error('Please enter a valid full name'); return; }
    if (!phoneNumber || phoneNumber.length < 10) { toast.error('Please enter a valid 10-digit phone number'); return; }

    const currentCalculatedTotal = items.length > 0 
      ? (parseFloat(total as any) - discountAmount + deliveryFee + packingCharge) 
      : 0;

    setLoading(true);
    try {
      const payload = {
        email: user?.email,
        name: fullName || user?.name,
        phone: phoneNumber || user?.phone,
        address: finalAddress,
        lat,
        lng,
        payment_method: payment,
        coupon_code: appliedCoupon ? appliedCoupon.code : "",
        notes: scheduledTime ? `[SCHEDULED: ${scheduledTime}] ${notes}` : notes,
        items: [
          ...items.map(i => ({ 
            id: i.id, 
            name: i.name, 
            price: parseFloat(i.price as any) || 0, 
            quantity: i.quantity || 1,
            unit: i.unit || 'piece'
          })),
          ...specialRequests.map(r => ({
            id: `req-${r.id}`,
            name: r.name,
            price: 0,
            quantity: r.quantity,
            unit: r.unit
          }))
        ]
      };
      
      if (payment === 'online') {
        // 1. Get Cashfree Session
        const res = await axios.post(`${API}/api/payment/create-session/`, payload);
        const { payment_session_id, order_id } = res.data;
        
        // 2. Initialize Cashfree SDK
        if (!(window as any).Cashfree) {
            toast.error('Payment gateway loading. Please try again in a bit.');
            setLoading(false);
            return;
        }

        const cashfree = (window as any).Cashfree({
            mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || 'production'
        });

        // 3. Start Checkout Overlay
        await cashfree.checkout({
            paymentSessionId: payment_session_id,
            returnUrl: `https://quickcombo.in/orders/${order_id}`
        });
        
        return; // SDK handles the rest
      }

      // Standard COD Flow
      const res = await axios.post(`${API}/api/orders/place/`, payload);
      setOrderId(res.data.order_id);
      localStorage.setItem('activeOrderId', res.data.order_id.toString());
      localStorage.setItem('showOrderPopup', 'true');
      setFinalTotal(isNaN(currentCalculatedTotal) ? 0 : currentCalculatedTotal);
      setSuccess(true);
      clearCart();
      clearSpecialRequests();
      setTimeout(() => router.push(`/orders/${res.data.order_id}`), 1000);
    } catch (err: any) {
      const msg = err.response?.data?.details?.message || err.response?.data?.error || 'Failed to place order';
      toast.error(msg);
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
          <span>{appliedCoupon ? '🎟️' : '✨'}</span> 
          <span className="text-green-400 font-bold text-sm">
            {appliedCoupon 
              ? `Code ${appliedCoupon.code} applied! Saving ₹${discountAmount}`
              : `Order fresh & save on every combo!`
            }
          </span>
        </div>

        {/* 0. Promo Code Section */}
        <section className="bg-gradient-to-br from-[#1c1c1c] to-[#121212] rounded-[24px] p-5 border border-white/5 shadow-2xl overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 blur-3xl rounded-full -mr-10 -mt-10" />
          
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <span className="text-base text-green-500">🎟️</span>
              </div>
              <h2 className="font-extrabold text-white text-base tracking-tight">Apply Coupon</h2>
            </div>
            {!appliedCoupon && total < 210 && (
              <div className="text-[10px] font-black text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full border border-green-500/20 animate-pulse">
                ADD ₹{Math.max(0, 211 - Math.floor(total))} FOR FREE DELIVERY
              </div>
            )}
          </div>

          <div className="flex gap-2.5 mb-5 relative">
            <input
              type="text"
              placeholder={appliedCoupon ? appliedCoupon.code : "Enter Promo Code"}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white outline-none focus:border-green-500 transition-all placeholder:text-gray-500 font-bold"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              disabled={!!appliedCoupon}
            />
            {appliedCoupon ? (
               <button 
                onClick={() => { setAppliedCoupon(null); setDiscountAmount(0); setCouponInput(''); }}
                className="bg-red-500/10 text-red-500 border border-red-500/20 px-6 py-3.5 rounded-2xl text-xs font-black tracking-widest active:scale-95 transition-all"
               >
                 REMOVE
               </button>
            ) : (
               <button 
                onClick={handleApplyCoupon}
                disabled={validatingCoupon || !couponInput}
                className="bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black px-8 py-3.5 rounded-2xl text-xs font-black tracking-widest transition-all active:scale-95 shadow-lg shadow-green-500/20"
               >
                 {validatingCoupon ? '...' : 'APPLY'}
               </button>
            )}
          </div>

          <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1 px-1">
                <span>Available Coupons</span>
                <button 
                  onClick={() => setShowAllCoupons(!showAllCoupons)}
                  className="text-green-500 hover:text-green-400 font-black"
                >
                  {showAllCoupons ? 'SHOW LESS' : 'VIEW ALL'}
                </button>
              </div>
             
             {availableCoupons.length === 0 ? (
               <div className="bg-white/5 rounded-2xl p-4 text-center border border-dashed border-white/10">
                 <p className="text-xs text-gray-500 font-medium">No coupons available right now.</p>
               </div>
              ) : (
                <div className="space-y-3">
                  {(showAllCoupons ? availableCoupons : availableCoupons.slice(0, 2)).map((cpn, idx) => {
                   const isUnlocked = total >= parseFloat(cpn.min_order_value);
                   const needed = Math.max(0, Math.floor(parseFloat(cpn.min_order_value) - total));
                   
                   return (
                     <div key={idx} className={`relative bg-white/5 border ${isUnlocked ? 'border-green-500/30' : 'border-white/10'} rounded-2xl p-4 overflow-hidden transition-all hover:bg-white/[0.07]`}>
                       {isUnlocked && (
                         <div className="absolute top-0 right-0 bg-green-500 text-black text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                           UNLOCKED
                         </div>
                       )}
                       
                       <div className="flex justify-between items-start mb-2">
                         <div className="flex items-center gap-3">
                           <div className={`w-10 h-10 rounded-xl ${isUnlocked ? 'bg-green-500/10 text-green-500' : 'bg-white/5 text-gray-500'} flex items-center justify-center border border-white/5`}>
                              <span className="text-lg">✨</span>
                           </div>
                           <div>
                             <h3 className="text-sm font-black text-white italic">
                               Save ₹{Math.floor(cpn.discount_value)}{cpn.discount_type === 'percentage' ? '%' : ''} with '{cpn.code}'
                             </h3>
                             <p className={`text-[11px] font-bold ${isUnlocked ? 'text-green-400' : 'text-blue-400'} mt-0.5`}>
                               {isUnlocked 
                                ? 'Coupon ready to apply!' 
                                : `Add items worth ₹${needed} more to unlock`
                               }
                             </p>
                           </div>
                         </div>
                         {!appliedCoupon && isUnlocked && (
                           <button 
                            onClick={() => { setCouponInput(cpn.code); setTimeout(() => handleApplyCoupon(), 100); }}
                            className="text-[10px] font-black bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all uppercase"
                           >
                             APPLY
                           </button>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </section>

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
                    {item.restaurant_name && (
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">{item.restaurant_name}</p>
                    )}
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

          {onlyEssentials && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 p-4 rounded-2xl bg-orange-500/10 border-2 border-orange-500/30 flex gap-3 items-start shadow-[0_0_20px_rgba(251,146,60,0.1)]"
            >
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0 animate-pulse">
                <span className="text-orange-500 text-xl">💡</span>
              </div>
              <div>
                <p className="text-orange-400 text-[11px] font-black leading-tight uppercase tracking-[0.1em] mb-1">Important Note</p>
                <p className="text-gray-200 text-xs font-bold leading-relaxed">
                  We're almost there! To complete this order, please include at least one <span className="text-green-400">food item</span> or <span className="text-green-400">combo</span> along with your essentials.
                </p>
              </div>
            </motion.div>
          )}
        </section>


        {/* Special Requests Section */}
        {specialRequests.length > 0 && (
          <section className="bg-[#1c1c1c] rounded-[20px] p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📦</span>
              <div>
                <h2 className="font-bold text-white text-sm">Special Requests</h2>
                <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Pay directly to delivery partner</p>
              </div>
            </div>
            <div className="space-y-2">
              {specialRequests.map(req => (
                <div key={req.id} className="flex justify-between items-center bg-black/30 px-3 py-2.5 rounded-xl border border-white/5">
                  <div className="flex gap-2 items-center">
                    <span className="text-base">🛍️</span>
                    <p className="text-sm font-bold text-white">{req.quantity} {req.unit === 'piece' ? 'pc' : req.unit} {req.name}</p>
                  </div>
                  <span className="text-[10px] text-orange-300 font-black bg-orange-500/10 px-2 py-1 rounded-lg border border-orange-500/20">On Delivery</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-3 leading-relaxed">
              💬 Final cost of special items will be collected by our delivery partner at your doorstep.
            </p>
          </section>
        )}

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
                    placeholder="House/Flat No., Building Name *"
                    onChange={(e) => setTypedAddress(e.target.value)}
                    value={typedAddress}
                    required
                  />
                </div>
              )}

              {/* Explicit Name & Phone Fields */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Delivery Name</p>
                  <input
                    className="w-full bg-black/50 text-white text-sm p-3 rounded-xl border border-white/10 outline-none focus:border-green-500 transition-colors"
                    placeholder="Full Name *"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Phone Number</p>
                  <input
                    className="w-full bg-black/50 text-white text-sm p-3 rounded-xl border border-white/10 outline-none focus:border-green-500 transition-colors"
                    placeholder="10-digit Mobile *"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    type="tel"
                    required
                  />
                </div>
              </div>

              <input
                className="w-full bg-transparent text-white text-xs border-b border-gray-700 pb-2 mb-4 outline-none placeholder:text-gray-500"
                placeholder="Add instructions for delivery partner (optional)"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* 3. Bill Details Card */}
        <section className="bg-[#1c1c1c] rounded-[20px] p-4">
          <h2 className="font-bold text-white mb-3">Bill Details</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Item Total</span>
              <span>₹{parseFloat(total as any) || 0}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-green-400">
                <span>Coupon Discount ({appliedCoupon?.code})</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-400 border-b border-white/5 pb-3">
              <span>Delivery Partner Fee</span>
              <span className={deliveryFee === 0 ? 'text-green-500 font-black' : ''}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            <div className="flex justify-between text-gray-400 border-b border-white/5 pb-3">
              <span>Packing Charges</span>
              <span>₹{packingCharge}</span>
            </div>
            <div className="flex justify-between font-bold text-lg text-white pt-1">
              <span>Total Bill</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-sm line-through">₹{(parseFloat(total as any) || 0) + deliveryFee + packingCharge}</span>
                <span>₹{(parseFloat(total as any) || 0) - discountAmount + deliveryFee + packingCharge}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Terms Agreement Text */}
        <p className="text-[10px] text-gray-500 text-center px-4 py-2 font-medium">
          By placing this order, you agree to QuickCombo's <Link href="/terms" className="text-green-500 underline">Terms & Conditions</Link> and <Link href="/privacy" className="text-green-500 underline">Privacy Policy</Link>.
        </p>
      </div>

      {/* Floating Action Bar (Zomato Style) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 max-w-lg mx-auto bg-[#1c1c1c] border-t border-white/5 p-3 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.6)]">
        
        {/* Payment Toggle in bottom bar */}
        <button
          onClick={() => setPayment(payment === 'online' ? 'cod' : 'online')}
          className="flex items-center gap-3 bg-white/5 hover:bg-white/10 transition-all rounded-2xl px-3 py-2 border border-white/10 active:scale-95"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10" style={{background: payment === 'online' ? 'rgba(34,197,94,0.15)' : 'rgba(251,146,60,0.15)'}}>
            {payment === 'online' ? (
              <ShieldCheck size={18} className="text-green-500" />
            ) : (
              <Banknote size={18} className="text-orange-400" />
            )}
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Payment</span>
            <span className="text-[11px] font-black text-white leading-tight">
              {payment === 'online' ? 'Online' : 'Cash on Delivery'}
            </span>
          </div>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-gray-500 ml-1"><path d="m6 9 6 6 6-6"/></svg>
        </button>

        {/* Place Order Button */}
        <div className="flex-1 flex flex-col items-end gap-1">
          {!ordersEnabled && (
             <p className="text-[10px] text-red-500 font-black uppercase text-right leading-tight max-w-[150px]">
               {ordersDisabledMessage || "Orders are currently paused"}
             </p>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handlePlaceOrder}
            disabled={loading || items.length === 0 || onlyEssentials || !ordersEnabled}
            className={`rounded-[14px] px-6 py-3.5 flex items-center gap-3 min-w-[160px] shadow-lg transition-all ${
              !ordersEnabled 
                ? 'bg-gray-800 text-gray-500 grayscale cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-400 text-black shadow-green-500/20'
            } disabled:opacity-50`}
          >
            <div className={`flex flex-col items-start border-r pr-3 ${!ordersEnabled ? 'border-gray-700' : 'border-black/20'}`}>
              <span className="text-[15px] font-black leading-none">₹{isNaN(parseFloat(total as any) - discountAmount + deliveryFee + packingCharge) ? 0 : (parseFloat(total as any) - discountAmount + deliveryFee + packingCharge)}</span>
              <span className="text-[10px] font-bold opacity-70">TOTAL</span>
            </div>
            <div className="flex items-center font-black text-[15px]">
              {!ordersEnabled ? 'Paused' : (payment === 'online' ? 'Pay Now' : 'Place Order')} <ChevronRight size={18} strokeWidth={3} className="ml-1" />
            </div>
          </motion.button>
        </div>
      </div>

      <Script 
        src="https://sdk.cashfree.com/js/v3/cashfree.js"
        strategy="lazyOnload"
      />

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
