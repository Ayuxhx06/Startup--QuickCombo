'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UtensilsCrossed } from 'lucide-react';

interface CategoryInfo {
  name: string;
  slug: string;
  count: number;
}

interface CategoryMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryInfo[];
  activeCategory: string;
  onCategorySelect: (slug: string) => void;
}

export default function CategoryMenu({ isOpen, onClose, categories, activeCategory, onCategorySelect }: CategoryMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet Drawer */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative w-full max-w-lg bg-[#121212] rounded-t-[32px] overflow-hidden shadow-2xl border-t border-white/10"
          >
            {/* Handle bar */}
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2" />

            <div className="p-6 pt-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Menu</h3>
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-1 max-h-[60vh] overflow-y-auto no-scrollbar pb-10">
                {categories.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => {
                      onCategorySelect(cat.slug);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
                      activeCategory === cat.slug ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <span className={`text-sm font-bold transition-all ${
                      activeCategory === cat.slug ? 'text-green-500' : 'text-gray-300 group-hover:text-white group-hover:translate-x-1'
                    }`}>
                      {cat.name}
                    </span>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg transition-all ${
                      activeCategory === cat.slug ? 'bg-green-500 text-black' : 'text-gray-600 bg-white/5 group-hover:bg-green-500/10 group-hover:text-green-500'
                    }`}>
                      {cat.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function MenuFAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      onClick={onClick}
      className="fixed bottom-[130px] sm:bottom-24 right-6 z-[150] bg-black text-white px-5 py-3.5 rounded-full flex items-center gap-2.5 shadow-[0_8px_40px_rgb(0,0,0,0.6)] border border-white/15 hover:border-green-500/50 transition-all group"
    >
      <div className="bg-green-500 text-black p-1.5 rounded-full group-hover:rotate-12 transition-transform">
        <UtensilsCrossed size={14} />
      </div>
      <span className="text-xs font-black uppercase tracking-widest">Menu</span>
    </motion.button>
  );
}
