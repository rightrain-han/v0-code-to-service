import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const category = (formData.get("category") as string) || "general"

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 })
    }

    // 파일 유효성 검사
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WebP, SVG)" },
        { status: 400 },
      )
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "파일 크기는 5MB 이하여야 합니다" }, { status: 400 })
    }

    // 파일명 생성
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
    const filePath = `images/${category}/${timestamp}_${safeName}`

    // Vercel Blob에 업로드
    const blob = await put(filePath, file, {
      access: "public",
    })

    return NextResponse.json({
      success: true,
      fileUrl: blob.url,
      filePath: filePath,
      fileName: file.name,
    })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: `이미지 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 },
    )
  }
}
