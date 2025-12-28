import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

interface TutorialStep {
    id: string;
    target: string; // CSS selector or data attribute
    title: string;
    description: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'center';
    emoji: string;
    color?: 'cyan' | 'purple' | 'yellow' | 'emerald' | 'blue'; // accent color
}

const TUTORIAL_STEPS: TutorialStep[] = [
    {
        id: 'welcome',
        target: '',
        title: 'Welcome to Bounce! 👋',
        description: 'Let me show you around. This quick tour will help you master your new habit system.',
        position: 'center',
        emoji: '🎉',
        color: 'cyan',
    },
    {
        id: 'habit-card',
        target: '[data-tutorial="habit-card"]',
        title: 'Your Micro-Habit',
        description: 'This is your current habit. We show you tiny, achievable actions based on your energy level.',
        position: 'top',
        emoji: '🎯',
        color: 'cyan',
    },
    {
        id: 'edit-habit',
        target: '[data-tutorial="habit-text"]',
        title: 'Customize Your Habit',
        description: 'Hold the habit text to edit it. Make it personal and tailored to your style!',
        position: 'top',
        emoji: '✏️',
        color: 'purple',
    },
    {
        id: 'complete-button',
        target: '[data-tutorial="complete-button"]',
        title: 'Hold to Complete',
        description: 'Press and hold this button to mark your habit done. Feel the satisfying haptic feedback!',
        position: 'top',
        emoji: '✋',
        color: 'emerald',
    },
    {
        id: 'shuffle-button',
        target: '[data-tutorial="shuffle-button"]',
        title: 'Shuffle Habits',
        description: 'Not feeling this habit? Tap to shuffle through your deck and find one that fits.',
        position: 'left',
        emoji: '🎲',
        color: 'purple',
    },
    {
        id: 'energy-button',
        target: '[data-tutorial="energy-button"]',
        title: 'Set Your Energy',
        description: 'How are you feeling today? Pick High, Medium, or Low — we\'ll serve the right habit for your state.',
        position: 'bottom',
        emoji: '🔋',
        color: 'yellow',
    },
    {
        id: 'resilience-score',
        target: '[data-tutorial="resilience-score"]',
        title: 'Resilience Score',
        description: 'This shows how consistent you\'ve been. Complete habits daily to grow your resilience!',
        position: 'bottom',
        emoji: '💪',
        color: 'cyan',
    },
    {
        id: 'done',
        target: '',
        title: 'You\'re Ready!',
        description: 'Start with one small habit. Consistency beats intensity. Let\'s build who you want to become!',
        position: 'center',
        emoji: '🚀',
        color: 'emerald',
    },
];

const STORAGE_KEY = 'bounce_tutorial_completed';

// Get element position on screen
const getElementPosition = (selector: string) => {
    if (!selector) return null;
    const element = document.querySelector(selector);
    if (!element) return null;
    const rect = element.getBoundingClientRect();
    return {
        top: rect.top,
        left: rect.left,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
    };
};

