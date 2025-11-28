
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
import { IconGenerator } from './components/IconGenerator';
import { InstallPrompt } from './components/InstallPrompt';

// 👇 1. IMPORT CAPACITOR PLUGINS
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

import { usePlatform } from './hooks/usePlatform';

const App: React.FC = () => {
  const { currentView, theme, initializeAuth, loadFromSupabase, setView, identity } = useStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 👇 CHANGE: Capture the flag so we know if we are on Android
  const { isNative } = usePlatform();

  // 👇 NEW: Native Logic (Status Bar & Back Button)
  useEffect(() => {
    if (isNative) {
      // A. STATUS BAR: Make it transparent (Glass Effect)
      const configureStatusBar = async () => {
        try {
          await StatusBar.setStyle({ style: Style.Dark });
          // This creates the "Full Screen" effect under the battery/time
          await StatusBar.setOverlaysWebView({ overlay: true });
        } catch (e) {
          console.log("Status bar config skipped (web mode)");
        }
      };
      configureStatusBar();

      // B. BACK BUTTON: Prevent app from closing immediately
      CapacitorApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          // Optional: Minimize app instead of killing it
          // CapacitorApp.minimizeApp(); 
          console.log("Back pressed at root");
        } else {
          window.history.back();
        }
      });

      // 👇 C. DEEP LINK LISTENER (Updated Logic)
      CapacitorApp.addListener('appUrlOpen', async (data) => {
        console.log('App opened with URL:', data.url);

        // 1. Check if the URL contains Supabase auth tokens (access_token, refresh_token)
        // These usually come after the '#' symbol
        if (data.url.includes('#')) {
          const hash = data.url.split('#')[1];
          const params = new URLSearchParams(hash);

          const access_token = params.get('access_token');
          const refresh_token = params.get('refresh_token');

          if (access_token && refresh_token) {
            console.log("Tokens found! Logging in...");

            // 2. Manually set the session in Supabase
            const { error } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });

            if (!error) {
              // 3. Success! Force update the View
              console.log("Login successful.");
              await loadFromSupabase(); // Refresh user data
              setView('dashboard');     // Send user to app
            } else {
              console.error("Login failed:", error);
            }
          }
        }
      });
    }
  }, [isNative]);

  // Initialize Auth Listener & Check Session
  // Inside App.tsx

  useEffect(() => {
    const checkSession = async () => {
      try {
        // 1. Set a timeout to kill the spinner after 3 seconds max (Safety Valve)
        const timeout = setTimeout(() => setIsCheckingAuth(false), 3000);

        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log("Session found, loading data...");
          await loadFromSupabase();
          setView('dashboard');
        } else {
          console.log("No session, entering Guest Mode.");
          // Fix: Check if user has local identity (Guest Mode persistence)
          if (identity) {
            console.log("Guest identity found, staying on Dashboard.");
            setView('dashboard');
          } else {
            // Only redirect to onboarding if truly new
            // setView('onboarding'); 
          }
        }

        clearTimeout(timeout); // Clear safety valve if we finished fast
      } catch (e) {
        console.error("Auth check failed", e);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkSession();

    // Keep this separate to listen for auth changes (like signing out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        loadFromSupabase();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
