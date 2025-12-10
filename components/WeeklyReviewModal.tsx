import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, Calendar, Award, ArrowUpRight, RefreshCw, CheckCircle2, Lock, Sparkles, ArrowRight, ChevronRight, Zap } from 'lucide-react';
import { useStore } from '../store';
import { WeeklyPersona, IdentityType, IdentityStage } from '../types';
import { getStageLabel, getStageEmoji } from '../services/stageDetector';
import { getSuggestionTitle } from '../services/evolutionEngine';
import { getIdentityTypeLabel, getIdentityTypeEmoji } from '../services/identityDetector';

export const WeeklyReviewModal: React.FC = () => {
  const { weeklyReview, completeWeeklyReview, optimizeWeeklyRoutine, isPremium, streak, identityProfile, applyEvolutionPlan } = useStore();
  const [isHolding, setIsHolding] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationApplied, setOptimizationApplied] = useState(false);
  const [isEvolutionApplying, setIsEvolutionApplying] = useState(false);
  const [evolutionApplied, setEvolutionApplied] = useState(false);
  const [evolutionNarrative, setEvolutionNarrative] = useState<string | null>(null);
  const intervalRef = useRef<any>(null);


  if (!weeklyReview?.available) return null;

  const { persona, weeklyMomentumScore, totalCompletions, missedHabits, startDate, endDate, identityType, identityStage, evolutionSuggestion, stageReason } = weeklyReview;

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

  const handleApplyEvolution = async () => {
    if (!isPremium || evolutionApplied || isEvolutionApplying) return;

    setIsEvolutionApplying(true);
    const result = await applyEvolutionPlan();
    setIsEvolutionApplying(false);

    if (result.success) {
      setEvolutionApplied(true);
      setEvolutionNarrative(result.narrative);

      // Auto-close after showing success for 2.5 seconds
      setTimeout(() => {
        setShowSuccess(true);
        setTimeout(() => completeWeeklyReview(), 1500);
      }, 2000);
    }
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

              {/* Persona Message - Premium sees full, Free sees first words + blur */}
              {isPremium ? (
                <p className="text-white/60 text-sm leading-relaxed px-2 font-medium">
                  {style.message}
                </p>
              ) : (
                <div className="relative px-2">
                  <p className="text-white/60 text-sm leading-relaxed font-medium">
                    {/* Show first 3 words clear, blur the rest */}
                    {style.message.split(' ').slice(0, 3).join(' ')}{' '}
                    <span className="blur-[4px] select-none">
                      {style.message.split(' ').slice(3).join(' ')}
                    </span>
                  </p>
                  <p className="text-purple-300/80 text-xs mt-2 italic">
                    ✨ Unlock deeper self-insights with Premium
                  </p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-8">
              {/* Momentum - Visible to all */}
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                <span className="text-[10px] uppercase text-white/30 font-bold mb-1">Momentum</span>
                <span className="text-xl font-bold text-white">{weeklyMomentumScore.toFixed(1)}</span>
              </div>

              {/* Completions - Visible to all */}
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                <span className="text-[10px] uppercase text-white/30 font-bold mb-1">Completions</span>
                <span className="text-xl font-bold text-white">{totalCompletions}</span>
              </div>

              {/* Streak - Visible to all */}
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 flex flex-col items-center">
                <span className="text-[10px] uppercase text-white/30 font-bold mb-1">Streak</span>
                <span className="text-xl font-bold text-white">{streak}</span>
              </div>
            </div>

            {/* PATTERN ANALYSIS SECTION */}
            {isPremium ? (
              <div className="mb-6 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-4 border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Pattern Analysis</span>
                </div>

                {/* Top Missed Habits */}
                {Object.keys(missedHabits || {}).length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] text-white/40 uppercase mb-1">Most Skipped</p>
                    <div className="space-y-1">
                      {Object.entries(missedHabits || {}).slice(0, 2).map(([habit, count]) => (
                        <div key={habit} className="flex items-center justify-between text-xs">
                          <span className="text-white/70 truncate max-w-[180px]">{habit}</span>
                          <span className="text-orange-400 font-medium">{count}x missed</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Weekly Insight */}
                <div className="pt-2 border-t border-white/5">
                  <p className="text-xs text-white/60 leading-relaxed">
                    {weeklyMomentumScore >= 18
                      ? "🔥 Exceptional week! Your momentum is at peak performance."
                      : weeklyMomentumScore >= 12
                        ? "💪 Strong consistency this week. Keep the rhythm going."
                        : weeklyMomentumScore >= 6
                          ? "🌱 You showed up when it mattered. Build on these small wins."
                          : "💙 Tough week. Focus on just one habit tomorrow to rebuild."
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-4 border border-purple-500/20">
                <div className="text-center">
                  <p className="text-white/60 text-xs mb-2">
                    "We noticed you struggle on <span className="text-white/80">Tuesday evenings</span>..."
                  </p>
                  <p className="text-purple-300 text-xs font-medium">
                    🔮 Full pattern analysis with Premium
                  </p>
                </div>
              </div>
            )}


            {/* IDENTITY EVOLUTION SECTION (if identityType exists) */}
            {identityType && identityStage && (
              <div className="mb-6">
                {/* Stage Badge */}
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2">
                    <span className="text-base">{getIdentityTypeEmoji(identityType)}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-bold">{identityType}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-white/20" />
                  <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 flex items-center gap-2">
                    <span className="text-base">{getStageEmoji(identityStage)}</span>
                    <span className="text-[10px] uppercase tracking-wider text-cyan-300 font-bold">{getStageLabel(identityStage)}</span>
                  </div>
                </div>

                {/* Stage Reason */}
                {stageReason && (
                  <p className="text-center text-xs text-white/40 mb-4 px-4">
                    {stageReason}
                  </p>
                )}

                {/* Evolution Suggestion */}
                {evolutionSuggestion && (
                  <div className={`rounded-2xl p-4 border ${isPremium
                    ? 'bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/20'
                    : 'bg-white/5 border-white/10'
                    }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                        {evolutionApplied ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-cyan-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-white">{getSuggestionTitle(evolutionSuggestion.type)}</span>
                          {!isPremium && <Lock className="w-3 h-3 text-white/30" />}
                          {evolutionApplied && <span className="text-[10px] text-green-400 font-bold">APPLIED</span>}
                        </div>
                        <p className={`text-xs leading-relaxed ${isPremium ? 'text-white/70' : 'text-white/50'}`}>
                          {evolutionApplied && evolutionNarrative ? evolutionNarrative : evolutionSuggestion.message}
                        </p>

                        {/* Premium Apply Button */}
                        {isPremium && !evolutionApplied && (
                          <button
                            onClick={handleApplyEvolution}
                            disabled={isEvolutionApplying}
                            className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                          >
                            {isEvolutionApplying ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                              />
                            ) : (
                              <>
                                <Zap className="w-4 h-4 text-white" />
                                <span className="text-xs font-bold text-white">Apply Evolution</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Free User Teaser */}
                        {!isPremium && (
                          <p className="text-[10px] text-purple-300 mt-2 italic">
                            ✨ Premium applies this automatically
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}



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
