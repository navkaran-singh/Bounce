import React, { useState } from "react";
import { useStore } from "../store";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, CheckCircle2, ChevronLeft, ChevronRight, Lock,
  Sparkles, TrendingUp, Target, Clock, Zap, ArrowUpRight, RefreshCw, Heart, Trophy
} from "lucide-react";
import { getIdentityTypeLabel, getIdentityTypeEmoji } from "../services/identityDetector";
import { getStageLabel, getStageEmoji } from "../services/stageDetector";
import { getSuggestionTitle } from "../services/evolutionEngine";
import { EvolutionOption, EvolutionOptionId } from "../types";
import { ChangeIdentityModal } from "./ChangeIdentityModal";

/* -------------------------------------------------------------------------- */
/*                                SUB COMPONENTS                              */
/* -------------------------------------------------------------------------- */

// Modal Wrapper with Framer Motion
const Modal = ({ children }: { children: React.ReactNode }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050505]/95 backdrop-blur-3xl p-4"
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="relative w-full max-w-sm bg-[#0F0F10] rounded-[32px] border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {children}
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

// Progress Stepper Indicators
const Stepper = ({ step, total, onNext, onBack, onFinish, isLastAction, lastActionLabel }: {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
  onFinish?: () => void;
  isLastAction?: boolean;
  lastActionLabel?: string;
}) => (
  <div className="flex flex-col">
    {/* Dots */}
    <div className="flex items-center justify-center gap-2 pt-6 pb-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((s) => (
        <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s === step ? 'w-8 bg-gradient-to-r from-cyan-500 to-purple-500'
          : s < step ? 'w-3 bg-cyan-500/50' : 'w-3 bg-white/20'
          }`} />
      ))}
    </div>

    {/* Buttons */}
    <div className="p-4 border-t border-white/5 flex items-center justify-between mt-auto">
      {step > 1 ? (
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-white/50 hover:text-white transition px-3 py-2">
          <ChevronLeft className="w-4 h-4" /><span>Back</span>
        </button>
      ) : <div className="w-16" />}

      {step < total ? (
        <button onClick={onNext} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-500 text-sm font-bold text-white shadow-lg shadow-purple-500/20">
          <span>Next</span><ChevronRight className="w-4 h-4" />
        </button>
      ) : isLastAction ? (
        // Render nothing if custom action button is used in parent
        <div className="w-16" />
      ) : (
        <button onClick={onFinish} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-sm font-bold text-white shadow-lg shadow-green-500/20">
          <span>{lastActionLabel || "Finish"}</span><CheckCircle2 className="w-4 h-4" />
        </button>
      )}
    </div>
  </div>
);

// Generic Stat Component
const Stat = ({ label, value }: { label: string; value: string | number }) => (
  <div>
    <span className="text-2xl font-bold text-white">{value}</span>
    <p className="text-[10px] text-white/40 uppercase tracking-wider">{label}</p>
  </div>
);

// Identity Progress Bar
const ProgressBar = ({ percent }: { percent: number }) => (
  <div className="bg-white/5 rounded-2xl p-4 border border-white/5 w-full">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-white/60 font-medium">Identity Evolution</span>
      <span className="text-xs font-bold text-cyan-400">{percent}%</span>
    </div>
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
      />
    </div>
  </div>
);

// Identity Type Card - Now shows personalized archetype
const IdentityTypeCard = ({ type, archetype }: { type: string | null | undefined, archetype?: string | null }) => {
  if (!type) return null;
  const colors = {
    SKILL: { bg: 'from-blue-500 to-purple-600', fallback: 'Skill Identity' },
    CHARACTER: { bg: 'from-teal-400 to-emerald-600', fallback: 'Character Identity' },
    RECOVERY: { bg: 'from-orange-400 to-red-500', fallback: 'Recovery Journey' }
  }[type] || { bg: 'from-gray-500 to-gray-600', fallback: 'Identity' };

  // Use AI-generated archetype or fallback to generic
  const displayArchetype = archetype || colors.fallback;

  return (
    <div className={`rounded-2xl p-4 bg-gradient-to-br ${colors.bg} bg-opacity-10 border border-white/10 w-full`}>
      <div className="flex items-center gap-3">
        <span className="text-3xl">{getIdentityTypeEmoji(type as any)}</span>
        <div>
          <p className="text-[10px] text-white/60 uppercase font-bold">Archetype</p>
          <p className="text-base font-bold text-white tracking-wide">{displayArchetype}</p>
        </div>
      </div>
    </div>
  );
};

// Stage Card
const StageCard = ({ stage, weeks }: { stage: string | null | undefined, weeks: number }) => {
  if (!stage) return null;
  const label = getStageLabel(stage as any);
  const emoji = getStageEmoji(stage as any);

  return (
    <div className="rounded-2xl p-4 bg-white/5 border border-white/10 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{emoji}</span>
          <div>
            <p className="text-[10px] text-white/50 uppercase font-bold">Current Stage</p>
            <p className="text-base font-bold text-white tracking-wide">{label}</p>
          </div>
        </div>
        <div className="text-right bg-white/5 px-2 py-1 rounded-lg">
          <div className="flex items-center gap-1 text-white/60">
            <Clock className="w-3 h-3" />
            <span className="text-xs font-medium">{weeks} weeks</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// AI Reflection Bubble
const AIReflection = ({ text }: { text: string }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-b from-white/10 to-white/5 rounded-2xl p-4 border border-white/10 w-full relative overflow-hidden">
    <div className="absolute top-0 right-0 p-2 opacity-10">
      <Sparkles className="w-8 h-8 text-white" />
    </div>
    <div className="flex items-center gap-2 mb-2">
      <Sparkles className="w-3 h-3 text-cyan-400" />
      <span className="text-[10px] text-cyan-400 uppercase font-bold tracking-wider">Bounce Insight</span>
    </div>
    <p className="text-sm text-white/80 leading-relaxed italic border-l-2 border-cyan-500/30 pl-3">
      "{text}"
    </p>
  </motion.div>
);

// Suggestion Card
// Persona Header based on performance
const PersonaHeader = ({ persona }: { persona: string }) => {
  const personaConfig = {
    TITAN: { emoji: '🏆', label: 'Crushing It', color: 'from-yellow-400 to-amber-500' },
    GRINDER: { emoji: '💪', label: 'Steady Progress', color: 'from-blue-400 to-cyan-500' },
    SURVIVOR: { emoji: '🌱', label: 'Hanging On', color: 'from-green-400 to-emerald-500' },
    GHOST: { emoji: '👻', label: 'Recovery Mode', color: 'from-purple-400 to-pink-500' }
  }[persona] || { emoji: '🎯', label: 'Your Week', color: 'from-gray-400 to-gray-500' };

  return (
    <div className={`bg-gradient-to-r ${personaConfig.color} rounded-2xl p-4 text-center`}>
      <span className="text-3xl">{personaConfig.emoji}</span>
      <p className="text-white font-bold mt-1">{personaConfig.label}</p>
    </div>
  );
};

// Evolution Options Card - Shows ALL persona-aware options
const EvolutionOptionsCard = ({
  options,
  onSelect,
  selectedId,
  isApplying = false
}: {
  options: EvolutionOption[],
  onSelect: (option: EvolutionOption) => void,
  selectedId?: EvolutionOptionId | null,
  isApplying?: boolean
}) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-4 border border-cyan-500/20 w-full">
      <div className="flex items-center gap-2 mb-3">
        <Target className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">Choose Your Path</span>
      </div>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            disabled={isApplying}
            className={`w-full text-left py-3 px-4 rounded-xl border transition-all ${selectedId === option.id
              ? 'bg-cyan-500/20 border-cyan-400/50 ring-1 ring-cyan-400/30'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              } ${isApplying ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{option.label}</span>
              {option.impact.difficultyAdjustment !== undefined && option.impact.difficultyAdjustment !== 0 && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${option.impact.difficultyAdjustment > 0
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-orange-500/20 text-orange-400'
                  }`}>
                  {option.impact.difficultyAdjustment > 0 ? '↑ Harder' : '↓ Easier'}
                </span>
              )}
            </div>
            <p className="text-xs text-white/50 mt-1">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// GHOST Recovery Card - Special compassionate section
const GhostRecoveryCard = ({
  options,
  onSelect,
  selectedId,
  isApplying = false
}: {
  options: EvolutionOption[],
  onSelect: (option: EvolutionOption) => void,
  selectedId?: EvolutionOptionId | null,
  isApplying?: boolean
}) => {
  if (!options || options.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20 w-full">
      <div className="flex items-center gap-2 mb-2">
        <Heart className="w-4 h-4 text-purple-400" />
        <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">Recovery Options</span>
      </div>
      <p className="text-xs text-white/50 mb-3">
        It's okay. Sometimes we need to reset. Choose what feels right:
      </p>
      <div className="space-y-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            disabled={isApplying}
            className={`w-full text-left py-3 px-4 rounded-xl border transition-all ${selectedId === option.id
              ? 'bg-purple-500/20 border-purple-400/50 ring-1 ring-purple-400/30'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              } ${isApplying ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-sm font-bold text-white">{option.label}</span>
            <p className="text-xs text-white/50 mt-1">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

// 🏆 Maintenance Completion Card - For users who have embodied their identity
type MaintenancePath = 'DEEPEN' | 'EVOLVE' | 'START_NEW' | null;

const MaintenanceCompletionCard = ({
  advancedIdentity,
  identity,
  selectedPath,
  onSelectPath,
  customIdentity,
  onCustomIdentityChange,
  showCustomInput,
  onToggleCustomInput,
  isDisabled = false
}: {
  advancedIdentity: string | null;
  identity: string;
  selectedPath: MaintenancePath;
  onSelectPath: (path: MaintenancePath) => void;
  customIdentity: string;
  onCustomIdentityChange: (value: string) => void;
  showCustomInput: boolean;
  onToggleCustomInput: (show: boolean) => void;
  isDisabled?: boolean;
}) => {
  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl p-4 border border-amber-500/20 w-full">
      {/* Celebration Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30 animate-pulse">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-amber-300">🏆 You've Embodied This Identity!</p>
          <p className="text-xs text-white/60">"{identity}" is now part of who you are</p>
        </div>
      </div>

      <p className="text-xs text-white/60 mb-4">What's next on your journey?</p>

      {/* Three Paths */}
      <div className="space-y-2 relative z-10">
        {/* PATH 1: Deepen It */}
        <button
          onClick={() => onSelectPath('DEEPEN')}
          disabled={isDisabled}
          className={`w-full text-left py-3 px-4 rounded-xl border transition-all ${selectedPath === 'DEEPEN'
            ? 'bg-emerald-500/20 border-emerald-400/50 ring-1 ring-emerald-400/30'
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Deepen It</span>
          </div>
          <p className="text-xs text-white/50 mt-1 ml-6">Master this identity further</p>
        </button>

        {/* PATH 2: Evolve It */}
        <button
          onClick={() => onSelectPath('EVOLVE')}
          disabled={isDisabled}
          className={`w-full text-left py-3 px-4 rounded-xl border transition-all ${selectedPath === 'EVOLVE'
            ? 'bg-purple-500/20 border-purple-400/50 ring-1 ring-purple-400/30'
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-white">Evolve It</span>
          </div>
          <p className="text-xs text-white/50 mt-1 ml-6">Level up to an advanced identity</p>
        </button>

        {/* Evolve Options (show when EVOLVE is selected) */}
        {selectedPath === 'EVOLVE' && (
          <div className="ml-6 space-y-2">
            {advancedIdentity && !showCustomInput && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-xs text-white/50 mb-1">Suggested:</p>
                <p className="text-sm font-medium text-purple-300">"{advancedIdentity}"</p>
              </div>
            )}
            {showCustomInput ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={customIdentity}
                  onChange={(e) => onCustomIdentityChange(e.target.value)}
                  placeholder="e.g., A marathon runner"
                  className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-white/20 text-white text-sm placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                  autoFocus
                />
                <button
                  onClick={() => onToggleCustomInput(false)}
                  className="text-xs text-white/40 hover:text-white/60"
                >
                  ← Use suggestion instead
                </button>
              </div>
            ) : (
              <button
                onClick={() => onToggleCustomInput(true)}
                className="text-xs text-purple-400 hover:text-purple-300"
              >
                Write my own identity →
              </button>
            )}
          </div>
        )}

        {/* PATH 3: Start Something New */}
        <button
          onClick={() => onSelectPath('START_NEW')}
          disabled={isDisabled}
          className={`w-full text-left py-3 px-4 rounded-xl border transition-all ${selectedPath === 'START_NEW'
            ? 'bg-blue-500/20 border-blue-400/50 ring-1 ring-blue-400/30'
            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
            } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-white">Start Something New</span>
          </div>
          <p className="text-xs text-white/50 mt-1 ml-6">Begin a fresh identity journey</p>
        </button>
      </div>
    </div>
  );
};

const SuggestionCard = ({ suggestion }: { suggestion: any }) => {
  if (!suggestion) return null;
  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 rounded-2xl p-4 border border-cyan-500/20 w-full">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-cyan-400" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">{getSuggestionTitle(suggestion.type)}</span>
      </div>
      <p className="text-sm text-white/70 leading-relaxed">{suggestion.message}</p>
    </div>
  );
};

// Legacy Branching Options (keeping for backwards compatibility)
const BranchingOptions = ({ options }: { options: string[] }) => (
  <div className="bg-purple-500/10 rounded-2xl p-4 border border-purple-500/20 w-full">
    <div className="flex items-center gap-2 mb-3">
      <ArrowUpRight className="w-4 h-4 text-purple-400" />
      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">New Paths Available</span>
    </div>
    <div className="space-y-2">
      {options.map((option, i) => (
        <button key={i} className="w-full text-left text-xs py-2.5 px-3 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition flex items-center gap-2 group">
          <div className="w-1.5 h-1.5 rounded-full bg-purple-500/50 group-hover:bg-purple-400" />
          {option}
        </button>
      ))}
    </div>
  </div>
);

// Weekly Plan Preview (Premium)
const WeeklyPlanPreview = ({ plan, onApply }: { plan: any, onApply: () => Promise<any> }) => {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = async () => {
    setApplying(true);
    const result = await onApply();
    setApplying(false);
    if (result.success) setApplied(true);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 w-full">
      <div className="bg-white/5 rounded-2xl p-4 border border-green-500/30 w-full">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span className="text-xs font-bold text-green-400 uppercase tracking-wider">AI Plan Generated</span>
        </div>
        <p className="text-xs text-white/60 mb-3 leading-relaxed">{plan.narrative}</p>

        {plan.habitAdjustments && plan.habitAdjustments.length > 0 && (
          <div className="space-y-1.5 mb-3 bg-black/20 p-3 rounded-lg">
            {plan.habitAdjustments.map((adj: string, i: number) => (
              <p key={i} className="text-xs text-cyan-300/90 flex items-start gap-1.5">
                <span className="mt-1 block w-1 h-1 rounded-full bg-cyan-400" />
                {adj}
              </p>
            ))}
          </div>
        )}

        {plan.stageAdvice && (
          <p className="text-[10px] text-amber-400/80 italic text-center pt-2 border-t border-white/5">
            "{plan.stageAdvice}"
          </p>
        )}
      </div>

      {!applied ? (
        <button
          onClick={handleApply}
          disabled={applying}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center gap-2 font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition hover:scale-[1.02] active:scale-[0.98]"
        >
          {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /><span>Apply Evolution Plan</span></>}
        </button>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 text-green-400 bg-green-500/10 rounded-2xl border border-green-500/20">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-bold text-sm">Plan Applied Successfully</span>
        </div>
      )}
    </motion.div>
  );
};

// Loading State
const LoadingCard = ({ label }: { label: string }) => (
  <div className="w-full py-8 flex flex-col items-center justify-center gap-3 text-white/40 bg-white/5 rounded-2xl border border-white/5 dashed-border">
    <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
    <span className="text-xs font-medium animate-pulse">{label}</span>
  </div>
);

// 🔒 FREE USER PREVIEW CARD - Shows what premium would do (no actual changes)
const FreeUserPreviewCard = ({
  previewText,
  optionLabel
}: {
  previewText: string;
  optionLabel: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20 w-full"
  >
    {/* Preview Title */}
    <div className="flex items-center gap-2 mb-3">
      <Sparkles className="w-4 h-4 text-purple-400" />
      <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">What This Would Do</span>
    </div>

    {/* Preview Description */}
    <p className="text-sm text-white/70 leading-relaxed mb-4 border-l-2 border-purple-500/30 pl-3">
      {previewText}
    </p>

    {/* Premium Notice */}
    <div className="bg-white/5 rounded-xl p-3 mb-4">
      <p className="text-xs text-white/50 text-center">
        Upgrade to Premium to activate weekly coaching, automatic habit adjustments, and AI-based evolution.
      </p>
    </div>

    {/* Upgrade CTA Button */}
    <button
      className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition flex items-center justify-center gap-2"
      onClick={() => {
        // TODO: Open upgrade modal or navigate to upgrade page
        console.log("🔒 [UPGRADE] User clicked upgrade CTA");
      }}
    >
      <Lock className="w-4 h-4" />
      <span>Unlock Premium Coaching</span>
    </button>
  </motion.div>
);

/* -------------------------------------------------------------------------- */
/*                            MAIN COMPONENT                                  */
/* -------------------------------------------------------------------------- */

export const WeeklyReviewModal: React.FC = () => {
  // Use individual selectors to avoid creating new object on every render
  const weeklyReview = useStore(state => state.weeklyReview);
  const isPremium = useStore(state => state.isPremium);
  const applyEvolutionPlan = useStore(state => state.applyEvolutionPlan);
  const applySelectedEvolutionOption = useStore(state => state.applySelectedEvolutionOption);
  const completeWeeklyReview = useStore(state => state.completeWeeklyReview);
  const identity = useStore(state => state.identity);

  // 🏆 Maintenance Completion handlers
  const handleDeepenIdentity = useStore(state => state.handleDeepenIdentity);
  const handleEvolveIdentity = useStore(state => state.handleEvolveIdentity);
  const handleStartNewIdentity = useStore(state => state.handleStartNewIdentity);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedOption, setSelectedOption] = useState<EvolutionOption | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [manualMode, setManualMode] = useState(false); // 🔧 Free user chose "I'll do it manually"
  const [isChangeIdentityOpen, setIsChangeIdentityOpen] = useState(false); // 🔄 Change Identity modal
  const [planState, setPlanState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle'); // 🚀 Premium plan generation state

  // 🏆 Maintenance Completion state
  const [selectedMaintenancePath, setSelectedMaintenancePath] = useState<MaintenancePath>(null);
  const [customIdentity, setCustomIdentity] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Handler: Free user chooses to skip evolution and keep habits as-is
  const handleManualMode = () => {
    console.log("🔧 [FREE USER] Manual mode selected - habits will stay unchanged");
    setSelectedOption(null);
    setManualMode(true);
  };

  // Read directly from cached data (AI calls happen in store.ts during checkWeeklyReview)
  const reflection = weeklyReview?.cachedIdentityReflection ?? null;
  const plan = weeklyReview?.cachedWeeklyPlan ?? null;
  const evolutionOptions = weeklyReview?.evolutionOptions ?? [];
  const isGhostRecovery = weeklyReview?.isGhostRecovery ?? false;
  const advancedIdentity = weeklyReview?.advancedIdentity ?? null;

  // 🏆 Detect if user has completed MAINTENANCE (6+ weeks)
  const isMaintenanceComplete =
    weeklyReview?.identityStage === 'MAINTENANCE' &&
    (weeklyReview?.weeksInStage ?? 0) >= 6;

  // Helper: Get preview text for free users (explains what WOULD happen with premium)
  const getFreeUserEvolutionPreview = (optionId: EvolutionOptionId): string => {
    const previews: Record<string, string> = {
      'INCREASE_DIFFICULTY': "Your coach would increase difficulty and shift your habits up one level, making them more challenging.",
      'ADD_VARIATION': "Your coach would add new habit variations to keep things fresh while maintaining your current intensity.",
      'BRANCH_IDENTITY': "Your coach would help you explore a new branch of your identity and expand your growth path.",
      'START_MASTERY_WEEK': "Your coach would activate mastery mode, fine-tuning your habits for peak performance.",
      'MAINTAIN': "Your coach would keep your current habits stable while monitoring your progress for opportunities.",
      'SOFTER_HABIT': "Your coach would soften your high-energy habits, reduce weekly load, and adjust your difficulty curve.",
      'TECHNIQUE_WEEK': "Your coach would focus on habit quality over quantity, helping you refine your existing routines.",
      'REDUCE_SCOPE': "Your coach would simplify your habits, keeping only the most impactful ones.",
      'REST_WEEK': "Your coach would reduce your workload by 30% and give you a recovery-focused week.",
      'REDUCE_DIFFICULTY': "Your coach would switch you to low-energy habits this week and prioritize recovery.",
      'FRICTION_REMOVAL': "Your coach would switch you to minimal-effort habits this week and prioritize recovery.",
      'STABILIZATION_WEEK': "Your coach would stabilize your current habits, preventing burnout while maintaining momentum.",
      'FRESH_START_WEEK': "Your coach would reset you to Initiation habits and restart your identity momentum.",
      'FRESH_START': "Your coach would reset you to Initiation habits and restart your identity momentum.",
      'CHANGE_IDENTITY': "Your coach would guide you through a complete identity transition to a new goal.",
      'SOFTER_WEEK': "Your coach would give you ultra-gentle habits this week. Just exist, no pressure."
    };
    return previews[optionId] || "Your coach would customize your habits based on your performance and goals.";
  };

  // Handler for selecting an evolution option (NO AI CALL - just selection)
  const handleOptionSelect = (option: EvolutionOption) => {
    // Don't allow changes if already generating/applied
    if (planState === 'generating' || planState === 'success') return;

    setSelectedOption(option);
    console.log("🎯 [EVOLUTION] Option selected:", option.id);
    // NO AI CALL HERE - AI is called only when Apply is clicked
  };

  // Handler for applying evolution (TRIGGERS AI CALL)
  const handleApplyEvolution = async () => {
    if (!selectedOption) return;

    // 🔒 FREE USERS: Preview only, no actual changes
    if (!isPremium) {
      console.log("🔒 [FREE USER] Preview mode - no evolution applied");
      return;
    }

    // ✅ PREMIUM USERS: Now trigger AI
    setPlanState('generating');
    console.log("🚀 [PREMIUM] Generating evolution plan for:", selectedOption.id);

    try {
      const result = await applySelectedEvolutionOption(selectedOption);
      if (result?.identityChange) {
        return; // Exit early, UI will navigate away
      }
      setPlanState('success');
      console.log("✅ [PREMIUM] Evolution plan generated successfully");
    } catch (error) {
      console.error("Failed to apply evolution option:", error);
      setPlanState('error');
    }
  };

  // 🏆 Handler for applying maintenance completion path (WITH AI CALL)
  const handleApplyMaintenancePath = async () => {
    if (!selectedMaintenancePath) return;

    console.log("🏆 [MAINTENANCE] Applying path:", selectedMaintenancePath);

    // START_NEW doesn't need AI - just goes to onboarding
    if (selectedMaintenancePath === 'START_NEW') {
      handleStartNewIdentity();
      return;
    }

    // DEEPEN and EVOLVE need AI generation
    if (!isPremium) {
      console.log("🔒 [FREE USER] Maintenance completion requires premium");
      return;
    }

    setPlanState('generating');

    try {
      if (selectedMaintenancePath === 'DEEPEN') {
        // Deepen: Same identity, evolved habits using existing AI flow
        const deepenOption: EvolutionOption = {
          id: 'INCREASE_DIFFICULTY',
          label: 'Deepen Mastery',
          description: 'Continue mastering this identity with evolved habits',
          impact: { difficultyAdjustment: 1 }
        };

        const result = await applySelectedEvolutionOption(deepenOption);
        if (result?.success) {
          // Reset the maintenance cycle AFTER AI completes
          handleDeepenIdentity();
          setPlanState('success');
          console.log("✅ [MAINTENANCE] Deepen path applied with AI evolution");
        } else {
          setPlanState('error');
        }
      } else if (selectedMaintenancePath === 'EVOLVE') {
        // Evolve: New identity - need to generate fresh habits
        const newIdentity = showCustomInput && customIdentity.trim()
          ? customIdentity.trim()
          : advancedIdentity;

        if (newIdentity) {
          console.log("🏆 [MAINTENANCE] Evolving to new identity:", newIdentity);

          // Call AI to generate habits for the NEW identity
          const { generateHabits } = await import('../services/ai');
          const result = await generateHabits(newIdentity);

          if (result.high.length > 0) {
            // Update identity and habits in store
            handleEvolveIdentity(newIdentity);

            // Apply the new habits
            useStore.setState({
              habitRepository: {
                high: result.high,
                medium: result.medium,
                low: result.low
              },
              microHabits: result.medium, // Default to medium energy
              currentHabitIndex: 0,
              identityProfile: {
                ...useStore.getState().identityProfile,
                type: result.identityType || null
              }
            });

            setPlanState('success');
            console.log("✅ [MAINTENANCE] Evolve path applied with new habits:", result);
          } else {
            setPlanState('error');
          }
        }
      }
    } catch (error) {
      console.error("❌ [MAINTENANCE] Failed to apply path:", error);
      setPlanState('error');
    }
  };

  // Guard: No review available
  if (!weeklyReview?.available) return null;




  const handleStep3Finish = () => {
    // If premium, we only close if applied, or if user explicitly wants to "Seal Week" without applying?
    // User snippet implies manual finish.
    // I'll show success animation then close.
    completeWeeklyReview();
  };

  function Step1() {
    // Determine Persona Styling
    let title = "The Explorer";
    let emoji = "🧭";
    let gradient = "from-gray-400 to-gray-600";

    switch (weeklyReview?.persona) {
      case 'TITAN': title = "THE TITAN"; emoji = "🏆"; gradient = "from-amber-300 via-yellow-500 to-amber-600"; break;
      case 'GRINDER': title = "THE GRINDER"; emoji = "💪"; gradient = "from-emerald-400 to-teal-600"; break;
      case 'SURVIVOR': title = "THE SURVIVOR"; emoji = "🛡️"; gradient = "from-blue-400 to-indigo-600"; break;
      case 'GHOST': title = "THE REBUILD"; emoji = "👻"; gradient = "from-purple-400 to-indigo-900"; break;
    }

    return (
      <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="text-center space-y-2">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Weekly Checkpoint</p>
          <div className="text-6xl animate-bounce-slow">{emoji}</div>
          <h1 className={`text-2xl font-black italic tracking-tight bg-clip-text text-transparent bg-gradient-to-br ${gradient}`}>
            {title}
          </h1>
        </div>

        <div className="flex items-center justify-center gap-6 text-center bg-white/5 rounded-2xl p-4 border border-white/5">
          <Stat label="Momentum" value={weeklyReview?.weeklyMomentumScore?.toFixed(0) || 0} />
          <div className="w-px h-8 bg-white/10" />
          <Stat label="Completions" value={weeklyReview?.totalCompletions || 0} />
          <div className="w-px h-8 bg-white/10" />
          <Stat label="Streak" value={useStore.getState().streak} />
        </div>

        <ProgressBar percent={weeklyReview?.progressionPercent ?? 0} />

        <p className="text-center text-xs text-white/50 italic px-4 leading-relaxed">
          "{weeklyReview?.stageReason || "Strong week of identity progression."}"
        </p>
      </div>
    );
  }

  function Step2() {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold text-white">Where You Are Now</h2>
          <p className="text-xs text-white/40">Identity Tracker</p>
        </div>

        <IdentityTypeCard type={weeklyReview?.identityType} archetype={weeklyReview?.cachedArchetype} />

        <StageCard
          stage={weeklyReview?.identityStage}
          weeks={weeklyReview?.weeksInStage || 0}
        />

        <ProgressBar percent={weeklyReview?.progressionPercent ?? 0} />

        {reflection && (
          <AIReflection text={reflection} />
        )}
      </div>
    );
  }

  function Step3() {
    return (
      <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold text-white">Next Week’s Direction</h2>
          <p className="text-xs text-white/40">Choose your evolution path</p>
        </div>

        {/* 🏆 MAINTENANCE COMPLETE: Show celebration card with 3 paths */}
        {isMaintenanceComplete ? (
          <>
            <MaintenanceCompletionCard
              advancedIdentity={advancedIdentity}
              identity={identity}
              selectedPath={selectedMaintenancePath}
              onSelectPath={setSelectedMaintenancePath}
              customIdentity={customIdentity}
              onCustomIdentityChange={setCustomIdentity}
              showCustomInput={showCustomInput}
              onToggleCustomInput={setShowCustomInput}
              isDisabled={planState === 'generating' || planState === 'success'}
            />

            {/* Apply Maintenance Path Button - with loading/success states */}
            {selectedMaintenancePath && planState === 'idle' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <button
                  onClick={handleApplyMaintenancePath}
                  disabled={selectedMaintenancePath === 'EVOLVE' && showCustomInput && !customIdentity.trim()}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="w-5 h-5" />
                  <span>
                    {selectedMaintenancePath === 'DEEPEN' && 'Deepen This Identity'}
                    {selectedMaintenancePath === 'EVOLVE' && 'Evolve to New Identity'}
                    {selectedMaintenancePath === 'START_NEW' && 'Start Fresh Journey'}
                  </span>
                </button>
              </motion.div>
            )}

            {/* Loading State */}
            {planState === 'generating' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-500/10 rounded-2xl p-6 border border-amber-500/20 text-center"
              >
                <Loader2 className="w-8 h-8 animate-spin text-amber-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-white/80">Generating your evolution plan...</p>
                <p className="text-xs text-white/40 mt-1">AI is crafting personalized habits</p>
              </motion.div>
            )}

            {/* Success State */}
            {planState === 'success' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 rounded-2xl p-6 border border-green-500/30 text-center"
              >
                <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-sm font-bold text-green-400">Plan Generated Successfully!</p>
                <p className="text-xs text-white/50 mt-1">Your new habits are ready for this week</p>
                <button
                  onClick={completeWeeklyReview}
                  className="mt-4 w-full py-3 rounded-xl bg-green-500/20 text-green-400 font-bold text-sm hover:bg-green-500/30 transition"
                >
                  Close & Start Week
                </button>
              </motion.div>
            )}
          </>
        ) : (
          /* Normal users: Standard evolution flow */
          <>
            {/* GHOST users get special recovery UI */}
            {isGhostRecovery ? (
              <GhostRecoveryCard
                options={evolutionOptions}
                onSelect={handleOptionSelect}
                selectedId={selectedOption?.id}
                isApplying={isApplying}
              />
            ) : (
              /* Other personas get standard evolution options */
              <>
                <EvolutionOptionsCard
                  options={evolutionOptions}
                  onSelect={handleOptionSelect}
                  selectedId={selectedOption?.id}
                  isApplying={isApplying}
                />

                {/* 🔄 Identity Options Section - Only for non-GHOST personas */}
                <div className="bg-white/5 rounded-2xl p-4 border border-white/10 w-full">
                  <p className="text-xs text-white/40 mb-3">Thinking of shifting direction?</p>
                  <button
                    onClick={() => setIsChangeIdentityOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span className="text-sm font-medium">Change Identity</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* 🚀 PREMIUM: Apply Evolution Button and States (NOT for maintenance-complete users) */}
        {isPremium && selectedOption && planState === 'idle' && !isMaintenanceComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Selected option confirmation */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
              <p className="text-xs text-green-400">
                ✓ Selected: <span className="font-bold">{selectedOption.label}</span>
              </p>
            </div>

            {/* Apply Evolution Button */}
            <button
              onClick={handleApplyEvolution}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm shadow-lg shadow-green-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              <span>Apply Evolution Plan</span>
            </button>
          </motion.div>
        )}

        {/* 🚀 PREMIUM: Loading State (NOT for maintenance-complete users) */}
        {isPremium && planState === 'generating' && !isMaintenanceComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center"
          >
            <Loader2 className="w-8 h-8 animate-spin text-green-400 mx-auto mb-3" />
            <p className="text-sm font-medium text-white/80">Generating your evolution plan...</p>
            <p className="text-xs text-white/40 mt-1">AI is crafting personalized habits for you</p>
          </motion.div>
        )}

        {/* 🚀 PREMIUM: Success State (NOT for maintenance-complete users) */}
        {isPremium && planState === 'success' && !isMaintenanceComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-500/10 rounded-2xl p-6 border border-green-500/30 text-center"
          >
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-lg font-bold text-green-400">Plan Generated Successfully!</p>
            <p className="text-xs text-white/50 mt-2">Your habits have been evolved. Seal the week to apply.</p>
          </motion.div>
        )}

        {/* 🚀 PREMIUM: Error State (NOT for maintenance-complete users) */}
        {isPremium && planState === 'error' && !isMaintenanceComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-500/10 rounded-2xl p-4 border border-red-500/30 text-center"
          >
            <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
            <button
              onClick={() => setPlanState('idle')}
              className="mt-3 px-4 py-2 rounded-xl bg-white/10 text-white/70 text-xs hover:bg-white/20 transition"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {/* 🔒 FREE USERS: Show preview card instead of actual plan (only if NOT in manual mode) */}
        {!isPremium && selectedOption && !manualMode && (
          <FreeUserPreviewCard
            previewText={getFreeUserEvolutionPreview(selectedOption.id)}
            optionLabel={selectedOption.label}
          />
        )}

        {/* 🔧 FREE USERS: "I'll do it manually" button (show when option selected, not in manual mode) */}
        {!isPremium && selectedOption && !manualMode && (
          <button
            onClick={handleManualMode}
            className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-medium hover:bg-white/10 hover:text-white/80 transition"
          >
            No, I'll do it manually
          </button>
        )}

        {/* 🔧 FREE USERS: Reassurance microcopy (show when in manual mode) */}
        {!isPremium && manualMode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-xl p-4 text-center border border-white/10"
          >
            <p className="text-sm text-white/70 mb-1">
              ✓ Your habits will stay exactly as they are.
            </p>
            <p className="text-xs text-white/40">
              You can adjust them anytime from your dashboard.
            </p>
          </motion.div>
        )}
      </div>
    );
  }

  const steps: Record<number, React.ReactNode> = {
    1: <Step1 />,
    2: <Step2 />,
    3: <Step3 />,
  };

  return (
    <Modal>
      <div className="flex-1 overflow-y-auto px-5 py-6 no-scrollbar min-h-[400px]">
        {steps[currentStep]}
      </div>

      <Stepper
        step={currentStep}
        total={3}
        onNext={() => setCurrentStep((s) => Math.min(3, s + 1))}
        onBack={() => setCurrentStep((s) => Math.max(1, s - 1))}
        onFinish={completeWeeklyReview}
        isLastAction={currentStep === 3 && isPremium && !weeklyReview?.cachedWeeklyPlan} // Hide finish button if loading
        lastActionLabel="Seal Week"
      />

      {/* Change Identity Confirmation Modal */}
      <ChangeIdentityModal
        isOpen={isChangeIdentityOpen}
        onClose={() => setIsChangeIdentityOpen(false)}
      />
    </Modal>
  );
};

export default WeeklyReviewModal;
