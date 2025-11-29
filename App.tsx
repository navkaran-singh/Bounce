
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

const App: React.FC = () => {
  const { currentView, theme, setView, identity, _hasHydrated, setHasHydrated, initializeAuth, user } = useStore();
  const { isNative } = usePlatform();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe(); // Cleanup subscription on component unmount
  }, [initializeAuth]);

  // Handle magic link sign-in
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if(email) {
        signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem('emailForSignIn');
          // User is signed in, and the onAuthStateChanged listener in the store will handle the rest.
        })
        .catch((err) => {
          console.error(err);
          // Handle error
        });
      }
    }
  }, []);

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
