import { createClient } from "@supabase/supabase-js"

async function checkImageUrls() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("환경 변수가 필요합니다")
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  console.log("\n🖼️  이미지 URL 확인\n")
  console.log("=".repeat(60))

  // warning_symbols 이미지 URL 확인
  console.log("\n⚠️  warning_symbols (경고 표지) 이미지:")
  const { data: warningSymbols, error: wsError } = await supabase
    .from("warning_symbols")
    .select("id, name, image_url")

  if (wsError) {
    console.error(`   ❌ 에러: ${wsError.message}`)
  } else if (warningSymbols) {
    warningSymbols.forEach(item => {
      console.log(`   [${item.id}] ${item.name}`)
      console.log(`       URL: ${item.image_url || "(없음)"}`)
    })
  }

  // protective_equipment 이미지 URL 확인
  console.log("\n🦺 protective_equipment (보호 장구) 이미지:")
  const { data: protectiveEquipment, error: peError } = await supabase
    .from("protective_equipment")
    .select("id, name, image_url")

  if (peError) {
    console.error(`   ❌ 에러: ${peError.message}`)
  } else if (protectiveEquipment) {
    protectiveEquipment.forEach(item => {
      console.log(`   [${item.id}] ${item.name}`)
      console.log(`       URL: ${item.image_url || "(없음)"}`)
    })
  }

  console.log("\n" + "=".repeat(60))
}

checkImageUrls()
