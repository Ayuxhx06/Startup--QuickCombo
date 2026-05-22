'use client';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldCheck, FileText, Info, Scale, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsPage() {
  const router = useRouter();

  const sections = [
    {
      title: "1. Service Overview",
      content: "QuickCombo is a facilitation platform that helps users arrange and receive food, groceries, and other items from nearby restaurants and stores. We act solely as an intermediary and do not manufacture, stock, or directly sell products.",
      icon: Info
    },
    {
      title: "2. Special Requests & Service Clarification",
      content: "QuickCombo allows users to place “Special Requests” for items not listed on the platform. We do not sell or promote any specific products. We only assist in arranging items from nearby third-party vendors based on user requests. All products are supplied by independent vendors, and QuickCombo is not responsible for their quality, availability, or condition.",
      icon: FileText
    },
    {
      title: "3. Restricted Items Policy (Including Tobacco Products)",
      content: "Certain items may be classified as restricted items based on local regulations. \n\n• Any such items are only arranged upon explicit user request.\n• Orders for restricted items are accepted strictly for customers aged 18 years or above.\n\nMandatory Verification:\n• Customers must confirm that they are 18+ at the time of placing the order.\n• Valid government-issued ID must be shown at the time of delivery.\n• If age verification fails, the order will be cancelled without delivery.\n\nQuickCombo operates in accordance with all applicable local and national laws.",
      icon: AlertCircle,
      highlight: true
    },
    {
      title: "4. Order Acceptance",
      content: "All orders are subject to availability and confirmation from the respective vendor/store.",
      icon: ShieldCheck
    },
    {
      title: "5. Pricing",
      content: "Prices may differ from in-store pricing and may include delivery or service charges.",
      icon: Scale
    },
    {
      title: "6. Delivery Policy",
      content: "• Delivery times are estimates and may vary.\n• Late-night deliveries are subject to local/society restrictions.\n• Delivery may be limited to gate pickup in restricted areas.",
      icon: Info
    },
    {
      title: "7. User Responsibility",
      content: "Users must provide accurate details including name, contact number, and delivery address. Providing false information (including age) may result in order cancellation and account restriction.",
      icon: ShieldCheck
    },
    {
      title: "8. Third-Party Vendors",
      content: "QuickCombo is not responsible for the preparation, quality, packaging, or safety of items supplied by third-party vendors.",
      icon: AlertCircle
    },
    {
      title: "9. Refund & Cancellation",
      content: "• Orders can be cancelled before processing.\n• Once an order is prepared or picked up, cancellation may not be possible.\n• Refunds may be issued for non-delivery, missing items, or incorrect orders.",
      icon: Scale
    },
    {
      title: "10. Limitation of Liability",
      content: "QuickCombo shall not be liable for delays, vendor-related issues, or external factors beyond its control.",
      icon: AlertCircle
    },
    {
      title: "11. Compliance with Laws",
      content: "Users and vendors agree to comply with all applicable local, state, and national laws.",
      icon: ShieldCheck
    },
    {
      title: "12. Changes to Terms",
      content: "QuickCombo reserves the right to modify these terms at any time without prior notice. Continued use of the platform constitutes acceptance of the updated terms.",
      icon: Info
    },
    {
      title: "13. Privacy & Data Security",
      content: "Your privacy is important to us. We collect only necessary information (name, phone, address) to fulfill orders. We do not sell your data to third parties. By using QuickCombo, you consent to our data collection practices as outlined in our Privacy Policy.",
      icon: ShieldCheck
    },
    {
      title: "14. Intellectual Property",
      content: "The QuickCombo brand, logos, and platform content are protected by copyright and trademark laws. You may not use, copy, or distribute any part of our platform without explicit permission.",
      icon: FileText
    },
    {
      title: "15. Indemnification",
      content: "You agree to indemnify and hold QuickCombo and its partners harmless from any claims, losses, or damages arising from your violation of these terms or misuse of the platform.",
      icon: AlertCircle
    },
    {
      title: "16. Termination of Service",
      content: "We reserve the right to suspend or terminate access to our services for any user who violates these terms, engages in fraudulent activity, or mistreats our delivery partners.",
      icon: ShieldCheck
    },
    {
      title: "17. Governing Law & Jurisdiction",
      content: "These terms are governed by the laws of India. Any legal disputes shall be subject to the exclusive jurisdiction of the courts in Coimbatore, Tamil Nadu.",
      icon: Scale
    },
    {
      title: "18. Severability",
      content: "If any provision of these terms is found to be unenforceable, the remaining provisions will continue to remain in full force and effect.",
      icon: Info
    },
    {
      title: "19. Contact Us",
      content: "If you have any questions about these Terms & Conditions, please contact us:\n• Email: support@quickcombo.in\n• Phone: +91 8248300384\n• Address: Coimbatore, Tamil Nadu, India",
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
        <h1 className="text-xl font-black text-white">Terms & Conditions</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Intro */}
        <section className="py-6">
          <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-4 uppercase italic">
            Welcome to<br />
            <span className="text-green-500">QuickCombo</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed font-medium">
            By accessing or using our platform, you agree to the following terms and conditions. Please read them carefully.
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
              className={`p-6 rounded-[2rem] border transition-all ${
                section.highlight 
                  ? 'bg-green-500/5 border-green-500/20' 
                  : 'bg-[#141414] border-white/5'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  section.highlight ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-gray-400'
                }`}>
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

        {/* Contact info */}
        <section className="bg-[#141414] border border-white/5 rounded-[32px] p-6 space-y-4">
          <h3 className="font-bold text-white text-lg">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-sm font-bold uppercase tracking-widest">Phone:</span>
              <span className="text-gray-300 font-bold">+91 8243800384</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-green-500 text-sm font-bold uppercase tracking-widest">Email:</span>
              <span className="text-gray-300 font-bold">support@quickcombo.in</span>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center py-6 space-y-4">
          <div className="p-4 glass rounded-2xl">
            <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
              By using QuickCombo, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.
            </p>
          </div>
          <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase italic">
            © QuickCombo. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
