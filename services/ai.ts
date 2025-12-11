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
You are Bounce, the user's identity progression coach.

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
  "narrative": "30-60 word emotional explanation",
  "habitAdjustments": ["actionable change 1", "actionable change 2"],
  "stageAdvice": "10-20 word instruction for this stage",
  "summary": "1 sentence motivation"
}

RULES:
- LOW habits MUST be under 2 minutes (atomic steps)
- Changes should feel like natural evolution
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
You are Bounce, a behavioral identity coach.

Generate a short (2-3 sentence) identity reflection.

STRICT RULES:
- Never exceed 3 sentences
- Do NOT repeat the stage name
- Do NOT narrate events
- Do NOT use numbers unless essential
- Do NOT write long paragraphs

Focus on:
1. What this stage means for ${params.identity}
2. What small behavioral shifts you're noticing
3. What the next psychological milestone is

Context:
- Identity: "${params.identity}"
- Type: ${params.identityType}
- Stage: ${params.identityStage}
- Persona: ${params.persona}
- Streak: ${params.streak} days

Return ONLY the reflection text. No quotes or labels.
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
