import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"

export async function POST(request: NextRequest) {
  try {
    const { messages, transcription } = await request.json()

    const groqApiKey = process.env.GROQ_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    
    if (!groqApiKey && !openaiApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY or OPENAI_API_KEY must be configured" },
        { status: 500 }
      )
    }

    // Prioritize transcription - use it as primary source if available
    let fullText = ""
    if (transcription && transcription.trim().length > 20) {
      // Use transcription as primary source
      fullText = transcription
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      // Fallback to messages if no transcription
      const conversationText = messages
        .map((msg: { source: string; message: string }) => {
          const role = msg.source === "user" ? "User" : "AI Agent"
          return `${role}: ${msg.message}`
        })
        .join("\n\n")
      fullText = conversationText
    } else {
      return NextResponse.json(
        { error: "Transcription or messages required" },
        { status: 400 }
      )
    }

    const systemPrompt = `You are an AI assistant that analyzes startup ideas from conversations and provides:
1. Similar startups (3-5) with similarity scores (0-1), descriptions, and tags
2. A summary of the idea's potential
3. Differentiation strategies (3-5 points)
4. Network graph data with nodes (startups, concepts, features) and edges (relationships)

Return ONLY valid JSON in this exact format:
{
  "startups": [
    {
      "name": "Startup Name",
      "similarity": 0.85,
      "description": "Brief description",
      "tags": ["Tag1", "Tag2"],
      "url": "https://example.com"
    }
  ],
  "summary": "1-2 sentence summary of the idea's potential",
  "differentiation": [
    "First differentiation point",
    "Second differentiation point"
  ],
  "network": {
    "nodes": [
      {"id": "node1", "label": "Concept", "type": "concept", "size": 10},
      {"id": "node2", "label": "Feature", "type": "feature", "size": 8}
    ],
    "edges": [
      {"source": "node1", "target": "node2", "strength": 0.7}
    ]
  }
}`

    let content = "{}"

    // Try GROQ first, fallback to OpenAI
    if (groqApiKey) {
      try {
        const groq = new Groq({ apiKey: groqApiKey })
        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analyze this conversation about a startup idea:\n\n${fullText}`,
            },
          ],
          model: "llama-3.3-70b-versatile",
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 2000,
        })
        content = completion.choices[0]?.message?.content || "{}"
      } catch (groqError) {
        console.error("GROQ API error:", groqError)
        // Fall through to OpenAI fallback
      }
    }

    // Fallback to OpenAI if GROQ failed or not configured
    if (content === "{}" && openaiApiKey) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            {
              role: "user",
              content: `Analyze this conversation about a startup idea:\n\n${fullText}`,
            },
          ],
          response_format: { type: "json_object" },
          max_tokens: 2000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("OpenAI API error:", errorData)
        throw new Error("Failed to generate insights")
      }

      const data = await response.json()
      content = data.choices[0]?.message?.content || "{}"
    }

    if (content === "{}") {
      throw new Error("Failed to generate insights from any provider")
    }

    try {
      const parsed = JSON.parse(content)

      // Ensure proper structure
      const result = {
        startups: parsed.startups || [],
        summary: parsed.summary || "Your idea shows potential in the market.",
        differentiation: parsed.differentiation || [],
        network: parsed.network || {
          nodes: [],
          edges: [],
        },
      }

      return NextResponse.json(result)
    } catch (parseError) {
      console.error("Failed to parse API response:", parseError)
      return NextResponse.json({
        startups: [],
        summary: "Analyzing your idea...",
        differentiation: [],
        network: { nodes: [], edges: [] },
      })
    }
  } catch (error) {
    console.error("Error generating insights:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

