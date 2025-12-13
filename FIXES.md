⭐ UPDATED OPTIMIZED FIX LIST (FINAL VERSION)
(Each item = Problem → Fix, written for humans + devs + UX)

🔥 FIX 1 — Change Identity Flow (DONE)
Problem
Users evolve and often outgrow their current identity. Without a clean way to switch identity, the app feels rigid and unrealistic. Also, GHOST persona was seeing duplicate Change Identity options.
Fix
Add Change Identity to Settings and Step 3 for non-GHOST personas, with a simple confirmation modal.
Reset stage → INITIATION, weeksInStage → 0, preserve type, clear weeklyReview, and navigate to onboarding via a clean pendingIdentityChange flag.
GHOST keeps Change Identity only in the recovery card.
Status: Completed ✔

🔥 FIX 2 — Maintenance Completion → “What’s Next?” Modal (DONE)
Problem
Users reaching MAINTENANCE feel “done,” because the app provides no closure, no celebration, and no next stage. This kills momentum and causes silent churn.
Fix
When a user fills the MAINTENANCE bar:


Show a celebratory modal:
“You’ve embodied this identity. What’s next?”


Offer three paths:


Deepen It (Mastery) → small increase in difficulty


Evolve It (Advanced Identity) → switch to related next identity


Start Something New → trigger Change Identity Flow




Keep it simple: no extra habit systems, no rule complexity.


This gives emotional closure and keeps the journey alive.

🔥 FIX 3 — Free User Experience Upgrade (Reflection + Archetype) (DONE)
Problem
Free users get almost nothing:


generic reflection


empty identity statements


meaningless evolution options
This makes them feel like the app is hollow, and they churn before even experiencing value.


Fix
Add lightweight psychological templates for Step 1 and Step 2:


A 2–3 sentence reflection template like:
“You showed up with steady effort this week. Your identity is forming through small wins.”


A simple archetype label:
“The Consistent Builder”


Keep premium AI as the “real personalized coach.”


This gives free users emotional value without heavy logic.

🔥 FIX 4 — Step 3 Free User Flow (DONE)
Problem
Free users get evolution options, but clicking them changes nothing meaningful and produces incorrect habits. UX feels broken instead of motivating.
Fix
Free users see evolution options → selecting one shows a preview, not actual evolution.
Add “Unlock Premium Coaching” CTA.
Add “No, I’ll do it manually” as an escape hatch.
No habit changes, no AI calls, no rule engine for free.
Status: Completed ✔

🔥 FIX 5 — Difficulty Ladder System (Free Users Only) (DONE - did not add ladder, rather added previous selections)
Problem
Rule-based text parsing (“increase difficulty”, “simplify text”) is fragile and leads to nonsense habits (“Make It Easier → harder habits”).
Free users need deterministic, stable evolution.
Fix
Build a simple 10-level habit ladder per identity type.
When adjusting difficulty for free users:


harder → +1 index


easier → −1 index


minimal mode → set all habits to levels 1–2


Lightweight, predictable, clean.
Premium continues using AI evolution.

🔥 FIX 6 — Ghost Loop Protection (DONE)
Problem
Users who fail repeatedly get stuck in Fresh Start → GHOST → Fresh Start. They never see progress and feel broken.
Fix
Track consecutive GHOST weeks.
If user hits 2 in a row → replace Fresh Start with:
Atomic Rescue:


Keep current habits


Reduce requirement to “Complete 1 habit/day”


Show gentle narrative


This stops the shame loop and preserves motivation.

🔥 FIX 7 — Titan Saturation Protection (DONE)
Problem
Titans repeatedly choosing “Push Harder” eventually hit impossible levels (e.g., “Run 4 hours”).
This behavior becomes unsafe and unrealistic.
Fix
Detect max ladder level.
When max is reached:
“Push Harder” automatically transforms into Variation Week (change style, not intensity).
Simple model, huge safety benefit.

🔵 FIX 8 — Novelty Injection (14-Day System) (DONE- BUT we need to add manual novelty injection in settings/weekly modal)
Problem
Even high performers get bored after a few weeks of repeating habits. Without small twists, engagement drops.
Fix
Every 14 days, inject micro-novelty:


swap 1 habit


add 1 fresh variant


add a small narrative change (“Try a new location today”)


This prevents stagnation with minimal logic.

🔵 FIX 9 — Maintenance Micro-Themes
Problem
Maintenance feels flat and repetitive without variation. Users don’t feel progress even when consistent.
Fix
Rotate simple weekly themes:


Mastery Week


Technique Week


Tempo Week


Mindful Week


Themes only change narrative + minor habit text, no heavy logic.

🔵 FIX 10 — Stage Progress Visualization (DONE)
Problem
Users can’t tell how far they are in the current stage, or when a new stage will unlock. This kills anticipation.
Fix
Add a simple Stage Progress bar (1–4 labels).
Give the user a visual sense of journey and proximity to next stage.

🔵 FIX 11 — Identity Evolution Map (DONE)
Problem
Users don’t understand the bigger journey of identity change. They feel lost or directionless.
Fix
Show a simple map:
Beginner → Consistent → Skilled → Mastery
Highlight their current point.
Emotionally powerful, technically trivial.

🔵 FIX 12 — Milestone Moments
Problem
Users don’t get recognized when achieving psychologically meaningful milestones.
Fix
Trigger tiny celebration banners for:


First week completed


Entering Integration


Entering Expansion


Entering Maintenance


Completing Maintenance


Using Fresh Start


High emotion, low complexity.

🟣 FIX 13 — Multi-Identity Support (DEFERRED)
Problem
Users eventually want multiple identities, but adding this now risks overcomplication.
Fix
Plan for future:


identity switcher


separate repositories


history tracking


Not needed for v1.