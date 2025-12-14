import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, Shuffle, Crown, Info } from 'lucide-react';
import { useStore } from '../store';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  const { user } = useStore();
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  const handleUpgrade = () => {
    // Get payment link from environment variable
    const baseLink = import.meta.env.VITE_DODO_PAYMENT_LINK;

    if (!baseLink) {
      console.error('[PREMIUM] Payment link not configured');
      alert('Payment system not configured. Please contact support.');
      return;
    }

    if (!user?.uid) {
      console.error('[PREMIUM] User not logged in');
      alert('Please sign in before upgrading to Premium.');
      return;
    }

    // Append user_id metadata to payment link for webhook identification
    // Check if URL already has query params
    const separator = baseLink.includes('?') ? '&' : '?';
    // const paymentLink = `${baseLink}${separator}metadata[user_id]=${encodeURIComponent(user.uid)}`;
    // NEW (Correct - uses underscore prefix)
    const paymentLink = `${baseLink}${separator}metadata_user_id=${encodeURIComponent(user.uid)}`;

    console.log('[PREMIUM] Redirecting to payment:', paymentLink);

    // Redirect to Dodo Payments
    window.location.href = paymentLink;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0F0F10] rounded-3xl border border-amber-500/20 overflow-hidden shadow-2xl"
        >
          {/* Gold Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-amber-500/20 blur-[80px] opacity-50 pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="relative p-8">
            {/* Crown Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="text-6xl"
                >
                  <Crown className="w-16 h-16 text-amber-400" fill="currentColor" />
                </motion.div>
                <div className="absolute inset-0 bg-amber-400/30 blur-xl" />
              </div>
            </div>

            {/* Header */}
            <h2 className="text-3xl font-black text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">
              Unlock Your Full Potential
            </h2>
            <p className="text-center text-white/60 text-sm mb-8">
              Activate your AI Brain and never plateau again
            </p>

            {/* Features */}
            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={20} className="text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">AI Copilot</h3>
                  <p className="text-sm text-white/60">
                    Daily adaptive plans that evolve with your performance
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Calendar size={20} className="text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Sunday Ritual</h3>
                  <p className="text-sm text-white/60">
                    Weekly strategy sessions with persona-based pivots
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0">
                  <Shuffle size={20} className="text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-white mb-1">Unlimited Shuffle</h3>
                  <p className="text-sm text-white/60">
                    Never get stuck - infinite habit variations
                  </p>
                </div>
              </div>
            </div>

            {/* 🇮🇳 Info Icon with Click-to-Show Regional Note */}
            <div className="flex items-center justify-center gap-2 mb-4 relative">
              <button
                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                className="flex items-center gap-1.5 text-white/40 hover:text-white/60 transition-colors text-xs"
              >
                <Info size={14} />
                <span>Payment info for Indian users</span>
              </button>

              <AnimatePresence>
                {showInfoTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-8 left-0 right-0 p-3 rounded-xl bg-slate-900 border border-blue-400/40 z-10 shadow-lg"
                  >
                    <p className="text-xs text-blue-300 leading-relaxed">
                      <span className="font-bold">🇮🇳 For Indian Users (UPI/Cards):</span><br />
                      RBI requires a 'Recurring Mandate' limit (usually ₹15,000) for auto-payments.
                      <span className="font-bold text-white"> Don't panic</span> — this is just a safety cap.
                      You'll <span className="font-bold text-green-400">only be charged $8/month</span>.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* CTA Button */}
            <button
              onClick={handleUpgrade}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-black font-bold text-lg shadow-[0_0_30px_rgba(251,191,36,0.3)] hover:shadow-[0_0_40px_rgba(251,191,36,0.5)] transition-all duration-300 active:scale-95 flex items-center justify-center gap-2"
            >
              <Crown size={20} fill="currentColor" />
              <span>Activate AI Coaching</span>
            </button>

            <p className="text-center text-white/40 text-xs mt-4">
              $8/month • Cancel anytime
            </p>

            {/* Merchant of Record Footer */}
            <p className="text-center text-white/30 text-[10px] mt-3 leading-relaxed">
              Secure payments processed by <span className="font-semibold">Dodo Payments</span>.<br />
              The charge will appear as "Dodo Payments" or "Bounce" on your statement.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
