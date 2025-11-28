import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { msdsData } = body

    if (!msdsData) {
      return NextResponse.json({ error: "MSDS data required" }, { status: 400 })
    }

    // Extract relevant information for management guidelines
    const guidelines = {
      productName: msdsData.name || "",
      pictograms: msdsData.warningSymbols || [],
      signalWord: determineSignalWord(msdsData),
      hazardsRisks: extractHazardsRisks(msdsData),
      handlingPrecautions: generateHandlingPrecautions(msdsData),
      protectiveEquipment: extractProtectiveEquipment(msdsData),
      emergencyProcedures: generateEmergencyProcedures(msdsData),
      accidentResponse: generateAccidentResponse(msdsData),
    }

    return NextResponse.json({ guidelines })
  } catch (error) {
    console.error("Management guidelines generation error:", error)
    return NextResponse.json({ error: "Failed to generate management guidelines" }, { status: 500 })
  }
}

function determineSignalWord(msdsData: any): string {
  const hazards = msdsData.hazards || []
  const hasHighHazard = hazards.some((h: string) => ["toxic", "flammable", "corrosive"].includes(h))
  return hasHighHazard ? "위험" : "경고"
}

function extractHazardsRisks(msdsData: any): string[] {
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

function generateHandlingPrecautions(msdsData: any): string[] {
  return [
    "가. 압력을 가하거나, 자르거나, 용접, 납땜, 접합, 뚫기, 연마 또는 열에 폭로하지 마시오",
    "나. 용기가 비워진 후에도 제품 찌꺼기가 남아있을 수 있으므로 모든 MSDS/라벨 예방조치를 따르시오",
    "다. 장기간 또는 지속적인 피부 접촉을 막으시오",
    "라. 가열된 물질에서 발생하는 증기를 호흡하지 마시오",
    "마. 물질 취급 시 모든 장비를 반드시 접지하시오",
    "바. 취급 후에는 취급 부위를 철저히 씻으시오",
    "사. 옥외 또는 환기가 잘 되는 곳에서만 취급하시오",
    "아. 열·스파크·화염·고열로부터 멀리하시오 – 금연",
    "자. 용기는 환기가 잘 되는 곳에 단단히 밀폐하여 저장하시오",
  ]
}

function extractProtectiveEquipment(msdsData: any): string[] {
  const equipment: string[] = []
  const hazards = msdsData.hazards || []

  if (hazards.includes("toxic") || hazards.includes("corrosive")) {
    equipment.push("호흡용 보호구(방독마스크 등)")
  }
  equipment.push("보안경/보안면")
  equipment.push("보호장갑")
  equipment.push("보호복")

  return equipment
}

function generateEmergencyProcedures(msdsData: any): any {
  return {
    eyes: [
      "물질과 접촉 시 즉시 20분 이상 흐르는 물에 눈을 씻어내시오",
      "눈에 자극이 지속되면 의학적인 조치·조언을 구하시오",
    ],
    skin: [
      "물질과 접촉 시 즉시 20분 이상 흐르는 물에 피부를 씻어내시오",
      "화상의 경우 즉시 찬물로 가능한 오래 해당 부위를 식히고, 피부에 들러붙은 옷은 제거하지 마시오",
      "피부 자극이 생기면 의학적인 조치·조언을 구하시오",
      "오염된 모든 의복은 즉시 벗고 다시 사용 전 세척하시오",
    ],
    inhalation: [
      "물질을 흡입하였을 경우 구강 대 구강법으로 인공호흡을 하지 말고 적절한 호흡 의료 장비를 이용하시오",
      "호흡이 힘들 경우 산소를 공급하시오",
      "흡입하면 신선한 공기가 있는 곳으로 옮기고 호흡하기 쉬운 자세로 안정을 취하시오",
      "노출되거나 노출이 우려되면 의학적인 조치·조언을 구하시오",
    ],
    ingestion: [
      "물질을 먹었을 경우 구강 대 구강법으로 인공호흡을 하지 말고 적절한 호흡 의료 장비를 이용하시오",
      "삼켰다면 즉시 의료기관(의사)의 진찰을 받으시오",
      "삼켰다면 입을 씻어내시오. 토하게 하려 하지 마시오",
    ],
  }
}

function generateAccidentResponse(msdsData: any): any {
  return {
    fire: [
      "적절한 소화제: 알코올 포말, 이산화탄소, 물 분무 (직사 주수는 피하시오)",
      "질식 소화 시 건조한 모래 또는 흙을 사용할 것",
      "화재 진압 시 방화복, 소방용 구조 헬멧, 소방용 안전화, 소방용 안전장갑, 공기호흡기를 착용하시오",
    ],
    spill: [
      "엎질러진 것을 즉시 닦아내고, 보호구 항의 예방조치를 따르시오",
      "다량 누출 시 수로, 하수구, 지하실, 밀폐 공간으로의 유입을 방지하시오",
      "불활성 물질로 엎지른 것을 흡수하고, 화학 폐기물 용기에 넣으시오",
    ],
  }
}
