import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const msdsId = formData.get("msdsId") as string
    const msdsName = formData.get("msdsName") as string

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!msdsId) {
      return NextResponse.json({ error: "MSDS ID required" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const fileName = `management_guidelines_${msdsName || msdsId}_${Date.now()}.pdf`
    const blob = await put(fileName, file, {
      access: "public",
    })

    // Update database
    const supabase = createAdminClient()
    if (supabase) {
      const { error } = await supabase
        .from("msds_items")
        .update({
          management_guidelines_pdf_url: blob.url,
          management_guidelines_pdf_name: fileName,
        })
        .eq("id", msdsId)

      if (error) {
        console.error("Database update error:", error)
        return NextResponse.json({ error: "Failed to update database" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      url: blob.url,
      fileName,
    })
  } catch (error) {
    console.error("Management guidelines upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
