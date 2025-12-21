import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { useStore } from '../store';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface VoiceModeProps {
    isOpen: boolean;
    onClose: (text?: string) => void; // Changed from () => void
    microHabits?: string[]; // Added this since you passed it in Dashboard
}

export const VoiceMode: React.FC<VoiceModeProps> = ({ isOpen, onClose, microHabits }) => {
    const { handleVoiceLog } = useStore();
    const { isListening, transcript, error, startListening, stopListening, resetTranscript } = useVoiceRecognition();
    const [uiState, setUiState] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');

    // We use a ref to track if we *should* be listening, to ignore false stops
    const shouldBeListening = useRef(false);

    // 1. OPENING LOGIC (With Delay Fix)
    useEffect(() => {
        let startTimer: NodeJS.Timeout;

        if (isOpen) {
            setUiState('listening');
            resetTranscript();
            shouldBeListening.current = true;

            // FIX: Wait 300ms before starting. 
            // If React unmounts immediately (Strict Mode), this timer clears 
            // and we never confuse the browser.
            startTimer = setTimeout(() => {
                startListening();
            }, 300);
        } else {
            shouldBeListening.current = false;
            stopListening();
            setUiState('idle');
        }

        return () => {
            clearTimeout(startTimer);
            // We don't stopListening here immediately to avoid the race condition,
            // we rely on the logic inside the hook or the re-render to handle it.
        };
    }, [isOpen, startListening, stopListening, resetTranscript]);

    // 2. CLOSING / PROCESSING LOGIC
    useEffect(() => {
        // Only react if we *intended* to be listening, but the hook says we stopped.
        if (shouldBeListening.current && !isListening) {

            // Give it a tiny buffer. Sometimes the API flickers off/on.
            const processTimer = setTimeout(() => {
                // Double check we are still not listening
                if (!isListening) {
                    if (error) {
                        setUiState('error');
                        shouldBeListening.current = false;
                    } else if (transcript.trim().length > 0) {
                        handleProcessing();
                    } else {
                        // User opened it, said nothing, and it timed out or they closed it
                        // Optional: close the modal automatically?
                        // onClose(); 
                    }
                }
            }, 500);

            return () => clearTimeout(processTimer);
        }
    }, [isListening, transcript, error]);

    const handleProcessing = () => {
        shouldBeListening.current = false; // Stop listening loop
        setUiState('processing');

        setTimeout(() => {
            const cleanText = transcript.charAt(0).toUpperCase() + transcript.slice(1);

            // Always store as 'note' - no type detection
            handleVoiceLog(cleanText, 'note');
            setUiState('success');

            setTimeout(() => {
                onClose();
            }, 1500);
        }, 1200);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-6"
                >
                    <button
                        onClick={() => onClose()}
                        className="absolute top-6 right-6 text-white/50 hover:text-white"
                    >                        <X size={24} />
                    </button>

                    <div className="relative mb-12">
                        {uiState === 'listening' && (
                            <>
                                <motion.div
                                    className="absolute inset-0 bg-primary-cyan/30 rounded-full"
                                    animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                />
                                <motion.div
                                    className="absolute inset-0 bg-primary-cyan/20 rounded-full"
                                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                                />
                            </>
                        )}

                        {/* Interactive Button: Click to Stop manually if needed */}
                        <div
                            onClick={() => { if (isListening) stopListening(); }}
                            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-colors duration-300 cursor-pointer
                            ${uiState === 'success' ? 'bg-green-500' :
                                    uiState === 'error' ? 'bg-red-500' : 'bg-primary-cyan'}`}
                        >
                            {uiState === 'listening' && <Mic size={40} className="text-black" />}
                            {uiState === 'processing' && <Loader2 size={40} className="text-black animate-spin" />}
                            {uiState === 'success' && <CheckCircle size={40} className="text-white" />}
                            {uiState === 'error' && <AlertCircle size={40} className="text-white" />}
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-4 text-center h-8">
                        {uiState === 'listening' && "Voice Journal"}
                        {uiState === 'processing' && "Analyzing..."}
                        {uiState === 'success' && "Noted!"}
                        {uiState === 'error' && "Microphone Error"}
                    </h2>

                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white/70 text-center max-w-md italic text-lg min-h-[3rem] px-4"
                    >
                        {error ? error : `"${transcript}"`}
                    </motion.p>

                    {/* Visual hint that they can tap to stop */}
                    {uiState === 'listening' && (
                        <p className="text-white/30 text-xs mt-2">Tap icon to stop</p>
                    )}

                    <div className="mt-8 text-sm text-white/30 text-center">
                        Your voice note will be saved to today's log
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
    );
};