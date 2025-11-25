
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Plus } from 'lucide-react';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(25 * 60);
  const [customMinutes, setCustomMinutes] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(duration);
  };

  const handleCustomDuration = () => {
      const mins = parseInt(customMinutes);
      if (mins && mins > 0) {
          const secs = mins * 60;
          setDuration(secs);
          setTimeLeft(secs);
          setShowCustomInput(false);
          setCustomMinutes('');
      }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = 1 - (timeLeft / duration);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-dark-900/95 backdrop-blur-xl flex flex-col items-center justify-center"
        >
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white/50 hover:text-white transition-colors"
            >
                <X size={24} />
            </button>

            <div className="relative w-72 h-72 flex items-center justify-center mb-12">
                {/* Background Circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                    <motion.circle 
                        cx="50" cy="50" r="45" 
                        stroke="#0dccf2" strokeWidth="2" 
                        fill="none" strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: progress }}
                        transition={{ duration: 0.5, ease: "linear" }}
                    />
                </svg>
                
                {/* Time Display */}
                <div className="text-center z-10">
                    <div className="text-6xl font-mono font-light text-white tracking-tighter">
                        {formatTime(timeLeft)}
                    </div>
                    <p className="text-white/30 text-sm mt-2 font-medium tracking-widest uppercase">Deep Work</p>
                </div>

                {/* Pulsing Background */}
                {isActive && (
                    <motion.div 
                        className="absolute inset-0 rounded-full bg-primary-cyan/5 blur-3xl z-0"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    />
                )}
            </div>

            <div className="flex gap-6 mb-8">
                <button 
                    onClick={toggleTimer}
                    className="w-16 h-16 rounded-full bg-white text-dark-900 flex items-center justify-center hover:scale-110 transition-transform"
                >
                    {isActive ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                <button 
                    onClick={resetTimer}
                    className="w-16 h-16 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                    <RotateCcw size={24} />
                </button>
            </div>

            {/* Duration Selection */}
            {!isActive && (
                <div className="w-full max-w-xs flex flex-col items-center gap-3">
                    <div className="flex gap-3">
                        {[15, 25, 45].map(mins => (
                            <button
                                key={mins}
                                onClick={() => {
                                    setDuration(mins * 60);
                                    setTimeLeft(mins * 60);
                                    setShowCustomInput(false);
                                }}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    !showCustomInput && duration === mins * 60 
                                    ? 'bg-primary-cyan text-black' 
                                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                                }`}
                            >
                                {mins}m
                            </button>
                        ))}
                        <button
                             onClick={() => setShowCustomInput(!showCustomInput)}
                             className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                                showCustomInput
                                ? 'bg-primary-cyan text-black'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                             }`}
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <AnimatePresence>
                        {showCustomInput && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden flex gap-2"
                            >
                                <input 
                                    type="number"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                    placeholder="Mins"
                                    className="w-20 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-primary-cyan"
                                    autoFocus
                                />
                                <button 
                                    onClick={handleCustomDuration}
                                    disabled={!customMinutes}
                                    className="px-4 py-2 bg-white/10 hover:bg-primary-cyan/20 text-primary-cyan border border-white/20 hover:border-primary-cyan rounded-lg font-bold disabled:opacity-50"
                                >
                                    Set
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

        </motion.div>
      )}
    </AnimatePresence>
  );
};
