import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Sparkles, RefreshCw, X, Check } from 'lucide-react';
import { useStore } from '../store';

/**
 * MaintenanceCompletionModal
 * 
 * Celebration modal shown when a user reaches 6+ weeks in MAINTENANCE stage.
 * Offers three paths forward:
 * 1. Deepen It - Reset maintenance cycle, let AI evolve habits next week
 * 2. Evolve It - Use AI-suggested advanced identity or write custom
 * 3. Start New - Trigger full identity change flow (onboarding)
 */

export const MaintenanceCompletionModal: React.FC = () => {
    const maintenanceComplete = useStore(state => state.maintenanceComplete);
    const weeklyReview = useStore(state => state.weeklyReview);
    const identity = useStore(state => state.identity);
    const handleDeepenIdentity = useStore(state => state.handleDeepenIdentity);
    const handleEvolveIdentity = useStore(state => state.handleEvolveIdentity);
    const handleStartNewIdentity = useStore(state => state.handleStartNewIdentity);

    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customIdentity, setCustomIdentity] = useState('');

    if (!maintenanceComplete) return null;

    const advancedIdentity = weeklyReview?.advancedIdentity || null;

    const handleDeepen = () => {
        handleDeepenIdentity();
    };

    const handleEvolveWithSuggestion = () => {
        if (advancedIdentity) {
            handleEvolveIdentity(advancedIdentity);
        }
    };

    const handleEvolveWithCustom = () => {
        if (customIdentity.trim()) {
            handleEvolveIdentity(customIdentity.trim());
        }
    };

    const handleStartNew = () => {
        handleStartNewIdentity();
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative w-full max-w-sm bg-gradient-to-b from-amber-900/30 to-dark-900 border border-amber-500/30 rounded-3xl p-6 shadow-2xl"
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                            <Trophy className="w-8 h-8 text-amber-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            You've Embodied This Identity
                        </h2>
                        <p className="text-sm text-white/60">
                            "{identity}" is now part of who you are.
                        </p>
                        <p className="text-xs text-white/40 mt-2">
                            What's next on your journey?
                        </p>
                    </div>

                    {/* Three Paths */}
                    <div className="space-y-3">
                        {/* PATH 1: Deepen It */}
                        <button
                            onClick={handleDeepen}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-emerald-500/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                                        Deepen It
                                    </p>
                                    <p className="text-xs text-white/50">
                                        Master this identity further
                                    </p>
                                </div>
                            </div>
                        </button>

                        {/* PATH 2: Evolve It */}
                        {!showCustomInput ? (
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                                        <Sparkles className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">Evolve It</p>
                                        <p className="text-xs text-white/50">
                                            Level up to an advanced identity
                                        </p>
                                    </div>
                                </div>

                                {advancedIdentity && (
                                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                        <p className="text-xs text-white/50 mb-1">Suggested:</p>
                                        <p className="text-sm font-medium text-purple-300">
                                            "{advancedIdentity}"
                                        </p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {advancedIdentity && (
                                        <button
                                            onClick={handleEvolveWithSuggestion}
                                            className="flex-1 py-2 px-3 rounded-lg bg-purple-500/20 text-purple-300 text-xs font-medium hover:bg-purple-500/30 transition-colors"
                                        >
                                            Use Suggestion
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setShowCustomInput(true)}
                                        className="flex-1 py-2 px-3 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/20 transition-colors"
                                    >
                                        Write My Own
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-white/5 border border-purple-500/30 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="font-bold text-white text-sm">Enter new identity</p>
                                    <button
                                        onClick={() => setShowCustomInput(false)}
                                        className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        <X className="w-4 h-4 text-white/50" />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={customIdentity}
                                    onChange={(e) => setCustomIdentity(e.target.value)}
                                    placeholder="e.g., A marathon runner"
                                    className="w-full px-3 py-2 rounded-lg bg-dark-900 border border-white/20 text-white text-sm placeholder:text-white/30 focus:border-purple-500/50 focus:outline-none"
                                    autoFocus
                                />
                                <button
                                    onClick={handleEvolveWithCustom}
                                    disabled={!customIdentity.trim()}
                                    className="w-full py-2 rounded-lg bg-purple-500/30 text-purple-300 text-sm font-medium hover:bg-purple-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" />
                                    Confirm
                                </button>
                            </div>
                        )}

                        {/* PATH 3: Start New */}
                        <button
                            onClick={handleStartNew}
                            className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/30 transition-all text-left group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                    <RefreshCw className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="font-bold text-white group-hover:text-blue-300 transition-colors">
                                        Start Something New
                                    </p>
                                    <p className="text-xs text-white/50">
                                        Begin a fresh identity journey
                                    </p>
                                </div>
                            </div>
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
