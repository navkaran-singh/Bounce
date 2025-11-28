
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, Loader2, Check, ShieldCheck } from 'lucide-react';
import { supabase } from '../services/supabase';
import { usePlatform } from '../hooks/usePlatform';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 👇 1. GET PLATFORM FLAG
    const { isNative } = usePlatform();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        setError(null);

        // 👇 2. DYNAMIC REDIRECT LOGIC
        const redirectTo = isNative
            ? 'com.bounce.app://login-callback' // Android App Scheme
            : window.location.origin;           // Website URL

        try {
            const { error } = await supabase.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: redirectTo, // 👈 USE VARIABLE HERE
                },
            });

            if (error) throw error;
            setSent(true);
        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

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

                        <div className="flex flex-col items-center text-center mb-8">
                            <div className="w-16 h-16 bg-primary-cyan/10 rounded-full flex items-center justify-center mb-4 text-primary-cyan">
                                <ShieldCheck size={32} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Sync Your Progress</h2>
                            <p className="text-sm text-gray-500 dark:text-white/60">
                                Sign in to save your resilience score, habits, and history to the cloud. Never lose your streak.
                            </p>
                        </div>

                        {sent ? (
                            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-2xl p-6 text-center">
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 dark:text-green-400">
                                    <Check size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Check your email</h3>
                                <p className="text-sm text-gray-500 dark:text-white/60">
                                    We sent a magic link to <span className="font-semibold text-gray-900 dark:text-white">{email}</span>.
                                    Click it to sign in.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="mt-4 text-sm text-primary-cyan font-medium hover:underline"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleLogin} className="space-y-4">
                                <div>
                                    <label className="sr-only">Email address</label>
                                    <div className="relative">
                                        <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-12 pr-4 py-4 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary-cyan transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-red-500 text-xs text-center">{error}</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary-cyan text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <>Send Magic Link <ArrowRight size={20} /></>}
                                </button>
                            </form>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-[10px] text-gray-400 dark:text-white/30">
                                By continuing, you agree to our Terms of Service and Privacy Policy.
                            </p>
                        </div>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
