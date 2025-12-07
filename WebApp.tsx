
import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useStore } from './store';
import { Onboarding } from './views/Onboarding';
import { Contract } from './views/Contract';
import { Dashboard } from './views/Dashboard';
import { Stats } from './views/Stats';
import { Growth } from './views/Growth';
import { PanicModal } from './components/PanicModal';
import { Particles } from './components/Particles';
import { InstallPrompt } from './components/InstallPrompt';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { usePlatform } from './hooks/usePlatform';
import { auth, isSignInWithEmailLink, signInWithEmailLink } from './services/firebase';
import { getRedirectResult } from 'firebase/auth';

// Payment verification state type
type PaymentStatus = 'idle' | 'verifying' | 'success' | 'error';

const WebApp: React.FC = () => {
  const { currentView, theme, setView, identity, _hasHydrated, setHasHydrated, initializeAuth, user } = useStore();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { isNative } = usePlatform();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle SECURE payment verification via serverless function
  useEffect(() => {
    const verifyPayment = async () => {
      // Check URL params for Dodo payment callback
      const urlParams = new URLSearchParams(window.location.search);
      // Check for EITHER payment_id OR subscription_id
      const paymentId = urlParams.get('payment_id') || urlParams.get('subscription_id');
      const legacyStatus = urlParams.get('payment'); // Legacy fallback

      // If we have a payment_id, verify it securely
      if (paymentId && user?.uid) {
        console.log("🔒 [APP] Secure payment verification starting...");
        console.log("🔒 [APP] Payment ID:", paymentId);
        console.log("🔒 [APP] User ID:", user.uid);

        setPaymentStatus('verifying');
        setPaymentError(null);

        try {
          const response = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              paymentId: paymentId,
              userId: user.uid,
            }),
          });

          const result = await response.json();

          if (response.ok && result.success) {
            console.log("✅ [APP] Payment verified successfully!");
            setPaymentStatus('success');

            // Reload user data from Firebase to get updated premium status
            await useStore.getState().loadFromFirebase();

            // 🔥 CRITICAL FIX: Use 'result', not 'response.data'
            if (result.premiumExpiryDate) {
              useStore.getState().activatePremium(result.premiumExpiryDate);
            } else {
              console.warn("⚠️ [APP] premiumExpiryDate missing in response, using default");
              // Fallback: 30 days from now if server didn't send it (safety net)
              const fallbackDate = Date.now() + (30 * 24 * 60 * 60 * 1000);
              useStore.getState().activatePremium(fallbackDate);
            }

            // Clean URL after successful verification
            window.history.replaceState({}, document.title, window.location.pathname);

            // Auto-hide success message after 5 seconds
            setTimeout(() => {
              setPaymentStatus('idle');
            }, 5000);
          } else {
            console.error("❌ [APP] Payment verification failed:", result.error);
            setPaymentStatus('error');
            setPaymentError(result.error || 'Payment verification failed');
          }
        } catch (error: any) {
          console.error("❌ [APP] Payment verification error:", error);
          setPaymentStatus('error');
          setPaymentError('Network error. Please contact support.');
        }
      } else if (legacyStatus === 'success' && !paymentId) {
        // Legacy fallback: if only 'payment=success' without payment_id, 
        // show message to contact support (this shouldn't happen with proper Dodo setup)
        console.warn("⚠️ [APP] Legacy payment callback detected without payment_id");
        setPaymentStatus('error');
        setPaymentError('Payment callback incomplete. Please contact support if payment was made.');
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    // Wait for hydration and user to be available
    if (_hasHydrated) {
      verifyPayment();
    }
  }, [_hasHydrated, user?.uid]);

  // Handle Google redirect result (for native platforms)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log("[AUTH] Redirect sign-in success:", result.user.email);
        }
      } catch (err) {
        console.error("[AUTH] Redirect result error:", err);
      }
    };
    handleRedirectResult();
  }, []);

  // Handle magic link sign-in (web and native)
  useEffect(() => {
    const handleMagicLink = async (url: string) => {
      console.log("[AUTH] Checking magic link URL:", url);
      if (isSignInWithEmailLink(auth, url)) {
        console.log("[AUTH] Valid magic link detected!");

        // Try to get email from localStorage (works on both web and native via Capacitor)
        let email = window.localStorage.getItem('emailForSignIn');

        if (!email) {
          // Fallback: prompt user for email
          email = window.prompt('Please provide your email for confirmation');
        }

        if (email) {
          try {
            await signInWithEmailLink(auth, email, url);
            console.log("[AUTH] Magic link sign-in success!");
            window.localStorage.removeItem('emailForSignIn');
            // Clear URL params on web
            if (!isNative) {
              window.history.replaceState(null, '', window.location.pathname);
            }
          } catch (err) {
            console.error("[AUTH] Magic link error:", err);
          }
        }
      }
    };

    // Check current URL (for web)
    handleMagicLink(window.location.href);

    // Listen for app URL open events (for native deep links)
    let urlOpenListener: any;
    if (isNative) {
      urlOpenListener = CapacitorApp.addListener('appUrlOpen', (data) => {
        console.log("[AUTH] App opened with URL:", data.url);
        handleMagicLink(data.url);
      });
    }

    // Cleanup listener on unmount
    return () => {
      if (urlOpenListener) {
        urlOpenListener.remove();
      }
    };
  }, [isNative]);

  // Safety Timer
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!_hasHydrated) {
        setHasHydrated(true);
      }
    }, 1000);
    return () => clearTimeout(safetyTimer);
  }, [_hasHydrated, setHasHydrated]);

  const { microHabits } = useStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (user && identity && microHabits.length > 0 && currentView === 'onboarding') {
      setView('dashboard');
    }
  }, [_hasHydrated, identity, microHabits.length, currentView, setView, user]);

  // Native platform setup
  useEffect(() => {
    if (isNative) {
      const configureStatusBar = async () => {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (e) { }
      };
      configureStatusBar();

      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack) window.history.back();
      });
    }
  }, [isNative]);

  // Theme handling
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const renderView = () => {
    switch (currentView) {
      case 'onboarding': return <Onboarding />;
      case 'contract': return <Contract />;
      case 'dashboard': return <Dashboard />;
      case 'stats': return <Stats />;
      case 'growth': return <Growth />;
      case 'history': return <Stats />;
      default: return <Onboarding />;
    }
  };

  if (!_hasHydrated) {
    return (
      <div className="relative w-full h-[100dvh] bg-light-50 dark:bg-[#0F0F10] flex items-center justify-center">
        <Loader2 className="animate-spin text-primary-cyan" size={48} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[100dvh] bg-light-50 dark:bg-[#0F0F10] text-gray-900 dark:text-white overflow-hidden font-sans selection:bg-primary-cyan/30 transition-colors duration-300">
      <Particles />
      <main className="w-full h-full max-w-md mx-auto relative shadow-2xl bg-light-50 dark:bg-[#0F0F10]/80 backdrop-blur-sm">
        {renderView()}
      </main>
      <PanicModal />
      <InstallPrompt />

      {/* Payment Verification Overlay */}
      {paymentStatus !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl">
            {paymentStatus === 'verifying' && (
              <>
                <Loader2 className="animate-spin text-primary-cyan mx-auto mb-4" size={48} />
                <h2 className="text-xl font-bold mb-2">Verifying Payment...</h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Please wait while we securely verify your payment.
                </p>
              </>
            )}

            {paymentStatus === 'success' && (
              <>
                <div className="relative">
                  <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                  {/* Confetti effect using CSS */}
                  <div className="absolute inset-0 pointer-events-none">
                    <span className="animate-bounce text-2xl absolute top-0 left-1/4">🎉</span>
                    <span className="animate-bounce text-2xl absolute top-0 right-1/4" style={{ animationDelay: '0.1s' }}>✨</span>
                    <span className="animate-bounce text-2xl absolute -top-4 left-1/2" style={{ animationDelay: '0.2s' }}>🎊</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2 text-green-600 dark:text-green-400">
                  Welcome to Premium! 🚀
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  Your payment was verified. Enjoy all premium features!
                </p>
              </>
            )}

            {paymentStatus === 'error' && (
              <>
                <XCircle className="text-red-500 mx-auto mb-4" size={64} />
                <h2 className="text-xl font-bold mb-2 text-red-600 dark:text-red-400">
                  Verification Failed
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {paymentError || 'An error occurred during payment verification.'}
                </p>
                <button
                  onClick={() => {
                    setPaymentStatus('idle');
                    setPaymentError(null);
                  }}
                  className="px-6 py-2 bg-primary-cyan text-white rounded-full font-medium hover:bg-primary-cyan/90 transition-colors"
                >
                  Dismiss
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebApp;
