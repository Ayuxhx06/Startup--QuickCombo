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
        <section className="space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-green-500/10 flex items-center justify-center p-3 border border-green-500/20">
            <Image src="/logo.png" alt="QuickCombo" width={80} height={80} className="object-contain" />
          </div>
          <h2 className="text-3xl font-black text-white leading-tight">
            Fastest Delivery<br />
            <span className="gradient-text">For Your Essentials.</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            QuickCombo is dedicated to bringing you the best food combos and daily essentials in record time. 
            We partner with the best local restaurants and vendors to ensure quality and speed.
          </p>
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

        {/* MSME Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-500" /> MSME Verification
            </h3>
          </div>
          <div className="bg-[#141414] border border-white/5 rounded-[32px] p-6 text-center space-y-4">
            <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden border border-white/10 bg-white/5 group">
              <Image 
                src="/cert_msme.png" 
                alt="MSME Certificate" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <a 
                  href="/cert_msme.png" 
                  download 
                  className="bg-green-500 text-black p-4 rounded-full shadow-2xl hover:scale-110 transition-transform"
                >
                  <Download size={24} />
                </a>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-white font-bold mb-1">Registered Enterprise</p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[200px] mx-auto mb-4">
                QuickCombo is a registered Micro enterprise under the Ministry of MSME, Government of India.
              </p>
              <a 
                href="/cert_msme.png" 
                target="_blank" 
                className="inline-flex items-center gap-2 text-xs font-bold text-green-500 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20"
              >
                View Certificate <ExternalLink size={12} />
              </a>
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
