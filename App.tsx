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

const App: React.FC = () => {
  const { currentView, theme, setView, identity, _hasHydrated, setHasHydrated } = useStore();
  const { isNative } = usePlatform();

  // Safety Timer - force hydration if stuck
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!_hasHydrated) {
        console.warn("[APP] Hydration slow. Forcing.");
        setHasHydrated(true);
      }
    }, 1000);
    return () => clearTimeout(safetyTimer);
  }, [_hasHydrated, setHasHydrated]);

  // Simple init - check if user has COMPLETED onboarding (has identity AND habits)
  const { microHabits } = useStore();
  
  useEffect(() => {
    if (!_hasHydrated) return;
    
    console.log("[APP] Hydrated. Identity:", identity, "Habits:", microHabits.length);
    
    // Only redirect to dashboard if user has BOTH identity AND habits (completed onboarding)
    if (identity && microHabits.length > 0 && currentView === 'onboarding') {
      console.log("[APP] Onboarding complete, going to dashboard");
      setView('dashboard');
    }
  }, [_hasHydrated, identity, microHabits.length, currentView, setView]);

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

  // Show loader only during hydration
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
