import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Plus, Info, X, Loader2 } from 'lucide-react';
import { useStore } from '../store';
import { Message } from '../types';
import { generateHabits } from '../services/ai';

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
  const { identity, setIdentity, setHabitsWithLevels, setEnergyTime, setView, dismissedTooltips, dismissTooltip } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [habitInputs, setHabitInputs] = useState<string[]>(['', '', '']);
  const [generatedHabits, setGeneratedHabits] = useState<{ high: string[], medium: string[], low: string[] } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: "Let's start with the big picture. Who are we becoming?", type: 'text' }
  ]);

  const [step, setStep] = useState(0); // 0: Identity, 1: Habits, 2: Time

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

      // Populate inputs with one habit per energy level: [high, medium, low]
      if (suggestions.high?.length > 0 && suggestions.medium?.length > 0 && suggestions.low?.length > 0) {
        setHabitInputs([suggestions.high[0], suggestions.medium[0], suggestions.low[0]]);
        setGeneratedHabits(suggestions);
      } else {
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
    // Logic for Identity Step
    if (step === 0 && typeof value === 'string') {
      if (!value.trim()) return;
      const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: value } as Message];
      setMessages(newMessages);
      setInputValue('');

      setTimeout(() => {
        setIdentity(value);
        const nextBotMsg: Message = {
          id: 'bot-2',
          sender: 'bot',
          text: `Nice! Now let's build your energy deck. Give me one habit for each energy state — when you're fully charged 🔥, on a normal day ⚡, and running low 🌱.`,
          type: 'text'
        };
        setMessages(prev => [...prev, nextBotMsg]);
        setStep(1);
      }, 600);
    }
    // Logic for Habits Step
    else if (step === 1 && Array.isArray(value)) {
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
        } : {
          // Manual entry without AI: each input is the only habit for that energy level
          high: [validHabits[0] || 'Complete one task'],
          medium: [validHabits[1] || validHabits[0] || 'Do something small'],
          low: [validHabits[2] || validHabits[1] || validHabits[0] || 'Show up']
        };

        setHabitsWithLevels(finalHabits);


        const nextBotMsg: Message = {
          id: 'bot-3',
          sender: 'bot',
          text: 'Perfect. When do you usually get your burst of energy?',
          type: 'options',
          options: ['Morning', 'Afternoon', 'Evening']
        };
        setMessages(prev => [...prev, nextBotMsg]);
        setStep(2);
      }, 600);
    }

    // Logic for Time Step
    else if (step === 2 && typeof value === 'string') {
      const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: value } as Message];
      setMessages(newMessages);

      setTimeout(() => {
        setEnergyTime(value);
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
            text="Identity-based habits stick longer. Focus on who you are becoming, not just what you do."
            onClose={() => dismissTooltip('identity')}
            delay={1}
          />
        )}
        {step === 1 && shouldShowTooltip('micro') && (
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

      {/* Header Progress */}
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

        {/* Options for Step 2 (Time) */}
        {step === 2 && messages[messages.length - 1].sender === 'bot' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex gap-2 justify-end flex-wrap"
          >
            {['Morning', 'Afternoon', 'Evening'].map(opt => (
              <button
                key={opt}
                onClick={() => handleSend(opt)}
                className="px-6 py-3 rounded-xl bg-white dark:bg-white/5 border border-dark-900/10 dark:border-white/20 hover:bg-dark-50 dark:hover:bg-white/10 transition-colors text-sm font-medium text-dark-900 dark:text-white"
              >
                {opt}
              </button>
            ))}
          </motion.div>
        )}
        <div ref={scrollRef} className="h-20" />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-dark-900/5 dark:border-white/5 bg-white/80 dark:bg-dark-900/80 backdrop-blur-xl relative z-10">

        {/* Step 0: Identity Input */}
        {step === 0 && (
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend(inputValue)}
              placeholder="e.g. A Writer"
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-4 pr-12 py-4 text-dark-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:border-primary-cyan/50 transition-colors"
              autoFocus
            />
            <button
              onClick={() => handleSend(inputValue)}
              disabled={!inputValue.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 bg-gradient-to-br from-primary-cyan to-primary-blue rounded-xl flex items-center justify-center disabled:opacity-50 disabled:grayscale transition-all"
            >
              <ArrowRight size={20} className="text-white dark:text-dark-900" />
            </button>
          </div>
        )}

        {/* Step 1: Micro-Habit Deck Input */}
        {step === 1 && (
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
