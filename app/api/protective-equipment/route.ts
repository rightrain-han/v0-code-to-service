import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { DEFAULT_PROTECTIVE_EQUIPMENT } from "@/types/msds"

export async function GET() {
  try {
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(DEFAULT_PROTECTIVE_EQUIPMENT)
    }

    const { data, error } = await supabase.from("protective_equipment").select("*").order("name", { ascending: true })

    if (error || !data || data.length === 0) {
      return NextResponse.json(DEFAULT_PROTECTIVE_EQUIPMENT)
    }

    const formatted = data.map((e) => ({
      id: e.id,
      name: e.name,
      description: e.description,
      imageUrl: e.image_url,
      category: e.category,
      isActive: e.is_active,
    }))

    return NextResponse.json(formatted)
  } catch (err) {
    console.error("[v0] Protective-equipment API error:", err)
    return NextResponse.json(DEFAULT_PROTECTIVE_EQUIPMENT)
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
      .from("protective_equipment")
      .insert({
        id: body.id,
        name: body.name,
        description: body.description || "",
        image_url: body.imageUrl || "/placeholder.svg",
        category: body.category || "respiratory",
        is_active: body.isActive !== false,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error creating protective equipment:", error)
    return NextResponse.json({ error: "Failed to create protective equipment" }, { status: 500 })
  }
}
