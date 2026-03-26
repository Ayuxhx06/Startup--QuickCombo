'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Phone, MapPin, LogOut, Edit2, ShoppingBag, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    axios.get(`${API}/api/user/profile/`, { headers: { 'X-User-Email': user.email } })
      .then(res => { 
        setProfile(res.data);
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
        setLoading(false); 
      })
      .catch((err) => {
        console.error("Failed to load profile from backend", err);
        // Fallback gracefully instead of showing a blank screen if DB gets wiped
        setProfile({ name: user.name, email: user.email, orders_count: 0, addresses: [] });
        setName(user.name || '');
        setLoading(false);
      });
  }, [user, router]);

  const handleSave = () => {
    if (!user) return;
    axios.patch(`${API}/api/user/profile/`, { name, phone }, { headers: { 'X-User-Email': user.email } })
      .then(res => {
        setProfile(res.data);
        setEditing(false);
        toast.success('Profile updated successfully');
      })
      .catch(() => toast.error('Failed to update. Make sure you are logged in.'));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-24 min-h-screen bg-[#0a0a0a]">
      {/* Dynamic Ambient Header Gradient */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-green-500/20 via-black to-transparent pointer-events-none" />

      {/* Header */}
      <div className="px-4 pt-6 pb-2 sticky top-0 z-20 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
        <h1 className="text-2xl font-black text-white px-2">Account</h1>
        <button onClick={handleLogout} className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-red-400 transition-colors">
          <LogOut size={18} />
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1 relative z-10">
        {loading ? (
          <div className="space-y-4">
            <div className="h-40 rounded-[28px] shimmer" />
            <div className="h-64 rounded-[28px] shimmer" />
          </div>
        ) : profile ? (
          <>
            {/* Header Identity Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-white/10 rounded-[32px] p-6 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-black text-3xl font-black shadow-[0_0_20px_rgba(34,197,94,0.3)] shrink-0 border-[3px] border-[#1c1c1c]">
                  {profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white truncate pr-2">{profile.name || 'QC Member'}</h2>
                    {profile.orders_count > 0 && <ShieldCheck className="text-green-500 shrink-0" size={20} />}
                  </div>
                  <p className="text-green-400 text-sm font-bold truncate mt-0.5">{profile.email}</p>
                  <p className="text-gray-500 text-xs font-semibold mt-1">Verified Member</p>
                </div>
              </div>

              {/* Order Stats */}
              <div className="mt-6 pt-5 border-t border-white/5 flex items-center justify-around text-center">
                 <button onClick={() => router.push('/orders')} className="hover:scale-105 transition-transform">
                    <p className="text-2xl font-black text-white">{profile.orders_count || 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-green-500 font-bold mt-1">Total Orders</p>
                    <p className="text-[9px] text-gray-500 font-bold">VIEW HISTORY ↗</p>
                 </button>
                 <div className="w-[1px] h-8 bg-white/10" />
                 <div>
                    <p className="text-2xl font-black text-white flex items-center justify-center gap-1">
                      0 <span className="text-sm text-yellow-500">⭐</span>
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mt-1">QC Points</p>
                 </div>
              </div>
            </motion.div>

            {/* Profile Settings */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }} className="space-y-3">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">Personal Info</h3>
                <button onClick={() => { if(editing) handleSave(); else setEditing(true); }} className="text-green-500 text-xs font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 hover:bg-green-500/20 transition-colors">
                  {editing ? 'Save' : <><Edit2 size={12} /> Edit</>}
                </button>
              </div>

              <div className="bg-[#141414] rounded-3xl p-1.5 border border-white/5 shadow-xl">
                <div className="p-3 flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 rounded-2xl text-gray-400"><User size={18} /></div>
                  <div className="flex-1 border-b border-white/5 pb-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Full Name</p>
                    {editing ? <input className="w-full bg-black/40 text-white text-sm px-3 py-2 rounded-xl focus:border-green-500 outline-none border border-white/10 transition-colors" value={name} onChange={e => setName(e.target.value)} autoFocus placeholder="Enter your name" /> : <p className="font-semibold text-white text-sm">{profile.name || 'Not provided'}</p>}
                  </div>
                </div>
                <div className="p-3 flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 rounded-2xl text-gray-400"><Phone size={18} /></div>
                  <div className="flex-1 border-b border-white/5 pb-3">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Phone Number</p>
                    {editing ? <input className="w-full bg-black/40 text-white text-sm px-3 py-2 rounded-xl focus:border-green-500 outline-none border border-white/10 transition-colors" value={phone} onChange={e => setPhone(e.target.value)} type="tel" placeholder="Enter phone number" /> : <p className="font-semibold text-white text-sm">{profile.phone || 'Not provided'}</p>}
                  </div>
                </div>
                <div className="p-3 flex items-center gap-3">
                  <div className="p-2.5 bg-white/5 rounded-2xl text-green-500/60"><Mail size={18} /></div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Email Address</p>
                    <p className="font-semibold text-gray-300 text-sm flex items-center gap-2">
                       {profile.email} <ShieldCheck size={14} className="text-green-500" />
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Saved Addresses */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }} className="pt-2 space-y-3">
              <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest px-2 mb-2 flex items-center gap-2">
                <MapPin size={14} /> Saved Locations
              </h3>
              
              {profile.addresses && profile.addresses.length > 0 ? (
                profile.addresses.map((addr: any) => (
                  <div key={addr.id} className="bg-[#141414] border border-white/5 rounded-3xl p-4 flex items-start gap-4">
                    <div className="p-3 bg-white/5 text-white rounded-2xl shrink-0"><MapPin size={20} /></div>
                    <div className="pt-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-white tracking-tight">{addr.label}</span>
                        {addr.is_default && <span className="bg-green-500 text-black text-[10px] font-black px-2 py-0.5 rounded shadow-[0_0_10px_rgba(34,197,绿,0.4)]">DEFAULT</span>}
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-medium">{addr.line1}, {addr.city} - {addr.pincode}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-[#141414] rounded-3xl p-6 text-center border border-white/5 border-dashed">
                  <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center text-gray-500 mb-3"><MapPin size={24} /></div>
                  <p className="text-sm font-semibold text-white mb-1">No saved addresses</p>
                  <p className="text-xs text-gray-500 max-w-[200px] mx-auto">They will be automatically saved securely during checkout.</p>
                </div>
              )}
            </motion.div>
          </>
        ) : null}
      </div>
    </div>
  );
}
