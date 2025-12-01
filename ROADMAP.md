🏀 BOUNCE: EXECUTION MASTER PLAN
🎯 STRATEGY: "Universal Core" One React web app. PWA for iOS. Native Capacitor Wrapper for Android.

🛑 CURRENT STATUS & LOGS (2025-11-30)
✅ AUTHENTICATION: Native Google Sign-In & Magic Links (Deep Links) are working perfectly on Android & Web.

✅ ACCOUNT MERGING: Guest -> New User & Guest -> Old User flows are working.

⚠️ BUG 1 (Guest Logic): When user is a Guest, their streak logic is broken (doesn't increase).

⚠️ BUG 2 (Cloud Sync): Completed habits are updating locally in the UI, but not being pushed to the Firestore cloud.

📅 PHASE 1: THE WEB CORE (Days 1-7)
Goal: A fully functional, persistent web app accessible on any mobile browser.

✅ Day 1: The Brain Transplant (Supabase/Firebase Sync)

[x] Project Setup & Keys.

[x] Client services setup.

[x] DB Tables created.

[!] FIX NEEDED: store.ts logic is failing to push updates to Cloud on change (Bug #2).

✅ Day 2: Identity & Auth

[x] AuthModal.tsx created.

[x] "Anonymous to Registered" conversion logic.

[x] Platform detection hooks.

[x] Android Auth Polish: Fixed localhost issues, Deep Linking, and assetlinks.json handshake.

✅ Day 3: The "Pro" Logic (Feature Gates)

[x] is_premium DB flag.

[x] EnergyValve.tsx (Compassionate Check).

[x] Crisis Mode logic.

🟡 Day 4: iOS "PWA" Polish

[ ] Create manifest.json (Name, Icons, Theme Color).

[ ] Add "Add to Home Screen" tutorial modal for iOS Safari users.

[ ] Implement webcal logic (Calendar Feed).

Day 5: Payments (Web)

[ ] Integrate Polar.sh or Stripe Checkout.

[ ] Webhook for is_premium updates.

📅 PHASE 2: THE ANDROID WRAPPER (Days 8-10)
Goal: Put the Web Core inside a Native Container.

✅ Day 8: Capacitor Setup

[x] Core & Android CLI installed.

[x] Capacitor initialized.

[x] Deep Links: Android Manifest & Intent Filters configured.

Day 9: Native Feel

[ ] Install @capacitor/haptics (Vibration).

[ ] Install @capacitor/status-bar (Transparent top bar).

[ ] Hide "Upgrade" links on Android version (Policy Compliance).

Day 10: Build & Test

[ ] Generate .apk file.

[ ] Test on physical Android device (Current Stage).

🚨 CRITICAL DEPLOYMENT CHECKLIST (Pre-Flight)
Do NOT skip these steps before publishing, or the app will break.

1. The Android Release Key Trap

The Issue: Google Play signs your app with a different key than your laptop's "Debug" key.

The Fix: When you create the release in Google Play Console, copy the SHA-256 (App Signing Key). Add this key to:

public/.well-known/assetlinks.json (Firebase Hosting).

Firebase Console > Project Settings > Android Apps.

If you forget this, Magic Links will break for all real users.

2. The Web Domain Trap

The Issue: Authentication will fail if the URL isn't whitelisted.

The Fix: Go to Firebase Console > Authentication > Settings > Authorized Domains.

Add your live domain (e.g., bounceapp.com).

Add your Firebase subdomains (project-id.web.app).

📅 PHASE 3: MARKETING & LAUNCH (Jan 10-15)
Goal: Catch the "Quitters Day" wave.

[ ] Marketing: Record a screen recording of the "Bounce Animation" vs. "Broken Streak."

[ ] Distribution: Submit to Google Play Internal Testing.

[ ] Launch: Post to r/ADHD and r/getdisciplined.

🚀 PHASE 4: POST-LAUNCH (v1.1 Updates)
Goal: Optimization & Advanced Features.

[ ] Voice Mode Optimization.

[ ] "Sunday Reset" Story Logic.


------------------------
Bounce is the only habit app where missing a day actually improves your long-term consistency.

The world’s first resilience-based habit system
built for people who break streaks — not for people who maintain them.

A habit system that adapts every time you fail — and makes you stronger because of it.

Bounce is the only habit app that gets better when you get worse.

Most habit apps collapse the moment you miss a day.
Bounce uses your failure to increase your future consistency.

Replacing internal criticism with kindness.

You are not building a habit tracker. You are building a Momentum Keeper.

The chain is made of rubber. It stretches.