"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DescriptiveInsightProps {
  title: string
  content: string
  icon?: React.ReactNode
  animationDelay?: number
}

export function DescriptiveInsight({ title, content, icon, animationDelay = 0 }: DescriptiveInsightProps) {
  return (
    <Card
      className="border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-black flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p
          className="text-gray-700 leading-relaxed animate-slide-up"
          style={{ animationDelay: `${animationDelay + 200}ms` }}
        >
          {content}
        </p>
      </CardContent>
    </Card>
  )
}
