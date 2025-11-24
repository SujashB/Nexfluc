import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { transcription, insights, networkNodes, networkEdges } = await request.json()

    if (!insights) {
      return NextResponse.json(
        { error: "Insights data is required" },
        { status: 400 }
      )
    }

    // Prepare data for PostgreSQL
    const insightsData = {
      transcription: transcription || null,
      summary: insights.summary || null,
      differentiation: JSON.stringify(insights.differentiation || []),
      startups: JSON.stringify(insights.startups || []),
      network_nodes: JSON.stringify(networkNodes || []),
      network_edges: JSON.stringify(networkEdges || []),
      created_at: new Date().toISOString(),
    }

    // Insert into PostgreSQL
    const result = await db.query(
      `INSERT INTO insights (transcription, summary, differentiation, startups, network_nodes, network_edges, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        insightsData.transcription,
        insightsData.summary,
        insightsData.differentiation,
        insightsData.startups,
        insightsData.network_nodes,
        insightsData.network_edges,
        insightsData.created_at,
      ]
    )

    const id = result.rows[0]?.id

    if (!id) {
      throw new Error("Failed to get inserted ID")
    }

    console.log("✅ [save-insights] Insights saved successfully:", id)

    return NextResponse.json({ 
      success: true, 
      id 
    })
  } catch (error) {
    console.error("❌ [save-insights] Error:", error)
    
    // Check if it's a table doesn't exist error
    if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
      console.error("  - Table 'insights' does not exist. Please create it in Supabase.")
      return NextResponse.json(
        { 
          error: "Database table not found", 
          details: "The 'insights' table does not exist. Please create it in your Supabase database.",
          hint: "Create table with columns: id (uuid), transcription (text), summary (text), differentiation (jsonb), startups (jsonb), network_nodes (jsonb), network_edges (jsonb), created_at (timestamp)"
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to save insights", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

