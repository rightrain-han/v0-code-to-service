import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createAdminClient } from "@/lib/supabase-admin"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const msdsId = formData.get("msdsId") as string

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 })
    }

    if (!msdsId) {
      return NextResponse.json({ error: "MSDS ID가 없습니다" }, { status: 400 })
    }

    // PDF 파일 검증
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "PDF 파일만 업로드 가능합니다" }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 50MB 이하여야 합니다" }, { status: 400 })
    }

    // 파일명 생성
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `pdfs/${timestamp}_${safeName}`

    // Vercel Blob에 업로드
    const blob = await put(filePath, file, {
      access: "public",
    })

    // DB 업데이트
    const supabase = createAdminClient()
    const { error: updateError } = await supabase
      .from("msds_items")
      .update({
        pdf_file_name: file.name,
        pdf_file_url: blob.url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", Number.parseInt(msdsId))

    if (updateError) {
      console.error("DB update error:", updateError)
      // DB 업데이트 실패해도 파일 업로드는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      fileUrl: blob.url,
      fileName: file.name,
      filePath: filePath,
    })
  } catch (error) {
    console.error("PDF upload error:", error)
    return NextResponse.json(
      { error: `PDF 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 },
    )
  }
}
