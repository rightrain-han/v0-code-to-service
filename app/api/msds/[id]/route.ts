import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase disabled" }, { status: 503 })
    }

    const { data, error } = await supabase
      .from("msds_items")
      .select(`
        *,
        msds_warning_symbols(warning_symbol_id),
        msds_protective_equipment(protective_equipment_id),
        msds_config_items(config_type, config_value)
      `)
      .eq("id", id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching MSDS item:", error)
    return NextResponse.json({ error: "Failed to fetch MSDS item" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase disabled" }, { status: 503 })
    }

    const body = await request.json()

    const { error: updateError } = await supabase
      .from("msds_items")
      .update({
        name: body.name,
        pdf_file_name: body.pdfFileName,
        pdf_file_url: body.pdfUrl,
        warning_label_pdf: body.warningLabelPdfUrl,
        management_guidelines_pdf: body.managementGuidelinesPdfUrl,
        usage: body.usage,
      })
      .eq("id", id)

    if (updateError) throw updateError

    // Delete existing relations
    await Promise.all([
      supabase.from("msds_warning_symbols").delete().eq("msds_id", id),
      supabase.from("msds_protective_equipment").delete().eq("msds_id", id),
      supabase.from("msds_config_items").delete().eq("msds_id", id),
    ])

    // Insert new warning symbols
    if (body.warningSymbols?.length > 0) {
      const warningSymbolInserts = body.warningSymbols.map((symbolId: string) => ({
        msds_id: Number.parseInt(id),
        warning_symbol_id: symbolId,
      }))
      await supabase.from("msds_warning_symbols").insert(warningSymbolInserts)
    }

    // Insert new protective equipment
    if (body.hazards?.length > 0) {
      const protectiveEquipmentInserts = body.hazards.map((equipmentId: string) => ({
        msds_id: Number.parseInt(id),
        protective_equipment_id: equipmentId,
      }))
      await supabase.from("msds_protective_equipment").insert(protectiveEquipmentInserts)
    }

    // Insert new config items
    const configInserts: { msds_id: number; config_type: string; config_value: string }[] = []

    if (body.reception?.length > 0) {
      body.reception.forEach((value: string) => {
        configInserts.push({ msds_id: Number.parseInt(id), config_type: "reception", config_value: value })
      })
    }

    if (body.laws?.length > 0) {
      body.laws.forEach((value: string) => {
        configInserts.push({ msds_id: Number.parseInt(id), config_type: "laws", config_value: value })
      })
    }

    if (configInserts.length > 0) {
      await supabase.from("msds_config_items").insert(configInserts)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating MSDS item:", error)
    return NextResponse.json({ error: "Failed to update MSDS item" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase disabled" }, { status: 503 })
    }

    const { error } = await supabase.from("msds_items").delete().eq("id", id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting MSDS item:", error)
    return NextResponse.json({ error: "Failed to delete MSDS item" }, { status: 500 })
  }
}
