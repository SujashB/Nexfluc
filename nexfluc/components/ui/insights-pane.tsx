"use client"

import * as React from "react"
import { motion } from "motion/react"
import { useScribe } from "@elevenlabs/react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import {
  Sparkles,
  Lightbulb,
  Target,
  AlertCircle,
  ExternalLink,
  Mic,
  MicOff,
} from "lucide-react"
import { NetworkGraph3D } from "./network-graph-3d"
import { NetworkGraphCanvas } from "./network-graph-canvas"
import { extractEntitiesFromText } from "@/lib/extract-entities"

type StartupNode = {
  id: string
  name: string
  similarity: number // 0–1
  description: string
  url?: string
  tags?: string[]
}

type Insights = {
  summary: string
  differentiation: string[]
  network?: {
    nodes: Array<{
      id: string
      label: string
      type: "startup" | "concept" | "feature" | "market"
      size?: number
    }>
    edges: Array<{
      source: string
      target: string
      strength?: number
    }>
  }
  tavilyResearch?: {
    marketResearch?: string | null
    competitorAnalysis?: string | null
    competitorInfo?: string | null
    designPatterns?: string | null
    competitorColors?: string | null
    competitorLogos?: string | null
  }
}

type Status = "idle" | "loading" | "ready" | "error"

const MOCK_STARTUPS: StartupNode[] = [
  {
    id: "1",
    name: "IdeaFlow",
    similarity: 0.85,
    description:
      "AI-powered platform for validating startup ideas through market research and competitor analysis.",
    url: "https://example.com",
    tags: ["SaaS", "Market Research", "AI"],
  },
  {
    id: "2",
    name: "StartupValidator",
    similarity: 0.72,
    description:
      "Tool that helps entrepreneurs test their business concepts with real-time feedback from investors.",
    tags: ["B2B", "Validation"],
  },
  {
    id: "3",
    name: "ConceptLab",
    similarity: 0.68,
    description:
      "Collaborative workspace for refining startup ideas with AI-generated insights and market data.",
    tags: ["Collaboration", "AI", "Analytics"],
  },
]

const MOCK_INSIGHTS: Insights = {
  summary:
    "Your idea shows strong potential in the AI-powered validation space, with opportunities to differentiate through real-time collaboration and investor network integration.",
  differentiation: [
    "Focus on real-time collaboration features that allow multiple stakeholders to refine ideas together",
    "Integrate direct investor feedback loops to provide immediate validation signals",
    "Leverage advanced AI to provide predictive market analysis beyond basic competitor research",
    "Create a freemium model that allows idea testing before full platform commitment",
    "Build a community aspect where entrepreneurs can share learnings and get peer validation",
  ],
  network: {
    nodes: [
      { id: "idea", label: "Your Idea", type: "concept", size: 15 },
      { id: "ai", label: "AI Validation", type: "feature", size: 12 },
      { id: "collab", label: "Collaboration", type: "feature", size: 10 },
      { id: "market", label: "Market Research", type: "market", size: 11 },
      { id: "startup1", label: "IdeaFlow", type: "startup", size: 9 },
      { id: "startup2", label: "StartupValidator", type: "startup", size: 8 },
    ],
    edges: [
      { source: "idea", target: "ai", strength: 0.9 },
      { source: "idea", target: "collab", strength: 0.8 },
      { source: "ai", target: "market", strength: 0.7 },
      { source: "idea", target: "startup1", strength: 0.85 },
      { source: "idea", target: "startup2", strength: 0.72 },
      { source: "ai", target: "startup1", strength: 0.6 },
    ],
  },
}

