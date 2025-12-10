/**
 * Emotion Messages for Free Users
 * Identity-focused, emotionally intelligent messages
 * Used when AI is not available (free tier)
 */

export const emotionMessages = {
    // Based on yesterday's completion %
    low: [ // 0-30% completion
        "Yesterday was uneven — today is a soft restart.",
        "Some days dip. What matters is you're here.",
        "Yesterday felt heavy. Let’s make today gentle.",
        "A rough day doesn’t define you. One tiny step today is enough.",
        "Momentum paused, not lost. Let's nudge it forward."
    ],

    medium: [ // 31-70% completion
        "Steady progress yesterday — that’s how identity builds.",
        "You're finding a rhythm. Keep it gentle and consistent.",
        "Yesterday showed movement. Let’s continue naturally.",
        "You’re building something real — one day at a time.",
        "Consistency is forming. Today, just show up again."
    ],

    high: [ // 71-100% completion
        "You showed up beautifully yesterday. Let’s meet today softly.",
        "Yesterday’s effort was strong — carry only what feels right today.",
        "You brought great energy. Stay connected to why you’re doing this.",
        "Momentum is flowing. Move with it, don’t force it.",
        "You acted in full alignment yesterday. Keep the thread, not the pace."
    ],

    // Streak-based flavor messages (added, not overriding)
    streak: [
        "You're forming a chain — keep it light and steady.",
        "{streak} days in a row. That's becoming part of you.",
        "This streak isn’t luck — it’s who you’re practicing to be.",
        "Day {streak}. You’re earning trust with yourself.",
        "Your consistency is quietly changing you."
    ],

    // Time-of-day flavor
    morning: [
        "New day, clean slate.",
        "Morning is a quiet chance to realign.",
        "A gentle start can shift the whole day.",
        "Today hasn’t been shaped yet — begin softly."
    ],
    afternoon: [
        "Midday check-in. You’re allowed to continue gently.",
        "There’s still space to make today meaningful.",
        "Take a breath. Small steps still count.",
        "If energy dips now, lower the bar — not the intention."
    ],
    evening: [
        "Evening is reflection, not pressure.",
        "You’ve done enough for today.",
        "Wind down with kindness toward yourself.",
        "Save the rest for tomorrow — you showed up."
    ],

    // Recovery / missed day messages
    recovery: [
        "A missed day is just a moment, not a pattern.",
        "Breaks happen. Your return is what shapes identity.",
        "Yesterday slipped — today doesn’t have to.",
        "Let’s rebuild gently. One small action is enough.",
        "What matters is the rebound, not the stumble."
    ],

    // Energy context based on yesterday's chosen energy level
    energyHigh: [
        "Yesterday came with high energy — appreciate it without demanding it today.",
        "You were charged yesterday. Match it only if it feels natural.",
        "Yesterday’s strength was real. Today's pace is your choice."
    ],
    energyMedium: [
        "Yesterday was steady — sustainable progress.",
        "Balanced energy yesterday. That’s how long-term change builds.",
        "You kept a stable rhythm. Continue without pressure."
    ],
    energyLow: [
        "Yesterday was low-energy — you still showed up.",
        "Gentle effort yesterday was still effort. Honor that.",
        "Low energy isn’t weakness — it’s awareness. Move softly today."
    ],

    // Identity reinforcement — lightly sprinkled, never forced
    identity: [
        "Every small choice reinforces who you're becoming.",
        "This is how identity grows — slowly, quietly, consistently.",
        "You're practicing the identity you chose, even on uneven days.",
        "Tiny actions leave big traces over time.",
        "You're becoming the person you intended — one habit at a time."
    ],

    // Stage-specific messages (Identity Evolution Engine)
    stageInitiation: [
        "You're just beginning. Small wins matter most right now.",
        "Week one energy: just show up.",
        "Seeds don't sprout overnight. Keep watering.",
        "Building the foundation — one habit at a time."
    ],
    stageIntegration: [
        "You're making this part of who you are.",
        "Consistency is becoming natural now.",
        "The habit is starting to feel automatic.",
        "Integration phase: you're building real momentum."
    ],
    stageExpansion: [
        "Ready to grow? You've earned the right to push.",
        "Expansion mode: time to level up.",
        "Your foundation is solid. Now, build higher.",
        "Challenge yourself — you can handle more."
    ],
    stageMaintenance: [
        "You've arrived. Now, just maintain the flame.",
        "Mastery is about consistency, not intensity.",
        "Protect what you've built. Keep showing up.",
        "This is your new normal. Enjoy the ease."
    ]
};



/**
 * Generate an emotionally intelligent message for free users.
 * Blends completion %, streak, recovery, energy context, stage awareness, and time-of-day flavor.
 */
export function getEmotionMessage(
    completionPercent: number,
    streak: number,
    missedYesterday: boolean = false,
    yesterdayEnergy: 'high' | 'medium' | 'low' | null = null,
    identityStage: 'INITIATION' | 'INTEGRATION' | 'EXPANSION' | 'MAINTENANCE' | null = null
): string {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    let pool: string[] = [];

    // PRIORITY 1: Recovery / missed day
    const isRecoveryDay =
        missedYesterday || (completionPercent <= 20 && streak <= 1);

    if (isRecoveryDay) {
        pool = [...emotionMessages.recovery];
    }
    else {
        // PRIORITY 2: Completion-based tone
        if (completionPercent <= 30) {
            pool = [...emotionMessages.low];
        } else if (completionPercent <= 70) {
            pool = [...emotionMessages.medium];
        } else {
            pool = [...emotionMessages.high];
        }

        // Add streak flavor (soft, supportive)
        if (streak > 3 && Math.random() < 0.4) {
            pool = [...pool, ...emotionMessages.streak];
        }
    }

    // 30% chance to add time-of-day flavor
    if (Math.random() < 0.3) {
        pool = [...pool, ...emotionMessages[timeOfDay]];
    }

    // 40% chance to add yesterday's energy insight
    if (yesterdayEnergy && Math.random() < 0.4) {
        const key = `energy${yesterdayEnergy.charAt(0).toUpperCase() + yesterdayEnergy.slice(1)}` as keyof typeof emotionMessages;
        pool = [...pool, ...(emotionMessages[key] || [])];
    }

    // 25% chance to add stage-specific encouragement
    if (identityStage && Math.random() < 0.25) {
        const stageKey = `stage${identityStage.charAt(0).toUpperCase() + identityStage.slice(1).toLowerCase()}` as keyof typeof emotionMessages;
        pool = [...pool, ...(emotionMessages[stageKey] || [])];
    }

    // 20% chance to add identity reinforcement
    if (Math.random() < 0.2) {
        pool = [...pool, ...emotionMessages.identity];
    }

    // Choose randomly
    const message = pool[Math.floor(Math.random() * pool.length)];

    // Replace streak placeholder
    return message.replace('{streak}', String(streak));
}



/**
 * Simple Non-AI Daily Nudges
 * Used for mid-day reminders or small motivation
 */
export function getDailyNudge(): string {
    const nudges = [
        "Try completing just one habit earlier today.",
        "Yesterday was uneven — today counts just as much.",
        "Small progress is still progress.",
        "Just show up. That’s the whole goal.",
        "Start with the easiest task.",
        "One habit down can change the tone of your day.",
        "You've done this before — you can do it again.",
        "Momentum builds quietly. Take one step."
    ];

    return nudges[Math.floor(Math.random() * nudges.length)];
}
