import { GoogleGenAI, Type } from "@google/genai";
import { JewelryItem } from "../types";

// Note: In a real app, we would use these generated items to actually populate a database
// or find similar real items. Here we simulate "finding" items by generating them.

export const searchJewelryWithAI = async (query: string): Promise<JewelryItem[]> => {
  if (!process.env.API_KEY) {
    console.warn("API Key missing, returning empty list");
    return [];
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a list of 3 jewelry 3D model concepts based on the search query: "${query}". 
      Return the data as if they were existing items in a database.
      Include technical details like estimated weight, stone count, etc.
      For the image URL, just use a placeholder string, I will replace it later.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              category: { type: Type.STRING, enum: ['Anel', 'Pingente', 'Bracelete', 'Brincos', 'Colecoes', 'Outros'] },
              description: { type: Type.STRING },
              downloadCount: { type: Type.INTEGER },
              material: { type: Type.STRING },
              weight: { type: Type.STRING },
              sku: { type: Type.STRING },
              createdAt: { type: Type.STRING },
              ringSize: { type: Type.STRING },
              stoneCount: { type: Type.INTEGER },
              stoneSize: { type: Type.STRING },
              stoneShape: { type: Type.STRING },
            },
            required: ["id", "name", "category", "description", "downloadCount", "material", "weight"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const items = JSON.parse(text) as Partial<JewelryItem>[];
    
    // Enrich with images
    return items.map((item, index) => {
      const baseId = Date.now() + index;
      return {
        ...item,
        id: `ai-${baseId}`,
        imageUrl: `https://picsum.photos/400/400?random=${baseId}`,
        images: [
           `https://picsum.photos/400/400?random=${baseId}`,
           `https://picsum.photos/400/400?random=${baseId + 100}`,
           `https://picsum.photos/400/400?random=${baseId + 200}`
        ],
        downloadCount: item.downloadCount || 0,
        createdAt: new Date().toLocaleDateString('pt-BR')
      };
    }) as JewelryItem[];

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return [];
  }
};