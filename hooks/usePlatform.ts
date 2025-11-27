import { useState, useEffect } from 'react';

interface PlatformFlags {
    isNative: boolean;
    isWeb: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isPWA: boolean;
}

export const usePlatform = (): PlatformFlags => {
    const [platform, setPlatform] = useState<PlatformFlags>({
        isNative: false,
        isWeb: true,
        isIOS: false,
        isAndroid: false,
        isPWA: false,
    });

    useEffect(() => {
        // Safe check for Capacitor
        const isNative = typeof window !== 'undefined' && !!(window as any).Capacitor;
        const isWeb = !isNative;

        // User Agent checks
        const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || navigator.vendor || (window as any).opera : '';
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
        const isAndroid = /android/i.test(userAgent);

        // PWA check
        const isPWA = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

        const flags = {
            isNative,
            isWeb,
            isIOS,
            isAndroid,
            isPWA,
        };

        setPlatform(flags);

        // Debug log on mount
        console.log(`Platform: ${isNative ? 'Native' : 'Web'} ${isIOS ? '(iOS)' : ''}${isAndroid ? '(Android)' : ''}${isPWA ? '(PWA)' : ''}`);

    }, []);

    return platform;
};
