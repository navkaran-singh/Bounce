import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, X } from 'lucide-react';
import { usePlatform } from '../hooks/usePlatform';

export const InstallPrompt = () => {
    // ✅ FIX: Destructure the specific booleans from your new hook
    const { isIOS, isPWA } = usePlatform();
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // 👇 DEBUG: Set this to TRUE to see the modal on your computer immediately.
        //    Set to FALSE when you are ready to deploy.
        const FORCE_DEBUG_MODE = false;

        const hasSeenPrompt = localStorage.getItem('bounce_install_prompt');

        if (FORCE_DEBUG_MODE) {
            setTimeout(() => setShowPrompt(true), 1000);
        }
        // Real Logic: Only show on iOS Browser (not App, not Android)
        else if (isIOS && !isPWA && !hasSeenPrompt) {
            setTimeout(() => setShowPrompt(true), 2000);
        }
    }, [isIOS, isPWA]);

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('bounce_install_prompt', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none pb-6 px-4">

                    {/* Backdrop */}
                    {/* <motion.div className="absolute inset-0 bg-black/20" /> */}

                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="pointer-events-auto w-full max-w-sm bg-[#1c1c1e] border border-white/10 rounded-2xl p-5 shadow-2xl relative"
                    >
                        <button
                            onClick={handleDismiss}
                            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white"
                        >
                            <X size={16} />
                        </button>

                        <div className="flex items-start gap-4">
                            {/* App Icon Preview - Ensure this file exists in /public */}
                            <div className="w-12 h-12 rounded-xl bg-black border border-white/10 overflow-hidden shrink-0">
                                <img src="/pwa-192x192.png" alt="App Icon" className="w-full h-full object-cover" />
                            </div>

                            <div>
                                <h3 className="font-bold text-white text-sm">Install Bounce</h3>
                                <p className="text-white/60 text-xs mt-1 leading-relaxed">
                                    Install this app on your home screen for the full full-screen experience.
                                </p>
                            </div>
                        </div>

                        {/* The Tutorial Steps */}
                        <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
                            <div className="flex items-center gap-3 text-sm text-white/80">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">1</span>
                                {/* The Share Icon inside the text */}
                                <span>
                                    Tap the <Share size={14} className="inline mx-1 text-primary-cyan" /> Share button below
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-white/80">
                                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/10 text-xs font-bold">2</span>
                                <span>Select <span className="font-bold text-white">Add to Home Screen</span></span>
                            </div>
                        </div>

                        {/* Pointing Arrow */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#1c1c1e] rotate-45 border-b border-r border-white/10"></div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};