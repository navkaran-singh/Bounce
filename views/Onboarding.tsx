
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Plus, Info, X } from 'lucide-react';
import { useStore } from '../store';
import { Message } from '../types';

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
  const { identity, setIdentity, setMicroHabits, setEnergyTime, setView, dismissedTooltips, dismissTooltip } = useStore();
  const [inputValue, setInputValue] = useState('');
  const [habitInputs, setHabitInputs] = useState<string[]>(['', '', '']);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: "Let's start with the big picture. Who are we becoming?", type: 'text' }
  ]);

  const [step, setStep] = useState(0); // 0: Identity, 1: Habits, 2: Time

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, step]);

  const shouldShowTooltip = (id: string) => !dismissedTooltips.includes(id);

  const handleMagicWand = () => {
    const idLower = identity.toLowerCase();
    let suggestions = ["Drink 1 glass of water", "Take 3 deep breaths", "Stretch for 1 minute"];

    if (idLower.includes("write") || idLower.includes("author")) {
      suggestions = ["Write 1 sentence", "Open your notes app", "Read 1 paragraph"];
    } else if (idLower.includes("run") || idLower.includes("athlete") || idLower.includes("fit")) {
      suggestions = ["Put on running shoes", "Do 5 jumping jacks", "Fill water bottle"];
    } else if (idLower.includes("code") || idLower.includes("dev")) {
      suggestions = ["Open VS Code", "Write one comment", "Review one function"];
    } else if (idLower.includes("music") || idLower.includes("art")) {
        suggestions = ["Pick up instrument", "Draw one line", "Listen to one song"];
    } else if (idLower.includes("calm") || idLower.includes("meditat")) {
        suggestions = ["Close eyes 10s", "Take 1 deep breath", "Sit straight"];
    }

    setHabitInputs(suggestions);
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
                text: `Got it. Let's build your safe deck. Give me 3 tiny versions of being a ${value}. (e.g. < 2 mins)`,
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

        const userMsgText = `1. ${validHabits[0]}\n2. ${validHabits[1] || '...'}\n3. ${validHabits[2] || '...'}`;
        const newMessages = [...messages, { id: Date.now().toString(), sender: 'user', text: userMsgText } as Message];
        setMessages(newMessages);

        setTimeout(() => {
            setMicroHabits(validHabits);
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
                    <div className={`p-4 rounded-2xl backdrop-blur-md border border-white/10 whitespace-pre-wrap shadow-sm ${
                        msg.sender === 'user' 
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
                        className="flex items-center gap-1 text-xs text-primary-purple hover:text-primary-cyan transition-colors"
                    >
                        <Sparkles size={12} />
                        <span>Auto-Fill</span>
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
                        placeholder={idx === 0 ? "Primary: e.g. Write 1 sentence" : `Variation ${idx + 1}: e.g. Read a page`}
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
