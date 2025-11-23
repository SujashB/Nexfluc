import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      )
    }

    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      )
    }

    // Format conversation messages for OpenAI
    const conversationText = messages
      .map((msg: { source: string; message: string }) => {
        const role = msg.source === "user" ? "User" : "AI Agent"
        return `${role}: ${msg.message}`
      })
      .join("\n\n")

    // Call OpenAI API to generate insights
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are an AI assistant that analyzes conversations and generates concise, actionable insights. Generate 3-5 short insights or suggestions based on the conversation. Format each insight as a separate bullet point. Keep insights brief (1-2 sentences each).",
          },
          {
            role: "user",
            content: `Analyze this conversation and provide insights:\n\n${conversationText}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("OpenAI API error:", errorData)
      return NextResponse.json(
        { error: "Failed to generate insights" },
        { status: response.status }
      )
    }

    const data = await response.json()
    const insightsText = data.choices[0]?.message?.content || ""

    // Parse insights into an array
    const insights = insightsText
      .split(/\n+/)
      .map((line: string) => line.replace(/^[-•*]\s*/, "").trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 5) // Limit to 5 insights

    return NextResponse.json({ insights })
  } catch (error) {
    console.error("Error generating insights:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

