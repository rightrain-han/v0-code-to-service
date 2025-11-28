import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { msdsData } = body

    if (!msdsData) {
      return NextResponse.json({ error: "MSDS data required" }, { status: 400 })
    }

    // Extract relevant information from MSDS for warning label
    const warningLabel = {
      productName: msdsData.name || "",
      pictograms: msdsData.warningSymbols || [],
      signalWord: determineSignalWord(msdsData),
      hazardStatements: extractHazardStatements(msdsData),
      precautionaryStatements: extractPrecautionaryStatements(msdsData),
      supplierInfo: {
        company: "회사명",
        contact: "연락처",
      },
    }

    return NextResponse.json({ warningLabel })
  } catch (error) {
    console.error("Warning label generation error:", error)
    return NextResponse.json({ error: "Failed to generate warning label" }, { status: 500 })
  }
}

function determineSignalWord(msdsData: any): string {
  // Determine signal word based on hazards
  const hazards = msdsData.hazards || []
  const hasHighHazard = hazards.some((h: string) => ["toxic", "flammable", "corrosive"].includes(h))
  return hasHighHazard ? "위험" : "경고"
}

function extractHazardStatements(msdsData: any): string[] {
  // Generate hazard statements based on MSDS data
  const statements: string[] = []
  const hazards = msdsData.hazards || []

  if (hazards.includes("flammable")) {
    statements.push("H226 인화성 액체 및 증기")
  }
  if (hazards.includes("toxic")) {
    statements.push("H301 삼키면 유독함")
    statements.push("H331 흡입하면 유독함")
  }
  if (hazards.includes("corrosive")) {
    statements.push("H314 피부에 심한 화상과 눈 손상을 일으킴")
  }

  return statements
}

function extractPrecautionaryStatements(msdsData: any): string[] {
  // Generate precautionary statements
  return [
    "P201 사용 전 취급 설명서를 확보하시오",
    "P280 보호장갑/보호의/보안경/안면보호구를 착용하시오",
    "P301+P310 삼켰다면 즉시 의료기관의 진찰을 받으시오",
    "P305+P351+P338 눈에 묻으면 몇 분간 물로 조심해서 씻으시오",
  ]
}
