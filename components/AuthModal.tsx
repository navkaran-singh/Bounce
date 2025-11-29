import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cloud, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Placeholder for Phase 2 - Firebase Auth
export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-dark-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-cyan/10 rounded-full flex items-center justify-center mb-4 text-primary-cyan">
                <Cloud size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Cloud Sync Coming Soon
              </h2>
              <p className="text-sm text-gray-500 dark:text-white/60 mb-6">
                Your data is safely stored on this device. Cloud backup and cross-device sync will be available in a future update.
              </p>
              
              <div className="w-full bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-4 mb-6">
                <p className="text-sm text-green-700 dark:text-green-400">
                  ✓ Your progress is automatically saved locally
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-4 bg-primary-cyan text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Got it <ArrowRight size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
