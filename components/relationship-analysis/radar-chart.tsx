"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RadarChartProps {
  data: Record<string, number>
  title: string
  description?: string
  category?: string
  maxItems?: number
  animationDelay?: number
}

// Function to format parameter names for display
function formatParameterName(name: string): string {
  return name
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function RadarChart({ data, title, description, category, maxItems = 8, animationDelay = 0 }: RadarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Filter and sort data
  const filteredData = Object.entries(data)
    .filter(([key]) => !category || key.includes(category))
    .sort(([, valueA], [, valueB]) => valueB - valueA)
    .slice(0, maxItems)

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 30

    // Draw radar background
    const numItems = filteredData.length
    const angleStep = (Math.PI * 2) / numItems

    // Draw background circles
    const circles = 5
    for (let i = 1; i <= circles; i++) {
      const circleRadius = (radius * i) / circles
      ctx.beginPath()
      ctx.arc(centerX, centerY, circleRadius, 0, Math.PI * 2)
      ctx.strokeStyle = "rgba(156, 163, 175, 0.3)"
      ctx.stroke()
    }

    // Draw axes
    for (let i = 0; i < numItems; i++) {
      const angle = i * angleStep - Math.PI / 2
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.lineTo(centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle))
      ctx.strokeStyle = "rgba(156, 163, 175, 0.5)"
      ctx.stroke()

      // Draw labels
      const labelX = centerX + (radius + 20) * Math.cos(angle)
      const labelY = centerY + (radius + 20) * Math.sin(angle)

      ctx.fillStyle = "rgb(107, 114, 128)"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"

      const label = formatParameterName(filteredData[i][0])
      // Split label into multiple lines if too long
      const words = label.split(" ")
      let line = ""
      const lineHeight = 12
      let offsetY = 0

      for (let j = 0; j < words.length; j++) {
        const testLine = line + words[j] + " "
        if (j > 0 && testLine.length > 15) {
          ctx.fillText(line, labelX, labelY + offsetY)
          line = words[j] + " "
          offsetY += lineHeight
        } else {
          line = testLine
        }
      }
      ctx.fillText(line, labelX, labelY + offsetY)
    }

    // Animate the radar chart
    let animationProgress = 0
    const animationDuration = 1000 // ms
    const startTime = Date.now()

    function animate() {
      const currentTime = Date.now()
      animationProgress = Math.min(1, (currentTime - startTime) / animationDuration)

      // Clear the data area (not the background)
      ctx.clearRect(centerX - radius - 5, centerY - radius - 5, radius * 2 + 10, radius * 2 + 10)

      // Draw data points with animation
      ctx.beginPath()
      for (let i = 0; i < numItems; i++) {
        const angle = i * angleStep - Math.PI / 2
        const value = (filteredData[i][1] / 100) * animationProgress
        const pointX = centerX + radius * value * Math.cos(angle)
        const pointY = centerY + radius * value * Math.sin(angle)

        if (i === 0) {
          ctx.moveTo(pointX, pointY)
        } else {
          ctx.lineTo(pointX, pointY)
        }
      }
      ctx.closePath()
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
      ctx.fill()
      ctx.strokeStyle = "rgb(59, 130, 246)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw data points
      for (let i = 0; i < numItems; i++) {
        const angle = i * angleStep - Math.PI / 2
        const value = (filteredData[i][1] / 100) * animationProgress
        const pointX = centerX + radius * value * Math.cos(angle)
        const pointY = centerY + radius * value * Math.sin(angle)

        ctx.beginPath()
        ctx.arc(pointX, pointY, 4, 0, Math.PI * 2)
        ctx.fillStyle = "rgb(59, 130, 246)"
        ctx.fill()
      }

      if (animationProgress < 1) {
        requestAnimationFrame(animate)
      }
    }

    // Start animation after delay
    setTimeout(() => {
      animate()
    }, animationDelay)
  }, [data, filteredData, maxItems, animationDelay])

  return (
    <Card
      className="border-2 border-gray-200 bg-white shadow-lg hover:shadow-xl transition-shadow animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-black">{title}</CardTitle>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </CardHeader>
      <CardContent className="p-6 flex justify-center">
        <canvas ref={canvasRef} width={500} height={500} className="max-w-full h-auto" />
      </CardContent>
    </Card>
  )
}
