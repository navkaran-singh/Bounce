/**
 * Analytics Service - Lightweight wrapper for Firebase Analytics
 * Tracks 6 key events for early signal:
 * 1. landing_viewed - Landing page loaded
 * 2. app_entered - User entered the main app
 * 3. first_action - User generated habits (core feature interaction)
 * 4. sign_in_prompt_shown - Auth modal was displayed
 * 5. sign_in_clicked - User clicked a sign-in button
 * 6. return_visit - User came back after previous session
 */

import { logEvent, setUserProperties } from 'firebase/analytics';
import { analytics } from './firebase';

// Event names (type-safe, no typos)
export type AnalyticsEvent =
    | 'landing_viewed'
    | 'app_entered'
    | 'first_action'
    | 'sign_in_prompt_shown'
    | 'sign_in_clicked'
    | 'return_visit';

// Session storage key for return visit detection
const LAST_VISIT_KEY = 'bounce_last_visit';
const SESSION_KEY = 'bounce_session_id';

/**
 * Track an analytics event
 * NOTE: Events are NOT sent to Firebase in development mode (localhost)
 * to avoid skewing production data with dev visits
 */
export function trackEvent(event: AnalyticsEvent, params?: Record<string, string | number | boolean>) {
    try {
        // In dev mode: log to console but DON'T send to Firebase
        if (import.meta.env.DEV) {
            console.log(`[ANALYTICS] 📊 ${event}`, params || '', '(dev mode - not sent to Firebase)');
            return; // Skip Firebase in dev mode
        }

        // Production only: send to Firebase Analytics
        logEvent(analytics, event, params);
    } catch (error) {
        // Don't let analytics errors break the app
        console.warn('[ANALYTICS] Failed to track event:', event, error);
    }
}

/**
 * Track landing page view
 */
export function trackLandingViewed() {
    trackEvent('landing_viewed', {
        timestamp: Date.now(),
        referrer: document.referrer || 'direct'
    });
}

/**
 * Track when user enters the main app (clicks Get Started or app mounts)
 */
export function trackAppEntered(source: 'cta_click' | 'direct' | 'returning') {
    trackEvent('app_entered', {
        source,
        timestamp: Date.now()
    });
}

/**
 * Track first meaningful action (habit generation or core feature use)
 */
export function trackFirstAction(action: 'habits_generated' | 'habit_completed') {
    // Only track once per session
    const sessionId = sessionStorage.getItem(SESSION_KEY);
    const firstActionKey = `first_action_${sessionId}`;

    if (sessionStorage.getItem(firstActionKey)) {
        return; // Already tracked this session
    }

    sessionStorage.setItem(firstActionKey, 'true');
    trackEvent('first_action', {
        action,
        timestamp: Date.now()
    });
}

/**
 * Track when sign-in modal is shown
 */
export function trackSignInPromptShown(trigger: 'settings' | 'premium' | 'auto') {
    trackEvent('sign_in_prompt_shown', {
        trigger,
        timestamp: Date.now()
    });
}

/**
 * Track when user clicks a sign-in button (intent, not success)
 */
export function trackSignInClicked(method: 'google' | 'magic_link') {
    trackEvent('sign_in_clicked', {
        method,
        timestamp: Date.now()
    });
}

/**
 * Check and track return visit
 * Call this on app mount
 */
export function checkAndTrackReturnVisit(): boolean {
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const now = Date.now();

    // Generate session ID for this visit
    if (!sessionStorage.getItem(SESSION_KEY)) {
        sessionStorage.setItem(SESSION_KEY, `session_${now}`);
    }

    // Update last visit time
    localStorage.setItem(LAST_VISIT_KEY, now.toString());

    if (lastVisit) {
        const hoursSinceLastVisit = (now - parseInt(lastVisit)) / (1000 * 60 * 60);

        // Consider it a return visit if > 1 hour since last visit
        if (hoursSinceLastVisit > 1) {
            trackEvent('return_visit', {
                hours_since_last: Math.round(hoursSinceLastVisit),
                timestamp: now
            });
            return true;
        }
    }

    return false;
}

/**
 * Set user properties for segmentation
 */
export function setAnalyticsUserProperties(props: { isPremium?: boolean; hasIdentity?: boolean }) {
    try {
        setUserProperties(analytics, {
            is_premium: props.isPremium ? 'true' : 'false',
            has_identity: props.hasIdentity ? 'true' : 'false'
        });
    } catch (error) {
        console.warn('[ANALYTICS] Failed to set user properties:', error);
    }
}
