import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedChatData } from "./parse-json";
import { analyzeWithMultipleProviders, mergeAnalysisResults, providers, type AIProvider } from "./ai-providers";

// Initialize the Google Generative AI with your API key
const API_KEY = process.env.GOOGLE_AI_API_KEY;

// Add detailed logging for debugging
console.log("API Key present:", !!API_KEY);
console.log("API Key length:", API_KEY?.length);
console.log("API Key prefix:", API_KEY?.substring(0, 5) + "...");

if (!API_KEY) {
  throw new Error("GOOGLE_AI_API_KEY environment variable is not set. Please set it in your .env.local file.");
}

// Validate API key format
if (!API_KEY.startsWith("AI")) {
  throw new Error("Invalid API key format. Google AI API keys should start with 'AI'");
}

const genAI = new GoogleGenerativeAI(API_KEY);

interface Message {
  sender_name: string;
  content?: string;
  timestamp_ms: number;
}

interface ChatFile {
  file: File;
  status: "pending" | "processing" | "complete" | "error";
  progress: number;
  data?: ParsedChatData;
  error?: string;
}

export interface AnalysisResult {
  descriptive: {
    personality_summary_sender: string;
    personality_summary_receiver: string;
    communication_style: string;
    emotional_dynamics: string;
    relationship_health: string;
    togetherness_outlook: string;
    relationship_growth_potential: string;
    long_term_stability_prediction: string;
    communication_style_description: string;
    emotional_depth_description: string;
  };
  quantitative: {
    message_frequency: number;
    response_time_avg: number;
    emotion_scores: {
      positive: number;
      negative: number;
      neutral: number;
    };
    emotional_intimacy: number;
    trust_level: number;
    mutual_care: number;
    consistency_in_attention: number;
    emotional_vulnerability: number;
  };
}

function combineAnalyses(analyses: AnalysisResult[]): AnalysisResult {
  // Combine all analyses into a single result
  return {
    descriptive: {
      personality_summary_sender: analyses.map(a => a.descriptive.personality_summary_sender).join(" "),
      personality_summary_receiver: analyses.map(a => a.descriptive.personality_summary_receiver).join(" "),
      communication_style: analyses.map(a => a.descriptive.communication_style).join(" "),
      emotional_dynamics: analyses.map(a => a.descriptive.emotional_dynamics).join(" "),
      relationship_health: analyses.map(a => a.descriptive.relationship_health).join(" "),
      togetherness_outlook: analyses.map(a => a.descriptive.togetherness_outlook).join(" "),
      relationship_growth_potential: analyses.map(a => a.descriptive.relationship_growth_potential).join(" "),
      long_term_stability_prediction: analyses.map(a => a.descriptive.long_term_stability_prediction).join(" "),
      communication_style_description: analyses.map(a => a.descriptive.communication_style_description).join(" "),
      emotional_depth_description: analyses.map(a => a.descriptive.emotional_depth_description).join(" ")
    },
    quantitative: {
      message_frequency: analyses.reduce((sum, a) => sum + a.quantitative.message_frequency, 0) / analyses.length,
      response_time_avg: analyses.reduce((sum, a) => sum + a.quantitative.response_time_avg, 0) / analyses.length,
      emotion_scores: {
        positive: analyses.reduce((sum, a) => sum + a.quantitative.emotion_scores.positive, 0) / analyses.length,
        negative: analyses.reduce((sum, a) => sum + a.quantitative.emotion_scores.negative, 0) / analyses.length,
        neutral: analyses.reduce((sum, a) => sum + a.quantitative.emotion_scores.neutral, 0) / analyses.length
      },
      emotional_intimacy: analyses.reduce((sum, a) => sum + a.quantitative.emotional_intimacy, 0) / analyses.length,
      trust_level: analyses.reduce((sum, a) => sum + a.quantitative.trust_level, 0) / analyses.length,
      mutual_care: analyses.reduce((sum, a) => sum + a.quantitative.mutual_care, 0) / analyses.length,
      consistency_in_attention: analyses.reduce((sum, a) => sum + a.quantitative.consistency_in_attention, 0) / analyses.length,
      emotional_vulnerability: analyses.reduce((sum, a) => sum + a.quantitative.emotional_vulnerability, 0) / analyses.length
    }
  };
}

// Rate limiting configuration
const RATE_LIMITS = {
  gemini: {
    requestsPerMinute: 60,
    delayBetweenRequests: 1000, // 1 second
  },
  openrouter: {
    requestsPerMinute: 30,
    delayBetweenRequests: 2000, // 2 seconds
  },
  together: {
    requestsPerMinute: 20,
    delayBetweenRequests: 3000, // 3 seconds
  },
};

// Request tracking
const requestTimestamps: Record<string, number[]> = {
  gemini: [],
  openrouter: [],
  together: [],
};

