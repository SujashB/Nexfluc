import { NextRequest, NextResponse } from "next/server"
import Groq from "groq-sdk"
import { TavilyClient } from "tavily"

export async function POST(request: NextRequest) {
  try {
    const { messages, transcription } = await request.json()

    const groqApiKey = process.env.GROQ_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    const tavilyApiKey = process.env.TAVILY_API_KEY
    
    if (!groqApiKey && !openaiApiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY or OPENAI_API_KEY must be configured" },
        { status: 500 }
      )
    }

    // Use Tavily to enrich insights with real market data
    let marketResearch = ""
    let competitorAnalysis = ""
    let competitorInfo = ""
    let designPatterns = ""
    let competitorColors = ""
    let competitorLogos = ""
    
    if (tavilyApiKey) {
      try {
        console.log("🔍 [insights] Starting Tavily research for better differentiators...")
        const tavily = new TavilyClient({ apiKey: tavilyApiKey })
        
        // Research the startup idea market
        const researchQuery = transcription || messages?.map((m: any) => m.message).join(" ") || ""
        if (researchQuery && researchQuery.trim().length > 20) {
          try {
            // Market research
            const marketResult = await tavily.search({
              query: `${researchQuery.substring(0, 300)} market analysis competitors differentiation`,
              search_depth: "basic",
              include_answer: true,
              max_results: 5,
            })
            
            if (marketResult.answer && marketResult.answer.trim().length > 0) {
              marketResearch = marketResult.answer
              console.log("✅ [insights] Market research retrieved, length:", marketResearch.length)
            } else if (marketResult.results && marketResult.results.length > 0) {
              marketResearch = marketResult.results
                .map((r: any) => r.content || r.snippet || "")
                .filter((c: string) => c && c.length > 0)
                .join("\n\n")
                .substring(0, 2000)
              console.log("✅ [insights] Market research extracted from results, length:", marketResearch.length)
            }

            // Competitor info search
            const competitorQuery = `${researchQuery.substring(0, 300)} competitors similar startups`
            const competitorResult = await tavily.search({
              query: competitorQuery,
              search_depth: "advanced",
              include_answer: true,
              max_results: 5,
            })
            
            if (competitorResult.answer && competitorResult.answer.trim().length > 0) {
              competitorInfo = competitorResult.answer
              console.log("✅ [insights] Competitor info retrieved, length:", competitorInfo.length)
            } else if (competitorResult.results && competitorResult.results.length > 0) {
              competitorInfo = competitorResult.results
                .map((r: any) => r.content || r.snippet || r.title || "")
                .filter((c: string) => c && c.length > 0)
                .join("\n\n")
                .substring(0, 2000)
              console.log("✅ [insights] Competitor info extracted, length:", competitorInfo.length)
            }

            // Design patterns search
            const designQuery = `startup logo design trends ${researchQuery.substring(0, 200)} color schemes visual identity`
            const designResult = await tavily.search({
              query: designQuery,
              search_depth: "basic",
              include_answer: true,
              max_results: 5,
            })
            
            if (designResult.answer && designResult.answer.trim().length > 0) {
              designPatterns = designResult.answer
              console.log("✅ [insights] Design patterns retrieved, length:", designPatterns.length)
            } else if (designResult.results && designResult.results.length > 0) {
              designPatterns = designResult.results
                .map((r: any) => r.content || r.snippet || "")
                .filter((c: string) => c && c.length > 0)
                .join("\n\n")
                .substring(0, 1500)
              console.log("✅ [insights] Design patterns extracted, length:", designPatterns.length)
            }

            // Competitor colors search
            const colorQuery = `${researchQuery.substring(0, 200)} competitor brand colors color palette`
            const colorResult = await tavily.search({
              query: colorQuery,
              search_depth: "basic",
              include_answer: true,
              max_results: 5,
            })
            
            if (colorResult.results && colorResult.results.length > 0) {
              competitorColors = colorResult.results
                .map((r: any) => r.content || r.snippet || "")
                .filter((c: string) => c && c.length > 0)
                .join("\n")
                .substring(0, 1000)
              console.log("✅ [insights] Competitor colors extracted, length:", competitorColors.length)
            }

            // Competitor logos search
            const logoQuery = `${researchQuery.substring(0, 200)} competitor logos logo design`
            const logoResult = await tavily.search({
              query: logoQuery,
              search_depth: "basic",
              include_answer: true,
              max_results: 3,
            })
            
            if (logoResult.results && logoResult.results.length > 0) {
              competitorLogos = logoResult.results
                .map((r: any) => r.content || r.snippet || "")
                .filter((c: string) => c && c.length > 0)
                .join("\n")
                .substring(0, 500)
              console.log("✅ [insights] Competitor logos extracted, length:", competitorLogos.length)
            }
          } catch (tavilyError: any) {
            console.error("❌ [insights] Tavily research failed:", tavilyError)
            if (tavilyError?.response?.status === 432) {
              console.error("  - Tavily API error 432 (rate limit or invalid key)")
            }
          }
        }
      } catch (error) {
        console.error("❌ [insights] Tavily initialization failed:", error)
      }
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
3. Differentiation strategies (3-5 points) - these should be SPECIFIC, ACTIONABLE, and based on real market gaps
4. Network graph data with nodes (startups, concepts, features) and edges (relationships)

${marketResearch ? `\n=== MARKET RESEARCH DATA ===\n${marketResearch}\n\nUse this market research to identify REAL differentiation opportunities that competitors are missing.\n` : ""}

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
              content: `Analyze this conversation about a startup idea:\n\n${fullText}${marketResearch ? `\n\nUse the market research data above to identify specific differentiation opportunities that are not being addressed by competitors. Focus on actionable, unique differentiators based on real market gaps.` : ""}`,
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
              content: `Analyze this conversation about a startup idea:\n\n${fullText}${marketResearch ? `\n\nUse the market research data above to identify specific differentiation opportunities that are not being addressed by competitors. Focus on actionable, unique differentiators based on real market gaps.` : ""}`,
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
        // Include Tavily research data for display
        tavilyResearch: {
          marketResearch: marketResearch || null,
          competitorAnalysis: competitorAnalysis || null,
          competitorInfo: competitorInfo || null,
          designPatterns: designPatterns || null,
          competitorColors: competitorColors || null,
          competitorLogos: competitorLogos || null,
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

