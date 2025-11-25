import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

const DEFAULT_CONFIG = [
  { id: 1, type: "usage", value: "pure_reagent", label: "순수시약", is_active: true },
  { id: 2, type: "usage", value: "nox_reduction", label: "NOx저감", is_active: true },
  { id: 3, type: "usage", value: "wastewater_treatment", label: "폐수처리", is_active: true },
  { id: 4, type: "usage", value: "boiler_water_treatment", label: "보일러용수처리", is_active: true },
  { id: 5, type: "reception", value: "lng_3_cpp", label: "LNG 3호기 CPP", is_active: true },
  { id: 6, type: "reception", value: "lng_4_cpp", label: "LNG 4호기 CPP", is_active: true },
  { id: 7, type: "reception", value: "water_treatment", label: "수처리동", is_active: true },
  { id: 8, type: "reception", value: "bio_2_scr", label: "BIO 2호기 SCR", is_active: true },
  { id: 9, type: "laws", value: "chemical_safety", label: "화학물질안전법", is_active: true },
  { id: 10, type: "laws", value: "industrial_safety", label: "산업안전보건법", is_active: true },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(DEFAULT_CONFIG)
    }

    const { data, error } = await supabase
      .from("config_options")
      .select("*")
      .eq("is_active", true)
      .order("type", { ascending: true })
      .order("label", { ascending: true })

    if (error || !data || data.length === 0) {
      return NextResponse.json(DEFAULT_CONFIG)
    }

    return NextResponse.json(data)
  } catch (err) {
    console.warn("[v0] Config options API error:", err)
    return NextResponse.json(DEFAULT_CONFIG)
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase is not available" }, { status: 503 })
    }

    const body = await request.json()

    if (!body.label || !body.type) {
      return NextResponse.json({ error: "Label and type are required" }, { status: 400 })
    }

    const value =
      body.value ||
      body.label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "")

    const { data, error } = await supabase
      .from("config_options")
      .insert({
        type: body.type,
        value: value,
        label: body.label,
        is_active: body.isActive !== false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Error creating config option:", error)
    return NextResponse.json({ error: "Failed to create config option" }, { status: 500 })
  }
}