// Function to check and wait for rate limits
async function waitForRateLimit(provider: string): Promise<void> {
  const now = Date.now();
  const limit = RATE_LIMITS[provider as keyof typeof RATE_LIMITS];
  
  // Remove timestamps older than 1 minute
  requestTimestamps[provider] = requestTimestamps[provider].filter(
    (timestamp) => now - timestamp < 60000
  );

  // If we've hit the rate limit, wait
  if (requestTimestamps[provider].length >= limit.requestsPerMinute) {
    const oldestRequest = requestTimestamps[provider][0];
    const waitTime = 60000 - (now - oldestRequest);
    if (waitTime > 0) {
      console.log(`Rate limit reached for ${provider}, waiting ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }

  // Add current timestamp
  requestTimestamps[provider].push(now);
  
  // Wait for minimum delay between requests
  await new Promise((resolve) => setTimeout(resolve, limit.delayBetweenRequests));
}

// Function to split messages into chunks based on token count
function splitIntoChunks(messages: Message[], maxTokensPerChunk: number = 1000): Message[][] {
  const chunks: Message[][] = [];
  let currentChunk: Message[] = [];
  let currentTokenCount = 0;

  for (const message of messages) {
    // Rough token estimation (4 characters ≈ 1 token)
    const messageTokens = Math.ceil((message.content?.length || 0) / 4);
    
    if (currentTokenCount + messageTokens > maxTokensPerChunk && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentTokenCount = 0;
    }
    
    currentChunk.push(message);
    currentTokenCount += messageTokens;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export async function analyzeChatData(
  chatData: ParsedChatData
): Promise<AnalysisResult> {
  console.log("Starting chat analysis...");
  console.log("API Keys present:", {
    gemini: !!process.env.GOOGLE_AI_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
    together: !!process.env.TOGETHER_API_KEY,
  });

  if (!process.env.GOOGLE_AI_API_KEY && !process.env.OPENROUTER_API_KEY && !process.env.TOGETHER_API_KEY) {
    throw new Error(
      "No AI API keys found. Please set at least one of: GOOGLE_AI_API_KEY, OPENROUTER_API_KEY, or TOGETHER_API_KEY in your environment variables."
    );
  }

  try {
    // Split messages into chunks based on token count
    const chunks = splitIntoChunks(chatData.messages);
    console.log(`Split chat into ${chunks.length} chunks`);

    const chunkResults = await Promise.all(
      chunks.map(async (chunk: Message[], index: number) => {
        console.log(`Processing chunk ${index + 1}/${chunks.length}`);
        const prompt = `Analyze this chat data and provide insights in JSON format. Focus on communication patterns, emotional dynamics, and relationship insights. Here's the data:

${JSON.stringify(chunk, null, 2)}

IMPORTANT: Your response must be a valid JSON object with EXACTLY this structure:
{
  "descriptive": {
    "personality_summary_sender": "string describing sender's personality",
    "personality_summary_receiver": "string describing receiver's personality",
    "communication_style": "string describing their communication style",
    "emotional_dynamics": "string describing emotional dynamics",
    "relationship_health": "string describing relationship health",
    "togetherness_outlook": "string describing future togetherness",
    "relationship_growth_potential": "string describing growth potential",
    "long_term_stability_prediction": "string describing stability",
    "communication_style_description": "string describing communication",
    "emotional_depth_description": "string describing emotional depth"
  },
  "quantitative": {
    "message_frequency": number between 0 and 100,
    "response_time_avg": number between 0 and 100,
    "emotion_scores": {
      "positive": number between 0 and 100,
      "negative": number between 0 and 100,
      "neutral": number between 0 and 100
    },
    "emotional_intimacy": number between 0 and 100,
    "trust_level": number between 0 and 100,
    "mutual_care": number between 0 and 100,
    "consistency_in_attention": number between 0 and 100,
    "emotional_vulnerability": number between 0 and 100
  }
}

DO NOT include any text before or after the JSON object. The response must be a single, valid JSON object.`;

        // Get results from multiple providers with rate limiting
        const results = await Promise.all(
          providers.map(async (provider: AIProvider) => {
            await waitForRateLimit(provider.name);
            try {
              return await provider.analyze(prompt);
            } catch (error) {
              console.error(`Error with ${provider.name}:`, error);
              return null;
            }
          })
        );

        // Filter out failed results
        const validResults = results.filter((result: string | null): result is string => result !== null);
        console.log(`Got ${validResults.length} valid results for chunk ${index + 1}`);

        if (validResults.length === 0) {
          throw new Error(`No valid results for chunk ${index + 1}`);
        }

        // Merge the results
        const mergedResult = mergeAnalysisResults(validResults);
        console.log(`Successfully merged results for chunk ${index + 1}`);

        return mergedResult;
      })
    );

    // Combine all chunk results
    const finalResult = combineAnalyses(chunkResults);
    console.log("Successfully combined all chunk results");

    return finalResult;
  } catch (error) {
    console.error("Error in analyzeChatData:", error);
    throw error;
  }
}

export async function analyzeMultipleChatFiles(
  files: ChatFile[],
  onProgress: (progress: number, status: string) => void = () => {}
): Promise<AnalysisResult> {
  const analyses: AnalysisResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.data) continue;

    const fileProgress = Math.floor((i / files.length) * 100);
    onProgress(fileProgress, `Processing file ${i + 1} of ${files.length}...`);

    try {
      const analysis = await analyzeChatData(file.data);
      analyses.push(analysis);
    } catch (error) {
      console.error(`Error analyzing file ${i + 1}:`, error);
      throw error;
    }
  }

  return combineAnalyses(analyses);
}