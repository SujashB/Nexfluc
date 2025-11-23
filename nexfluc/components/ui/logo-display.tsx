"use client"

import * as React from "react"
import { Loader2, ImageOff } from "lucide-react"

interface LogoDisplayProps {
  transcription: string
  insights: {
    summary?: string
    startups?: Array<{ name: string; similarity: number }>
  }
}

export const LogoDisplay: React.FC<LogoDisplayProps> = ({ transcription, insights }) => {
  const [logoData, setLogoData] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const hasContent = transcription && transcription.trim().length > 50
    const hasInsights = insights?.summary && insights.summary.trim().length > 20

    if (!hasContent && !hasInsights) {
      setLogoData(null)
      return
    }

    // Debounce generation
    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/generate-brand", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcription: transcription || "",
            insights: insights || {},
          }),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }))
          throw new Error(errorData.error || errorData.details || `Failed to generate logo: ${response.status}`)
        }

        const data = await response.json()

        if (data.error) {
          setError(data.error)
          return
        }

        if (data.logo) {
          setLogoData(data.logo)
        }
      } catch (err) {
        console.error("Error generating logo:", err)
        setError(err instanceof Error ? err.message : "Failed to generate logo")
      } finally {
        setIsLoading(false)
      }
    }, 2000) // Wait 2 seconds after content changes

    return () => clearTimeout(timeoutId)
  }, [transcription, insights?.summary])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        <p className="text-xs text-stone-400">Generating logo...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-red-400">
        <ImageOff className="h-8 w-8" />
        <p className="text-xs text-center px-4">{error}</p>
      </div>
    )
  }

  if (!logoData) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 text-stone-400">
        <ImageOff className="h-8 w-8" />
        <p className="text-xs text-center px-4">Start transcribing to generate logo</p>
      </div>
    )
  }

  return (
    <img
      src={logoData}
      alt="Generated Logo"
      className="w-full h-full object-contain p-4"
    />
  )
}

