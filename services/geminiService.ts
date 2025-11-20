import { GoogleGenAI, Modality } from "@google/genai";
import { Language } from "../types";

/**
 * Converts the raw base64 string (which might include the data URL prefix)
 * into just the base64 data.
 */
const stripBase64Prefix = (base64Str: string) => {
  return base64Str.replace(/^data:image\/\w+;base64,/, "");
};

const getMimeType = (base64Str: string) => {
  const match = base64Str.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : "image/png";
};

/**
 * Generates the visual technical drawing using gemini-2.5-flash-image
 */
export const generateTechnicalDrawingImage = async (
  apiKey: string,
  imageBase64: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });
  
  // Prompt engineered for line art extraction
  const prompt = `
    Transform this product image into a professional, high-fidelity technical line drawing (vector style).
    Requirements:
    1. White background.
    2. Clean, precise black lines (uniform stroke weight).
    3. No shading, shadows, or gradients.
    4. Add technical dimension lines (arrows) for height and width, but keep labels generic (e.g. empty boxes or 'X').
    5. Maintain exact geometric proportions.
    6. Style: Engineering diagram/patent illustration.
  `;

  const base64Data = stripBase64Prefix(imageBase64);
  const mimeType = getMimeType(imageBase64);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    // Extract image
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};

/**
 * Generates the step-by-step textual analysis plan using gemini-2.5-flash
 */
export const generateTechnicalPlan = async (
  apiKey: string,
  imageBase64: string,
  language: Language = 'en'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey });

  const base64Data = stripBase64Prefix(imageBase64);
  const mimeType = getMimeType(imageBase64);

  const languageInstruction = language === 'ar' 
    ? "Output the response in Arabic language. Use technical Arabic terminology suitable for engineering." 
    : "Output the response in English.";

  const systemInstruction = `
    Act like a senior graphic designer and technical illustrator.
    Your goal is to analyze the provided product photo and output a structured plan for converting it into a technical drawing.
    Format the output as a structured, step-by-step markdown list.
    Include:
    1. Extraction Steps (identifying shapes).
    2. Drawing Steps (outlines, details).
    3. Measurement Placement (where to put dimensions).
    4. Quality Check (tolerances, clarity).
    ${languageInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: "Provide the technical illustration plan for this object.",
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
      },
    });

    return response.text || "No analysis provided.";
  } catch (error) {
    console.error("Text Analysis Error:", error);
    throw error;
  }
};