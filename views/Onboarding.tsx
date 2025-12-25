import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Plus, Info, X, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { Message, IdentityType, InitialFamiliarity } from '../types';
import { generateHabits, GenerateHabitsResult } from '../services/ai';
import { getHabitsFromTemplate } from '../services/habitTemplateService';

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

  const handleMagicWand = async () => {
    setIsGenerating(true);
    try {
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
    const idLower = identity.toLowerCase();
    let high = ["Drink 1 glass of water", "Take 3 deep breaths", "Stretch for 1 minute"];
    let medium = ["Drink 1/2 glass", "Take 1 deep breath", "Stretch 30s"];
    let low = ["Sip water", "Close eyes", "Stand up"];

    if (idLower.includes("write") || idLower.includes("author")) {
      high = ["Write 500 words", "Edit 1 chapter", "Outline next scene"];
      medium = ["Write 1 paragraph", "Edit 1 page", "Review notes"];
      low = ["Write 1 sentence", "Open document", "Read last sentence"];
    } else if (idLower.includes("run") || idLower.includes("athlete") || idLower.includes("fit")) {
      high = ["Run 5km", "Sprint intervals", "Gym session"];
      medium = ["Run 1km", "Jog 10 mins", "Home workout"];
      low = ["Put on shoes", "Do 5 jumping jacks", "Fill water bottle"];
    } else if (idLower.includes("code") || idLower.includes("dev")) {
      high = ["Code 1 hour", "Solve 1 LeetCode", "Build feature"];
      medium = ["Code 15 mins", "Refactor function", "Read docs"];
      low = ["Open VS Code", "Write one comment", "Review one function"];
    }

    // Populate with one habit per energy level: [high, medium, low]
    setHabitInputs([high[0], medium[0], low[0]]);
    setGeneratedHabits({ high, medium, low });
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
            text: "Who do you want to become through this?",
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
    <div className="flex flex-col h-full relative">
      {/* Tooltips Overlay */}
      <AnimatePresence>
        {step === 0 && shouldShowTooltip('identity') && (
          <Tooltip
            key="t1"
            text="Pick something you're actually willing to work on — not what sounds good."
            onClose={() => dismissTooltip('identity')}
            delay={1}
          />
        )}
        {step === 2 && shouldShowTooltip('micro') && (
          <Tooltip
            key="t2"
            text="Why so small? To prevent burnout. On bad days, the smallest version keeps the streak alive."
            onClose={() => dismissTooltip('micro')}
            delay={0.5}
          />
        )}
      </AnimatePresence>

      {/* Background Gradients (Theme Aware) */}
      <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-primary-purple rounded-full blur-[100px] opacity-10 dark:opacity-20 pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[250px] h-[250px] bg-primary-cyan rounded-full blur-[100px] opacity-10 dark:opacity-20 pointer-events-none" />

      {/* Header Progress - 3 steps: Identity, Familiarity, Habits */}
      <div className="flex justify-center gap-2 pt-8 pb-4 relative z-10">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-6 bg-dark-900 dark:bg-white' : 'w-1.5 bg-dark-900/20 dark:bg-white/20'}`}
          />
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar relative z-0">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className="flex gap-3 max-w-[85%]">
                {msg.sender === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-cyan to-primary-purple shrink-0 shadow-[0_0_10px_rgba(13,204,242,0.3)]" />
                )}
                <div className={`p-4 rounded-2xl backdrop-blur-md border border-white/10 whitespace-pre-wrap shadow-sm ${msg.sender === 'user'
                  ? 'bg-dark-800/10 dark:bg-white/10 text-dark-900 dark:text-white'
                  : 'bg-white dark:bg-dark-800/80 text-dark-700 dark:text-white/90'
                  }`}>
                  <p className="text-[15px] leading-relaxed">{msg.text}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Options for Step 1 (Familiarity) */}
        {step === 1 && messages[messages.length - 1].sender === 'bot' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col gap-2 w-full"
          >
            {FAMILIARITY_OPTIONS.map((opt, idx) => (
              <motion.button
                key={opt.value}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                onClick={() => handleSend(opt.value)}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-white/5 border border-dark-900/10 dark:border-white/20 hover:bg-primary-cyan/10 dark:hover:bg-primary-cyan/10 hover:border-primary-cyan/30 transition-all text-left text-sm font-medium text-dark-900 dark:text-white flex items-center gap-3"
              >
                <span className="text-lg">{opt.emoji}</span>
                <span>{opt.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
        <div ref={scrollRef} className="h-20" />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-dark-900/5 dark:border-white/5 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl relative z-10">

        {/* Step 0: Identity Input with Examples or Domain Selection */}
        {step === 0 && (
          <div className="space-y-4">
            {/* Domain Selection - Now a text input for identity */}
            {showDomainSelection && selectedPattern ? (
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      // Combine pattern context with identity
                      const finalIdentity = inputValue.trim();
                      const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: finalIdentity } as Message];
                      setMessages(newMessages);
                      setInputValue('');

                      setTimeout(() => {
                        setIdentity(finalIdentity);
                        const nextBotMsg: Message = {
                          id: 'bot-familiarity',
                          sender: 'bot',
                          text: `Perfect! "${finalIdentity}" who works on "${selectedPattern.label}".\n\nHow familiar are you already with this?`,
                          type: 'text'
                        };
                        setMessages(prev => [...prev, nextBotMsg]);
                        setStep(1);
                        setShowDomainSelection(false);
                        setSelectedPattern(null);
                      }, 600);
                    }
                  }}
                  placeholder="e.g. A Fantasy Writer, A Morning Runner, A Developer..."
                  className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-4 pr-12 py-4 text-dark-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-primary-cyan/50 transition-colors"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (!inputValue.trim()) return;
                    const finalIdentity = inputValue.trim();
                    const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: finalIdentity } as Message];
                    setMessages(newMessages);
                    setInputValue('');

                    setTimeout(() => {
                      setIdentity(finalIdentity);
                      const nextBotMsg: Message = {
                        id: 'bot-familiarity',
                        sender: 'bot',
                        text: `Perfect! "${finalIdentity}" who works on "${selectedPattern.label}".\n\nHow familiar are you already with this?`,
                        type: 'text'
                      };
                      setMessages(prev => [...prev, nextBotMsg]);
                      setStep(1);
                      setShowDomainSelection(false);
                      setSelectedPattern(null);
                    }, 600);
                  }}
                  disabled={!inputValue.trim()}
                  className="absolute right-2 top-2 bottom-2 w-10 bg-gradient-to-br from-primary-cyan to-primary-blue rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all"
                >
                  <ArrowRight size={20} className="text-white dark:text-dark-900" />
                </button>
              </div>
            ) : (
              <>
                {/* Tappable Pattern Examples */}
                <div className="flex flex-wrap gap-2">
                  {IDENTITY_EXAMPLES.map((ex, idx) => (
                    <motion.button
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => setInputValue(ex.label)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${inputValue === ex.label
                        ? 'bg-primary-cyan/20 border-primary-cyan/50 text-primary-cyan dark:text-primary-cyan'
                        : 'bg-white dark:bg-white/5 border-dark-900/10 dark:border-white/20 text-dark-700 dark:text-white/70 hover:bg-primary-cyan/10 hover:border-primary-cyan/30'
                        } border`}
                    >
                      <span>{ex.emoji}</span>
                      <span>{ex.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Custom Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
                    placeholder="Or type your own..."
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-4 pr-12 py-4 text-dark-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-primary-cyan/50 transition-colors"
                  />
                  <button
                    onClick={() => handleSend(inputValue)}
                    disabled={!inputValue.trim()}
                    className="absolute right-2 top-2 bottom-2 w-10 bg-gradient-to-br from-primary-cyan to-primary-blue rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all"
                  >
                    <ArrowRight size={20} className="text-white dark:text-dark-900" />
                  </button>
                </div>

                {/* Seriousness Nudge */}
                <p className="text-xs text-center text-gray-500 dark:text-white/40">
                  Pick something you're actually willing to work on — not what sounds good.
                </p>
              </>
            )}
          </div>
        )}

        {/* Step 2: Micro-Habit Deck Input */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1 mb-2">
              <span className="text-xs text-gray-500 dark:text-white/40 font-medium uppercase tracking-wider">Your Deck</span>
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

            {habitInputs.map((habit, idx) => (
              <motion.input
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                type="text"
                value={habit}
                onChange={(e) => {
                  const newInputs = [...habitInputs];
                  newInputs[idx] = e.target.value;
                  setHabitInputs(newInputs);
                }}
                placeholder={idx === 0 ? "🔥 High Energy: e.g. Write 500 words" : idx === 1 ? "⚡ Normal Day: e.g. Write 1 paragraph" : "🌱 Low Energy: e.g. Write 1 sentence"}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-dark-900 dark:text-white placeholder-gray-400 dark:placeholder-white/20 focus:outline-none focus:border-primary-cyan/50 transition-colors"
              />
            ))}

            <button
              onClick={() => handleSend(habitInputs)}
              disabled={!habitInputs[0].trim()}
              className="w-full mt-2 py-4 bg-gradient-to-r from-primary-cyan to-primary-blue rounded-xl font-bold text-white dark:text-dark-900 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-[0.98]"
            >
              Confirm Deck
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
