import { GoogleGenerativeAI } from "@google/generative-ai";
import { ParsedChatData } from "./parse-json";

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

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

interface AnalysisResult {
  descriptive: {
    personality_summary_sender: string;
    personality_summary_receiver: string;
    communication_style: string;
    emotional_dynamics: string;
    relationship_health: string;
  };
  quantitative: {
    message_frequency: number;
    response_time_avg: number;
    emotion_scores: {
      positive: number;
      negative: number;
      neutral: number;
    };
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
      relationship_health: analyses.map(a => a.descriptive.relationship_health).join(" ")
    },
    quantitative: {
      message_frequency: analyses.reduce((sum, a) => sum + a.quantitative.message_frequency, 0) / analyses.length,
      response_time_avg: analyses.reduce((sum, a) => sum + a.quantitative.response_time_avg, 0) / analyses.length,
      emotion_scores: {
        positive: analyses.reduce((sum, a) => sum + a.quantitative.emotion_scores.positive, 0) / analyses.length,
        negative: analyses.reduce((sum, a) => sum + a.quantitative.emotion_scores.negative, 0) / analyses.length,
        neutral: analyses.reduce((sum, a) => sum + a.quantitative.emotion_scores.neutral, 0) / analyses.length
      }
    }
  };
}

async function analyzeChatData(
  data: ParsedChatData,
  onProgress: (progress: number, status: string) => void
): Promise<AnalysisResult> {
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

  const chunks = chunkMessages(data.textMessages);
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
    "relationship_health": "string"
  },
  "quantitative": {
    "message_frequency": number,
    "response_time_avg": number,
    "emotion_scores": {
      "positive": number,
      "negative": number,
      "neutral": number
    }
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
}

async function analyzeMultipleChatFiles(
  files: ChatFile[],
  onProgress?: (progress: number, status: string) => void
): Promise<AnalysisResult> {
  const analyses: AnalysisResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (!file.data) continue;

    const fileProgress = Math.floor((i / files.length) * 100);
    onProgress?.(fileProgress, `Analyzing file ${i + 1} of ${files.length}...`);

    try {
      const analysis = await analyzeChatData(file.data, (progress, status) => {
        const overallProgress = Math.floor((fileProgress + (progress / files.length)));
        onProgress?.(overallProgress, status || `Processing file ${i + 1}...`);
      });
      analyses.push(analysis);
    } catch (error) {
      console.error(`Error analyzing file ${file.file.name}:`, error);
      throw error;
    }
  }

  onProgress?.(100, "Analysis complete");
  return combineAnalyses(analyses);
}

// Export the functions
export { analyzeChatData, analyzeMultipleChatFiles, type AnalysisResult }; 