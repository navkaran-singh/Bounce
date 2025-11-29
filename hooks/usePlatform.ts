interface PlatformFlags {
    isNative: boolean;
    isWeb: boolean;
    isIOS: boolean;
    isAndroid: boolean;
    isPWA: boolean;
}

// 🛡️ Compute ONCE at module load (synchronous, no useEffect delay)
const computePlatform = (): PlatformFlags => {
    if (typeof window === 'undefined') {
        return { isNative: false, isWeb: true, isIOS: false, isAndroid: false, isPWA: false };
    }

    // 🛡️ FIX: Check if Capacitor is actually running natively, not just installed
    // Capacitor.isNativePlatform() returns true ONLY when running in native app
    const capacitor = (window as any).Capacitor;
    const isNative = !!(capacitor && capacitor.isNativePlatform && capacitor.isNativePlatform());
    const isWeb = !isNative;

    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera || '';
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;

    console.log(`[PLATFORM] isNative=${isNative}, isWeb=${isWeb}, isIOS=${isIOS}, isAndroid=${isAndroid}`);

    return { isNative, isWeb, isIOS, isAndroid, isPWA };
};

// Singleton - computed once
const PLATFORM = computePlatform();

export const usePlatform = (): PlatformFlags => {
    return PLATFORM;
};
