import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] PDF upload API called")
    const formData = await request.formData()
    const file = formData.get("file") as File
    const msdsId = formData.get("msdsId") as string
    const msdsName = formData.get("msdsName") as string
    const type = (formData.get("type") as string) || "msds"

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 })
    }

    if (!msdsId) {
      return NextResponse.json({ error: "MSDS ID가 없습니다" }, { status: 400 })
    }

    const fileType = file.type || ""
    const fileName = file.name || ""

    if (!fileType.includes("pdf") && !fileName.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "PDF 파일만 업로드 가능합니다" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 50MB 이하여야 합니다" }, { status: 400 })
    }

    const supabase = createAdminClient()
    if (!supabase) {
      throw new Error("Supabase 클라이언트 생성 실패")
    }

    const arrayBuffer = await file.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: "application/pdf" })

    const timestamp = Date.now()
    const safeFileName = file.name
      .replace(/[가-힣ㄱ-ㅎㅏ-ㅣ]/g, "")
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "")

    let folderPath = "pdfs"
    if (type === "warning") {
      folderPath = "warning-pdfs"
    } else if (type === "management") {
      folderPath = "management-pdfs"
    }

    const filePath = `${folderPath}/${timestamp}_${msdsId}_${safeFileName || "document.pdf"}`

    console.log("[v0] Uploading to Supabase Storage:", filePath)

    const { data: uploadData, error: uploadError } = await supabase.storage.from("msds").upload(filePath, blob, {
      contentType: "application/pdf",
      upsert: true,
    })

    if (uploadError) {
      console.error("[v0] Supabase upload error:", uploadError)
      throw uploadError
    }

    const { data: urlData } = supabase.storage.from("msds").getPublicUrl(filePath)
    const publicUrl = urlData.publicUrl

    console.log("[v0] PDF uploaded successfully:", publicUrl)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (type === "warning") {
      updateData.warning_label_pdf = publicUrl
    } else if (type === "management") {
      updateData.management_guidelines_pdf = publicUrl
    } else {
      updateData.pdf_file_name = filePath
      updateData.pdf_file_url = publicUrl
    }

    const { error: updateError } = await supabase
      .from("msds_items")
      .update(updateData)
      .eq("id", Number.parseInt(msdsId))

    if (updateError) {
      console.error("[v0] DB update error:", updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: filePath,
    })
  } catch (error) {
    console.error("[v0] PDF upload error:", error)
    return NextResponse.json(
      { error: `PDF 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 },
    )
  }
}
