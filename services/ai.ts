import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export const generateHabits = async (identity: string): Promise<{ high: string[], medium: string[], low: string[] }> => {
  if (!API_KEY) {
    console.warn("Missing GEMINI_API_KEY");
    // Fallback data so the app doesn't crash without API
    return {
      high: ["Do the full task"],
      medium: ["Do half the task"],
      low: ["Just show up"]
    };
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  // THE SCIENCE-BACKED PROMPT
  const prompt = `
    Role: You are an expert Behavioral Psychologist specializing in ADHD and BJ Fogg's "Tiny Habits" method.
    
    Goal: Convert the user's desired identity: "${identity}" into actionable habits for 3 distinct energy levels.

    STRICT CONSTRAINTS FOR "LOW" ENERGY HABITS (The "Bad Day" Protocol):
    1. Time Constraint: Must take LESS than 2 minutes (The "Two-Minute Rule").
    2. Cognitive Load: Must require ZERO planning or decision making.
    3. Physical Friction: Must be the "Initiation Step" only (e.g., "Put on shoes", not "Run").
    
    CRITICAL INSTRUCTION: 
    For "Low" energy, do NOT output "Volunteer", "Research", or "Plan". Those are projects.
    Output only the stupidly small physical action that starts the momentum.

    Generate JSON with 3 variations for each level:
    - "high": (The Ideal Day) ~15-30 mins. challenging but doable.
    - "medium": (The Standard Day) ~5-10 mins.
    - "low": (The "2-Minute" Tiny Habit).

    Format: JSON object with keys "high", "medium", "low". Each key has an array of 3 strings.
    Example Output Structure:
    {
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
    // Clean up markdown if the model ignores instructions
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error("Error generating habits:", error);
    return { high: [], medium: [], low: [] };
  }
};