// Utility function to condense and format Tavily research text into bullet points
function formatTavilyResearch(text: string | null | undefined): string[] {
  if (!text || text.trim().length === 0) {
    return []
  }

  // Remove common marketing headers and fluff
  const cleaned = text
    .replace(/#{1,6}\s+/g, "") // Remove markdown headers
    .replace(/\*\*/g, "") // Remove bold markers
    .replace(/\*/g, "") // Remove bullet markers
    .replace(/##/g, "") // Remove section markers
    .replace(/Explore|Generate|Discover|Get|Start|Create|Choose|Follow|Use|AI-powered|AI|platform|tool|design|logo|brand/gi, "")
    .replace(/https?:\/\/[^\s]+/g, "") // Remove URLs
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()

  // Split into sentences
  const sentences = cleaned
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => {
      // Filter out very short sentences, marketing fluff, and common patterns
      if (s.length < 20) return false
      if (s.length > 200) return false // Too long, likely not useful
      if (/^(Generate|Create|Start|Explore|Discover|Get|Choose|Follow|Use|AI|platform|tool)/i.test(s)) return false
      if (/color palette|logo generator|brand identity|website/i.test(s) && s.length < 50) return false
      return true
    })
    .map((s) => {
      // Clean up sentence
      return s
        .replace(/^\d+\.\s*/, "") // Remove numbered lists
        .replace(/^[-•]\s*/, "") // Remove bullet markers
        .trim()
    })
    .filter((s) => s.length >= 20 && s.length <= 200)

  // Remove duplicates and limit to top 5-7 most relevant points
  const unique: string[] = []
  const seen = new Set<string>()
  
  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().substring(0, 50)
    if (!seen.has(normalized) && unique.length < 7) {
      seen.add(normalized)
      unique.push(sentence)
    }
  }

  return unique
}

export interface InsightsPaneProps {
  messages?: Array<{ source: "user" | "ai"; message: string }>
  className?: string
  status?: Status
  startups?: StartupNode[]
  insights?: Insights
  onNetworkUpdate?: (
    nodes: Array<{
      id: string
      label: string
      type: "startup" | "concept" | "feature" | "market"
      size?: number
      description?: string
      sources?: Array<{ title: string; url: string }>
    }>,
    edges: Array<{ source: string | any; target: string | any; strength?: number }>
  ) => void
  onInsightsUpdate?: (insights: {
    summary?: string
    startups?: Array<{ 
      name: string
      similarity: number
      description?: string
      tags?: string[]
    }>
    differentiation?: string[]
  }) => void
  onTranscriptionUpdate?: (text: string) => void
}

