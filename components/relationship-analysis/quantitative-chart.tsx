"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface QuantitativeChartProps {
  data: Record<string, number>
  title: string
  description?: string
  category?: string
  animationDelay?: number
}

// Function to format parameter names for display
function formatParameterName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

// Function to determine color based on score
function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-blue-500"
  if (score >= 40) return "bg-yellow-500"
  return "bg-red-500"
}

export function QuantitativeChart({ data, title, description, category, animationDelay = 0 }: QuantitativeChartProps) {
  // Sort parameters by score (descending)
  const sortedParams = Object.entries(data)
    .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
    .filter(([key]) => !category || key.includes(category))

  return (
    <Card
      className="border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-black">{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {sortedParams.map(([param, score], index) => (
            <div
              key={param}
              className="animate-slide-right"
              style={{ animationDelay: `${animationDelay + index * 100}ms` }}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">{formatParameterName(param)}</span>
                <Badge className={`${getScoreColor(score)} text-white`}>{score}</Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-1000 ${getScoreColor(score)} animate-grow-width`}
                  style={{ width: `${score}%`, animationDelay: `${animationDelay + index * 100}ms` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
