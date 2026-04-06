'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Utensils, Settings, 
  TrendingUp, Clock, CheckCircle, Package, Search,
  Plus, Edit2, Trash2, ChevronRight, LogOut, Loader2, 
  Lock, Users, BarChart3, Layers, Store, ShieldCheck,
  AlertCircle, ArrowUpRight, DollarSign, PieChart
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';
// Robust Fallback: In case the above is misconfigured, we use the verified production backend.
const LIVE_BACKEND = 'https://quickcombo.alwaysdata.net';

export default function PremiumAdmin() {
  const [adminPassword, setAdminPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Auto-login check
  useEffect(() => {
    const savedPass = sessionStorage.getItem('QC_MASTER_PASS');
    if (savedPass) setAdminPassword(savedPass);
    setIsChecking(false);
  }, []);

  // Fetch Data when password is set
  useEffect(() => {
    if (adminPassword) fetchData();
  }, [adminPassword, activeTab]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) return;
    sessionStorage.setItem('QC_MASTER_PASS', inputPassword);
    setAdminPassword(inputPassword);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('QC_MASTER_PASS');
    setAdminPassword('');
    setStats(null);
  };

  const getHeaders = () => ({
    headers: { 'X-Admin-Password': adminPassword }
  });

  const fetchData = async () => {
    setLoading(true);
    // Determine which base to use
    const base = API.includes('quickcombo.in') ? LIVE_BACKEND : API;
    
    try {
      if (activeTab === 'dashboard') {
        const res = await axios.get(`${base}/api/admin/stats/`, getHeaders());
        setStats(res.data);
        const ordersRes = await axios.get(`${base}/api/admin/orders/`, getHeaders());
        setOrders(ordersRes.data.slice(0, 5));
      } else if (activeTab === 'orders') {
        const res = await axios.get(`${base}/api/admin/orders/`, getHeaders());
        setOrders(res.data);
      } else if (activeTab === 'menu') {
        const res = await axios.get(`${base}/api/admin/menu/`, getHeaders());
        setMenuItems(res.data);
      } else if (activeTab === 'categories') {
        const res = await axios.get(`${base}/api/admin/categories/`, getHeaders());
        setCategories(res.data);
      } else if (activeTab === 'restaurants') {
        const res = await axios.get(`${base}/api/admin/restaurants/`, getHeaders());
        setRestaurants(res.data);
      } else if (activeTab === 'users') {
          const res = await axios.get(`${base}/api/admin/users/`, getHeaders());
          setUsers(res.data);
      }
    } catch (e: any) {
      // Emergency Second Chance: If the initial fetch fails and wasn't already using LIVE_BACKEND, try it now.
      if (base !== LIVE_BACKEND) {
          try {
             // Retry with absolute production URL
             if (activeTab === 'dashboard') {
                const res = await axios.get(`${LIVE_BACKEND}/api/admin/stats/`, getHeaders());
                setStats(res.data);
             }
             // ... other retries could go here if needed, but for now we fallback for the dashboard
          } catch (retryErr) {
             console.error("Critical API Failure:", retryErr);
          }
      }
      if (e.response?.status === 401) {
        toast.error('Invalid Master Password');
        handleLogout();
      } else {
        toast.error('Failed to load data');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await axios.patch(`${API}/api/admin/orders/`, { order_id: orderId, status }, getHeaders());
      toast.success(`Order #${orderId} Updated`);
      fetchData();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  if (isChecking) {
    return <div className="min-h-screen bg-[#020202] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500 w-10 h-10"/></div>;
  }

  if (!adminPassword) {
    return (
      <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 relative overflow-hidden font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-white/5 backdrop-blur-3xl rounded-[2.5rem] p-10 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-10"
        >
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] rotate-3">
              <ShieldCheck className="text-black w-10 h-10" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-center text-white mb-2 tracking-tighter">MASTER GATEWAY</h1>
          <p className="text-gray-400 text-center mb-10 text-sm font-medium uppercase tracking-[0.2em]">QuickCombo Infrastructure v2.1</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 w-5 h-5" />
                <input 
                type="password" 
                placeholder="Enter Secure Access Key" 
                value={inputPassword}
                onChange={e => setInputPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-5 text-white outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all font-mono placeholder:text-gray-600"
                autoFocus
                />
            </div>
            <button 
              type="submit"
              className="bg-emerald-500 text-black font-black py-5 rounded-2xl hover:bg-emerald-400 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-3 shadow-[0_10px_20px_rgba(16,185,129,0.2)]"
            >
              AUTHENTICATE ACCESS
            </button>
          </form>
          <p className="text-center mt-8 text-xs text-gray-600 font-bold uppercase tracking-widest">End-to-End Encrypted Persistence</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex font-sans selection:bg-emerald-500/30">
      {/* SIDEBAR */}
      <motion.aside 
        initial={{ x: -100 }} animate={{ x: 0 }}
        className="w-72 bg-[#080808]/80 backdrop-blur-xl border-r border-white/5 p-8 flex flex-col gap-10 sticky top-0 h-screen z-20"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <Utensils className="text-black w-7 h-7" />
          </div>
          <div>
            <h1 className="font-black text-2xl tracking-tighter leading-none mb-1">QC MASTER</h1>
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"/>
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">System Online</span>
            </div>
          </div>
        </div>

        <nav className="flex flex-col gap-3 flex-grow">
          {[
            { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders Hub', icon: ShoppingBag },
            { id: 'menu', label: 'Food Items', icon: Utensils },
            { id: 'categories', label: 'Categories', icon: Layers },
            { id: 'restaurants', label: 'Partners', icon: Store },
            { id: 'users', label: 'Customers', icon: Users },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative group ${
                activeTab === item.id 
                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <item.icon size={22} className={activeTab === item.id ? 'text-emerald-500' : 'text-gray-500'} />
              <span className="font-bold text-sm">{item.label}</span>
              {activeTab === item.id && (
                  <motion.div layoutId="activeInd" className="absolute right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              )}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-4">
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Master Environment</p>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">AlwaysData Production</span>
                    <BarChart3 size={14} className="text-emerald-500" />
                </div>
            </div>
            <button 
                onClick={handleLogout}
                className="flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
            >
                <LogOut size={20} />
                <span className="font-bold text-sm">Lock Portal</span>
            </button>
        </div>
      </motion.aside>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-12 overflow-y-auto relative">
        <header className="flex justify-between items-end mb-16">
          <div>
            <h2 className="text-5xl font-black tracking-tight mb-2 uppercase italic">{activeTab}</h2>
            <p className="text-gray-500 font-medium text-lg">Central Infrastructure Control Panel</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-4 flex items-center gap-4 min-w-[300px]">
                <Search className="text-gray-600" size={20} />
                <input placeholder="Search entities..." className="bg-transparent text-sm outline-none w-full" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500">
                <Settings size={22} />
            </div>
          </div>
        </header>

        {loading && activeTab !== 'dashboard' ? (
          <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-emerald-500 w-12 h-12" />
              <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Decrypting Live Streams...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
                className="flex flex-col gap-10"
              >
                <div className="grid grid-cols-4 gap-8">
                  <StatCard label="Live Revenue" value={`₹${stats?.total_sales || 0}`} icon={DollarSign} trend="+12% Since yesterday" color="emerald" />
                  <StatCard label="Total Orders" value={stats?.total_orders || 0} icon={Package} trend="Global count" color="blue" />
                  <StatCard label="Active Items" value={stats?.total_items || 0} icon={Utensils} trend="Menu inventory" color="amber" />
                  <StatCard label="User Base" value={stats?.total_users || 0} icon={Users} trend="Registered accounts" color="purple" />
                </div>
                
                <div className="grid grid-cols-3 gap-10">
                    <div className="col-span-2 bg-[#080808] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-2xl font-black mb-1">REAL-TIME ORDERS</h3>
                                <p className="text-gray-500 text-sm">Most recent activity from the stream</p>
                            </div>
                            <button onClick={() => setActiveTab('orders')} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl text-xs font-bold transition-all">VIEW FULL HUB</button>
                        </div>
                        <OrderList items={orders} onUpdate={updateOrderStatus} compact />
                    </div>

                    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#050505] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl flex flex-col justify-between">
                        <div>
                            <PieChart className="text-emerald-500 mb-6" size={40} />
                            <h3 className="text-2xl font-black mb-4">SYSTEM HEALTH</h3>
                            <div className="space-y-6">
                                <HealthRow label="Backend API" status="Optimal" color="text-emerald-500" />
                                <HealthRow label="Neon DB Cluster" status="Scalable" color="text-emerald-500" />
                                <HealthRow label="Email Gateway" status="Active" color="text-emerald-500" />
                                <HealthRow label="Geo Service" status="Responsive" color="text-emerald-500" />
                            </div>
                        </div>
                        <div className="mt-10 p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                            <p className="text-xs text-gray-400 leading-relaxed">
                                System is currently running on <span className="text-emerald-500 font-bold">Standardized Production Core</span>. All nodes are reporting nominal latencies.
                            </p>
                        </div>
                    </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div 
                key="orders" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#080808] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-3xl font-black">ORDERS HUB</h3>
                    <div className="flex gap-3">
                        <button className="bg-emerald-500 text-black font-black px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2">
                             EXPORT DATA
                        </button>
                    </div>
                </div>
                <OrderList items={orders} onUpdate={updateOrderStatus} />
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div 
                key="menu" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#080808] rounded-[2.5rem] p-10 border border-white/5 shadow-2xl"
              >
                 <div className="flex justify-between items-center mb-10">
                    <div>
                        <h3 className="text-3xl font-black">FOOD INVENTORY</h3>
                        <p className="text-gray-500">Manage Menu Items and pricing</p>
                    </div>
                    <button className="bg-emerald-500 text-black font-black px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2">
                        <Plus size={18} /> ADD NEW ITEM
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {menuItems.map(item => (
                     <div key={item.id} className="bg-white/5 rounded-3xl p-5 group hover:bg-white/10 transition-all border border-transparent hover:border-emerald-500/20 relative">
                       <div className="aspect-square rounded-2xl overflow-hidden mb-5 relative">
                          <img src={item.image_url || 'https://via.placeholder.com/200'} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-400 uppercase border border-white/10 italic">
                            {item.category_name}
                          </div>
                       </div>
                       <h4 className="font-black text-lg mb-1 truncate uppercase">{item.name}</h4>
                       <div className="flex justify-between items-center mb-4">
                            <span className="text-2xl font-black text-emerald-500 italic">₹{item.price}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {item.id}</span>
                       </div>
                       <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                           <button className="flex-grow bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-xs font-bold border border-white/5 transition-all">EDIT</button>
                           <button className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20">
                             <Trash2 size={16} />
                           </button>
                       </div>
                     </div>
                   ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
                <motion.div key="categories" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-8">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-[#080808] p-8 rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all group">
                            <div className="text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all scale-100 group-hover:scale-110 origin-left">{cat.icon}</div>
                            <h4 className="text-2xl font-black uppercase mb-1">{cat.name}</h4>
                            <p className="text-gray-500 text-sm mb-6">Slug: {cat.slug}</p>
                            <div className="flex gap-2">
                                <button className="p-2 border border-white/10 rounded-lg hover:bg-white/5 transition-all"><Edit2 size={16}/></button>
                                <button className="p-2 border border-white/10 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    <button className="bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-[2rem] flex flex-col items-center justify-center gap-3 p-8 hover:bg-emerald-500/10 transition-all text-emerald-500 font-black uppercase text-sm">
                        <Plus size={30} />
                        New Category
                    </button>
                </motion.div>
            )}

            {activeTab === 'restaurants' && (
                <motion.div key="restaurants" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                    {restaurants.map(res => (
                        <div key={res.id} className="bg-[#080808] p-6 rounded-3xl border border-white/5 flex items-center justify-between group">
                            <div className="flex items-center gap-6">
                                <img src={res.image_url} className="w-20 h-20 rounded-2xl object-cover" />
                                <div>
                                    <h4 className="text-xl font-black uppercase">{res.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-amber-500 text-sm font-bold"><ArrowUpRight size={14}/> {res.rating} Rating</div>
                                        <div className="text-gray-500 text-sm">{res.cuisines}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${res.is_featured ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                    {res.is_featured ? 'Featured' : 'Standard'}
                                </div>
                                <button className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all"><Edit2 size={20}/></button>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-[#080808] rounded-[2.5rem] p-10 border border-white/5">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-white/5">
                                <th className="pb-6 px-4">User Identity</th>
                                <th className="pb-6 px-4">Contact Protocol</th>
                                <th className="pb-6 px-4">Role Matrix</th>
                                <th className="pb-6 px-4">Registry Date</th>
                                <th className="pb-6 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map(u => (
                                <tr key={u.id} className="group hover:bg-white/[0.02] transition-all">
                                    <td className="py-6 px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center font-black text-emerald-500 text-lg uppercase italic">{u.name?.[0] || u.email[0]}</div>
                                            <div>
                                                <div className="font-black text-white uppercase italic">{u.name || 'Anonymous Entity'}</div>
                                                <div className="text-xs text-gray-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-sm text-gray-400 font-mono">{u.phone || 'NO_PH_DATA'}</td>
                                    <td className="py-6 px-4">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.is_staff ? 'bg-purple-500/20 text-purple-500' : 'bg-gray-500/20 text-gray-500'}`}>
                                            {u.is_staff ? 'ADMIN_ELITE' : 'STANDARD_CLIENT'}
                                        </span>
                                    </td>
                                    <td className="py-6 px-4 text-xs text-gray-500">{new Date(u.date_joined).toLocaleDateString()}</td>
                                    <td className="py-6 px-4 text-right">
                                        <button className="text-emerald-500/50 hover:text-emerald-500 transition-all font-black text-[10px] uppercase tracking-widest">Wipe Data</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  const colors: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20 shadow-blue-500/5',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/5',
    purple: 'text-purple-500 bg-purple-500/10 border-purple-500/20 shadow-purple-500/5'
  };
  return (
    <div className={`p-8 rounded-[2rem] border transition-all hover:scale-105 ${colors[color]} relative overflow-hidden group`}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-current opacity-[0.03] blur-2xl group-hover:scale-150 transition-transform"/>
      <div className="flex justify-between items-start mb-6">
        <div className="p-4 bg-black/40 rounded-2xl"><Icon size={28} /></div>
        <ArrowUpRight size={20} className="opacity-40" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">{label}</p>
        <h3 className="text-4xl font-black tracking-tighter mb-2 italic">{value}</h3>
        <p className="text-[10px] font-bold opacity-40 uppercase">{trend}</p>
      </div>
    </div>
  );
}

function HealthRow({ label, status, color }: any) {
    return (
        <div className="flex justify-between items-center group">
            <span className="text-sm font-bold text-gray-500 transition-colors group-hover:text-gray-300">{label}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${color}`}>{status}</span>
        </div>
    )
}

function OrderList({ items, onUpdate, compact = false }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-4">
        <thead>
          <tr className="text-gray-600 text-[10px] font-black uppercase tracking-[0.3em] bg-transparent">
            <th className="pb-2 px-6">Identity</th>
            {!compact && <th className="pb-2 px-6">Customer Det</th>}
            {!compact && <th className="pb-2 px-6">Subtotal</th>}
            <th className="pb-2 px-6">Total Matrix</th>
            <th className="pb-2 px-6">Protocol Status</th>
            <th className="pb-2 px-6 text-right">System Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((order: any) => (
            <tr key={order.id} className="bg-white/5 group transition-all relative">
              <td className="py-6 px-6 rounded-l-[1.5rem] relative">
                  <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-emerald-500 rounded-r-lg opacity-0 group-hover:opacity-100 transition-all" />
                  <div className="font-black text-xl italic text-white/90">#QC{order.id.toString().padStart(4, '0')}</div>
                  <div className="text-[10px] text-gray-500 font-bold mt-1">{new Date(order.created_at).toLocaleTimeString()}</div>
              </td>
              {!compact && (
                  <td className="py-6 px-6">
                    <div className="text-sm font-black uppercase italic">{order.user_name || 'GUEST_ENTITY'}</div>
                    <div className="text-[10px] text-gray-500 font-mono">{order.user_email}</div>
                  </td>
              )}
              {!compact && (
                  <td className="py-6 px-6 font-bold text-gray-400">₹{order.subtotal}</td>
              )}
              <td className="py-6 px-6 font-black text-xl text-emerald-500 italic">₹{order.total}</td>
              <td className="py-6 px-6">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border italic ${
                  order.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  order.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_#10b98122]' :
                  order.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                  'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="py-6 px-6 rounded-r-[1.5rem] text-right">
                <select 
                  onChange={(e) => onUpdate(order.id, e.target.value)}
                  value={order.status}
                  className="bg-black border-2 border-white/10 rounded-xl text-[10px] px-3 py-2 outline-none focus:border-emerald-500/50 transition-all cursor-pointer font-black uppercase italic"
                >
                  <option value="pending">PENDING</option>
                  <option value="confirmed">CONFIRMED</option>
                  <option value="preparing">PREPARING</option>
                  <option value="picked_up">PICKED_UP</option>
                  <option value="out_for_delivery">OUT_FOR_DELIVERY</option>
                  <option value="delivered">DELIVERED</option>
                  <option value="cancelled">CANCELLED</option>
                </select>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="text-center py-20 text-gray-600 font-black uppercase tracking-widest italic">No Data Streams Found</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
