
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { auth, googleProvider, sendSignInLinkToEmail, actionCodeSettings, nativeRedirectUrl } from '../services/firebase';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { useStore } from '../store';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { trackSignInPromptShown, trackSignInClicked } from '../services/analytics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { user } = useStore();

  // 📊 ANALYTICS: Track when sign-in modal is shown
  useEffect(() => {
    if (isOpen && !user) {
      trackSignInPromptShown('settings');
    }
  }, [isOpen, user]);

  const handleMagicLinkSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    trackSignInClicked('magic_link'); // 📊 Track sign-in intent
    try {
      const isNative = Capacitor.isNativePlatform();
      const redirectUrl = isNative ? nativeRedirectUrl : window.location.origin;
      if (import.meta.env.DEV) console.log("[AUTH] Sending magic link to:", email);
      if (import.meta.env.DEV) console.log("[AUTH] Redirect URL:", redirectUrl);
      if (import.meta.env.DEV) console.log("[AUTH] Action code settings:", actionCodeSettings(redirectUrl));
      await sendSignInLinkToEmail(auth, email, actionCodeSettings(redirectUrl));
      window.localStorage.setItem('emailForSignIn', email);
      setIsEmailSent(true);
      if (import.meta.env.DEV) console.log("[AUTH] Magic link sent successfully!");
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[AUTH] Magic link error:", err);
      if (import.meta.env.DEV) console.error("[AUTH] Error code:", err?.code);
      if (import.meta.env.DEV) console.error("[AUTH] Error message:", err?.message);
      setError(err?.message || 'Could not send sign-in link. Please try again.');
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    trackSignInClicked('google'); // 📊 Track sign-in intent
    const isNative = Capacitor.isNativePlatform();

    try {
      if (isNative) {
        // Native: Use Capacitor Firebase Authentication plugin (native Google Sign-In UI)
        if (import.meta.env.DEV) console.log("[AUTH] Starting native Google sign-in...");
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (import.meta.env.DEV) console.log("[AUTH] Native sign-in result:", result);

        // Get the ID token and create a Firebase credential
        const idToken = result.credential?.idToken;
        if (idToken) {
          const credential = GoogleAuthProvider.credential(idToken);
          await signInWithCredential(auth, credential);
          if (import.meta.env.DEV) console.log("[AUTH] Native Google sign-in success:", result.user?.email);
          onClose();
        } else {
          throw new Error('No ID token received from Google');
        }
      } else {
        // Web: Use popup
        if (import.meta.env.DEV) console.log("[AUTH] Starting Google sign-in with popup (web)...");
        const result = await signInWithPopup(auth, googleProvider);
        if (import.meta.env.DEV) console.log("[AUTH] Google sign-in success:", result.user.email);
        onClose();
      }
    } catch (err: any) {
      if (import.meta.env.DEV) console.error("[AUTH] Google sign-in error:", err);
      if (import.meta.env.DEV) console.error("[AUTH] Error code:", err?.code);
      if (import.meta.env.DEV) console.error("[AUTH] Error message:", err?.message);
      setError(err?.message || 'Could not sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return null; // Or a sign-out view
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white dark:bg-dark-800 w-full max-w-md rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-gray-400"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center">
              {!isEmailSent ? (
                <>
                  <div className="w-16 h-16 bg-primary-cyan/10 rounded-full flex items-center justify-center mb-4 text-primary-cyan">
                    <Mail size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Sign In or Sign Up
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-white/60 mb-6">
                    We'll send a magic link to your email. No password needed.
                  </p>

                  <form onSubmit={handleMagicLinkSignIn} className="w-full flex flex-col gap-4">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                      className="w-full p-4 bg-gray-100 dark:bg-dark-700 rounded-xl border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-cyan"
                    />
                    <button
                      type="submit"
                      className="w-full py-4 bg-primary-cyan text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      Send Magic Link <ArrowRight size={20} />
                    </button>
                  </form>

                  <div className="my-4 text-xs text-gray-400">OR</div>

                  <button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full py-4 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-dark-600 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <img src="/google.svg" alt="Google" className="w-5 h-5" /> Sign In with Google
                      </>
                    )}
                  </button>

                  {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4 text-green-500">
                    <Mail size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Check your inbox!
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-white/60 mb-3">
                    We've sent a magic link to <strong>{email}</strong>. Click the link to sign in.
                  </p>
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
                    📧 Don't see it? Check your spam folder!
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
