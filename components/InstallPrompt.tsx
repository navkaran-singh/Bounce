import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, X, Smartphone } from 'lucide-react';

// 🔧 Compute platform flags dynamically (for browser DevTools device switching)
const getPlatformFlags = () => {
    if (typeof window === 'undefined') {
        return { isIOS: false, isAndroid: false, isPWA: false, isDesktop: true };
    }
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
    const isDesktop = !isIOS && !isAndroid;

    return { isIOS, isAndroid, isPWA, isDesktop };
};

const TUTORIAL_COMPLETED_KEY = 'bounce_tutorial_completed';
const INSTALL_PROMPT_SEEN_KEY = 'bounce_install_prompt_dismissed_at';
const PROMPT_RESET_HOURS = 48; // Show again after 2 days

// Check if enough time has passed since last dismissal
const shouldShowAgain = (): boolean => {
    const dismissedAt = localStorage.getItem(INSTALL_PROMPT_SEEN_KEY);
    if (!dismissedAt) return true; // Never dismissed

    // Handle legacy 'true' values or invalid timestamps - show again
    const timestamp = parseInt(dismissedAt, 10);
    if (isNaN(timestamp)) return true;

    const hoursSince = (Date.now() - timestamp) / (1000 * 60 * 60);
    return hoursSince >= PROMPT_RESET_HOURS;
};

export const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [platform, setPlatform] = useState(getPlatformFlags);

    // Re-compute platform on mount (catches browser DevTools device switching)
    useEffect(() => {
        setPlatform(getPlatformFlags());
    }, []);

    const { isIOS, isAndroid, isPWA, isDesktop } = platform;

    // Track if user has dismissed (check if 2 days have passed)
    const [isDismissed, setIsDismissed] = useState(() => !shouldShowAgain());

    useEffect(() => {
        // 👇 DEBUG: Set this to TRUE to see the modal on your computer immediately.
        const FORCE_DEBUG_MODE = false;

        // Don't show if: already dismissed (within 2 days), already PWA, or already shown
        if (isDismissed || isPWA) return;

        const hasTutorialCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY);

        if (FORCE_DEBUG_MODE) {
            setTimeout(() => setShowPrompt(true), 1000);
            return;
        }

        // ✨ KEY FIX: Only show AFTER tutorial is completed + 10 second delay
        if (!hasTutorialCompleted) {
            // Set up a listener for when tutorial completes
            const checkTutorial = () => {
                // Re-check dismissed state in case user dismissed while we were polling
                if (!shouldShowAgain()) return;
                if (localStorage.getItem(TUTORIAL_COMPLETED_KEY)) {
                    setTimeout(() => {
                        // Final check before showing
                        if (shouldShowAgain()) {
                            setShowPrompt(true);
                        }
                    }, 10000);
                }
            };

            // Poll for tutorial completion
            const interval = setInterval(checkTutorial, 2000);
            window.addEventListener('storage', checkTutorial);

            return () => {
                clearInterval(interval);
                window.removeEventListener('storage', checkTutorial);
            };
        } else {
            // Tutorial already done - show after 10 seconds
            const timer = setTimeout(() => setShowPrompt(true), 10000);
            return () => clearTimeout(timer);
        }
    }, [isPWA, isDismissed]);

    const handleDismiss = () => {
        setShowPrompt(false);
        setIsDismissed(true); // Prevent polling from re-triggering
        localStorage.setItem(INSTALL_PROMPT_SEEN_KEY, Date.now().toString()); // Store timestamp
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none pb-6 px-4">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="pointer-events-auto w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-2xl p-5 shadow-2xl relative"
                    >
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-start gap-4">
                            {/* App Icon */}
                            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                                <img src="/pwa-192x192.png" alt="App Icon" className="w-full h-full object-cover" />
                            </div>

                            <div>
                                {/* iOS-specific messaging */}
                                {isIOS && (
                                    <>
                                        <h3 className="font-bold text-white text-sm">Don't lose your focus</h3>
                                        <p className="text-white/60 text-xs mt-1 leading-relaxed">
                                            Add Bounce to your home screen for full-screen focus and instant access.
                                        </p>
                                    </>
                                )}

                                {/* Android-specific messaging */}
                                {isAndroid && (
                                    <>
                                        <h3 className="font-bold text-white text-sm">Make Bounce part of your day</h3>
                                        <p className="text-white/60 text-xs mt-1 leading-relaxed">
                                            Get the full app experience with offline access and faster performance.
                                        </p>
                                    </>
                                )}

                                {/* Desktop-specific messaging */}
                                {isDesktop && (
                                    <>
                                        <h3 className="font-bold text-white text-sm flex items-center gap-2">
                                            <Smartphone size={14} className="text-primary-cyan" />
                                            Best on mobile
                                        </h3>
                                        <p className="text-white/60 text-xs mt-1 leading-relaxed">
                                            Bounce works great on desktop, but it's designed for your phone - track habits on the go.
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Platform-specific instructions */}
                        {isIOS && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold shrink-0">1</span>
                                    <span>
                                        Tap <Share size={14} className="inline mx-1 text-primary-cyan" /> Share button
                                    </span>
                                </div>
                                <div className="flex items-start gap-3 text-sm text-white/80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold shrink-0 mt-0.5">2</span>
                                    <div className="flex flex-col">
                                        <span>Scroll down & select <span className="font-bold text-white">Add to Home Screen</span></span>
                                        <span className="text-[10px] text-white/40 mt-1">If missing, tap 'Edit Actions' at bottom</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold shrink-0">3</span>
                                    <span>Tap <span className="font-bold text-white">Add</span> (top right)</span>
                                </div>
                            </div>
                        )}

                        {isAndroid && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold shrink-0">1</span>
                                    <span>
                                        Tap the <span className="inline-flex items-center mx-1 font-bold">⋮</span> menu
                                    </span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold shrink-0">2</span>
                                    <span>Scroll down & select <span className="font-bold text-white">Add to Home screen</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold shrink-0">3</span>
                                    <span>Tap <span className="font-bold text-white">Install</span></span>
                                </div>
                            </div>
                        )}

                        {isDesktop && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-xs text-white/50 text-center">
                                    Open this site on your phone for the best experience
                                </p>
                            </div>
                        )}

                        {/* Pointing Arrow */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1c1c1e] rotate-45 border-b border-r border-white/10"></div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};