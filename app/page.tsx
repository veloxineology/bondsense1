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
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Store the API key
      localStorage.setItem("geminiApiKey", apiKey.trim())
      toast.success("API key saved successfully!")
      router.push("/upload")
    } catch (error) {
      console.error("Error saving API key:", error)
      toast.error("Failed to save API key. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

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
                <Key className="mr-2 h-5 w-5" />
                Enter Your API Key
              </CardTitle>
              <CardDescription>
                You'll need a Gemini API key to analyze your conversations. Get one for free from Google AI Studio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter your Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Continue"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => window.open("https://aistudio.google.com/app/apikey", "_blank")}>
                Get API Key
              </Button>
            </CardFooter>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: "200ms" }}>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
              <CardDescription>Understand the process of analyzing your conversations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Upload Your Chat</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your Instagram message JSON files. Your data is processed locally and never stored on our
                    servers.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes communication patterns, emotional dynamics, and relationship indicators.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5 text-primary"
                  >
                    <path d="M2 12h20M16 6l6 6-6 6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">Get Insights</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive detailed insights about your relationship dynamics, communication styles, and emotional
                    patterns.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={() => router.push("/upload")}>
                Try with Demo Data
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="bg-muted p-6 rounded-lg animate-fade-in-delay">
          <h2 className="text-xl font-semibold mb-4">Privacy First</h2>
          <p className="text-muted-foreground">
            Your privacy is our priority. All data processing happens locally in your browser. Your conversations are
            never stored on our servers or shared with third parties. Only the necessary parts of your conversations are
            sent to the Gemini API for analysis using your own API key.
          </p>
        </div>
      </div>
    </MainLayout>
  )
}
