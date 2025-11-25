
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EnergyLevel } from '../types';
import { RefreshCw } from 'lucide-react';

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (energy: EnergyLevel, note: string) => void;
}

const PROMPTS = [
    "How is your energy right now?",
    "What was the hardest part?",
    "What are you grateful for today?",
    "One word to describe this session:",
    "What triggered you to start today?",
    "Who are you becoming?",
    "What would make tomorrow easier?"
];

export const ReflectionModal: React.FC<ReflectionModalProps> = ({ isOpen, onClose, onSave }) => {
  const [energy, setEnergy] = useState<EnergyLevel | null>(null);
  const [note, setNote] = useState('');
  const [promptIndex, setPromptIndex] = useState(0);

  // Rotate prompts on open
  useEffect(() => {
      if (isOpen) {
          setPromptIndex(Math.floor(Math.random() * PROMPTS.length));
      }
  }, [isOpen]);

  const cyclePrompt = () => {
      setPromptIndex((prev) => (prev + 1) % PROMPTS.length);
  };

  const handleSubmit = () => {
      if (energy) {
          onSave(energy, note);
          onClose();
          // Reset for next time
          setTimeout(() => {
              setEnergy(null);
              setNote('');
          }, 500);
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none"
        >
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={onClose} />
           
           <motion.div
             initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
             className="bg-white dark:bg-dark-800 w-full max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl pointer-events-auto relative"
           >
               <div className="flex justify-between items-start mb-2">
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create an Echo</h2>
                   <button onClick={cyclePrompt} className="text-gray-400 hover:text-primary-cyan">
                       <RefreshCw size={16} />
                   </button>
               </div>
               
               <p className="text-sm text-gray-500 dark:text-white/50 mb-6 min-h-[20px]">
                   {PROMPTS[promptIndex]}
               </p>

               <div className="flex justify-between gap-2 mb-6">
                   {(['low', 'medium', 'high'] as EnergyLevel[]).map((level) => (
                       <button
                        key={level}
                        onClick={() => setEnergy(level)}
                        className={`flex-1 py-4 rounded-2xl border-2 transition-all ${
                            energy === level 
                            ? 'border-primary-cyan bg-primary-cyan/10 text-primary-cyan' 
                            : 'border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                       >
                           <div className="text-2xl mb-1">
                               {level === 'high' ? '⚡' : level === 'medium' ? '🌊' : '☁️'}
                           </div>
                           <div className="text-xs font-bold uppercase">{level}</div>
                       </button>
                   ))}
               </div>

               <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Your thoughts..."
                    className="w-full h-24 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-4 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:border-primary-cyan/50 mb-4"
               />

               <div className="flex gap-3">
                   <button onClick={onClose} className="flex-1 py-3 rounded-xl text-gray-500 dark:text-white/40 font-medium">Skip</button>
                   <button 
                    onClick={handleSubmit}
                    disabled={!energy}
                    className="flex-1 py-3 rounded-xl bg-primary-cyan text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                       Save Echo
                   </button>
               </div>

           </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
