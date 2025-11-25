import { createClient } from "@supabase/supabase-js"

async function checkDatabaseData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ 환경 변수가 설정되지 않았습니다.")
    console.error("   필요한 환경 변수:")
    console.error("   - NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_URL")
    console.error("   - SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  console.log("🔗 Supabase 연결 중...")
  console.log(`   URL: ${supabaseUrl.substring(0, 30)}...`)

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  console.log("\n📊 데이터베이스 테이블 데이터 확인\n")
  console.log("=".repeat(60))

  // 1. msds_items 테이블
  console.log("\n📋 msds_items (MSDS 항목)")
  const { data: msdsItems, error: msdsError } = await supabase
    .from("msds_items")
    .select("*")
    .order("id", { ascending: true })

  if (msdsError) {
    console.error(`   ❌ 에러: ${msdsError.message}`)
  } else {
    console.log(`   총 ${msdsItems?.length || 0}개 항목`)
    if (msdsItems && msdsItems.length > 0) {
      msdsItems.forEach((item) => {
        console.log(`   - [ID: ${item.id}] ${item.name} (용도: ${item.usage || "미지정"})`)
      })
    }
  }

  // 2. warning_symbols 테이블
  console.log("\n⚠️  warning_symbols (경고 표지)")
  const { data: warningSymbols, error: wsError } = await supabase
    .from("warning_symbols")
    .select("*")
    .order("id", { ascending: true })

  if (wsError) {
    console.error(`   ❌ 에러: ${wsError.message}`)
  } else {
    console.log(`   총 ${warningSymbols?.length || 0}개 항목`)
    if (warningSymbols && warningSymbols.length > 0) {
      warningSymbols.forEach((item) => {
        console.log(`   - [ID: ${item.id}] ${item.name} (카테고리: ${item.category})`)
      })
    }
  }

  // 3. protective_equipment 테이블
  console.log("\n🦺 protective_equipment (보호 장구)")
  const { data: protectiveEquipment, error: peError } = await supabase
    .from("protective_equipment")
    .select("*")
    .order("id", { ascending: true })

  if (peError) {
    console.error(`   ❌ 에러: ${peError.message}`)
  } else {
    console.log(`   총 ${protectiveEquipment?.length || 0}개 항목`)
    if (protectiveEquipment && protectiveEquipment.length > 0) {
      protectiveEquipment.forEach((item) => {
        console.log(`   - [ID: ${item.id}] ${item.name} (카테고리: ${item.category})`)
      })
    }
  }

  // 4. config_options 테이블
  console.log("\n⚙️  config_options (설정 옵션)")
  const { data: configOptions, error: coError } = await supabase
    .from("config_options")
    .select("*")
    .order("type", { ascending: true })
    .order("id", { ascending: true })

  if (coError) {
    console.error(`   ❌ 에러: ${coError.message}`)
  } else {
    console.log(`   총 ${configOptions?.length || 0}개 항목`)
    if (configOptions && configOptions.length > 0) {
      const grouped: Record<string, typeof configOptions> = {}
      configOptions.forEach((item) => {
        if (!grouped[item.type]) grouped[item.type] = []
        grouped[item.type].push(item)
      })
      Object.entries(grouped).forEach(([type, items]) => {
        console.log(`   [${type}] - ${items.length}개`)
        items.forEach((item) => {
          console.log(`      - [ID: ${item.id}] ${item.label} (value: ${item.value})`)
        })
      })
    }
  }

  // 5. msds_warning_symbols 연결 테이블
  console.log("\n🔗 msds_warning_symbols (MSDS-경고표지 연결)")
  const { data: msdsWs, error: mwsError } = await supabase
    .from("msds_warning_symbols")
    .select("*")

  if (mwsError) {
    console.error(`   ❌ 에러: ${mwsError.message}`)
  } else {
    console.log(`   총 ${msdsWs?.length || 0}개 연결`)
  }

  // 6. msds_protective_equipment 연결 테이블
  console.log("\n🔗 msds_protective_equipment (MSDS-보호장구 연결)")
  const { data: msdsPe, error: mpeError } = await supabase
    .from("msds_protective_equipment")
    .select("*")

  if (mpeError) {
    console.error(`   ❌ 에러: ${mpeError.message}`)
  } else {
    console.log(`   총 ${msdsPe?.length || 0}개 연결`)
  }

  // 7. msds_config_items 연결 테이블
  console.log("\n🔗 msds_config_items (MSDS-설정항목 연결)")
  const { data: msdsConfig, error: mcError } = await supabase
    .from("msds_config_items")
    .select("*")

  if (mcError) {
    console.error(`   ❌ 에러: ${mcError.message}`)
  } else {
    console.log(`   총 ${msdsConfig?.length || 0}개 연결`)
  }

  console.log("\n" + "=".repeat(60))
  console.log("✅ 데이터베이스 확인 완료!")
}

checkDatabaseData().catch(console.error)
