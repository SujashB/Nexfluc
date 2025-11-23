"use client"

import { useState, useEffect } from "react"
import { AgentState, Orb } from "@/components/ui/orb"
import { FloatingNav } from "@/components/ui/floating-navbar"
import { ConversationBar } from "@/components/ui/conversation-bar"
import { InsightsPane } from "@/components/ui/insights-pane"
import { NetworkGraphCanvas } from "@/components/ui/network-graph-canvas"
import { FutureBrandVisualization } from "@/components/ui/future-brand-visualization"
import { Card } from "@/components/ui/card"

const ORBS: [string, string][] = [
  ["#CADCFC", "#A0B9D1"],
  ["#F6E7D8", "#E0CFC2"],
  ["#E5E7EB", "#9CA3AF"],
]

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [conversationMessages, setConversationMessages] = useState<
    Array<{ source: "user" | "ai"; message: string }>
  >([])
  const [networkNodes, setNetworkNodes] = useState<
    Array<{
      id: string
      label: string
      type: "startup" | "concept" | "feature" | "market"
      size?: number
      description?: string
      sources?: Array<{ title: string; url: string }>
    }>
  >([])
  const [networkEdges, setNetworkEdges] = useState<
    Array<{ source: string | any; target: string | any; strength?: number }>
  >([])
  const [insightsData, setInsightsData] = useState<{
    summary?: string
    startups?: Array<{ name: string; similarity: number; description?: string; tags?: string[] }>
    differentiation?: string[]
  } | null>(null)
  const [transcriptionText, setTranscriptionText] = useState<string>("")

  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ""

  const handleConnect = () => {
    setIsConnected(true)
    setAgentState("listening")
    setConversationMessages([]) // Reset messages on new connection
  }

  const handleDisconnect = () => {
    setIsConnected(false)
    setAgentState(null)
    setConversationMessages([]) // Clear messages on disconnect
  }

  const handleMessage = (message: { source: "user" | "ai"; message: string }) => {
    // Update agent state based on message source
    if (message.source === "user") {
      setAgentState("listening")
    } else if (message.source === "ai") {
      setAgentState("talking")
    }

    // Add message to conversation history
    setConversationMessages((prev) => [...prev, message])
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-stone-950 via-neutral-900 to-stone-950">
      {/* Dark Granite Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Granite texture effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,120,120,0.1),transparent_50%)] opacity-40"></div>
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(100,100,100,0.05)_25%,rgba(100,100,100,0.05)_50%,transparent_50%,transparent_75%,rgba(100,100,100,0.05)_75%)] bg-[length:20px_20px] opacity-20"></div>
        
        {/* Subtle accent lights */}
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-stone-700 opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-neutral-800 opacity-10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-800 opacity-5 blur-3xl"></div>
      </div>

      {/* Floating Navbar */}
      <FloatingNav className="dark:bg-stone-900/80 dark:border-stone-700/50 backdrop-blur-xl" />

      {/* Main Content */}
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12 pt-24">
        {/* Orb Section */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative">
            <div className="relative h-64 w-64 rounded-full bg-stone-800/30 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-md border border-stone-700/30">
              <div className="h-full w-full overflow-hidden rounded-full bg-stone-900/20 shadow-[inset_0_0_12px_rgba(0,0,0,0.2)] backdrop-blur-sm">
                <Orb
                  colors={ORBS[0]}
                  seed={1000}
                  agentState={agentState}
                  volumeMode="auto"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Bar */}
        <div className="mb-6 w-full flex justify-center">
          <ConversationBar
            agentId={agentId}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onMessage={handleMessage}
            onError={(error) => {
              console.error("Conversation error:", error)
              setIsConnected(false)
              setAgentState(null)
            }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="mb-6 w-full max-w-7xl flex gap-6 items-start">
          {/* Network Graph Panel - Left Side */}
          <div className="w-1/3 flex-shrink-0 flex flex-col gap-6">
            {/* Network Visualization */}
            <Card className="w-full border-stone-700/50 bg-stone-900/40 backdrop-blur-md">
              <div className="flex flex-col space-y-4 p-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Network Visualization
                </h3>
                <div className="w-full aspect-square">
                  <NetworkGraphCanvas
                    nodes={networkNodes.map((n) => ({
                      id: n.id,
                      label: n.label,
                      type: n.type,
                      size: n.size,
                    }))}
                    links={networkEdges.map((e) => ({
                      source: e.source,
                      target: e.target,
                      strength: e.strength,
                    }))}
                    width={400}
                    height={400}
                    className="h-full w-full"
                  />
                </div>
              </div>
            </Card>
            
            {/* Future Brand Visualization - Square below network visualization */}
            <div className="w-full aspect-square">
              <FutureBrandVisualization
                transcription={transcriptionText}
                insights={insightsData || undefined}
                className="h-full"
              />
            </div>
          </div>

          {/* Insights Pane - Middle */}
          <div className="flex-1">
            <InsightsPane 
              messages={conversationMessages}
              onNetworkUpdate={(nodes, edges) => {
                setNetworkNodes(nodes)
                setNetworkEdges(edges)
              }}
              onInsightsUpdate={(insights) => {
                setInsightsData(insights)
              }}
              onTranscriptionUpdate={(text) => {
                setTranscriptionText(text)
              }}
            />
          </div>

          {/* Future Brand Visualization - Right Side */}
          {/* <div className="w-1/3 flex-shrink-0">
            <FutureBrandVisualization
              transcription={transcriptionText}
              insights={insightsData || undefined}
            />
          </div> */}
        </div>
      </main>
    </div>
  )
}
