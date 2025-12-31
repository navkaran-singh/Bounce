import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import WebApp from './WebApp';
import { LandingPage } from './views/LandingPage';
import { PrivacyPolicy } from './views/Legal/PrivacyPolicy';
import { TermsOfService } from './views/Legal/TermsOfService';
import { RefundPolicy } from './views/Legal/RefundPolicy';
import { Contact } from './views/Legal/Contact';

// 🚀 PWA OPTIMIZATION: Instant route decision (no flash)
const isPWA = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
);

const PWAOrLanding: React.FC = () => {
    // If running as PWA, skip landing instantly
    if (isPWA) return <Navigate to="/app" replace />;
    return <LandingPage />;
};

// Redirect component to handle payment/auth callbacks
const RedirectHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);

        // 🚀 PWA OPTIMIZATION: Skip landing page for installed PWA users
        const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true; // iOS Safari

        if (isPWA && location.pathname === '/') {
            console.log('[ROUTER] PWA detected, skipping landing page');
            navigate('/app', { replace: true });
            return;
        }

        // Check for payment callback params
        const hasPaymentId = params.has('payment_id') || params.has('subscription_id');
        // Check for Firebase auth redirect (contains apiKey)
        const hasAuthRedirect = params.has('apiKey');

        // If we're NOT already on /app and have these params, redirect to /app
        if ((hasPaymentId || hasAuthRedirect) && !location.pathname.startsWith('/app')) {
            console.log('[ROUTER] Detected payment/auth callback, redirecting to /app');
            navigate(`/app${location.search}`, { replace: true });
        }
    }, [location, navigate]);

    return <>{children}</>;
};

const App: React.FC = () => {
    // Force dark mode for landing/legal pages
    useEffect(() => {
        document.documentElement.classList.add('dark');
    }, []);

    return (
        <BrowserRouter>
            <RedirectHandler>
                <Routes>
                    {/* PWA users skip landing page entirely */}
                    <Route path="/" element={<PWAOrLanding />} />
                    <Route path="/app" element={<WebApp />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/refund" element={<RefundPolicy />} />
                    <Route path="/contact" element={<Contact />} />
                    {/* Fallback - redirect to landing */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </RedirectHandler>
        </BrowserRouter>
    );
};

export default App;
