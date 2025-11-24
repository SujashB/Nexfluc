import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { transcription, insights, brandData } = await request.json()

    if (!brandData) {
      return NextResponse.json(
        { error: "Brand data is required" },
        { status: 400 }
      )
    }

    // Prepare data for PostgreSQL
    const brandRecord = {
      transcription: transcription || null,
      insights_summary: insights?.summary || null,
      insights_differentiation: JSON.stringify(insights?.differentiation || []),
      insights_startups: JSON.stringify(insights?.startups || []),
      brand_name: JSON.stringify(brandData.name || []),
      brand_tagline: JSON.stringify(brandData.tagline || []),
      brand_color_palette: JSON.stringify(brandData.colorPalette || []),
      brand_design_rationale: brandData.designRationale || null,
      created_at: new Date().toISOString(),
    }

    // Insert into PostgreSQL
    const result = await db.query(
      `INSERT INTO brand_identities (transcription, insights_summary, insights_differentiation, insights_startups, brand_name, brand_tagline, brand_color_palette, brand_design_rationale, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id`,
      [
        brandRecord.transcription,
        brandRecord.insights_summary,
        brandRecord.insights_differentiation,
        brandRecord.insights_startups,
        brandRecord.brand_name,
        brandRecord.brand_tagline,
        brandRecord.brand_color_palette,
        brandRecord.brand_design_rationale,
        brandRecord.created_at,
      ]
    )

    const id = result.rows[0]?.id

    if (!id) {
      throw new Error("Failed to get inserted ID")
    }

    console.log("✅ [save-brand] Brand identity saved successfully:", id)

    return NextResponse.json({ 
      success: true, 
      id 
    })
  } catch (error) {
    console.error("❌ [save-brand] Error:", error)
    
    // Check if it's a table doesn't exist error
    if (error && typeof error === 'object' && 'code' in error && error.code === '42P01') {
      console.error("  - Table 'brand_identities' does not exist. Please create it in Supabase.")
      return NextResponse.json(
        { 
          error: "Database table not found", 
          details: "The 'brand_identities' table does not exist. Please create it in your Supabase database.",
          hint: "Create table with columns: id (uuid), transcription (text), insights_summary (text), insights_differentiation (jsonb), insights_startups (jsonb), brand_name (jsonb), brand_tagline (jsonb), brand_color_palette (jsonb), brand_design_rationale (text), created_at (timestamp)"
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: "Failed to save brand identity", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}

