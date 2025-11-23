import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI, PersonGeneration } from "@google/genai"
import { TavilyClient } from "tavily"

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

    const geminiApiKey = process.env.GEMINI_API_KEY
    const tavilyApiKey = process.env.TAVILY_API_KEY

    console.log("🔑 [generate-brand] Checking API keys:")
    console.log("  - GEMINI_API_KEY:", geminiApiKey ? "✅ Present" : "❌ Missing")
    console.log("  - TAVILY_API_KEY:", tavilyApiKey ? "✅ Present" : "❌ Missing")

    if (!geminiApiKey) {
      console.error("❌ [generate-brand] GEMINI_API_KEY not configured")
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      )
    }

    // Use Tavily to research competitors and get design inspiration
    let competitorInfo = ""
    let designPatterns = ""
    let competitorColors = ""
    let competitorLogos = ""
    
    console.log("🔍 [generate-brand] Starting Tavily research...")
    if (tavilyApiKey) {
      try {
        console.log("  - Initializing Tavily client...")
        const tavily = new TavilyClient({ apiKey: tavilyApiKey })
        
        // Search for competitor branding and design patterns
        if (insights?.startups && insights.startups.length > 0) {
          const competitorNames = insights.startups
            .slice(0, 3)
            .map((s: any) => s.name)
            .join(", ")

          console.log("  - Searching for competitor info:", competitorNames)
          const searchResult = await tavily.search({
            query: `${competitorNames} brand identity logo color palette design style`,
            search_depth: "advanced",
            include_answer: true,
            max_results: 5,
          })

          console.log("  - Competitor search results:", {
            hasAnswer: !!searchResult.answer,
            resultsCount: searchResult.results?.length || 0,
          })

          if (searchResult.answer) {
            competitorInfo = searchResult.answer
            console.log("  - ✅ Competitor info retrieved, length:", competitorInfo.length)
          }
          
          // Extract competitor color information
          if (searchResult.results && searchResult.results.length > 0) {
            competitorColors = searchResult.results
              .map((r: any) => r.content)
              .join("\n")
              .substring(0, 1000)
            console.log("  - ✅ Competitor colors extracted, length:", competitorColors.length)
          }
        } else {
          console.log("  - ⚠️ No competitor startups found, skipping competitor search")
        }

        // Search for design trends and logo styles in the industry
        const trendQuery = `startup logo design trends ${insights?.summary || transcription || ""} color schemes visual identity`
        console.log("  - Searching for design trends...")
        const trendResult = await tavily.search({
          query: trendQuery,
          search_depth: "advanced",
          include_answer: true,
          max_results: 5,
        })

        console.log("  - Design trends search:", {
          hasAnswer: !!trendResult.answer,
          resultsCount: trendResult.results?.length || 0,
        })

        if (trendResult.answer) {
          designPatterns = trendResult.answer
          console.log("  - ✅ Design patterns retrieved, length:", designPatterns.length)
        }
        
        // Search specifically for logo design patterns
        const logoQuery = `modern startup logo design patterns ${insights?.summary || ""} minimalist geometric abstract`
        console.log("  - Searching for logo patterns...")
        const logoResult = await tavily.search({
          query: logoQuery,
          search_depth: "basic",
          include_answer: true,
          max_results: 3,
        })
        
        console.log("  - Logo patterns search:", {
          hasAnswer: !!logoResult.answer,
          resultsCount: logoResult.results?.length || 0,
        })
        
        if (logoResult.answer) {
          competitorLogos = logoResult.answer
          console.log("  - ✅ Logo patterns retrieved, length:", competitorLogos.length)
        }
        
        console.log("✅ [generate-brand] Tavily research completed")
      } catch (tavilyError) {
        console.error("❌ [generate-brand] Tavily search failed:", tavilyError)
        console.error("  - Error details:", tavilyError instanceof Error ? tavilyError.message : String(tavilyError))
        // Continue without Tavily data
      }
    } else {
      console.log("⚠️ [generate-brand] TAVILY_API_KEY not configured, skipping Tavily research")
    }

    // Generate brand identity using Gemini
    console.log("🤖 [generate-brand] Starting Gemini API call...")
    try {
      console.log("  - Initializing GoogleGenAI client...")
      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
      })
      console.log("  - ✅ GoogleGenAI client initialized")

      const tools = [
        {
          googleSearch: {},
        },
      ]

      // Build comprehensive prompt with Tavily research
      const startupIdea = transcription || insights?.summary || "A new innovative startup"
      const differentiationStrategies = insights?.differentiation || []
      const competitorStartups = insights?.startups || []
      
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

      const prompt = `Based on this startup idea: "${startupIdea}"

${competitorContext}
${differentiationContext}
${competitorInfo ? `\n=== COMPETITOR ANALYSIS (from Tavily research) ===\n${competitorInfo}\n` : ""}
${competitorColors ? `\n=== COMPETITOR COLOR SCHEMES ===\n${competitorColors.substring(0, 800)}\n` : ""}
${competitorLogos ? `\n=== COMPETITOR LOGO STYLES ===\n${competitorLogos}\n` : ""}
${designPatterns ? `\n=== DESIGN TRENDS (from Tavily research) ===\n${designPatterns}\n` : ""}

Generate a complete brand identity that incorporates the differentiation strategies above:

1. **Name**: Suggest a memorable, brandable startup name (2-3 options) that is unique and reflects the differentiation strategies
2. **Tagline**: Create a compelling tagline (1-2 options) that emphasizes how this startup stands out
3. **Color Palette**: Provide a color palette with hex codes that is DIFFERENT from competitor colors (3-5 colors) and aligns with the differentiation approach
4. **Design Rationale**: Explain why these choices differentiate from competitors and align with the startup's mission and the differentiation strategies mentioned above

IMPORTANT: Return ONLY valid JSON in your text response, no other text:
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

      // Generate text response using Gemini for brand data
      console.log("  - Generating text response for brand data...")
      let textResponse = ""
      
      try {
        const textModel = "gemini-1.5-pro"
        const textContents = [
          {
            role: "user",
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ]

        const textResponseStream = ai.models.generateContentStream({
          model: textModel,
          config: {
            tools,
          },
          contents: textContents,
        })

        for await (const chunk of textResponseStream) {
          if (chunk.text) {
            textResponse += chunk.text
          } else if (chunk.candidates?.[0]?.content?.parts) {
            for (const part of chunk.candidates[0].content.parts) {
              if (part.text) {
                textResponse += part.text
              }
            }
          }
        }
        
        console.log("  - ✅ Text response generated, length:", textResponse.length)
      } catch (textError) {
        console.error("❌ [generate-brand] Error generating text:", textError)
        // Continue without text response, will use defaults
      }

      // Generate logo image using Imagen 4
      console.log("  - Generating logo image using Imagen 4...")
      let logoImageBase64: string | null = null
      let logoMimeType: string | null = null

      try {
        const imagePrompt = `A modern, professional logo design for a startup called "${startupIdea}". 
