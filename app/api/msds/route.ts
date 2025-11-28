import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"
import { DEFAULT_WARNING_SYMBOLS, DEFAULT_PROTECTIVE_EQUIPMENT } from "@/types/msds"

const SAMPLE_DATA = [
  {
    id: 1,
    name: "염산 35% (샘플)",
    pdfFileName: "HYDROCHLORIC_ACID.pdf",
    pdfUrl: "/pdfs/HYDROCHLORIC_ACID.pdf",
    hazards: ["toxic", "corrosive"],
    usage: "순수시약",
    reception: ["LNG 3호기 CPP", "수처리동"],
    laws: ["화학물질안전법", "산업안전보건법"],
    warningSymbols: ["corrosive", "toxic"],
    warningSymbolsData: DEFAULT_WARNING_SYMBOLS.filter((s) => ["corrosive", "toxic"].includes(s.id)),
    protectiveEquipmentData: DEFAULT_PROTECTIVE_EQUIPMENT.filter((e) => ["toxic", "corrosive"].includes(e.id)),
    warningLabelPdfUrl: "",
    warningLabelPdfName: "",
    managementGuidelinesPdfUrl: "",
    managementGuidelinesPdfName: "",
    qrCode: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "가성소다 45% (샘플)",
    pdfFileName: "SODIUM_HYDROXIDE.pdf",
    pdfUrl: "/pdfs/SODIUM_HYDROXIDE.pdf",
    hazards: ["corrosive"],
    usage: "순수시약",
    reception: ["LNG 4호기 CPP", "수처리동"],
    laws: ["화학물질안전법"],
    warningSymbols: ["corrosive"],
    warningSymbolsData: DEFAULT_WARNING_SYMBOLS.filter((s) => s.id === "corrosive"),
    protectiveEquipmentData: DEFAULT_PROTECTIVE_EQUIPMENT.filter((e) => e.id === "corrosive"),
    warningLabelPdfUrl: "",
    warningLabelPdfName: "",
    managementGuidelinesPdfUrl: "",
    managementGuidelinesPdfName: "",
    qrCode: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json({ items: [] })
    }

    const { data: msdsItems, error: msdsError } = await supabase
      .from("msds_items")
      .select(`
        *,
        msds_warning_symbols(warning_symbol_id),
        msds_protective_equipment(protective_equipment_id),
        msds_config_items(config_type, config_value)
      `)
      .order("id", { ascending: true })

    if (msdsError) {
      console.error("[v0] MSDS query error:", msdsError)
      return NextResponse.json({ items: [], error: msdsError.message }, { status: 500 })
    }

    if (!msdsItems || msdsItems.length === 0) {
      console.log("[v0] No MSDS items found")
      return NextResponse.json({ items: [] })
    }

    const [warningSymbolsResponse, protectiveEquipmentResponse, locationOptionsResponse] = await Promise.all([
      supabase.from("warning_symbols").select("*"),
      supabase.from("protective_equipment").select("*"),
      supabase.from("config_options").select("*").eq("type", "location"),
    ])

    const warningSymbols = warningSymbolsResponse.data || []
    const protectiveEquipment = protectiveEquipmentResponse.data || []

    const locationMap: Record<string, string> = {}
    ;(locationOptionsResponse.data || []).forEach((opt: { value: string; label: string }) => {
      locationMap[opt.value] = opt.label
    })

    const enrichedItems = msdsItems.map((item) => {
      const warningSymbolIds =
        item.msds_warning_symbols?.map((ws: { warning_symbol_id: string }) => ws.warning_symbol_id) || []
      const protectiveEquipmentIds =
        item.msds_protective_equipment?.map((pe: { protective_equipment_id: string }) => pe.protective_equipment_id) ||
        []

      const configItems = item.msds_config_items || []

      const receptionRaw = configItems
        .filter((c: { config_type: string }) => c.config_type === "reception")
        .map((c: { config_value: string }) => c.config_value)

      const reception: string[] = []
      receptionRaw.forEach((val: string) => {
        const ids = val
          .split(",")
          .map((id: string) => id.trim())
          .filter(Boolean)
        ids.forEach((id: string) => {
          const locationName = locationMap[id] || locationMap[id.padStart(2, "0")] || id
          if (!reception.includes(locationName)) {
            reception.push(locationName)
          }
        })
      })

      const laws = configItems
        .filter((c: { config_type: string }) => c.config_type === "laws")
        .map((c: { config_value: string }) => c.config_value)

      const warningSymbolsData = warningSymbols
        .filter((symbol) => warningSymbolIds.includes(symbol.id))
        .map((symbol) => ({
          id: symbol.id,
          name: symbol.name,
          description: symbol.description,
          imageUrl: symbol.image_url,
          category: symbol.category,
          isActive: symbol.is_active,
        }))

      const protectiveEquipmentData = protectiveEquipment
        .filter((equipment) => protectiveEquipmentIds.includes(equipment.id))
        .map((equipment) => ({
          id: equipment.id,
          name: equipment.name,
          description: equipment.description,
          imageUrl: equipment.image_url,
          category: equipment.category,
          isActive: equipment.is_active,
        }))

      return {
        id: item.id,
        name: item.name,
        pdfFileName: item.pdf_file_name || "",
        pdfUrl: item.pdf_file_url || "",
        warningLabelPdfUrl: item.warning_label_pdf_url || "",
        warningLabelPdfName: item.warning_label_pdf_name || "",
        managementGuidelinesPdfUrl: item.management_guidelines_pdf_url || "",
        managementGuidelinesPdfName: item.management_guidelines_pdf_name || "",
        hazards: protectiveEquipmentIds,
        usage: item.usage || "",
        reception,
        laws,
        warningSymbols: warningSymbolIds,
        warningSymbolsData,
        protectiveEquipmentData,
        qrCode: item.qr_code || "",
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      }
    })

    console.log("[v0] Returning", enrichedItems.length, "MSDS items from DB")
    return NextResponse.json({ items: enrichedItems })
  } catch (err: any) {
    console.error("[v0] MSDS API error:", err)
    return NextResponse.json(
      {
        items: [],
        error: err?.message || "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createAdminClient()
    if (!supabase) throw new Error("Supabase disabled")

    const body = await request.json()

    const { data: msdsItem, error: msdsError } = await supabase
      .from("msds_items")
      .insert({
        name: body.name,
        pdf_file_name: body.pdfFileName,
        pdf_file_url: body.pdfUrl,
        usage: body.usage,
        warning_label_pdf_url: body.warningLabelPdfUrl,
        warning_label_pdf_name: body.warningLabelPdfName,
        management_guidelines_pdf_url: body.managementGuidelinesPdfUrl,
        management_guidelines_pdf_name: body.managementGuidelinesPdfName,
      })
      .select()
      .single()

    if (msdsError) throw msdsError

    if (body.warningSymbols?.length > 0) {
      const warningSymbolInserts = body.warningSymbols.map((symbolId: string) => ({
        msds_id: msdsItem.id,
        warning_symbol_id: String(symbolId), // 숫자를 문자열로 변환
      }))
      const { error: wsError } = await supabase.from("msds_warning_symbols").insert(warningSymbolInserts)
      if (wsError) console.error("[v0] Warning symbols insert error:", wsError)
    }

    if (body.hazards?.length > 0) {
      const protectiveEquipmentInserts = body.hazards.map((equipmentId: string) => ({
        msds_id: msdsItem.id,
        protective_equipment_id: String(equipmentId), // 숫자를 문자열로 변환
      }))
      const { error: peError } = await supabase.from("msds_protective_equipment").insert(protectiveEquipmentInserts)
      if (peError) console.error("[v0] Protective equipment insert error:", peError)
    }

    const configInserts: { msds_id: number; config_type: string; config_value: string }[] = []

    if (body.reception?.length > 0) {
      body.reception.forEach((value: string) => {
        configInserts.push({ msds_id: msdsItem.id, config_type: "reception", config_value: value })
      })
    }

    if (body.laws?.length > 0) {
      body.laws.forEach((value: string) => {
        configInserts.push({ msds_id: msdsItem.id, config_type: "laws", config_value: value })
      })
    }

    if (configInserts.length > 0) {
      await supabase.from("msds_config_items").insert(configInserts)
    }

    return NextResponse.json({ success: true, data: msdsItem })
  } catch (error) {
    console.error("Error creating MSDS item:", error)
    return NextResponse.json({ error: "Failed to create MSDS item" }, { status: 500 })
  }
}
