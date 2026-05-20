'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function RiderLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/rider/auth/`, { email, password });
      
      // Save token and user details
      localStorage.setItem('rider_token', res.data.token);
      localStorage.setItem('rider_user', JSON.stringify(res.data.user));
      
      toast.success('Login Successful');
      
      // If profile is incomplete, dashboard will ask for it
      router.push('/delivery/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full -mr-48 -mt-48 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[100px] rounded-full -ml-48 -mb-48 pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-3xl mx-auto mb-6 flex items-center justify-center border border-emerald-500/30">
            <LogIn size={40} className="text-emerald-500" />
          </div>
          <h1 className="text-3xl font-black mb-2">Rider Portal</h1>
          <p className="text-gray-400">Login or create your delivery account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <Mail size={20} />
            </div>
            <input 
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
              <Lock size={20} />
            </div>
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Continue'}
            {!loading && <ChevronRight size={20} />}
          </button>
        </form>
        
        <p className="text-center text-xs text-gray-500 mt-8">
          By continuing, you agree to our Terms & Conditions for Delivery Partners.
        </p>
      </motion.div>
    </div>
  );
}
