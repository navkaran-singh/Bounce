import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from './services/supabase';
import { useStore } from './store';
import { Onboarding } from './views/Onboarding';
import { Contract } from './views/Contract';
import { Dashboard } from './views/Dashboard';
import { Stats } from './views/Stats';
import { History } from './views/History';
import { Growth } from './views/Growth';
import { PanicModal } from './components/PanicModal';
import { Particles } from './components/Particles';
import { InstallPrompt } from './components/InstallPrompt';

import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { usePlatform } from './hooks/usePlatform';

const App: React.FC = () => {
  const { currentView, theme, loadFromSupabase, setView, identity, setUser } = useStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { isNative } = usePlatform();

  // Native Logic (Status Bar etc)
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
        if (!canGoBack) { } else { window.history.back(); }
      });

      CapacitorApp.addListener('appUrlOpen', async (data) => {
        if (data.url.includes('#')) {
          const hash = data.url.split('#')[1];
          const params = new URLSearchParams(hash);
          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (!error) {
              setView('dashboard'); // Force entry
              loadFromSupabase(); // Sync in background
            }
          }
        }
      });
    }
  }, [isNative]);

  // AUTH LOGIC - FIXED TO PREVENT INFINITE LOAD
  useEffect(() => {
    const initApp = async () => {
      // 1. Force a timeout so you are NEVER stuck
      const safetyValve = setTimeout(() => setIsCheckingAuth(false), 2000);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          // WE HAVE A SESSION
          setUser(session.user);

          // CRITICAL FIX: Open the app IMMEDIATELY. Do not await the cloud.
          setView('dashboard');

          // Run sync in background
          loadFromSupabase().catch(e => console.error("Background sync failed", e));
        } else {
          // NO SESSION
          setUser(null);
          if (identity) {
            // We have local data, let them in as Guest
            setView('dashboard');
          }
        }
      } catch (e) {
        console.error("Auth init error", e);
      } finally {
        clearTimeout(safetyValve);
        setIsCheckingAuth(false);
      }
    };

    initApp();

    // Background Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // Trigger a sync attempt, but don't block UI
        const state = useStore.getState();

        // If we are a "New Bouncer" (default name), try to push our local name
        if (state.identity && state.identity !== 'New Bouncer') {
          useStore.getState().syncToSupabase();
        } else {
          loadFromSupabase();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Theme Logic
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

  return (
    <div className="relative w-full h-[100dvh] bg-light-50 dark:bg-[#0F0F10] text-gray-900 dark:text-white overflow-hidden font-sans selection:bg-primary-cyan/30 transition-colors duration-300">
      <Particles />
      <main className="w-full h-full max-w-md mx-auto relative shadow-2xl bg-light-50 dark:bg-[#0F0F10]/80 backdrop-blur-sm">
        {isCheckingAuth ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-primary-cyan" size={48} />
          </div>
        ) : (
          renderView()
        )}
      </main>
      <PanicModal />
      <InstallPrompt />
    </div>
  );
};

export default App;