import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnergyLevel, IdentityType } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
  performanceMode: 'GROWTH' | 'STEADY' | 'RECOVERY',
  currentRepository: { high: string[], medium: string[], low: string[] }
): Promise<{ high: string[], medium: string[], low: string[] }> => {
  console.log("🤖 [AI SERVICE] Generating FULL SPECTRUM for mode:", performanceMode);
  console.log("🤖 [AI SERVICE] Current Repository:", currentRepository);

  if (!API_KEY) {
    console.warn("🤖 [AI SERVICE] Missing GEMINI_API_KEY - returning current repository");
    return currentRepository;
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

  const prompt = `
    Role: You are a Behavioral Psychologist focused on Identity-Based Habits and Progressive Adaptation.
    
    User Identity: "${identity}"
    Yesterday's Performance Context: ${performanceMode}
    
    ${modeContext[performanceMode]}
    
    Current Habit Repository:
    ${JSON.stringify(currentRepository, null, 2)}

    Task: Generate a FULL SPECTRUM habit repository (High, Medium, Low) tailored to the performance context.

    SCIENCE-BACKED RULES:

    1. RECOVERY MODE (Slump/Struggle):
       - LOW (Default): Atomic, friction-free initiation steps (<2 mins, zero planning)
       - MEDIUM: Standard baseline (5-10 mins)
       - HIGH: Do NOT overload; keep it standard (15-30 mins)
    
    2. GROWTH MODE (Flow State):
       - HIGH (Default): Apply PROGRESSIVE OVERLOAD (+10-20% duration/intensity)
       - MEDIUM: Maintenance level (5-10 mins)
       - LOW: Active recovery initiation steps (<2 mins)
    
    3. STEADY MODE (Consistency):
       - HIGH: Keep challenging (15-30 mins)
       - MEDIUM (Default): Refresh for novelty, maintain difficulty (5-10 mins)
       - LOW: Keep atomic safety net (<2 mins)

    CRITICAL CONSTRAINTS:
    - Output EXACTLY 3 habits per energy level (9 total)
    - Keep them aligned with the identity: "${identity}"
    - LOW habits MUST be completable in under 2 minutes (initiation steps only)
    - HIGH habits should be challenging but achievable (15-30 mins)
    - MEDIUM habits are the daily baseline (5-10 mins)

    Format: Return ONLY a JSON object with keys "high", "medium", "low". Each key has an array of 3 strings.
    Example Output Structure:
    {
      "high": ["Run 12 mins", "Write 600 words", "Read 15 pages"],
      "medium": ["Run 8 mins", "Write 300 words", "Read 5 pages"],
      "low": ["Put on running shoes", "Open writing app", "Pick up book"]
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
      console.log(`🤖 [AI SERVICE] ✅ Generated ${performanceMode} mode repository:`, parsed);
      return parsed;
    } else {
      console.warn("🤖 [AI SERVICE] ⚠️ Invalid response format, returning current repository");
      return currentRepository;
    }
  } catch (error) {
    console.error("🤖 [AI SERVICE] ❌ Error generating adaptation:", error);
    return currentRepository;
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
): Promise<{ high: string[], medium: string[], low: string[], narrative: string }> => {
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
    Role: You are a Behavioral Psychologist specializing in identity-based habit evolution.
    
    User Identity: "${identity}"
    Identity Type: ${identityType} (${identityType === 'SKILL' ? 'learning a skill' : identityType === 'CHARACTER' ? 'becoming a type of person' : 'recovering from something'})
    Current Stage: ${stage}
    Evolution Goal: ${suggestionType}
    
    ${evolutionContext[suggestionType as keyof typeof evolutionContext] || 'Maintain current habits with minor improvements.'}
    
    Current Habits:
    ${JSON.stringify(currentRepository, null, 2)}

    Generate:
    1. EVOLVED habit repository (high/medium/low, 3 each)
    2. A short NARRATIVE (1-2 sentences) explaining the evolution in warm, supportive Bounce tone

    RULES for ${identityType}:
    ${identityType === 'SKILL' ? '- Focus on measurable improvement and progressive overload' : ''}
    ${identityType === 'CHARACTER' ? '- Focus on depth, reflection, and emotional congruence' : ''}
    ${identityType === 'RECOVERY' ? '- Focus on gentleness, stability, and relapse prevention' : ''}
    
    - LOW habits MUST be under 2 minutes (atomic initiation steps)
    - Changes should feel like natural evolution, not jarring shifts
    
    Return JSON:
    {
      "high": ["...", "...", "..."],
      "medium": ["...", "...", "..."],
      "low": ["...", "...", "..."],
      "narrative": "Your one-sentence supportive message about this evolution"
    }
    
    Return ONLY raw JSON. No markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    if (parsed?.high?.length === 3 && parsed?.medium?.length === 3 && parsed?.low?.length === 3) {
      console.log("🌱 [EVOLUTION AI] ✅ Generated evolution plan:", parsed);
      return {
        high: parsed.high,
        medium: parsed.medium,
        low: parsed.low,
        narrative: parsed.narrative || "Your habits are evolving with you."
      };
    }
    return { ...currentRepository, narrative: "Keep building your habits." };
  } catch (error) {
    console.error("🌱 [EVOLUTION AI] ❌ Error:", error);
    return { ...currentRepository, narrative: "Keep building your habits." };
  }
};
