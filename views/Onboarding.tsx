import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Plus, Info, X, Loader2, ChevronLeft } from 'lucide-react';
import { useStore } from '../store';
import { Message, IdentityType, InitialFamiliarity } from '../types';
import { generateHabits, GenerateHabitsResult } from '../services/ai';
import { getHabitsFromTemplate } from '../services/habitTemplateService';
import { trackFirstAction } from '../services/analytics';

// Familiarity options for v8 behavior-based stage initialization
const FAMILIARITY_OPTIONS: { label: string; value: InitialFamiliarity; emoji: string }[] = [
  { label: "I'm completely new to this.", value: 'NEW', emoji: '🌱' },
  { label: "I've tried it before, but inconsistently.", value: 'INCONSISTENT', emoji: '🔄' },
  { label: "I do this sometimes and understand the basics.", value: 'BASIC', emoji: '📖' },
  { label: "I already do this regularly.", value: 'REGULAR', emoji: '⚡' },
  { label: "This already feels like part of who I am.", value: 'IDENTITY', emoji: '🔥' },
];

// Identity examples with domain mappings for clarification step
const IDENTITY_EXAMPLES: {
  label: string;
  emoji: string;
  needsClarification: boolean;
  domainOptions?: { label: string; identityTemplate: string }[];
}[] = [
    {
      label: "Staying consistent with my health",
      emoji: '🏃',
      needsClarification: false // Direct identity
    },
    {
      label: "Finishing creative projects",
      emoji: '✍️',
      needsClarification: true,
      domainOptions: [
        { label: "Writing", identityTemplate: "A writer who finishes what they start" },
        { label: "Art / Design", identityTemplate: "A creator who finishes what they start" },
        { label: "Music", identityTemplate: "A musician who finishes what they start" },
        { label: "Code / Side projects", identityTemplate: "A developer who ships" },
        { label: "Other", identityTemplate: "A creator who finishes projects" }
      ]
    },
    {
      label: "Starting tasks instead of overthinking",
      emoji: '💼',
      needsClarification: true,
      domainOptions: [
        { label: "Work tasks", identityTemplate: "Someone who acts, not just plans at work" },
        { label: "Personal projects", identityTemplate: "Someone who starts before feeling ready" },
        { label: "Learning", identityTemplate: "A learner who starts before feeling ready" },
        { label: "Creative work", identityTemplate: "A creator who starts before feeling ready" },
        { label: "Other", identityTemplate: "Someone who acts, not just plans" }
      ]
    },
    {
      label: "Improving without burning out",
      emoji: '🧘',
      needsClarification: true,
      domainOptions: [
        { label: "Work / Career", identityTemplate: "A professional who grows sustainably" },
        { label: "Fitness / Health", identityTemplate: "Someone who builds fitness without burnout" },
        { label: "Self-improvement", identityTemplate: "Someone who improves without burning out" },
        { label: "Studies / Learning", identityTemplate: "A learner who grows sustainably" },
        { label: "Other", identityTemplate: "Someone who improves sustainably" }
      ]
    },
    {
      label: "Learning something and sticking with it",
      emoji: '📚',
      needsClarification: true,
      domainOptions: [
        { label: "A new skill", identityTemplate: "A learner who sticks with it" },
        { label: "A language", identityTemplate: "A language learner who stays consistent" },
        { label: "A subject / course", identityTemplate: "A student who follows through" },
        { label: "Coding / Tech", identityTemplate: "A developer who keeps learning" },
        { label: "Other", identityTemplate: "A learner who stays consistent" }
      ]
    },
    {
      label: "Being more comfortable socially",
      emoji: '💬',
      needsClarification: false // Direct identity
    },
  ];

// Internal Tooltip Component
const Tooltip: React.FC<{ text: string; onClose: () => void; delay?: number }> = ({ text, onClose, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.95 }}
    transition={{ delay, duration: 0.4, type: "spring" }}
    className="absolute top-24 right-4 left-4 z-50"
  >
    <div className="bg-primary-cyan/10 dark:bg-primary-cyan/10 bg-white border border-primary-cyan/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl flex gap-3 relative overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-cyan" />
      <div className="mt-0.5 text-primary-cyan shrink-0"><Info size={18} /></div>
      <p className="text-sm text-dark-900 dark:text-white/90 leading-relaxed font-medium flex-1">{text}</p>
      <button onClick={onClose} className="text-dark-900/40 dark:text-white/40 hover:text-primary-cyan transition-colors">
        <X size={16} />
      </button>
    </div>
  </motion.div>
);

