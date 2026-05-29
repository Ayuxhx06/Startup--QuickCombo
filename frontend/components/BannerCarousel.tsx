'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API = (process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net').replace(/\/$/, '');

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
  const [loaded, setLoaded] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();
  const impressionsSent = useRef<Set<number>>(new Set());

  useEffect(() => {
    const url = `${API}/api/banners/`;
    axios.get(url)
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setBanners(data);
      })
      .catch(err => {
        console.error('[BannerCarousel] fetch error:', err?.response?.status, err?.message);
      })
      .finally(() => setLoaded(true));
  }, []);

  // Track impression
  useEffect(() => {
    if (!banners.length) return;
    const b = banners[current];
    if (b && !impressionsSent.current.has(b.id)) {
      impressionsSent.current.add(b.id);
      axios.post(`${API}/api/banners/${b.id}/impression/`).catch(() => {});
    }
  }, [current, banners]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (banners.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent(c => (c + 1) % banners.length);
    }, 4500);
  }, [banners.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (idx: number) => { setCurrent(idx); startTimer(); };
  const goNext = () => goTo((current + 1) % banners.length);
  const goPrev = () => goTo((current - 1 + banners.length) % banners.length);

  // Touch
  const onTouchStart = (e: React.TouchEvent) => { setDragStart(e.touches[0].clientX); if (timerRef.current) clearInterval(timerRef.current); };
  const onTouchEnd = (e: React.TouchEvent) => { const d = dragStart - e.changedTouches[0].clientX; if (Math.abs(d) > 40) d > 0 ? goNext() : goPrev(); else startTimer(); };
  const onMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setDragStart(e.clientX); if (timerRef.current) clearInterval(timerRef.current); };
  const onMouseUp = (e: React.MouseEvent) => { if (!isDragging) return; setIsDragging(false); const d = dragStart - e.clientX; if (Math.abs(d) > 40) d > 0 ? goNext() : goPrev(); else startTimer(); };

  const handleCTA = (banner: Banner) => {
    axios.post(`${API}/api/banners/${banner.id}/click/`).catch(() => {});
    if (banner.cta_link.startsWith('http')) window.open(banner.cta_link, '_blank');
    else router.push(banner.cta_link);
  };

  // Not loaded yet — skeleton
  if (!loaded) {
    return (
      <div className="px-4 mb-3">
        <div className="w-full rounded-2xl bg-white/5 animate-pulse" style={{ aspectRatio: '16/7', minHeight: 130 }} />
      </div>
    );
  }

  // No banners — hidden
  if (!banners.length) return null;

  const banner = banners[current];
  const imgSrc = banner.image_url
    ? (banner.image_url.startsWith('http') ? banner.image_url : `${API}${banner.image_url}`)
    : null;

  return (
    <div className="px-4 mb-3">
      <div
        className="relative w-full rounded-2xl overflow-hidden select-none"
        style={{ aspectRatio: '16/7', minHeight: 130, cursor: isDragging ? 'grabbing' : 'grab' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { if (isDragging) { setIsDragging(false); startTimer(); } }}
      >
        {/* Slides */}
        {banners.map((b, i) => {
          const src = b.image_url
            ? (b.image_url.startsWith('http') ? b.image_url : `${API}${b.image_url}`)
            : null;
          return (
            <div
              key={b.id}
              className="absolute inset-0 transition-opacity duration-500"
              style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
            >
              {/* BG */}
              {src ? (
                <img src={src} alt={b.title} className="w-full h-full object-cover" draggable={false} />
              ) : (
                <div className="w-full h-full" style={{ background: b.bg_color || 'linear-gradient(135deg,#0a2a0a,#0a0a0a)' }} />
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.1) 100%)' }} />

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-center px-5 py-4">
                <span className="text-green-400 text-[9px] font-black uppercase tracking-[0.22em] mb-1 opacity-90">
                  QuickCombo
                </span>
                <h2 className="text-white font-black text-xl leading-tight mb-1.5 drop-shadow-md" style={{ maxWidth: '58%' }}>
                  {b.title}
                </h2>
                {b.subtitle && (
                  <p className="text-gray-300 text-xs font-medium mb-3 leading-snug" style={{ maxWidth: '55%', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {b.subtitle}
                  </p>
                )}
                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={(e) => { e.stopPropagation(); handleCTA(b); }}
                  className="self-start text-black text-[11px] font-black px-4 py-2 rounded-xl uppercase tracking-wider transition-all active:scale-95"
                  style={{ background: '#22c55e', boxShadow: '0 4px 14px rgba(34,197,94,0.35)' }}
                >
                  {b.cta_text || 'Order Now'}
                </button>
              </div>
            </div>
          );
        })}

        {/* Dot indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onMouseDown={e => e.stopPropagation()}
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{ width: i === current ? 16 : 6, height: 6, background: i === current ? '#22c55e' : 'rgba(255,255,255,0.35)' }}
              />
            ))}
          </div>
        )}

        {/* Slide counter badge */}
        {banners.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
            {current + 1}/{banners.length}
          </div>
        )}
      </div>
    </div>
  );
}
