"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageSquareText, Download, Share2, AlertCircle } from "lucide-react"
import RelationshipAnalysis from "@/components/relationship-analysis"
import { analyzeChatData, type AnalysisResult } from "@/lib/chat-analysis"
import { type ParsedChatData, formatDateRange } from "@/lib/parse-json"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ChatAnalysis from "@/components/chat-analysis"
import { toast } from "sonner"
import { MainLayout } from "@/components/main-layout"

export default function AnalysisPage() {
  const router = useRouter()
  const [chatData, setChatData] = useState<ParsedChatData | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const storedData = localStorage.getItem("chatData")
    if (!storedData) {
      router.push("/upload")
      return
    }

    try {
      const parsedData = JSON.parse(storedData)
      setChatData(parsedData)
      analyzeChat(parsedData)
    } catch (error) {
      console.error("Error parsing stored data:", error)
      setError("Failed to load chat data. Please try uploading again.")
      setIsLoading(false)
    }
  }, [router])

  const analyzeChat = async (data: ParsedChatData) => {
    try {
      const result = await analyzeChatData(JSON.stringify(data), (progress: number, status: string) => {
        console.log(`Progress: ${progress}% - ${status}`);
      });
      setAnalysisData(result)
      setIsLoading(false)
    } catch (error) {
      console.error("Error analyzing chat:", error)
      setError("Failed to analyze chat data. Please try again.")
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Analyzing your chat data...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (error) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => router.push("/upload")}>Try Again</Button>
          </div>
        </div>
      </MainLayout>
    )
  }

  if (!chatData || !analysisData) {
    return null
  }

  // Transform chat data into the format expected by ChatAnalysis
  const transformedData = {
    participants: chatData.participants,
    sentiments: {
      [chatData.participants[0]]: "positive",
      [chatData.participants[1]]: "positive"
    },
    tones: {
      [chatData.participants[0]]: ["friendly", "supportive"],
      [chatData.participants[1]]: ["friendly", "supportive"]
    },
    emotions_detected: {
      [chatData.participants[0]]: ["joy", "trust"],
      [chatData.participants[1]]: ["joy", "trust"]
    },
    intents: {
      [chatData.participants[0]]: ["inform", "socialize"],
      [chatData.participants[1]]: ["inform", "socialize"]
    },
    toxicity_index: {
      [chatData.participants[0]]: "very low",
      [chatData.participants[1]]: "very low"
    },
    openness_score: {
      [chatData.participants[0]]: "high",
      [chatData.participants[1]]: "high"
    },
    trust_score: {
      [chatData.participants[0]]: "high",
      [chatData.participants[1]]: "high"
    },
    love_index: {
      [chatData.participants[0]]: "high",
      [chatData.participants[1]]: "high"
    },
    sarcasm_usage: {
      [chatData.participants[0]]: "low",
      [chatData.participants[1]]: "low"
    },
    curiosity_level: {
      [chatData.participants[0]]: "high",
      [chatData.participants[1]]: "high"
    },
    responsiveness: {
      user1_response_rate: "high",
      user2_response_rate: "high",
      most_engaged: chatData.participants[0]
    },
    message_balance: {
      user1_msg_count: chatData.messagesByParticipant[chatData.participants[0]],
      user2_msg_count: chatData.messagesByParticipant[chatData.participants[1]]
    },
    emotional_shift: "positive",
    relationship_summary: "Strong and positive relationship with good communication",
    message_stats: {
      total_messages: chatData.messageCount,
      avg_message_length: chatData.averageMessagesPerDay,
      conversation_duration: `${chatData.timeSpan.durationDays} days`
    }
  }

  // Transform analysis data into the format expected by RelationshipAnalysis
  const transformedAnalysisData = {
    data: {
      quantitative: analysisData.quantitative,
      descriptive: analysisData.descriptive
    },
    messageDistribution: chatData.participants.map(participant => ({
      name: participant,
      count: chatData.messagesByParticipant[participant],
      percentage: Math.round((chatData.messagesByParticipant[participant] / chatData.messageCount) * 100)
    }))
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chat Analysis</h1>
          <p className="text-gray-600">
            Analysis of chat between {chatData.participants.join(" and ")} from{" "}
            {formatDateRange(chatData.timeSpan.start, chatData.timeSpan.end)}
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="relationship">Relationship Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ChatAnalysis data={transformedData} />
          </TabsContent>

          <TabsContent value="relationship">
            <RelationshipAnalysis
              data={{
                quantitative: analysisData.quantitative,
                descriptive: analysisData.descriptive,
              }}
              messageDistribution={chatData.participants.map(participant => ({
                name: participant,
                count: chatData.messagesByParticipant[participant],
                percentage: Math.round((chatData.messagesByParticipant[participant] / chatData.messageCount) * 100)
              }))}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share Analysis
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
