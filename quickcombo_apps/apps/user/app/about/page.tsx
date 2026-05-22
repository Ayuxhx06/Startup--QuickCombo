'use client';
import { motion } from 'framer-motion';
import { Mail, Phone, ShieldCheck, ChevronLeft, ExternalLink, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-24 min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 sticky top-0 z-20 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white hover:text-green-400 p-1 rounded-lg bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-white">About QuickCombo</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Intro */}
        <section className="space-y-6">
          <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center p-4 border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors" />
            <Image src="/logo.png" alt="QuickCombo" width={80} height={80} className="object-contain relative z-10" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-4 uppercase italic">
              Revolutionizing<br />
              <span className="text-green-500">Hyper-Local</span> Delivery.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">
              QuickCombo is your elite gateway to instant cravings and daily essentials. 
              We've engineered a logistics network that connects you with premium local 
              partners to deliver quality, speed, and reliability—straight to your door.
            </p>
          </div>
        </section>

        {/* Contact info */}
        <section className="bg-[#141414] border border-white/5 rounded-[32px] p-6 space-y-5">
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
             Contact Support
          </h3>
          <div className="space-y-4">
            <a href="mailto:support@quickcombo.in" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:bg-green-500 group-hover:text-black transition-all">
                <Mail size={22} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Email Us</p>
                <p className="text-base font-bold text-white group-hover:text-green-400 transition-colors">support@quickcombo.in</p>
              </div>
            </a>
            <a href="tel:+918243800384" className="flex items-center gap-4 group">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-500 group-hover:text-black transition-all">
                <Phone size={22} />
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Instant Help</p>
                <p className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">+91 8243800384</p>
              </div>
            </a>
          </div>
        </section>

        {/* MSME Section Simplified */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black text-gray-500 text-[10px] uppercase tracking-[0.3em] flex items-center gap-2 italic">
              <ShieldCheck size={14} className="text-green-500" /> LEGAL_COMPLIANCE
            </h3>
          </div>
          <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="relative aspect-[3/4.2] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 pointer-events-none">
              <Image 
                src="/cert_msme.png" 
                alt="MSME Certificate" 
                fill 
                className="object-cover"
              />
            </div>
            <div className="pt-2 text-center">
              <p className="text-white font-black text-xl uppercase italic mb-1">Verified under MSME</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Govt of India Registered Enterprise</p>
            </div>
          </div>
        </section>

        {/* Footer info */}
        <div className="text-center py-6 space-y-2">
          <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase">QuickCombo • Made with ❤️ in India</p>
          <div className="flex justify-center gap-4 text-[10px] text-gray-500 font-bold uppercase transition-colors">
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
