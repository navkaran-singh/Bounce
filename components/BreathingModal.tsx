
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, BoxSelect, Moon, AlertOctagon } from 'lucide-react';
import { Orb } from './Orb';
import { BreathPattern } from '../types';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TECHNIQUES: { id: BreathPattern; label: string; desc: string; icon: any }[] = [
    { id: 'coherence', label: 'Coherence', desc: 'Balance & Calm', icon: Wind },
    { id: 'box', label: 'Box', desc: 'Focus & Clarity', icon: BoxSelect },
    { id: '478', label: '4-7-8', desc: 'Sleep & Relax', icon: Moon },
    { id: 'sigh', label: 'Phys. Sigh', desc: 'Panic Relief', icon: AlertOctagon },
];

export const BreathingModal: React.FC<BreathingModalProps> = ({ isOpen, onClose }) => {
  const [activePattern, setActivePattern] = useState<BreathPattern>('coherence');
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [text, setText] = useState('Breathe In');
  const [isRunning, setIsRunning] = useState(false);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(pattern); } catch (e) {}
    }
  };

  useEffect(() => {
    if (!isOpen) {
        setIsRunning(false);
        return;
    }
    
    // Start running
    setIsRunning(true);
  }, [isOpen]);

  useEffect(() => {
      if (!isRunning) return;

      let timeout: ReturnType<typeof setTimeout>;

      const runCycle = () => {
          if (activePattern === 'coherence') {
              // 4s In, 4s Hold, 6s Out (Standard)
                setPhase('inhale'); setText('Breathe In'); triggerHaptic(50);
                timeout = setTimeout(() => {
                    setPhase('hold'); setText('Hold');
                    timeout = setTimeout(() => {
                        setPhase('exhale'); setText('Breathe Out'); triggerHaptic([30,30,30]);
                        timeout = setTimeout(runCycle, 6000);
                    }, 4000);
                }, 4000);
          } else if (activePattern === 'box') {
              // 4-4-4-4
               setPhase('inhale'); setText('Breathe In (4)'); triggerHaptic(50);
               timeout = setTimeout(() => {
                   setPhase('hold'); setText('Hold (4)');
                   timeout = setTimeout(() => {
                       setPhase('exhale'); setText('Exhale (4)'); triggerHaptic(30);
                       timeout = setTimeout(() => {
                            setPhase('hold'); setText('Hold Empty (4)');
                            timeout = setTimeout(runCycle, 4000);
                       }, 4000);
                   }, 4000);
               }, 4000);
          } else if (activePattern === '478') {
              // 4-7-8
              setPhase('inhale'); setText('Inhale (4)'); triggerHaptic(50);
              timeout = setTimeout(() => {
                  setPhase('hold'); setText('Hold (7)');
                  timeout = setTimeout(() => {
                      setPhase('exhale'); setText('Exhale (8)'); triggerHaptic([30, 30, 30, 30]);
                      timeout = setTimeout(runCycle, 8000);
                  }, 7000);
              }, 4000);
          } else if (activePattern === 'sigh') {
              // Double inhale, long exhale
              setPhase('inhale'); setText('Double Inhale'); triggerHaptic([20, 20]);
              timeout = setTimeout(() => {
                  setPhase('exhale'); setText('Long Exhale'); triggerHaptic(100);
                  timeout = setTimeout(runCycle, 6000);
              }, 2000); // Short inhale cycle
          }
      };

      runCycle();
      return () => clearTimeout(timeout);
  }, [activePattern, isRunning]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center"
        >
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
                <X size={24} />
            </button>

            {/* Pattern Selectors */}
            <div className="absolute bottom-10 left-0 right-0 px-6 flex justify-center gap-4 z-20">
                {TECHNIQUES.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setActivePattern(t.id)}
                        className={`flex flex-col items-center gap-2 opacity-80 hover:opacity-100 transition-all ${activePattern === t.id ? 'text-primary-cyan scale-110 opacity-100' : 'text-white/40'}`}
                    >
                        <div className={`p-3 rounded-full ${activePattern === t.id ? 'bg-primary-cyan/20 border border-primary-cyan' : 'bg-white/5 border border-white/10'}`}>
                            <t.icon size={20} />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider">{t.label}</span>
                    </button>
                ))}
            </div>

            <div className="mb-12 text-center relative z-10">
                 <motion.div 
                    key={text}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-3xl font-light text-white tracking-widest uppercase"
                 >
                     {text}
                 </motion.div>
                 <p className="text-white/30 mt-2 text-sm">{TECHNIQUES.find(t => t.id === activePattern)?.desc}</p>
            </div>

            <div className="scale-125 pointer-events-none opacity-80">
                <Orb state={phase === 'exhale' ? 'frozen' : phase === 'inhale' ? 'healing' : 'breathing'} size={300} />
            </div>
            
            {/* Visual Indicator */}
            <div className="mt-16 flex gap-2">
                <motion.div 
                    animate={{ 
                        height: phase === 'inhale' ? 40 : 8,
                        backgroundColor: phase === 'inhale' ? '#0dccf2' : '#ffffff30'
                    }}
                    className="w-2 rounded-full bg-white/20 transition-all duration-300" 
                />
                <motion.div 
                     animate={{ 
                        height: phase === 'hold' ? 40 : 8,
                        backgroundColor: phase === 'hold' ? '#7F00FF' : '#ffffff30'
                    }}
                    className="w-2 rounded-full bg-white/20 transition-all duration-300" 
                />
                <motion.div 
                     animate={{ 
                        height: phase === 'exhale' ? 40 : 8,
                        backgroundColor: phase === 'exhale' ? '#FFD700' : '#ffffff30'
                    }}
                    className="w-2 rounded-full bg-white/20 transition-all duration-300" 
                />
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
