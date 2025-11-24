import { NextRequest, NextResponse } from "next/server"
import { TavilyClient } from "tavily"
import Groq from "groq-sdk"

export async function POST(request: NextRequest) {
  console.log("🚀 [generate-brand] API route called")
  
  try {
    console.log("📥 [generate-brand] Parsing request body...")
    const { transcription, insights } = await request.json()
    console.log("✅ [generate-brand] Request parsed:")
    console.log("  - Transcription length:", transcription?.length || 0)
    console.log("  - Has insights:", !!insights)
    console.log("  - Insights summary:", insights?.summary?.substring(0, 100) || "N/A")
    console.log("  - Insights startups count:", insights?.startups?.length || 0)

    const groqApiKey = process.env.GROQ_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY
    const tavilyApiKey = process.env.TAVILY_API_KEY

    console.log("🔑 [generate-brand] Checking API keys:")
    console.log("  - GROQ_API_KEY:", groqApiKey ? "✅ Present" : "❌ Missing")
    console.log("  - OPENAI_API_KEY:", openaiApiKey ? "✅ Present" : "❌ Missing")
    console.log("  - TAVILY_API_KEY:", tavilyApiKey ? "✅ Present" : "❌ Missing")

    if (!groqApiKey && !openaiApiKey) {
      console.error("❌ [generate-brand] GROQ_API_KEY or OPENAI_API_KEY must be configured")
      return NextResponse.json(
        { error: "GROQ_API_KEY or OPENAI_API_KEY must be configured" },
        { status: 500 }
      )
    }

    // Use Tavily to research competitors and get design inspiration
    let competitorInfo = ""
    let designPatterns = ""
    let competitorColors = ""
    let competitorLogos = ""
    
    console.log("🔍 [generate-brand] Starting Tavily research...")
    console.log("  - TAVILY_API_KEY present:", !!tavilyApiKey)
    if (tavilyApiKey) {
      try {
        console.log("  - Initializing Tavily client...")
        const tavily = new TavilyClient({ apiKey: tavilyApiKey })
        
        // Search for competitor branding and design patterns
        let competitorSearchQuery = ""
        
        if (insights?.startups && insights.startups.length > 0) {
          const competitorNames = insights.startups
            .slice(0, 3)
            .map((s: any) => s.name)
            .join(", ")
          competitorSearchQuery = `${competitorNames} brand identity logo color palette design style`
          console.log("  - Searching for competitor info from insights:", competitorNames)
        } else {
          // Fallback: search based on transcription or startup idea
          const startupIdea = transcription || insights?.summary || ""
          if (startupIdea && startupIdea.trim().length > 20) {
            competitorSearchQuery = `${startupIdea.substring(0, 200)} competitors similar startups brand identity design`
            console.log("  - Searching for competitor info from startup idea, length:", startupIdea.length)
          } else {
            console.log("  - ⚠️ Startup idea too short for competitor search:", startupIdea?.length || 0)
          }
        }

        if (competitorSearchQuery) {
          try {
            console.log("  - Executing Tavily search with query:", competitorSearchQuery.substring(0, 100))
            const searchResult = await tavily.search({
              query: competitorSearchQuery,
              search_depth: "advanced",
              include_answer: true,
              max_results: 5,
            })

            console.log("  - Competitor search results:", {
              hasAnswer: !!searchResult.answer,
              answerLength: searchResult.answer?.length || 0,
              resultsCount: searchResult.results?.length || 0,
              fullResponse: JSON.stringify(searchResult).substring(0, 500),
            })

            if (searchResult.answer && searchResult.answer.trim().length > 0) {
              competitorInfo = searchResult.answer
              console.log("  - ✅ Competitor info retrieved from answer, length:", competitorInfo.length)
            } else if (searchResult.results && searchResult.results.length > 0) {
              // Fallback: extract competitor info from search results if answer is not available
              const extractedInfo = searchResult.results
                .map((r: any) => r.content || r.snippet || r.title || "")
                .filter((c: string) => c && c.length > 0)
                .join("\n\n")
              
              if (extractedInfo.length > 0) {
                competitorInfo = extractedInfo.substring(0, 2000)
                console.log("  - ✅ Competitor info extracted from results, length:", competitorInfo.length)
              } else {
                console.log("  - ⚠️ No usable content found in search results")
              }
            } else {
              console.log("  - ⚠️ No answer or results in search response")
            }
            
            // Extract competitor color information
            if (searchResult.results && searchResult.results.length > 0) {
              competitorColors = searchResult.results
                .map((r: any) => r.content || r.snippet || "")
                .filter((c: string) => c && c.length > 0)
                .join("\n")
                .substring(0, 1000)
              console.log("  - ✅ Competitor colors extracted, length:", competitorColors.length)
            }
          } catch (searchError) {
            console.error("  - ❌ Competitor search failed:", searchError)
            console.error("  - Error details:", searchError instanceof Error ? searchError.message : String(searchError))
          }
        } else {
          console.log("  - ⚠️ No query available for competitor search")
        }

        // Search for design trends and logo styles in the industry
        try {
          const trendQuery = `startup logo design trends ${insights?.summary || transcription || ""} color schemes visual identity`
          console.log("  - Searching for design trends...")
          const trendResult = await tavily.search({
            query: trendQuery,
            search_depth: "basic",
            include_answer: true,
            max_results: 5,
          })

          console.log("  - Design trends search:", {
            hasAnswer: !!trendResult.answer,
            answerLength: trendResult.answer?.length || 0,
            resultsCount: trendResult.results?.length || 0,
          })

          if (trendResult.answer && trendResult.answer.trim().length > 0) {
            designPatterns = trendResult.answer
            console.log("  - ✅ Design patterns retrieved, length:", designPatterns.length)
          } else if (trendResult.results && trendResult.results.length > 0) {
            designPatterns = trendResult.results
              .map((r: any) => r.content || r.snippet || "")
              .filter((c: string) => c && c.length > 0)
              .join("\n\n")
              .substring(0, 1500)
            console.log("  - ✅ Design patterns extracted from results, length:", designPatterns.length)
          }
        } catch (trendError: any) {
          console.error("  - ❌ Design trends search failed:", trendError)
          if (trendError?.response?.status === 432) {
            console.error("  - Tavily API error 432 (rate limit or invalid key)")
          }
        }
        
        // Search specifically for logo design patterns
        try {
          const logoQuery = `modern startup logo design patterns ${insights?.summary || transcription || ""} minimalist geometric abstract`
          console.log("  - Searching for logo patterns...")
          const logoResult = await tavily.search({
            query: logoQuery,
            search_depth: "basic",
            include_answer: true,
            max_results: 3,
          })
          
          console.log("  - Logo patterns search:", {
            hasAnswer: !!logoResult.answer,
            answerLength: logoResult.answer?.length || 0,
            resultsCount: logoResult.results?.length || 0,
          })
          
          if (logoResult.answer && logoResult.answer.trim().length > 0) {
            competitorLogos = logoResult.answer
            console.log("  - ✅ Logo patterns retrieved, length:", competitorLogos.length)
          } else if (logoResult.results && logoResult.results.length > 0) {
            competitorLogos = logoResult.results
              .map((r: any) => r.content || r.snippet || "")
              .filter((c: string) => c && c.length > 0)
              .join("\n\n")
              .substring(0, 1000)
            console.log("  - ✅ Logo patterns extracted from results, length:", competitorLogos.length)
          }
        } catch (logoError: any) {
          console.error("  - ❌ Logo patterns search failed:", logoError)
          if (logoError?.response?.status === 432) {
            console.error("  - Tavily API error 432 (rate limit or invalid key)")
          }
        }
        
        console.log("✅ [generate-brand] Tavily research completed")
        console.log("  - Final competitorInfo length:", competitorInfo.length)
        console.log("  - Final designPatterns length:", designPatterns.length)
        console.log("  - Final competitorColors length:", competitorColors.length)
        console.log("  - Final competitorLogos length:", competitorLogos.length)
      } catch (tavilyError: any) {
        console.error("❌ [generate-brand] Tavily search failed:", tavilyError)
        console.error("  - Error type:", tavilyError?.constructor?.name || typeof tavilyError)
        console.error("  - Error message:", tavilyError?.message || String(tavilyError))
        if (tavilyError?.response?.status === 432) {
          console.error("  - Tavily API error 432: Rate limit exceeded or invalid API key")
        } else if (tavilyError?.response?.status) {
          console.error("  - Tavily API error status:", tavilyError.response.status)
        }
        // Continue without Tavily data
      }
    } else {
      console.log("⚠️ [generate-brand] TAVILY_API_KEY not configured, skipping Tavily research")
    }

    // Build comprehensive prompt with Tavily research
    const startupIdea = transcription || insights?.summary || "A new innovative startup"
    const differentiationStrategies = insights?.differentiation || []
    const competitorStartups = insights?.startups || []
    
    console.log("📝 [generate-brand] Building prompt:")
    console.log("  - Startup idea length:", startupIdea.length)
    console.log("  - Differentiation strategies:", differentiationStrategies.length)
    console.log("  - Competitor startups:", competitorStartups.length)
    
    // Build competitor context from insights
    const competitorContext = competitorStartups.length > 0
      ? `\n=== COMPETITOR STARTUPS (from AI analysis) ===\n${competitorStartups.map((s: any) => 
          `- ${s.name} (${Math.round((s.similarity || 0) * 100)}% similar): ${s.description || "No description"}\n  Tags: ${s.tags?.join(", ") || "N/A"}`
        ).join("\n")}\n`
      : ""

    const differentiationContext = differentiationStrategies.length > 0
      ? `\n=== DIFFERENTIATION STRATEGIES (from AI analysis) ===\n${differentiationStrategies.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n`
      : ""

    const systemPrompt = `You are a brand identity expert. Generate unique, creative brand identities for startups based on their ideas, competitor analysis, and differentiation strategies.`

    const userPrompt = `Based on this startup idea: "${startupIdea}"

${competitorContext}
${differentiationContext}
${competitorInfo ? `\n=== COMPETITOR ANALYSIS (from Tavily research) ===\n${competitorInfo}\n` : ""}
${competitorColors ? `\n=== COMPETITOR COLOR SCHEMES ===\n${competitorColors.substring(0, 800)}\n` : ""}
${competitorLogos ? `\n=== COMPETITOR LOGO STYLES ===\n${competitorLogos}\n` : ""}
${designPatterns ? `\n=== DESIGN TRENDS (from Tavily research) ===\n${designPatterns}\n` : ""}

Generate a complete brand identity that incorporates the differentiation strategies above. Make it UNIQUE and SPECIFIC to this startup idea - avoid generic responses:

1. **Name**: Suggest 2-3 memorable, brandable startup names that are unique and reflect the differentiation strategies. Be creative and specific to this idea.
2. **Tagline**: Create 2-3 compelling taglines that emphasize how this startup stands out. Make them specific to the startup's value proposition.
3. **Color Palette**: Provide a color palette with hex codes (3-5 colors) that is DIFFERENT from competitor colors and aligns with the differentiation approach. Choose colors that reflect the startup's unique positioning.
${competitorColors ? `\nIMPORTANT: Competitor color schemes found: ${competitorColors.substring(0, 500)}\n\nYour color palette MUST be visually distinct from these competitor colors. Explain WHY your chosen colors differentiate from competitors and what they communicate about your brand's unique value proposition.` : ""}
4. **Design Rationale**: Explain in 2-3 sentences why these choices differentiate from competitors and align with the startup's mission and the differentiation strategies mentioned above. Specifically explain why the chosen colors are better suited than competitor colors - what do they communicate that competitors' colors don't?

Return ONLY valid JSON, no other text:
{
  "name": ["Option 1", "Option 2", "Option 3"],
  "tagline": ["Tagline 1", "Tagline 2"],
  "colorPalette": [
    {"name": "Primary", "hex": "#XXXXXX"},
    {"name": "Secondary", "hex": "#XXXXXX"},
    {"name": "Accent", "hex": "#XXXXXX"}
  ],
  "designRationale": "Explanation of design choices and how they differentiate from competitors..."
}`

    // Generate text response using Groq first, then OpenAI as fallback
    console.log("🤖 [generate-brand] Starting text generation (Groq/OpenAI)...")
    let textResponse = ""
    let brandData: any = null
    
    try {
      // Try GROQ first
      if (groqApiKey) {
        try {
          console.log("  - Trying Groq API...")
          const groq = new Groq({ apiKey: groqApiKey })
          const completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" },
            temperature: 0.9, // Higher temperature for more creative/unique outputs
            max_tokens: 2000,
          })
          textResponse = completion.choices[0]?.message?.content || ""
          console.log("  - ✅ Groq response received, length:", textResponse.length)
        } catch (groqError) {
          console.error("❌ [generate-brand] Groq API error:", groqError)
          console.error("  - Error details:", groqError instanceof Error ? groqError.message : String(groqError))
          // Fall through to OpenAI fallback
        }
      }

      // Fallback to OpenAI if GROQ failed or not configured
      if (!textResponse && openaiApiKey) {
        try {
          console.log("  - Trying OpenAI API...")
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
                { role: "user", content: userPrompt },
              ],
              response_format: { type: "json_object" },
              max_tokens: 2000,
              temperature: 0.9, // Higher temperature for more creative/unique outputs
            }),
          })

          if (!response.ok) {
            const errorData = await response.text()
            console.error("❌ [generate-brand] OpenAI API error:", errorData)
            throw new Error("OpenAI API request failed")
          }

          const data = await response.json()
          textResponse = data.choices[0]?.message?.content || ""
          console.log("  - ✅ OpenAI response received, length:", textResponse.length)
        } catch (openaiError) {
          console.error("❌ [generate-brand] OpenAI API error:", openaiError)
          console.error("  - Error details:", openaiError instanceof Error ? openaiError.message : String(openaiError))
        }
      }

      if (!textResponse) {
        throw new Error("Failed to generate brand data from any provider")
      }

      // Parse JSON response
      console.log("📝 [generate-brand] Parsing response...")
      console.log("  - Text response length:", textResponse.length)
      console.log("  - Text response preview:", textResponse.substring(0, 300))
      
      try {
        // Try parsing directly first (for JSON mode responses)
        brandData = JSON.parse(textResponse)
        console.log("✅ [generate-brand] Successfully parsed brand data")
        console.log("  - Names:", brandData.name?.length || 0)
        console.log("  - Taglines:", brandData.tagline?.length || 0)
        console.log("  - Colors:", brandData.colorPalette?.length || 0)
      } catch (parseError) {
        // Try extracting JSON from text if direct parse fails
        console.log("  - Direct parse failed, trying to extract JSON...")
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          console.log("  - Found JSON match, length:", jsonMatch[0].length)
          brandData = JSON.parse(jsonMatch[0])
          console.log("✅ [generate-brand] Successfully parsed brand data from extracted JSON")
        } else {
          console.error("❌ [generate-brand] Failed to parse JSON from response")
          console.log("  - Raw response:", textResponse.substring(0, 1000))
          throw new Error("Failed to parse brand data from response")
        }
      }
    } catch (textError) {
      console.error("❌ [generate-brand] Error generating text:", textError)
      console.error("  - Error type:", textError instanceof Error ? textError.constructor.name : typeof textError)
      console.error("  - Error message:", textError instanceof Error ? textError.message : String(textError))
      throw new Error(
        `Failed to generate brand identity: ${textError instanceof Error ? textError.message : "Unknown error"}`
      )
    }

    console.log("📊 [generate-brand] Brand generation summary:")
    console.log("  - Brand names:", brandData?.name?.length || 0)
    console.log("  - Brand taglines:", brandData?.tagline?.length || 0)
    console.log("  - Brand colors:", brandData?.colorPalette?.length || 0)
    console.log("  - Tavily competitor info:", competitorInfo ? `✅ Yes (${competitorInfo.length} chars)` : "❌ No")
    console.log("  - Tavily design patterns:", designPatterns ? `✅ Yes (${designPatterns.length} chars)` : "❌ No")
    console.log("  - Tavily competitor colors:", competitorColors ? `✅ Yes (${competitorColors.length} chars)` : "❌ No")
    console.log("  - Tavily competitor logos:", competitorLogos ? `✅ Yes (${competitorLogos.length} chars)` : "❌ No")

    const responseData = {
      ...brandData,
    }
    
    console.log("✅ [generate-brand] Returning response with:", {
      nameCount: responseData.name?.length || 0,
      taglineCount: responseData.tagline?.length || 0,
      colorCount: responseData.colorPalette?.length || 0,
    })

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("❌ [generate-brand] Top-level error:", error)
    console.error("  - Error type:", error instanceof Error ? error.constructor.name : typeof error)
    console.error("  - Error message:", error instanceof Error ? error.message : String(error))
    if (error instanceof Error && error.stack) {
      console.error("  - Stack trace:", error.stack)
    }
    return NextResponse.json(
      {
        error: "Failed to generate brand identity",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

