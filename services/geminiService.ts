
import { GoogleGenAI } from "@google/genai";

export const generateReview = async (systemInstruction: string, manuscript: string): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("A variável de ambiente API_KEY não está configurada");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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