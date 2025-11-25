
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles, Sprout } from 'lucide-react';
import { useStore } from '../store';
import { Spirit } from '../components/Spirit';

export const Growth: React.FC = () => {
  const { setView, streak, totalCompletions } = useStore();

  const getStageInfo = (s: number) => {
    if (s < 3) return { name: "The Spark", desc: "A flicker of intention. Delicate, but present.", next: 3 };
    if (s < 7) return { name: "The Strand", desc: "Connections form. The habit begins to take shape.", next: 7 };
    if (s < 14) return { name: "The Weave", desc: "Resilience strengthens. Patterns emerge from chaos.", next: 14 };
    if (s < 30) return { name: "The Resonance", desc: "Harmony achieved. The habit echoes effortlessly.", next: 30 };
    return { name: "The Ascendance", desc: "Pure light. You are the habit.", next: 100 };
  };

  const info = getStageInfo(streak);
  const nextMilestone = info.next;
  const progress = Math.min(100, (streak / nextMilestone) * 100);

  return (
    <div className="h-full flex flex-col relative bg-[#0F0F10] overflow-hidden text-white">
        {/* Background Atmosphere */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#0F0F10] to-[#0F0F10]" />

        {/* Header */}
        <div className="p-6 relative z-20 flex items-center justify-between">
            <button 
                onClick={() => setView('dashboard')}
                className="p-2 -ml-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
                <ArrowLeft size={24} />
            </button>
            <div className="flex items-center gap-2 text-primary-cyan/80">
                <Sprout size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Growth</span>
            </div>
            <div className="w-8" /> {/* Spacer */}
        </div>

        {/* Main Spirit Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-10">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
            >
                <Spirit streak={streak} size={320} />
            </motion.div>

            <div className="text-center mt-8 max-w-xs mx-auto">
                <motion.h1 
                    key={info.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl font-light text-white tracking-[0.2em] uppercase mb-2"
                >
                    {info.name}
                </motion.h1>
                <motion.p 
                    key={info.desc}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-white/50 text-sm font-light leading-relaxed"
                >
                    {info.desc}
                </motion.p>
            </div>
        </div>

        {/* Footer Progress */}
        <div className="p-8 pb-12 relative z-20">
            <div className="flex justify-between text-xs text-white/30 mb-2 font-mono">
                <span>Streak: {streak}</span>
                <span>Next Evolution: {nextMilestone}</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-gradient-to-r from-primary-cyan to-primary-purple"
                />
            </div>
            <p className="text-center text-[10px] text-white/20 mt-4 uppercase tracking-widest">
                Nurture your spirit daily
            </p>
        </div>
    </div>
  );
};
