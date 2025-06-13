import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AnalysisResult } from "./types"
import type { ParsedChatData } from "./parse-json"

interface ChatMessage {
  sender_name: string
  timestamp_ms: number
  content: string
}

interface ChatData {
  participants: { name: string }[]
  messages: ChatMessage[]
}

// Initialize the Google Generative AI with your API key
const genAI = new GoogleGenerativeAI("AIzaSyAdRc52V5BRqC-JOxzBxHlyAS9xw_O2hUg")

// Function to chunk messages into smaller parts
function chunkMessages(messages: any[], chunkSize: number = 100) {
  const chunks = []
  for (let i = 0; i < messages.length; i += chunkSize) {
    chunks.push(messages.slice(i, i + chunkSize))
  }
  return chunks
}

// Function to analyze chat data using Gemini
export async function analyzeChatData(chatData: any, onProgress?: (progress: number) => void) {
  try {
    // Get the Gemini 2.0 Flash model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Split messages into chunks
    const messageChunks = chunkMessages(chatData.messages)
    const analyses = []

    // Process each chunk
    for (let i = 0; i < messageChunks.length; i++) {
      const chunk = messageChunks[i]
      const chunkProgress = Math.floor((i / messageChunks.length) * 100)
      onProgress?.(chunkProgress)

      // Prepare the prompt for analysis
      const prompt = `Analyze this portion of chat data and provide insights about the relationship between the participants. 
      Focus on communication patterns, emotional dynamics, and overall relationship health.
      Format the response as a JSON object with the following structure:
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
      }

      Chat Data (Chunk ${i + 1}/${messageChunks.length}):
      ${JSON.stringify({
        participants: chatData.participants,
        messages: chunk
      }, null, 2)}`

      // Generate content with a delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 4000)) // 4 second delay between requests
      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // Clean the response text and parse JSON
      try {
        // Remove any markdown code block markers and clean the text
        const cleanedText = text
          .replace(/```json\n?/g, '') // Remove ```json
          .replace(/```\n?/g, '') // Remove ```
          .replace(/`/g, '') // Remove any remaining backticks
          .trim()

        // Parse the cleaned JSON
        const analysis = JSON.parse(cleanedText)
        analyses.push(analysis)
      } catch (error) {
        console.error("Error parsing analysis response:", error)
        console.error("Raw response:", text)
        const errorMessage = error instanceof Error ? error.message : "Unknown parsing error"
        throw new Error(`Failed to parse analysis response: ${errorMessage}`)
      }

      // Update progress after each chunk
      const nextChunkProgress = Math.floor(((i + 1) / messageChunks.length) * 100)
      onProgress?.(nextChunkProgress)
    }

    // Combine all chunk analyses
    const combinedAnalysis = combineAnalyses(analyses)

    // Update final progress
    onProgress?.(100)

    return combinedAnalysis
  } catch (error) {
    console.error("Error analyzing chat data:", error)
    throw error
  }
}

// Function to analyze multiple chat files
async function analyzeMultipleChatFiles(files: { data: ParsedChatData }[]) {
  try {
    const analyses = []
    const totalFiles = files.length

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i]
      const fileProgress = (i / totalFiles) * 100
      
      // Analyze each file
      const analysis = await analyzeChatData(file.data)

      analyses.push(analysis)
    }

    // Combine analyses
    const combinedAnalysis = combineAnalyses(analyses)

    return combinedAnalysis
  } catch (error) {
    console.error("Error analyzing multiple chat files:", error)
    throw error
  }
}

// Helper function to combine multiple analyses
function combineAnalyses(analyses: any[]) {
  // Implement your logic to combine multiple analyses
  // This is a simple example - you might want to make it more sophisticated
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
  }
}

export default analyzeMultipleChatFiles 