
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
      
      // Check for 429 (Quota Exceeded) specifically. 
      // Usually, retrying immediately on quota exceeded (daily limit) is futile, 
      // but if it's rate limiting (RPM), a backoff might work. 
      // However, typically 429 from Gemini means "Resource Exhausted" which is often the hard limit.
      // We will NOT retry 429 to avoid spamming the API when it's already rejecting us.
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
        // Not a retryable error (like 400, 401, 429), break and throw immediately
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

// Helper to handle and format errors consistently
const handleGeminiError = (error: unknown): never => {
    console.error("Gemini API Error:", error);
    if (error instanceof Error) {
        const msg = error.message;
        // Handle Quota Exhausted (429) specifically
        if (msg.includes('429') || msg.includes('Resource has been exhausted') || msg.includes('RESOURCE_EXHAUSTED')) {
             // Throwing a specific key/code that consumers can translate
             throw new Error("QUOTA_EXHAUSTED");
        }
        throw new Error(`AI Service Error: ${msg}`);
    }
    throw new Error("An unknown error occurred with the AI service.");
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
    handleGeminiError(error);
  }
};

// New function to support the Admin Page AI generator with retry logic
export const generateServiceConfigWithAI = async (prompt: string, schema: any): Promise<GenerateContentResponse> => {
    if (!API_KEY) {
        throw new Error("API_KEY for Gemini is not set.");
    }

    try {
        return await withRetry(() => 
            ai.models.generateContent({
                // FIX: Using 'gemini-2.5-flash' is safer and faster for JSON generation tasks than pro-preview.
                model: 'gemini-2.5-flash',
                // FIX: The new API expects contents to be a structured object.
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            })
        );
    } catch (error) {
        handleGeminiError(error);
    }
};

export const generateCategoryConfigWithAI = async (prompt: string, schema: any): Promise<GenerateContentResponse> => {
    if (!API_KEY) {
        throw new Error("API_KEY for Gemini is not set.");
    }

    try {
        return await withRetry(() => 
            ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [{ text: prompt }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: schema,
                },
            })
        );
    } catch (error) {
        handleGeminiError(error);
    }
};
