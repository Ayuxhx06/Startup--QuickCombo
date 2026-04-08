'use client';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Zap, Star, Clock, MapPin, ChevronRight, Search } from 'lucide-react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
const WeatherWidget = dynamic(() => import('@/components/WeatherWidget'), { ssr: false });
const FoodCard = dynamic(() => import('@/components/FoodCard'), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface MenuItem {
  id: number; name: string; description: string; price: number;
  image_url: string; is_veg: boolean; rating: number; prep_time: number;
  category_name: string; is_featured: boolean; restaurant_name?: string;
}

interface Category {
  slug: string;
  icon: string;
  name: string;
}

interface Restaurant {
  id: number; name: string; rating: number; delivery_time: number;
  cuisines: string; image_url: string; is_featured: boolean;
}

export default function HomePage() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetcher = (url: string) => axios.get(url).then(res => res.data);

  const { data: featured = [], isLoading: loadingFeatured } = useSWR<MenuItem[]>(`${API}/api/menu/?featured=1`, fetcher);
  const { data: restaurants = [], isLoading: loadingRestaurants } = useSWR<Restaurant[]>(`${API}/api/restaurants/`, fetcher);
  const { data: categories = [], isLoading: loadingCategories } = useSWR<Category[]>(`${API}/api/categories/`, fetcher);

  const loading = loadingFeatured || loadingRestaurants || loadingCategories;

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0].slug);
    }
  }, [categories, activeCategory]);

  const filteredRestaurants = restaurants.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisines.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-6 pb-10">

        {/* Ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-green-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-lg mx-auto">
          <WeatherWidget />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-green-400 pulse-green" />
              <span className="text-green-400 text-sm font-semibold">Delivering Now · 20-35 min</span>
            </div>
            <h1 className="text-4xl font-black leading-tight mb-2">
              Food + Essentials,<br />
              <span className="gradient-text">Delivered Fast ⚡</span>
            </h1>
            <p className="text-gray-400 text-base mb-6">
              Combos, snacks, drinks & daily essentials — all in one order.
            </p>
            <div className="flex gap-3">
              <Link href="/menu">
                <motion.button whileTap={{ scale: 0.96 }} className="btn-primary px-6 py-3 flex items-center gap-2 font-bold">
                  Order Now <ArrowRight size={18} />
                </motion.button>
              </Link>
              <Link href="/combo">
                <motion.button whileTap={{ scale: 0.96 }} className="btn-ghost px-6 py-3 flex items-center gap-2 font-bold">
                  <Zap size={18} />Build Combo
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 mb-6">
        <h2 className="font-black text-lg mb-4">Browse Categories</h2>
        <div className="flex gap-4 pb-4 overflow-x-auto no-scrollbar scroll-smooth snap-x">
          {categories.slice(0, 6).map((cat, i) => (
            <div key={cat.slug} className="flex gap-4 snap-center">
              {i === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                  className="min-w-[70px]"
                >
                  <Link href="/restaurants">
                    <motion.div whileTap={{ scale: 0.92 }} className="flex flex-col items-center gap-2 cursor-pointer">
                      <div className="w-[54px] h-[54px] rounded-full flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-colors bg-[#1c1c1c] border border-transparent">
                        🏪
                      </div>
                      <div className="flex flex-col items-center border-b-[3px] pb-1.5 w-full mx-auto border-transparent">
                        <span className="text-[10px] font-bold tracking-tight whitespace-nowrap text-gray-400">
                          Restaurants
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              )}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="min-w-[70px]"
              >
                <Link href={`/menu?category=${cat.slug}`}>
                  <motion.div
                    whileTap={{ scale: 0.92 }}
                    className="flex flex-col items-center gap-2 cursor-pointer"
                    onClick={() => setActiveCategory(cat.slug)}
                  >
                    <div className={`w-[54px] h-[54px] rounded-full flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-colors ${
                      activeCategory === cat.slug ? 'bg-green-500/20 border border-green-500/50' : 'bg-[#1c1c1c] border border-transparent'
                    }`}>
                      {cat.icon}
                    </div>
                    <div className={`flex flex-col items-center border-b-[3px] pb-1.5 w-full mx-auto ${
                      activeCategory === cat.slug
                        ? 'border-green-500'
                        : 'border-transparent'
                    }`}>
                      <span className={`text-[10px] font-bold tracking-tight whitespace-nowrap ${activeCategory === cat.slug ? 'text-white' : 'text-gray-400'}`}>
                        {cat.name}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Restaurants Section */}
      <section id="restaurants-section" className="px-4 mb-8 pt-4">
        <h2 className="font-black text-xl mb-4">🌟 Top Restaurants</h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="min-w-[260px] h-[200px] rounded-2xl shimmer snap-center" />
            ))
          ) : filteredRestaurants.length === 0 ? (
            <div className="w-full py-10 text-center text-gray-500">No restaurants found</div>
          ) : (
            filteredRestaurants.map((rest, i) => (
              <Link key={rest.id} href={`/menu?restaurant=${rest.id}`}>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="min-w-[280px] sm:min-w-[320px] rounded-3xl overflow-hidden glass hover:border-green-500/40 transition-all snap-center group cursor-pointer"
                >
                  <div className="h-[140px] relative overflow-hidden">
                    <Image 
                      src={rest.image_url} 
                      alt={rest.name} 
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110" 
                      sizes="(max-width: 768px) 100vw, 320px"
                    />
                    <div className="absolute top-0 right-0 p-3">
                      <div className="glass px-2.5 py-1 rounded-full text-xs font-black flex items-center gap-1">
                        <Star size={12} className="text-green-400 fill-green-400" /> {rest.rating}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg leading-tight mb-1 truncate">{rest.name}</h3>
                    <p className="text-gray-400 text-xs truncate mb-2">{rest.cuisines}</p>
                    <div className="flex items-center gap-3 text-xs font-semibold text-gray-300">
                      <span className="flex items-center gap-1"><Clock size={12} className="text-green-400" /> {rest.delivery_time} min</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600" />
                      <span>Free Delivery</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Featured Items */}
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg">🔥 Popular Food</h2>
          <Link href="/menu" className="flex items-center gap-1 text-green-400 text-sm font-semibold">
            See all <ChevronRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl shimmer" />
            ))}
          </div>
        ) : (
          <motion.div
            className="flex flex-col gap-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {featured.slice(0, 5).map(item => (
              <motion.div
                key={item.id}
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              >
                <FoodCard item={item} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* Quick Essentials */}
      <section className="px-4 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-lg">🛒 Quick Essentials</h2>
          <Link href="/menu?category=essentials" className="flex items-center gap-1 text-green-400 text-sm font-semibold">
            See all <ChevronRight size={16} />
          </Link>
        </div>
        <Link href="/menu?category=essentials">
          <motion.div
            whileTap={{ scale: 0.98 }}
            className="glass rounded-2xl p-4 flex items-center justify-between hover:border-green-500/20 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="text-3xl">🛒</div>
              <div>
                <div className="font-bold">Cigarettes, Chips, Drinks</div>
                <div className="text-gray-500 text-sm">Daily essentials delivered fast</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-500" />
          </motion.div>
        </Link>
      </section>
      <section className="px-4 mb-20">
        <div className="glass rounded-[32px] overflow-hidden border border-white/10 shadow-2xl">
          <div className="p-6 bg-gradient-to-br from-green-500/5 to-transparent flex flex-col items-center text-center">
            <div className="w-full max-w-[280px] aspect-[5/2] relative rounded-xl overflow-hidden border border-white/5 mb-4 bg-white/5 p-2">
              <Image 
                src="/msme_logo.png" 
                alt="MSME Udyam Registration" 
                width={280}
                height={112}
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 pulse-green" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Verified MSME Enterprise</span>
            </div>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed max-w-[240px] mb-4">
              Registered under Ministry of Micro, Small & Medium Enterprises (Udyam Registration)
            </p>
            <Link href="/about">
              <motion.button 
                whileTap={{ scale: 0.95 }}
                className="text-xs font-bold text-green-400 border border-green-500/30 px-6 py-2 rounded-full hover:bg-green-500/10 transition-all"
              >
                About Us & Certification
              </motion.button>
            </Link>
          </div>
        </div>
        <div className="text-center mt-8 pb-4">
          <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">QuickCombo • Made with ❤️ in India</p>
        </div>
      </section>
    </div>
  );
}
