import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint, Lock, Info, RotateCcw, AlertTriangle } from 'lucide-react';
import { useStore } from '../store';

export const Contract: React.FC = () => {
  const { setView, identity, resetProgress } = useStore();
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const intervalRef = useRef<any>(null);

  // Check for first-time tutorial on mount
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('bounce_contract_tutorial_seen');
    if (!hasSeenTutorial) {
      // Small delay for smoother entrance
      setTimeout(() => setShowTutorial(true), 500);
    }
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('bounce_contract_tutorial_seen', 'true');
  };

  // Auto-dismiss tooltip after 5 seconds
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showTooltip) {
      timer = setTimeout(() => {
        setShowTooltip(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [showTooltip]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Fallback or ignore
      }
    }
  };

  const startHold = () => {
    setIsHolding(true);
    let p = 0;

    triggerHaptic(10); // Initial touch

    intervalRef.current = setInterval(() => {
      p += 1;
      setProgress(p);

      // Staged Haptic Feedback
      if (p < 30) {
        if (p % 20 === 0) triggerHaptic(10);
      } else if (p < 60) {
        if (p % 10 === 0) triggerHaptic(15);
      } else if (p < 90) {
        if (p % 5 === 0) triggerHaptic(25);
      } else {
        if (p % 3 === 0) triggerHaptic([30]);
      }

      if (p >= 100) {
        completeContract();
      }
    }, 30); // 30ms tick * 100 = 3000ms (3 seconds)
  };

  const stopHold = () => {
    if (progress >= 100) return; // Don't reset if completed
    setIsHolding(false);
    clearInterval(intervalRef.current);
    setProgress(0);
    triggerHaptic(10); // Release feedback
  };

  const completeContract = () => {
    clearInterval(intervalRef.current);
    setIsHolding(false);
    // Success haptic pattern: Pulse, pause, heavy pulse
    triggerHaptic([50, 50, 100]);

    setTimeout(() => {
      setView('dashboard');
    }, 1000);
  };

  return (
    <div className="h-full flex flex-col relative bg-[#0F0F10] overflow-hidden">

      {/* Reset Button (Top Right) */}
      <motion.button
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        onClick={() => setShowResetConfirm(true)}
        className="absolute top-6 right-6 p-2 text-white/20 hover:text-white/60 transition-colors rounded-full hover:bg-white/5 z-50"
      >
        <RotateCcw size={20} />
      </motion.button>

      {/* Main Content Container */}
      <div className="flex flex-col items-center justify-between flex-grow p-6 w-full h-full">

        {/* Header Section */}
        <div className="w-full mt-12 text-center space-y-4 z-10 relative">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60"
          >
            Seal Your Commitment
          </motion.h1>

          {/* Identity Line with Tooltip */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="relative text-lg text-white/70 flex flex-col items-center justify-center"
          >
            <span>Starting today, I am</span>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-primary-cyan font-semibold text-2xl tracking-wide">{identity || "focused"}</span>
              <button
                onClick={() => setShowTooltip(!showTooltip)}
                className="text-white/30 hover:text-primary-cyan transition-colors outline-none"
              >
                <Info size={18} />
              </button>

              {/* Tooltip Bubble */}
              <AnimatePresence>
                {showTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute top-full mt-3 w-64 p-3 bg-dark-800/90 backdrop-blur-xl border border-white/10 rounded-xl text-sm text-white/80 shadow-xl z-50"
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-dark-800/90 rotate-45 border-l border-t border-white/10" />
                    This identity anchors your daily micro-habit. It's not just what you do, but who you are becoming.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Interactive Area (Centered) */}
        <div className="flex flex-col items-center justify-center flex-grow my-10 w-full">
          <div className="relative flex items-center justify-center w-64 h-64">

            {/* Progress Ring SVG */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 256 256">
              <circle
                cx="128" cy="128" r="120"
                stroke="currentColor" strokeWidth="4"
                fill="none" className="text-white/10"
              />
              <motion.circle
                cx="128" cy="128" r="120"
                stroke="url(#gradient)" strokeWidth="8"
                fill="none" strokeLinecap="round"
                style={{ pathLength: progress / 100 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0dccf2" />
                  <stop offset="100%" stopColor="#7F00FF" />
                </linearGradient>
              </defs>
            </svg>

            {/* Thumbprint Button */}
            <motion.button
              className="relative w-40 h-40 rounded-full bg-dark-800 border border-white/10 flex items-center justify-center touch-none outline-none select-none"
              onMouseDown={startHold}
              onMouseUp={stopHold}
              onMouseLeave={stopHold}
              onTouchStart={(e) => { e.preventDefault(); startHold(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopHold(); }}
              whileTap={{ scale: 0.95 }}
              animate={{
                // Dynamic glow: Grows larger and brighter as progress increases
                boxShadow: isHolding
                  ? `0 0 ${30 + progress}px ${5 + progress / 4}px rgba(13, 204, 242, ${0.3 + progress / 200})`
                  : "0 0 0px 0px rgba(13, 204, 242, 0)",
                // Dynamic pulse
                scale: isHolding ? [1, 1.02 + (progress / 800), 1] : 1
              }}
              transition={{
                boxShadow: { duration: 0.1 },
                scale: {
                  duration: isHolding ? Math.max(0.2, 1 - (progress / 100) * 0.8) : 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-cyan/10 to-primary-purple/10" />

              {progress >= 100 ? (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 12 }}
                >
                  <Lock size={64} className="text-primary-cyan drop-shadow-[0_0_20px_rgba(13,204,242,1)]" />
                </motion.div>
              ) : (
                <motion.div>
                  {/* Fingerprint with dynamic glow filter */}
                  <Fingerprint
                    size={64}
                    className={`transition-all duration-300 ${isHolding ? 'text-white' : 'text-white/30'}`}
                    style={{
                      filter: isHolding
                        ? `drop-shadow(0 0 ${10 + progress / 4}px rgba(13, 204, 242, ${0.5 + progress / 200})) brightness(${1 + progress / 100})`
                        : 'none'
                    }}
                  />
                </motion.div>
              )}
            </motion.button>
          </div>
        </div>

        {/* Footer Section */}
        <div className="w-full mb-12 text-center">
          <p className="text-[#F5F5F5] text-base font-medium leading-normal pb-3 pt-1 px-4 tracking-wide">
            Sign the Contract
          </p>
          <p className="text-white/40 text-sm font-normal leading-normal pb-3 px-4">
            {isHolding ? "Hold to Sign..." : "Press and Hold to Sign"}
          </p>
        </div>
      </div>

      {/* First-time Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissTutorial}
            className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center cursor-pointer"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-xs"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content area if preferred, but allow backdrop
            >
              <div className="w-20 h-20 bg-primary-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-primary-cyan/10">
                <Fingerprint size={40} className="text-primary-cyan animate-pulse" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Seal the Deal</h3>
              <p className="text-white/70 text-base leading-relaxed mb-8">
                Press and hold the fingerprint scanner to sign your contract and begin your journey.
              </p>
              <button
                onClick={dismissTutorial}
                className="px-8 py-3 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-dark-900/95 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }}
              className="bg-dark-800 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="flex justify-center mb-4 text-red-400">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-xl font-bold text-white text-center mb-2">Start Over?</h3>
              <p className="text-white/60 text-center mb-6 text-sm">
                This will discard your current identity selection and take you back to the conversation.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white hover:bg-white/10 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowResetConfirm(false);
                    resetProgress();
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 font-medium transition-colors"
                >
                  Reset
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};