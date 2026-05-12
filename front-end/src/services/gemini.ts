import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractReceiptData(base64Image: string, mimeType: string): Promise<ReceiptData> {
  const prompt = "Extract all relevant information from this receipt image. Be precise with numbers and merchant names.";

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image.split(',')[1] || base64Image,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          merchantName: { type: Type.STRING, description: "Name of the store or restaurant" },
          date: { type: Type.STRING, description: "Date of the transaction (ISO format or as seen)" },
          totalAmount: { type: Type.NUMBER, description: "Total amount paid" },
          currency: { type: Type.STRING, description: "Currency symbol or code (e.g. $, USD, EUR)" },
          taxAmount: { type: Type.NUMBER, description: "Total tax amount" },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                price: { type: Type.NUMBER },
              },
              required: ["description", "price"],
            },
          },
        },
        required: ["merchantName", "totalAmount", "currency"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No data extracted from receipt");
  
  return JSON.parse(text) as ReceiptData;
}
