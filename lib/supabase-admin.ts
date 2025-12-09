import { createClient } from "@supabase/supabase-js"

export function createAdminClient() {
  console.log("[v0] Creating Supabase admin client...")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.error("[v0] SUPABASE_URL is missing")
    throw new Error("SUPABASE_URL environment variable is not set")
  }

  if (!supabaseServiceKey) {
    console.error("[v0] SUPABASE_SERVICE_ROLE_KEY is missing")
    throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is not set")
  }

  // URL 정규화 - 끝에 슬래시 제거
  const normalizedUrl = supabaseUrl.endsWith("/") ? supabaseUrl.slice(0, -1) : supabaseUrl

  console.log("[v0] Supabase URL:", normalizedUrl)

  try {
    const client = createClient(normalizedUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[v0] Supabase admin client created successfully")
    return client
  } catch (error) {
    console.error("[v0] Error creating Supabase client:", error)
    throw error
  }
}
