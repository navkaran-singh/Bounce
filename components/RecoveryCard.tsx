import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, RefreshCw, X, Activity, Lock } from 'lucide-react';
import { useStore } from '../store';
import { useResilienceEngine } from '../hooks/useResilienceEngine';

interface RecoveryCardProps {
  onDismiss?: () => void;
}

export const RecoveryCard: React.FC<RecoveryCardProps> = ({ onDismiss }) => {
  const { shields, applyRecoveryOption, dismissRecoveryMode, consecutiveMisses, isPremium } = useStore();

  const handleOption = (option: 'one-minute-reset' | 'use-shield' | 'gentle-restart') => {
    applyRecoveryOption(option);
    onDismiss?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className="relative w-full overflow-hidden rounded-3xl p-[1px] mb-6 group"
    >
      {/* Electric Blue Gradient Border */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/60 via-cyan-400/40 to-blue-600/60 opacity-80 blur-sm" />

      <div className="relative bg-[#0F0F10] rounded-[23px] p-5 overflow-hidden">

        {/* Header */}
        <div className="relative flex items-start justify-between mb-4 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg tracking-tight">Recovery Mode</h3>
              {/* 🛑 FIX: Restore the dynamic counter logic */}
              <p className="text-blue-200/60 text-xs font-medium tracking-wider">
                {consecutiveMisses > 1
                  ? `${consecutiveMisses - 1} Days Missed`
                  : "A small break detected — let's re-enter gently."
                }
              </p>
            </div>
          </div>
          <button
            onClick={() => dismissRecoveryMode()}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/20 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Keyword #17: Bounce gets better when you get worse */}
        <p className="text-white/80 text-sm mb-6 leading-relaxed font-medium">
          Bounce gets better when you get worse.
          <span className="text-white/40 font-normal ml-1">
            {/* Keyword #1: Gentle */}
            Let's re-enter gently.
          </span>
        </p>

        {/* Options Grid */}
        <div className="relative space-y-3 z-10">

          {/* ⚡ Option 1: One-Minute Reset */}
          <button
            onClick={() => handleOption('one-minute-reset')}
            className="w-full flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-blue-400/40 transition-all active:scale-[0.98]"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <span className="text-white font-semibold block text-sm">One-Minute Reset</span>
              {/* Keyword #11: Let's make today easier */}
              <span className="text-white/40 text-xs">Lowers difficulty to rebuild momentum</span>
            </div>
          </button>

          {/* 🛡️ Option 2: Use Shield */}
          <button
            onClick={() => handleOption('use-shield')}
            disabled={shields === 0}
            className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all relative
              ${shields > 0
                ? 'bg-white/5 border-white/5 hover:border-blue-400/40 cursor-pointer active:scale-[0.98]'
                : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
              }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${shields > 0 ? 'bg-blue-500/10' : 'bg-white/5'}`}>
              <Shield className={`w-5 h-5 ${shields > 0 ? 'text-blue-400' : 'text-white/20'}`} />
            </div>
            <div className="text-left w-full pr-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-white font-semibold text-sm">Use Shield</span>
                {shields > 0 ? (
                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/20 font-bold uppercase tracking-wide">
                    {shields} Available
                  </span>
                ) : (
                  <span className="text-[9px] bg-white/5 text-white/20 px-1.5 py-0.5 rounded font-bold uppercase tracking-wide">
                    Empty
                  </span>
                )}
              </div>
              <span className="text-xs block text-white/40">
                {shields > 0
                  ? (isPremium ? "Momentum isn't lost. It's restored." : "Use your free shield!")
                  : (isPremium ? "Earn shields with 7-day streaks" : "Bounce protects your identity when life gets heavy. Upgrade for shields.")
                }
              </span>
            </div>
          </button>


          {/* 🔄 Option 3: Gentle Restart (Premium Only) */}
          <button
            onClick={() => handleOption('gentle-restart')}
            disabled={!isPremium}
            className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all relative
              ${isPremium
                ? 'bg-white/5 border-white/5 hover:border-emerald-500/40 cursor-pointer active:scale-[0.98]'
                : 'bg-black/20 border-white/5 opacity-50 cursor-not-allowed'
              }`}
          >
            {!isPremium && (
              <div className="absolute top-2 right-2">
                <Lock className="w-3 h-3 text-white/30" />
              </div>
            )}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isPremium ? 'bg-emerald-500/10' : 'bg-white/5'}`}>
              <RefreshCw className={`w-5 h-5 ${isPremium ? 'text-emerald-400' : 'text-white/20'}`} />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-white font-semibold text-sm">Gentle Restart</span>
                {!isPremium && (
                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 font-bold uppercase tracking-wide">
                    Premium
                  </span>
                )}
              </div>
              <span className="text-white/40 text-xs">
                {isPremium ? "Recovery is progress. Reset streak, keep badges." : "Fresh start without losing badges"}
              </span>
            </div>
          </button>

        </div>

        {/* Footer - Keyword #6 */}
        <p className="text-center text-white/30 text-[10px] mt-4 uppercase tracking-widest font-medium">
          You don't start over — you bounce back
        </p>
      </div>
    </motion.div>
  );
};