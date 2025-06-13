import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AnalysisResult } from "./types"

interface ChatMessage {
  sender_name: string
  timestamp_ms: number
  content: string
  is_geoblocked_for_viewer: boolean
}

interface ChatData {
  participants: { name: string }[]
  messages: ChatMessage[]
}

export default async function analyzeChatWithGemini(chatData: string): Promise<AnalysisResult> {
  try {
    // Get API key from localStorage
    const apiKey = localStorage.getItem("gemini-api-key")
    if (!apiKey) {
      console.warn("API key not found, using mock data")
      return {
        quantitative: {
          emotional_intimacy: 80,
          emotional_vulnerability: 70,
          emotional_balance: 75,
          romantic_affection: 85,
          emotional_mirroring: 80,
          expressions_of_missing_or_longing: 75,
          feeling_of_home: 80,
          emotional_dependency: 70,
          empathy_signals: 85,
          trust_level: 80,
          sense_of_security: 75,
          disclosure_depth: 70,
          willingness_to_reconcile: 80,
          respect_level: 85,
          tone_consistency: 80,
          love_language_alignment: 75,
          nickname_frequency: 70,
          inside_jokes_present: 80,
          long_message_ratio: 75,
          response_speed: 80,
          frequency_of_check_ins: 70,
          future_commitment_signals: 85,
          imagining_shared_future: 80,
          planning_together: 75,
          sacrifices_mentioned: 70,
          mutual_care: 85,
          consistency_in_attention: 80,
          care_in_small_details: 75,
          message_prioritization: 80,
          expressed_needs: 70,
          attention_to_mood_swings: 75,
          effort_reciprocity: 80,
          playfulness: 85,
          conflict_handling: 75,
          daydreaming_references: 70
        },
        descriptive: {
          personality_summary_sender: "Using mock data for Charles Leclerc. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          personality_summary_receiver: "Using mock data for Alexa. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          togetherness_outlook: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          communication_style_description: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          emotional_depth_description: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          intellectual_connection_description: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          relationship_growth_potential: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          long_term_stability_prediction: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          dependency_balance_description: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438",
          friendship_layer_strength: "Using mock data. API key not working. Please check your API key: AIzaSyBVMzmmDuO_6ujaj8TGVkt2EZqa6qz2438"
        }
      }
    }

    // Parse the chat data
    const data: ChatData = JSON.parse(chatData)
    const [participant1, participant2] = data.participants.map(p => p.name)

    // Initialize the Gemini API
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" })

    // Prepare the prompt for analysis
    const prompt = `Analyze this chat conversation between ${participant1} and ${participant2}. 
    Provide a detailed analysis in the following JSON format:
    {
      "quantitative": {
        "emotional_intimacy": number (0-100),
        "emotional_vulnerability": number (0-100),
        "emotional_balance": number (0-100),
        "romantic_affection": number (0-100),
        "emotional_mirroring": number (0-100),
        "expressions_of_missing_or_longing": number (0-100),
        "feeling_of_home": number (0-100),
        "emotional_dependency": number (0-100),
        "empathy_signals": number (0-100),
        "trust_level": number (0-100),
        "sense_of_security": number (0-100),
        "disclosure_depth": number (0-100),
        "willingness_to_reconcile": number (0-100),
        "respect_level": number (0-100),
        "tone_consistency": number (0-100),
        "love_language_alignment": number (0-100),
        "nickname_frequency": number (0-100),
        "inside_jokes_present": number (0-100),
        "long_message_ratio": number (0-100),
        "response_speed": number (0-100),
        "frequency_of_check_ins": number (0-100),
        "future_commitment_signals": number (0-100),
        "imagining_shared_future": number (0-100),
        "planning_together": number (0-100),
        "sacrifices_mentioned": number (0-100),
        "mutual_care": number (0-100),
        "consistency_in_attention": number (0-100),
        "care_in_small_details": number (0-100),
        "message_prioritization": number (0-100),
        "expressed_needs": number (0-100),
        "attention_to_mood_swings": number (0-100),
        "effort_reciprocity": number (0-100),
        "playfulness": number (0-100),
        "conflict_handling": number (0-100),
        "daydreaming_references": number (0-100)
      },
      "descriptive": {
        "personality_summary_sender": "Detailed analysis of ${participant1}'s personality based on their messages",
        "personality_summary_receiver": "Detailed analysis of ${participant2}'s personality based on their messages",
        "togetherness_outlook": "Analysis of how well they complement each other and their relationship dynamics",
        "communication_style_description": "Detailed analysis of their communication patterns and styles",
        "emotional_depth_description": "Analysis of the emotional depth and connection in their conversations",
        "intellectual_connection_description": "Analysis of their intellectual rapport and shared interests",
        "relationship_growth_potential": "Analysis of the relationship's potential for growth and development",
        "long_term_stability_prediction": "Analysis of the relationship's long-term stability and sustainability",
        "dependency_balance_description": "Analysis of their level of interdependence and individual autonomy",
        "friendship_layer_strength": "Analysis of their friendship foundation and shared experiences"
      }
    }

    Consider the following aspects in your analysis:
    1. Message frequency and patterns
    2. Emotional expression and vulnerability
    3. Communication style and tone
    4. Shared experiences and inside jokes
    5. Future planning and commitment signals
    6. Conflict resolution patterns
    7. Support and care expressions
    8. Personal growth and development
    9. Trust and security indicators
    10. Overall relationship dynamics

    Here's the chat data to analyze:
    ${JSON.stringify(data, null, 2)}`

    // Generate analysis using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    // Parse the response
    try {
      const analysis = JSON.parse(text) as AnalysisResult
      return analysis
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError)
      throw new Error("Failed to parse analysis response")
    }
  } catch (error) {
    console.error("Error analyzing chat with Gemini:", error)
    throw new Error("Failed to analyze chat data")
  }
} 