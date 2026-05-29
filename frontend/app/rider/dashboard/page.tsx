'use client';
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Package, MapPin, CheckCircle2, Play, PhoneCall, RefreshCw, Volume2, VolumeX } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function RiderDashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const [notificationPermission, setNotificationPermission] = useState<string>('default');
  
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  
  // Profile completion state
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [upiId, setUpiId] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevLatestOrderId = useRef<number | null>(null);
  const isFirstFetch = useRef<boolean>(true);
  const seenOrderIdsRef = useRef<Set<number>>(new Set());
  const [lastSyncTime, setLastSyncTime] = useState<string>('Never');

  const triggerNotification = (orderId: number, restaurant: string) => {
    // Play the audioRef sound (which has been preloaded & pre-unlocked)
    if (soundEnabled && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.log('Autoplay sound failed:', e));
    }

    if ('Notification' in window && Notification.permission === 'granted') {
      const title = 'New QuickCombo Order! 🛵';
      const options = {
        body: `Order #${orderId} is ready from ${restaurant}. Tap to view.`,
        icon: '/favicon.ico',
        tag: 'new-order',
        requireInteraction: true
      };

      // Try service worker first (crucial for background delivery on iOS and Android)
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
          if (registration && registration.showNotification) {
            registration.showNotification(title, options);
          } else {
            new Notification(title, options);
          }
        }).catch(err => {
          console.error('SW registration fetch failed, falling back:', err);
          try {
            new Notification(title, options);
          } catch (e) {
            console.error('Fallback notification failed:', e);
          }
        });
      } else {
        try {
          new Notification(title, options);
        } catch (e) {
          console.error('Fallback notification failed:', e);
        }
      }
    }
  };

  const testNotification = () => {
    if (!('Notification' in window)) {
      alert('This device/browser does not support Web Notifications.');
      return;
    }
    
    if (Notification.permission === 'granted') {
      triggerNotification(999, 'Test Restaurant');
      toast.success('Test notification sent!');
    } else {
      Notification.requestPermission().then(perm => {
        setNotificationPermission(perm);
        if (perm === 'granted') {
          triggerNotification(999, 'Test Restaurant');
          toast.success('Test notification sent!');
        } else {
          alert('Notification permission denied or blocked! Check browser settings.');
        }
      });
    }
  };

  const subscribeToPushNotifications = async (t: string, reg: ServiceWorkerRegistration) => {
    try {
      if (!reg.pushManager) {
        console.warn('Push manager is not supported on this browser/device.');
        return;
      }

      // Check current subscription
      let sub = await reg.pushManager.getSubscription();
      
      const VAPID_PUBLIC_KEY = 'BFspP4ge4f7UZpmvvDQcm280ZlLm9WjYp_Z5COtyb8eOaFGtQAQR0MAGCllsOUqwDn2FnW5x2_NGnIi0PqC7C0U';
      
      // Helper function to convert base64 URL to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      if (!sub) {
        // Subscribe
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
        console.log('Subscribed to Web Push:', sub);
      }

      // Send to backend
      const subscriptionJSON = sub.toJSON();
      if (subscriptionJSON.endpoint && subscriptionJSON.keys?.auth && subscriptionJSON.keys?.p256dh) {
        await axios.post(`${API}/api/rider/subscribe/`, {
          endpoint: subscriptionJSON.endpoint,
          auth: subscriptionJSON.keys.auth,
          p256dh: subscriptionJSON.keys.p256dh
        }, {
          headers: { Authorization: `Bearer ${t}` }
        });
        console.log('Registered Web Push subscription with backend.');
      }
    } catch (err) {
      console.error('Failed to subscribe to Web Push:', err);
    }
  };

  useEffect(() => {
    // 1. Initialize audio with the real notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
    audioRef.current.preload = 'auto';

    // Load seen order IDs from localStorage
    try {
      const saved = localStorage.getItem('qc_rider_seen_orders');
      if (saved) seenOrderIdsRef.current = new Set(JSON.parse(saved));
    } catch {}

    // 2. Check current notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      
      // Auto-request permission on mount
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(perm => {
          setNotificationPermission(perm);
          if (perm === 'granted') toast.success('Notifications enabled!');
        });
      }
    }

    // 3. Register service worker for system notifications
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => {
          console.log('SW Registered', reg);
          const storedToken = localStorage.getItem('rider_token');
          if (storedToken) {
            subscribeToPushNotifications(storedToken, reg);
          }
        })
        .catch(err => console.log('SW Registration failed', err));
    }

    // 4. Unlock audio autoplay on first user interaction
    const unlockAudio = () => {
      if (audioRef.current) {
        audioRef.current.play().then(() => {
          audioRef.current?.pause();
          if (audioRef.current) audioRef.current.currentTime = 0;
        }).catch(e => console.log("Unlock failed", e));
      }
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Check auth & profile completeness
  useEffect(() => {
    const storedToken = localStorage.getItem('rider_token');
    const storedUser = localStorage.getItem('rider_user');
    
    if (!storedToken || !storedUser) {
      router.push('/rider/login');
      return;
    }

    setToken(storedToken);
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    setName(parsedUser.name || '');
    setPhone(parsedUser.phone || '');
    setVehicleNumber(parsedUser.vehicle_number || '');
    setDrivingLicense(parsedUser.driving_license || '');
    setUpiId(parsedUser.upi_id || '');

    if (!parsedUser.name || !parsedUser.phone || !parsedUser.vehicle_number || !parsedUser.driving_license || !parsedUser.upi_id) {
      setShowProfileSetup(true);
      setLoading(false);
    } else if (!parsedUser.rider_verified) {
      setIsUnverified(true);
      setLoading(false);
    } else {
      setShowProfileSetup(false);
      setIsUnverified(false);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        subscribeToPushNotifications(storedToken, reg);
      });
    }
  }, [router]);

  // Robust automatic polling whenever token is set and profile setup is done
  useEffect(() => {
    if (!token || showProfileSetup || isUnverified) return;

    // Fetch immediately on load or profile completion
    fetchDashboardData(token, false);

    // Setup 10-second polling interval
    const interval = setInterval(() => {
      fetchDashboardData(token, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [token, showProfileSetup, isUnverified]);

  const getHeaders = (t: string) => ({
    headers: { Authorization: `Bearer ${t}` }
  });

  const checkVerificationStatus = async () => {
    try {
      const res = await axios.get(`${API}/api/rider/profile/`, getHeaders(token!));
      const freshUser = res.data.user;
      localStorage.setItem('rider_user', JSON.stringify(freshUser));
      setUser(freshUser);
      if (freshUser.rider_verified) {
        setIsUnverified(false);
        toast.success('Your account is verified! Access granted.');
        fetchDashboardData(token!);
      } else {
        toast.error('Verification is still pending approval.');
      }
    } catch (e) {
      toast.error('Failed to refresh status');
    }
  };

  const fetchDashboardData = async (t: string, isPolling = false) => {
    if (!isPolling) setLoading(true);
    setLastSyncTime(new Date().toLocaleTimeString());
    try {
      const res = await axios.get(`${API}/api/rider/orders/available/`, getHeaders(t));
      setActiveOrder(res.data.active_order);
      
      const newOrders = res.data.available_orders || [];
      setAvailableOrders(newOrders);
      
      // Notify for each genuinely new order using localStorage-backed seen set
      newOrders.forEach((order: any) => {
        if (!seenOrderIdsRef.current.has(order.id)) {
          // Only notify if this isn't the very first load (set was empty)
          if (seenOrderIdsRef.current.size > 0) {
            const restaurantName = order.items?.[0]?.restaurant_name || 'Store';
            triggerNotification(order.id, restaurantName);
            // Always show a toast as in-app fallback
            toast.success(`New Order #${order.id} from ${restaurantName}! 🛵`, { duration: 6000 });
          }
          seenOrderIdsRef.current.add(order.id);
        }
      });

      // Remove orders no longer in the list from seen set to avoid stale tracking
      // (keep memory lean, only track currently visible orders)
      const currentIds = new Set(newOrders.map((o: any) => o.id as number));
      seenOrderIdsRef.current.forEach(id => {
        if (!currentIds.has(id)) seenOrderIdsRef.current.delete(id);
      });

      // Persist to localStorage
      localStorage.setItem('qc_rider_seen_orders', JSON.stringify(Array.from(seenOrderIdsRef.current)));
      
      isFirstFetch.current = false;
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      } else if (err.response?.status === 403 && err.response?.data?.unverified) {
        setIsUnverified(true);
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rider_token');
    localStorage.removeItem('rider_user');
    localStorage.removeItem('rider_last_seen_order_id');
    router.push('/rider/login');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !vehicleNumber || !drivingLicense || !upiId) {
      return toast.error('All verification fields are required');
    }
    try {
      const res = await axios.post(`${API}/api/rider/profile/`, {
        name,
        phone,
        vehicle_number: vehicleNumber,
        driving_license: drivingLicense,
        upi_id: upiId
      }, getHeaders(token!));
      localStorage.setItem('rider_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setShowProfileSetup(false);
      
      if (!res.data.user.rider_verified) {
        setIsUnverified(true);
        toast.success('Details submitted! Account pending verification approval.');
      } else {
        setIsUnverified(false);
        toast.success('Verification complete!');
        fetchDashboardData(token!);
      }
    } catch (err) {
      toast.error('Failed to save profile');
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      await axios.post(`${API}/api/rider/orders/${orderId}/accept/`, {}, getHeaders(token!));
      toast.success('Order Accepted!');
      fetchDashboardData(token!);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to accept order');
      fetchDashboardData(token!);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await axios.patch(`${API}/api/rider/orders/${orderId}/status/`, { status }, getHeaders(token!));
      toast.success('Status updated');
      fetchDashboardData(token!);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleRequestPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission().then(perm => {
        setNotificationPermission(perm);
        if (perm === 'granted') {
          toast.success('System notifications enabled!');
          // Trigger test notification
          new Notification('Notifications Active! 🛵', {
            body: 'You will receive notifications for new orders here.',
            icon: '/favicon.ico'
          });
        } else if (perm === 'denied') {
          toast.error('Notifications blocked. Please reset permissions in your browser address bar.');
        }
      });
    } else {
      toast.error('Browser does not support notifications.');
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  // Profile Setup Screen (Collect Name, Phone, Vehicle, DL, UPI)
  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col justify-center relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
           <div className="text-center mb-8">
             <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
               <User size={32} />
             </div>
             <h1 className="text-3xl font-black italic tracking-tight">RIDER PROFILE</h1>
             <p className="text-gray-400 text-sm mt-1">Complete verification to start accepting deliveries</p>
           </div>
           
           <form onSubmit={handleSaveProfile} className="space-y-4">
             <div>
               <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Full Name</label>
               <input type="text" placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none transition" required />
             </div>

             <div>
               <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Phone Number</label>
               <input type="tel" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none transition" required />
             </div>

             <div>
               <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Vehicle Number Plate</label>
               <input type="text" placeholder="DL 3C AB 1234" value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none transition" required />
             </div>

             <div>
               <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">Driving License Number</label>
               <input type="text" placeholder="DL-1234567890123" value={drivingLicense} onChange={e => setDrivingLicense(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none transition" required />
             </div>

             <div>
               <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block mb-1.5 ml-1">UPI ID for Payouts</label>
               <input type="text" placeholder="rider@upi" value={upiId} onChange={e => setUpiId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder-gray-600 focus:border-emerald-500/50 outline-none transition" required />
             </div>

             <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 rounded-2xl mt-6 transition shadow-lg shadow-emerald-500/20 active:scale-[0.98]">
               Submit Verification Details
             </button>
           </form>
        </motion.div>
      </div>
    );
  }

  // Pending Verification Screen
  if (isUnverified) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col justify-center relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl relative z-10">
           <div className="text-center mb-8">
             <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-amber-400 animate-pulse">
               <Package size={32} className="animate-bounce" style={{ animationDuration: '3s' }} />
             </div>
             <div className="inline-flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/35 px-3 py-1 rounded-full text-[10px] text-amber-400 font-black uppercase tracking-wider mb-3">
               <span className="relative flex h-1.5 w-1.5">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
               </span>
               Pending Verification
             </div>
             <h1 className="text-3xl font-black italic tracking-tight">UNDER REVIEW</h1>
             <p className="text-gray-400 text-sm mt-2 leading-relaxed">
               QuickCombo Admins are reviewing your documents. You'll gain dashboard access immediately upon approval.
             </p>
           </div>

           {/* Submitted Details Review */}
           <div className="bg-white/5 border border-white/5 rounded-2xl p-5 mb-6 space-y-3">
             <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase border-b border-white/5 pb-2">Submitted Details</h3>
             
             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-400">Name</span>
               <span className="font-bold">{user?.name}</span>
             </div>
             
             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-400">Phone</span>
               <span className="font-bold">{user?.phone}</span>
             </div>

             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-400">Vehicle plate</span>
               <span className="font-bold uppercase">{user?.vehicle_number}</span>
             </div>

             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-400">License No</span>
               <span className="font-bold uppercase">{user?.driving_license}</span>
             </div>

             <div className="flex justify-between items-center text-sm">
               <span className="text-gray-400">UPI ID</span>
               <span className="font-bold text-emerald-400">{user?.upi_id}</span>
             </div>
           </div>
           
           <div className="space-y-3">
             <button onClick={checkVerificationStatus} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest py-4 rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-[0.98]">
               <RefreshCw size={18} className="animate-spin" style={{ animationDuration: '4s' }} />
               Refresh Status
             </button>
             
             <button onClick={handleLogout} className="w-full bg-white/5 hover:bg-white/10 text-red-400 hover:text-red-300 font-black uppercase tracking-widest py-3.5 rounded-2xl border border-white/5 transition active:scale-[0.98]">
               Sign Out
             </button>
           </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24">
      {/* Header */}
      <header className="bg-white/5 border-b border-white/10 p-4 sticky top-0 z-50 backdrop-blur-md flex justify-between items-center">
         <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Rider Portal</p>
            <h1 className="text-sm font-black">{user?.name}</h1>
            <p className="text-[10px] text-gray-400 mt-1">{user?.phone} &bull; {user?.email}</p>
         </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">Sync: {lastSyncTime}</span>
            </div>
            
            <button onClick={testNotification} className="text-emerald-500/80 hover:text-emerald-400 text-xs font-bold px-2.5 py-1.5 bg-emerald-500/10 rounded-lg">
              Test Alert
            </button>
            <button onClick={() => setSoundEnabled(!soundEnabled)} className="text-gray-400 hover:text-white">
              {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
            <button onClick={handleLogout} className="text-red-500/80 hover:text-red-500">
              <LogOut size={20} />
            </button>
          </div>
      </header>

      <main className="p-4 max-w-md mx-auto">
        {/* Browser notification alert banner */}
        {notificationPermission !== 'granted' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-4 rounded-2xl mb-6 text-sm flex flex-col gap-3 font-semibold"
          >
            <p>Please enable browser notifications to receive real-time order alerts on Safari and Chrome.</p>
            <div className="flex gap-2">
              <button 
                onClick={handleRequestPermission}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xs py-2.5 px-4 rounded-xl uppercase tracking-widest transition-all"
              >
                Enable Notifications
              </button>
              <button 
                onClick={testNotification}
                className="bg-white/10 hover:bg-white/20 text-white font-black text-xs py-2.5 px-4 rounded-xl uppercase tracking-widest transition-all"
              >
                Test Notification
              </button>
            </div>
          </motion.div>
        )}
        
        {/* ACTIVE ORDER */}
        {activeOrder ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl rounded-full -mr-16 -mt-16" />
               <h2 className="text-xs text-emerald-500 font-black uppercase tracking-widest mb-4">Current Delivery</h2>
               
               <div className="text-3xl font-black italic mb-1">Order #{activeOrder.id}</div>
               <div className="text-sm text-gray-300 font-medium mb-6">{activeOrder.items?.length || 0} Items • {activeOrder.payment_method === 'cod' ? 'CASH' : 'PAID'} • ₹{activeOrder.total}</div>
               
               <div className="space-y-4 mb-8">
                 <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0"><Package size={14} /></div>
                   <div>
                     <p className="text-[10px] text-gray-500 font-bold uppercase">Pickup</p>
                     <p className="text-sm font-bold">{activeOrder.items?.[0]?.restaurant_name || 'QuickCombo Store'}</p>
                   </div>
                 </div>
                 <div className="w-0.5 h-6 bg-white/10 ml-4"></div>
                 <div className="flex gap-3">
                   <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 shrink-0"><MapPin size={14} /></div>
                   <div>
                     <p className="text-[10px] text-gray-500 font-bold uppercase">Dropoff</p>
                     <p className="text-sm font-bold">{activeOrder.delivery_address}</p>
                     <p className="text-xs text-gray-400 mt-1">{activeOrder.user_name} • {activeOrder.user_phone}</p>
                   </div>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-3 mb-4">
                 <a href={`tel:${activeOrder.user_phone}`} className="bg-white/5 border border-white/10 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-white/10 transition-all">
                   <PhoneCall size={14} /> Call Customer
                 </a>
                 <a href={`https://www.google.com/maps/dir/?api=1&destination=${activeOrder.delivery_lat},${activeOrder.delivery_lng}`} target="_blank" className="bg-blue-600/20 border border-blue-500/30 text-blue-400 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold hover:bg-blue-600/40 transition-all">
                   <MapPin size={14} /> Navigate
                 </a>
               </div>

               <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-emerald-500/20">
                 <button onClick={() => updateOrderStatus(activeOrder.id, 'out_for_delivery')} className="bg-white/5 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/10">
                   Picked Up
                 </button>
                 <button onClick={() => updateOrderStatus(activeOrder.id, 'delivered')} className="bg-emerald-500 text-black py-4 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                   Delivered
                 </button>
               </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-black">Available Orders</h2>
              <div className="flex items-center gap-2 text-xs text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full font-bold">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                 Live
              </div>
            </div>
            
            {availableOrders.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center flex flex-col items-center justify-center">
                <RefreshCw size={32} className="text-gray-600 mb-4 animate-[spin_4s_linear_infinite]" />
                <p className="text-gray-400 font-medium">Waiting for new orders...</p>
                <p className="text-[10px] text-gray-600 mt-2 uppercase tracking-widest">Auto-refreshes every 10s</p>
              </div>
            ) : (
              <AnimatePresence>
                {availableOrders.map(order => (
                  <motion.div 
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white/5 border border-white/10 rounded-3xl p-5"
                  >
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <span className="text-[10px] font-black bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md uppercase">Order #{order.id}</span>
                       </div>
                       <div className="text-right">
                         <span className="text-lg font-black italic text-emerald-500 leading-none block">₹{order.total}</span>
                         <span className="text-[9px] text-gray-500 font-bold uppercase">{order.payment_method === 'cod' ? 'CASH' : 'ONLINE'}</span>
                       </div>
                    </div>

                    <div className="space-y-2 mb-6">
                       <p className="text-xs text-gray-300"><span className="text-gray-500 font-bold w-12 inline-block">FROM:</span> {order.items?.[0]?.restaurant_name || 'Store'}</p>
                       <p className="text-xs text-gray-300"><span className="text-gray-500 font-bold w-12 inline-block">TO:</span> {order.delivery_address}</p>
                    </div>

                    <button 
                      onClick={() => handleAcceptOrder(order.id)}
                      className="w-full bg-white hover:bg-gray-200 text-black font-black uppercase tracking-widest py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={16} /> Accept Order
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
