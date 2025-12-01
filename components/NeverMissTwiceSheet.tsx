import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, X, Wind, Minimize2, Feather } from 'lucide-react';

interface NeverMissTwiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAction: () => void;
  currentHabit: string;
}

export const NeverMissTwiceSheet: React.FC<NeverMissTwiceSheetProps> = ({
  isOpen,
  onClose,
  onQuickAction,
  currentHabit
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

          {/* Backdrop - Deeper blur for immersion, "Gentle" feeling */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          />

          {/* Centered Modal */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
            className="relative w-full max-w-sm bg-[#0F0F10] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden"
          >
            {/* Close Button - Subtle way out */}
            <button onClick={onClose} className="absolute top-5 right-5 p-2 text-white/20 hover:text-white transition-colors z-10">
              <X size={18} />
            </button>

            <div className="p-8 text-center">

              {/* Floating Icon - Feather for "Lightness" */}
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-5 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
                <Feather className="w-5 h-5 text-blue-400" />
              </div>

              {/* EMPATHY KEYWORD: Let's make today easier */}
              <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
                Let's make today easier.
              </h2>

              {/* EMPATHY KEYWORD: Momentum isn't lost. It's restored. */}
              <p className="text-white/50 text-sm mb-8 leading-relaxed max-w-[260px] mx-auto">
                It’s okay to be tired. We adapted your goal so you can keep your momentum without the pressure.
              </p>

              {/* VISUALIZATION: Heavy -> Light */}
              <div className="relative w-full bg-white/5 rounded-2xl p-1 border border-white/5 mb-8">

                {/* The "Heavy" Goal (Faded out) */}
                <div className="py-3 px-4 opacity-30 flex flex-col items-center">
                  <span className="text-xs uppercase tracking-wider font-semibold mb-1">Original Goal</span>
                  <span className="text-sm line-through decoration-white/50">{currentHabit}</span>
                </div>

                {/* Connection Arrow */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#0F0F10] border border-white/10 flex items-center justify-center z-10">
                  <ArrowDown size={12} className="text-white/40" />
                </div>

                {/* The "Light" Step (Highlighted) */}
                <div className="bg-blue-500/10 rounded-xl py-4 px-4 border border-blue-500/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
                  <div className="relative z-10 flex flex-col items-center">
                    {/* EMPATHY KEYWORD: A tiny step is enough */}
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Wind size={10} /> Tiny Version
                    </span>
                    <span className="text-base font-semibold text-white">
                      Just breathe & check in
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action - "Gentle" styling */}
              <button
                onClick={onQuickAction}
                className="w-full py-4 rounded-2xl bg-white hover:bg-gray-100
                           text-black font-bold text-lg
                           shadow-[0_0_25px_rgba(255,255,255,0.15)]
                           hover:scale-[1.01] active:scale-[0.99]
                           transition-all flex items-center justify-center gap-2"
              >
                <Minimize2 size={20} className="fill-black/0" />
                Do Tiny Version
              </button>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};