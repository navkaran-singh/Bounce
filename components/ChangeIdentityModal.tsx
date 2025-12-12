import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';
import { useStore } from '../store';

interface ChangeIdentityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangeIdentityModal: React.FC<ChangeIdentityModalProps> = ({ isOpen, onClose }) => {
    const identity = useStore(state => state.identity);
    const initiateIdentityChange = useStore(state => state.initiateIdentityChange);

    const handleConfirm = () => {
        initiateIdentityChange();
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-sm mx-4 bg-[#0F0F10] rounded-3xl border border-white/10 overflow-hidden shadow-2xl pointer-events-auto"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors text-white/40 hover:text-white/80 z-10"
                        >
                            <X size={18} />
                        </button>

                        {/* Content */}
                        <div className="p-6 text-center">
                            {/* Icon */}
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-purple-500/30">
                                <RefreshCw className="w-8 h-8 text-purple-400" />
                            </div>

                            {/* Title */}
                            <h2 className="text-xl font-bold text-white mb-2">
                                Switch Identity?
                            </h2>

                            {/* Current Identity */}
                            {identity && (
                                <p className="text-sm text-white/50 mb-4">
                                    Current: <span className="text-white/80">"{identity}"</span>
                                </p>
                            )}

                            {/* Body */}
                            <p className="text-sm text-white/60 leading-relaxed mb-6">
                                You will restart at Initiation and set new habits in onboarding.
                            </p>

                            {/* Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 text-sm font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleConfirm}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-purple-500/20 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                                >
                                    Yes, Change Identity
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ChangeIdentityModal;
