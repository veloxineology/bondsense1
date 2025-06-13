import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Together from "together-ai";

// Initialize AI providers
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// Initialize OpenRouter client only if API key is available
const openRouter = process.env.OPENAI_API_KEY ? new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
  defaultHeaders: process.env.NEXT_PUBLIC_SITE_URL ? {
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL,
    "X-Title": "Chat Analysis App",
  } : undefined,
  dangerouslyAllowBrowser: true,
}) : null;

const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

// Add error handling for missing API keys
if (!process.env.OPENAI_API_KEY) {
  console.warn("OpenRouter API key is missing. OpenRouter provider will be disabled.");
}

export interface AIProvider {
  name: string;
  analyze: (prompt: string) => Promise<string>;
}

export const providers: AIProvider[] = [
  {
    name: "gemini",
    analyze: async (prompt: string) => {
      if (!process.env.GOOGLE_AI_API_KEY) {
        throw new Error("Google AI API key is missing");
      }
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const result = await model.generateContent(prompt);
      return result.response.text();
    },
  },
  ...(openRouter ? [{
    name: "openrouter",
    analyze: async (prompt: string) => {
      if (!openRouter) {
        throw new Error("OpenRouter client is not initialized");
      }
      const completion = await openRouter.chat.completions.create({
        model: "google/gemini-2.0-flash-exp:free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenRouter");
      }
      return content;
    },
  }] : []),
  ...(process.env.TOGETHER_API_KEY ? [{
    name: "together",
    analyze: async (prompt: string) => {
      const response = await together.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from Together AI");
      }
      return content;
    },
  }] : []),
];

// Function to get a provider in round-robin fashion
let currentProviderIndex = 0;
export function getNextProvider(): AIProvider {
  const provider = providers[currentProviderIndex];
  currentProviderIndex = (currentProviderIndex + 1) % providers.length;
  return provider;
}

// Function to analyze text using multiple providers in parallel
export async function analyzeWithMultipleProviders(
  prompt: string,
  numProviders: number = 3 // Updated to use all three providers
): Promise<string[]> {
  const selectedProviders = providers.slice(0, numProviders);
  const results = await Promise.all(
    selectedProviders.map((provider) => provider.analyze(prompt))
  );
  return results;
}

// Function to merge multiple analysis results
export function mergeAnalysisResults(results: string[]): any {
  // TODO: Implement smart merging logic
  // For now, just return the first valid JSON result
  for (const result of results) {
    try {
      const parsed = JSON.parse(result);
      if (isValidAnalysisResult(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error("Failed to parse result:", e);
    }
  }
  throw new Error("No valid analysis results found");
}

// Type guard to check if a result matches our expected format
function isValidAnalysisResult(result: any): boolean {
  return (
    result &&
    typeof result === "object" &&
    "descriptive" in result &&
    "quantitative" in result &&
    typeof result.descriptive === "object" &&
    typeof result.quantitative === "object"
  );
} 