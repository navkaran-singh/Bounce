import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import WebApp from './WebApp';
import { LandingPage } from './views/LandingPage';
import { PrivacyPolicy } from './views/Legal/PrivacyPolicy';
import { TermsOfService } from './views/Legal/TermsOfService';
import { RefundPolicy } from './views/Legal/RefundPolicy';
import { Contact } from './views/Legal/Contact';

// Redirect component to handle payment/auth callbacks
const RedirectHandler: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const params = new URLSearchParams(location.search);

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
                    <Route path="/" element={<LandingPage />} />
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
