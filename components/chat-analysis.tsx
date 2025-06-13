"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, MessageCircle, TrendingUp, Users, Brain, Zap } from "lucide-react"

interface AnalysisData {
  participants: string[]
  sentiments: Record<string, string>
  tones: Record<string, string[]>
  emotions_detected: Record<string, string[]>
  intents: Record<string, string[]>
  toxicity_index: Record<string, string>
  openness_score: Record<string, string>
  trust_score: Record<string, string>
  love_index: Record<string, string>
  sarcasm_usage: Record<string, string>
  curiosity_level: Record<string, string>
  responsiveness: {
    user1_response_rate: string
    user2_response_rate: string
    most_engaged: string
  }
  message_balance: {
    user1_msg_count: number
    user2_msg_count: number
  }
  emotional_shift: string
  relationship_summary: string
  message_stats: {
    total_messages: number
    avg_message_length: number
    conversation_duration: string
  }
}

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"]

const getScoreValue = (score: string) => {
  switch (score.toLowerCase()) {
    case "very high":
      return 95
    case "high":
      return 85
    case "medium":
      return 50
    case "low":
      return 20
    case "very low":
      return 10
    default:
      return 0
  }
}

const getSentimentColor = (sentiment: string) => {
  switch (sentiment.toLowerCase()) {
    case "positive":
      return "bg-green-500 text-white"
    case "negative":
      return "bg-red-500 text-white"
    case "neutral":
      return "bg-gray-500 text-white"
    case "mixed":
      return "bg-yellow-500 text-white"
    default:
      return "bg-gray-300 text-black"
  }
}

export default function ChatAnalysis({ data }: { data: AnalysisData }) {
  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  {data.message_stats.total_messages}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total Messages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 shadow-lg dark:from-green-950 dark:to-green-900 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{data.participants.length}</p>
                <p className="text-sm text-green-700 dark:text-green-300">Participants</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg dark:from-purple-950 dark:to-purple-900 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  {data.message_stats.avg_message_length}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300">Avg Length</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg dark:from-orange-950 dark:to-orange-900 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                  {data.message_stats.conversation_duration}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">Duration</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Distribution - Simple Visual */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-black dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Message Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {data.participants.map((participant, index) => {
              const messageCount =
                index === 0 ? data.message_balance.user1_msg_count : data.message_balance.user2_msg_count
              const totalMessages = data.message_balance.user1_msg_count + data.message_balance.user2_msg_count
              const percentage = Math.round((messageCount / totalMessages) * 100)

              return (
                <div key={participant} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black dark:text-white">{participant}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {messageCount} messages ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${index === 0 ? "bg-blue-500" : "bg-green-500"}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Emotional Metrics - Simple Bars */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-black dark:text-white flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Emotional Metrics Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            {["Trust", "Love", "Openness", "Curiosity"].map((metric, metricIndex) => (
              <div key={metric} className="space-y-3">
                <h4 className="font-medium text-black dark:text-white">{metric}</h4>
                <div className="space-y-2">
                  {data.participants.map((participant, participantIndex) => {
                    let score = "medium"
                    if (metric === "Trust") score = data.trust_score[participant] || "medium"
                    if (metric === "Love") score = data.love_index[participant] || "medium"
                    if (metric === "Openness") score = data.openness_score[participant] || "medium"
                    if (metric === "Curiosity") score = data.curiosity_level[participant] || "medium"

                    const value = getScoreValue(score)

                    return (
                      <div key={participant} className="flex items-center space-x-3">
                        <div className="w-24 text-sm text-gray-700 dark:text-gray-300">{participant}</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ${participantIndex === 0 ? "bg-blue-500" : "bg-green-500"}`}
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-sm text-gray-600 dark:text-gray-400">{score}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sentiment and Engagement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Heart className="h-5 w-5 text-red-500" />
              Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.participants.map((participant) => (
                <div key={participant} className="flex items-center justify-between">
                  <span className="font-medium text-black dark:text-white">{participant}</span>
                  <Badge className={`${getSentimentColor(data.sentiments[participant])} border-0`}>
                    {data.sentiments[participant]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="flex items-center gap-2 text-black dark:text-white">
              <Brain className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Engagement Levels
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-black dark:text-white">{data.participants[0]} Response Rate</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data.responsiveness.user1_response_rate}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                  <div
                    className="h-3 rounded-full transition-all duration-1000 ease-out bg-blue-500"
                    style={{
                      width: `${getScoreValue(data.responsiveness.user1_response_rate)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-black dark:text-white">{data.participants[1]} Response Rate</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {data.responsiveness.user2_response_rate}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700">
                  <div
                    className="h-3 rounded-full transition-all duration-1000 ease-out bg-green-500"
                    style={{
                      width: `${getScoreValue(data.responsiveness.user2_response_rate)}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-black dark:text-white">Most Engaged: </span>
                <Badge className="bg-purple-500 text-white border-0">{data.responsiveness.most_engaged}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-black dark:text-white">Emotional Traits</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.participants.map((participant, participantIndex) => (
                <div key={participant}>
                  <h4 className="font-medium mb-2 text-black dark:text-white">{participant}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {data.emotions_detected[participant]?.map((emotion, index) => (
                      <Badge
                        key={index}
                        style={{ backgroundColor: COLORS[(participantIndex * 3 + index) % COLORS.length] }}
                        className="text-white text-xs hover:scale-105 transition-transform border-0"
                      >
                        {emotion}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800">
            <CardTitle className="text-black dark:text-white">Communication Tones</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.participants.map((participant, participantIndex) => (
                <div key={participant}>
                  <h4 className="font-medium mb-2 text-black dark:text-white">{participant}</h4>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {data.tones[participant]?.map((tone, index) => (
                      <Badge
                        key={index}
                        style={{ backgroundColor: COLORS[(participantIndex * 4 + index + 2) % COLORS.length] }}
                        className="text-white text-xs hover:scale-105 transition-transform border-0"
                      >
                        {tone}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Behavioral Insights */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-black dark:text-white">Behavioral Insights</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {data.participants.map((participant, index) => (
              <div key={participant} className="space-y-3">
                <h4 className="font-medium text-center text-black dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                  {participant}
                </h4>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Toxicity</span>
                    <Badge style={{ backgroundColor: COLORS[index * 2] }} className="text-white border-0">
                      {data.toxicity_index[participant]}
                    </Badge>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">Sarcasm</span>
                    <Badge style={{ backgroundColor: COLORS[index * 2 + 1] }} className="text-white border-0">
                      {data.sarcasm_usage[participant]}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className="border-2 border-gray-200 bg-white shadow-lg dark:bg-gray-900 dark:border-gray-800">
        <CardHeader className="border-b border-gray-100 dark:border-gray-800">
          <CardTitle className="text-black dark:text-white">Relationship Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h4 className="font-medium mb-3 text-black dark:text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                Emotional Evolution
              </h4>
              <p className="text-gray-700 dark:text-gray-300 bg-green-50 dark:bg-green-900/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
                {data.emotional_shift}
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-black dark:text-white flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-500" />
                Overall Analysis
              </h4>
              <p className="text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
                {data.relationship_summary}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
