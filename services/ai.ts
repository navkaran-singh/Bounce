import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnergyLevel, IdentityType } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Model fallback order for handling 503 overload errors
const MODEL_FALLBACK_ORDER = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-pro"
];

/**
 * Centralized safe AI request helper
 * Retries each model with specific delays for rate limits (429) and overload (503)
 */
async function safeAIRequest(
  prompt: string,
  preferredModels: string[] = MODEL_FALLBACK_ORDER
): Promise<string> {
  if (!API_KEY) throw new Error("Missing API key");

  const genAI = new GoogleGenerativeAI(API_KEY);
  const modelsToTry = [...preferredModels];

  for (const modelName of modelsToTry) {
    // Retry each model only TWICE
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`🤖 [AI] Trying ${modelName}, attempt ${attempt}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log(`🤖 [AI] ✅ Success with ${modelName}`);
        return text;
      } catch (err: any) {
        const errorMsg = err?.message || String(err);
        const isRateLimit = errorMsg.includes("429");
        const isOverload = errorMsg.includes("503");

        console.warn(`🤖 [AI ERROR] Model ${modelName}, attempt ${attempt}:`, errorMsg);

        if (attempt === 2) break; // Move to next model

        // Specific delays for different error types
        if (isRateLimit) await new Promise(r => setTimeout(r, 1500));
        else if (isOverload) await new Promise(r => setTimeout(r, 800));
        else await new Promise(r => setTimeout(r, 500));
      }
    }
  }

  throw new Error("AI request failed after retries.");
}


// Extended return type for identity classification
export interface GenerateHabitsResult {
  high: string[];
  medium: string[];
  low: string[];
  identityType?: IdentityType | null;
  identityReason?: string;
}

export const generateHabits = async (identity: string): Promise<GenerateHabitsResult> => {
  if (!API_KEY) {
    console.warn("Missing GEMINI_API_KEY");
    // Fallback data so the app doesn't crash without API
    return {
      high: ["Do the full task"],
      medium: ["Do half the task"],
      low: ["Just show up"],
      identityType: null,
      identityReason: "API key missing"
    };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // THE SCIENCE-BACKED PROMPT WITH IDENTITY CLASSIFICATION
  const prompt = `
    Role: You are an expert Behavioral Psychologist specializing in ADHD and BJ Fogg's "Tiny Habits" method.
    
    Goal: Convert the user's desired identity: "${identity}" into actionable habits for 3 distinct energy levels.
    
    FIRST: Classify this identity into one of 3 types:
    - "SKILL": User wants to GET BETTER at something (run faster, write better, learn coding, etc.)
    - "CHARACTER": User wants to BECOME a type of person (be calm, be disciplined, be confident, etc.)
    - "RECOVERY": User wants to STOP/REDUCE/FIX something (stop procrastinating, quit smoking, fix sleep, etc.)

    STRICT CONSTRAINTS FOR "LOW" ENERGY HABITS (The "Bad Day" Protocol):
    1. Time Constraint: Must take LESS than 2 minutes (The "Two-Minute Rule").
    2. Cognitive Load: Must require ZERO planning or decision making.
    3. Physical Friction: Must be the "Initiation Step" only (e.g., "Put on shoes", not "Run").
    
    CRITICAL INSTRUCTION: 
    For "Low" energy, do NOT output "Volunteer", "Research", or "Plan". Those are projects.
    Output only the stupidly small physical action that starts the momentum.

    Generate JSON with:
    - "identityType": "SKILL" | "CHARACTER" | "RECOVERY"
    - "identityReason": Brief 1-sentence explanation of why you chose this type
    - "high": (The Ideal Day) 3 habits, ~15-30 mins. challenging but doable.
    - "medium": (The Standard Day) 3 habits, ~5-10 mins.
    - "low": (The "2-Minute" Tiny Habit) 3 habits.

    Example Output Structure:
    {
      "identityType": "SKILL",
      "identityReason": "User wants to improve writing ability, which is a learnable skill.",
      "high": ["Write 500 words", "Edit 1 chapter", "Outline next scene"],
      "medium": ["Write 1 paragraph", "Read 1 page of notes", "Write 3 headlines"],
      "low": ["Open the document", "Write one bad sentence", "Read the last sentence written"]
    }
    
    Return ONLY raw JSON. No markdown formatting.
    `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log("🤖 [AI] Raw response:", text);

    // Clean up markdown if the model ignores instructions
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    console.log("🤖 [AI] Parsed response:", parsed);
    console.log("🤖 [AI] High habits:", parsed.high);
    console.log("🤖 [AI] Medium habits:", parsed.medium);
    console.log("🤖 [AI] Low habits:", parsed.low);
    console.log("🤖 [AI] Identity type:", parsed.identityType);

    // Validate we have 3 habits per energy level
    const finalResult = {
      high: Array.isArray(parsed.high) && parsed.high.length > 0 ? parsed.high : ["Complete main task"],
      medium: Array.isArray(parsed.medium) && parsed.medium.length > 0 ? parsed.medium : ["Do a shorter version"],
      low: Array.isArray(parsed.low) && parsed.low.length > 0 ? parsed.low : ["Just start"],
      identityType: parsed.identityType || null,
      identityReason: parsed.identityReason || ""
    };

    console.log("🤖 [AI] Final result to return:", finalResult);

    return finalResult;
  } catch (error) {
    console.error("Error generating habits:", error);
    return { high: [], medium: [], low: [], identityType: null };
  }
};


/**
 * SMART DAILY PLANNER (Premium Feature)
 * Generates adaptive habit repository based on yesterday's actual performance
 * Returns a FULL SPECTRUM (High, Medium, Low) for flexible energy management
 */
export const generateDailyAdaptation = async (
  identity: string,
  identityType: 'SKILL' | 'CHARACTER' | 'RECOVERY' | 'MIXED',
  identityStage: 'INITIATION' | 'INTEGRATION' | 'EXPANSION' | 'MAINTENANCE',
  performanceMode: 'GROWTH' | 'STEADY' | 'RECOVERY',
  currentRepository: { high: string[], medium: string[], low: string[] }
): Promise<{ high: string[], medium: string[], low: string[], toastMessage: string }> => {
  console.log("🤖 [AI SERVICE] Generating FULL SPECTRUM for mode:", performanceMode);
  console.log("🤖 [AI SERVICE] Current Repository:", currentRepository);

  // Fallback toast messages
  const fallbackToasts = {
    GROWTH: `🔥 You're on fire! Your "${identity}" habits got a boost today.`,
    STEADY: `⚡ Solid progress! Keeping your "${identity}" routine consistent.`,
    RECOVERY: `🌱 Taking it easy today. Small wins for your "${identity}" journey.`
  };

  if (!API_KEY) {
    console.warn("🤖 [AI SERVICE] Missing GEMINI_API_KEY - returning current repository");
    return { ...currentRepository, toastMessage: fallbackToasts[performanceMode] };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // 1. MACRO CONTEXT (The Stage - Long Term)
  // This tells AI "How hard can we push this user generally?"
  const stageContext = {
    INITIATION: "User is a BEGINNER. Priority is low friction. Even in high energy, do not increase difficulty significantly. Build the habit loop.",
    INTEGRATION: "User is BUILDING RHYTHM. Moderate challenges are okay. Focus on consistency over intensity.",
    EXPANSION: "User is an EXPERT. They are ready for Progressive Overload. In Growth mode, push them hard.",
    MAINTENANCE: "User is SUSTAINING. Keep habits efficient. Avoid burnout."
  };

  // 2. MICRO CONTEXT (The Mode - Yesterday's Performance)
  // This tells AI "How are they feeling right now?"
  const performanceContext = {
    GROWTH: "User is in Flow State (High Energy). They want to feel productive.",
    STEADY: "User is Consistent (Medium Energy). They want to maintain momentum.",
    RECOVERY: "User is Struggling (Low Energy). They need compassionate, tiny wins."
  };



  // Context-aware prompt based on performance mode
  const modeContext = {
    GROWTH: `Yesterday you CRUSHED IT with high-energy habits! You're in FLOW STATE.
    
    ADAPTATION STRATEGY:
    - HIGH (Default for today): Apply PROGRESSIVE OVERLOAD - increase duration/intensity by 10-20%
    - MEDIUM: Maintain baseline standards
    - LOW: Active recovery - keep initiation steps available`,

    STEADY: `Yesterday you maintained steady progress with medium-energy habits. Solid consistency.
    
    ADAPTATION STRATEGY:
    - HIGH: Keep challenging but don't overload
    - MEDIUM (Default for today): Refresh for novelty, maintain difficulty
    - LOW: Keep atomic safety net available`,

    RECOVERY: `Yesterday you struggled or completed only low-energy habits (or none). You need COMPASSIONATE SUPPORT.
    
    ADAPTATION STRATEGY:
    - HIGH: Do NOT overload - keep standard
    - MEDIUM: Gentle baseline
    - LOW (Default for today): ATOMIC RESET - friction-free initiation steps only`
  };

  // 3. TYPE CONTEXT (The Identity Type - Persona)
  // This tells AI "What style of habits does this user need?"
  const typeContext = {
    SKILL: "User is building a SKILL identity (e.g., writer, coder, runner). Focus on measurable progression, technique refinement, and deliberate practice.",
    CHARACTER: "User is building a CHARACTER identity (e.g., patient person, minimalist, leader). Focus on behavioral expression, mindset shifts, and values alignment. Include reflection moments.",
    RECOVERY: "User is building a RECOVERY identity (e.g., sober, healthy, calm). Be EXTRA gentle. Avoid triggers. Focus on stabilizing rituals and self-compassion. Never push hard even in GROWTH mode.",
    MIXED: "User has a mixed identity. Balance skill-building with character development."
  };

  const macroInstruction = stageContext[identityStage];
  const microInstruction = performanceContext[performanceMode];
  const typeInstruction = typeContext[identityType];

  const prompt = `
    Role: You are a Behavioral Psychologist focused on Identity-Based Habits and Progressive Adaptation.
    
    === USER CONTEXT ===
    Identity: "${identity}"
    Identity Type: ${identityType}
    Identity Stage: ${identityStage}
    Yesterday's Performance: ${performanceMode}
    
    === STAGE CONTEXT (Long-term: How experienced is this user?) ===
    ${macroInstruction}
    
    === TYPE CONTEXT (Persona: What kind of identity are they building?) ===
    ${typeInstruction}
    
    === PERFORMANCE CONTEXT (Short-term: How did they do yesterday?) ===
    ${microInstruction}
    ${modeContext[performanceMode]}
    
    Current Habit Repository:
    ${JSON.stringify(currentRepository, null, 2)}

    Task: Generate a FULL SPECTRUM habit repository (High, Medium, Low) that respects ALL three contexts above.

    SCIENCE-BACKED RULES:

    1. RECOVERY MODE (Slump/Struggle):
       - LOW (Default): Atomic, friction-free initiation steps (<2 mins, zero planning)
       - MEDIUM: Standard baseline (5-10 mins)
       - HIGH: Do NOT overload; keep it standard (15-30 mins)
    
    2. GROWTH MODE (Flow State):
       - HIGH (Default): Apply PROGRESSIVE OVERLOAD (+10-20% duration/intensity)
       - MEDIUM: Maintenance level (5-10 mins)
       - LOW: Active recovery initiation steps (<2 mins)
       - ⚠️ EXCEPTION: For RECOVERY identity type, do NOT apply progressive overload. Keep gentle.
    
    3. STEADY MODE (Consistency):
       - HIGH: Keep challenging (15-30 mins)
       - MEDIUM (Default): Refresh for novelty, maintain difficulty (5-10 mins)
       - LOW: Keep atomic safety net (<2 mins)

    4. STAGE MODIFIERS:
       - INITIATION: Keep ALL levels simple. User is building the habit loop, not intensity.
       - INTEGRATION: Moderate challenge. Focus on rhythm, not breakthroughs.
       - EXPANSION: Push harder on HIGH. User can handle progressive overload.
       - MAINTENANCE: Efficiency focus. Avoid burnout. Sustainable habits only.

    CRITICAL CONSTRAINTS:
    - Output EXACTLY 3 habits per energy level (9 total)
    - Keep them aligned with the identity: "${identity}"
    - LOW habits MUST be completable in under 2 minutes (initiation steps only)
    - HIGH habits should be challenging but achievable (15-30 mins)
    - MEDIUM habits are the daily baseline (5-10 mins)
    - toastMessage MUST be under 100 characters, personal, and encouraging

    Format: Return ONLY a JSON object with keys "high", "medium", "low", "toastMessage".
    Example Output Structure:
    {
      "high": ["Run 12 mins", "Write 600 words", "Read 15 pages"],
      "medium": ["Run 8 mins", "Write 300 words", "Read 5 pages"],
      "low": ["Put on running shoes", "Open writing app", "Pick up book"],
      "toastMessage": "🔥 Yesterday was strong! I've nudged your habits up a notch."
    }
    
    Return ONLY raw JSON. No markdown formatting.
  `;

  try {
    console.log("🤖 [AI SERVICE] Calling Gemini API for full spectrum...");
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    console.log("🤖 [AI SERVICE] Raw Response:", text);

    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    // Validate output structure
    if (
      parsed &&
      typeof parsed === 'object' &&
      Array.isArray(parsed.high) && parsed.high.length === 3 &&
      Array.isArray(parsed.medium) && parsed.medium.length === 3 &&
      Array.isArray(parsed.low) && parsed.low.length === 3
    ) {
      // Ensure toastMessage exists, fallback if not
      const toastMessage = parsed.toastMessage || fallbackToasts[performanceMode];
      console.log(`🤖 [AI SERVICE] ✅ Generated ${performanceMode} mode repository:`, parsed);
      console.log(`🤖 [AI SERVICE] 💬 Toast message:`, toastMessage);
      return { ...parsed, toastMessage };
    } else {
      console.warn("🤖 [AI SERVICE] ⚠️ Invalid response format, returning current repository");
      return { ...currentRepository, toastMessage: fallbackToasts[performanceMode] };
    }
  } catch (error) {
    console.error("🤖 [AI SERVICE] ❌ Error generating adaptation:", error);
    return { ...currentRepository, toastMessage: fallbackToasts[performanceMode] };
  }
};


/**
 * UNIFIED WEEKLY REVIEW CONTENT (Premium Feature)
 * Single API call that generates:
 * - Identity reflection (2 sentences)
 * - Personalized archetype name
 * - Evolved habits (high/medium/low)
 * - Narrative, stageAdvice, habitAdjustments, summary
 */
interface WeeklyReviewParams {
  identity: string;
  identityType: 'SKILL' | 'CHARACTER' | 'RECOVERY';
  identityStage: 'INITIATION' | 'INTEGRATION' | 'EXPANSION' | 'MAINTENANCE';
  persona: 'TITAN' | 'GRINDER' | 'SURVIVOR' | 'GHOST';
  streak: number;
  suggestionType: string;
  currentRepository: { high: string[], medium: string[], low: string[] };
  difficultyLevel?: 'harder' | 'easier' | 'minimal' | 'same';
  isNoveltyWeek?: boolean;  // 🌀 Novelty Injection: true if due for novelty
  stageProgress?: { label: string; weeks: number; totalWeeks: number }; // 📊 Stage progress info
  suggestedStage?: 'EXPANSION' | 'MAINTENANCE' | null; // 🚪 v8 Gatekeeper: Stage user can upgrade to
}

interface WeeklyReviewContent {
  reflection: string;
  archetype: string;
  high: string[];
  medium: string[];
  low: string[];
  narrative: string;
  habitAdjustments: string[];
  stageAdvice: string;
  summary: string;
  advancedIdentity?: string; // AI-suggested next identity for Maintenance completion
  resonanceStatements?: string[]; // 🚪 v8 Gatekeeper: First-person statements for stage promotion
}

export const generateWeeklyReviewContent = async (
  params: WeeklyReviewParams
): Promise<WeeklyReviewContent> => {
  console.log("🌱 [WEEKLY AI] Generating unified weekly review content...");

  const fallback: WeeklyReviewContent = {
    reflection: "Keep building your identity one day at a time. Small wins compound.",
    archetype: getDefaultArchetype(params.identityType, params.identity),
    high: params.currentRepository.high,
    medium: params.currentRepository.medium,
    low: params.currentRepository.low,
    narrative: "Stay consistent this week.",
    habitAdjustments: ["Focus on showing up daily"],
    stageAdvice: "Trust the process.",
    summary: "Keep going.",
    advancedIdentity: undefined
  };

  if (!API_KEY) {
    console.warn("🌱 [WEEKLY AI] No API key - using fallback");
    return fallback;
  }

  const evolutionContext: Record<string, string> = {
    // TITAN options
    'INCREASE_DIFFICULTY': 'User mastered current habits. Increase intensity by 15-25%.',
    'ADD_VARIATION': 'User is stable. Add fresh variations to prevent boredom.',
    'START_MASTERY_WEEK': 'Focus on perfecting technique and form, not volume.',
    'BRANCH_IDENTITY': 'User is expanding. Add habits that extend identity into new territory.',
    'VARIATION_WEEK': 'User has pushed hard 3+ weeks. Keep intensity same, add new angles.',

    // GRINDER options
    'MAINTAIN': 'Keep habits as-is with minor refreshes.',
    'TECHNIQUE_WEEK': 'Focus on quality over quantity.',
    'SOFTER_HABIT': 'User needs gentler habits. Reduce friction 30-50%.',
    'REDUCE_SCOPE': 'Simplify to only 2 core habits. Quality over quantity.',

    // SURVIVOR options
    'REST_WEEK': 'Reduce intensity 20-30%.',
    'REDUCE_DIFFICULTY': 'Make habits much easier. Only low-energy options.',

    // GHOST options
    'FRESH_START_WEEK': 'Complete reset. Ultra-simple habits. Zero judgment.',
    'FRESH_START': 'Complete reset. Ultra-simple habits. Zero judgment.',
    'SOFTER_WEEK': 'Ultra-gentle habits. Just exist. No pressure.',
    'ATOMIC_RESCUE': 'User in ghost loop. Only ONE tiny habit this week. Maximum gentleness.',

    // Overreach options
    'PULLBACK_RECOVERY': 'User pushed too hard last week. Reduce intensity slightly. Rebuild gently.',
    'STABILIZATION_WEEK': 'Keep habits predictable and soft.',

    // Other
    'FRICTION_REMOVAL': 'Make habits even more atomic.',
    'SHIFT_IDENTITY': 'User outgrew basics. Expand identity scope.',
    'ADD_REFLECTION': 'Add reflective micro-habits.',
    'DEEPEN_CONTEXT': 'Extend habits into harder contexts.',
    'EMOTIONAL_WEEK': 'Focus on emotional awareness.',
    'RELAPSE_PATTERN': 'Add guardrail habits.'
  };

  // Difficulty adjustment context for habit generation
  const difficultyContext: Record<string, string> = {
    'harder': 'INCREASE habit intensity by 15-25%. Add longer durations, more reps, or deeper focus.',
    'easier': 'DECREASE habit intensity by 30-40%. Simplify actions, reduce durations, lower barriers.',
    'minimal': 'Make habits ULTRA-SIMPLE. 2-minute versions only. Just-start actions. Zero friction.',
    'same': 'Keep habit intensity roughly the same with minor refreshes.'
  };

  const prompt = `
You are Bounce, an identity-based behavior coach.

Generate a COMPLETE weekly review package for the user in ONE response.

USER CONTEXT:
- Identity: "${params.identity}"
- Type: ${params.identityType}
- Stage: ${params.identityStage}
- Persona this week: ${params.persona}
- Streak: ${params.streak} days
- Evolution needed: ${params.suggestionType}
- Difficulty adjustment: ${params.difficultyLevel || 'same'}
- Novelty week: ${params.isNoveltyWeek ? 'YES' : 'NO'}

${evolutionContext[params.suggestionType] || 'Maintain current habits.'}

DIFFICULTY INSTRUCTION:
${difficultyContext[params.difficultyLevel || 'same']}

${params.isNoveltyWeek ? `
NOVELTY WEEK INSTRUCTION (IMPORTANT):
This is a novelty week. You MUST add a small variation to AT LEAST ONE high or medium habit.
Keep difficulty the SAME but add a twist:
- Add "(try a new location)" or "(different time)" or "(with music)" to the habit text
- OR change ONE habit to a fresh variation that achieves the same goal
- The variation should be noticeable but NOT harder

Example: "Run 30 min" → "Run 30 min (try a new route)"
` : ''}

${params.stageProgress ? `
📊 Stage Progress: User is in the "${params.stageProgress.label}" stage (week ${params.stageProgress.weeks} of ${params.stageProgress.totalWeeks}).
Include 1 sentence of stage insight in the reflection about what this progress means.
` : ''}

Current Habits:
${JSON.stringify(params.currentRepository, null, 2)}

Return a JSON object with ALL these fields:

{
  "reflection": "2 sentences only. Speak directly to user. What this stage means for who they're becoming + what small shift is emerging.",
  "archetype": "A personalized 2-3 word title like 'The Emerging Writer' or 'The Grounded Self' based on their identity",
  "high": ["habit1", "habit2", "habit3"],
  "medium": ["habit1", "habit2", "habit3"],
  "low": ["habit1", "habit2", "habit3"],
  "narrative": "20-30 words. Direct, trusting tone. What to focus on this week.",
  "habitAdjustments": ["short tip 1", "short tip 2"],
  "stageAdvice": "10 words max",
  "summary": "1 short sentence"
}

TONE RULES:
- Speak directly to user ("you", "your")
- No academic language, no metaphors
- Sound like a trusted coach
- Keep everything concise

${params.identityStage === 'MAINTENANCE' ? `
ADVANCED IDENTITY (Required - User is in MAINTENANCE):
Suggest ONE natural evolution of their current identity.
- Must be 3-5 words
- Must be a realistic progression (e.g., "A marathon runner" from "A runner")
- NOT abstract or poetic
- Include as "advancedIdentity" field in JSON
` : ''}

${params.suggestedStage ? `
🚪 STAGE UPGRADE RESONANCE (REQUIRED - User qualifies for ${params.suggestedStage}):
Generate exactly 3 first-person statements that would feel emotionally true when ready for this upgrade.

STRICT RULES for resonance statements:
- No motivation fluff
- Must feel like honest self-recognition, not advice
- Each statement MUST be 12 words or fewer
- First person only ("I...", "This...", "My...")
- Simple, everyday language

GOOD: "I don't force this anymore.", "This feels normal now.", "I'm ready for more."
BAD: "I feel empowered to take on new challenges!"

Include as "resonanceStatements": ["stmt1", "stmt2", "stmt3"] in JSON
` : ''}

Return ONLY valid JSON. No markdown.
  `;

  try {
    const rawText = await safeAIRequest(prompt);
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    // Validate required fields (relaxed: accept 1-3 habits, will pad if needed)
    const hasReflection = !!parsed?.reflection;
    const hasArchetype = !!parsed?.archetype;
    const hasHigh = Array.isArray(parsed?.high) && parsed.high.length >= 1;
    const hasMedium = Array.isArray(parsed?.medium) && parsed.medium.length >= 1;
    const hasLow = Array.isArray(parsed?.low) && parsed.low.length >= 1;

    console.log("🌱 [WEEKLY AI] Validation:", { hasReflection, hasArchetype, hasHigh, hasMedium, hasLow });

    if (hasReflection && hasArchetype && hasHigh && hasMedium && hasLow) {
      console.log("🌱 [WEEKLY AI] ✅ Generated complete review content");

      // Pad arrays to 3 items if needed
      const padToThree = (arr: string[], fallbackArr: string[]): string[] => {
        while (arr.length < 3) {
          arr.push(fallbackArr[arr.length] || arr[0]);
        }
        return arr.slice(0, 3);
      };

      // Extract and validate resonance statements if present
      let resonanceStatements: string[] | undefined = undefined;
      if (Array.isArray(parsed.resonanceStatements) && parsed.resonanceStatements.length >= 3) {
        resonanceStatements = parsed.resonanceStatements.slice(0, 3).map((s: string) => {
          const words = s.split(' ');
          if (words.length > 12) {
            return words.slice(0, 12).join(' ') + '...';
          }
          return s;
        });
        console.log("🚪 [WEEKLY AI] Resonance statements extracted:", resonanceStatements);
      }

      return {
        reflection: parsed.reflection,
        archetype: parsed.archetype,
        high: padToThree(parsed.high, fallback.high),
        medium: padToThree(parsed.medium, fallback.medium),
        low: padToThree(parsed.low, fallback.low),
        narrative: parsed.narrative || fallback.narrative,
        habitAdjustments: parsed.habitAdjustments || fallback.habitAdjustments,
        stageAdvice: parsed.stageAdvice || fallback.stageAdvice,
        summary: parsed.summary || fallback.summary,
        advancedIdentity: parsed.advancedIdentity || undefined,
        resonanceStatements: resonanceStatements
      };
    } else {
      console.warn("🌱 [WEEKLY AI] ⚠️ Incomplete response:", { parsed });
      console.warn("🌱 [WEEKLY AI] Using fallback");
      return fallback;
    }
  } catch (error) {
    console.error("🌱 [WEEKLY AI] ❌ Error:", error);
    return fallback;
  }
};

// Helper: Generate default archetype based on identity type
function getDefaultArchetype(type: string, identity: string): string {
  const firstWord = identity.split(' ').slice(-1)[0] || 'Self';
  const archetypes: Record<string, string> = {
    'SKILL': `The Emerging ${firstWord}`,
    'CHARACTER': `The Growing ${firstWord}`,
    'RECOVERY': `The Healing ${firstWord}`
  };
  return archetypes[type] || `The ${firstWord}`;
}

/**
 * WEEKLY EVOLUTION PLAN (Premium Feature)
 * Generates evolved habits based on identity stage and evolution suggestion
 */
export const generateWeeklyEvolutionPlan = async (
  identity: string,
  identityType: 'SKILL' | 'CHARACTER' | 'RECOVERY',
  stage: 'INITIATION' | 'INTEGRATION' | 'EXPANSION' | 'MAINTENANCE',
  suggestionType: string,
  currentRepository: { high: string[], medium: string[], low: string[] }
): Promise<{
  high: string[],
  medium: string[],
  low: string[],
  narrative: string,
  habitAdjustments?: string[],
  stageAdvice?: string,
  summary?: string
}> => {
  console.log("🌱 [EVOLUTION AI] Generating plan for:", identityType, stage, suggestionType);

  if (!API_KEY) {
    return { ...currentRepository, narrative: "Keep building your habits." };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const evolutionContext = {
    'INCREASE_DIFFICULTY': `The user has mastered their current habits. Apply PROGRESSIVE OVERLOAD: increase duration/intensity by 15-25% for HIGH habits.`,
    'ADD_VARIATION': `The user is stable but needs novelty. Add fresh VARIATIONS to prevent boredom while maintaining difficulty.`,
    'SHIFT_IDENTITY': `The user has outgrown basics. EXPAND the identity scope (e.g., "Writer" → "Published Author mindset")`,
    'TECHNIQUE_WEEK': `Focus on QUALITY over quantity. Habits should emphasize technique refinement.`,
    'ADD_REFLECTION': `Add REFLECTIVE micro-habits. Include journaling, gratitude, or mindfulness moments.`,
    'DEEPEN_CONTEXT': `Extend habits into HARDER CONTEXTS (stress, social situations, mornings).`,
    'EMOTIONAL_WEEK': `Focus on EMOTIONAL AWARENESS. Add moments of pause and self-check.`,
    'SOFTER_HABIT': `User needs gentler habits. REDUCE friction and difficulty by 30-50%.`,
    'FRICTION_REMOVAL': `Identify friction points. Make habits even MORE ATOMIC and friction-free.`,
    'STABILIZATION_WEEK': `Keep habits PREDICTABLE and soft. No increases, just stability.`,
    'RELAPSE_PATTERN': `Add GUARDRAIL habits that prevent relapse triggers.`,
    'REST_WEEK': `REDUCE overall intensity by 20-30%. Focus on sustainability.`,
    'MAINTAIN': `Keep habits as-is with minimal changes. Just refresh wording for novelty.`
  };

  const prompt = `
You are Bounce, an identity-based behavior coach.

Generate a weekly evolution plan for:
- Identity: "${identity}"
- Type: ${identityType}
- Stage: ${stage}
- Evolution: ${suggestionType}

${evolutionContext[suggestionType as keyof typeof evolutionContext] || 'Maintain current habits with minor improvements.'}

Current Habits:
${JSON.stringify(currentRepository, null, 2)}

Return JSON with:
{
  "high": ["habit1", "habit2", "habit3"],
  "medium": ["habit1", "habit2", "habit3"],
  "low": ["habit1", "habit2", "habit3"],
  "narrative": "20-30 word identity reflection (see example below)",
  "habitAdjustments": ["short actionable tip 1", "short actionable tip 2"],
  "stageAdvice": "10 words max",
  "summary": "1 short sentence"
}

TONE RULES:
- Speak directly to the user ("you", "your")
- No fluffy language, no metaphors, no academic words
- Sound like a trusted coach, not a motivational poster
- Keep it short and actionable

Example narrative:
"Your base is settling in. Keep showing up in small ways that reinforce trust in this identity."

BAD narrative (too wordy):
"You're cementing the foundations of your writer identity! Each consistent step reinforces your commitment..."

RULES:
- LOW habits MUST be under 2 minutes (atomic steps)
- Return ONLY valid JSON, no markdown
  `;

  try {
    const rawText = await safeAIRequest(prompt);
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    if (parsed?.high?.length === 3 && parsed?.medium?.length === 3 && parsed?.low?.length === 3) {
      console.log("🌱 [EVOLUTION AI] ✅ Generated evolution plan:", parsed);
      return {
        high: parsed.high,
        medium: parsed.medium,
        low: parsed.low,
        narrative: parsed.narrative || "Your habits are evolving with you.",
        habitAdjustments: parsed.habitAdjustments || [],
        stageAdvice: parsed.stageAdvice || "",
        summary: parsed.summary || ""
      };
    }
    return { ...currentRepository, narrative: "Keep building your habits.", habitAdjustments: [], stageAdvice: "", summary: "" };
  } catch (error) {
    console.error("🌱 [EVOLUTION AI] ❌ Error:", error);
    return { ...currentRepository, narrative: "Keep building your habits.", habitAdjustments: [], stageAdvice: "", summary: "" };
  }
};

/**
 * IDENTITY REFLECTION (Premium Feature)
 * Generates a personalized identity reflection for Step 2 of weekly review
 */
export interface IdentityReflectionParams {
  identity: string;
  identityType: 'SKILL' | 'CHARACTER' | 'RECOVERY';
  identityStage: 'INITIATION' | 'INTEGRATION' | 'EXPANSION' | 'MAINTENANCE';
  stageReason: string;
  weeklyMomentumScore: number;
  totalCompletions: number;
  streak: number;
  missedHabits: Record<string, number>;
  persona: 'TITAN' | 'GRINDER' | 'SURVIVOR' | 'GHOST';
}

export const generateIdentityReflection = async (
  params: IdentityReflectionParams
): Promise<string> => {
  console.log("🪞 [REFLECTION AI] Generating identity reflection...");

  if (!API_KEY) {
    return getDefaultReflection(params);
  }

  const missedHabitsList = Object.entries(params.missedHabits || {})
    .slice(0, 3)
    .map(([habit, count]) => `${habit} (${count}x)`)
    .join(', ');

  const prompt = `
You are Bounce, an identity-based behavior coach.

Write a short identity reflection (2 sentences MAX) for the user.

STRICT RULES:
- Speak directly to the user ("you"), never in third-person.
- No academic language, no metaphors, no poetic phrasing.
- No storytelling, no narration of events.
- Do NOT repeat the stage name.
- Do NOT analyze the user's week. Only interpret identity progression.
- Focus on psychological meaning:
  1. What this stage *means* for who they're becoming.
  2. What small internal shift is emerging.

Context:
- Identity: "${params.identity}"
- Type: ${params.identityType}
- Stage: ${params.identityStage}
- Persona: ${params.persona}
- Streak: ${params.streak} days

Example tones:
"You're beginning to treat this identity as something real, not theoretical. Keep showing up in small ways — the next version of you grows from repetition, not intensity."

Return ONLY the reflection text.
  `;

  try {
    const text = await safeAIRequest(prompt);
    console.log("🪞 [REFLECTION AI] ✅ Generated:", text.substring(0, 100) + "...");
    return text.trim();
  } catch (error) {
    console.error("🪞 [REFLECTION AI] ❌ Error:", error);
    return getDefaultReflection(params);
  }
};

function getDefaultReflection(params: IdentityReflectionParams): string {
  const stageMessages = {
    'INITIATION': `You're in the foundational stage of becoming ${params.identity}. Every small action is teaching your brain what matters to you.`,
    'INTEGRATION': `Your habits are becoming more natural now. The ${params.identity} identity is weaving itself into your daily rhythm.`,
    'EXPANSION': `You've built a solid foundation. This is the stage where ${params.identity} starts to feel less like effort and more like expression.`,
    'MAINTENANCE': `You've internalized this identity. Being ${params.identity} is now part of who you are, not just what you do.`
  };

  return stageMessages[params.identityStage] || "This stage represents steady progress. Keep building momentum.";
}

/**
 * PREMIUM RESONANCE STATEMENTS (Premium Feature - Stage Promotion)
 * Generates personalized first-person statements for stage upgrade confirmation.
 * These are shown in the Weekly Review when user qualifies for EXPANSION or MAINTENANCE.
 * 
 * Rules:
 * - Only called for Premium users
 * - Cached in weeklyReview.resonanceStatements
 * - Falls back to templates on error
 */
export interface PremiumResonanceParams {
  identity: string;
  identityType: 'SKILL' | 'CHARACTER' | 'RECOVERY';
  currentStage: 'INITIATION' | 'INTEGRATION' | 'EXPANSION' | 'MAINTENANCE';
  targetStage: 'INTEGRATION' | 'EXPANSION' | 'MAINTENANCE';
}

export const generatePremiumResonanceStatements = async (
  params: PremiumResonanceParams
): Promise<string[]> => {
  console.log("🚪 [RESONANCE AI] Generating premium resonance statements...");
  console.log("🚪 [RESONANCE AI] Params:", params);

  // Fallback statements if AI fails
  const fallbackStatements: Record<string, string[]> = {
    'INTEGRATION': [
      "It's starting to feel easier.",
      "I remember to do it more often now.",
      "I'm figuring out a rhythm."
    ],
    'EXPANSION': [
      "The routine feels manageable now.",
      "I feel curious about pushing a little further.",
      "I think I can handle more."
    ],
    'MAINTENANCE': [
      "This is just part of who I am now.",
      "I don't need willpower anymore.",
      "It feels weird not doing this."
    ]
  };

  if (!API_KEY) {
    console.warn("🚪 [RESONANCE AI] No API key - using fallback");
    return fallbackStatements[params.targetStage] || fallbackStatements['EXPANSION'];
  }

  const prompt = `
You are a behavioral coach helping someone recognize when they're ready for the next stage of identity growth.

User context:
- Identity: "${params.identity}"
- Identity type: ${params.identityType}
- Moving from: ${params.currentStage} → ${params.targetStage}

Generate exactly 3 short, first-person internal statements that would feel emotionally true when someone is genuinely ready for this stage upgrade.

STRICT RULES:
- No motivation fluff or encouragement
- Must feel like honest self-recognition, not advice
- Each statement MUST be 12 words or fewer
- First person only ("I...", "This...", "My...")
- Simple, everyday language
- No metaphors or poetic phrasing

GOOD EXAMPLES:
- "I don't have to force this anymore."
- "This feels normal now."
- "I trust myself with more responsibility."
- "I'm not faking it anymore."

BAD EXAMPLES (too fluffy/long):
- "I feel empowered to take on new challenges in my journey!"
- "My commitment to this path has grown stronger each day."

Return ONLY a JSON array of 3 strings.
Example: ["statement 1", "statement 2", "statement 3"]

No markdown, no explanation, just the JSON array.
  `;

  try {
    const rawText = await safeAIRequest(prompt);
    const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    if (Array.isArray(parsed) && parsed.length >= 3) {
      // Ensure we have exactly 3 statements, each under 12 words
      const statements = parsed.slice(0, 3).map((s: string) => {
        const words = s.split(' ');
        if (words.length > 12) {
          return words.slice(0, 12).join(' ') + '...';
        }
        return s;
      });

      console.log("🚪 [RESONANCE AI] ✅ Generated statements:", statements);
      return statements;
    }

    console.warn("🚪 [RESONANCE AI] ⚠️ Invalid response format, using fallback");
    return fallbackStatements[params.targetStage] || fallbackStatements['EXPANSION'];
  } catch (error) {
    console.error("🚪 [RESONANCE AI] ❌ Error:", error);
    return fallbackStatements[params.targetStage] || fallbackStatements['EXPANSION'];
  }
};

