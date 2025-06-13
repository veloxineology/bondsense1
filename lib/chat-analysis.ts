import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedChatData } from "./parse-json";

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

export async function analyzeChatData(
  data: string,
  onProgress: (progress: number, status: string) => void = () => {}
): Promise<AnalysisResult> {
  const parsedData = JSON.parse(data) as ParsedChatData;
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const maxRetries = 3;
    const retryDelay = 5000; // 5 seconds
    const requestDelay = 6000; // 6 seconds between requests to stay well under rate limit

    const chunkMessages = (messages: Message[], chunkSize: number = 30) => { // Reduced chunk size
      const chunks: Message[][] = [];
      for (let i = 0; i < messages.length; i += chunkSize) {
        chunks.push(messages.slice(i, i + chunkSize));
      }
      return chunks;
    };

    const chunks = chunkMessages(parsedData.textMessages);
    const analyses: AnalysisResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let retryCount = 0;
      let success = false;

      while (!success && retryCount < maxRetries) {
        try {
          const chunkProgress = Math.floor((i / chunks.length) * 100);
          const nextChunkProgress = Math.floor(((i + 1) / chunks.length) * 100);
          
          onProgress(chunkProgress, `Analyzing chunk ${i + 1} of ${chunks.length}...`);

          // Add delay before each request
          await new Promise(resolve => setTimeout(resolve, requestDelay));

          const prompt = `Analyze this chat data and provide insights in JSON format. Focus on communication patterns, emotional dynamics, and relationship insights. Here's the data:

${JSON.stringify(chunk, null, 2)}

Provide the analysis in this exact JSON format:
{
  "descriptive": {
    "personality_summary_sender": "string",
    "personality_summary_receiver": "string",
    "communication_style": "string",
    "emotional_dynamics": "string",
    "relationship_health": "string",
    "togetherness_outlook": "string",
    "relationship_growth_potential": "string",
    "long_term_stability_prediction": "string",
    "communication_style_description": "string",
    "emotional_depth_description": "string"
  },
  "quantitative": {
    "message_frequency": number,
    "response_time_avg": number,
    "emotion_scores": {
      "positive": number,
      "negative": number,
      "neutral": number
    },
    "emotional_intimacy": number,
    "trust_level": number,
    "mutual_care": number,
    "consistency_in_attention": number,
    "emotional_vulnerability": number
  }
}`;

          const result = await model.generateContent(prompt);
          const text = result.response.text();
          
          // Clean the response text and parse JSON
          try {
            // Remove any markdown code block markers and clean the text
            const cleanedText = text
              .replace(/```json\n?/g, '') // Remove ```json
              .replace(/```\n?/g, '') // Remove ```
              .replace(/`/g, '') // Remove any remaining backticks
              .trim()

            // Parse the cleaned JSON
            const analysis = JSON.parse(cleanedText) as AnalysisResult;
            analyses.push(analysis);
            success = true;
          } catch (error) {
            console.error("Error parsing analysis response:", error);
            console.error("Raw response:", text);
            const errorMessage = error instanceof Error ? error.message : "Unknown parsing error";
            throw new Error(`Failed to parse analysis response: ${errorMessage}`);
          }

          onProgress(nextChunkProgress, `Completed chunk ${i + 1} of ${chunks.length}`);
        } catch (error) {
          retryCount++;
          const isModelOverloaded = error instanceof Error && 
            error.message.includes('503') && 
            error.message.includes('overloaded');

          if (isModelOverloaded && retryCount < maxRetries) {
            const backoffDelay = retryDelay * Math.pow(2, retryCount - 1); // Exponential backoff
            console.log(`Model overloaded, retrying in ${backoffDelay/1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
            continue;
          }

          if (retryCount === maxRetries) {
            throw new Error(`Failed to analyze chunk after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }

          throw error;
        }
      }
    }

    onProgress(100, "Analysis complete");
    return combineAnalyses(analyses);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("403") && error.message.includes("unregistered callers")) {
        throw new Error("API key is invalid or not properly configured. Please check your GOOGLE_AI_API_KEY environment variable.");
      }
      if (error.message.includes("API key")) {
        throw new Error("API key error: " + error.message);
      }
    }
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
      const analysis = await analyzeChatData(JSON.stringify(file.data), (progress, status) => {
        const overallProgress = Math.floor((fileProgress + (progress / files.length)));
        onProgress(overallProgress, status || `Processing file ${i + 1}...`);
      });
      analyses.push(analysis);
    } catch (error) {
      console.error(`Error analyzing file ${i + 1}:`, error);
      throw error;
    }
  }

  return combineAnalyses(analyses);
} 