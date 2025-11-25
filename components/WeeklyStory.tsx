
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Share2, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { useStore } from '../store';

export const WeeklyStory: React.FC = () => {
    const { weeklyInsights, markReviewViewed } = useStore();
    
    // Get the latest unviewed insight
    const activeInsight = weeklyInsights.find(i => !i.viewed);
    const [step, setStep] = useState(0);

    if (!activeInsight) return null;

    const handleNext = () => {
        if (step < activeInsight.story.length + 1) { // +1 for summary card
            setStep(step + 1);
        } else {
            markReviewViewed(activeInsight.id);
        }
    };

    const progress = ((step + 1) / (activeInsight.story.length + 2)) * 100;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center sm:p-4"
            >
                {/* Mobile-style Story Container */}
                <div className="w-full h-full sm:max-w-md sm:h-[80vh] sm:rounded-3xl bg-dark-900 relative overflow-hidden flex flex-col">
                    
                    {/* Progress Bar */}
                    <div className="absolute top-4 left-4 right-4 flex gap-1 z-20">
                        {Array.from({ length: activeInsight.story.length + 2 }).map((_, i) => (
                            <div key={i} className="h-1 bg-white/20 rounded-full flex-1 overflow-hidden">
                                <motion.div 
                                    className="h-full bg-white"
                                    initial={{ width: 0 }}
                                    animate={{ width: i < step ? '100%' : i === step ? '100%' : '0%' }}
                                    transition={{ duration: i === step ? 5 : 0, ease: "linear" }}
                                    onAnimationComplete={() => {
                                        if (i === step && step < activeInsight.story.length + 1) handleNext();
                                    }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Content Layer */}
                    <div className="flex-1 relative" onClick={handleNext}>
                        {/* Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-cyan/20 to-primary-purple/20 opacity-50" />
                        
                        {/* Story Steps */}
                        {step < activeInsight.story.length ? (
                             <motion.div 
                                key={step}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
                             >
                                 <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
                                     {activeInsight.story[step]}
                                 </h2>
                             </motion.div>
                        ) : step === activeInsight.story.length ? (
                             // Pattern Card
                             <motion.div 
                                key="pattern"
                                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-primary-purple/20"
                             >
                                <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <TrendingDown size={40} className="text-white" />
                                </div>
                                <h3 className="text-white/50 text-sm font-bold uppercase tracking-widest mb-2">Pattern Detected</h3>
                                <h2 className="text-2xl font-bold text-white mb-6">{activeInsight.pattern}</h2>
                                <p className="text-white/80 text-lg">"{activeInsight.suggestion}"</p>
                             </motion.div>
                        ) : (
                             // Summary/Action Card
                             <motion.div 
                                key="summary"
                                className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-primary-cyan/10"
                             >
                                <Sparkles size={64} className="text-primary-cyan mb-6" />
                                <h2 className="text-3xl font-bold text-white mb-8">Ready for next week?</h2>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); markReviewViewed(activeInsight.id); }}
                                    className="px-8 py-4 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
                                >
                                    Let's Bounce
                                </button>
                             </motion.div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button 
                        onClick={() => markReviewViewed(activeInsight.id)}
                        className="absolute top-8 right-6 z-30 text-white/50 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};
