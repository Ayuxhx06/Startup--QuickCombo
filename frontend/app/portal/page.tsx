'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, ShoppingBag, Utensils, Settings, 
  TrendingUp, Clock, CheckCircle, Package, Search,
  Plus, Edit2, Trash2, ChevronRight, LogOut, Loader2, Lock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function AdminPortal() {
  const [adminPassword, setAdminPassword] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [combos, setCombos] = useState<any[]>([]);

  // Auto-login check
  useEffect(() => {
    const savedPass = sessionStorage.getItem('QC_ADMIN_PASS');
    if (savedPass) {
      setAdminPassword(savedPass);
    }
    setIsChecking(false);
  }, []);

  // Fetch Data when password is set
  useEffect(() => {
    if (adminPassword) {
      fetchData();
    }
  }, [adminPassword]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) return;
    sessionStorage.setItem('QC_ADMIN_PASS', inputPassword);
    setAdminPassword(inputPassword);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('QC_ADMIN_PASS');
    setAdminPassword('');
    setStats(null);
    setOrders([]);
    setMenuItems([]);
    setCombos([]);
  };

  const getHeaders = () => ({
    headers: { 'X-Admin-Password': adminPassword }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sRes, oRes, mRes, cRes] = await Promise.all([
        axios.get(`${API}/api/admin/stats/`, getHeaders()),
        axios.get(`${API}/api/admin/orders/`, getHeaders()),
        axios.get(`${API}/api/admin/menu/`, getHeaders()),
        axios.get(`${API}/api/admin/combos/`, getHeaders())
      ]);
      setStats(sRes.data);
      setOrders(oRes.data);
      setMenuItems(mRes.data);
      setCombos(cRes.data);
    } catch (e: any) {
      toast.error('Invalid Credentials or Load Failed');
      if (e.response?.status === 401 || e.response?.status === 403) {
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, status: string) => {
    try {
      await axios.patch(`${API}/api/admin/orders/`, { order_id: orderId, status }, getHeaders());
      toast.success(`Order #${orderId} set to ${status}`);
      fetchData();
    } catch (e) {
      toast.error('Update failed');
    }
  };

  const deleteMenuItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      await axios.delete(`${API}/api/admin/menu/`, { data: { id }, ...getHeaders() });
      toast.success('Deleted successfully');
      fetchData();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  const deleteCombo = async (id: number) => {
    if (!confirm('Are you sure you want to delete this combo?')) return;
    try {
      await axios.delete(`${API}/api/admin/combos/`, { data: { id }, ...getHeaders() });
      toast.success('Combo deleted');
      fetchData();
    } catch (e) {
      toast.error('Delete failed');
    }
  };

  if (isChecking) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="animate-spin text-green-500 w-8 h-8"/></div>;
  }

  // --- LOGIN SCREEN ---
  if (!adminPassword) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-[#0a0a0a] rounded-3xl p-8 border border-white/10 shadow-2xl"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_#22c55e44]">
              <Lock className="text-black w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center text-white mb-2 tracking-tight">Admin Portal</h1>
          <p className="text-gray-500 text-center mb-8">Enter the master password to access</p>
          
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Master Password" 
              value={inputPassword}
              onChange={e => setInputPassword(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-green-500 transition-all font-mono"
              autoFocus
            />
            <button 
              type="submit"
              className="bg-green-500 text-black font-bold py-4 rounded-xl hover:bg-green-400 transition-all flex justify-center items-center gap-2"
            >
              Access Dashboard
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <motion.aside 
        initial={{ x: -100 }} animate={{ x: 0 }}
        className="w-64 bg-[#0a0a0a] border-r border-white/5 p-6 flex flex-col gap-8 sticky top-0 h-screen"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_#22c55e44]">
            <Utensils className="text-black w-6 h-6" />
          </div>
          <h1 className="font-black text-xl tracking-tighter">QC ADMIN</h1>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders', icon: ShoppingBag },
            { id: 'menu', label: 'Menu Items', icon: Utensils },
            { id: 'combos', label: 'Combos', icon: Package },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-green-500/10 text-green-500 border border-green-500/20 shadow-[inset_0_0_15px_#22c55e11]' 
                : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={20} />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
        >
          <LogOut size={20} />
          <span className="font-semibold">Lock Portal</span>
        </button>
      </motion.aside>

      <main className="flex-grow p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-bold capitalize">{activeTab}</h2>
            <p className="text-gray-500">Master Level Access Secured</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="bg-[#0a0a0a] border border-white/5 rounded-full px-5 py-2 flex items-center gap-3 text-sm">
              <Search className="text-gray-500" size={18} /> Search System
            </button>
          </div>
        </header>

        {loading ? (
          <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin text-green-500 w-10 h-10" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-4 gap-6"
              >
                <StatCard label="Total Sales" value={`₹${stats?.total_sales || 0}`} icon={TrendingUp} color="green" />
                <StatCard label="Total Orders" value={stats?.total_orders || 0} icon={Package} color="blue" />
                <StatCard label="Pending" value={stats?.pending_orders || 0} icon={Clock} color="orange" />
                <StatCard label="Active Status" value={stats?.active_orders || 0} icon={CheckCircle} color="purple" />
                
                <div className="col-span-4 bg-[#0a0a0a] rounded-3xl p-8 border border-white/5 shadow-2xl mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-green-500 text-sm hover:underline">View All</button>
                  </div>
                  <OrderList items={orders.slice(0, 5)} onUpdate={updateOrderStatus} />
                </div>
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div 
                key="orders" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] rounded-3xl p-8 border border-white/5"
              >
                <OrderList items={orders} onUpdate={updateOrderStatus} />
              </motion.div>
            )}

            {activeTab === 'menu' && (
              <motion.div 
                key="menu" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] rounded-3xl p-8 border border-white/5"
              >
                 <div className="flex justify-between items-center mb-8">
                   <h3 className="text-xl font-bold">Manage Menu</h3>
                   <button className="bg-green-500 text-black px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
                     <Plus size={18} /> Manage via External Django DB
                   </button>
                 </div>
                 <div className="text-gray-400 mb-6 bg-black/50 p-4 rounded-xl border border-white/5 text-sm">
                   For full granular control of Food Items, Categories, and Restaurants, please use the Official Django Admin Database Backend.
                   You can permanently wipe menu items below:
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {menuItems.map(item => (
                     <div key={item.id} className="bg-white/5 rounded-2xl p-4 flex flex-col justify-between group hover:bg-white/10 transition-all border border-transparent hover:border-green-500/20">
                       <div className="flex items-start gap-4 mb-4">
                         <img src={item.image_url || 'https://via.placeholder.com/100'} className="w-16 h-16 rounded-xl object-cover" />
                         <div>
                           <h4 className="font-bold flex-1">{item.name}</h4>
                           <p className="text-sm text-gray-500">₹{item.price} • {item.category_name}</p>
                         </div>
                       </div>
                       <div className="flex justify-between items-center pt-2 border-t border-white/5">
                         <span className="text-xs text-gray-500">ID: {item.id}</span>
                         <div className="flex gap-2">
                           <button onClick={() => deleteMenuItem(item.id)} className="p-2 bg-black rounded-lg hover:text-red-500 transition-all text-gray-400">
                             <Trash2 size={16} />
                           </button>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
              </motion.div>
            )}
            {activeTab === 'combos' && (
              <motion.div 
                key="combos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="bg-[#0a0a0a] rounded-3xl p-8 border border-white/5"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold">Predefined Combos</h3>
                  <button className="bg-green-500 text-black px-5 py-2 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
                    <Plus size={18} /> Add New Combo (via Django)
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {combos.map(combo => (
                    <div key={combo.id} className="bg-white/5 rounded-[32px] overflow-hidden border border-white/5 group hover:border-green-500/30 transition-all flex flex-col">
                      <div className="h-32 relative">
                        <img src={combo.image_url || combo.items[0]?.image_url} className="w-full h-full object-cover opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                        <div className="absolute bottom-4 left-4">
                          <h4 className="font-black text-xl">{combo.name}</h4>
                          <p className="text-green-500 font-bold">₹{combo.price}</p>
                        </div>
                      </div>
                      <div className="p-5 flex-grow">
                        <div className="flex flex-wrap gap-2 mb-4">
                          {combo.items.map((item: any) => (
                            <span key={item.id} className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded-md text-gray-400 uppercase">
                              {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-5 pt-0 flex justify-end gap-2">
                        <button onClick={() => deleteCombo(combo.id)} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {combos.length === 0 && <div className="col-span-2 text-center py-20 text-gray-500">No combos found.</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  const colors: any = {
    green: 'from-green-500/20 to-green-600/5 text-green-500 border-green-500/20',
    blue: 'from-blue-500/20 to-blue-600/5 text-blue-500 border-blue-500/20',
    orange: 'from-orange-500/20 to-orange-600/5 text-orange-500 border-orange-500/20',
    purple: 'from-purple-500/20 to-purple-600/5 text-purple-500 border-purple-500/20'
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} p-6 rounded-3xl border shadow-xl`}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-black/30 rounded-2xl"><Icon size={24} /></div>
        <ChevronRight size={18} className="opacity-30" />
      </div>
      <p className="text-sm opacity-60 mb-1">{label}</p>
      <h3 className="text-3xl font-black">{value}</h3>
    </div>
  );
}

function OrderList({ items, onUpdate }: any) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-separate border-spacing-y-3">
        <thead>
          <tr className="text-gray-500 text-sm uppercase tracking-widest bg-transparent">
            <th className="pb-4 px-4 font-normal">Order #</th>
            <th className="pb-4 px-4 font-normal">Customer</th>
            <th className="pb-4 px-4 font-normal">Items</th>
            <th className="pb-4 px-4 font-normal">Total</th>
            <th className="pb-4 px-4 font-normal">Status</th>
            <th className="pb-4 px-4 font-normal text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((order: any) => (
            <tr key={order.id} className="bg-white/5 hover:bg-white/10 transition-all">
              <td className="py-4 px-4 rounded-l-2xl font-bold bg-[#111] text-center w-20">#{order.id}</td>
              <td className="py-4 px-4 border-y border-white/5">
                <div className="text-sm font-bold">{order.user_name || 'Guest'}</div>
                <div className="text-xs text-gray-500">{order.user_email}</div>
              </td>
              <td className="py-4 px-4 border-y border-white/5 text-sm">
                {order.items?.length || 0} items
              </td>
              <td className="py-4 px-4 border-y border-white/5 font-bold text-green-500">₹{order.total}</td>
              <td className="py-4 px-4 border-y border-white/5">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  order.status === 'pending' ? 'bg-orange-500/20 text-orange-500' :
                  order.status === 'delivered' ? 'bg-green-500/20 text-green-500' :
                  'bg-blue-500/20 text-blue-500'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </td>
              <td className="py-4 px-4 rounded-r-2xl border-y border-white/5 text-right">
                <select 
                  onChange={(e) => onUpdate(order.id, e.target.value)}
                  value={order.status}
                  className="bg-black border border-white/20 rounded-lg text-xs p-2 outline-none hover:border-green-500 transition-all cursor-pointer font-bold"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="picked_up">Picked Up</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={6} className="text-center py-10 text-gray-500">No recent orders found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
