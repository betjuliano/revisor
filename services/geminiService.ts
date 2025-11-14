
import { GoogleGenAI } from "@google/genai";

const resolveApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) {
    return String(import.meta.env.VITE_GEMINI_API_KEY);
  }
  return undefined;
};

export const generateReview = async (systemInstruction: string, manuscript: string): Promise<string> => {
  const apiKey = resolveApiKey();

  if (!apiKey) {
    throw new Error("A variável de ambiente VITE_GEMINI_API_KEY não está configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: manuscript,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.5,
        topP: 0.95,
      }
    });
    return response.text;
  } catch (error) {
    console.error("Erro ao chamar a API Gemini:", error);
    throw new Error("Falha ao obter uma resposta da IA. Por favor, verifique o console para mais detalhes.");
  }
};