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

export default function SettingsPage() {
  const { toast } = useToast()
  const [apiKey, setApiKey] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [isApiKeyValid, setIsApiKeyValid] = useState(false)

  const validateApiKey = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    try {
      // Use the actual validation function
      const isValid = await validateGeminiApiKey(apiKey)

      if (isValid) {
        setIsApiKeyValid(true)
        toast({
          title: "API Key Valid",
          description: "Your Gemini API key has been validated successfully",
        })

        // Store API key in localStorage
        localStorage.setItem("gemini-api-key", apiKey)
      } else {
        toast({
          title: "Invalid API Key",
          description: "The provided API key is not valid or has insufficient permissions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error validating API key:", error)
      toast({
        title: "Validation Error",
        description: "An error occurred while validating your API key. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsValidating(false)
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
                    setIsApiKeyValid(false)
                  }}
                  className={isApiKeyValid ? "border-green-500" : ""}
                />
                {isApiKeyValid && <Check className="text-green-500 h-5 w-5 animate-scale-in" />}
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
          </CardContent>
          <CardFooter>
            <Button
              onClick={validateApiKey}
              disabled={isValidating}
              className="ml-auto hover:scale-105 transition-transform"
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                <>Validate API Key</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
}
