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
  },
]

export async function GET() {
  try {
    const supabase = createAdminClient()

    if (!supabase) {
      return NextResponse.json(SAMPLE_DATA)
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
      return NextResponse.json(SAMPLE_DATA)
    }

    if (!msdsItems || msdsItems.length === 0) {
      return NextResponse.json(SAMPLE_DATA)
    }

    // 경고 표지 및 보호 장비 데이터 조회
    const [warningSymbolsResponse, protectiveEquipmentResponse] = await Promise.all([
      supabase.from("warning_symbols").select("*"),
      supabase.from("protective_equipment").select("*"),
    ])

    const warningSymbols = warningSymbolsResponse.data || []
    const protectiveEquipment = protectiveEquipmentResponse.data || []

    // 데이터 변환
    const enrichedItems = msdsItems.map((item) => {
      const warningSymbolIds =
        item.msds_warning_symbols?.map((ws: { warning_symbol_id: string }) => ws.warning_symbol_id) || []
      const protectiveEquipmentIds =
        item.msds_protective_equipment?.map((pe: { protective_equipment_id: string }) => pe.protective_equipment_id) ||
        []

      const configItems = item.msds_config_items || []
      const reception = configItems
        .filter((c: { config_type: string }) => c.config_type === "reception")
        .map((c: { config_value: string }) => c.config_value)
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
        hazards: protectiveEquipmentIds,
        usage: item.usage || "",
        reception,
        laws,
        warningSymbols: warningSymbolIds,
        warningSymbolsData,
        protectiveEquipmentData,
        qrCode: item.qr_code || "",
      }
    })

    return NextResponse.json(enrichedItems)
  } catch (err) {
    return NextResponse.json(SAMPLE_DATA)
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
      })
      .select()
      .single()

    if (msdsError) throw msdsError

    if (body.warningSymbols?.length > 0) {
      const warningSymbolInserts = body.warningSymbols.map((symbolId: string) => ({
        msds_id: msdsItem.id,
        warning_symbol_id: symbolId,
      }))
      await supabase.from("msds_warning_symbols").insert(warningSymbolInserts)
    }

    if (body.hazards?.length > 0) {
      const protectiveEquipmentInserts = body.hazards.map((equipmentId: string) => ({
        msds_id: msdsItem.id,
        protective_equipment_id: equipmentId,
      }))
      await supabase.from("msds_protective_equipment").insert(protectiveEquipmentInserts)
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
