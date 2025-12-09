import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Award, ArrowUpRight, RefreshCw, CheckCircle2, Lock } from 'lucide-react';
import { useStore } from '../store';
import { WeeklyPersona } from '../types';

export const WeeklyReviewModal: React.FC = () => {
  const { weeklyReview, completeWeeklyReview, optimizeWeeklyRoutine, isPremium, streak } = useStore();
  const [isHolding, setIsHolding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationApplied, setOptimizationApplied] = useState(false);
  const intervalRef = useRef<any>(null);

  if (!weeklyReview?.available) return null;

  const { persona, weeklyMomentumScore, totalCompletions, missedHabits, startDate, endDate } = weeklyReview;

  // Cinematic Persona Styling
  const getPersonaStyle = (persona: WeeklyPersona) => {
    switch (persona) {
      case 'TITAN':
        return {
          gradient: 'from-amber-300 via-yellow-500 to-amber-600',
          bgGlow: 'bg-amber-500/20',
          emoji: '🏆',
          title: 'THE TITAN',
          message: 'Unstoppable. You have outgrown your current limits.',
          actionText: 'Level Up Routine',
          actionIcon: <ArrowUpRight className="w-5 h-5" />,
          actionDesc: 'Apply progressive overload'
        };
      case 'GRINDER':
        return {
          gradient: 'from-emerald-400 to-teal-600',
          bgGlow: 'bg-emerald-500/20',
          emoji: '💪',
          title: 'THE GRINDER',
          message: 'Solid as a rock. Your consistency is building an empire.',
          actionText: null, // Grinders just seal
          actionIcon: null,
          actionDesc: null
        };
      case 'SURVIVOR':
        return {
          gradient: 'from-blue-400 to-indigo-600',
          bgGlow: 'bg-blue-500/20',
          emoji: '🛡️',
          title: 'THE SURVIVOR',
          message: 'You protected the streak. Resilience is your superpower.',
          actionText: null,
          actionIcon: null,
          actionDesc: null
        };
      case 'GHOST':
        return {
          gradient: 'from-purple-400 to-indigo-900',
          bgGlow: 'bg-purple-500/20',
          emoji: '👻',
          title: 'THE REBUILD',
          message: 'A heavy week. Let\'s drop the weight and start fresh.',
          actionText: 'Reset & Simplify',
          actionIcon: <RefreshCw className="w-5 h-5" />,
          actionDesc: 'Switch to Atomic Habits'
        };
    }
  };

  const style = getPersonaStyle(persona);

  const startHold = (e: React.SyntheticEvent) => {
    // Prevent default touch actions (scrolling/context menu)
    // e.preventDefault(); 
    if (optimizationApplied || isOptimizing) return;

    setIsHolding(true);
    intervalRef.current = setTimeout(() => {
      setIsHolding(false);
      setShowSuccess(true);
      setTimeout(() => completeWeeklyReview(), 2000);
    }, 1500);
  };

  const stopHold = () => {
    setIsHolding(false);
    clearTimeout(intervalRef.current);
  };

  const handleOptimize = async () => {
    if (persona !== 'TITAN' && persona !== 'GHOST') return;

    // 1. Run optimization
    setIsOptimizing(true);
    await optimizeWeeklyRoutine(persona === 'TITAN' ? 'LEVEL_UP' : 'RESET');
    setIsOptimizing(false);
    setOptimizationApplied(true);

    // 2. Show success animation (confetti)
    setShowSuccess(true);

    // 3. Wait 2 seconds, then seal the week and close
    setTimeout(() => {
      completeWeeklyReview();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-3xl p-4"
      >
        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="relative w-full max-w-sm bg-[#0F0F10] rounded-[36px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Top Ambient Glow */}
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 ${style.bgGlow} blur-[80px] opacity-50 pointer-events-none`} />

          <div className="relative p-6 flex flex-col h-full overflow-y-auto no-scrollbar">

            {/* Header */}
            <div className="text-center mt-4 mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 text-[10px] uppercase tracking-widest text-white/40 font-bold">
                <Calendar size={12} />
                <span>Weekly Review</span>
              </div>
            </div>

            {/* Hero Persona */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="text-7xl mb-4 drop-shadow-2xl"
              >
                {style.emoji}
              </motion.div>

              <h1 className={`text-4xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-br ${style.gradient} mb-3`}>
                {style.title}
              </h1>

              <p className="text-white/60 text-sm leading-relaxed px-2 font-medium">
                {style.message}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                <span className="text-[10px] uppercase text-white/30 font-bold mb-1">Momentum</span>
                <span className="text-2xl font-bold text-white">{weeklyMomentumScore.toFixed(1)}</span>
              </div>
              <div className="bg-white/5 rounded-2xl p-4 border border-white/5 flex flex-col items-center">
                <span className="text-[10px] uppercase text-white/30 font-bold mb-1">Completions</span>
                <span className="text-2xl font-bold text-white">{totalCompletions}</span>
              </div>
            </div>

            {/* ACTIONS FOOTER */}
            <div className="mt-auto space-y-3">

              {/* 1. The Optimization Button (TITAN/GHOST Only) */}
              {(persona === 'TITAN' || persona === 'GHOST') && !showSuccess && (
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing || optimizationApplied}
                  className={`
                    w-full py-4 px-4 rounded-2xl flex items-center justify-between group relative overflow-hidden
                    ${optimizationApplied
                      ? 'bg-green-500/10 border-green-500/20'
                      : `bg-gradient-to-r ${style.gradient} shadow-[0_0_20px_rgba(255,255,255,0.1)]`
                    }
                    transition-all duration-300
                  `}
                >
                  {/* Shimmer effect for active button */}
                  {!optimizationApplied && !isOptimizing && (
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  )}

                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${optimizationApplied ? 'bg-green-500/20 text-green-400' : 'bg-black/20 text-black'}
                    `}>
                      {optimizationApplied ? <CheckCircle2 size={20} /> :
                        isOptimizing ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full" /> :
                          style.actionIcon
                      }
                    </div>
                    <div className="text-left">
                      <p className={`text-base font-bold ${optimizationApplied ? 'text-green-400' : 'text-black'}`}>
                        {optimizationApplied ? 'Optimization Applied' : style.actionText}
                      </p>
                      <p className={`text-[10px] uppercase tracking-wider font-bold ${optimizationApplied ? 'text-green-400/60' : 'text-black/60'}`}>
                        {optimizationApplied ? 'Ready for next week' : style.actionDesc}
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* 2. The Seal Button - Hide when optimization is applied or success is shown */}
              {!optimizationApplied && (
                <div className="relative w-full h-16 bg-[#1A1A1A] rounded-2xl overflow-hidden border border-white/5">
                  {/* Hold Progress Fill */}
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: isHolding && !showSuccess ? '100%' : 0 }}
                    transition={{ duration: isHolding ? 1.5 : 0.2, ease: "linear" }}
                    className="absolute inset-0 bg-white/10"
                  />

                  <button
                    onMouseDown={startHold}
                    onMouseUp={stopHold}
                    onMouseLeave={stopHold}
                    onTouchStart={startHold}
                    onTouchEnd={stopHold}
                    onContextMenu={(e) => e.preventDefault()} // Prevent right click on mobile
                    disabled={showSuccess || isOptimizing}
                    className="absolute inset-0 flex items-center justify-center w-full h-full text-white/50 font-bold tracking-widest text-sm uppercase hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {showSuccess ? (
                      <span className="text-green-400 flex items-center gap-2">
                        <CheckCircle2 size={18} /> Week Sealed
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Lock size={14} /> Hold to Seal
                      </span>
                    )}
                  </button>
                </div>
              )}

              {/* Success Message - Show when optimization is applied */}
              {optimizationApplied && showSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full py-4 px-4 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} className="text-green-400" />
                  <span className="text-green-400 font-bold text-sm">Week Sealed - Closing...</span>
                </motion.div>
              )}

            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};