export const TutorialModal: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState<ReturnType<typeof getElementPosition>>(null);

    const step = TUTORIAL_STEPS[currentStep];
    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
    const isCenterStep = step.position === 'center';

    // Dynamic color classes based on step
    const colorClasses = {
        cyan: {
            glow: 'bg-cyan-500/15',
            border: 'border-cyan-500/30',
            shadow: 'shadow-cyan-900/20',
            innerGlow: 'from-cyan-500/10',
            iconGlow: 'bg-cyan-500/40',
            iconBg: 'bg-cyan-500/10 border-cyan-500/30',
            iconShadow: 'shadow-[0_0_15px_rgba(6,182,212,0.3)]',
            sparkle: 'text-cyan-400',
        },
        purple: {
            glow: 'bg-purple-500/15',
            border: 'border-purple-500/30',
            shadow: 'shadow-purple-900/20',
            innerGlow: 'from-purple-500/10',
            iconGlow: 'bg-purple-500/40',
            iconBg: 'bg-purple-500/10 border-purple-500/30',
            iconShadow: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]',
            sparkle: 'text-purple-400',
        },
        yellow: {
            glow: 'bg-yellow-500/15',
            border: 'border-yellow-500/30',
            shadow: 'shadow-yellow-900/20',
            innerGlow: 'from-yellow-500/10',
            iconGlow: 'bg-yellow-500/40',
            iconBg: 'bg-yellow-500/10 border-yellow-500/30',
            iconShadow: 'shadow-[0_0_15px_rgba(234,179,8,0.3)]',
            sparkle: 'text-yellow-400',
        },
        emerald: {
            glow: 'bg-emerald-500/15',
            border: 'border-emerald-500/30',
            shadow: 'shadow-emerald-900/20',
            innerGlow: 'from-emerald-500/10',
            iconGlow: 'bg-emerald-500/40',
            iconBg: 'bg-emerald-500/10 border-emerald-500/30',
            iconShadow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
            sparkle: 'text-emerald-400',
        },
        blue: {
            glow: 'bg-blue-500/15',
            border: 'border-blue-500/30',
            shadow: 'shadow-blue-900/20',
            innerGlow: 'from-blue-500/10',
            iconGlow: 'bg-blue-500/40',
            iconBg: 'bg-blue-500/10 border-blue-500/30',
            iconShadow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
            sparkle: 'text-blue-400',
        },
    };
    const colors = colorClasses[step.color || 'cyan'];

    // Update target element position
    const updateTargetPosition = useCallback(() => {
        if (step.target) {
            const rect = getElementPosition(step.target);
            setTargetRect(rect);
        } else {
            setTargetRect(null);
        }
    }, [step.target]);

    // Check if tutorial should show on mount
    useEffect(() => {
        const hasCompleted = localStorage.getItem(STORAGE_KEY);
        if (!hasCompleted) {
            const timer = setTimeout(() => setIsOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    // Update position when step changes or on resize
    useEffect(() => {
        if (!isOpen) return;

        updateTargetPosition();

        // Update on resize/scroll
        window.addEventListener('resize', updateTargetPosition);
        window.addEventListener('scroll', updateTargetPosition, true);

        return () => {
            window.removeEventListener('resize', updateTargetPosition);
            window.removeEventListener('scroll', updateTargetPosition, true);
        };
    }, [isOpen, currentStep, updateTargetPosition]);

    const completeTutorial = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsOpen(false);
    };

    const nextStep = () => {
        if (isLastStep) {
            completeTutorial();
        } else {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const skipTutorial = () => {
        completeTutorial();
    };

    // Calculate tooltip position with improved mobile handling
    const getTooltipStyle = (): React.CSSProperties => {
        const padding = 16;
        const tooltipWidth = Math.min(320, window.innerWidth - padding * 2);

        // For center steps or when no target, center the tooltip using flexbox
        if (!targetRect || isCenterStep) {
            return {
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: `${padding}px`,
                pointerEvents: 'none',
            };
        }

        // Calculate safe horizontal position (always within viewport)
        const safeLeft = Math.max(
            padding,
            Math.min(
                targetRect.centerX - tooltipWidth / 2,
                window.innerWidth - tooltipWidth - padding
            )
        );

        // For mobile, prefer top/bottom positioning over left/right
        const isMobile = window.innerWidth < 640;
        let effectivePosition = step.position;

        // On mobile, convert left/right to top/bottom based on available space
        if (isMobile && (step.position === 'left' || step.position === 'right')) {
            // If element is in top half, show tooltip below; otherwise above
            effectivePosition = targetRect.centerY < window.innerHeight / 2 ? 'bottom' : 'top';
        }

        switch (effectivePosition) {
            case 'top':
                return {
                    position: 'fixed',
                    bottom: `${window.innerHeight - targetRect.top + padding}px`,
                    left: `${safeLeft}px`,
                    width: tooltipWidth,
                    maxWidth: `calc(100vw - ${padding * 2}px)`,
                };
            case 'bottom':
                return {
                    position: 'fixed',
                    top: `${targetRect.bottom + padding}px`,
                    left: `${safeLeft}px`,
                    width: tooltipWidth,
                    maxWidth: `calc(100vw - ${padding * 2}px)`,
                };
            case 'left': {
                // Check if there's enough space on the left
                const spaceLeft = targetRect.left - padding;
                if (spaceLeft < tooltipWidth) {
                    // Not enough space, position below instead
                    return {
                        position: 'fixed',
                        top: `${targetRect.bottom + padding}px`,
                        left: `${safeLeft}px`,
                        width: tooltipWidth,
                        maxWidth: `calc(100vw - ${padding * 2}px)`,
                    };
                }
                return {
                    position: 'fixed',
                    top: `${Math.max(padding, Math.min(targetRect.centerY - 100, window.innerHeight - 220))}px`,
                    right: `${window.innerWidth - targetRect.left + padding}px`,
                    width: Math.min(tooltipWidth, spaceLeft - padding),
                    maxWidth: `calc(100vw - ${padding * 2}px)`,
                };
            }
            case 'right': {
                // Check if there's enough space on the right
                const spaceRight = window.innerWidth - targetRect.right - padding;
                if (spaceRight < tooltipWidth) {
                    // Not enough space, position below instead
                    return {
                        position: 'fixed',
                        top: `${targetRect.bottom + padding}px`,
                        left: `${safeLeft}px`,
                        width: tooltipWidth,
                        maxWidth: `calc(100vw - ${padding * 2}px)`,
                    };
                }
                return {
                    position: 'fixed',
                    top: `${Math.max(padding, Math.min(targetRect.centerY - 100, window.innerHeight - 220))}px`,
                    left: `${targetRect.right + padding}px`,
                    width: Math.min(tooltipWidth, spaceRight - padding),
                    maxWidth: `calc(100vw - ${padding * 2}px)`,
                };
            }
            default:
                return {
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: tooltipWidth,
                    maxWidth: `calc(100vw - ${padding * 2}px)`,
                };
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100]"
            >
                {/* Overlay with spotlight cutout */}
                <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    <defs>
                        <mask id="spotlight-mask">
                            <rect x="0" y="0" width="100%" height="100%" fill="white" />
                            {targetRect && !isCenterStep && (
                                <motion.ellipse
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    cx={targetRect.centerX}
                                    cy={targetRect.centerY}
                                    rx={Math.max(targetRect.width, 60) / 2 + 20}
                                    ry={Math.max(targetRect.height, 60) / 2 + 20}
                                    fill="black"
                                />
                            )}
                        </mask>

                        {/* Glow filter for the spotlight edge */}
                        <filter id="spotlight-glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Dark overlay with cutout */}
                    <motion.rect
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.85 }}
                        x="0"
                        y="0"
                        width="100%"
                        height="100%"
                        fill="#000"
                        mask="url(#spotlight-mask)"
                        style={{ pointerEvents: 'auto' }}
                    />
                </svg>

                {/* Spotlight ring animation */}
                {targetRect && !isCenterStep && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{
                            opacity: [0.4, 0.8, 0.4],
                            scale: [1, 1.05, 1],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                        className="absolute pointer-events-none"
                        style={{
                            left: targetRect.centerX - Math.max(targetRect.width, 60) / 2 - 24,
                            top: targetRect.centerY - Math.max(targetRect.height, 60) / 2 - 24,
                            width: Math.max(targetRect.width, 60) + 48,
                            height: Math.max(targetRect.height, 60) + 48,
                            borderRadius: '50%',
                            border: '2px solid rgba(6, 182, 212, 0.6)',
                            boxShadow: '0 0 30px rgba(6, 182, 212, 0.4), inset 0 0 30px rgba(6, 182, 212, 0.1)',
                        }}
                    />
                )}

                {/* Skip button */}
                <motion.button
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    onClick={skipTutorial}
                    className="absolute top-6 right-6 z-10 p-2 text-white/60 hover:text-white transition-colors rounded-full hover:bg-white/10"
                >
                    <X size={24} />
                </motion.button>

                {/* Tooltip Card */}
                <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.9 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={getTooltipStyle()}
                >
                    {/* Outer glow wrapper */}
                    <div className="relative">
                        {/* Ambient glow behind card - dynamic color */}
                        <div className={`absolute inset-0 ${colors.glow} blur-2xl rounded-3xl`} />

                        {/* Card with dynamic border accent */}
                        <div
                            className={`relative bg-[#050A0F] backdrop-blur-xl rounded-3xl border ${colors.border} shadow-2xl ${colors.shadow} overflow-hidden`}
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                pointerEvents: 'auto',
                            }}
                        >
                            {/* Subtle inner glow at top - dynamic color */}
                            <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b ${colors.innerGlow} to-transparent pointer-events-none`} />

                            <div className="relative p-5">
                                {/* Icon with glow */}
                                <motion.div
                                    initial={{ scale: 0, rotate: -20 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', delay: 0.1, damping: 12 }}
                                    className="relative mb-4 inline-block"
                                >
                                    {/* Pulsing glow behind icon - dynamic color */}
                                    <motion.div
                                        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                                        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                                        className={`absolute inset-0 rounded-xl ${colors.iconGlow} blur-xl`}
                                    />

                                    {/* Icon container - dynamic color */}
                                    <div className={`relative w-11 h-11 rounded-xl ${colors.iconBg} flex items-center justify-center ${colors.iconShadow}`}>
                                        <motion.span
                                            animate={{ y: [0, -2, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                                            className="text-xl"
                                        >
                                            {step.emoji}
                                        </motion.span>
                                    </div>

                                    {/* Sparkle - dynamic color */}
                                    <motion.div
                                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                                        transition={{
                                            rotate: { duration: 6, repeat: Infinity, ease: 'linear' },
                                            scale: { duration: 1.5, repeat: Infinity }
                                        }}
                                        className="absolute -top-1 -right-1"
                                    >
                                        <Sparkles size={10} className={colors.sparkle} />
                                    </motion.div>
                                </motion.div>

                                {/* Title */}
                                <motion.h3
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.15 }}
                                    className="text-lg font-bold text-white mb-1.5"
                                >
                                    {step.title}
                                </motion.h3>

                                {/* Description */}
                                <motion.p
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="text-cyan-100/60 text-sm leading-relaxed mb-5"
                                >
                                    {step.description}
                                </motion.p>

                                {/* Navigation */}
                                <div className="flex items-center justify-between">
                                    {/* Back button */}
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={prevStep}
                                        disabled={isFirstStep}
                                        className={`flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-all ${isFirstStep
                                            ? 'opacity-0 pointer-events-none'
                                            : 'text-white/50 hover:text-white hover:bg-white/5'
                                            }`}
                                    >
                                        <ChevronLeft size={16} />
                                        Back
                                    </motion.button>

                                    {/* Step counter */}
                                    <span className="text-xs text-white/40 font-medium">
                                        {currentStep + 1}/{TUTORIAL_STEPS.length}
                                    </span>

                                    {/* Next/Done button */}
                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={nextStep}
                                        className={`flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${isLastStep
                                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50'
                                            : 'bg-white/10 text-white border border-white/20 hover:bg-white/15'
                                            }`}
                                    >
                                        {isLastStep ? 'Get Started' : 'Next'}
                                        {isLastStep ? (
                                            <motion.span
                                                animate={{ x: [0, 3, 0] }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                            >
                                                🚀
                                            </motion.span>
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}
                                    </motion.button>
                                </div>
                            </div>

                            {/* Pointer arrow for non-center tooltips */}
                            {targetRect && !isCenterStep && window.innerWidth >= 640 && (
                                <div
                                    className={`absolute w-4 h-4 bg-[#050A0F] border-cyan-500/30 transform rotate-45 ${step.position === 'top' ? 'bottom-[-8px] left-1/2 -translate-x-1/2 border-r border-b' :
                                        step.position === 'bottom' ? 'top-[-8px] left-1/2 -translate-x-1/2 border-l border-t' :
                                            step.position === 'left' ? 'right-[-8px] top-1/2 -translate-y-1/2 border-t border-r' :
                                                'left-[-8px] top-1/2 -translate-y-1/2 border-b border-l'
                                        }`}
                                />
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

// Helper to reset tutorial (for testing)
export const resetTutorial = () => {
    localStorage.removeItem(STORAGE_KEY);
};