🏀 BOUNCE: EXECUTION MASTER PLAN
🎯 STRATEGY: "Universal Core"
We build ONE robust React web application first.

Web Users: Use it directly.

iOS Users: Use it as a PWA (Home Screen App).

Android Users: Use it as a Native App (via Capacitor wrapper).

📅 PHASE 1: THE WEB CORE (Days 1-7)
Goal: A fully functional, persistent web app accessible on any mobile browser.

✅ Day 1: The Brain Transplant (Supabase Sync)
[x] Create Supabase Project & Get Keys.

[x] Task: Install @supabase/supabase-js.

[x] Task: Create services/supabase.ts client.

[x] Task: Run SQL to create tables: users, habits, logs.

[x] Task: Rewrite store.ts to fetch from Cloud on load, and push to Cloud on change.

Outcome: You can refresh the page and data stays.

✅ Day 2: Identity & Auth
[x] Task: Create AuthModal.tsx (Sign In / Sign Up).

[x] Task: Implement "Anonymous to Registered" conversion (merge local data with new account).

[x] Task: Add usePlatform hook to detect Web vs. Native.

✅ Day 3: The "Pro" Logic (Feature Gates)
[x] Task: Add is_premium boolean to Database.

[x] Task: Implement EnergyValve.tsx (The Compassionate/Low Battery Check).

[x] Logic: If is_premium === false AND energy is LOW, show "Compassionate Tease" Modal.

[x] Logic: If is_premium === true, activate "Crisis Mode" (Habit Shrinking).

Note: Voice Mode deferred to v1.1 for platform optimization.

🟡 Day 4: iOS "PWA" Polish (CURRENT STEP)
[ ] Task: Create manifest.json (Name, Icons, Theme Color, Standalone Mode).

[ ] Task: Add meta tags for Apple Touch Icons and Status Bar styling.

[ ] Task: Create "Add to Home Screen" tutorial modal (detects iOS Safari).

[ ] Task: Implement the "Wallpaper Generator" (Canvas API) as the iOS "Widget" replacement.

Day 5: Payments (Web)
[ ] Task: Integrate Polar.sh or Stripe Checkout.

[ ] Task: Create a webhook (Edge Function) that updates is_premium = true when payment succeeds.

📅 PHASE 2: THE ANDROID WRAPPER (Days 8-10)
Goal: Put the Web Core inside a Native Container.

Day 8: Capacitor Setup
[ ] Task: Run npm install @capacitor/core @capacitor/cli @capacitor/android.

[ ] Task: Run npx cap add android.

[ ] Task: Point Capacitor to your dist build folder.

Day 9: Native Feel
[ ] Task: Install @capacitor/haptics. Add vibration to the "Bounce" button.

[ ] Task: Install @capacitor/status-bar. Make the top bar transparent.

[ ] Task: Hide "Upgrade" links on Android version (Policy Compliance).

Day 10: Build & Test
[ ] Task: Generate .apk file.

[ ] Task: Test on physical Android device.

📅 PHASE 3: MARKETING & LAUNCH (Jan 10-15)
Goal: Catch the "Quitters Day" wave.

[ ] Marketing: Record a screen recording of the "Bounce Animation" vs. "Broken Streak."

[ ] Distribution: Submit to Google Play Internal Testing.

[ ] Launch: Post to r/ADHD and r/getdisciplined.

🚀 PHASE 4: POST-LAUNCH (v1.1 Updates)
Goal: Optimization & Advanced Features.

[ ] Feature: Voice Mode Optimization (Cross-platform Microphone support, determine what microphone does).

[ ] Feature: "Sunday Reset" Story Logic (Weekly AI Review).