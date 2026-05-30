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
    axios.get(`${API}/api/banners/`)
      .then(res => { setBanners(Array.isArray(res.data) ? res.data : []); })
      .catch(err => { console.error('[Banner] fetch error:', err?.response?.status, err?.message); })
      .finally(() => setLoaded(true));
  }, []);

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
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % banners.length), 4500);
  }, [banners.length]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const goTo = (idx: number) => { setCurrent(idx); startTimer(); };
  const goNext = () => goTo((current + 1) % banners.length);
  const goPrev = () => goTo((current - 1 + banners.length) % banners.length);

  const onTouchStart = (e: React.TouchEvent) => { setDragStart(e.touches[0].clientX); if (timerRef.current) clearInterval(timerRef.current); };
  const onTouchEnd = (e: React.TouchEvent) => { const d = dragStart - e.changedTouches[0].clientX; if (Math.abs(d) > 40) d > 0 ? goNext() : goPrev(); else startTimer(); };
  const onMouseDown = (e: React.MouseEvent) => { setIsDragging(true); setDragStart(e.clientX); if (timerRef.current) clearInterval(timerRef.current); };
  const onMouseUp = (e: React.MouseEvent) => { if (!isDragging) return; setIsDragging(false); const d = dragStart - e.clientX; if (Math.abs(d) > 40) d > 0 ? goNext() : goPrev(); else startTimer(); };

  const handleCTA = (banner: Banner) => {
    axios.post(`${API}/api/banners/${banner.id}/click/`).catch(() => {});
    if (banner.cta_link.startsWith('http')) window.open(banner.cta_link, '_blank');
    else router.push(banner.cta_link);
  };

  // Loading skeleton — same height as hero
  if (!loaded) {
    return (
      <div className="w-full bg-white/5 animate-pulse" style={{ minHeight: 340 }} />
    );
  }

  // No banners — show nothing (section is hidden)
  if (!banners.length) return null;

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{
        minHeight: 320,
        cursor: isDragging ? 'grabbing' : 'grab',
        borderRadius: '0 0 2rem 2rem',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      onMouseLeave={() => { if (isDragging) { setIsDragging(false); startTimer(); } }}
    >
      {/* Slides */}
      {banners.map((b, i) => {
        const imgSrc = b.image_url
          ? (b.image_url.startsWith('http') ? b.image_url : `${API}${b.image_url}`)
          : null;

        return (
          <div
            key={b.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
          >
            {/* Background */}
            {imgSrc ? (
              imgSrc.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={imgSrc}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ minHeight: 320 }}
                />
              ) : (
                <img
                  src={imgSrc}
                  alt={b.title}
                  className="w-full h-full object-cover"
                  draggable={false}
                  style={{ minHeight: 320 }}
                />
              )
            ) : (
              <div
                className="w-full h-full"
                style={{
                  minHeight: 320,
                  background: b.bg_color
                    ? `${b.bg_color}`
                    : 'linear-gradient(135deg, #052e10 0%, #0a1a0a 50%, #0d0d0d 100%)'
                }}
              />
            )}

            {/* Dark gradient — left-heavy for text readability */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(100deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.15) 100%)' }}
            />

            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end px-6 pb-10 pt-6">
              {/* Live badge */}
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-400" style={{ boxShadow: '0 0 6px #22c55e' }} />
                <span className="text-green-400 text-xs font-bold tracking-wide">QuickCombo · Delivering Now</span>
              </div>

              <h2
                className="text-white font-black leading-tight mb-2 drop-shadow-lg"
                style={{ fontSize: 'clamp(1.6rem, 7vw, 2.4rem)', maxWidth: '70%' }}
              >
                {b.title}
              </h2>

              {b.subtitle && (
                <p
                  className="text-gray-300 font-medium mb-5 leading-snug"
                  style={{
                    fontSize: 'clamp(0.8rem, 3.5vw, 1rem)',
                    maxWidth: '62%',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {b.subtitle}
                </p>
              )}

              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); handleCTA(b); }}
                className="self-start font-black uppercase tracking-wider transition-all active:scale-95"
                style={{
                  background: '#22c55e',
                  color: '#000',
                  padding: '12px 24px',
                  borderRadius: '1rem',
                  fontSize: '0.8rem',
                  boxShadow: '0 6px 20px rgba(34,197,94,0.4)',
                }}
              >
                {b.cta_text || 'Order Now'} →
              </button>
            </div>
          </div>
        );
      })}

      {/* Dot indicators — bottom center */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => goTo(i)}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                height: 6,
                background: i === current ? '#22c55e' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      )}

      {/* Slide number — top right */}
      {banners.length > 1 && (
        <div
          className="absolute top-4 right-4 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        >
          {current + 1} / {banners.length}
        </div>
      )}
    </div>
  );
}
