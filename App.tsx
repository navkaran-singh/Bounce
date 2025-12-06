
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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

const App: React.FC = () => {
  const { currentView, theme, setView, identity, _hasHydrated, setHasHydrated, initializeAuth, user, upgradeToPremium } = useStore();
  const { isNative } = usePlatform();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle payment success callback from Dodo Payments
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get('payment');
      
      if (paymentStatus === 'success') {
        console.log('💎 [PAYMENT] Payment success detected!');
        
        // Upgrade user to premium
        await upgradeToPremium();
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        console.log('💎 [PAYMENT] Premium activation complete!');
      }
    };
    
    handlePaymentSuccess();
  }, [upgradeToPremium]);

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
    </div>
  );
};

export default App;
