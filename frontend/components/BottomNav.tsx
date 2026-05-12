'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, UtensilsCrossed, Zap, ClipboardList, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';


const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/menu', icon: UtensilsCrossed, label: 'Menu' },
  { href: '/combo', icon: Zap, label: 'Combo', highlight: true },
  { href: '/orders', icon: ClipboardList, label: 'Orders' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { isLoggedIn, setShowAuthModal } = useAuth();
  const router = useRouter();

  if (pathname.includes('/checkout') || pathname.includes('/admin') || pathname.includes('/portal')) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/5 bottom-nav">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label, highlight }) => {
          const isActive = pathname === href;
          
          const handleClick = (e: React.MouseEvent) => {
            if (href === '/profile' && !isLoggedIn) {
              e.preventDefault();
              setShowAuthModal(true);
            } else {
              setShowAuthModal(false);
            }
          };

          return (
            <Link href={href} key={href} onClick={handleClick} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="flex flex-col items-center gap-0.5 py-1 relative"
              >

                <div className={`relative p-2 rounded-xl transition-all duration-200 ${
                  highlight
                    ? 'bg-green-500 text-black shadow-lg shadow-green-500/30'
                    : isActive
                    ? 'bg-green-500/10 text-green-400'
                    : 'text-gray-500'
                }`}>
                  <Icon size={20} />
                  {/* Cart count badge on combo button */}
                  {highlight && itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${
                  isActive ? 'text-green-400' : highlight ? 'text-green-400' : 'text-gray-600'
                }`}>
                  {label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400"
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
