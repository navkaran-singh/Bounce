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
  const { currentView, theme, loadFromSupabase, setView, identity, setUser, _hasHydrated, setHasHydrated } = useStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const { isNative } = usePlatform();

  // Safety Timer (Just in case hydration is somehow blocked)
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!_hasHydrated) {
        console.warn("[APP] Hydration Slow. Forcing.");
        setHasHydrated(true);
      }
    }, 1000);
    return () => clearTimeout(safetyTimer);
  }, [_hasHydrated, setHasHydrated]);

  // Auth Init
  useEffect(() => {
    if (!_hasHydrated) return; // Wait for disk load

    // 🛡️ SAFETY: Force render after 3 seconds no matter what
    const forceRenderTimer = setTimeout(() => {
      console.warn("[APP] Auth timeout. Forcing render.");
      setIsCheckingAuth(false);
    }, 3000);

    const initApp = async () => {
      try {
        console.log("[APP] Checking session...");
        
        // 🛡️ FIX: Handle magic link redirect on WEB (URL contains access_token in hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          console.log("[APP] Magic link detected in URL. Setting session...");
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (!error) {
            // Clear the hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            // This will trigger SIGNED_IN event which handles the rest
          } else {
            console.error("[APP] Failed to set session from magic link:", error);
          }
        }
        
        const { data: { session } } = await supabase.auth.getSession();
        console.log("[APP] getSession result:", !!session);

        if (session) {
          setUser(session.user);
          
          // 🛡️ Check if this is a fresh login (hasSyncedOnce is false) or app restart
          const state = useStore.getState();
          if (!state.hasSyncedOnce) {
            // Fresh login - let loadFromSupabase decide whether to upload or download
            console.log("[APP] Fresh login detected. Calling loadFromSupabase(true)...");
            await loadFromSupabase(true);
          } else {
            // App restart - local is master
            console.log("[APP] App restart. Local is master.");
            loadFromSupabase(false).catch(e => console.error("[APP] Sync error:", e));
          }
          
          if (currentView === 'onboarding' && useStore.getState().identity) {
            setView('dashboard');
          }
        } else {
          setUser(null);
          if (!identity) setView('onboarding');
        }
      } catch (e) {
        console.error("Auth init error", e);
      } finally {
        clearTimeout(forceRenderTimer);
        console.log("[APP] Auth check complete. Rendering app.");
        setIsCheckingAuth(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[AUTH] Event: ${event}`);
      
      // 🛡️ IGNORE INITIAL_SESSION - we handle it in initApp above
      if (event === 'INITIAL_SESSION') {
        console.log("[AUTH] Ignoring INITIAL_SESSION (handled by initApp)");
        return;
      }

      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        // 🛡️ This fires on ACTUAL sign-in (magic link click)
        console.log("[AUTH] SIGNED_IN event. Calling loadFromSupabase(true)...");
        await loadFromSupabase(true); // isFirstLogin = true
        setView('dashboard');

      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setView('onboarding');
      }
    });

    return () => subscription.unsubscribe();
  }, [_hasHydrated]);

  // ... (Keep existing Theme/Native listeners/RenderView)

  // Native listeners
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
              setView('dashboard');
            }
          }
        }
      });
    }
  }, [isNative]);

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

  if (!_hasHydrated || isCheckingAuth) {
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