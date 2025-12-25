import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Brain, RefreshCw, Shield, Zap, Info, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PremiumModal: React.FC<PremiumModalProps> = ({ isOpen, onClose }) => {
  const { user } = useStore();
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showConsentHint, setShowConsentHint] = useState(false);

  const handleUpgrade = () => {
    // Check consent first
    if (!agreedToTerms) {
      setShowConsentHint(true);
      return;
    }

    // Get payment link from environment variable
    const baseLink = import.meta.env.VITE_DODO_PAYMENT_LINK;

    if (!baseLink) {
      if (import.meta.env.DEV) console.error('[PREMIUM] Payment link not configured');
      alert('Payment system not configured. Please contact support.');
      return;
    }

    if (!user?.uid) {
      if (import.meta.env.DEV) console.error('[PREMIUM] User not logged in');
      alert('Please sign in before upgrading to Premium.');
      return;
    }

    // Append user_id metadata to payment link for webhook identification
    // Check if URL already has query params
    const separator = baseLink.includes('?') ? '&' : '?';
    // const paymentLink = `${baseLink}${separator}metadata[user_id]=${encodeURIComponent(user.uid)}`;
    // NEW (Correct - uses underscore prefix)
    const paymentLink = `${baseLink}${separator}metadata_user_id=${encodeURIComponent(user.uid)}`;

    if (import.meta.env.DEV) console.log('[PREMIUM] Redirecting to payment:', paymentLink);

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
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" // Matches EnergyValve backdrop
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden z-10 ring-1 ring-white/5" // Matches EnergyValve container
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          <div className="text-center mb-8">
            {/* Header Icon - Matches EnergyValve style */}
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/10 to-purple-500/10 text-cyan-400 mb-4 ring-1 ring-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Sparkles size={24} />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Let the system carry <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">the load</span>
            </h2>
            <p className="text-white/60 text-sm px-2 leading-relaxed">
              Stop micro-managing yourself. Bounce adapts to your energy instantly.
            </p>
          </div>

          {/* The Comparison Visual - Adapted from EnergyValve */}
          <div className="flex items-center justify-between gap-3 mb-8 relative">

            {/* Left: Static/Manual Mode */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 opacity-50 grayscale select-none flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <RefreshCw size={14} className="text-white/70" />
              </div>
              <div className="space-y-1.5 w-full">
                <div className="h-1.5 w-3/4 mx-auto bg-white/20 rounded-full" />
                <div className="h-1.5 w-1/2 mx-auto bg-white/20 rounded-full" />
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-wider font-semibold text-white/40">Static Plan</div>
            </div>

            {/* Arrow */}
            <div className="z-10 bg-[#0a0a0a] border border-white/10 rounded-full p-1.5 shadow-lg text-white/30">
              <ArrowRight size={14} />
            </div>

            {/* Right: Premium/AI Mode */}
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              className="flex-1 bg-gradient-to-br from-cyan-500/15 via-purple-500/10 to-cyan-500/15 border border-cyan-500/40 rounded-2xl p-4 relative overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)] flex flex-col items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-400/5 to-transparent" />

              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/20 flex items-center justify-center ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.4)] relative z-10">
                <Brain size={14} className="text-cyan-300" />
              </div>

              <div className="space-y-1.5 w-full relative z-10">
                <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400/40 to-purple-400/30 rounded-full" />
                <div className="h-1.5 w-3/4 mx-auto bg-gradient-to-r from-purple-400/30 to-cyan-400/40 rounded-full" />
              </div>

              <div className="mt-1 flex items-center gap-1.5 relative z-10">
                <span className="text-[10px] uppercase tracking-wider font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">AI Adapted</span>
                <Sparkles size={8} className="text-purple-300" />
              </div>
            </motion.div>
          </div>

          {/* Premium Features - Key Benefits */}
          <ul className="space-y-3 mb-6">
            {[
              { title: 'Daily Adaptive Plan', desc: "Today's habits adjust based on yesterday" },
              { title: 'Burnout Protection', desc: 'Detects overreach and shifts to recovery' },
              { title: 'Smarter Reflections', desc: 'Voice notes guide your identity journey' },
              { title: 'Weekly Personal AI', desc: 'Private reflection on your patterns & growth' },
              { title: 'Unlimited Adaptation', desc: 'Free = static. Premium = evolves with you.' },
            ].map((feature, i) => (
              <motion.li
                key={feature.title}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 + i * 0.06, duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-400 mt-0.5 flex-shrink-0">
                  <Check size={12} />
                </div>
                <div>
                  <span className="text-sm font-semibold text-white">{feature.title}</span>
                  <span className="block text-xs text-white/40 leading-snug">{feature.desc}</span>
                </div>
              </motion.li>
            ))}
          </ul>


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

          {/* Terms Consent Checkbox */}
          <div className="mb-4">
            <label
              className="flex items-start gap-3 cursor-pointer group"
              onClick={() => {
                setAgreedToTerms(!agreedToTerms);
                if (!agreedToTerms) setShowConsentHint(false);
              }}
            >
              <div className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-colors mt-0.5 ${agreedToTerms
                ? 'bg-cyan-500 border-cyan-500'
                : 'border-white/30 group-hover:border-white/50'
                }`}>
                {agreedToTerms && <Check size={14} className="text-black" />}
              </div>
              <span className="text-xs text-white/60 leading-relaxed">
                I agree to the{' '}
                <Link
                  to="/terms"
                  onClick={(e) => e.stopPropagation()}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link
                  to="/refund"
                  onClick={(e) => e.stopPropagation()}
                  className="text-cyan-400 hover:text-cyan-300 underline"
                >
                  Refund Policy
                </Link>
              </span>
            </label>

            {/* Calm inline hint */}
            <AnimatePresence>
              {showConsentHint && !agreedToTerms && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-xs text-cyan-400/80 mt-2 ml-8"
                >
                  Please confirm before continuing
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* CTA Button - Premium Gradient */}
          <motion.button
            onClick={handleUpgrade}
            disabled={!agreedToTerms}
            whileHover={agreedToTerms ? { scale: 1.02 } : {}}
            whileTap={agreedToTerms ? { scale: 0.98 } : {}}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${agreedToTerms
              ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
          >
            <Sparkles size={18} />
            <span>Go Premium</span>
          </motion.button>

          {/* 7-Day Refund Reassurance */}
          <p className="text-center text-white/30 text-xs mt-5">
            <Link to="/refund" className="hover:text-white/50 transition-colors">
              7-day refund for first-time subscribers
            </Link>
          </p>

          {/* Merchant of Record Footer */}
          <p className="text-center text-white/20 text-[10px] mt-3 leading-relaxed">
            Secure payments by <span className="font-medium">Dodo Payments</span>
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