export const InsightsPane = React.forwardRef<HTMLDivElement, InsightsPaneProps>(
  (
    {
      messages = [],
      className,
      status: externalStatus,
      startups: externalStartups,
      insights: externalInsights,
      onNetworkUpdate,
      onInsightsUpdate,
      onTranscriptionUpdate,
    },
    ref
  ) => {
    const [selectedId, setSelectedId] = React.useState<string | null>(null)
    const [startups, setStartups] = React.useState<StartupNode[]>([])
    const [insights, setInsights] = React.useState<Insights | null>(null)
    const [tavilyResearch, setTavilyResearch] = React.useState<{
      marketResearch?: string | null
      competitorAnalysis?: string | null
      competitorInfo?: string | null
      designPatterns?: string | null
      competitorColors?: string | null
      competitorLogos?: string | null
    } | null>(null)
    const [status, setStatus] = React.useState<Status>("idle")
    const [transcription, setTranscription] = React.useState<string>("")
    const [isTranscribing, setIsTranscribing] = React.useState(false)
    const [networkNodes, setNetworkNodes] = React.useState<
      Array<{
        id: string
        label: string
        type: "startup" | "concept" | "feature" | "market"
        size?: number
        description?: string
        sources?: Array<{ title: string; url: string }>
        x?: number
        y?: number
      }>
    >([])
    const [networkEdges, setNetworkEdges] = React.useState<
      Array<{ source: string | any; target: string | any; strength?: number }>
    >([])
    const lastMessageCountRef = React.useRef(0)
    const transcriptionRef = React.useRef("")
    const lastTranscriptionLengthRef = React.useRef(0)

    // Scribe transcription setup
    const scribe = useScribe({
      modelId: "scribe_v2_realtime",
      onPartialTranscript: (data) => {
        console.log("Partial transcript:", data.text)
        setTranscription(data.text)
        transcriptionRef.current = data.text
        updateNetworkGraph(data.text)
        if (onTranscriptionUpdate) {
          onTranscriptionUpdate(data.text)
        }
      },
      onCommittedTranscript: (data) => {
        console.log("Committed transcript:", data.text)
        setTranscription((prev) => {
          const newText = prev ? `${prev} ${data.text}` : data.text
          transcriptionRef.current = newText
          updateNetworkGraph(newText)
          return newText
        })
      },
      onCommittedTranscriptWithTimestamps: (data) => {
        console.log("Committed with timestamps:", data.text)
        setTranscription((prev) => {
          const newText = prev ? `${prev} ${data.text}` : data.text
          transcriptionRef.current = newText
          updateNetworkGraph(newText)
          return newText
        })
      },
    })

    const handleStartTranscription = React.useCallback(async () => {
      try {
        setIsTranscribing(true)
        const response = await fetch("/api/scribe-token")
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || `Failed to get token: ${response.status}`)
        }
        const data = await response.json()
        if (!data.token) {
          throw new Error("No token received from server")
        }
        await scribe.connect({
          token: data.token,
          microphone: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        })
      } catch (error) {
        console.error("Error starting transcription:", error)
        setIsTranscribing(false)
        alert(`Failed to start transcription: ${error instanceof Error ? error.message : "Unknown error"}`)
      }
    }, [scribe])

    const handleStopTranscription = React.useCallback(() => {
      scribe.disconnect()
      setIsTranscribing(false)
      setTranscription("")
    }, [scribe])

    React.useEffect(() => {
      if (scribe.isConnected) {
        setIsTranscribing(true)
      } else {
        setIsTranscribing(false)
      }
    }, [scribe.isConnected])

    // Function to update network graph from transcription
    const updateNetworkGraph = React.useCallback(
      async (text: string) => {
        if (!text || text.trim().length < 20) return

        try {
          // Extract entities from transcription
          const entities = extractEntitiesFromText(text)

          if (entities.length === 0) return

          // Enrich entities with Tavily
          const enrichResponse = await fetch("/api/enrich-nodes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ entities, transcription: text }),
          })

          if (enrichResponse.ok) {
            const { nodes } = await enrichResponse.json()
            setNetworkNodes(nodes)

            // Create edges between related nodes
            const edges: Array<{
              source: string
              target: string
              strength: number
            }> = []

            // Connect nodes based on similarity and relationships
            for (let i = 0; i < nodes.length; i++) {
              for (let j = i + 1; j < nodes.length; j++) {
                const node1 = nodes[i]
                const node2 = nodes[j]

                // Calculate relationship strength
                let strength = 0.3

                // Same type = stronger connection
                if (node1.type === node2.type) {
                  strength += 0.2
                }

                // Check if labels share words
                const words1 = node1.label.toLowerCase().split(/\s+/)
                const words2 = node2.label.toLowerCase().split(/\s+/)
                const commonWords = words1.filter((w: string) => words2.includes(w))
                if (commonWords.length > 0) {
                  strength += 0.3
                }

                // Check if descriptions mention each other
                if (
                  node1.description?.toLowerCase().includes(node2.label.toLowerCase()) ||
                  node2.description?.toLowerCase().includes(node1.label.toLowerCase())
                ) {
                  strength += 0.2
                }

                if (strength > 0.4) {
                  edges.push({
                    source: node1.id,
                    target: node2.id,
                    strength: Math.min(strength, 1.0),
                  })
                }
              }
            }

            setNetworkEdges(edges)
            
            // Notify parent component of network updates
            if (onNetworkUpdate) {
              onNetworkUpdate(nodes, edges)
            }
          } else {
            // Fallback: use entities without enrichment
            setNetworkNodes(entities)
            // Create basic edges
            const basicEdges: Array<{
              source: string
              target: string
              strength: number
            }> = []
            for (let i = 0; i < entities.length - 1; i++) {
              basicEdges.push({
                source: entities[i].id,
                target: entities[i + 1].id,
                strength: 0.5,
              })
            }
            setNetworkEdges(basicEdges)
            
            // Notify parent component of network updates
            if (onNetworkUpdate) {
              onNetworkUpdate(entities, basicEdges)
            }
          }
        } catch (error) {
          console.error("Error updating network graph:", error)
        }
      },
      [onNetworkUpdate]
    )

    // Memoize dependencies to prevent array size changes
    const messagesRef = React.useRef(messages)
    
    React.useEffect(() => {
      messagesRef.current = messages
    }, [messages])
    
    React.useEffect(() => {
      transcriptionRef.current = transcription
    }, [transcription])

    // Generate insights from conversation
    React.useEffect(() => {
      // Use external status if provided
      if (externalStatus) {
        setStatus(externalStatus)
        return
      }

      // Use external data if provided
      if (externalStartups && externalInsights) {
        setStartups(externalStartups)
        setInsights(externalInsights)
        setStatus("ready")
        return
      }

      const currentMessages = messagesRef.current
      const currentTranscription = transcriptionRef.current

      // Auto-generate insights from transcription (primary) or messages
      const hasTranscription = currentTranscription && currentTranscription.trim().length > 20
      const hasMessages = currentMessages.length >= 2

      if (!hasTranscription && !hasMessages) {
        // Don't clear insights when transcription stops - keep them visible
        // Only set to idle if we never had any data
        if (startups.length === 0 && !insights) {
          setStatus("idle")
        }
        lastMessageCountRef.current = 0
        return
      }

      // Only generate if we have new transcription or messages
      const transcriptionLength = currentTranscription?.length || 0
      
      if (
        !hasTranscription &&
        currentMessages.length === lastMessageCountRef.current
      ) {
        return
      }

      if (
        hasTranscription &&
        transcriptionLength === lastTranscriptionLengthRef.current &&
        currentMessages.length === lastMessageCountRef.current
      ) {
        return
      }

      // Debounce: wait a bit after the last update before generating insights
      // Use shorter debounce for transcription (1.5s) vs messages (2s)
      const debounceTime = hasTranscription ? 1500 : 2000
      const timeoutId = setTimeout(async () => {
        setStatus("loading")
        lastMessageCountRef.current = currentMessages.length
        lastTranscriptionLengthRef.current = transcriptionLength

        try {
          const response = await fetch("/api/insights", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ 
              messages: currentMessages, 
              transcription: currentTranscription || "" 
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to generate insights")
          }

          const data = await response.json()
          
          if (data.error) {
            setStatus("error")
            return
          }

          // Update with real data
          const updatedStartups = data.startups || MOCK_STARTUPS
          const updatedInsights = {
            summary: data.summary || MOCK_INSIGHTS.summary,
            differentiation: data.differentiation || MOCK_INSIGHTS.differentiation,
            network: data.network || MOCK_INSIGHTS.network,
          }
          setStartups(updatedStartups)
          setInsights(updatedInsights)
          
          // Store Tavily research data
          if (data.tavilyResearch) {
            setTavilyResearch(data.tavilyResearch)
          }
          
          setStatus("ready")
          
          // Notify parent component of insights update
          if (onInsightsUpdate) {
            onInsightsUpdate({
              summary: updatedInsights.summary,
              startups: updatedStartups.map((s: StartupNode) => ({ 
                name: s.name, 
                similarity: s.similarity,
                description: s.description,
                tags: s.tags,
              })),
              differentiation: updatedInsights.differentiation,
            })
          }

          // Save to Supabase
          try {
            await fetch("/api/save-insights", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                transcription: currentTranscription || "",
                insights: {
                  summary: updatedInsights.summary,
                  differentiation: updatedInsights.differentiation,
                  startups: updatedStartups,
                },
                networkNodes: networkNodes.length > 0 ? networkNodes : (updatedInsights.network?.nodes || []),
                networkEdges: networkEdges.length > 0 ? networkEdges : (updatedInsights.network?.edges || []),
              }),
            })
            console.log("✅ [InsightsPane] Insights saved to Supabase")
          } catch (saveError) {
            console.error("❌ [InsightsPane] Failed to save insights to Supabase:", saveError)
            // Don't throw - saving is non-critical
          }
        } catch (err) {
          console.error("Error fetching insights:", err)
          setStatus("error")
          // Fallback to mock data on error
          setStartups(MOCK_STARTUPS)
          setInsights(MOCK_INSIGHTS)
        }
      }, debounceTime) // Wait 1.5s for transcription, 2s for messages

      return () => clearTimeout(timeoutId)
    }, [messages.length, transcription, externalStatus, externalStartups, externalInsights])

    // Use state data or fallback to mock
    const displayStartups = startups.length > 0 ? startups : MOCK_STARTUPS
    const displayInsights = insights || MOCK_INSIGHTS

    // Render idle state
    if (status === "idle") {
      return (
        <Card
          ref={ref}
          className={cn(
            "w-full max-w-6xl border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
            className
          )}
        >
          <div className="min-h-[300px] space-y-6 p-6">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-stone-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Suggestions
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Transcription Controls */}
                <button
                  onClick={
                    isTranscribing ? handleStopTranscription : handleStartTranscription
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                    isTranscribing
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : "border-stone-700/50 bg-stone-800/30 text-stone-300 hover:bg-stone-700/40"
                  )}
                >
                  {isTranscribing ? (
                    <>
                      <MicOff className="h-3 w-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" />
                      Transcribe
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Live · AI Powered
                  </span>
                </div>
              </div>
            </div>

            {/* Transcription Display */}
            {(isTranscribing || transcription) && (
              <div className="rounded-lg border border-stone-700/50 bg-stone-800/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className={cn(
                      "h-3 w-3",
                      isTranscribing ? "text-emerald-400 animate-pulse" : "text-stone-400"
                    )} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Live Transcription
                    </span>
                  </div>
                  {isTranscribing && (
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  )}
                </div>
                <div className="space-y-1">
                  {transcription ? (
                    <p className="text-sm text-stone-200">{transcription}</p>
                  ) : isTranscribing ? (
                    <p className="text-sm italic text-stone-400">
                      Listening... Speak to see transcription
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Idle Message */}
            <div className="flex flex-1 items-center justify-center py-8">
              <p className="text-center text-sm text-stone-400">
                Speak your idea to see similar startups and differentiation
                strategies.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    // Render loading state
    if (status === "loading") {
      return (
        <Card
          ref={ref}
          className={cn(
            "w-full max-w-6xl border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
            className
          )}
        >
          <div className="min-h-[300px] space-y-6 p-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-pulse rounded bg-stone-700" />
                <div className="h-4 w-24 animate-pulse rounded bg-stone-700" />
              </div>
              <div className="h-6 w-32 animate-pulse rounded-full bg-stone-700" />
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-2xl bg-stone-800/50"
                />
              ))}
            </div>

            {/* Bullets skeleton */}
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-stone-800/50"
                />
              ))}
            </div>
          </div>
        </Card>
      )
    }

    // Render error state
    if (status === "error") {
      return (
        <Card
          ref={ref}
          className={cn(
            "w-full max-w-6xl border-red-900/50 bg-red-950/20 backdrop-blur-md",
            className
          )}
        >
          <div className="flex min-h-[300px] items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-center text-sm text-red-300">
                Failed to load insights. Please try again.
              </p>
            </div>
          </div>
        </Card>
      )
    }

    // Render ready state
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          ref={ref}
          className={cn(
            "w-full max-w-4xl h-full border-stone-700/50 bg-stone-900/40 backdrop-blur-md",
            className
          )}
        >
          <div className="flex h-full flex-col min-h-[300px] space-y-6 p-6">
            {/* Header Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-stone-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                  Suggestions
                </span>
              </div>
              <div className="flex items-center gap-3">
                {/* Transcription Controls */}
                <button
                  onClick={
                    isTranscribing ? handleStopTranscription : handleStartTranscription
                  }
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-all",
                    isTranscribing
                      ? "border-red-500/30 bg-red-500/10 text-red-300"
                      : "border-stone-700/50 bg-stone-800/30 text-stone-300 hover:bg-stone-700/40"
                  )}
                >
                  {isTranscribing ? (
                    <>
                      <MicOff className="h-3 w-3" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" />
                      Transcribe
                    </>
                  )}
                </button>
                <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Live · AI Powered
                  </span>
                </div>
              </div>
            </div>

            {/* Transcription Display */}
            {(isTranscribing || transcription) && (
              <div className="rounded-lg border border-stone-700/50 bg-stone-800/20 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className={cn(
                      "h-3 w-3",
                      isTranscribing ? "text-emerald-400 animate-pulse" : "text-stone-400"
                    )} />
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Live Transcription
                    </span>
                  </div>
                  {isTranscribing && (
                    <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  )}
                </div>
                <div className="space-y-1">
                  {transcription ? (
                    <p className="text-sm text-stone-200">{transcription}</p>
                  ) : isTranscribing ? (
                    <p className="text-sm italic text-stone-400">
                      Listening... Speak to see transcription
                    </p>
                  ) : null}
                </div>
              </div>
            )}

            {/* Similar Startups Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Similar Startups
                </h3>
                <span className="text-xs text-stone-500">
                  {displayStartups.length} found
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {displayStartups.map((startup, index) => {
                  const isSelected = selectedId === startup.id
                  const uniqueKey = startup.id || `startup-${index}`
                  return (
                    <motion.div
                      key={uniqueKey}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        onClick={() =>
                          setSelectedId(isSelected ? null : startup.id)
                        }
                        className={cn(
                          "group relative cursor-pointer rounded-2xl border p-4 transition-all duration-200",
                          isSelected
                            ? "border-orange-500/50 bg-orange-500/5 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                            : "border-stone-700/50 bg-stone-800/30 hover:-translate-y-0.5 hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                        )}
                      >
                        {/* Similarity Pill */}
                        <div className="absolute right-3 top-3 rounded-full border border-stone-600/50 bg-stone-900/50 px-2 py-0.5">
                          <span className="text-[10px] font-semibold text-stone-300">
                            {Math.round(startup.similarity * 100)}% match
                          </span>
                        </div>

                        {/* Startup Name */}
                        <h4 className="mb-2 pr-16 text-sm font-semibold text-stone-200">
                          {startup.name}
                        </h4>

                        {/* Description */}
                        <p className="mb-3 text-xs leading-relaxed text-stone-400">
                          {startup.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {startup.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-stone-700/50 bg-stone-900/50 px-2 py-0.5 text-[10px] text-stone-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* External Link Icon */}
                        {startup.url && (
                          <ExternalLink className="absolute bottom-3 right-3 h-3 w-3 text-stone-500 opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-stone-700/50" />

            {/* Tavily Research Section */}
            {(tavilyResearch?.competitorInfo || tavilyResearch?.designPatterns || tavilyResearch?.competitorColors || tavilyResearch?.competitorLogos) && (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-stone-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                      Market Intelligence
                    </h3>
                  </div>

                  {tavilyResearch.competitorInfo && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                        Competitor Analysis
                      </h4>
                      <div className="rounded-lg border border-stone-700/50 bg-stone-800/20 p-3">
                        <ul className="space-y-1.5">
                          {formatTavilyResearch(tavilyResearch.competitorInfo).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-stone-300">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-500" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {tavilyResearch.designPatterns && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                        Design Trends
                      </h4>
                      <div className="rounded-lg border border-stone-700/50 bg-stone-800/20 p-3">
                        <ul className="space-y-1.5">
                          {formatTavilyResearch(tavilyResearch.designPatterns).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-stone-300">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-500" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {tavilyResearch.competitorColors && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                        Competitor Color Schemes
                      </h4>
                      <div className="rounded-lg border border-stone-700/50 bg-stone-800/20 p-3">
                        <ul className="space-y-1.5">
                          {formatTavilyResearch(tavilyResearch.competitorColors).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-stone-300">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-500" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {tavilyResearch.competitorLogos && (
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                        Competitor Logo Styles
                      </h4>
                      <div className="rounded-lg border border-stone-700/50 bg-stone-800/20 p-3">
                        <ul className="space-y-1.5">
                          {formatTavilyResearch(tavilyResearch.competitorLogos).map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-stone-300">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-stone-500" />
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
                <div className="border-t border-stone-700/50" />
              </>
            )}

            {/* Differentiation Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-stone-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  How to Stand Out
                </h3>
              </div>

              {/* Summary */}
              <p className="text-sm leading-relaxed text-stone-300">
                {displayInsights.summary}
              </p>

              {/* Differentiation Bullets */}
              <div className="space-y-2">
                {displayInsights.differentiation.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                  >
                    <div className="flex items-start gap-3 rounded-lg border border-stone-700/30 bg-stone-800/20 p-3 transition-all duration-200 hover:border-stone-600/50 hover:bg-stone-800/30">
                      <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
                      <span className="text-sm leading-relaxed text-stone-300">
                        {item}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }
)

InsightsPane.displayName = "InsightsPane"
