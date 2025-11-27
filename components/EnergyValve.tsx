import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom'; // <--- MAGIC FIX
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store';
import { Battery, Feather, Lock, ArrowRight, ShieldCheck, X } from 'lucide-react';

export const EnergyValve = () => {
    const { isPremium, setEnergyLevel, currentEnergyLevel, microHabits, currentHabitIndex } = useStore();
    const [showTeaseModal, setShowTeaseModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    // UseEffect to handle client-side mounting for the Portal
    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const isCrisisActive = currentEnergyLevel === 'low';

    // Logic to simulate the "Easy Mode" text
    const currentHabitText = microHabits[currentHabitIndex] || "Current Task";
    const easyHabitText = currentHabitText.includes("Tiny Version")
        ? currentHabitText
        : "Tiny Version: " + currentHabitText.split(" ").slice(0, 3).join(" ") + "...";

    const handleValveClick = () => {
        if (isPremium) {
            setEnergyLevel(isCrisisActive ? 'medium' : 'low');
        } else {
            setShowTeaseModal(true);
        }
    };

    return (
        <>
            {/* 🟢 THE COMPACT PILL (Stays in the Dashboard flow) */}
            <motion.button
                layout
                onClick={handleValveClick}
                className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all text-xs font-medium backdrop-blur-md
          ${isCrisisActive
                        ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
                        : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80'}
        `}
            >
                {isCrisisActive ? <Feather size={12} /> : <Battery size={12} />}
                <span>{isCrisisActive ? "Mode: Healing" : "Energy Check"}</span>
                {!isPremium && !isCrisisActive && (
                    <Lock size={10} className="ml-1 opacity-50" />
                )}
            </motion.button>

            {/* 🔒 THE MODAL (Teleported to document.body) */}
            {mounted && createPortal(
                <AnimatePresence>
                    {showTeaseModal && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">

                            {/* 1. The Backdrop (Blurred & Darkened) */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowTeaseModal(false)}
                                className="absolute inset-0 bg-black/60 backdrop-blur-md" // <--- SEXY BLUR HERE
                            />

                            {/* 2. The Modal Content */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden z-10 ring-1 ring-white/5"
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setShowTeaseModal(false)}
                                    className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>

                                {/* Header */}
                                <div className="text-center mb-6">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 mb-4 ring-1 ring-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                        <Feather size={24} />
                                    </div>
                                    <h2 className="text-xl font-bold text-white mb-2">Too tired today?</h2>
                                    <p className="text-white/60 text-sm px-4 leading-relaxed">
                                        Don't break your streak. Let me handle the heavy lifting for you.
                                    </p>
                                </div>

                                {/* The Comparison Visual */}
                                <div className="flex items-center justify-between gap-2 mb-8 relative">
                                    {/* Current */}
                                    <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 opacity-40 blur-[1px] select-none">
                                        <div className="h-2 w-8 bg-white/20 rounded mb-2"></div>
                                        <div className="h-2 w-16 bg-white/20 rounded"></div>
                                        <div className="mt-2 text-[10px] text-white/40">Current Task</div>
                                    </div>

                                    {/* Arrow */}
                                    <div className="z-10 bg-black border border-white/10 rounded-full p-1 shadow-lg">
                                        <ArrowRight size={14} className="text-white/50" />
                                    </div>

                                    {/* Tiny Version */}
                                    <div className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 relative overflow-hidden shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                                        <div className="absolute inset-0 bg-blue-500/5 animate-pulse"></div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Feather size={12} className="text-blue-400" />
                                            <span className="text-[10px] font-bold text-blue-300">Auto-Shrink</span>
                                        </div>
                                        <div className="text-xs text-white/90 font-medium leading-tight line-clamp-2">
                                            {easyHabitText}
                                        </div>
                                    </div>
                                </div>

                                {/* CTA Buttons */}
                                <div className="space-y-3">
                                    <button
                                        className="w-full py-3.5 bg-white text-black font-bold rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                        onClick={() => console.log("Trigger Payment")}
                                    >
                                        <ShieldCheck size={18} />
                                        Activate Safety Net ($5/mo)
                                    </button>
                                    <button
                                        onClick={() => setShowTeaseModal(false)}
                                        className="w-full py-2 text-white/30 text-xs hover:text-white transition-colors"
                                    >
                                        No thanks, I'll push through.
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body // 👈 This teleports the modal to the body
            )}
        </>
    );
};