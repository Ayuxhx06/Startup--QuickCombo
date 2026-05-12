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

      <div className="grid grid-cols-2 gap-3 p-4 pb-20 mt-4">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="w-full aspect-[4/3] rounded-[16px] shimmer" />
          ))
        ) : restaurants.length === 0 ? (
          <div className="col-span-2 py-20 text-center text-gray-500 font-medium">No restaurants found</div>
        ) : (
          restaurants.map((rest, i) => (
            <Link key={rest.id} href={`/menu?restaurant=${rest.id}`}>
              <motion.div
                whileTap={{ scale: 0.96 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="w-full bg-[#1a1a1a] rounded-[16px] overflow-hidden shadow-sm transition-all cursor-pointer group flex flex-col"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden">
                  <Image 
                    src={(rest.image_url && rest.image_url.startsWith('http')) ? rest.image_url : `${API}${rest.image_url || ''}`} 
                    alt={rest.name} 
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105" 
                    sizes="(max-width: 768px) 50vw, 300px"
                  />
                  {/* Overlay for readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
                  
                  {/* Offer Badge (Top Left) */}
                  {rest.is_featured ? (
                    <div className="absolute top-2 left-2 bg-blue-600/95 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      PROMOTED
                    </div>
                  ) : (
                    <div className="absolute top-2 left-2 bg-rose-600/95 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                      50% OFF
                    </div>
                  )}

                  {/* Rating Badge (Bottom Left) */}
                  <div className="absolute bottom-2 left-2 bg-green-600/95 backdrop-blur-sm text-white px-1.5 py-0.5 rounded text-[10px] font-black flex items-center gap-0.5 shadow-sm">
                    <Star size={10} className="fill-white" /> {rest.rating}
                  </div>
                </div>
                
                <div className="p-2.5 flex flex-col gap-0.5">
                  <h3 className="font-bold text-[14px] leading-tight text-white truncate">{rest.name}</h3>
                  <p className="text-[#9ca3af] text-[11px] truncate">{rest.cuisines}</p>
                  <div className="flex items-center gap-1 mt-0.5 text-[#9ca3af] text-[11px] font-medium">
                    <span>⏱ {rest.delivery_time}–{rest.delivery_time + 5} min</span>
                    <span className="mx-0.5">•</span>
                    <span>1.2 km</span>
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
