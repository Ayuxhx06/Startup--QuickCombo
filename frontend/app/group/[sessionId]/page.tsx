'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Share2, ShoppingCart, Users, Clock, Plus, Minus, Trash2, CheckCircle2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart, CartItem } from '@/context/CartContext';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface GroupItem {
  id: number;
  menu_item_id: number;
  item_name: string;
  item_price: number;
  item_image: string;
  item_is_veg: boolean;
  quantity: number;
  added_by: string;
  added_at: string;
}

interface GroupSession {
  session_id: string;
  creator_name: string;
  creator_address: string;
  creator_lat: number | null;
  creator_lng: number | null;
  expires_at: string;
  items: GroupItem[];
  total: number;
  participant_count: number;
}

interface MenuItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  is_veg: boolean;
  description: string;
  category_name: string;
  restaurant_name?: string;
}

// Distinct colors for participants
const PARTICIPANT_COLORS = [
  'bg-purple-500', 'bg-blue-500', 'bg-orange-500', 'bg-pink-500',
  'bg-teal-500', 'bg-yellow-500', 'bg-red-500', 'bg-indigo-500',
];
const colorFor = (name: string) => {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) % PARTICIPANT_COLORS.length;
  return PARTICIPANT_COLORS[hash];
};

export default function GroupOrderPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { addItem, setIsOpen } = useCart();

  const [session, setSession] = useState<GroupSession | null>(null);
  const [myName, setMyName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [nameSet, setNameSet] = useState(false);
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/api/group-order/${sessionId}/`);
      setSession(res.data);
      setError('');
    } catch (e: any) {
      if (e.response?.status === 404 || e.response?.status === 410) {
        setError(e.response.data?.error || 'Session not found or expired');
      }
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    // Check if name is saved in sessionStorage
    const saved = sessionStorage.getItem(`group_name_${sessionId}`);
    if (saved) { setMyName(saved); setNameSet(true); }
    fetchSession();
  }, [fetchSession, sessionId]);

  // Poll for updates every 4 seconds
  useEffect(() => {
    if (!nameSet) return;
    pollRef.current = setInterval(fetchSession, 4000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [nameSet, fetchSession]);

  // Fetch menu on name set
  useEffect(() => {
    if (!nameSet) return;
    setLoadingMenu(true);
    axios.get(`${API}/api/menu/`).then(res => setMenu(res.data || [])).catch(() => {}).finally(() => setLoadingMenu(false));
  }, [nameSet]);

  const handleSetName = () => {
    if (!nameInput.trim()) return toast.error('Please enter your name');
    const n = nameInput.trim();
    setMyName(n);
    setNameSet(true);
    sessionStorage.setItem(`group_name_${sessionId}`, n);
  };

  const handleAddItem = async (item: MenuItem) => {
    if (!myName) return;
    try {
      await axios.post(`${API}/api/group-order/${sessionId}/add/`, {
        added_by: myName,
        menu_item_id: item.id,
        quantity: 1,
      });
      toast.success(`${item.name} added!`, { icon: '', duration: 1500 });
      fetchSession();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'Failed to add item');
    }
  };

  const handleRemoveItem = async (itemId: number) => {
    try {
      await axios.delete(`${API}/api/group-order/${sessionId}/item/${itemId}/`, {
        params: { added_by: myName }
      });
      fetchSession();
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await axios.get(`${API}/api/group-order/${sessionId}/checkout/`);
      const { items } = res.data;
      // Load all items into real cart
      items.forEach((item: any) => {
        addItem({
          id: item.id,
          name: `${item.name} (${item.added_by})`,
          price: item.price,
          quantity: item.quantity,
          image_url: item.image_url || '',
          is_veg: item.is_veg,
        } as CartItem);
      });
      setIsOpen(true);
      toast.success('Group cart loaded! Review and place order.', { duration: 3000 });
      router.push('/checkout');
    } catch {
      toast.error('Failed to load checkout data');
    } finally {
      setCheckingOut(false);
    }
  };

  const shareLink = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success('Link copied!', { icon: '' });
  };
  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`Join my QuickCombo group order! Add your items here: ${shareLink}`)}`);
  };

  const timeLeft = session ? Math.max(0, Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 60000)) : 0;

  const filteredMenu = menu.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category_name?.toLowerCase().includes(search.toLowerCase())
  );

  // Group items by participant
  const itemsByPerson: Record<string, GroupItem[]> = {};
  session?.items.forEach(item => {
    if (!itemsByPerson[item.added_by]) itemsByPerson[item.added_by] = [];
    itemsByPerson[item.added_by].push(item);
  });

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 text-center">
      <div>
        <div className="text-5xl mb-4"></div>
        <h2 className="text-white font-black text-xl mb-2">Session Not Found</h2>
        <p className="text-gray-400 text-sm mb-6">{error}</p>
        <button onClick={() => router.push('/')} className="bg-green-500 text-black font-black px-6 py-3 rounded-xl">
          Go Home
        </button>
      </div>
    </div>
  );

  // Name entry screen
  if (!nameSet) return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white">Join Group Order</h1>
          <p className="text-gray-400 text-sm mt-2">
            {session?.creator_name} started a group order. Enter your name to join!
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSetName()}
            placeholder="Your name (e.g. Rahul)"
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:border-green-500/50 outline-none text-base"
            autoFocus
          />
          <button onClick={handleSetName} className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-2xl text-base uppercase tracking-wider transition-all active:scale-[0.98]">
            Join & Start Adding Items
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white pb-40">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span className="text-xs font-black text-green-400 uppercase tracking-wider">Live Group Order</span>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">
              <Users size={10} className="inline mr-1" />
              {session?.participant_count || 0} people • {timeLeft}min left
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} className="p-2 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
              <Copy size={16} className="text-gray-400" />
            </button>
            <button onClick={shareWhatsApp} className="p-2 bg-green-500/10 rounded-xl border border-green-500/20 hover:bg-green-500/20 transition-all">
              <Share2 size={16} className="text-green-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
        {/* Share Banner */}
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center shrink-0">
            <Share2 size={18} className="text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Share this link with friends</p>
            <p className="text-xs text-gray-500 truncate mt-0.5">{shareLink}</p>
          </div>
          <button onClick={shareWhatsApp} className="shrink-0 bg-green-500 text-black text-xs font-black px-3 py-2 rounded-xl">
            WhatsApp
          </button>
        </div>

        {/* Group Cart */}
        {session && session.items.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-base">Group Cart</h2>
              <span className="text-green-400 font-black text-sm">₹{session.total.toFixed(2)}</span>
            </div>
            <div className="space-y-3">
              {Object.entries(itemsByPerson).map(([personName, personItems]) => (
                <div key={personName} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <div className={`px-4 py-2 flex items-center gap-2 ${colorFor(personName)}/10`}>
                    <div className={`w-6 h-6 ${colorFor(personName)} rounded-full flex items-center justify-center text-[10px] font-black text-white`}>
                      {personName[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-white">{personName}</span>
                    {personName === myName && (
                      <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-black uppercase">You</span>
                    )}
                  </div>
                  {personItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-white/5">
                      {item.item_image ? (
                        <img src={item.item_image.startsWith('http') ? item.item_image : `${API}${item.item_image}`} alt={item.item_name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                          <Zap size={16} className="text-white/20" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{item.item_name}</p>
                        <p className="text-xs text-gray-400">₹{item.item_price} × {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-black text-white">₹{(item.item_price * item.quantity).toFixed(0)}</span>
                        {personName === myName && (
                          <button onClick={() => handleRemoveItem(item.id)} className="w-7 h-7 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center justify-center transition-all">
                            <Trash2 size={12} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {session?.items.length === 0 && (
          <div className="text-center py-6 text-gray-600">
            <ShoppingCart size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm font-bold">No items yet</p>
            <p className="text-xs mt-1">Browse below and add items!</p>
          </div>
        )}

        {/* Menu */}
        <div>
          <h2 className="font-black text-base mb-3">Add Items</h2>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-green-500/50 transition-all mb-3"
          />
          {loadingMenu ? (
            <div className="flex flex-col gap-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredMenu.slice(0, 30).map(item => {
                const myItems = session?.items.filter(i => i.menu_item_id === item.id && i.added_by === myName) || [];
                const totalQty = myItems.reduce((s, i) => s + i.quantity, 0);
                return (
                  <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-xl p-3 hover:border-green-500/20 transition-all">
                    {item.image_url ? (
                      <img src={item.image_url.startsWith('http') ? item.image_url : `${API}${item.image_url}`} alt={item.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-white/5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 font-black">₹{item.price}</p>
                    </div>
                    <div className="shrink-0">
                      {totalQty > 0 ? (
                        <div className="flex items-center gap-1 bg-black border border-green-500/40 rounded-xl px-2 py-1.5">
                          <span className="text-green-400 text-xs font-black w-4 text-center">{totalQty}</span>
                          <button onClick={() => handleAddItem(item)} className="text-green-400">
                            <Plus size={14} strokeWidth={3} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddItem(item)}
                          className="bg-white text-green-600 hover:bg-green-50 font-black text-xs px-3 py-2 rounded-xl transition-all border border-green-200/30 uppercase"
                        >
                          ADD
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky Checkout Bar */}
      {session && session.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-black/95 backdrop-blur border-t border-white/5 z-50">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-2xl flex items-center justify-between px-6 transition-all active:scale-[0.98] disabled:opacity-70 shadow-lg shadow-green-500/20"
            >
              <span className="text-sm">{session.items.length} items · {session.participant_count} people</span>
              <span className="flex items-center gap-2">
                {checkingOut ? 'Loading...' : 'Checkout'}
                <ShoppingCart size={18} />
              </span>
            </button>
            <p className="text-center text-[10px] text-gray-500 mt-2">
              Delivers to {session.creator_name}'s address
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
