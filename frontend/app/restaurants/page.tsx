'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import useSWR from 'swr';
import axios from 'axios';
import Link from 'next/link';
import { ArrowLeft, Star, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface Restaurant {
  id: number; name: string; rating: number; delivery_time: number;
  cuisines: string; image_url: string; is_featured: boolean;
}

export default function RestaurantsPage() {
  const router = useRouter();
  const fetcher = (url: string) => axios.get(url).then(res => res.data);
  const { data: restaurants = [], isLoading: loading } = useSWR<Restaurant[]>(`${API}/api/restaurants/`, fetcher);

  return (
    <div className="page-wrapper min-h-screen bg-black">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center gap-3 px-4 h-14">
          <button 
            onClick={() => router.back()}
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-white">Restaurants</h1>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4 pb-20 mt-4">
        {loading ? (
          [...Array(2)].map((_, i) => (
            <div key={i} className="w-full h-[240px] rounded-3xl shimmer" />
          ))
        ) : restaurants.length === 0 ? (
          <div className="py-20 text-center text-gray-500 font-medium">No restaurants found</div>
        ) : (
          restaurants.map((rest, i) => (
            <Link key={rest.id} href={`/menu?restaurant=${rest.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="w-full rounded-3xl overflow-hidden glass hover:border-green-500/40 transition-all cursor-pointer group"
              >
                <div className="h-[180px] relative overflow-hidden">
                  <Image 
                    src={rest.image_url.startsWith('http') ? rest.image_url : `${API}${rest.image_url}`} 
                    alt={rest.name} 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                  <div className="absolute top-0 right-0 p-3">
                    <div className="glass px-3 py-1.5 rounded-full text-sm font-black flex items-center gap-1.5">
                      <Star size={14} className="text-green-400 fill-green-400" /> {rest.rating}
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <h3 className="font-black text-2xl text-white drop-shadow-md">{rest.name}</h3>
                  </div>
                </div>
                <div className="p-4 bg-white/[0.03]">
                  <p className="text-gray-400 text-sm mb-3">{rest.cuisines}</p>
                  <div className="flex items-center gap-4 text-sm font-bold text-gray-300">
                    <span className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-lg">
                      <Clock size={14} /> {rest.delivery_time} min
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                    <span>Free Delivery</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
