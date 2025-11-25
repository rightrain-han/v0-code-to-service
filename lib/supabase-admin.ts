import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.log("[v0] Environment check:")
  console.log("[v0] - NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "NOT SET")
  console.log("[v0] - SUPABASE_URL:", process.env.SUPABASE_URL ? "SET" : "NOT SET")
  console.log(
    "[v0] - SUPABASE_SERVICE_ROLE_KEY:",
    supabaseServiceKey ? "SET (length: " + supabaseServiceKey.length + ")" : "NOT SET",
  )

  if (!supabaseUrl) {
    console.log("[v0] No Supabase URL found")
    return null
  }

  if (!supabaseServiceKey) {
    console.log("[v0] No Service Role Key found")
    return null
  }

  // URL 정규화 - 끝에 슬래시 제거
  const normalizedUrl = supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl

  console.log("[v0] Creating Supabase admin client for:", normalizedUrl)

  try {
    const client = createClient(normalizedUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
    console.log("[v0] Supabase client created successfully")
    return client
  } catch (error) {
    console.log("[v0] Error creating Supabase client:", error)
    return null
  }
}
