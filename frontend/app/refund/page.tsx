'use client';
import { motion } from 'framer-motion';
import { ChevronLeft, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RefundPage() {
  const router = useRouter();

  const sections = [
    {
      title: "Cancellation Policy",
      content: "• Cancellations will be considered only if the request is made immediately after placing the order. However, the cancellation request may not be entertained if the orders have been communicated to the vendors/merchants and they have initiated the process of shipping them.\n• QuickCombo does not accept cancellation requests for perishable items like flowers, eatables etc. However, refund/replacement can be made if the customer establishes that the quality of product delivered is not good.",
      icon: ShieldAlert
    },
    {
      title: "Damaged or Defective Items",
      content: "In case of receipt of damaged or defective items please report the same to our Customer Service team. The request will, however, be entertained once the merchant has checked and determined the same at his own end. This should be reported within the same day of receipt of the products. In case you feel that the product received is not as shown on the site or as per your expectations, you must bring it to the notice of our customer service within the same day of receiving the product. The Customer Service Team after looking into your complaint will take an appropriate decision.",
      icon: ShieldAlert
    },
    {
      title: "Refunds",
      content: "In case of complaints regarding products that come with a warranty from manufacturers, please refer the issue to them. In case of any Refunds approved by QuickCombo, it’ll take 3-5 Days days for the refund to be processed to the end customer.",
      icon: ShieldAlert
    }
  ];

  return (
    <div className="page-wrapper max-w-lg mx-auto pb-24 min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 sticky top-0 z-20 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-white hover:text-green-400 p-1 rounded-lg bg-white/5">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-xl font-black text-white">Cancellation & Refund Policy</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Intro */}
        <section className="py-6">
          <h2 className="text-4xl font-black text-white leading-none tracking-tighter mb-4 uppercase italic">
            Cancellation &<br />
            <span className="text-green-500">Refund</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed font-medium">
            Last updated on 23-06-2026 12:06:57. QuickCombo believes in helping its customers as far as possible, and has therefore a liberal cancellation policy.
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
