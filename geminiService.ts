
import { GoogleGenAI, Type } from "@google/genai";
import { Category, Question, ReviewerNote } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: "Category: Verbal Ability, Analytical Ability, Numerical Ability, or General Information" },
      text: { type: Type.STRING, description: "The full text of the question" },
      options: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: "List of exactly 4 plausible options" 
      },
      correctAnswer: { type: Type.INTEGER, description: "Zero-based index of the correct option (0-3)" },
      explanation: { type: Type.STRING, description: "Detailed explanation of why the answer is correct" }
    },
    required: ["category", "text", "options", "correctAnswer", "explanation"],
  },
};

const noteSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING },
      title: { type: Type.STRING },
      content: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key concepts or bullet points" }
    },
    required: ["category", "title", "content"]
  }
};

export const fetchQuestions = async (count: number = 170, specificCategory?: Category): Promise<Question[]> => {
  let prompt = "";
  if (specificCategory) {
    prompt = `
      Generate ${count} high-quality practice questions for the Philippine Civil Service Professional Examination (2026 Edition).
      Category: ${specificCategory}.
      
      Technical Requirements:
      - Language: English.
      - Quality: Challenging, Professional Civil Service standard.
      - Output: A single JSON array containing all ${count} items.
    `;
  } else {
    prompt = `
      Generate a full-length, ${count}-item Mock Philippine Civil Service Professional Examination (2026 Edition).
      
      You MUST return EXACTLY ${count} items ARRANGE IN THIS SPECIFIC ORDER:
      1. Items 1-40: Numerical Ability.
      2. Items 41-80: Analytical Ability.
      3. Items 81-140: Verbal Ability.
      4. Items 141-170: General Information.
      
      Technical Requirements:
      - Language: English.
      - Quality: Challenging, Professional Civil Service standard.
      - Output: A single JSON array containing all ${count} items.
    `;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    const data = JSON.parse(response.text.trim()) as any[];
    
    return data.map((q, idx) => {
      let category = specificCategory || Category.GENERAL_INFO;
      if (!specificCategory) {
        const lower = q.category?.toLowerCase() || "";
        if (lower.includes("numerical")) category = Category.NUMERICAL;
        else if (lower.includes("analytical")) category = Category.ANALYTICAL;
        else if (lower.includes("verbal")) category = Category.VERBAL;
        else if (lower.includes("general")) category = Category.GENERAL_INFO;
      }

      return {
        ...q,
        id: `q-${idx}-${Date.now()}`,
        category
      };
    });
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
};

export const fetchReviewerNotes = async (): Promise<ReviewerNote[]> => {
  const prompt = `
    Create a comprehensive, structured study guide/reviewer for the 2026 Philippine Civil Service Professional Examination.
    Provide summary notes for each of the 4 categories: Numerical Ability, Analytical Ability, Verbal Ability, and General Information.
    Focus on the most important concepts, formulas, rules (like RA 6713), and strategies for success.
    Format as a JSON array of objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: noteSchema,
        temperature: 0.5,
      },
    });

    const data = JSON.parse(response.text.trim());
    return data;
  } catch (error) {
    console.error("Error generating reviewer notes:", error);
    throw error;
  }
};
