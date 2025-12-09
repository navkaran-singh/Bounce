/**
 * Emotion Messages for Free Users
 * Pre-written messages based on completion %, streak, and time of day
 * Used when AI is not available (free tier)
 */

export const emotionMessages = {
    // Based on yesterday's completion %
    low: [ // 0-30% completion
        "Yesterday was tough. Let's aim for 1 win today.",
        "Rough patch? That's okay. Small steps count.",
        "We all have off days. Today is fresh.",
        "Yesterday didn't go as planned. Today's a reset.",
        "One small win today is enough. Let's go."
    ],
    medium: [ // 31-70% completion
        "Solid progress yesterday. Keep it going.",
        "You're building momentum. Don't stop now.",
        "Good effort. Today can be even better.",
        "Consistency is building. Stay with it.",
        "Yesterday showed promise. Let's build on it."
    ],
    high: [ // 71-100% completion
        "Crushing it! Keep that energy.",
        "You're on fire. Let's maintain it.",
        "Yesterday was great. Make today match.",
        "Momentum is strong. Ride the wave.",
        "You showed up big. Do it again."
    ],

    // Streak-based messages
    streak: [
        "You're building a chain! Don't break it.",
        "{streak} days strong. Keep going!",
        "Consistency is your superpower.",
        "Your streak is growing. Protect it.",
        "Day {streak}. You're proving something."
    ],

    // Time of day context
    morning: [
        "Fresh start today.",
        "Morning energy activated.",
        "Early momentum feels different.",
        "Today's canvas is blank. Paint well."
    ],
    afternoon: [
        "Afternoon push. You got this.",
        "Halfway through. Keep moving.",
        "Still time to make it count."
    ],
    evening: [
        "Wind down. You've done enough.",
        "Evening mode: be gentle.",
        "Day's almost done. Finish strong.",
        "Rest is part of the process."
    ],

    // Recovery/missed day messages
    recovery: [
        "Missed days happen. Today matters.",
        "The streak broke, but you didn't.",
        "Let's rebuild. One habit at a time.",
        "Back in the game. That's what counts."
    ]
};

/**
 * Get a contextual emotion message for free users
 * @param completionPercent - Yesterday's completion percentage (0-100)
 * @param streak - Current streak count
 * @param missedYesterday - Whether the user missed yesterday
 */
export function getEmotionMessage(
    completionPercent: number,
    streak: number,
    missedYesterday: boolean = false
): string {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';

    let pool: string[] = [];

    // Priority: Recovery messages if missed yesterday
    if (missedYesterday) {
        pool = emotionMessages.recovery;
    }
    // Streak celebration if streak > 3
    else if (streak > 3) {
        pool = emotionMessages.streak;
    }
    // Completion-based messages
    else if (completionPercent <= 30) {
        pool = emotionMessages.low;
    } else if (completionPercent <= 70) {
        pool = emotionMessages.medium;
    } else {
        pool = emotionMessages.high;
    }

    // 30% chance to add time-of-day flavor
    if (Math.random() < 0.3) {
        pool = [...pool, ...emotionMessages[timeOfDay]];
    }

    // Pick random message from pool
    const message = pool[Math.floor(Math.random() * pool.length)];

    // Replace {streak} placeholder if present
    return message.replace('{streak}', String(streak));
}

/**
 * Get a simple daily nudge (non-AI)
 * Used for small reminders throughout the day
 */
export function getDailyNudge(): string {
    const nudges = [
        "Try finishing 1 habit earlier today.",
        "Yesterday was uneven, but today counts.",
        "Small progress is still progress.",
        "Just show up. That's the goal.",
        "One habit down makes the rest easier.",
        "Momentum builds with each check.",
        "You've done this before. Do it again.",
        "Start with the easiest one."
    ];

    return nudges[Math.floor(Math.random() * nudges.length)];
}
