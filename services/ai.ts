import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

export const generateHabits = async (identity: string): Promise<string[]> => {
    if (!API_KEY) {
        console.warn("Missing GEMINI_API_KEY");
        return [];
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    User wants to build a habit of being "${identity}".
    Generate 3 "tiny versions" of this habit.
    They should be:
    1. Extremely small (takes < 2 mins).
    2. Concrete and actionable.
    3. Progressive (1st is easiest, 2nd is slightly more, 3rd is more).
    
    Format the output as a JSON array of strings, e.g.:
    ["Write 1 sentence", "Read a page", "Open the notebook"]
    
    Do not include markdown formatting like \`\`\`json. Just the raw JSON array.
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
        return [];
    }
};
