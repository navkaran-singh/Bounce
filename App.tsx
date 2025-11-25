
import React, { useEffect } from 'react';
import { useStore } from './store';
import { Onboarding } from './views/Onboarding';
import { Contract } from './views/Contract';
import { Dashboard } from './views/Dashboard';
import { Stats } from './views/Stats';
import { History } from './views/History';
import { Growth } from './views/Growth';
import { PanicModal } from './components/PanicModal';
import { Particles } from './components/Particles';

const App: React.FC = () => {
  const { currentView, theme } = useStore();

  // Handle Theme Logic
  useEffect(() => {
    const applyTheme = (t: string) => {
      const root = document.documentElement;
      if (t === 'dark') {
        root.classList.add('dark');
      } else if (t === 'light') {
        root.classList.remove('dark');
      } else if (t === 'system') {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      }
    };

    applyTheme(theme);

    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => applyTheme('system');
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }

  }, [theme]);

  const renderView = () => {
    switch (currentView) {
      case 'onboarding':
        return <Onboarding />;
      case 'contract':
        return <Contract />;
      case 'dashboard':
        return <Dashboard />;
      case 'stats':
        return <Stats />;
      case 'growth':
        return <Growth />;
      case 'history':
         // Fallback if state persists old view, redirect to stats or dashboard
        return <Stats />; 
      default:
        return <Onboarding />;
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-light-50 dark:bg-[#0F0F10] text-gray-900 dark:text-white overflow-hidden font-sans selection:bg-primary-cyan/30 transition-colors duration-300">
      <Particles />
      <main className="w-full h-full max-w-md mx-auto relative shadow-2xl bg-light-50 dark:bg-[#0F0F10]/80 backdrop-blur-sm">
        {renderView()}
      </main>
      <PanicModal />
    </div>
  );
};

export default App;
