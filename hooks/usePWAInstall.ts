import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isPortable, setIsPortable] = useState(false); // Can be installed
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setIsPortable(true);
            if (import.meta.env.DEV) console.log("📲 [PWA] Capture install prompt");
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (isStandalone) {
            setIsPortable(false);
        } else if (isIOSDevice) {
            // iOS is portable but manual
            setIsPortable(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) {
            if (isIOS) {
                // iOS doesn't support programmatic prompt, UI must show instructions
                return 'ios-instruction-needed';
            }
            return;
        }

        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;

        if (result.outcome === 'accepted') {
            setIsPortable(false);
        }
        setDeferredPrompt(null);
    };

    return { isPortable, promptInstall, isIOS };
}
