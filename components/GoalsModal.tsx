
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, Check } from 'lucide-react';
import { useStore } from '../store';

interface GoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoalsModal: React.FC<GoalsModalProps> = ({ isOpen, onClose }) => {
  const { goal, setGoal } = useStore();
  const [localTarget, setLocalTarget] = useState(goal.target);

  useEffect(() => {
      if (isOpen) {
          setLocalTarget(goal.target);
      }
  }, [isOpen, goal.target]);

  const handleSave = () => {
      setGoal(localTarget);
      onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-xs bg-white dark:bg-dark-800 rounded-3xl p-6 shadow-2xl border border-white/10 relative"
            >
                 <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500 dark:text-white/50"
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 bg-primary-purple/20 rounded-full flex items-center justify-center text-primary-purple mb-3">
                        <Target size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Weekly Goal</h2>
                    <p className="text-sm text-gray-500 dark:text-white/50 mt-1 text-center">How many times do you want to show up this week?</p>
                </div>

                <div className="flex justify-between items-center gap-2 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                        <button
                            key={num}
                            onClick={() => setLocalTarget(num)}
                            className={`w-10 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-all ${
                                localTarget === num 
                                ? 'bg-primary-purple text-white shadow-lg shadow-primary-purple/30 scale-110' 
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-white/30 hover:bg-gray-200 dark:hover:bg-white/10'
                            }`}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={handleSave}
                    className="w-full py-3 rounded-xl bg-primary-purple text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-purple/20 active:scale-[0.98] transition-all"
                >
                    <Check size={18} /> Set Goal
                </button>

            </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
