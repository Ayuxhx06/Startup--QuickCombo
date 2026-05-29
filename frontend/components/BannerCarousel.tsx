'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

interface Banner {
  id: number;
  title: string;
  subtitle: string;
  cta_text: string;
  cta_link: string;
  image_url: string;
  bg_color: string;
}

export default function BannerCarousel() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const impressionsSent = useRef<Set<number>>(new Set());

  useEffect(() => {
    axios.get(`${API}/api/banners/`).then(res => {
      setBanners(res.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Track impression when a banner becomes visible
  useEffect(() => {
    if (banners.length === 0) return;
    const b = banners[current];
    if (b && !impressionsSent.current.has(b.id)) {
      impressionsSent.current.add(b.id);
      axios.post(`${API}/api/banners/${b.id}/impression/`).catch(() => {});
    }
  }, [current, banners]);

  // Auto-slide every 4s
  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % (banners.length || 1));
    }, 4000);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length > 1) startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length, startTimer]);

  const goTo = (idx: number) => {
    setCurrent(idx);
    startTimer();
  };

  const goNext = () => goTo((current + 1) % banners.length);
  const goPrev = () => goTo((current - 1 + banners.length) % banners.length);

  // Touch / swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStart(e.touches[0].clientX);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = dragStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
    else startTimer();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart(e.clientX);
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = dragStart - e.clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
    else startTimer();
  };

  const handleCTAClick = (banner: Banner) => {
    axios.post(`${API}/api/banners/${banner.id}/click/`).catch(() => {});
    const link = banner.cta_link;
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      router.push(link);
    }
  };

  if (loading || banners.length === 0) return null;

  const banner = banners[current];

  return (
    <div className="px-4 mb-6">
      <div
        className="relative w-full rounded-2xl overflow-hidden select-none cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: '16/6', minHeight: 120 }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { if (isDragging) { setIsDragging(false); startTimer(); } }}
      >
        {/* Banners — absolute stack */}
        {banners.map((b, i) => (
          <div
            key={b.id}
            className="absolute inset-0 transition-opacity duration-500"
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          >
            {/* Background image or color */}
            {b.image_url ? (
              <img
                src={b.image_url.startsWith('http') ? b.image_url : `${API}${b.image_url}`}
                alt={b.title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full" style={{ background: b.bg_color || '#0a0a0a' }} />
            )}

            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-center px-5 py-4">
              <p className="text-green-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
                QuickCombo Offer
              </p>
              <h3 className="text-white font-black text-lg leading-tight mb-1 drop-shadow-md max-w-[60%]">
                {b.title}
              </h3>
              {b.subtitle && (
                <p className="text-gray-300 text-xs font-medium mb-3 max-w-[55%] line-clamp-2">
                  {b.subtitle}
                </p>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleCTAClick(b); }}
                className="self-start bg-green-500 hover:bg-green-400 active:scale-95 text-black text-xs font-black px-4 py-2 rounded-xl transition-all shadow-lg shadow-green-500/30 uppercase tracking-wider"
              >
                {b.cta_text}
              </button>
            </div>
          </div>
        ))}

        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-4 h-1.5 bg-green-400'
                    : 'w-1.5 h-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