export const Onboarding: React.FC = () => {
  const { identity, setIdentity, setIdentityPattern, setHabitsWithLevels, setView, dismissedTooltips, dismissTooltip, setIdentityProfile } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [habitInputs, setHabitInputs] = useState<string[]>(['', '', '']);
  const [generatedHabits, setGeneratedHabits] = useState<GenerateHabitsResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFamiliarity, setSelectedFamiliarity] = useState<InitialFamiliarity | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<typeof IDENTITY_EXAMPLES[0] | null>(null);
  const [showDomainSelection, setShowDomainSelection] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: "What's one thing in your life that actually bothers you enough to fix?", type: 'text' }
  ]);

  const [step, setStep] = useState(0); // 0: Identity, 1: Familiarity, 2: Habits (then → contract)


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages, step]);

  const shouldShowTooltip = (id: string) => !dismissedTooltips.includes(id);

  // 🛡️ RATE LIMIT: AI Auto-Fill limit per day (prevents misuse)
  const AI_AUTOFILL_LIMIT = 2;
  const AI_AUTOFILL_KEY = 'bounce_autofill_usage';

  const getAutoFillUsage = (): { count: number; date: string } => {
    try {
      const stored = localStorage.getItem(AI_AUTOFILL_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to read autofill usage from localStorage');
    }
    return { count: 0, date: '' };
  };

  const incrementAutoFillUsage = () => {
    const today = new Date().toISOString().split('T')[0];
    const usage = getAutoFillUsage();

    // Reset count if it's a new day
    if (usage.date !== today) {
      localStorage.setItem(AI_AUTOFILL_KEY, JSON.stringify({ count: 1, date: today }));
    } else {
      localStorage.setItem(AI_AUTOFILL_KEY, JSON.stringify({ count: usage.count + 1, date: today }));
    }
  };

  const canUseAutoFill = (): boolean => {
    const today = new Date().toISOString().split('T')[0];
    const usage = getAutoFillUsage();

    // Reset if new day
    if (usage.date !== today) {
      return true;
    }

    return usage.count < AI_AUTOFILL_LIMIT;
  };



  const handleMagicWand = async () => {
    // 🛡️ RATE LIMIT CHECK
    if (!canUseAutoFill()) {
      if (import.meta.env.DEV) console.log('🚫 [ONBOARDING] Auto-fill limit reached for today');
      // Use fallback instead of AI
      fallbackSuggestions();
      return;
    }

    setIsGenerating(true);
    try {
      // Track usage BEFORE the call (in case of errors, we still count it)
      incrementAutoFillUsage();

      const suggestions = await generateHabits(identity);

      if (import.meta.env.DEV) console.log("🪄 [ONBOARDING] AI returned suggestions:", suggestions);
      if (import.meta.env.DEV) console.log("🪄 [ONBOARDING] High array:", suggestions.high);
      if (import.meta.env.DEV) console.log("🪄 [ONBOARDING] Medium array:", suggestions.medium);
      if (import.meta.env.DEV) console.log("🪄 [ONBOARDING] Low array:", suggestions.low);


      // Populate inputs with one habit per energy level: [high, medium, low]
      if (suggestions.high?.length > 0 && suggestions.medium?.length > 0 && suggestions.low?.length > 0) {
        const newInputs = [suggestions.high[0], suggestions.medium[0], suggestions.low[0]];
        if (import.meta.env.DEV) console.log("🪄 [ONBOARDING] Setting habit inputs to:", newInputs);
        setHabitInputs(newInputs);
        setGeneratedHabits(suggestions);

        // 📊 ANALYTICS: Track first meaningful action (habits generated)
        trackFirstAction('habits_generated');

        // Store identityType if AI detected it (v8: preserve stage from familiarity step)
        if (suggestions.identityType) {
          if (import.meta.env.DEV) console.log("🧬 [ONBOARDING] AI detected identity type:", suggestions.identityType, "-", suggestions.identityReason);
          // Only update the type, preserve stage/weeksInStage from familiarity step
          setIdentityProfile({
            type: suggestions.identityType
          });
        }
      } else {
        console.warn("🪄 [ONBOARDING] Missing habits in AI response, using fallback");
        fallbackSuggestions();
      }
    } catch (error) {
      console.error("AI generation failed", error);
      fallbackSuggestions();
    } finally {
      setIsGenerating(false);
    }
  };



  const fallbackSuggestions = () => {
    // Use centralized habit template service (includes fallback)
    const templateResult = getHabitsFromTemplate(identity);
    if (import.meta.env.DEV) console.log("📋 [ONBOARDING] Using template fallback:", templateResult.isTemplateMatch ? 'matched' : 'fallback');

    // Populate with one habit per energy level: [high, medium, low]
    setHabitInputs([templateResult.high[0], templateResult.medium[0], templateResult.low[0]]);
    setGeneratedHabits({
      high: templateResult.high,
      medium: templateResult.medium,
      low: templateResult.low
    });
  };


  const handleSend = (value: string | string[]) => {
    // Logic for Identity Step (Step 0) - ALWAYS show identity question after pattern
    if (step === 0 && typeof value === 'string') {
      if (!value.trim()) return;

      // Check if this is a predefined pattern
      const matchingPattern = IDENTITY_EXAMPLES.find(ex => ex.label === value);

      // ALWAYS show domain/identity question - whether preset pattern or custom input
      if (!showDomainSelection) {
        // Store the pattern (what bothers them)
        setIdentityPattern(value);
        setShowDomainSelection(true);
        setInputValue(''); // Clear input for user to type identity

        // Create a synthetic pattern object for custom input
        if (matchingPattern) {
          setSelectedPattern(matchingPattern);
        } else {
          // Custom input - create a synthetic pattern
          setSelectedPattern({ label: value, emoji: '🎯', needsClarification: true });
        }

        const displayText = matchingPattern ? `${matchingPattern.emoji} ${value}` : `🎯 ${value}`;
        const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: displayText } as Message];
        setMessages(newMessages);

        setTimeout(() => {
          const domainMsg: Message = {
            id: 'bot-domain',
            sender: 'bot',
            text: "Who do you want to become through this?\n\n(Focus on one identity at a time to avoid overwhelm)",
            type: 'text'
          };
          setMessages(prev => [...prev, domainMsg]);
        }, 400);
        return;
      }

      // This shouldn't happen now, but keep as fallback for domain selection handling
      const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: value } as Message];
      setMessages(newMessages);
      setInputValue('');

      setTimeout(() => {
        setIdentity(value);
        const nextBotMsg: Message = {
          id: 'bot-familiarity',
          sender: 'bot',
          text: `Love it! ✨ How familiar are you already with "${value}"?`,
          type: 'text'
        };
        setMessages(prev => [...prev, nextBotMsg]);
        setStep(1); // Move to familiarity step
        setShowDomainSelection(false);
      }, 600);
    }

    // Logic for Familiarity Step (Step 1) - NEW v8
    else if (step === 1 && typeof value === 'string') {
      const familiarity = value as InitialFamiliarity;
      setSelectedFamiliarity(familiarity);

      // Find the option to get the label for display
      const option = FAMILIARITY_OPTIONS.find(o => o.value === familiarity);
      const displayText = option ? `${option.emoji} ${option.label}` : familiarity;

      const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: displayText } as Message];
      setMessages(newMessages);

      setTimeout(() => {
        // v8 Mapping: Familiarity → Stage & weeksInStage
        const today = new Date().toISOString().split('T')[0];
        let stage: 'INITIATION' | 'INTEGRATION' | 'EXPANSION' = 'INITIATION';
        let weeksInStage = 0;

        switch (familiarity) {
          case 'NEW':
            stage = 'INITIATION';
            weeksInStage = 0;
            break;
          case 'INCONSISTENT':
            stage = 'INITIATION';
            weeksInStage = 1;
            break;
          case 'BASIC':
            stage = 'INTEGRATION';
            weeksInStage = 0;
            break;
          case 'REGULAR':
            stage = 'INTEGRATION';
            weeksInStage = 3;
            break;
          case 'IDENTITY':
            stage = 'EXPANSION';
            weeksInStage = 0;
            break;
        }

        if (import.meta.env.DEV) console.log(`🎯 [ONBOARDING] v8 Stage Init: ${familiarity} → ${stage} (week ${weeksInStage})`);

        // Set identity profile with familiarity-based stage (type will be set by AI later)
        setIdentityProfile({
          type: null, // Will be detected by AI in handleMagicWand
          stage,
          stageEnteredAt: today,
          weeksInStage,
          initialFamiliarity: familiarity
        });

        const nextBotMsg: Message = {
          id: 'bot-2',
          sender: 'bot',
          text: `Got it! Now let's build your energy deck. Give me one habit for each energy state — when you're fully charged 🔥, on a normal day ⚡, and running low 🌱.`,
          type: 'text'
        };
        setMessages(prev => [...prev, nextBotMsg]);
        setStep(2); // Move to habits step
      }, 600);
    }

    // Logic for Habits Step (Step 2)
    else if (step === 2 && Array.isArray(value)) {
      const validHabits = value.filter(h => h.trim().length > 0);
      if (validHabits.length === 0) return;

      // Display with energy labels
      const userMsgText = `🔥 ${validHabits[0] || '...'}\n⚡ ${validHabits[1] || '...'}\n🌱 ${validHabits[2] || '...'}`;
      const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: userMsgText } as Message];
      setMessages(newMessages);

      setTimeout(() => {
        // Map inputs correctly: [0]=High, [1]=Medium, [2]=Low
        // Preserve all 3 AI-generated habits per energy, user edit replaces the first one
        const finalHabits = generatedHabits ? {
          // If user edited (different from AI suggestion), use their input as primary + keep other 2 from AI
          // If user didn't edit (matches AI), use full AI array
          high: validHabits[0] && validHabits[0] !== generatedHabits.high[0]
            ? [validHabits[0], ...generatedHabits.high.slice(1)]
            : generatedHabits.high,
          medium: validHabits[1] && validHabits[1] !== generatedHabits.medium[0]
            ? [validHabits[1], ...generatedHabits.medium.slice(1)]
            : generatedHabits.medium,
          low: validHabits[2] && validHabits[2] !== generatedHabits.low[0]
            ? [validHabits[2], ...generatedHabits.low.slice(1)]
            : generatedHabits.low
        } : (() => {
          // Manual entry: populate remaining habits from templates (no AI call)
          const identity = useStore.getState().identity || '';
          const templateHabits = getHabitsFromTemplate(identity);
          if (import.meta.env.DEV) console.log('📋 [ONBOARDING] Manual entry - using template fillins:', templateHabits.isTemplateMatch ? 'matched' : 'fallback');

          return {
            // User's habit first, then fill with 2 more from template/fallback
            high: [validHabits[0] || templateHabits.high[0], ...templateHabits.high.slice(0, 2)].slice(0, 3),
            medium: [validHabits[1] || templateHabits.medium[0], ...templateHabits.medium.slice(0, 2)].slice(0, 3),
            low: [validHabits[2] || templateHabits.low[0], ...templateHabits.low.slice(0, 2)].slice(0, 3)
          };
        })();

        setHabitsWithLevels(finalHabits);

        // v8: Skip time question - go directly to contract
        if (import.meta.env.DEV) console.log('🎯 [ONBOARDING] Habits confirmed, proceeding to contract');
        setView('contract');
      }, 600);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] relative overflow-hidden bg-dark-900">
      {/* Tooltips Overlay */}
      <AnimatePresence>
        {/* {step === 0 && shouldShowTooltip('identity') && (
          <Tooltip
            key="t1"
            text="Pick something you're actually willing to work on — not what sounds good."
            onClose={() => dismissTooltip('identity')}
            delay={1}
          />
        )} */}
        {step === 2 && shouldShowTooltip('micro') && (
          <Tooltip
            key="t2"
            text="High, Normal, Low - match your habit to your energy. This keeps you consistent even on hard days."
            onClose={() => dismissTooltip('micro')}
            delay={0.5}
          />
        )}
      </AnimatePresence>

      {/* Background Gradients (Theme Aware) */}
      <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-primary-purple rounded-full blur-[100px] opacity-10 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-primary-cyan rounded-full blur-[100px] opacity-10 dark:opacity-20 pointer-events-none" />

      {/* Header Progress - 4 steps: Pattern, Identity, Familiarity, Habits */}
      {/* displayStep accounts for the two-part step 0 (pattern → identity) */}
      {(() => {
        const displayStep = step === 0 && showDomainSelection ? 1 : (step === 0 ? 0 : step + 1);
        const totalSteps = 4;
        return (
          <div className="flex flex-col items-center pt-6 pb-3 relative z-10">
            {/* Progress Capsules - Larger and more visible */}
            <div className="flex justify-center gap-2 mb-2">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2.5 rounded-full transition-all duration-500 ${i <= displayStep ? 'w-8 bg-primary-cyan shadow-[0_0_8px_rgba(13,204,242,0.4)]' : 'w-2.5 bg-dark-900/20 dark:bg-white/20'}`}
                />
              ))}
            </div>
            {/* Step Label */}
            <p className="text-xs text-gray-500 dark:text-white/40 font-medium">
              Step {displayStep + 1} of {totalSteps}{displayStep === totalSteps - 1 && ' · Last step!'}
            </p>
            {/* Context on first view */}
            {displayStep === 0 && (
              <p className="text-xs text-white/30 mt-1">4 quick questions to personalize your habit</p>
            )}
          </div>
        );
      })()}

      {/* All Steps: Sticky Question + Content area */}
      <div className="flex-1 flex flex-col relative z-0 overflow-hidden">
        {/* Sticky Question Header with Back Button */}
        <div className="px-4 pt-6 pb-4 relative z-10">
          {/* Back Button */}
          {(step > 0 || showDomainSelection) && (
            <button
              onClick={() => {
                if (showDomainSelection) {
                  setShowDomainSelection(false);
                  setSelectedPattern(null);
                } else if (step > 0) {
                  setStep(step - 1);
                }
              }}
              className="absolute left-4 top-6 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ChevronLeft size={24} className="text-white/60" />
            </button>
          )}
          <AnimatePresence mode='wait'>
            <motion.div
              key={step === 0 ? (showDomainSelection ? 'q2' : 'q1') : step === 1 ? 'q3' : 'q4'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center px-8"
            >
              <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-lg">
                {step === 0
                  ? (showDomainSelection
                    ? "Who do you want to become through this?"
                    : "What's one thing in your life that actually bothers you enough to fix?")
                  : step === 1
                    ? "How familiar are you already with this?"
                    : "Create your micro-habit deck"
                }
              </h2>
              {step === 0 && showDomainSelection && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-white/50 mt-3 font-medium"
                >
                  (Focus on one identity at a time)
                </motion.p>
              )}
              {step === 2 && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-white/50 mt-3 font-medium"
                >
                  One habit for each energy level
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content Area */}
        <div className={`flex-1 w-full ${step >= 1 ? 'overflow-y-auto custom-scrollbar px-4 pb-4' : ''}`}>

          {/* Step 0: Horizontal Scrolling Chips - with peek hint */}
          {step === 0 && !showDomainSelection && (
            <div className="h-full flex flex-col justify-end pb-4">
              <div className="w-full overflow-x-auto no-scrollbar">
                {/* Gradient hint that more content exists */}
                <div className="flex gap-3 w-max py-2 pl-2 pr-8">
                  {IDENTITY_EXAMPLES.map((ex, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setInputValue(ex.label)}
                      className={`px-4 py-3 rounded-2xl text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2 ${inputValue === ex.label
                        ? 'bg-primary-cyan/20 border-primary-cyan text-white shadow-[0_0_20px_rgba(13,204,242,0.3)] ring-1 ring-primary-cyan/50'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        } border backdrop-blur-md`}
                    >
                      <span className="text-xl">{ex.emoji}</span>
                      <span>{ex.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              {/* Scroll hint */}
              <p className="text-xs text-center text-white/30 mt-2">← Swipe to see more →</p>
            </div>
          )}

          {/* Step 1: Vertical Familiarity Options */}
          {step === 1 && (
            <div className="flex flex-col gap-3 py-2">
              {FAMILIARITY_OPTIONS.map((opt, idx) => (
                <motion.button
                  key={opt.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.08 }}
                  onClick={() => handleSend(opt.value)}
                  className="w-full px-5 py-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary-cyan/10 hover:border-primary-cyan/30 transition-all text-left flex items-center gap-4 group"
                >
                  <span className="text-3xl group-hover:scale-110 transition-transform duration-300">{opt.emoji}</span>
                  <span className="text-base font-medium text-white/90">{opt.label}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Step 2: Habit Input Cards */}
          {step === 2 && (
            <div className="flex flex-col gap-4 py-2">
              {/* Auto-Fill Button - Original compact style */}
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-white/40 font-medium uppercase tracking-wider">Your Deck</span>
                <button
                  onClick={handleMagicWand}
                  disabled={isGenerating}
                  className="flex items-center gap-1 text-xs text-primary-purple hover:text-primary-cyan transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  <span>{isGenerating ? 'Generating...' : 'Auto-Fill'}</span>
                </button>
              </div>

              {/* Habit Input Fields as Cards */}
              {habitInputs.map((habit, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{idx === 0 ? '🔥' : idx === 1 ? '⚡' : '🌱'}</span>
                    <span className="text-sm font-medium text-white/60">
                      {idx === 0 ? 'High Energy Day' : idx === 1 ? 'Normal Day' : 'Low Energy Day'}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={habit}
                    onChange={(e) => {
                      const newInputs = [...habitInputs];
                      newInputs[idx] = e.target.value;
                      setHabitInputs(newInputs);
                    }}
                    placeholder={idx === 0 ? "e.g. Write 500 words" : idx === 1 ? "e.g. Write 1 paragraph" : "e.g. Write 1 sentence"}
                    className="w-full bg-transparent border-b border-white/10 pb-2 text-white placeholder-white/30 focus:outline-none focus:border-primary-cyan/50 transition-colors"
                  />
                </motion.div>
              ))}

              {/* Confirm Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => handleSend(habitInputs)}
                disabled={!habitInputs[0].trim()}
                className="w-full mt-2 py-4 bg-gradient-to-r from-primary-cyan to-primary-blue rounded-2xl font-bold text-white dark:text-dark-900 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
              >
                Confirm Deck
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t border-dark-900/5 dark:border-white/5 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl relative z-10 transition-all duration-300 ${step === 0 ? 'pb-6' : ''}`}>

        {/* Step 0: Input Only (Chips moved to main view) */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputValue.trim()) {
                    // Logic handles both phases via existing 'handleSend' logic flow or manual implementation
                    // Reusing the same manual block from original code for safety:
                    if (showDomainSelection) {
                      const finalIdentity = inputValue.trim();
                      const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: finalIdentity } as Message];
                      setMessages(newMessages);
                      setInputValue('');
                      setTimeout(() => {
                        setIdentity(finalIdentity);
                        const nextBotMsg: Message = { id: 'bot-familiarity', sender: 'bot', text: `Perfect! "${finalIdentity}"...`, type: 'text' };
                        setMessages(prev => [...prev, nextBotMsg]);
                        setStep(1);
                        setShowDomainSelection(false);
                        setSelectedPattern(null);
                      }, 600);
                    } else {
                      handleSend(inputValue);
                    }
                  }
                }}
                placeholder={showDomainSelection ? "e.g. A Fantasy Writer, A Morning Runner..." : "Or type your own..."}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-5 pr-14 py-4 text-dark-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-primary-cyan/50 transition-colors text-lg"
                autoFocus={showDomainSelection} // Auto-focus only on identity step
              />
              <button
                onClick={() => {
                  if (!inputValue.trim()) return;
                  if (showDomainSelection) {
                    const finalIdentity = inputValue.trim();
                    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: finalIdentity } as Message];
                    setMessages(newMessages);
                    setInputValue('');
                    setTimeout(() => {
                      setIdentity(finalIdentity);
                      const nextBotMsg: Message = { id: 'bot-familiarity', sender: 'bot', text: `Perfect! "${finalIdentity}"...`, type: 'text' };
                      setMessages(prev => [...prev, nextBotMsg]);
                      setStep(1);
                      setShowDomainSelection(false);
                      setSelectedPattern(null);
                    }, 600);
                  } else {
                    handleSend(inputValue);
                  }
                }}
                disabled={!inputValue.trim()}
                className="absolute right-2 top-2 bottom-2 w-12 bg-gradient-to-br from-primary-cyan to-primary-blue rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all"
              >
                <ArrowRight size={24} className="text-white dark:text-dark-900" />
              </button>
            </div>
            {/* Seriousness Nudge */}
            {!showDomainSelection && (
              <p className="text-xs text-center text-gray-500 dark:text-white/30">
                Pick something you're willing to work on!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
