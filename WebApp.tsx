
import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { BottomNav } from './components/BottomNav';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { usePlatform } from './hooks/usePlatform';
import { auth, isSignInWithEmailLink, signInWithEmailLink } from './services/firebase';
import { getRedirectResult } from 'firebase/auth';
import { trackAppEntered, checkAndTrackReturnVisit, setAnalyticsUserProperties } from './services/analytics';

// Payment verification state type
type PaymentStatus = 'idle' | 'verifying' | 'success' | 'error';

const WebApp: React.FC = () => {
  const { currentView, theme, setView, identity, _hasHydrated, setHasHydrated, initializeAuth, user, isPremium, isFrozen, isBreathingOpen } = useStore();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const { isNative } = usePlatform();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // 📊 ANALYTICS: Track app entry and return visits
  useEffect(() => {
    if (!_hasHydrated) return;

    // Check for return visit (user came back after >1 hour)
    const isReturning = checkAndTrackReturnVisit();

    // Track app entry with source
    trackAppEntered(isReturning ? 'returning' : 'direct');

    // Set user properties for segmentation
    setAnalyticsUserProperties({
      isPremium: isPremium,
      hasIdentity: !!identity
    });
  }, [_hasHydrated]);

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
        if (import.meta.env.DEV) console.log("🔒 [APP] Secure payment verification starting...");
        if (import.meta.env.DEV) console.log("🔒 [APP] Payment ID:", paymentId);
        if (import.meta.env.DEV) console.log("🔒 [APP] User ID:", user.uid);

        setPaymentStatus('verifying');
        setPaymentError(null);

        try {
          const response = await fetch('/.netlify/functions/verify-payment', {
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
            if (import.meta.env.DEV) console.log("✅ [APP] Payment verified successfully!");
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
            // 🛡️ PARANOID VERIFICATION: Don't downgrade on verification failure
            // Only show error if API explicitly says payment is invalid
            // Network errors, 404s, or env mismatches should NOT affect premium status
            const isExplicitFailure = result.error?.includes('expired') ||
              result.error?.includes('cancelled') ||
              result.error?.includes('refunded');

            if (isExplicitFailure) {
              console.error("❌ [APP] Payment explicitly invalid:", result.error);
              setPaymentStatus('error');
              setPaymentError(result.error);
            } else {
              // Trust cached state - don't show error UI
              console.warn("⚠️ [APP] Verification failed, trusting cached state:", result.error);
              setPaymentStatus('idle');
              // Clean URL to prevent repeated verification attempts
              window.history.replaceState({}, document.title, window.location.pathname);
            }
          }
        } catch (error: any) {
          // 🛡️ NETWORK ERROR: Never downgrade on network failure
          console.warn("⚠️ [APP] Network error during verification - trusting cached state:", error);
          setPaymentStatus('idle'); // Don't show error, just proceed
          window.history.replaceState({}, document.title, window.location.pathname);
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
          if (import.meta.env.DEV) console.log("[AUTH] Redirect sign-in success:", result.user.email);
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
      if (import.meta.env.DEV) console.log("[AUTH] Checking magic link URL:", url);
      if (isSignInWithEmailLink(auth, url)) {
        if (import.meta.env.DEV) console.log("[AUTH] Valid magic link detected!");

        // Try to get email from localStorage (works on both web and native via Capacitor)
        let email = window.localStorage.getItem('emailForSignIn');

        if (!email) {
          // Fallback: prompt user for email
          email = window.prompt('Please provide your email for confirmation');
        }

        if (email) {
          try {
            await signInWithEmailLink(auth, email, url);
            if (import.meta.env.DEV) console.log("[AUTH] Magic link sign-in success!");
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
        if (import.meta.env.DEV) console.log("[AUTH] App opened with URL:", data.url);
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

  // Tab Order for Slide Transitions
  const VIEW_ORDER = ['dashboard', 'growth', 'stats'];
  const prevViewRef = useRef(currentView);

  // Calculate direction synchronously during render to avoid state lag
  const prevIndex = VIEW_ORDER.indexOf(prevViewRef.current);
  const currIndex = VIEW_ORDER.indexOf(currentView);
  let direction = 0;

  if (prevIndex !== -1 && currIndex !== -1 && prevIndex !== currIndex) {
    direction = currIndex > prevIndex ? 1 : -1;
  }
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset scroll on view change
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    // Update ref after render
    prevViewRef.current = currentView;
  }, [currentView]);

  useEffect(() => {
    if (!_hasHydrated) return;

    if (user && identity && microHabits.length > 0 && currentView === 'onboarding') {
      setView('dashboard');
    }
  }, [_hasHydrated, identity, microHabits.length, currentView, setView, user]);

  // Handle pending identity change - navigate to onboarding and clear flag
  const pendingIdentityChange = useStore(state => state.pendingIdentityChange);
  useEffect(() => {
    if (pendingIdentityChange) {
      if (import.meta.env.DEV) console.log("🔄 [WEBAPP] Pending identity change detected - navigating to onboarding");
      setView('onboarding');
      // Clear the flag after navigation
      useStore.setState({ pendingIdentityChange: false });
    }
  }, [pendingIdentityChange, setView]);

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
        // Prevent navigation back to landing page
        // Only allow back if we're in a sub-route or modal within the app
        const currentPath = window.location.pathname;
        if (canGoBack && currentPath !== '/app' && !currentPath.startsWith('/app')) {
          // We're in a sub-route, allow back
          window.history.back();
        } else {
          // We're at the main app route - minimize instead of going back
          CapacitorApp.minimizeApp();
        }
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

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
      opacity: direction === 0 ? 0 : 1,
      scale: direction === 0 ? 0.95 : 1,
      position: 'absolute' as any // Force overlap during transition
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      position: 'relative' as any
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? '100%' : direction > 0 ? '-100%' : 0,
      opacity: direction === 0 ? 0 : 1,
      scale: direction === 0 ? 0.95 : 1,
      position: 'absolute' as any
    })
  };

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
    <div className="relative w-full h-[100dvh] bg-stone-200 dark:bg-[#0F0F10] text-gray-900 dark:text-white overflow-hidden font-sans selection:bg-primary-cyan/30 transition-colors duration-300">
      <Particles />
      {/* Main App Container - On desktop, behaves like a floating phone frame */}
      <main className="w-full h-full md:h-[calc(100vh-2rem)] md:my-4 md:rounded-[32px] md:border md:border-stone-300 dark:md:border-white/10 md:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] dark:md:shadow-[0_0_100px_-20px_rgba(6,182,212,0.15)] md:[transform:translateZ(0)] md:overflow-hidden max-w-lg mx-auto relative shadow-2xl bg-[#FDFCF8] dark:bg-[#0F0F10]/80 backdrop-blur-sm transition-all duration-300">

        {/* Scrollable Content Area */}
        <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto overflow-x-hidden no-scrollbar scroll-smooth">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.div
              key={currentView}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
                scale: { duration: 0.2 }
              }}
              className="w-full h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>

        <PanicModal />

        {/* Only show install prompt after onboarding (when on dashboard/growth/stats) */}
        {(currentView === 'dashboard' || currentView === 'growth' || currentView === 'stats') && <InstallPrompt />}

        {/* Navigation Bar */}
        {(currentView === 'dashboard' || currentView === 'growth' || currentView === 'stats') && !isFrozen && !isBreathingOpen && <BottomNav />}
      </main>

      {/* Payment Verification Overlay - Can remain global or be inside. Let's keep it global for now to ensure visibility */}
      {paymentStatus !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm scale-100">
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
                <p className="text-gray-500 dark:text-gray-400 mb-3">
                  Your payment was verified. Enjoy all premium features!
                </p>
                <div className="bg-primary-cyan/10 border border-primary-cyan/20 rounded-xl p-3 text-left">
                  <p className="text-xs font-medium text-primary-cyan mb-2">✨ Starting now:</p>
                  <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
                    <li>• <b>Habits evolve daily</b> based on your logs & patterns</li>
                    <li>• <b>Burnout protection</b> — AI detects overreach before you feel it</li>
                    <li>• <b>Weekly AI reflection</b> on your identity growth journey</li>
                  </ul>
                </div>
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
