'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Utensils, Settings, 
  TrendingUp, Clock, CheckCircle, Package, Search,
  Plus, Edit2, Trash2, ChevronRight, LogOut, Loader2, 
  Lock, Users, BarChart3, Layers, Store, ShieldCheck,
  AlertCircle, ArrowUpRight, DollarSign, PieChart, Menu, X,
  FileUp, Download, Ticket, Power
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
  const [coupons, setCoupons] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'restaurant' | 'menu' | 'category' | 'coupon' | 'combo'>('restaurant');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [serverVersion, setServerVersion] = useState<string | null>(null);
  const [outOfSync, setOutOfSync] = useState(false);
  const [importLog, setImportLog] = useState<any[] | null>(null);
  const [showImportLog, setShowImportLog] = useState(false);
  const menuFileInputRef = useRef<HTMLInputElement>(null);
  const restaurantFileInputRef = useRef<HTMLInputElement>(null);
  const perRestaurantFileInputRef = useRef<HTMLInputElement>(null);
  const [targetRestaurant, setTargetRestaurant] = useState<{id: number, name: string} | null>(null);
  const [selectedRestMenu, setSelectedRestMenu] = useState<any[]>([]);
  const [isMenuDrilldown, setIsMenuDrilldown] = useState(false);
  const [siteOnline, setSiteOnline] = useState(true);
  const [isTogglingSite, setIsTogglingSite] = useState(false);

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
      } else if (activeTab === 'promos') {
        await safeFetch(`${base}/api/admin/coupons/`, setCoupons);
      } else if (activeTab === 'combos') {
        await safeFetch(`${base}/api/admin/combos/`, setCombos);
      }

      // GLOBAL REFRESH (Individual safe fetches)
      await safeFetch(`${base}/api/admin/categories/`, setCategories);
      await safeFetch(`${base}/api/admin/restaurants/`, setRestaurants);
      
      // Check Version
      try {
          const vRes = await axios.get(`${base}/api/admin/version/`);
          setServerVersion(vRes.data.version);
          if (vRes.data.version !== '1.2.7') setOutOfSync(true);
      } catch (e) {
          // If version endpoint exists but fails preflight, it's definitely out of sync
          setOutOfSync(true);
      }
      
      // Fetch site status
      try {
          const configRes = await axios.get(`${base}/api/config/`);
          setSiteOnline(configRes.data.site_online);
      } catch (e) {}
      
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

  const toggleSite = async () => {
    const newStatus = !siteOnline;
    setIsTogglingSite(true);
    try {
        const base = API.includes('quickcombo.in') ? LIVE_BACKEND : API;
        await axios.post(`${base}/api/admin/toggle-site/`, { online: newStatus }, getHeaders());
        setSiteOnline(newStatus);
        toast.success(`Platform ${newStatus ? 'ONLINE' : 'OFFLINE'}`);
    } catch (e) {
        toast.error('Failed to change site status');
    } finally {
        setIsTogglingSite(false);
    }
  };

  const fetchRestaurantMenu = async (restaurantId: number) => {
    setLoading(true);
    try {
      const base = API.includes('quickcombo.in') ? LIVE_BACKEND : API;
      const res = await axios.get(`${base}/api/admin/menu/?restaurant_id=${restaurantId}`, getHeaders());
      setSelectedRestMenu(res.data);
      setIsMenuDrilldown(true);
    } catch (e) {
      toast.error('Failed to load restaurant menu');
    } finally {
      setLoading(false);
    }
  };

  const updateItemInline = async (itemId: number, patch: any) => {
    try {
      const res = await axios.patch(`${API}/api/admin/menu/`, { ...patch, id: itemId }, getHeaders());
      if (isMenuDrilldown) {
          setSelectedRestMenu(prev => prev.map(item => item.id === itemId ? { ...item, ...res.data } : item));
      }
      toast.success('Sync complete');
    } catch (e) {
      toast.error('Sync failed');
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
      else if (type === 'coupon') endpoint = '/api/admin/coupons/';
      else if (type === 'combo') endpoint = '/api/admin/combos/';

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

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      if (e.target) e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (targetRestaurant?.id && type === 'menu') {
      formData.append('lock_restaurant_id', targetRestaurant.id.toString());
    }

    setUploading(true);
    const toastId = toast.loading(`ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ Importing ${type} from CSV... Auto-categorizing items...`);

    try {
      // IMPORTANT: Pass only the raw header values, NOT the axios config wrapper
      const res = await axios.post(`${API}/api/admin/bulk-import/`, formData, {
        headers: {
          'X-Admin-Password': adminPassword,
        }
      });

      if (res.data.success) {
        const { created, updated, total, categorization_log, errors } = res.data;
        const summary = `ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ Import complete! ${created} new, ${updated} updated (${total} total)`;
        toast.success(summary, { id: toastId, duration: 5000 });

        if (categorization_log?.length > 0) {
          setImportLog(categorization_log);
          setShowImportLog(true);
        }

        if (errors?.length > 0) {
          console.warn('Import row errors:', errors);
          toast(`ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â ${errors.length} row(s) had errors ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â check browser console`, { icon: 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â' });
        }
        fetchData();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Bulk import failed';
      toast.error(`ÃƒÆ’Ã‚Â¢Ãƒâ€šÃ‚ÂÃƒâ€¦Ã¢â‚¬â„¢ ${errMsg}`, { id: toastId });
      console.error('Import error:', err.response?.data);
    } finally {
      setUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Import menu CSV locked to a specific restaurant
  const handlePerRestaurantImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetRestaurant) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please select a valid CSV file');
      if (e.target) e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'menu');
    formData.append('lock_restaurant_id', String(targetRestaurant.id));

    setUploading(true);
    const toastId = toast.loading(`ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Å¾ Importing menu for ${targetRestaurant.name}...`);

    try {
      const res = await axios.post(`${API}/api/admin/bulk-import/`, formData, {
        headers: {
          'X-Admin-Password': adminPassword,
        }
      });

      if (res.data.success) {
        const { created, updated, total, categorization_log, errors } = res.data;
        toast.success(`ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ${targetRestaurant.name}: ${created} new, ${updated} updated (${total} items)`, { id: toastId, duration: 5000 });
        if (categorization_log?.length > 0) {
          setImportLog(categorization_log);
          setShowImportLog(true);
        }
        if (errors?.length > 0) {
          console.warn('Row errors:', errors);
          toast(`ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â ${errors.length} row(s) had errors ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â check console`, { icon: 'ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â' });
        }
        fetchData();
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || 'Import failed';
      toast.error(`ÃƒÂ¢Ã‚ÂÃ…â€™ ${errMsg}`, { id: toastId });
      console.error('Per-restaurant import error:', err.response?.data);
    } finally {
      setUploading(false);
      setTargetRestaurant(null);
      if (e.target) e.target.value = '';
    }
  };

  const openModal = (type: 'restaurant' | 'menu' | 'category' | 'coupon' | 'combo', entity: any = null) => {
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
                  { id: 'combos', label: 'Combos', icon: Package },
                  { id: 'essentials', label: 'Essentials', icon: Package },
                  { id: 'categories', label: 'Categories', icon: Layers },
                  { id: 'restaurants', label: 'Partners', icon: Store },
                  { id: 'promos', label: 'Promos', icon: Ticket },
                  { id: 'users', label: 'Customers', icon: Users },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); setIsMenuDrilldown(false); setTargetRestaurant(null); }}
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
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Store Operation</p>
                      <div className="flex justify-between items-center mb-3">
                          <span className={`text-xs font-black uppercase italic ${siteOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                              {siteOnline ? 'Online' : 'Offline'}
                          </span>
                          <button 
                            onClick={toggleSite}
                            disabled={isTogglingSite}
                            className={`w-12 h-6 rounded-full transition-all relative ${siteOnline ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${siteOnline ? 'right-1 bg-emerald-500' : 'left-1 bg-red-500'}`} />
                          </button>
                      </div>
                      <p className="text-[10px] text-gray-600 font-medium leading-tight">
                          {siteOnline ? 'Site is active and accepting orders.' : 'Maintenance screen is active. Orders blocked.'}
                      </p>
                  </div>
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
                        {menuItems.filter(i => !i.restaurant).length > 0 && (
                            <div className="mt-2 text-[10px] font-black uppercase text-amber-500 animate-pulse bg-amber-500/5 px-4 py-2 rounded-xl border border-amber-500/10 flex items-center gap-2">
                                <AlertCircle size={14}/> {menuItems.filter(i => !i.restaurant).length} Unassigned Items Detected (Global Menu)
                            </div>
                        )}
                    </div>
                     <div className="flex flex-wrap gap-3">
                         {/* Hidden file input for menu CSV import */}
                         <input
                             type="file"
                             accept=".csv"
                             className="hidden"
                             ref={menuFileInputRef}
                             onChange={(e) => handleBulkUpload(e, 'menu')}
                         />
                         {/* CSV template download */}
                         <button
                             onClick={() => {
                               const cols = 'name,price,description,is_veg,prep_time,rating,image_url,is_featured,restaurant_name,category_name\nButter Chicken,299,Rich creamy curry,false,25,4.5,,false,My Restaurant,';
                               const blob = new Blob([cols], { type: 'text/csv' });
                               const url = URL.createObjectURL(blob);
                               const a = document.createElement('a');
                               a.href = url; a.download = 'menu_template.csv'; a.click();
                               URL.revokeObjectURL(url);
                               toast.success('Template downloaded! Leave category_name blank to auto-categorize items');
                             }}
                             className="bg-white/5 text-gray-400 font-bold px-4 py-3 rounded-xl border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2 text-xs"
                         >
                             <Download size={15} /> CSV TEMPLATE
                         </button>
                         <button
                             disabled={uploading}
                             onClick={() => menuFileInputRef.current?.click()}
                             className={`font-bold px-5 py-3 rounded-xl border border-emerald-500/20 transition-all flex items-center gap-2 ${
                               uploading ? 'bg-emerald-500/5 text-emerald-500/40 opacity-60 cursor-not-allowed' : 'bg-white/5 text-emerald-500 hover:bg-emerald-500/10'
                             }`}
                         >
                             <FileUp size={18} /> {uploading ? 'IMPORTING...' : 'BULK IMPORT'}
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
                          <img src={!item.image_url ? 'https://via.placeholder.com/200' : (item.image_url.startsWith('http') ? item.image_url : `${API.includes('quickcombo.in') ? LIVE_BACKEND : API}${item.image_url}`)} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
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
                          <img src={!item.image_url ? 'https://via.placeholder.com/200' : (item.image_url.startsWith('http') ? item.image_url : `${API.includes('quickcombo.in') ? LIVE_BACKEND : API}${item.image_url}`)} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-emerald-400 uppercase border border-white/10 italic">
                            {item.category_name}
                          </div>
                       </div>
                       <h4 className="font-black text-lg mb-1 truncate uppercase">{item.name}</h4>
                       <div className="flex justify-between items-center mb-4 text-white">
                            <span className="text-2xl font-black text-emerald-500 italic">ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¹{item.price}</span>
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

             {activeTab === 'combos' && (
              <motion.div 
                key="combos" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#080808] rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-10 border border-white/5 shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-10">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black italic uppercase">Combos Hub</h3>
                    <p className="text-gray-500">Manage hand-picked bundles and specialized pricing</p>
                  </div>
                  <button 
                    onClick={() => openModal('combo')}
                    className="bg-emerald-500 text-black font-black px-6 py-3 rounded-xl hover:bg-emerald-400 transition-all flex items-center gap-2 self-start sm:self-auto"
                  >
                    <Plus size={18} /> CREATE NEW BUNDLE
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {combos.map(combo => (
                    <div key={combo.id} className="bg-white/5 rounded-[32px] overflow-hidden border border-white/5 group hover:border-emerald-500/20 transition-all flex flex-col">
                      <div className="h-40 relative">
                        <img src={combo.image_url || combo.items[0]?.image_url} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] to-transparent" />
                        <div className="absolute bottom-5 left-5">
                          <h4 className="font-black text-2xl italic uppercase">{combo.name}</h4>
                          <p className="text-emerald-500 font-black text-xl italic">₹{combo.price}</p>
                        </div>
                      </div>
                      <div className="p-6 flex-grow">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {combo.items.map((item: any) => (
                            <span key={item.id} className="text-[10px] font-black bg-white/5 px-2.5 py-1.5 rounded-lg text-gray-400 uppercase border border-white/5">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-6 pt-0 flex justify-end gap-3">
                         <button 
                            onClick={() => deleteEntity('combo', combo.id)}
                            className="p-3 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                          >
                            <Trash2 size={20} />
                          </button>
                      </div>
                    </div>
                  ))}
                  {combos.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-600 font-black uppercase tracking-widest italic border-2 border-dashed border-white/5 rounded-[2rem]">
                      No active combos detected in infrastructure
                    </div>
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
              <motion.div key="restaurants" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
                {/* PERSISTENT HIDDEN INPUTS (Must stay mounted for refs to work) */}
                <input type="file" accept=".csv" className="hidden" ref={restaurantFileInputRef} onChange={(e) => handleBulkUpload(e, 'restaurants')} />
                <input type="file" accept=".csv" className="hidden" ref={perRestaurantFileInputRef} onChange={handlePerRestaurantImport} />

                {!isMenuDrilldown ? (
                  <>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex gap-4">
                            <button
                                onClick={() => openModal('restaurant')}
                                className="bg-emerald-500 text-black font-black px-6 py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10"
                            >
                                <Plus size={20} /> ADD PARTNER
                            </button>
                            
                            <button
                                disabled={uploading}
                                onClick={() => restaurantFileInputRef.current?.click()}
                                className={`font-bold px-6 py-4 rounded-2xl border border-white/10 transition-all flex items-center gap-2 ${
                                  uploading ? 'bg-white/5 text-gray-600 opacity-50 cursor-not-allowed' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                <FileUp size={20} /> {uploading ? 'IMPORTING...' : 'BULK IMPORT (CSV)'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {restaurants.map(res => (
                        <div key={res.id} className="bg-[#080808] p-6 rounded-[2rem] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-emerald-500/20 transition-all group">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                                    <img src={!res.image_url ? 'https://via.placeholder.com/100' : (res.image_url.startsWith('http') ? res.image_url : `${API.includes('quickcombo.in') ? LIVE_BACKEND : API}${res.image_url}`)} alt={res.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="text-2xl font-black uppercase italic text-white flex items-center gap-2">
                                        {res.name}
                                        {res.is_featured && <ShieldCheck size={16} className="text-emerald-500" />}
                                    </h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-lg">
                                            <TrendingUp size={14}/> {res.rating}
                                        </div>
                                        <div className="text-gray-500 text-sm font-medium uppercase tracking-wider">{res.cuisines}</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-center gap-1.5">
                                    <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Portal Status</label>
                                    <button 
                                        onClick={async () => {
                                            try {
                                                await axios.patch(`${API}/api/admin/restaurants/`, { id: res.id, is_active: !res.is_active }, getHeaders());
                                                toast.success(`${res.name} ${!res.is_active ? 'ONLINE' : 'OFFLINE'}`);
                                                fetchData();
                                            } catch (e) { toast.error('Toggle failed'); }
                                        }}
                                        className={`w-14 h-8 rounded-full p-1 transition-all relative ${res.is_active ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                                    >
                                        <div className={`w-6 h-6 rounded-full transition-all shadow-md ${res.is_active ? 'translate-x-6 bg-emerald-500' : 'translate-x-0 bg-red-500'}`} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => { setTargetRestaurant({id: res.id, name: res.name}); fetchRestaurantMenu(res.id); }}
                                        className="px-6 py-3 bg-emerald-500 text-black font-black rounded-xl hover:scale-105 transition-all flex items-center gap-2 uppercase italic text-xs shadow-lg shadow-emerald-500/20"
                                    >
                                        <Menu size={16}/> Manage Menu
                                    </button>
                                    <button onClick={() => openModal('restaurant', res)} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 border border-white/10"><Edit2 size={18}/></button>
                                    <button onClick={() => deleteEntity('restaurant', res.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white border border-red-500/20"><Trash2 size={18}/></button>
                                </div>
                            </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-6 border-b border-white/5 pb-8">
                          <div className="flex items-center gap-6">
                              <button onClick={() => setIsMenuDrilldown(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/10">
                                  <X className="rotate-90" size={20} />
                              </button>
                              <div>
                                  <h3 className="text-4xl font-black italic uppercase text-emerald-500 leading-none mb-2">{targetRestaurant?.name} Menu</h3>
                                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Direct Database Manipulation Mode</p>
                              </div>
                          </div>
                          <div className="flex gap-3">
                              <button
                                  onClick={() => perRestaurantFileInputRef.current?.click()}
                                  className="bg-white/5 text-emerald-500 font-bold px-6 py-4 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500/10 transition-all flex items-center gap-2 uppercase italic text-xs"
                              >
                                  <FileUp size={18} /> Import CSV for this restaurant
                              </button>
                              <button onClick={() => openModal('menu', { restaurant: targetRestaurant?.id })} className="bg-emerald-500 text-black font-black px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/10">
                                  <Plus size={20} /> ADD ITEM
                              </button>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                          {selectedRestMenu.map(item => (
                              <div key={item.id} className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 flex flex-col xl:flex-row items-center justify-between gap-8 group hover:bg-white/[0.05] transition-all">
                                  <div className="flex items-center gap-6 flex-1 w-full">
                                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                                          <img src={!item.image_url ? 'https://via.placeholder.com/80' : (item.image_url.startsWith('http') ? item.image_url : `${API.includes('quickcombo.in') ? LIVE_BACKEND : API}${item.image_url}`)} className="w-full h-full object-cover" />
                                      </div>
                                      <div className="flex-1">
                                          <div className="flex items-center gap-3">
                                              <span className={`w-3 h-3 rounded-full ${item.is_veg ? 'bg-emerald-500' : 'bg-red-500'}`} title={item.is_veg ? 'Veg' : 'Non-Veg'} />
                                              <h5 className="text-lg font-black uppercase italic text-white/90">{item.name}</h5>
                                          </div>
                                          <p className="text-gray-500 text-xs mt-1 truncate max-w-sm">{item.description}</p>
                                      </div>
                                      <div className="font-black text-2xl text-emerald-500 italic shrink-0">₹{item.price}</div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-8 w-full xl:w-auto">
                                      {/* Manual Category Selection */}
                                      <div className="flex flex-col gap-1.5">
                                          <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Manual Category</label>
                                          <select 
                                              value={item.category || ''}
                                              onChange={(e) => updateItemInline(item.id, { category: e.target.value })}
                                              className="bg-[#050505] border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-emerald-500/50 appearance-none min-w-[180px]"
                                          >
                                              <option value="">Select Category</option>
                                              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                                          </select>
                                      </div>

                                      {/* Available Toggle */}
                                      <div className="flex flex-col gap-1.5 items-center">
                                          <label className="text-[10px] font-black uppercase text-gray-600 tracking-widest">Availability</label>
                                          <button 
                                              onClick={() => updateItemInline(item.id, { is_available: !item.is_available })}
                                              className={`w-14 h-8 rounded-full p-1 transition-all flex relative ${item.is_available ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}
                                          >
                                              <div className={`w-6 h-6 rounded-full transition-all shadow-md ${item.is_available ? 'translate-x-6 bg-emerald-500' : 'translate-x-0 bg-red-500'}`} />
                                          </button>
                                      </div>

                                      <div className="flex gap-2 shrink-0">
                                          <button onClick={() => openModal('menu', item)} className="p-3.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5"><Edit2 size={16}/></button>
                                          <button onClick={() => deleteEntity('menu', item.id)} className="p-3.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"><Trash2 size={16}/></button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                          {selectedRestMenu.length === 0 && (
                              <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem]">
                                  <Utensils className="mx-auto text-gray-700 mb-6" size={48} />
                                  <h4 className="text-xl font-black text-gray-600 uppercase italic">No items found for this restaurant</h4>
                                  <p className="text-gray-700 text-sm mt-2">Use the bulk import or add a manual item to start.</p>
                              </div>
                          )}
                  </div>
              </div>
            )}
          </motion.div>
        )}
            {activeTab === 'promos' && (
              <motion.div key="promos" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-[#080808] rounded-[2.5rem] p-6 lg:p-10 border border-white/5 flex flex-col gap-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-3xl font-black italic uppercase text-white">Promo Hub</h3>
                        <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Discount Campaign Orchestration</p>
                    </div>
                    <button 
                        onClick={() => openModal('coupon')}
                        className="bg-emerald-500 text-black font-black px-8 py-4 rounded-2xl flex items-center gap-2 hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-500/10"
                    >
                        <Plus size={20} /> CREATE CAMPAIGN
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {coupons.map(cpn => (
                        <div key={cpn.id} className="bg-white/[0.03] border border-white/5 p-8 rounded-[2rem] hover:border-emerald-500/20 transition-all relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform">
                                <Ticket size={80} className="text-emerald-500" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h4 className="text-3xl font-black text-emerald-500 tracking-tighter italic">{cpn.code}</h4>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">
                                            {cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} FLAT`}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${cpn.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                            {cpn.is_active ? 'ACTIVE' : 'PAUSED'}
                                        </span>
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest italic">Exp: {new Date(cpn.expiry_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Uses</p>
                                        <p className="text-lg font-black text-white italic">{cpn.times_used} / {cpn.total_max_uses || '∞'}</p>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Min Val</p>
                                        <p className="text-lg font-black text-white italic">₹{cpn.min_order_value}</p>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button onClick={() => openModal('coupon', cpn)} className="flex-grow py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase italic border border-white/5 transition-all">CONFIGURE</button>
                                    <button onClick={() => deleteEntity('coupon', cpn.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20"><Trash2 size={16}/></button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {coupons.length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-[2rem] text-gray-600 font-black uppercase italic tracking-widest">No Promo Campaigns Detected</div>
                    )}
                </div>
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
        
        {/* IMPORT LOG MODAL */}
        <AnimatePresence>
          {showImportLog && importLog && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowImportLog(false)} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
                className="w-full max-w-2xl bg-[#0a0a0a] border border-emerald-500/20 rounded-[2rem] p-8 shadow-2xl relative z-10 overflow-y-auto max-h-[85vh]"
              >
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic text-white">Auto-Categorization Report</h3>
                    <p className="text-gray-500 text-sm mt-1">{importLog.length} items processed ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â categories assigned automatically</p>
                  </div>
                  <button onClick={() => setShowImportLog(false)} className="p-2 hover:bg-white/5 rounded-lg"><X size={20}/></button>
                </div>
                <div className="space-y-2 overflow-y-auto max-h-[55vh]">
                  {importLog.map((entry: any, i: number) => {
                    const isAuto = entry.category_assigned?.startsWith('auto:');
                    const isFallback = entry.category_assigned?.startsWith('fallback:');
                    const label = entry.category_assigned
                      ?.replace('auto:', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸Ãƒâ€šÃ‚Â¤ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ Auto ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ')
                      ?.replace('csv_id', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¹ From CSV ID')
                      ?.replace('csv_name', 'ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒâ€šÃ‚Â From CSV Name')
                      ?.replace('fallback:', 'ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Fallback ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ');
                    return (
                      <div key={i} className={`flex items-center justify-between gap-4 p-3 rounded-xl border ${
                        isAuto ? 'bg-emerald-500/5 border-emerald-500/20' :
                        isFallback ? 'bg-amber-500/5 border-amber-500/20' :
                        'bg-white/5 border-white/5'
                      }`}>
                        <span className="text-white font-bold text-sm truncate flex-1">{entry.item}</span>
                        <span className={`text-xs font-black uppercase tracking-wide shrink-0 ${
                          isAuto ? 'text-emerald-400' : isFallback ? 'text-amber-400' : 'text-gray-400'
                        }`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowImportLog(false)}
                  className="w-full mt-6 py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all"
                >
                  GOT IT ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â CLOSE
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

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
                        menuItems={menuItems}
                        adminPassword={adminPassword}
                    />
                </div>
            )}
         </AnimatePresence>
      </main>
    </div>
  );
}

function EntityModal({ type, entity, onClose, onSave, headers, categories, restaurants, menuItems, adminPassword }: any) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<any>(entity || {});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const sanitizedData = { ...formData };
        if (sanitizedData.category === '') sanitizedData.category = null;
        if (sanitizedData.restaurant === '') sanitizedData.restaurant = null;

        try {
            let endpoint = '';
            if (type === 'restaurant') endpoint = '/api/admin/restaurants/';
            else if (type === 'menu') endpoint = '/api/admin/menu/';
            else if (type === 'category') endpoint = '/api/admin/categories/';
            else if (type === 'coupon') endpoint = '/api/admin/coupons/';
            else if (type === 'combo') endpoint = '/api/admin/combos/';

            if (entity?.id) {
                await axios.patch(`${API}${endpoint}`, { ...sanitizedData, id: entity.id, category_slug: entity.category_slug }, headers);
                toast.success('Updated successfully');
            } else {
                await axios.post(`${API}${endpoint}`, { ...sanitizedData, category_slug: entity?.category_slug }, headers);
                toast.success('Created successfully');
            }
            onSave();
            onClose();
        } catch (err: any) {
            console.error('Submit Error:', err.response?.data);
            const data = err.response?.data;
            if (data && typeof data === 'object') {
                const errors = Object.entries(data)
                    .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
                    .join(' | ');
                toast.error(errors || 'Operation failed');
            } else {
                toast.error(err.response?.data?.detail || 'Operation failed. Check console.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Size check on frontend too (20MB)
        if (file.size > 20 * 1024 * 1024) {
            toast.error('File too large. Max 20MB allowed.');
            return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append('file', file);

        const uploadLoading = toast.loading('Syncing high-res media...');
        try {
            const base = API.includes('quickcombo.in') ? LIVE_BACKEND : API;
            const res = await axios.post(`${base}/api/admin/upload-image/`, formDataUpload, {
                headers: { 
                    'X-Admin-Password': adminPassword,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Set the relative URL returned by the backend
            setFormData({ ...formData, image_url: res.data.url });
            toast.success('Media synced to server!', { id: uploadLoading });
        } catch (err: any) {
            const errorMsg = err.response?.data?.error || 'Upload failed. Try again.';
            toast.error(errorMsg, { id: uploadLoading });
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
                            placeholder={`Enter ${type === 'coupon' ? 'Promo Code (e.g. MEGA50)' : type + ' name'}`}
                            value={formData.code || formData.name || ''}
                            onChange={e => setFormData({ ...formData, [type === 'coupon' ? 'code' : 'name']: type === 'coupon' ? e.target.value.toUpperCase().replace(/\s/g, '') : e.target.value })}
                        />
                    </div>

                    {type === 'restaurant' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="Rating" placeholder="4.5" value={formData.rating} onChange={(v: any) => setFormData({ ...formData, rating: v })} type="number" step="0.1" />
                                <FormInput label="Delivery (min)" placeholder="30" value={formData.delivery_time} onChange={(v: any) => setFormData({ ...formData, delivery_time: v })} type="number" />
                            </div>
                            <FormInput label="Cuisines" placeholder="North Indian, Chinese" value={formData.cuisines} onChange={(v: any) => setFormData({ ...formData, cuisines: v })} />
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Restaurant Logo / Photo</label>
                                <div 
                                    onClick={() => document.getElementById('file-upload-rest')?.click()}
                                    className="group relative w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-white/[0.07] transition-all overflow-hidden"
                                >
                                    {formData.image_url ? (
                                        <>
                                            <img src={formData.image_url.startsWith('http') ? formData.image_url : `${API.includes('quickcombo.in') ? LIVE_BACKEND : API}${formData.image_url}`} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="bg-black/60 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic text-white backdrop-blur-md border border-white/10">Change Photo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-2 group-hover:text-emerald-500 transition-colors">📸</div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Click to Upload</span>
                                        </>
                                    )}
                                    <input id="file-upload-rest" type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                </div>
                                <div className="pt-1 flex justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newUrl = prompt('Enter Image URL manually:', formData.image_url);
                                            if (newUrl !== null) setFormData({ ...formData, image_url: newUrl });
                                        }}
                                        className="text-[9px] font-black text-gray-600 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                                    >
                                        Edit URL Manually
                                    </button>
                                </div>
                             </div>
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
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none text-white"
                                    value={formData.category || ''}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                >
                                    <option value="" className="bg-black">Select Category</option>
                                    {categories.map((c: any) => <option key={c.id} value={c.id} className="bg-black">{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Partner Node</label>
                                <select 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none text-white"
                                    value={formData.restaurant || ''}
                                    onChange={e => setFormData({ ...formData, restaurant: e.target.value })}
                                >
                                    <option value="" className="bg-black">No Partner (Internal / QuickCombo)</option>
                                    {restaurants.map((r: any) => <option key={r.id} value={r.id} className="bg-black">{r.name}</option>)}
                                </select>
                            </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Dish Photo</label>
                                <div 
                                    onClick={() => document.getElementById('file-upload-dish')?.click()}
                                    className="group relative w-full h-40 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-white/[0.07] transition-all overflow-hidden"
                                >
                                    {formData.image_url ? (
                                        <>
                                            <img src={formData.image_url.startsWith('http') ? formData.image_url : `${API.includes('quickcombo.in') ? LIVE_BACKEND : API}${formData.image_url}`} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="bg-black/60 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic text-white backdrop-blur-md border border-white/10">Change Photo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-2 group-hover:text-emerald-500 transition-colors">🍔</div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Click to Upload</span>
                                        </>
                                    )}
                                    <input id="file-upload-dish" type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                </div>
                                <div className="pt-1 flex justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newUrl = prompt('Enter Image URL manually:', formData.image_url);
                                            if (newUrl !== null) setFormData({ ...formData, image_url: newUrl });
                                        }}
                                        className="text-[9px] font-black text-gray-600 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                                    >
                                        Edit URL Manually
                                    </button>
                                </div>
                             </div>
                        </>
                    )}

                    {type === 'category' && (
                        <>
                            <FormInput label="Emoji/Icon" placeholder="ðŸ”" value={formData.icon} onChange={(v: any) => setFormData({ ...formData, icon: v })} />
                            <FormInput label="System Slug" placeholder="fast-food" value={formData.slug} onChange={(v: any) => setFormData({ ...formData, slug: v })} />
                        </>
                    )}

                    {type === 'coupon' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Discount Logic</label>
                                    <select 
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none text-white"
                                        value={formData.discount_type || 'percentage'}
                                        onChange={e => setFormData({ ...formData, discount_type: e.target.value })}
                                    >
                                        <option value="percentage" className="bg-black">Percentage (%)</option>
                                        <option value="fixed" className="bg-black">Fixed Amount (₹)</option>
                                    </select>
                                </div>
                                <FormInput label="Discount Value" placeholder="10" value={formData.discount_value} onChange={(v: any) => setFormData({ ...formData, discount_value: v })} type="number" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="Min Order (₹)" placeholder="200" value={formData.min_order_value} onChange={(v: any) => setFormData({ ...formData, min_order_value: v })} type="number" />
                                <FormInput label="Max Discount (₹)" placeholder="100" value={formData.max_discount_amount} onChange={(v: any) => setFormData({ ...formData, max_discount_amount: v })} type="number" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput 
                                    label="Expiry Date" 
                                    type="date"
                                    value={formData.expiry_date ? new Date(formData.expiry_date).toISOString().split('T')[0] : ''} 
                                    onChange={(v: any) => setFormData({ ...formData, expiry_date: v })} 
                                />
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Manual Toggle</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase italic transition-all border ${formData.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                                    >
                                        {formData.is_active ? 'ACTIVE_ON' : 'DEACTIVATED'}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormInput label="Uses per User" placeholder="1" value={formData.max_uses_per_user} onChange={(v: any) => setFormData({ ...formData, max_uses_per_user: v })} type="number" />
                                <FormInput label="Total Uses (Cap)" placeholder="Unset" value={formData.total_max_uses} onChange={(v: any) => setFormData({ ...formData, total_max_uses: v })} type="number" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Public Visibility</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase italic transition-all border ${formData.is_public ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
                                    >
                                        {formData.is_public ? 'SHOWN_ON_CHECKOUT' : 'HIDDEN_FROM_PUBLIC'}
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Free Delivery</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_free_delivery: !formData.is_free_delivery })}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase italic transition-all border ${formData.is_free_delivery ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_15px_#f59e0b11]' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
                                    >
                                        {formData.is_free_delivery ? 'FREE_DELIVERY_ON' : 'STANDARD_FEES'}
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status Toggle</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase italic transition-all border ${formData.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
                                    >
                                        {formData.is_active ? 'ENABLED' : 'DISABLED'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                    {type === 'combo' && (
                        <>
                            <FormInput label="Bundle Price (₹)" placeholder="499" value={formData.price} onChange={(v: any) => setFormData({ ...formData, price: v })} type="number" />
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Bundle Hero Photo (Swiggy Style)</label>
                                <div 
                                    onClick={() => document.getElementById('file-upload-combo')?.click()}
                                    className="group relative w-full h-44 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-white/[0.07] transition-all overflow-hidden"
                                >
                                    {formData.image_url ? (
                                        <>
                                            <img src={formData.image_url.startsWith('http') ? formData.image_url : `${API.includes('quickcombo.in') ? LIVE_BACKEND : API}${formData.image_url}`} alt="Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="bg-black/60 px-4 py-2 rounded-xl text-[10px] font-black uppercase italic text-white backdrop-blur-md border border-white/10">Change Photo</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 mb-2 group-hover:text-emerald-500 transition-colors">🍱</div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 text-center px-6">Upload Composite Photo<br/><span className="text-[8px] opacity-50">(Burger + Fries + Drink)</span></span>
                                        </>
                                    )}
                                    <input id="file-upload-combo" type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                </div>
                                <div className="pt-1 flex justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => {
                                            const newUrl = prompt('Enter Image URL manually:', formData.image_url);
                                            if (newUrl !== null) setFormData({ ...formData, image_url: newUrl });
                                        }}
                                        className="text-[9px] font-black text-gray-600 hover:text-emerald-500 uppercase tracking-widest transition-colors"
                                    >
                                        Edit URL Manually
                                    </button>
                                </div>
                             </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Combo Description</label>
                                <textarea 
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 text-sm h-24"
                                    placeholder="e.g. 1 Veg Burger + Medium Fries + Coke (250ml)"
                                    value={formData.description || ''}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Source Restaurant</label>
                                <select 
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-emerald-500/50 appearance-none text-white"
                                    value={formData.restaurant || ''}
                                    onChange={e => {
                                        setFormData({ ...formData, restaurant: e.target.value, item_ids: [] });
                                    }}
                                >
                                    <option value="" className="bg-black">Select Restaurant</option>
                                    {restaurants.map((r: any) => <option key={r.id} value={r.id} className="bg-black">{r.name}</option>)}
                                </select>
                            </div>
                            {formData.restaurant && (
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Select Bundle Items</label>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                        {menuItems.filter((item: any) => item.restaurant == formData.restaurant).map((item: any) => (
                                            <label key={item.id} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all">
                                                <input 
                                                    type="checkbox" 
                                                    checked={formData.item_ids?.includes(item.id)}
                                                    onChange={e => {
                                                        const ids = formData.item_ids || [];
                                                        if (e.target.checked) setFormData({ ...formData, item_ids: [...ids, item.id] });
                                                        else setFormData({ ...formData, item_ids: ids.filter((id: number) => id !== item.id) });
                                                    }}
                                                    className="w-4 h-4 accent-emerald-500 rounded border-white/10 bg-black"
                                                />
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black uppercase italic">{item.name}</span>
                                                    <span className="text-[9px] text-gray-500 font-bold">₹{item.price}</span>
                                                </div>
                                            </label>
                                        ))}
                                        {menuItems.filter((item: any) => item.restaurant == formData.restaurant).length === 0 && (
                                            <div className="text-center py-6 text-[10px] text-gray-600 font-bold uppercase italic">No items found for this restaurant</div>
                                        )}
                                    </div>
                                </div>
                            )}
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
