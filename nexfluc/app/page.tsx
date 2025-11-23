"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { AgentState, Orb } from "@/components/ui/orb"
import { useConversation } from "@elevenlabs/react"

const ORBS: [string, string][] = [
  ["#CADCFC", "#A0B9D1"],
  ["#F6E7D8", "#E0CFC2"],
  ["#E5E7EB", "#9CA3AF"],
]

export default function Home() {
  const [agentState, setAgentState] = useState<AgentState>(null)
  const [transcription, setTranscription] = useState<string>("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [micPermissionGranted, setMicPermissionGranted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const transcriptionRef = useRef<string>("")

  const conversation = useConversation({
    onConnect: () => {
      console.log("Conversation connected")
      setIsConnecting(false)
      setError(null)
    },
    onDisconnect: () => {
      console.log("Conversation disconnected")
      setAgentState(null)
      setIsConnecting(false)
    },
    onMessage: (message) => {
      console.log("Message received:", message)
      if (message.type === "transcription" && message.text) {
        if (message.is_final) {
          transcriptionRef.current = message.text
          setTranscription(message.text)
        } else {
          // Show tentative transcription
          setTranscription(message.text)
        }
      } else if (message.type === "agent_response" && message.text) {
        // Agent's response text
        setTranscription((prev) => prev + "\n\nAgent: " + message.text)
      }
    },
    onError: (error) => {
      console.error("Conversation error:", error)
      setError(error.message || "An error occurred")
      setIsConnecting(false)
      setAgentState(null)
    },
    onModeChange: (mode) => {
      console.log("Mode changed:", mode)
      if (mode === "listening") {
        setAgentState("listening")
      } else if (mode === "speaking") {
        setAgentState("talking")
      } else {
        setAgentState(null)
      }
    },
    onStatusChange: (status) => {
      console.log("Status changed:", status)
      if (status === "disconnected") {
        setAgentState(null)
      }
    },
  })

  // Request microphone permission
  const requestMicrophonePermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      setMicPermissionGranted(true)
      setError(null)
      return true
    } catch (err) {
      console.error("Microphone permission denied:", err)
      setError("Microphone access is required for voice conversations")
      setMicPermissionGranted(false)
      return false
    }
  }

  // Start conversation
  const startConversation = async () => {
    setError(null)
    
    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission()
    if (!hasPermission) {
      return
    }

    setIsConnecting(true)
    try {
      // Replace with your actual agent ID
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || ""
      
      if (!agentId) {
        throw new Error("Agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID")
      }

      await conversation.startSession({
        agentId: agentId,
        connectionType: "webrtc", // or "websocket"
      })
    } catch (err: any) {
      console.error("Failed to start conversation:", err)
      setError(err.message || "Failed to start conversation")
      setIsConnecting(false)
      setAgentState(null)
    }
  }

  // End conversation
  const endConversation = async () => {
    try {
      await conversation.endSession()
      setTranscription("")
      transcriptionRef.current = ""
      setAgentState(null)
    } catch (err) {
      console.error("Failed to end conversation:", err)
    }
  }

  // Send text message
  const sendTextMessage = (text: string) => {
    if (conversation.status === "connected" && text.trim()) {
      conversation.sendUserMessage(text)
    }
  }

  const isConnected = conversation.status === "connected"
  const isSpeaking = conversation.isSpeaking || false

  // Update agent state based on speaking status
  useEffect(() => {
    if (isConnected) {
      if (isSpeaking) {
        setAgentState("talking")
      } else if (agentState !== "listening") {
        setAgentState("listening")
      }
    }
  }, [isSpeaking, isConnected])

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background blur effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-500 opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500 opacity-20 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-500 opacity-10 blur-3xl"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-xl font-bold text-white">Nexfluc</div>
            <div className="flex items-center gap-4">
              <button className="rounded-lg px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                Settings
              </button>
              <button className="rounded-lg px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                Profile
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-6 py-12">
        {/* Orb Section */}
        <div className="mb-12 flex flex-col items-center">
          <div className="relative">
            <div className="relative h-64 w-64 rounded-full bg-white/10 p-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.1)] backdrop-blur-md">
              <div className="h-full w-full overflow-hidden rounded-full bg-white/5 shadow-[inset_0_0_12px_rgba(0,0,0,0.05)] backdrop-blur-sm">
                <Orb
                  colors={ORBS[0]}
                  seed={1000}
                  agentState={agentState}
                  volumeMode="auto"
                  getInputVolume={conversation.getInputVolume}
                  getOutputVolume={conversation.getOutputVolume}
                />
              </div>
            </div>
          </div>

          {/* Connection Status and Controls */}
          <div className="mt-6 flex flex-col items-center gap-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  isConnected
                    ? "bg-green-400 animate-pulse"
                    : isConnecting
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-gray-400"
                }`}
              />
              <span className="text-sm text-white/60">
                {isConnected
                  ? "Connected"
                  : isConnecting
                    ? "Connecting..."
                    : "Disconnected"}
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {!isConnected ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={startConversation}
                  disabled={isConnecting}
                  className="border-white/20 bg-white/5 text-white backdrop-blur-sm hover:bg-white/10 disabled:opacity-50"
                >
                  {isConnecting ? "Connecting..." : "Start Conversation"}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={endConversation}
                  className="border-red-500/50 bg-red-500/10 text-red-200 backdrop-blur-sm hover:bg-red-500/20"
                >
                  End Conversation
                </Button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-200 backdrop-blur-sm">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section - Transcription and Suggestions */}
        <div className="mt-auto w-full max-w-4xl space-y-4">
          {/* Transcription Box */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
                Transcription
              </h3>
              {isConnected && (
                <div className="flex items-center gap-2">
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      agentState === "listening"
                        ? "bg-blue-400 animate-pulse"
                        : agentState === "talking"
                          ? "bg-purple-400 animate-pulse"
                          : "bg-gray-400"
                    }`}
                  />
                  <span className="text-xs text-white/40">
                    {agentState === "listening"
                      ? "Listening"
                      : agentState === "talking"
                        ? "Speaking"
                        : "Idle"}
                  </span>
                </div>
              )}
            </div>
            <div className="min-h-[120px] rounded-lg bg-white/5 p-4 text-white/90 backdrop-blur-sm">
              {transcription ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {transcription}
                </p>
              ) : (
                <p className="text-sm leading-relaxed text-white/40">
                  {isConnected
                    ? "Start speaking or wait for the agent..."
                    : "Click 'Start Conversation' to begin"}
                </p>
              )}
            </div>
          </div>

          {/* Suggestions Box */}
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-md shadow-lg">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/60">
              Suggestions
            </h3>
            <div className="flex flex-wrap gap-2">
              {[
                "Summarize the conversation",
                "Generate action items",
                "Create a follow-up email",
                "Extract key insights",
              ].map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (isConnected) {
                      sendTextMessage(suggestion)
                    }
                  }}
                  disabled={!isConnected}
                  className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 transition-all hover:bg-white/10 hover:text-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
