'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Construction, Sparkles, Phone, MessageSquare, AlertTriangle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://quickcombo.alwaysdata.net';

export default function MaintenanceGuard({ children }: { children: React.ReactNode }) {
    const [isOnline, setIsOnline] = useState<boolean | null>(null);
    const pathname = usePathname();

    const isAdmin = pathname?.startsWith('/admin');

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await axios.get(`${API}/api/config/`);
                setIsOnline(res.data.site_online === true);
            } catch (err) {
                console.error('Config fetch failed:', err);
                setIsOnline(true); // Fallback to online if API is down but we can't tell
            }
        };

        checkStatus();
        const interval = setInterval(checkStatus, 30000); // Check every 30s
        return () => clearInterval(interval);
    }, []);

    // Admins bypass the guard to fix things.
    // If isOnline is explicitly false, show maintenance. 
    // If it's true, null (loading), or there's an error, show children.
    if (isAdmin || isOnline !== false) {
        return <>{children}</>;
    }

    return (
        <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-6 overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative max-w-xl w-full bg-[#080808] border border-white/5 p-10 md:p-16 rounded-[3rem] text-center shadow-2xl"
            >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/20 rotate-12">
                    <Construction size={48} className="text-black" />
                </div>

                <div className="mt-8 space-y-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                            We're <span className="text-emerald-500">Refining</span>
                        </h1>
                        <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px]">The Kitchen is Temporarily Closed</p>
                    </div>

                    <p className="text-gray-400 text-sm md:text-base leading-relaxed font-medium">
                        QuickCombo is currently undergoing scheduled maintenance to enhance your experience. 
                        We'll be back online with fresh combos and faster delivery very shortly!
                    </p>

                    <div className="grid grid-cols-2 gap-4 py-6">
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2">
                            <Sparkles className="text-emerald-500" size={20} />
                            <span className="text-[10px] font-black uppercase text-gray-500">Next Update</span>
                            <span className="text-xs font-bold text-white">Coming Soon</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-2">
                            <AlertTriangle className="text-amber-500" size={20} />
                            <span className="text-[10px] font-black uppercase text-gray-500">System</span>
                            <span className="text-xs font-bold text-white">Upgrading</span>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-center gap-6">
                        <a href="tel:+918838043681" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                                <Phone size={18} className="group-hover:text-emerald-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-gray-600">Urgent Support</p>
                                <p className="text-xs font-bold font-mono">+91 88380 43681</p>
                            </div>
                        </a>
                        <a href="https://wa.me/918838043681" target="_blank" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-emerald-500/10 transition-colors">
                                <MessageSquare size={18} className="group-hover:text-emerald-500" />
                            </div>
                            <div className="text-left">
                                <p className="text-[9px] font-black uppercase text-gray-600">WhatsApp Us</p>
                                <p className="text-xs font-bold">Quick Message</p>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Aesthetic footer */}
                <div className="mt-12 text-[9px] font-black uppercase tracking-[0.4em] text-gray-700 italic">
                    QuickCombo Infrastructure v1.2.7
                </div>
            </motion.div>
        </div>
    );
}
