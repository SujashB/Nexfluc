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
        console.log(`  - Enriching entity: ${entity.label} (${entity.type})`)
        
        const searchResults = await tavily.search({
          query: searchQuery,
          search_depth: "basic",
          include_answer: true,
          max_results: 3,
        })

        console.log(`  - ✅ Enriched ${entity.label}:`, {
          hasAnswer: !!searchResults.answer,
          answerLength: searchResults.answer?.length || 0,
          resultsCount: searchResults.results?.length || 0,
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
      } catch (error: any) {
        console.error(`  - ❌ Error enriching entity ${entity.label}:`, error)
        
        // Check for specific Tavily API errors
        if (error?.response?.status === 432) {
          console.error(`  - Tavily API error 432 (rate limit or invalid key) for ${entity.label}`)
        } else if (error?.response?.status) {
          console.error(`  - Tavily API error ${error.response.status} for ${entity.label}`)
        }
        
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

