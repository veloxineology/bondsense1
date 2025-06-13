import { GoogleGenerativeAI } from "@google/generative-ai";
import Together from "together-ai";

// Initialize AI providers
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
const together = new Together({
  apiKey: process.env.TOGETHER_API_KEY,
});

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
  ...(process.env.TOGETHER_API_KEY ? [{
    name: "together",
    analyze: async (prompt: string) => {
      try {
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
      } catch (error) {
        console.error("Together AI API error:", error);
        throw new Error(`Together AI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
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
  numProviders: number = providers.length
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