
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
            try { navigator.vibrate(pattern); } catch (e) { }
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
                        setPhase('exhale'); setText('Breathe Out'); triggerHaptic([30, 30, 30]);
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
                    className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
                >
                    {/* Dark Overlay to block background content */}
                    <div className="absolute inset-0 bg-black/95" />

                    {/* Animated Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-950/50 to-slate-900" />

                    {/* Ambient Glow Effects */}
                    <motion.div
                        animate={{
                            scale: phase === 'inhale' ? 1.3 : phase === 'exhale' ? 0.8 : 1,
                            opacity: phase === 'inhale' ? 0.4 : 0.2
                        }}
                        transition={{ duration: phase === 'inhale' ? 4 : phase === 'exhale' ? 6 : 0.5 }}
                        className="absolute w-[600px] h-[600px] rounded-full bg-gradient-to-r from-cyan-500/30 via-purple-500/20 to-blue-500/30 blur-3xl"
                    />

                    {/* Close Button - Glassmorphic */}
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white/60 hover:text-white hover:bg-white/20 transition-all border border-white/10 shadow-lg"
                    >
                        <X size={24} />
                    </button>

                    {/* Header Title */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-8 left-0 right-0 text-center"
                    >
                        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-white/40">Pulse Breathing</h2>
                    </motion.div>

                    {/* Main Breathing Text - Premium Style */}
                    <div className="mb-8 text-center relative z-10">
                        <motion.div
                            key={text}
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ type: "spring", damping: 15 }}
                            className="relative"
                        >
                            {/* Text Glow */}
                            <div className={`absolute inset-0 blur-xl ${phase === 'inhale' ? 'bg-cyan-500/40' :
                                phase === 'hold' ? 'bg-purple-500/40' :
                                    'bg-amber-500/40'
                                }`} />
                            <h1 className="relative text-4xl font-light text-white tracking-[0.2em] uppercase">
                                {text}
                            </h1>
                        </motion.div>
                        <p className="text-white/40 mt-4 text-sm tracking-wide">{TECHNIQUES.find(t => t.id === activePattern)?.desc}</p>
                    </div>

                    {/* Orb Container */}
                    <motion.div
                        animate={{
                            scale: phase === 'inhale' ? 1.15 : phase === 'exhale' ? 0.95 : 1.05,
                        }}
                        transition={{
                            duration: phase === 'inhale' ? 4 : phase === 'exhale' ? 6 : 4,
                            ease: "easeInOut"
                        }}
                        className="relative pointer-events-none"
                    >
                        <Orb state={phase === 'exhale' ? 'frozen' : phase === 'inhale' ? 'healing' : 'breathing'} size={280} />
                    </motion.div>

                    {/* Phase Indicator Pills */}
                    <div className="mt-8 flex gap-3 items-center">
                        {['inhale', 'hold', 'exhale'].map((p, i) => (
                            <motion.div
                                key={p}
                                animate={{
                                    scale: phase === p ? 1.1 : 1,
                                    opacity: phase === p ? 1 : 0.4
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${phase === p
                                    ? p === 'inhale' ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                                        : p === 'hold' ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
                                            : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                                    : 'bg-white/5 border-white/10 text-white/30'
                                    }`}
                            >
                                <motion.div
                                    animate={{
                                        scale: phase === p ? [1, 1.3, 1] : 1,
                                    }}
                                    transition={{ repeat: phase === p ? Infinity : 0, duration: 1.5 }}
                                    className={`w-2 h-2 rounded-full ${p === 'inhale' ? 'bg-cyan-400' :
                                        p === 'hold' ? 'bg-purple-400' :
                                            'bg-amber-400'
                                        }`}
                                />
                                <span className="text-xs font-medium uppercase tracking-wider capitalize">{p}</span>
                            </motion.div>
                        ))}
                    </div>

                    {/* Technique Selectors - Premium Floating Dock */}
                    <div className="absolute bottom-10 left-0 right-0 px-6 flex justify-center z-20">
                        <div className="flex items-center gap-2 p-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl">
                            {TECHNIQUES.map((t) => (
                                <motion.button
                                    key={t.id}
                                    onClick={() => setActivePattern(t.id)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative flex flex-col items-center justify-center w-20 h-20 rounded-2xl transition-all duration-300 ${activePattern === t.id
                                        ? 'bg-gradient-to-b from-white/15 to-white/5 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                        : 'hover:bg-white/5 border border-transparent hover:border-white/5'
                                        }`}
                                >
                                    {/* Active Indicator Dot */}
                                    {activePattern === t.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute -top-1 w-8 h-1 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                                        />
                                    )}

                                    <div className={`p-2 rounded-xl mb-1 transition-colors ${activePattern === t.id
                                        ? 'bg-cyan-500/20 text-cyan-300'
                                        : 'text-white/40 group-hover:text-white/60'
                                        }`}>
                                        <t.icon size={22} strokeWidth={activePattern === t.id ? 2.5 : 1.5} />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${activePattern === t.id ? 'text-white' : 'text-white/30'
                                        }`}>{t.label}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
