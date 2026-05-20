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
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevLatestOrderId = useRef<number | null>(null);

  useEffect(() => {
    // Check current permission
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

    // Register service worker for system notifications (needed for Android and iOS)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW Registered', reg))
        .catch(err => console.log('SW Registration failed', err));
    }
  }, []);

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
    if ('Notification' in window) {
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
            toast.error('Notification permission denied.');
          }
        });
      }
    }
  };

  useEffect(() => {
    // 1. Initialize audio with the real notification sound
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');

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
        .then(reg => console.log('SW Registered', reg))
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
      router.push('/delivery/login');
      return;
    }

    setToken(storedToken);
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    if (!parsedUser.name || !parsedUser.phone) {
      setShowProfileSetup(true);
      setLoading(false);
    } else {
      setShowProfileSetup(false);
    }
  }, [router]);

  // Robust automatic polling whenever token is set and profile setup is done
  useEffect(() => {
    if (!token || showProfileSetup) return;

    // Fetch immediately on load or profile completion
    fetchDashboardData(token, false);

    // Setup 10-second polling interval
    const interval = setInterval(() => {
      fetchDashboardData(token, true);
    }, 10000);

    return () => clearInterval(interval);
  }, [token, showProfileSetup]);

  const getHeaders = (t: string) => ({
    headers: { Authorization: `Bearer ${t}` }
  });

  const fetchDashboardData = async (t: string, isPolling = false) => {
    if (!isPolling) setLoading(true);
    try {
      const res = await axios.get(`${API}/api/rider/orders/available/`, getHeaders(t));
      setActiveOrder(res.data.active_order);
      
      const newOrders = res.data.available_orders || [];
      setAvailableOrders(newOrders);
      
      // Play sound and trigger browser notification if a new latest order arrived
      const latestOrder = newOrders[0];
      if (latestOrder) {
        if (isPolling && latestOrder.id !== prevLatestOrderId.current) {
          const restaurantName = latestOrder.items?.[0]?.restaurant_name || 'Store';
          triggerNotification(latestOrder.id, restaurantName);
        }
        prevLatestOrderId.current = latestOrder.id;
      } else {
        prevLatestOrderId.current = null;
      }
      
    } catch (err: any) {
      if (err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      if (!isPolling) setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('rider_token');
    localStorage.removeItem('rider_user');
    router.push('/delivery/login');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return toast.error('Name and Phone are required');
    try {
      const res = await axios.post(`${API}/api/rider/profile/`, { name, phone }, getHeaders(token!));
      localStorage.setItem('rider_user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setShowProfileSetup(false);
      toast.success('Profile saved!');
      fetchDashboardData(token!);
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

  // Profile Setup Screen
  if (showProfileSetup) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white p-6 flex flex-col justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full mx-auto">
           <h1 className="text-3xl font-black mb-2">Complete Profile</h1>
           <p className="text-gray-400 mb-8">We need your details so customers can contact you.</p>
           
           <form onSubmit={handleSaveProfile} className="space-y-4">
             <input type="text" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder-gray-500 focus:border-emerald-500/50 outline-none" required />
             <input type="tel" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white placeholder-gray-500 focus:border-emerald-500/50 outline-none" required />
             <button type="submit" className="w-full bg-emerald-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl mt-4">Save & Continue</button>
           </form>
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
         </div>
          <div className="flex items-center gap-4">
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
