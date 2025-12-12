// ---------------------
// FREE USER TEMPLATE ENGINE
// Provides personalized reflections and archetypes without AI calls
// ---------------------

// ---------------------
// PERSONA TEMPLATES
// ---------------------
export function getPersonaReflection(persona: string): string {
    switch (persona) {
        case "TITAN":
            return "You showed strong commitment this week — your momentum is clearly building.";
        case "GRINDER":
            return "You showed reliable effort this week — the foundation of your identity is becoming solid.";
        case "SURVIVOR":
            return "You kept going even when the week wasn't easy — this kind of resilience builds identity.";
        case "GHOST":
            return "This week was tough, but it doesn't define you. Your identity is still yours to shape.";
        default:
            return "Your efforts this week are shaping who you're becoming.";
    }
}

// ---------------------
// STAGE TEMPLATES
// ---------------------
export function getStageReflection(stage: string): string {
    switch (stage) {
        case "INITIATION":
            return "At this stage, every action helps you build the base of your new identity.";
        case "INTEGRATION":
            return "You're starting to blend this identity into your daily life — it's becoming part of you.";
        case "EXPANSION":
            return "You now have enough stability to explore different angles and add variation.";
        case "MAINTENANCE":
            return "You've internalized the core of this identity — now it's about depth, not intensity.";
        default:
            return "Each step forward reinforces who you're becoming.";
    }
}

// ---------------------
// IDENTITY TYPE TEMPLATES
// ---------------------
export function getIdentityTypeReflection(identityType: string | null | undefined): string {
    switch (identityType) {
        case "SKILL":
            return "As a skill-based identity, tiny technical improvements will amplify your growth.";
        case "CHARACTER":
            return "As a character-based identity, your small choices shape who you become long-term.";
        case "RECOVERY":
            return "As a recovery identity, stability and self-compassion matter more than intensity.";
        default:
            return "";
    }
}

// ---------------------
// ARCHETYPE TEMPLATES
// ---------------------
export function getArchetype(persona: string, identity: string, identityType: string | null | undefined): string {
    // Clean up identity string
    const base = identity
        .replace(/^Become\s+/i, "")
        .replace(/^A\s+/i, "")
        .replace(/^An\s+/i, "")
        .trim();

    let prefix = "";
    if (persona === "TITAN") prefix = "The Peak ";
    else if (persona === "GRINDER") prefix = "The Consistent ";
    else if (persona === "SURVIVOR") prefix = "The Resilient ";
    else if (persona === "GHOST") prefix = "The Restarting ";
    else prefix = "The ";

    // Identity type nuance (optional subtle flavor)
    if (identityType === "RECOVERY") prefix += "Gentle ";

    // Capitalize first letter of base
    const capitalizedBase = base.charAt(0).toUpperCase() + base.slice(1);

    return `${prefix}${capitalizedBase}`;
}

// ---------------------
// COMBINED REFLECTION GENERATOR
// ---------------------
export function generateFreeUserReflection(
    persona: string,
    stage: string,
    identityType: string | null | undefined
): string {
    const personaReflection = getPersonaReflection(persona);
    const stageReflection = getStageReflection(stage);
    const identityTypeReflection = getIdentityTypeReflection(identityType);

    // Combine all parts with proper spacing
    const parts = [personaReflection, stageReflection, identityTypeReflection].filter(Boolean);
    return parts.join(" ");
}
