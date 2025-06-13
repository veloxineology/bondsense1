"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Upload, AlertCircle, Loader2, FileText, X } from "lucide-react"
import { parseJsonFile, extractChatData, combineMultipleChatData, type ParsedChatData } from "@/lib/parse-json"
import { toast } from "sonner"
import analyzeMultipleChatFiles from "@/lib/analyze-chat"

interface ChatFile {
  file: File
  status: "pending" | "processing" | "complete" | "error"
  progress: number
  data?: ParsedChatData
  error?: string
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<ChatFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [fadeIn, setFadeIn] = useState(false)
  const isProcessing = useRef(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    // Start fade-in animation
    setFadeIn(true)

    // Add navigation warning
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isProcessing.current) {
        e.preventDefault()
        e.returnValue = "Files are being processed. Are you sure you want to leave?"
        return e.returnValue
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        status: "pending" as const,
        progress: 0,
      }))
      setFiles((prev) => [...prev, ...newFiles])
      setUploadError(null) // Clear any previous errors
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      toast("No files selected - Please select at least one file to analyze")
      return
    }

    setIsUploading(true)
    isProcessing.current = true
    setOverallProgress(0)
    setCurrentStep("Preparing files for analysis...")
    setUploadError(null)

    try {
      console.log(`Starting to process ${files.length} files`)

      // Process each file sequentially
      const successfullyProcessedFiles: ChatFile[] = []

      for (let i = 0; i < files.length; i++) {
        // Update current file status
        setFiles((prev) =>
          prev.map((file, index) => (index === i ? { ...file, status: "processing", progress: 0 } : file)),
        )

        // Parse the JSON file
        setCurrentStep(`Reading file ${i + 1}/${files.length}: ${files[i].file.name}...`)
        setFiles((prev) => prev.map((file, index) => (index === i ? { ...file, progress: 20 } : file)))
        setOverallProgress(Math.floor((i * 100 + 20) / files.length))

        try {
          console.log(`Processing file: ${files[i].file.name}`)
          const jsonData = await parseJsonFile(files[i].file)
          console.log("JSON data parsed:", Object.keys(jsonData))

          setCurrentStep(`Parsing messages from ${files[i].file.name}...`)
          setFiles((prev) => prev.map((file, index) => (index === i ? { ...file, progress: 40 } : file)))
          setOverallProgress(Math.floor((i * 100 + 40) / files.length))

          // Extract chat data
          const parsedData = extractChatData(jsonData)
          console.log("Extracted chat data:", parsedData)

          // Update file with parsed data
          const updatedFile = {
            ...files[i],
            status: "complete" as const,
            progress: 100,
            data: parsedData,
          }

          setFiles((prev) => prev.map((file, index) => (index === i ? updatedFile : file)))
          successfullyProcessedFiles.push(updatedFile)
        } catch (error) {
          console.error(`Error processing file ${files[i].file.name}:`, error)
          const errorMessage = error instanceof Error ? error.message : "Unknown error"

          setFiles((prev) =>
            prev.map((file, index) =>
              index === i ? { ...file, status: "error", progress: 0, error: errorMessage } : file,
            ),
          )

          toast(`File Processing Error - Failed to process ${files[i].file.name}: ${errorMessage}`)
        }
      }

      if (successfullyProcessedFiles.length === 0) {
        // Generate mock data if no files were successfully processed
        const mockData: ParsedChatData = {
          participants: ["Charles Leclerc", "Alexa"],
          messageCount: 100,
          messagesByParticipant: {
            "Charles Leclerc": 45,
            "Alexa": 55
          },
          timeSpan: {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            end: new Date(),
            durationDays: 30
          },
          averageMessagesPerDay: 3,
          messages: [], // Empty array for mock data
          textMessages: [], // Empty array for mock data
          mediaMessages: [] // Empty array for mock data
        }

        // Store the mock data
        localStorage.setItem("chat-analysis-data", JSON.stringify(mockData))

        toast("Using Demo Data - No files were successfully processed. Using demo data for analysis.")

        // Redirect to analysis page
        setTimeout(() => {
          router.push("/analysis")
        }, 1000)
      } else {
        // Start the analysis process
        setCurrentStep("Starting chat analysis with Gemini 2.0 Flash...")
        setOverallProgress(0)
        
        // Use the analysis function
        const analysis = await analyzeMultipleChatFiles(successfullyProcessedFiles)
        
        // Update progress for each file
        for (let i = 0; i < successfullyProcessedFiles.length; i++) {
          const fileProgress = Math.floor(((i + 1) / successfullyProcessedFiles.length) * 100)
          setOverallProgress(fileProgress)
          setCurrentStep(`Analyzing file ${i + 1}/${successfullyProcessedFiles.length} (processing in chunks to handle large conversations) - Progress: ${fileProgress}%`)
          // Add a delay to show progress
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        setOverallProgress(100)
        setCurrentStep("Analysis complete! Combining results from all chunks - Progress: 100%")

        // Store the analysis results
        localStorage.setItem("chat-analysis-data", JSON.stringify(analysis))

        toast(`Analysis Complete - Successfully analyzed ${successfullyProcessedFiles.length} file${successfullyProcessedFiles.length > 1 ? "s" : ""}`)

        setOverallProgress(100)
        isProcessing.current = false
        setIsUploading(false)

        // Redirect to analysis page
        setTimeout(() => {
          router.push("/analysis")
        }, 1000)
      }
    } catch (error) {
      console.error("Error during upload process:", error)
      isProcessing.current = false
      setIsUploading(false)

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
      setUploadError(errorMessage)

      toast(`Analysis Error - An error occurred during analysis: ${errorMessage}`)
    }
  }

  return (
    <MainLayout disableNavigation={isUploading}>
      <div className={`max-w-4xl mx-auto transition-opacity duration-1000 ${fadeIn ? "opacity-100" : "opacity-0"}`}>
        <h1 className="text-3xl font-bold mb-6 animate-slide-down">Upload Conversations</h1>

        <Alert className="mb-6 animate-slide-up">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important</AlertTitle>
          <AlertDescription>
            Upload your Instagram message JSON files. Your data is processed securely and not stored on our servers.
          </AlertDescription>
        </Alert>

        {uploadError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload Error</AlertTitle>
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <Card className="animate-fade-in-delay">
          <CardHeader>
            <CardTitle>Upload Chat Files</CardTitle>
            <CardDescription>
              Upload your conversation export files to analyze communication patterns and relationship dynamics.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="chat-file">Chat Files</Label>
              <div
                className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-all hover:scale-[1.01]"
                onClick={() => !isUploading && document.getElementById("chat-file")?.click()}
              >
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground animate-bounce-slow" />
                <p className="text-sm text-muted-foreground mb-1">Click to upload or drag and drop multiple files</p>
                <p className="text-xs text-muted-foreground">JSON files up to 10MB each</p>
                <Input
                  id="chat-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleFileChange}
                  multiple
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className="space-y-2 animate-fade-in">
                <Label>Selected Files</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-md hover:bg-muted transition-colors"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-sm truncate max-w-[200px]">{file.file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.status === "processing" && (
                          <div className="w-24">
                            <Progress value={file.progress} className="h-2" />
                          </div>
                        )}
                        {file.status === "complete" && (
                          <span className="text-xs text-green-500">
                            {file.data?.participants.join(", ")} ({file.data?.messageCount} messages)
                          </span>
                        )}
                        {file.status === "error" && (
                          <span className="text-xs text-red-500" title={file.error}>
                            Error
                          </span>
                        )}
                        {file.status === "pending" && !isUploading && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-red-100 hover:text-red-500 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(index)
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress indicator */}
            {isUploading && (
              <div className="space-y-2 pt-4 animate-fade-in">
                <div className="flex justify-between text-sm">
                  <span>{currentStep}</span>
                  <span>{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center mt-2">
                  This may take up to 3 minutes depending on the size of your files. Please don't navigate away from
                  this page.
                </p>
              </div>
            )}

            {/* Demo option */}
            <div className="pt-4 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have Instagram JSON files? You can{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-primary"
                  onClick={() => {
                    // Create mock data with default values
                    const mockData: ParsedChatData = {
                      participants: ["Charles Leclerc", "Alexa"],
                      messageCount: 100,
                      messagesByParticipant: {
                        "Charles Leclerc": 45,
                        "Alexa": 55
                      },
                      timeSpan: {
                        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                        end: new Date(),
                        durationDays: 30
                      },
                      averageMessagesPerDay: 3,
                      messages: [], // Empty array for mock data
                      textMessages: [], // Empty array for mock data
                      mediaMessages: [] // Empty array for mock data
                    }

                    // Store the mock data
                    localStorage.setItem("chat-analysis-data", JSON.stringify(mockData))

                    toast("Using Demo Data - No files were successfully processed. Using demo data for analysis.")

                    // Redirect to analysis page
                    setTimeout(() => {
                      router.push("/analysis")
                    }, 1000)
                  }}
                >
                  use demo data
                </Button>{" "}
                to explore the features.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setFiles([])}
              disabled={isUploading || files.length === 0}
              className="hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              Clear All
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isUploading || files.length === 0}
              className="hover:scale-105 transition-transform"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Analyze Chats</>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  )
}
