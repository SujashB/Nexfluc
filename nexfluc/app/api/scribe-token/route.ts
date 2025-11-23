import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    // Try both possible environment variable names
    const elevenlabsApiKey = 
      process.env.ELEVENLABS_API_KEY || 
      process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY
    
    if (!elevenlabsApiKey) {
      console.error("Missing ELEVENLABS_API_KEY environment variable")
      return NextResponse.json(
        { 
          error: "ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY in your .env.local file." 
        },
        { status: 500 }
      )
    }

    // Fetch a single-use token from ElevenLabs
    const apiUrl = "https://api.elevenlabs.io/v1/single-use-token/realtime_scribe"
    
    console.log("Fetching token from:", apiUrl)
    console.log("API key present:", !!elevenlabsApiKey)
    console.log("API key length:", elevenlabsApiKey?.length)
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "xi-api-key": elevenlabsApiKey,
      },
    })

    console.log("Response status:", response.status)
    console.log("Response ok:", response.ok)

    if (!response.ok) {
      let errorMessage = "Failed to get scribe token"
      let errorDetails: any = {}
      try {
        const errorData = await response.json()
        errorDetails = errorData
        errorMessage = errorData.detail?.message || errorData.message || errorData.detail || errorMessage
        console.error("ElevenLabs API error (JSON):", errorData)
      } catch {
        const errorText = await response.text()
        console.error("ElevenLabs API error (text):", errorText)
        errorMessage = errorText || errorMessage
        errorDetails = { raw: errorText }
      }
      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorDetails,
          status: response.status,
          url: apiUrl
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    if (!data.token) {
      console.error("No token in response:", data)
      return NextResponse.json(
        { error: "No token received from ElevenLabs API" },
        { status: 500 }
      )
    }
    return NextResponse.json({ token: data.token })
  } catch (error) {
    console.error("Error fetching scribe token:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

