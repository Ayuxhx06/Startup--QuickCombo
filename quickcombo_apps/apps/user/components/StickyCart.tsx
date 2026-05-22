'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function StickyCart() {
  const { itemCount, items } = useCart();
  const pathname = usePathname();

  // Hide on checkout, tracking, or admin pages
  if (pathname.includes('/checkout') || pathname.includes('/tracking') || pathname.includes('/admin') || pathname.includes('/portal')) {
    return null;
  }

  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[72px] sm:bottom-4 left-0 right-0 z-50 flex justify-center px-4"
        >
          <div className="w-full max-w-lg bg-[#22c55e] rounded-[16px] text-black shadow-[0_8px_32px_rgba(34,197,94,0.3)] flex items-center justify-between p-3.5 pr-4">
            
            <div className="flex items-center gap-3">
              {/* Stack of item image thumbnails (up to 3) */}
              <div className="flex -space-x-4">
                {items.slice(0, 3).map((item, i) => (
                  <div key={item.id} className="w-10 h-10 rounded-full border-2 border-[#22c55e] bg-black overflow-hidden relative z-[{3-i}]">
                    {item.image_url ? (
                      <img src={item.image_url} className="w-full h-full object-cover" />
                    ) : (
                      <span className="flex items-center justify-center h-full text-xs">🍔</span>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="flex flex-col">
                <span className="font-black text-[15px] leading-tight text-white mb-0.5 mix-blend-difference">
                  {itemCount} {itemCount === 1 ? 'item' : 'items'} added
                </span>
              </div>
            </div>

            <Link href="/checkout">
              <span className="text-white font-black mix-blend-difference text-[16px] flex items-center gap-1 active:scale-95 transition-transform cursor-pointer">
                View cart <ChevronRight size={18} strokeWidth={3} className="mt-0.5" />
              </span>
            </Link>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
