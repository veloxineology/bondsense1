"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Check } from "lucide-react"
import { validateGeminiApiKey } from "@/lib/validate-api-key"
import { toast } from "sonner"

export default function SettingsPage() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Store the API key
      localStorage.setItem("geminiApiKey", apiKey.trim())
      toast.success("API key saved successfully!")
    } catch (error) {
      console.error("Error saving API key:", error)
      toast.error("Failed to save API key. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>Gemini API Configuration</CardTitle>
            <CardDescription>Configure your Gemini API key for chat analysis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid w-full items-center gap-1.5">
                <Label htmlFor="gemini-api-key">Gemini API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="gemini-api-key"
                    type="password"
                    placeholder="Enter your Gemini API key"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value)
                    }}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <h3 className="text-sm font-medium">How to get a Gemini API Key:</h3>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>
                    Go to{" "}
                    <a
                      href="https://ai.google.dev/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Google AI Studio
                    </a>
                  </li>
                  <li>Sign in with your Google account</li>
                  <li>Navigate to the API Keys section</li>
                  <li>Create a new API key</li>
                  <li>Copy and paste it here</li>
                </ol>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              form="gemini-api-key-form"
              disabled={isLoading}
              className="ml-auto hover:scale-105 transition-transform"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save API Key</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
}
