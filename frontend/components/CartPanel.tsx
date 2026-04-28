'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function CartPanel() {
  const { isOpen, setIsOpen, items, removeItem, updateQuantity, total, itemCount, clearCart, specialRequests } = useCart();
  const { user, setShowAuthModal } = useAuth();
  const router = useRouter();

  const hasFood = items.some(i => i.restaurant || i.restaurant_name || i.category_name?.toLowerCase().includes('bundle'));
  const hasEssentials = items.some(i => ['essentials', 'grocery', 'snacks', 'beverages', 'drinks'].includes(i.category_name?.toLowerCase() || ''));
  const onlyEssentials = !hasFood && (items.length > 0 || specialRequests.length > 0);


  const handleCheckout = () => {
    if (!user) {
      setShowAuthModal(true);
      setIsOpen(false);
      return;
    }
    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-[#0f0f0f] border-l border-white/5 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <ShoppingCart size={20} className="text-green-400" />
                <h2 className="font-bold text-lg">Your Cart</h2>
                {itemCount > 0 && (
                  <span className="bg-green-500/20 text-green-400 text-xs font-bold px-2 py-0.5 rounded-full">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={clearCart}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                    title="Clear cart"
                  >
                    <Trash2 size={16} />
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 glass rounded-lg"
                >
                  <X size={18} />
                </motion.button>
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              <AnimatePresence>
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center h-64 text-center"
                  >
                    <div className="text-6xl mb-4">🛒</div>
                    <p className="text-gray-400 font-medium">Your cart is empty</p>
                    <p className="text-gray-600 text-sm mt-1">Add items from the menu</p>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setIsOpen(false)}
                      className="mt-6 btn-primary px-6 py-2.5 text-sm"
                    >
                      Browse Menu
                    </motion.button>
                  </motion.div>
                ) : (
                  items.map(item => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      className="flex gap-3 glass rounded-xl p-3"
                    >
                      {/* Image */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <div className={`veg-badge ${item.is_veg ? 'veg' : 'non-veg'}`} />
                            <p className="font-semibold text-sm truncate">{item.name}</p>
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-600 hover:text-red-400 transition-colors flex-shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-green-400 font-bold text-sm mt-1">₹{item.price * item.quantity}</p>

                        {/* Qty control */}
                        <div className="flex items-center gap-2 mt-2">
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-red-500/20 flex items-center justify-center transition-colors"
                          >
                            <Minus size={12} />
                          </motion.button>
                          <motion.span
                            key={item.quantity}
                            initial={{ scale: 1.3 }}
                            animate={{ scale: 1 }}
                            className="w-6 text-center font-bold text-sm"
                          >
                            {item.quantity}
                          </motion.span>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg bg-green-500/10 hover:bg-green-500/20 flex items-center justify-center text-green-400 transition-colors"
                          >
                            <Plus size={12} />
                          </motion.button>
                          <span className="text-gray-500 text-xs ml-auto">₹{item.price} each</span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {items.length > 0 && onlyEssentials && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center shrink-0">
                    <span className="text-orange-500 text-sm">💡</span>
                  </div>
                  <div>
                    <p className="text-orange-200 text-xs font-bold leading-tight uppercase tracking-wider mb-1">Order Tip</p>
                    <p className="text-gray-400 text-[11px] leading-relaxed">
                      To help us deliver your essentials quickly, please add at least one <span className="text-green-400 font-bold">Food item</span> or a <span className="text-green-400 font-bold">Combo</span> to your cart.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <AnimatePresence>
              {items.length > 0 && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="border-t border-white/5 px-5 py-5 space-y-4"
                >
                  {/* Price breakdown */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Subtotal</span>
                      <span>₹{total}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Delivery fee</span>
                      <span>₹40</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg text-white pt-2 border-t border-white/5">
                      <span>Total</span>
                      <span className="text-green-400">₹{total + 40}</span>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCheckout}
                    disabled={onlyEssentials}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-2 font-bold text-base disabled:opacity-50 disabled:grayscale"
                  >
                    {onlyEssentials ? 'Add Food to Continue' : 'Proceed to Checkout'}
                    <ArrowRight size={18} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
