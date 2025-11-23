import { NextRequest, NextResponse } from "next/server"
import { TavilyClient } from "tavily"

export async function POST(request: NextRequest) {
  try {
    const { entities, transcription } = await request.json()

    if (!entities || !Array.isArray(entities)) {
      return NextResponse.json(
        { error: "Entities array is required" },
        { status: 400 }
      )
    }

    const tavilyApiKey = process.env.TAVILY_API_KEY
    if (!tavilyApiKey) {
      return NextResponse.json(
        { error: "TAVILY_API_KEY not configured" },
        { status: 500 }
      )
    }

    const tavily = new TavilyClient({ apiKey: tavilyApiKey })
    const enrichedNodes = []

    // Enrich each entity with Tavily search
    for (const entity of entities) {
      try {
        const searchQuery = `${entity.label} ${entity.type}`
        const searchResults = await tavily.search(searchQuery, {
          maxResults: 3,
          includeAnswer: true,
          includeRawContent: false,
        })

        enrichedNodes.push({
          ...entity,
          description: searchResults.answer || entity.description || "",
          sources: searchResults.results?.map((r: any) => ({
            title: r.title,
            url: r.url,
          })) || [],
          relevance: searchResults.results?.length || 0,
        })
      } catch (error) {
        console.error(`Error enriching entity ${entity.label}:`, error)
        // Add entity without enrichment if Tavily fails
        enrichedNodes.push(entity)
      }
    }

    return NextResponse.json({ nodes: enrichedNodes })
  } catch (error) {
    console.error("Error enriching nodes:", error)
    return NextResponse.json(
      { error: "Failed to enrich nodes" },
      { status: 500 }
    )
  }
}

