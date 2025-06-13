"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Download, Share2, AlertCircle } from "lucide-react"
import RelationshipAnalysis from "@/components/relationship-analysis"
import { analyzeChatWithGemini } from "@/lib/analyze-chat"
import { useRouter } from "next/navigation"
import { type ParsedChatData, formatDateRange } from "@/lib/parse-json"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function InsightsPage() {
  const router = useRouter()
  const [chatData, setChatData] = useState<ParsedChatData | null>(null)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [fadeIn, setFadeIn] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to analyze chat
  const analyzeChat = async (data: ParsedChatData) => {
    setIsLoading(true)
    try {
      // In a real app, you would send the chat data to the Gemini API
      // For now, we'll use mock data but with real participant names
      const result = await analyzeChatWithGemini(JSON.stringify(data))

      // Customize the mock data with real participant names
      if (data.participants.length >= 2) {
        const [participant1, participant2] = data.participants

        // Update participant names in the mock data
        if (result.descriptive) {
          result.descriptive.personality_summary_sender = `${participant1} appears to be thoughtful, analytical, and emotionally aware. They communicate with clarity and often take time to reflect before responding. They show a tendency to use humor to diffuse tension and are generally supportive and encouraging.`

          result.descriptive.personality_summary_receiver = `${participant2} comes across as warm, empathetic, and expressive. They communicate their feelings openly and respond quickly to messages. They show a strong desire for connection and often initiate deep conversations.`

          result.descriptive.togetherness_outlook = `${participant1} and ${participant2} complement each other well, with one providing emotional depth and the other bringing analytical clarity. Their communication styles mesh effectively, creating a balanced dynamic.`

          result.descriptive.relationship_growth_potential = `The relationship between ${participant1} and ${participant2} shows strong potential for continued growth. Both individuals demonstrate willingness to learn from each other and adapt their communication styles to better meet each other's needs.`

          result.descriptive.long_term_stability_prediction = `The foundation of trust, respect, and mutual care between ${participant1} and ${participant2} suggests this relationship has good long-term stability. Their ability to navigate conflicts constructively further strengthens this outlook.`

          result.descriptive.communication_style_description = `The communication between ${participant1} and ${participant2} is characterized by mutual respect and attentiveness. They listen actively to each other and respond thoughtfully, creating a safe space for vulnerability.`

          result.descriptive.emotional_depth_description = `There is significant emotional depth in this relationship, with both ${participant1} and ${participant2} willing to share personal struggles and celebrate successes together. Their emotional connection appears to be growing stronger over time.`
        }
      }

      setAnalysisData(result)
    } catch (error) {
      console.error("Error analyzing chat:", error)
      setError("Failed to analyze chat data. Please try uploading your files again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Check if API key is set
    const apiKey = localStorage.getItem("gemini-api-key")
    if (!apiKey) {
      router.push("/")
      return
    }

    // Get chat data from localStorage
    const storedData = localStorage.getItem("chat-analysis-data")
    if (!storedData) {
      router.push("/upload")
      return
    }

    try {
      const parsedData = JSON.parse(storedData) as ParsedChatData
      setChatData(parsedData)
      analyzeChat(parsedData)
    } catch (error) {
      console.error("Error parsing stored chat data:", error)
      setError("Failed to load chat data. Please try uploading your files again.")
    }

    // Start fade-in animation
    setTimeout(() => {
      setFadeIn(true)
    }, 100)
  }, [router])

  // Filter data based on active tab
  const getFilteredData = () => {
    if (!analysisData) return null

    switch (activeTab) {
      case "overview":
        return {
          quantitative: {
            emotional_intimacy: analysisData.quantitative.emotional_intimacy,
            trust_level: analysisData.quantitative.trust_level,
            mutual_care: analysisData.quantitative.mutual_care,
            consistency_in_attention: analysisData.quantitative.consistency_in_attention,
            emotional_vulnerability: analysisData.quantitative.emotional_vulnerability,
            future_commitment_signals: analysisData.quantitative.future_commitment_signals,
            emotional_balance: analysisData.quantitative.emotional_balance,
            sense_of_security: analysisData.quantitative.sense_of_security,
          },
          descriptive: {
            togetherness_outlook: analysisData.descriptive.togetherness_outlook,
            personality_summary_sender: analysisData.descriptive.personality_summary_sender,
            personality_summary_receiver: analysisData.descriptive.personality_summary_receiver,
            communication_style_description: analysisData.descriptive.communication_style_description,
          },
        }
      case "compatibility":
        return {
          quantitative: {
            love_language_alignment: analysisData.quantitative.love_language_alignment,
            emotional_mirroring: analysisData.quantitative.emotional_mirroring,
            effort_reciprocity: analysisData.quantitative.effort_reciprocity,
            conflict_handling: analysisData.quantitative.conflict_handling,
            respect_level: analysisData.quantitative.respect_level,
            empathy_signals: analysisData.quantitative.empathy_signals,
            playfulness: analysisData.quantitative.playfulness,
          },
          descriptive: {
            togetherness_outlook: analysisData.descriptive.togetherness_outlook,
            intellectual_connection_description: analysisData.descriptive.intellectual_connection_description,
            dependency_balance_description: analysisData.descriptive.dependency_balance_description,
            friendship_layer_strength: analysisData.descriptive.friendship_layer_strength,
          },
        }
      case "future":
        return {
          quantitative: {
            future_commitment_signals: analysisData.quantitative.future_commitment_signals,
            imagining_shared_future: analysisData.quantitative.imagining_shared_future,
            planning_together: analysisData.quantitative.planning_together,
            sacrifices_mentioned: analysisData.quantitative.sacrifices_mentioned,
            trust_level: analysisData.quantitative.trust_level,
            sense_of_security: analysisData.quantitative.sense_of_security,
          },
          descriptive: {
            relationship_growth_potential: analysisData.descriptive.relationship_growth_potential,
            long_term_stability_prediction: analysisData.descriptive.long_term_stability_prediction,
          },
        }
      default:
        return analysisData
    }
  }

  // Format message distribution for display
  const getMessageDistribution = () => {
    if (!chatData) return null

    const total = chatData.messageCount
    const distribution = Object.entries(chatData.messagesByParticipant).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    }))

    return distribution
  }

  const messageDistribution = getMessageDistribution()
  const chatTitle = chatData?.participants.join(" & ")
  const timeSpan = chatData?.timeSpan ? formatDateRange(chatData.timeSpan.start, chatData.timeSpan.end) : ""
  const messageCount = chatData?.messageCount || 0
  const durationDays = chatData?.timeSpan?.durationDays || 0

  return (
    <MainLayout>
      <div className={`transition-opacity duration-1000 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
        <div className="flex items-center justify-between mb-6 animate-slide-down">
          <h1 className="text-3xl font-bold">Relationship Insights</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="mb-6 animate-slide-up">
          <CardHeader className="bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary animate-pulse-slow" />
                <CardTitle>{chatTitle ? `${chatTitle} Relationship Analysis` : "Relationship Analysis"}</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="hover:scale-105 transition-transform">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            <CardDescription>
              Based on {messageCount} messages over {durationDays} days ({timeSpan})
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs defaultValue="overview" className="w-full" onValueChange={(value) => setActiveTab(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview" className="transition-all hover:bg-muted/80">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="compatibility" className="transition-all hover:bg-muted/80">
                  Compatibility
                </TabsTrigger>
                <TabsTrigger value="future" className="transition-all hover:bg-muted/80">
                  Future Outlook
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-6 animate-fade-in">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Analyzing your relationship data...</p>
                  </div>
                ) : analysisData ? (
                  <RelationshipAnalysis
                    data={getFilteredData() || analysisData}
                    messageDistribution={messageDistribution}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No analysis data available. Please try uploading your files again.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="compatibility" className="pt-6 animate-fade-in">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Analyzing compatibility factors...</p>
                  </div>
                ) : analysisData ? (
                  <RelationshipAnalysis
                    data={getFilteredData() || analysisData}
                    messageDistribution={messageDistribution}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No analysis data available. Please try uploading your files again.</p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="future" className="pt-6 animate-fade-in">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">Analyzing future relationship potential...</p>
                  </div>
                ) : analysisData ? (
                  <RelationshipAnalysis
                    data={getFilteredData() || analysisData}
                    messageDistribution={messageDistribution}
                  />
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No analysis data available. Please try uploading your files again.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
