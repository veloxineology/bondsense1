"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { validateGeminiApiKey } from "@/lib/validate-gemini-api-key"
import { MainLayout } from "@/components/main-layout"
import { ArrowRight, Key, MessageSquare, Upload } from "lucide-react"
import { toast } from "sonner"

export default function Home() {
  const router = useRouter()

  return (
    <MainLayout>
      <div className={`max-w-4xl mx-auto transition-opacity duration-1000`}>
        <div className="flex flex-col items-center text-center mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Chat Analysis App</h1>
          <p className="text-xl text-muted-foreground max-w-2xl">
            Analyze your Instagram conversations to gain insights into your relationship dynamics and communication
            patterns.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="animate-slide-up" style={{ animationDelay: "100ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Upload Your Chat
              </CardTitle>
              <CardDescription>
                Upload your Instagram message JSON files to analyze your conversations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                onClick={() => router.push("/upload")}
              >
                Start Analysis
              </Button>
            </CardContent>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Get Insights
              </CardTitle>
              <CardDescription>
                Receive detailed insights about your relationship dynamics and communication patterns.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push("/upload")}
              >
                Try with Demo Data
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg animate-fade-in-delay">
          <h2 className="text-xl font-semibold mb-4">Privacy First</h2>
          <p className="text-muted-foreground">
            Your privacy is our priority. All data processing happens locally in your browser. Your conversations are
            never stored on our servers or shared with third parties.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
