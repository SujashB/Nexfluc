"use client"

import { useState, useEffect } from "react"
import { AgentState, Orb } from "@/components/ui/orb"
import { FloatingNav } from "@/components/ui/floating-navbar"
import { ConversationBar } from "@/components/ui/conversation-bar"
import { Textarea } from "@/components/ui/textarea"
import { InsightsPane } from "@/components/ui/insights-pane"

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
        <div className="mb-8 flex flex-col items-center">
          <div className="relative">
            <div className="relative h-96 w-96 rounded-full bg-stone-800/30 p-3 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] backdrop-blur-md border border-stone-700/30">
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

        {/* Insights Pane */}
        <div className="mb-6 w-full flex justify-center">
          <InsightsPane messages={conversationMessages} />
        </div>

        {/* Textarea Section */}
        <div className="w-full max-w-2xl">
          <Textarea
            placeholder="Type your message here..."
            className="min-h-[120px] resize-none"
            disabled={!isConnected}
          />
        </div>
      </main>
    </div>
  )
}
