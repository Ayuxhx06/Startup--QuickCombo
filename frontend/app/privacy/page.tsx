'use client';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, Lock, Eye, Database, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Information We Collect",
      content: "We collect information you provide directly to us when you create an account, place an order, or contact support. This includes:\n• Name and contact details (Phone, Email)\n• Delivery address and GPS location\n• Order history and preferences\n• Device information (IP address, browser type)",
      icon: Database
    },
    {
      title: "2. How We Use Your Data",
      content: "We use your information to:\n• Process and deliver your orders\n• Provide real-time tracking updates\n• Communicate about your account and promotions\n• Improve our platform performance and security\n• Comply with legal obligations",
      icon: Eye
    },
    {
      title: "3. Data Sharing",
      content: "We share your data only with necessary parties:\n• Delivery partners (Address and Phone for delivery)\n• Partner restaurants (Order details)\n• Payment processors (Transaction data)\n• Legal authorities if required by law",
      icon: ShieldCheck
    },
    {
      title: "4. Data Security",
      content: "We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
      icon: Lock
    },
    {
      title: "5. Cookies & Tracking",
      content: "We use cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze platform traffic.",
      icon: Database
    },
    {
      title: "6. Your Rights",
      content: "You have the right to:\n• Access your personal data\n• Request correction of inaccurate data\n• Request deletion of your account/data\n• Opt-out of marketing communications",
      icon: Bell
    },
    {
      title: "7. Contact Us",
      content: "If you have any questions about this Privacy Policy, please contact us at support@quickcombo.in.",
      icon: ShieldCheck
    }
  ];

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-24 min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 sticky top-0 z-20 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white hover:text-green-400 p-1 rounded-lg bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-white">Privacy Policy</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Intro */}
        <section className="py-6">
          <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-4 uppercase italic">
            Your Privacy<br />
            <span className="text-green-500">Matters</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed font-medium">
            This Privacy Policy explains how QuickCombo collects, uses, and protects your personal information.
          </p>
        </section>

        {/* Content Sections */}
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-6 rounded-[2rem] border bg-[#141414] border-white/5 transition-all"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 text-gray-400">
                  <section.icon size={20} />
                </div>
                <h3 className="font-bold text-white text-base">{section.title}</h3>
              </div>
              <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                {section.content}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-6 space-y-4">
          <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase italic">
            © QuickCombo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
