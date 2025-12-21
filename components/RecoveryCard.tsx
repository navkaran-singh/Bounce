import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, ArrowRight, RefreshCw, X, Activity, Lock, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';

interface RecoveryCardProps {
  onDismiss?: () => void;
}

export const RecoveryCard: React.FC<RecoveryCardProps> = ({ onDismiss }) => {
  const { applyRecoveryOption, dismissRecoveryMode, consecutiveMisses, isPremium } = useStore();
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const handleLowerBar = () => {
    applyRecoveryOption('one-minute-reset');
    dismissRecoveryMode(); // Close the card (orb stays cracked via resilienceStatus)
    onDismiss?.();
  };

  const handleContinue = () => {
    dismissRecoveryMode();
    onDismiss?.();
  };

  const handleRestart = () => {
    if (showRestartConfirm) {
      applyRecoveryOption('gentle-restart');
      onDismiss?.();
    } else {
      setShowRestartConfirm(true);
    }
  };

  const showRestartOption = consecutiveMisses >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="relative w-full overflow-hidden rounded-3xl p-[1px] mb-6"
    >
      {/* Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/60 via-cyan-400/40 to-blue-600/60 opacity-80 blur-sm" />

      <div className="relative bg-[#0F0F10] rounded-[23px] p-5 overflow-hidden">

        {/* Header */}
        <div className="relative flex items-start justify-between mb-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight">Recovery Mode</h3>
              <p className="text-blue-200/60 text-xs font-medium tracking-wider">
                {consecutiveMisses >= 5
                  ? `${consecutiveMisses} days away — welcome back`
                  : consecutiveMisses > 1
                    ? `${consecutiveMisses} days missed`
                    : "A small break detected"
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/20 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <p className="text-white/80 text-sm mb-6 leading-relaxed font-medium">
          {consecutiveMisses >= 5
            ? "You've been away a while. No judgment."
            : "Bounce gets better when you get worse."
          }
          <span className="text-white/40 font-normal ml-1">
            Let's make today easier.
          </span>
        </p>

        {/* Options */}
        <div className="relative space-y-3 z-10">

          {/* PRIMARY: Lower today's bar */}
          <button
            onClick={handleLowerBar}
            className="w-full flex items-center gap-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:border-blue-400/50 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
              <ArrowDown className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <span className="text-white font-semibold block text-sm">Lower today's bar</span>
              <span className="text-white/50 text-xs">Switch to low-energy habits. No pressure to finish.</span>
            </div>
          </button>

          {/* SECONDARY: Continue as is */}
          <button
            onClick={handleContinue}
            className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/20 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
              <ArrowRight className="w-5 h-5 text-white/40" />
            </div>
            <div className="text-left">
              <span className="text-white/70 font-medium block text-sm">Continue as is</span>
              <span className="text-white/30 text-xs">Dismiss and keep current habits</span>
            </div>
          </button>

          {/* RARE: Restart identity (5+ days, premium) */}
          <AnimatePresence>
            {showRestartOption && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <button
                  onClick={handleRestart}
                  disabled={!isPremium}
                  className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all relative
                    ${isPremium
                      ? 'bg-red-500/5 border-red-500/20 hover:border-red-400/40 cursor-pointer active:scale-[0.98]'
                      : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                >
                  {!isPremium && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-3 h-3 text-white/30" />
                    </div>
                  )}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-red-500/10' : 'bg-white/5'}`}>
                    {showRestartConfirm ? (
                      <AlertTriangle className={`w-5 h-5 ${isPremium ? 'text-red-400' : 'text-white/20'}`} />
                    ) : (
                      <RefreshCw className={`w-5 h-5 ${isPremium ? 'text-red-400' : 'text-white/20'}`} />
                    )}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-semibold text-sm ${isPremium ? 'text-red-400' : 'text-white/40'}`}>
                        {showRestartConfirm ? 'Confirm restart?' : 'Restart this identity'}
                      </span>
                      {!isPremium && (
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wide">
                          Premium
                        </span>
                      )}
                    </div>
                    <span className="text-white/40 text-xs">
                      {showRestartConfirm
                        ? 'Resets: streak, score, stage → 0. Keeps: badges, completions.'
                        : 'Fresh start. Stage resets to Initiation.'}
                    </span>
                  </div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-[10px] mt-4 uppercase tracking-widest font-medium">
          You don't start over — you bounce back
        </p>
      </div>
    </motion.div>
  );
};