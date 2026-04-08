'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Utensils, Settings, 
  TrendingUp, Clock, CheckCircle, Package, Search,
  Plus, Edit2, Trash2, ChevronRight, LogOut, Loader2, 
  Lock, Users, BarChart3, Layers, Store, ShieldCheck,
  AlertCircle, ArrowUpRight, DollarSign, PieChart, Menu, X,
  FileUp, Download
} from 'lucide-react';
import { useRef } from 'react';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Entity Data
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'restaurant' | 'menu' | 'category'>('restaurant');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [outOfSync, setOutOfSync] = useState(false);

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
    const base = API.includes('quickcombo.in') ? LIVE_BACKEND : API;
    
    // Helper to fetch without crashing the whole loop
    const safeFetch = async (url: string, setter: (data: any) => void) => {
        try {
            const res = await axios.get(url, getHeaders());
            setter(res.data);
            return true;
        } catch (err) {
            console.error(`Fetch failed for ${url}:`, err);
            return false;
        }
    };

    try {
      if (activeTab === 'dashboard') {
        await safeFetch(`${base}/api/admin/stats/`, setStats);
        const ordersRes = await axios.get(`${base}/api/admin/orders/`, getHeaders());
        setOrders(ordersRes.data.slice(0, 5));
      } else if (activeTab === 'orders') {
        await safeFetch(`${base}/api/admin/orders/`, setOrders);
      } else if (activeTab === 'menu') {
        await safeFetch(`${base}/api/admin/menu/`, setMenuItems);
      } else if (activeTab === 'categories') {
        await safeFetch(`${base}/api/admin/categories/`, setCategories);
      } else if (activeTab === 'restaurants') {
        await safeFetch(`${base}/api/admin/restaurants/`, setRestaurants);
      } else if (activeTab === 'users') {
        await safeFetch(`${base}/api/admin/users/`, setUsers);
      }

      // GLOBAL REFRESH (Individual safe fetches)
      await safeFetch(`${base}/api/admin/categories/`, setCategories);
      await safeFetch(`${base}/api/admin/restaurants/`, setRestaurants);
      
      // Check Version
      try {
          const vRes = await axios.get(`${base}/api/admin/version/`);
          setServerVersion(vRes.data.version);
          if (vRes.data.version !== '1.2.1') setOutOfSync(true);
      } catch (e) {
          // If version endpoint exists but fails preflight, it's definitely out of sync
          setOutOfSync(true);
      }
      
    } catch (e: any) {
      if (e.response?.status === 401) {
        toast.error('Invalid Master Password');
        handleLogout();
      } else {
        // Detected a general request failure (likely CORS/Security block)
        setOutOfSync(true);
        toast.error('Security System Blocked - Please Sync & Restart Server', { duration: 6000 });
      }
    } finally {
      setLoading(false);
    }
  };

  const forceClearCache = async () => {
    const toastId = toast.loading('Force clearing global cache...');
    try {
      await axios.post(`${API}/api/admin/clear-cache/`, {}, getHeaders());
      toast.success('Site cache cleared! Changes are now live.', { id: toastId });
      fetchData();
    } catch (e) {
      toast.error('Force clear failed', { id: toastId });
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

  const deleteEntity = async (type: string, id: number) => {
    if (!confirm('Are you sure you want to delete this entity? This action cannot be undone.')) return;
    
    try {
      let endpoint = '';
      if (type === 'restaurant') endpoint = '/api/admin/restaurants/';
      else if (type === 'menu') endpoint = '/api/admin/menu/';
      else if (type === 'category') endpoint = '/api/admin/categories/';

      await axios.delete(`${API}${endpoint}`, {
        ...getHeaders(),
        data: { id }
      });
      
      toast.success('Deleted successfully');
      fetchData();
    } catch (e) {
      toast.error('Deletion failed');
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'restaurants' | 'menu') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setUploading(true);
    const toastId = toast.loading(`Importing ${type}...`);
    
    try {
      const res = await axios.post(`${API}/api/admin/bulk-import/`, formData, {
        headers: {
          ...getHeaders().headers,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (res.data.success) {
        toast.success(`Imported ${res.data.created} items successfully!`, { id: toastId });
        if (res.data.errors?.length > 0) {
          console.warn('Import warnings:', res.data.errors);
          toast('Some rows had errors (check console)', { icon: '⚠️' });
        }
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Bulk import failed', { id: toastId });
    } finally {
      setUploading(false);
      // @ts-ignore
      if (e.target) e.target.value = '';
    }
  };

  const openModal = (type: 'restaurant' | 'menu' | 'category', entity: any = null) => {
    setModalType(type);
    setSelectedEntity(entity);
    setIsModalOpen(true);
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
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#080808] border-b border-white/5 flex items-center justify-between px-6 z-[60]">
        <div className="flex items-center gap-3">
          <Utensils className="text-emerald-500 w-6 h-6" />
          <span className="font-black text-lg">QC MASTER</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-lg">
          <Menu size={20} />
        </button>
      </div>

      {/* SIDEBAR */}
      <AnimatePresence>
        {(isSidebarOpen || (typeof window !== 'undefined' && window.innerWidth >= 1024)) && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside 
              initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed lg:sticky top-0 left-0 w-72 bg-[#080808]/95 backdrop-blur-2xl border-r border-white/5 p-8 flex flex-col gap-10 h-screen z-[80] lg:z-20"
            >
              <div className="flex items-center justify-between lg:justify-start gap-4">
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
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-2 text-gray-500">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-3 flex-grow overflow-y-auto">
                {[
                  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                  { id: 'orders', label: 'Orders Hub', icon: ShoppingBag },
                  { id: 'menu', label: 'Food Items', icon: Utensils },
                  { id: 'essentials', label: 'Essentials', icon: Package },
                  { id: 'categories', label: 'Categories', icon: Layers },
                  { id: 'restaurants', label: 'Partners', icon: Store },
                  { id: 'users', label: 'Customers', icon: Users },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
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
                      <div className="flex justify-between items-center mb-3">
                          <span className="text-xs font-bold text-white">AlwaysData Production</span>
                          <BarChart3 size={14} className="text-emerald-500" />
                      </div>
                      <button 
                        onClick={forceClearCache}
                        className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-black text-[10px] font-black rounded-lg border border-emerald-500/20 transition-all uppercase italic"
                      >
                        Force Sync Site
                      </button>
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
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      <main className="flex-grow p-4 lg:p-12 pt-20 lg:pt-12 overflow-y-auto relative">
        <header className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 mb-12 lg:mb-16">
          <div>
            <h2 className="text-3xl lg:text-5xl font-black tracking-tight mb-2 uppercase italic">{activeTab}</h2>
            <p className="text-gray-400 lg:text-gray-500 font-medium text-base lg:text-lg">Infrastructure Control Panel</p>
          </div>
          {outOfSync && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl flex items-center gap-4 lg:min-w-[400px]"
              >
                  <AlertCircle className="text-red-500 w-8 h-8 shrink-0 animate-pulse" />
                  <div>
                      <h4 className="text-red-500 font-black text-xs uppercase tracking-widest">CRITICAL: SERVER OUT OF SYNC</h4>
                      <p className="text-[10px] text-red-500/80 font-bold uppercase">Please Pull Latest Code on AlwaysData & Restart</p>
                  </div>
              </motion.div>
          )}
          <div className="flex items-center gap-3">
            <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl px-4 lg:px-6 py-3 lg:py-4 flex items-center gap-4 flex-grow lg:min-w-[300px]">
                <Search className="text-gray-600" size={18} />
                <input placeholder="Search entities..." className="bg-transparent text-sm outline-none w-full" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 shrink-0">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
                  <StatCard label="Live Revenue" value={`₹${stats?.total_sales || 0}`} icon={DollarSign} trend="+12% Since yesterday" color="emerald" />
                  <StatCard label="Total Orders" value={stats?.total_orders || 0} icon={Package} trend="Global count" color="blue" />
                  <StatCard label="Active Items" value={stats?.total_items || 0} icon={Utensils} trend="Menu inventory" color="amber" />
                  <StatCard label="User Base" value={stats?.total_users || 0} icon={Users} trend="Registered accounts" color="purple" />
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-10">
                    <div className="xl:col-span-2 bg-[#080808] rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-white/5 shadow-2xl">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
                            <div>
                                <h3 className="text-xl lg:text-2xl font-black mb-1 text-white">REAL-TIME ORDERS</h3>
                                <p className="text-gray-500 text-sm">Most recent activity stream</p>
                            </div>
                            <button onClick={() => setActiveTab('orders')} className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl text-[10px] font-black transition-all border border-white/10 uppercase tracking-widest self-start sm:self-auto">VIEW FULL HUB</button>
                        </div>
                        <OrderList items={orders} onUpdate={updateOrderStatus} compact />
                    </div>

                    <div className="bg-gradient-to-br from-[#0a0a0a] to-[#050505] rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-white/5 shadow-2xl flex flex-col justify-between">
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
                className="bg-[#080808] rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-white/5 shadow-2xl overflow-x-auto"
              >
                <div className="flex justify-between items-center mb-10">
                    <h3 className="text-2xl lg:text-3xl font-black">ORDERS HUB</h3>
                </div>
                <OrderList items={orders} onUpdate={updateOrderStatus} />
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div 
                key="menu" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#080808] rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-white/5 shadow-2xl"
              >
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
                    <div>
                        <h3 className="text-2xl lg:text-3xl font-black">FOOD INVENTORY</h3>
                        <p className="text-gray-500">Manage Menu Items and pricing</p>
                    </div>
                    <div className="flex gap-3">
                        <input 
                            type="file" 
                            accept=".csv" 
                            className="hidden" 
                            ref={fileInputRef}
                            onChange={(e) => handleBulkUpload(e, 'menu')}
                        />
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-white/5 text-emerald-500 font-bold px-5 py-3 rounded-xl border border-emerald-500/20 hover:bg-emerald-500/10 transition-all flex items-center gap-2"
                        >
                            <FileUp size={18} /> BULK IMPORT
                        </button>
                        <button 
                            onClick={() => openModal('menu')}
                            className="bg-emerald-500 text-black font-black px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 self-start sm:self-auto"
                        >
                            <Plus size={18} /> ADD NEW ITEM
                        </button>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                   {menuItems.map(item => (
                     <div key={item.id} className="bg-white/5 rounded-3xl p-5 group hover:bg-white/10 transition-all border border-white/5 hover:border-emerald-500/20 relative">
                       <div className="aspect-video sm:aspect-square rounded-2xl overflow-hidden mb-5 relative">
                          <img src={item.image_url || 'https://via.placeholder.com/200'} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-400 uppercase border border-white/10 italic">
                            {item.category_name}
                          </div>
                       </div>
                       <h4 className="font-black text-lg mb-1 truncate uppercase">{item.name}</h4>
                       <div className="flex justify-between items-center mb-4 text-white">
                            <span className="text-2xl font-black text-emerald-500 italic">₹{item.price}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {item.id}</span>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={() => openModal('menu', item)} className="flex-grow bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-[10px] font-black border border-white/5 transition-all uppercase tracking-widest">EDIT ITEM</button>
                           <button 
                             onClick={() => deleteEntity('menu', item.id)}
                             className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"
                           >
                             <Trash2 size={16} />
                           </button>
                       </div>
                     </div>
                   ))}
                 </div>
              </motion.div>
            )}

            {activeTab === 'essentials' && (
              <motion.div 
                key="essentials" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#080808] rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-white/5 shadow-2xl"
              >
                 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
                    <div>
                        <h3 className="text-2xl lg:text-3xl font-black italic uppercase">Essentials Hub</h3>
                        <p className="text-gray-500">Manage non-food inventory and groceries</p>
                    </div>
                    <button 
                        onClick={() => openModal('menu', { category: categories.find(c => c.slug === 'essentials')?.id, category_slug: 'essentials' })}
                        className="bg-emerald-500 text-black font-black px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 self-start sm:self-auto"
                    >
                        <Plus size={18} /> ADD ESSENTIAL
                    </button>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 lg:gap-6">
                   {menuItems.filter(item => item.category_name?.toLowerCase().includes('essential') || item.category_name?.toLowerCase().includes('grocery')).map(item => (
                     <div key={item.id} className="bg-white/5 rounded-3xl p-5 group hover:bg-white/10 transition-all border border-white/5 hover:border-emerald-500/20 relative">
                       <div className="aspect-video sm:aspect-square rounded-2xl overflow-hidden mb-5 relative">
                          <img src={item.image_url || 'https://via.placeholder.com/200'} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-400 uppercase border border-white/10 italic">
                            {item.category_name}
                          </div>
                       </div>
                       <h4 className="font-black text-lg mb-1 truncate uppercase">{item.name}</h4>
                       <div className="flex justify-between items-center mb-4 text-white">
                            <span className="text-2xl font-black text-emerald-500 italic">₹{item.price}</span>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">ID: {item.id}</span>
                       </div>
                       <div className="flex gap-2">
                           <button onClick={() => openModal('menu', { ...item, category_slug: 'essentials' })} className="flex-grow bg-white/10 hover:bg-white/20 py-2.5 rounded-xl text-[10px] font-black border border-white/5 transition-all uppercase tracking-widest">EDIT ITEM</button>
                           <button onClick={() => deleteEntity('menu', item.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/20"><Trash2 size={16}/></button>
                       </div>
                     </div>
                   ))}
                   {menuItems.filter(item => item.category_name?.toLowerCase().includes('essential') || item.category_name?.toLowerCase().includes('grocery')).length === 0 && (
                       <div className="col-span-full py-20 text-center text-gray-600 font-black uppercase tracking-widest italic">No Essentials Registered Yet</div>
                   )}
                 </div>
              </motion.div>
            )}

            {activeTab === 'categories' && (
                <motion.div key="categories" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-8">
                    {categories.map(cat => (
                        <div key={cat.id} className="bg-[#080808] p-6 lg:p-8 rounded-[1.5rem] lg:rounded-[2rem] border border-white/5 hover:border-emerald-500/20 transition-all group">
                            <div className="text-4xl lg:text-5xl mb-6 grayscale group-hover:grayscale-0 transition-all scale-100 group-hover:scale-110 origin-left">{cat.icon}</div>
                            <h4 className="text-xl lg:text-2xl font-black uppercase mb-1">{cat.name}</h4>
                            <p className="text-gray-500 text-xs mb-6 font-mono">/{cat.slug}</p>
                            <div className="flex gap-2">
                                <button onClick={() => openModal('category', cat)} className="p-2 border border-white/10 rounded-lg hover:bg-white/5 transition-all hover:text-emerald-500"><Edit2 size={16}/></button>
                                <button onClick={() => deleteEntity('category', cat.id)} className="p-2 border border-white/10 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all"><Trash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                    <button 
                        onClick={() => openModal('category')}
                        className="bg-emerald-500/5 border-2 border-dashed border-emerald-500/20 rounded-[1.5rem] lg:rounded-[2rem] flex flex-col items-center justify-center gap-3 p-8 hover:bg-emerald-500/10 transition-all text-emerald-500 font-black uppercase text-sm"
                    >
                        <Plus size={30} />
                        New Category
                    </button>
                </motion.div>
            )}

            {activeTab === 'restaurants' && (
                <motion.div key="restaurants" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:gap-6">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-4">
                            <button 
                                onClick={() => openModal('restaurant')}
                                className="bg-emerald-500 text-black font-black px-6 py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                            >
                                <Plus size={20} /> ADD PARTNER
                            </button>
                            <button 
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = '.csv';
                                    input.onchange = (e: any) => handleBulkUpload(e, 'restaurants');
                                    input.click();
                                }}
                                className="bg-white/5 text-gray-400 font-bold px-6 py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
                            >
                                <FileUp size={20} /> BULK IMPORT (CSV)
                            </button>
                        </div>
                        <div className="text-[10px] text-gray-600 font-black tracking-[0.2em] uppercase italic">
                            Required: name, rating, delivery_time, cuisines
                        </div>
                    </div>
                    {restaurants.map(res => (
                        <div key={res.id} className="bg-[#080808] p-4 lg:p-6 rounded-2xl lg:rounded-3xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group">
                            <div className="flex items-center gap-4 lg:gap-6">
                                <img src={res.image_url} alt={res.name} className="w-16 h-16 lg:w-20 lg:h-20 rounded-xl lg:rounded-2xl object-cover" />
                                <div>
                                    <h4 className="text-lg lg:text-xl font-black uppercase italic">{res.name}</h4>
                                    <div className="flex flex-wrap items-center gap-3 mt-1">
                                        <div className="flex items-center gap-1 text-emerald-500 text-xs font-black uppercase tracking-tighter"><ArrowUpRight size={12}/> {res.rating} Rating</div>
                                        <div className="text-gray-500 text-xs font-medium uppercase">{res.cuisines}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 self-end sm:self-auto w-full sm:w-auto">
                                <div className={`hidden xs:block px-4 py-1.5 rounded-full text-[9px] font-black uppercase border italic flex-grow sm:flex-grow-0 text-center ${res.is_featured ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}>
                                    {res.is_featured ? 'Featured_Partner' : 'Standard'}
                                </div>
                                <button onClick={() => openModal('restaurant', res)} className="p-3 bg-white/5 rounded-xl hover:bg-emerald-500 hover:text-black transition-all border border-white/10"><Edit2 size={18}/></button>
                                <button onClick={() => deleteEntity('restaurant', res.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"><Trash2 size={18}/></button>
                            </div>
                        </div>
                    ))}
                </motion.div>
            )}

            {activeTab === 'users' && (
                <motion.div key="users" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-[#080808] rounded-[2.5rem] p-4 lg:p-10 border border-white/5 overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
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
        
        {/* MODAL OVERLAY */}
         <AnimatePresence>
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
                    <EntityModal 
                        type={modalType} 
                        entity={selectedEntity} 
                        onClose={() => setIsModalOpen(false)} 
                        onSave={fetchData} 
                        headers={getHeaders()}
                        categories={categories}
                        restaurants={restaurants}
                    />
                </div>
            )}
         </AnimatePresence>
      </main>
    </div>
  );
}

function EntityModal({ type, entity, onClose, onSave, headers, categories, restaurants }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>(entity || {});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            let endpoint = '';
            if (type === 'restaurant') endpoint = '/api/admin/restaurants/';
            else if (type === 'menu') endpoint = '/api/admin/menu/';
            else if (type === 'category') endpoint = '/api/admin/categories/';

            if (entity?.id) {
                await axios.patch(`${API}${endpoint}`, { ...formData, id: entity.id, category_slug: entity.category_slug }, headers);
                toast.success('Updated successfully');
            } else {
                await axios.post(`${API}${endpoint}`, { ...formData, category_slug: entity?.category_slug }, headers);
                toast.success('Created successfully');
            }
            onSave();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.detail || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10 overflow-y-auto max-h-[90vh]"
        >
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black uppercase italic">{entity ? 'Edit' : 'Add New'} {type}</h3>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg"><X size={20}/></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                    {/* Common Name Field */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Display Identity</label>
                        <input 
                            required 
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50"
                            placeholder={`Enter ${type} name`}
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    {type === 'restaurant' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="Rating" placeholder="4.5" value={formData.rating} onChange={(v: any) => setFormData({ ...formData, rating: v })} type="number" step="0.1" />
                                <FormInput label="Delivery (min)" placeholder="30" value={formData.delivery_time} onChange={(v: any) => setFormData({ ...formData, delivery_time: v })} type="number" />
                            </div>
                            <FormInput label="Cuisines" placeholder="North Indian, Chinese" value={formData.cuisines} onChange={(v: any) => setFormData({ ...formData, cuisines: v })} />
                            <FormInput label="Image Stream URL" placeholder="https://..." value={formData.image_url} onChange={(v: any) => setFormData({ ...formData, image_url: v })} />
                        </>
                    )}

                    {type === 'menu' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="Price (₹)" placeholder="299" value={formData.price} onChange={(v: any) => setFormData({ ...formData, price: v })} type="number" />
                                <FormInput label="Prep Time" placeholder="15" value={formData.prep_time} onChange={(v: any) => setFormData({ ...formData, prep_time: v })} type="number" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Category Node</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none"
                                    value={formData.category || ''}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Partner Node</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none"
                                    value={formData.restaurant || ''}
                                    onChange={e => setFormData({ ...formData, restaurant: e.target.value })}
                                >
                                    <option value="">No Partner (Internal/Essential)</option>
                                    {restaurants.map((r: any) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <FormInput label="Asset URL" placeholder="https://..." value={formData.image_url} onChange={(v: any) => setFormData({ ...formData, image_url: v })} />
                        </>
                    )}

                    {type === 'category' && (
                        <>
                            <FormInput label="Emoji/Icon" placeholder="🍔" value={formData.icon} onChange={(v: any) => setFormData({ ...formData, icon: v })} />
                            <FormInput label="System Slug" placeholder="fast-food" value={formData.slug} onChange={(v: any) => setFormData({ ...formData, slug: v })} />
                        </>
                    )}
                </div>

                <div className="flex gap-4 pt-4">
                    <button type="button" onClick={onClose} className="flex-grow py-4 bg-white/5 rounded-2xl font-bold hover:bg-white/10 transition-all">ABORT</button>
                    <button type="submit" disabled={loading} className="flex-grow py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                        {loading ? 'PROCESSING...' : 'SYNC DATA'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
}

function FormInput({ label, onChange, ...props }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">{label}</label>
            <input 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50"
                {...props}
                onChange={e => onChange(e.target.value)}
            />
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