The logo should be visually distinct from competitors and represent innovation and technology. 
Use a clean, minimalist design style. ${competitorInfo ? `Avoid styles similar to: ${competitorInfo.substring(0, 200)}` : ""}`

        console.log("  - Image prompt:", imagePrompt.substring(0, 200) + "...")
        
        const imageResponse = await ai.models.generateImages({
          model: "models/imagen-4.0-generate-001",
          prompt: imagePrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: "image/jpeg",
            personGeneration: PersonGeneration.ALLOW_ALL,
            aspectRatio: "1:1",
            imageSize: "1K",
          },
        })

        console.log("  - Image response received")
        console.log("  - Response structure:", JSON.stringify(imageResponse, null, 2).substring(0, 1000))
        console.log("  - Generated images count:", imageResponse?.generatedImages?.length || 0)

        if (imageResponse?.generatedImages && imageResponse.generatedImages.length > 0) {
          const firstImage = imageResponse.generatedImages[0]
          console.log("  - First image structure:", JSON.stringify(firstImage, null, 2).substring(0, 500))
          
          // Try different possible structures for image data
          if (firstImage?.image?.imageBytes) {
            logoImageBase64 = firstImage.image.imageBytes
            logoMimeType = "image/jpeg"
            console.log("  - ✅ Logo image found in image.imageBytes")
          } else if (firstImage?.imageBytes) {
            logoImageBase64 = firstImage.imageBytes
            logoMimeType = "image/jpeg"
            console.log("  - ✅ Logo image found in imageBytes")
          } else if (firstImage?.base64) {
            logoImageBase64 = firstImage.base64
            logoMimeType = "image/jpeg"
            console.log("  - ✅ Logo image found in base64")
          } else if (firstImage?.data) {
            logoImageBase64 = firstImage.data
            logoMimeType = "image/jpeg"
            console.log("  - ✅ Logo image found in data")
          } else {
            console.warn("  - ⚠️ Image generated but no imageBytes found")
            console.warn("  - Available keys:", Object.keys(firstImage || {}))
            if (firstImage?.image) {
              console.warn("  - Image object keys:", Object.keys(firstImage.image || {}))
            }
          }
          
          if (logoImageBase64) {
            console.log("  - ✅ Logo image generated successfully, length:", logoImageBase64.length)
          }
        } else {
          console.warn("  - ⚠️ No images generated in response")
          console.warn("  - Response keys:", Object.keys(imageResponse || {}))
        }
      } catch (imageError) {
        console.error("❌ [generate-brand] Error generating image:", imageError)
        console.error("  - Error type:", imageError instanceof Error ? imageError.constructor.name : typeof imageError)
        console.error("  - Error message:", imageError instanceof Error ? imageError.message : String(imageError))
        if (imageError instanceof Error && imageError.stack) {
          console.error("  - Stack trace:", imageError.stack)
        }
        // Continue without image, will return null
      }

      // Try to parse JSON from text response
      let brandData = {
        name: ["Nexfluc", "InnovateHub", "FutureVentures"],
        tagline: ["Your AI Idea Verifier", "Transform Ideas into Reality"],
        colorPalette: [
          { name: "Primary", hex: "#FF7A1A" },
          { name: "Secondary", hex: "#46C3FF" },
          { name: "Accent", hex: "#C06FFF" },
        ],
        designRationale: "Modern, tech-forward design that stands out from competitors.",
      }

      console.log("📝 [generate-brand] Parsing response...")
      console.log("  - Text response length:", textResponse.length)
      console.log("  - Text response preview:", textResponse.substring(0, 300))
      
      try {
        // Extract JSON from text response
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          console.log("  - Found JSON match, length:", jsonMatch[0].length)
          brandData = JSON.parse(jsonMatch[0])
          console.log("✅ [generate-brand] Successfully parsed brand data from Gemini response")
          console.log("  - Names:", brandData.name?.length || 0)
          console.log("  - Taglines:", brandData.tagline?.length || 0)
          console.log("  - Colors:", brandData.colorPalette?.length || 0)
        } else {
          console.warn("⚠️ [generate-brand] No JSON found in response, using defaults")
          console.log("  - Raw response preview:", textResponse.substring(0, 500))
        }
      } catch (parseError) {
        console.error("❌ [generate-brand] Failed to parse JSON from response:", parseError)
        console.log("  - Raw response:", textResponse.substring(0, 1000))
      }
      
      console.log("📊 [generate-brand] Brand generation summary:")
      console.log("  - Logo generated:", logoImageBase64 ? `✅ Yes (${logoImageBase64.length} chars)` : "❌ No")
      console.log("  - Logo MIME type:", logoMimeType || "N/A")
      console.log("  - Text response length:", textResponse.length)
      console.log("  - Tavily competitor info:", competitorInfo ? `✅ Yes (${competitorInfo.length} chars)` : "❌ No")
      console.log("  - Tavily design patterns:", designPatterns ? `✅ Yes (${designPatterns.length} chars)` : "❌ No")
      console.log("  - Tavily competitor colors:", competitorColors ? `✅ Yes (${competitorColors.length} chars)` : "❌ No")
      console.log("  - Tavily competitor logos:", competitorLogos ? `✅ Yes (${competitorLogos.length} chars)` : "❌ No")

      const responseData = {
        logo: logoImageBase64
          ? `data:${logoMimeType};base64,${logoImageBase64}`
          : null,
        logoMimeType,
        ...brandData,
      }
      
      console.log("✅ [generate-brand] Returning response with:", {
        hasLogo: !!responseData.logo,
        nameCount: responseData.name?.length || 0,
        taglineCount: responseData.tagline?.length || 0,
        colorCount: responseData.colorPalette?.length || 0,
      })

      return NextResponse.json(responseData)
    } catch (geminiError) {
      console.error("❌ [generate-brand] Gemini API error:", geminiError)
      console.error("  - Error type:", geminiError instanceof Error ? geminiError.constructor.name : typeof geminiError)
      console.error("  - Error message:", geminiError instanceof Error ? geminiError.message : String(geminiError))
      if (geminiError instanceof Error && geminiError.stack) {
        console.error("  - Stack trace:", geminiError.stack)
      }
      throw new Error(
        `Gemini API error: ${geminiError instanceof Error ? geminiError.message : "Unknown error"}`
      )
    }
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

