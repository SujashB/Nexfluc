"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Card } from "@/components/ui/card"
import { Sparkles, Palette, Type, MessageSquare, Lightbulb, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FutureBrandVisualizationProps {
  transcription?: string
  insights?: {
    summary?: string
    startups?: Array<{ 
      name: string
      similarity: number
      description?: string
      tags?: string[]
    }>
    differentiation?: string[]
  }
  className?: string
}

interface BrandData {
  name: string[]
  tagline: string[]
  colorPalette: Array<{ name: string; hex: string }>
  designRationale: string
}

export const FutureBrandVisualization: React.FC<FutureBrandVisualizationProps> = ({
  transcription,
  insights,
  className,
}) => {
  const [brandData, setBrandData] = React.useState<BrandData | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedNameIndex, setSelectedNameIndex] = React.useState(0)
  const [selectedTaglineIndex, setSelectedTaglineIndex] = React.useState(0)

  // Generate brand when transcription or insights change
  React.useEffect(() => {
    const hasContent = transcription && transcription.trim().length > 50
    const hasInsights = insights?.summary && insights.summary.trim().length > 20
    const hasStartups = insights?.startups && insights.startups.length > 0
    const hasDifferentiation = insights?.differentiation && insights.differentiation.length > 0

    console.log("🎨 [FutureBrandVisualization] Effect triggered:", {
      hasContent,
      hasInsights,
      hasStartups,
      hasDifferentiation,
      transcriptionLength: transcription?.length || 0,
      insightsSummary: insights?.summary?.substring(0, 50) || "N/A",
      startupsCount: insights?.startups?.length || 0,
      differentiationCount: insights?.differentiation?.length || 0,
    })

    if (!hasContent && !hasInsights && !hasStartups) {
      setBrandData(null)
      return
    }

    // Debounce generation
    const timeoutId = setTimeout(async () => {
      console.log("🎨 [FutureBrandVisualization] Starting brand generation...")
      setIsLoading(true)
      setError(null)

      try {
        const requestBody = {
          transcription: transcription || "",
          insights: insights || {},
        }
        
        console.log("📤 [FutureBrandVisualization] Sending request to /api/generate-brand")
        console.log("  - Transcription length:", requestBody.transcription.length)
        console.log("  - Has insights:", !!requestBody.insights)
        
        const response = await fetch("/api/generate-brand", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        console.log("📥 [FutureBrandVisualization] Response received:")
        console.log("  - Status:", response.status)
        console.log("  - Status text:", response.statusText)
        console.log("  - OK:", response.ok)

        if (!response.ok) {
          console.error("❌ [FutureBrandVisualization] Response not OK")
          console.error("  - Status:", response.status)
          console.error("  - Status Text:", response.statusText)
          console.error("  - Headers:", Object.fromEntries(response.headers.entries()))
          
          let errorData
          try {
            const text = await response.text()
            console.error("  - Response text (full):", text)
            console.error("  - Response text length:", text.length)
            
            if (text) {
              try {
                errorData = JSON.parse(text)
                console.error("  - Parsed error data:", errorData)
              } catch (jsonErr) {
                console.error("  - Failed to parse as JSON, using raw text")
                errorData = { error: text, details: text }
              }
            } else {
              errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: "Empty response body" }
            }
          } catch (parseErr) {
            console.error("  - Failed to read response text:", parseErr)
            errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: "Could not read response" }
          }
          
          const errorMessage = errorData.error || errorData.details || `Failed to generate brand identity: ${response.status}`
          console.error("  - Final error message:", errorMessage)
          throw new Error(errorMessage)
        }

        const data = await response.json()
        console.log("✅ [FutureBrandVisualization] Response parsed successfully")
        console.log("  - Has logo:", !!data.logo)
        console.log("  - Has name:", !!data.name)
        console.log("  - Has tagline:", !!data.tagline)
        console.log("  - Has colorPalette:", !!data.colorPalette)
        console.log("  - Has designRationale:", !!data.designRationale)

        if (data.error) {
          console.error("❌ [FutureBrandVisualization] Error in response data:", data.error)
          setError(data.error)
          return
        }

        console.log("✅ [FutureBrandVisualization] Setting brand data")
        setBrandData(data)

        // Save to Supabase
        try {
          await fetch("/api/save-brand", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              transcription: transcription || "",
              insights: insights || {},
              brandData: data,
            }),
          })
          console.log("✅ [FutureBrandVisualization] Brand data saved to Supabase")
        } catch (saveError) {
          console.error("❌ [FutureBrandVisualization] Failed to save brand data to Supabase:", saveError)
          // Don't throw - saving is non-critical
        }
      } catch (err) {
        console.error("❌ [FutureBrandVisualization] Error generating brand:", err)
        console.error("  - Error type:", err instanceof Error ? err.constructor.name : typeof err)
        console.error("  - Error message:", err instanceof Error ? err.message : String(err))
        setError(err instanceof Error ? err.message : "Failed to generate brand identity")
      } finally {
        setIsLoading(false)
        console.log("🏁 [FutureBrandVisualization] Brand generation completed")
      }
    }, 2000) // Wait 2 seconds after content changes

    return () => clearTimeout(timeoutId)
  }, [transcription, insights?.summary])

  if (!transcription && !insights?.summary) {
    return (
      <Card
        className={cn(
          "w-full h-full border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
          className
        )}
      >
        <div className="flex h-full min-h-[300px] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Sparkles className="h-8 w-8 text-stone-400" />
            <p className="text-center text-sm text-stone-400">
              Start transcribing to generate your future brand identity
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card
        className={cn(
          "w-full h-full border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
          className
        )}
      >
        <div className="flex h-full min-h-[300px] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <p className="text-center text-sm text-stone-400">
              Generating your brand identity...
            </p>
          </div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card
        className={cn(
          "w-full h-full border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
          className
        )}
      >
        <div className="flex h-full min-h-[300px] items-center justify-center p-8">
          <div className="flex flex-col items-center gap-3">
            <Sparkles className="h-8 w-8 text-red-400" />
            <p className="text-center text-sm text-red-300">{error}</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!brandData) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card
        className={cn(
          "w-full h-full border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
          className
        )}
      >
        <div className="flex h-full flex-col space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-stone-400" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Future Brand Identity
            </span>
          </div>

          {/* Name Selection */}
          {brandData.name && brandData.name.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Type className="h-3.5 w-3.5 text-stone-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Name Options
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {brandData.name.map((name, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedNameIndex(index)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-semibold transition-all",
                      selectedNameIndex === index
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                        : "border-stone-700/50 bg-stone-800/30 text-stone-300 hover:border-stone-600/50"
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-400">
                Selected: <span className="font-semibold text-stone-200">{brandData.name[selectedNameIndex]}</span>
              </p>
            </div>
          )}

          {/* Tagline Selection */}
          {brandData.tagline && brandData.tagline.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-stone-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Tagline Options
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {brandData.tagline.map((tagline, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTaglineIndex(index)}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-xs transition-all",
                      selectedTaglineIndex === index
                        ? "border-orange-500/50 bg-orange-500/10 text-orange-300"
                        : "border-stone-700/50 bg-stone-800/30 text-stone-400 hover:border-stone-600/50"
                    )}
                  >
                    {tagline}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Palette */}
          {brandData.colorPalette && brandData.colorPalette.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Palette className="h-3.5 w-3.5 text-stone-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Color Palette
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {brandData.colorPalette.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 rounded-lg border border-stone-700/50 bg-stone-800/20 p-2"
                  >
                    <div
                      className="h-8 w-8 rounded border border-stone-700/50"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-stone-200">
                        {color.name}
                      </div>
                      <div className="text-[10px] text-stone-400">{color.hex}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Design Rationale */}
          {brandData.designRationale && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-3.5 w-3.5 text-stone-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Design Rationale
                </h3>
              </div>
              <p className="text-xs leading-relaxed text-stone-300">
                {brandData.designRationale}
              </p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

