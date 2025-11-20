



import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Ensure the API key is available in the environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("API_KEY for Gemini is not set in environment variables.");
}

// FIX: Initialize GoogleGenAI with a named parameter as required by the new SDK version.
const ai = new GoogleGenAI({ apiKey: API_KEY! });

// This helper is for internal use within this service to add resilience.
const withRetry = async <T>(
  apiCall: () => Promise<T>,
  onRetryAttempt?: (attempt: number, maxRetries: number) => void
): Promise<T> => {
  const MAX_RETRIES = 5;
  const INITIAL_DELAY_MS = 1000;
  let lastError: any = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      console.error(`Gemini API call attempt ${attempt + 1} failed:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      const isRetryable = errorMessage.includes('503') || 
                          errorMessage.toLowerCase().includes('unavailable') || 
                          errorMessage.toLowerCase().includes('overloaded');

      if (isRetryable) {
        if (attempt < MAX_RETRIES - 1) {
          if (onRetryAttempt) {
            onRetryAttempt(attempt + 1, MAX_RETRIES);
          }
          const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
          console.log(`Model overloaded. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error("Max retries reached for retryable error. Failing.");
          break; // Exit loop to throw last error
        }
      } else {
        // Not a retryable error, break and throw immediately
        break;
      }
    }
  }
  throw lastError; // Throw the last captured error
};

// Utility function to convert a file to a base64 generative part
const fileToGenerativePart = async (file: File) => {
  const base64EncodedData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  return {
    inlineData: {
      data: base64EncodedData,
      mimeType: file.type,
    },
  };
};

export const runGemini = async (
  model: string,
  prompt: string,
  file?: File,
  onRetryAttempt?: (attempt: number, maxRetries: number) => void,
  config?: any
): Promise<GenerateContentResponse> => {
  if (!API_KEY) {
    throw new Error("Gemini API key is not configured.");
  }
  
  try {
    const contents = file
      // FIX: The new API expects contents to be a structured object, not a plain string.
      ? { parts: [{ text: prompt }, await fileToGenerativePart(file)] }
      : { parts: [{ text: prompt }] };

    const response = await withRetry(
      () =>
        ai.models.generateContent({
          model: model,
          contents: contents,
          ...(config && { config: config })
        }),
      onRetryAttempt
    );

    return response;
  } catch (error) {
    console.error("Error calling Gemini API after all retries:", error);
    if (error instanceof Error) {
        throw new Error(`An error occurred: ${error.message}`);
    }
    throw new Error("An unknown error occurred while contacting the Gemini API.");
  }
};

// New function to support the Admin Page AI generator with retry logic
export const generateServiceConfigWithAI = async (prompt: string, schema: any): Promise<GenerateContentResponse> => {
    if (!API_KEY) {
        throw new Error("API_KEY for Gemini is not set.");
    }

    return withRetry(() => 
        ai.models.generateContent({
            // FIX: Updated deprecated 'gemini-2.5-pro' to 'gemini-3-pro-preview' for complex text tasks.
            model: 'gemini-3-pro-preview',
            // FIX: The new API expects contents to be a structured object.
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        })
    );
};

export const generateCategoryConfigWithAI = async (prompt: string, schema: any): Promise<GenerateContentResponse> => {
    if (!API_KEY) {
        throw new Error("API_KEY for Gemini is not set.");
    }

    return withRetry(() => 
        ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        })
    );
};