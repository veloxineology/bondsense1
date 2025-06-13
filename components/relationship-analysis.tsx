"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { QuantitativeChart } from "./relationship-analysis/quantitative-chart"
import { DescriptiveInsight } from "./relationship-analysis/descriptive-insight"
import { Heart, Brain, MessageCircle, TrendingUp, Users, Sparkles, Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface MessageDistribution {
  name: string
  count: number
  percentage: number
}

interface RelationshipAnalysisProps {
  data: {
    quantitative: Record<string, number>
    descriptive: Record<string, string>
  }
  messageDistribution?: MessageDistribution[] | null
}

// Group parameters by category
const parameterCategories = {
  emotional: [
    "emotional_intimacy",
    "emotional_vulnerability",
    "emotional_balance",
    "romantic_affection",
    "emotional_mirroring",
    "expressions_of_missing_or_longing",
    "feeling_of_home",
    "emotional_dependency",
    "empathy_signals",
  ],
  trust: ["trust_level", "sense_of_security", "disclosure_depth", "willingness_to_reconcile", "respect_level"],
  communication: [
    "tone_consistency",
    "love_language_alignment",
    "nickname_frequency",
    "inside_jokes_present",
    "long_message_ratio",
    "response_speed",
    "frequency_of_check_ins",
  ],
  commitment: ["future_commitment_signals", "imagining_shared_future", "planning_together", "sacrifices_mentioned"],
  care: [
    "mutual_care",
    "consistency_in_attention",
    "care_in_small_details",
    "message_prioritization",
    "expressed_needs",
    "attention_to_mood_swings",
  ],
  interaction: ["effort_reciprocity", "playfulness", "conflict_handling", "daydreaming_references"],
}

export default function RelationshipAnalysis({ data, messageDistribution }: RelationshipAnalysisProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(() => {
    // Start fade-in animation
    setTimeout(() => {
      setFadeIn(true)
    }, 100)
  }, [])

  // Calculate average scores for each category
  const categoryScores = Object.entries(parameterCategories).reduce(
    (acc, [category, params]) => {
      const categoryParams = params.filter((param) => param in data.quantitative)
      if (categoryParams.length === 0) return acc

      const sum = categoryParams.reduce((sum, param) => sum + (data.quantitative[param] || 0), 0)
      acc[category] = Math.round(sum / categoryParams.length)
      return acc
    },
    {} as Record<string, number>,
  )

  // Get top strengths (parameters with highest scores)
  const topStrengths = Object.entries(data.quantitative)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .slice(0, 5)

  // Get areas for improvement (parameters with lowest scores)
  const areasForImprovement = Object.entries(data.quantitative)
    .sort(([, scoreA], [, scoreB]) => scoreA - scoreB)
    .slice(0, 5)

  return (
    <div className={`space-y-8 transition-opacity duration-1000 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(categoryScores).map(([category, score]) => (
          <Card key={category} className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg dark:from-blue-950 dark:to-blue-900 dark:border-blue-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-blue-700 dark:text-blue-300">Score</span>
                  <span className="font-medium text-blue-900 dark:text-blue-100">{score}%</span>
                </div>
                <Progress value={score} className="h-2 bg-blue-200 dark:bg-blue-800" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message Distribution - if available */}
      {messageDistribution && messageDistribution.length > 0 && (
        <Card className="border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-black flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Message Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {messageDistribution.map((item, index) => (
                <div
                  key={item.name}
                  className="space-y-2 animate-slide-right"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-black">{item.name}</span>
                    <span className="text-sm text-gray-600">
                      {item.count} messages ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-1000 ${index % 2 === 0 ? "bg-blue-500" : "bg-green-500"}`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Analysis Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="transition-all hover:bg-muted/80">
            Overview
          </TabsTrigger>
          <TabsTrigger value="quantitative" className="transition-all hover:bg-muted/80">
            Quantitative
          </TabsTrigger>
          <TabsTrigger value="descriptive" className="transition-all hover:bg-muted/80">
            Descriptive
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="pt-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Strengths */}
            <Card className="border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-black flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-green-600 animate-pulse-slow" />
                  Relationship Strengths
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {topStrengths.map(([param, score], index) => (
                    <div
                      key={param}
                      className="flex items-center justify-between animate-slide-right"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="text-gray-700">
                        {param
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                      <Badge className={`${score >= 80 ? "bg-green-500" : "bg-blue-500"} text-white`}>{score}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Areas for Improvement */}
            <Card className="border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-black flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-yellow-600 animate-pulse-slow" />
                  Growth Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {areasForImprovement.map(([param, score], index) => (
                    <div
                      key={param}
                      className="flex items-center justify-between animate-slide-left"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <span className="text-gray-700">
                        {param
                          .split("_")
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                      <Badge
                        className={`${score >= 60 ? "bg-blue-500" : score >= 40 ? "bg-yellow-500" : "bg-red-500"} text-white`}
                      >
                        {score}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Personality Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <DescriptiveInsight
              title="Person 1 Personality"
              content={data.descriptive.personality_summary_sender}
              icon={<Users className="h-5 w-5 text-blue-600" />}
              animationDelay={0}
            />
            <DescriptiveInsight
              title="Person 2 Personality"
              content={data.descriptive.personality_summary_receiver}
              icon={<Users className="h-5 w-5 text-purple-600" />}
              animationDelay={200}
            />
          </div>

          {/* Relationship Outlook */}
          <div className="mt-8">
            <DescriptiveInsight
              title="Relationship Outlook"
              content={data.descriptive.togetherness_outlook}
              icon={<Heart className="h-5 w-5 text-red-500" />}
              animationDelay={400}
            />
          </div>
        </TabsContent>

        {/* Quantitative Tab */}
        <TabsContent value="quantitative" className="pt-6 animate-fade-in">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <QuantitativeChart
              data={data.quantitative}
              title="Emotional Metrics"
              description="Measures of emotional connection and intimacy"
              category={selectedCategory || "emotional"}
              animationDelay={0}
            />
            <QuantitativeChart
              data={data.quantitative}
              title="Trust & Security"
              description="Indicators of trust and security in the relationship"
              category={selectedCategory || "trust"}
              animationDelay={200}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <QuantitativeChart
              data={data.quantitative}
              title="Communication Quality"
              description="Measures of communication effectiveness"
              category={selectedCategory || "communication"}
              animationDelay={400}
            />
            <QuantitativeChart
              data={data.quantitative}
              title="Commitment Signals"
              description="Indicators of commitment to the relationship"
              category={selectedCategory || "commitment"}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
            <QuantitativeChart
              data={data.quantitative}
              title="Care & Attention"
              description="Measures of care and attentiveness"
              category={selectedCategory || "care"}
              animationDelay={800}
            />
            <QuantitativeChart
              data={data.quantitative}
              title="Interaction Quality"
              description="Indicators of interaction quality"
              category={selectedCategory || "interaction"}
              animationDelay={1000}
            />
          </div>
        </TabsContent>

        {/* Descriptive Tab */}
        <TabsContent value="descriptive" className="pt-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-8">
            <DescriptiveInsight
              title="Communication Style"
              content={data.descriptive.communication_style_description}
              icon={<MessageCircle className="h-5 w-5 text-blue-600" />}
              animationDelay={0}
            />

            <DescriptiveInsight
              title="Emotional Depth"
              content={data.descriptive.emotional_depth_description}
              icon={<Heart className="h-5 w-5 text-red-500" />}
              animationDelay={200}
            />

            <DescriptiveInsight
              title="Intellectual Connection"
              content={data.descriptive.intellectual_connection_description}
              icon={<Brain className="h-5 w-5 text-purple-600" />}
              animationDelay={400}
            />

            <DescriptiveInsight
              title="Growth Potential"
              content={data.descriptive.relationship_growth_potential}
              icon={<TrendingUp className="h-5 w-5 text-green-600" />}
              animationDelay={600}
            />

            <DescriptiveInsight
              title="Long-term Stability"
              content={data.descriptive.long_term_stability_prediction}
              icon={<Target className="h-5 w-5 text-yellow-600" />}
              animationDelay={800}
            />

            <DescriptiveInsight
              title="Dependency Balance"
              content={data.descriptive.dependency_balance_description}
              icon={<Users className="h-5 w-5 text-indigo-600" />}
              animationDelay={1000}
            />

            <DescriptiveInsight
              title="Friendship Foundation"
              content={data.descriptive.friendship_layer_strength}
              icon={<Users className="h-5 w-5 text-blue-600" />}
              animationDelay={1200}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
