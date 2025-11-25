import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { DEFAULT_WARNING_SYMBOLS } from "@/types/msds"

export async function GET() {
  try {
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(DEFAULT_WARNING_SYMBOLS)
    }

    const { data, error } = await supabase.from("warning_symbols").select("*").order("name", { ascending: true })

    if (error || !data || data.length === 0) {
      return NextResponse.json(DEFAULT_WARNING_SYMBOLS)
    }

    const formatted = data.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      imageUrl: s.image_url,
      category: s.category,
      isActive: s.is_active,
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    console.error("[v0] Warning-symbols API error:", err)
    return NextResponse.json(DEFAULT_WARNING_SYMBOLS)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    if (!supabase) throw new Error("Supabase disabled")

    const body = await request.json()

    if (!body.name || !body.id) {
      return NextResponse.json({ error: "Name and ID are required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("warning_symbols")
      .insert({
        id: body.id,
        name: body.name,
        description: body.description || "",
        image_url: body.imageUrl || "/placeholder.svg",
        category: body.category || "physical",
        is_active: body.isActive !== false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error creating warning symbol:", error)
    return NextResponse.json({ error: "Failed to create warning symbol" }, { status: 500 })
  }
}
