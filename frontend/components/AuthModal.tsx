'use client';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, Mail, KeyRound, User, Phone, Loader2, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';

type Step = 'email' | 'otp';

export default function AuthModal() {
  const { showAuthModal, setShowAuthModal, sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleOtpChange = (val: string, idx: number) => {
    const newOtp = [...otp];
    newOtp[idx] = val.slice(-1);
    setOtp(newOtp);
    if (val && idx < 5) {
      const next = document.getElementById(`otp-${idx + 1}`);
      next?.focus();
    }
  };

  const handleSendOtp = async () => {
    if (!name.trim()) { toast.error('Enter your name to proceed'); return; }
    if (!phone.trim()) { toast.error('Enter your phone number to proceed'); return; }
    if (phone.length < 10) { toast.error('Enter a valid 10-digit phone number'); return; }
    if (!email.includes('@')) { toast.error('Enter a valid email'); return; }
    setLoading(true);
    const { success, error } = await sendOtp(email);
    setLoading(false);
    if (success) { 
      setStep('otp'); 
      toast.success('OTP sent to your email!'); 
    } else {
      toast.error(error || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join('');
    if (code.length !== 6) { toast.error('Enter the full 6-digit OTP'); return; }
    setLoading(true);
    const { success, error } = await verifyOtp(email, code, name, phone);
    setLoading(false);
    if (success) { 
      toast.success(`Welcome to QuickCombo! 🎉`); 
    } else {
      toast.error(error || 'Invalid or expired OTP');
    }
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setTimeout(() => { setStep('email'); setOtp(['', '', '', '', '', '']); }, 300);
  };

  return (
    <AnimatePresence>
      {showAuthModal && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="w-full max-w-sm glass-green rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Zap size={20} className="text-green-400" />
                  <h2 className="font-black text-xl">
                    {step === 'email' ? 'Sign in' : 'Verify OTP'}
                  </h2>
                </div>
                <button onClick={handleClose} className="p-1.5 glass rounded-lg text-gray-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <AnimatePresence mode="wait">
                {step === 'email' ? (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                    className="space-y-4"
                  >
                    <p className="text-gray-400 text-sm">Login or create your QuickCombo account with email OTP.</p>
                    <div className="space-y-3">
                      <div className="relative group">
                        <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" />
                        <input 
                          className="qc-input !pl-10 !border-red-500/20 focus:!border-green-500" 
                          placeholder="Full Name" 
                          value={name} 
                          onChange={e => setName(e.target.value)} 
                          required
                        />
                      </div>
                      <div className="relative group">
                        <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" />
                        <input 
                          className="qc-input !pl-10 !border-red-500/20 focus:!border-green-500" 
                          placeholder="Contact Number" 
                          value={phone} 
                          onChange={e => setPhone(e.target.value)} 
                          type="tel"
                          required
                        />
                      </div>
                      <div className="relative group">
                        <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-500 transition-colors" />
                        <input
                          className="qc-input !pl-10" 
                          placeholder="Email Address *" 
                          type="email"
                          value={email} 
                          onChange={e => setEmail(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                          required
                        />
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSendOtp}
                      disabled={loading || !name.trim() || !phone.trim() || !email.includes('@')}
                      className="w-full btn-primary py-3.5 font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale transition-all shadow-[0_4px_16px_rgba(34,197,94,0.2)]"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                      {loading ? 'Sending...' : 'Continue to OTP'}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp"
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <p className="text-gray-400 text-sm">
                      Enter the 6-digit code sent to <span className="text-white font-medium">{email}</span>
                    </p>

                    {/* OTP Input Grid */}
                    <div className="flex gap-2 justify-center">
                      {otp.map((digit, i) => (
                        <motion.input
                          key={i}
                          id={`otp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(e.target.value, i)}
                          onKeyDown={e => {
                            if (e.key === 'Backspace' && !digit && i > 0) {
                              document.getElementById(`otp-${i - 1}`)?.focus();
                            }
                          }}
                          whileFocus={{ scale: 1.1, borderColor: '#22c55e' }}
                          className="w-11 h-12 text-center text-xl font-black bg-[#1a1a1a] border border-white/10 rounded-xl focus:outline-none focus:border-green-500 focus:shadow-[0_0_0_3px_rgba(34,197,94,0.15)] transition-all"
                        />
                      ))}
                    </div>

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleVerifyOtp}
                      disabled={loading}
                      className="w-full btn-primary py-3.5 font-bold flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                      {loading ? 'Verifying...' : 'Verify & Login'}
                    </motion.button>

                    <button
                      onClick={() => setStep('email')}
                      className="w-full text-center text-sm text-gray-500 hover:text-white transition-colors"
                    >
                      ← Change email
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
