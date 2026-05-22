'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Package, ChevronRight, Clock, CheckCircle2, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface OrderItem { id: number; name: string; quantity: number; price: number; }
interface Order {
  id: number; status: string; total: number; created_at: string; items: OrderItem[];
}

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { router.replace('/'); return; }
    axios.get(`${API}/api/orders/`, { headers: { 'X-User-Email': user.email } })
      .then(res => { setOrders(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user, router]);

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return 'text-green-400 bg-green-500/10 border-green-500/20';
    if (status === 'cancelled') return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  };

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-24">
      <div className="px-4 pt-6 pb-2 sticky top-14 z-20 bg-black/90 backdrop-blur-md border-b border-white/5">
        <h1 className="text-2xl font-black">My Orders</h1>
      </div>

      <div className="p-4 space-y-4">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl shimmer" />)
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package size={64} className="text-white/10 mb-4" />
            <p className="text-gray-400 font-medium">No orders yet</p>
            <Link href="/menu" className="mt-4 text-green-400 font-bold hover:underline">
              Start ordering
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-4">
              {orders.map(order => (
                <motion.div key={order.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                  <Link href={`/orders/${order.id}`}>
                    <motion.div className="glass hover:border-green-500/30 rounded-2xl p-4 transition-all" whileTap={{ scale: 0.98 }}>
                      <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-3">
                        <div>
                          <p className="text-gray-400 text-xs mb-1">
                            {new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="font-bold text-lg">Order #{order.id}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-green-400 text-lg mb-1">₹{order.total}</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getStatusColor(order.status)} uppercase tracking-wider`}>
                            {order.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-400 pr-4">
                          {order.items.slice(0, 2).map((item, i) => (
                            <span key={item.id}>
                              {item.quantity}x {item.name}{i < 1 && order.items.length > 1 ? ', ' : ''}
                            </span>
                          ))}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </div>
                        <ChevronRight size={18} className="text-gray-600 flex-shrink-0" />
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
