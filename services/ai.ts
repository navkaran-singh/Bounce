import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export const generateHabits = async (identity: string): Promise<{ high: string[], medium: string[], low: string[] }> => {
    if (!API_KEY) {
        console.warn("Missing GEMINI_API_KEY");
        return { high: [], medium: [], low: [] };
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    User wants to build a habit of being "${identity}".
    Generate 3 sets of habits for 3 energy levels:
    1. "high": Full Charge (Standard/Challenging version).
    2. "medium": Steady Charge (Moderate version).
    3. "low": Low Charge (Tiny version, < 2 mins).

    For EACH level, provide 3 variations (Primary, Variation 2, Variation 3).
    
    Format the output as a JSON object with keys "high", "medium", "low".
    Example:
    {
      "high": ["Write 500 words", "Edit 1 chapter", "Outline next scene"],
      "medium": ["Write 1 paragraph", "Edit 1 page", "Review notes"],
      "low": ["Write 1 sentence", "Open document", "Read last sentence"]
    }
    
    Do not include markdown formatting like \`\`\`json. Just the raw JSON object.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // Clean up potential markdown code blocks
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Error generating habits:", error);
        return { high: [], medium: [], low: [] };
    }
};
