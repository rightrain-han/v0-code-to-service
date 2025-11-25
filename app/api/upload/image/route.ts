import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    let formData: FormData
    try {
      formData = await request.formData()
    } catch (formError) {
      console.error("[v0] FormData parsing error:", formError)
      return NextResponse.json({ error: "폼 데이터를 파싱할 수 없습니다" }, { status: 400 })
    }

    const file = formData.get("file") as File | null
    const itemType = (formData.get("itemType") as string) || "ghs"

    if (!file) {
      return NextResponse.json({ error: "파일이 없습니다" }, { status: 400 })
    }

    console.log("[v0] Uploading file:", file.name, "type:", file.type, "size:", file.size)

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

    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] Missing Supabase credentials")
      return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 })
    }

    // 파일명 생성
    const timestamp = Date.now()
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const folder = itemType === "prgear" ? "prgear" : "ghs"
    const filePath = `${folder}/${timestamp}_${safeName}`

    console.log("[v0] Upload path:", filePath)

    const arrayBuffer = await file.arrayBuffer()

    const uploadUrl = `${supabaseUrl}/storage/v1/object/msds/${filePath}`

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": file.type,
        "x-upsert": "true",
      },
      body: arrayBuffer,
    })

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text()
      console.error("[v0] Supabase storage error:", errorText)
      return NextResponse.json({ error: `업로드 실패: ${errorText}` }, { status: 500 })
    }

    const uploadData = await uploadResponse.json()
    console.log("[v0] Upload success:", uploadData)

    // 공개 URL 생성
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/msds/${filePath}`

    console.log("[v0] Public URL:", publicUrl)

    return NextResponse.json({
      success: true,
      fileUrl: publicUrl,
      filePath: filePath,
      fileName: file.name,
    })
  } catch (error) {
    console.error("[v0] Image upload error:", error)
    return NextResponse.json(
      { error: `이미지 업로드 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 },
    )
  }
}

// 이미지 삭제 API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get("filePath")

    if (!filePath) {
      return NextResponse.json({ error: "파일 경로가 없습니다" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "서버 설정 오류" }, { status: 500 })
    }

    const deleteUrl = `${supabaseUrl}/storage/v1/object/msds/${filePath}`

    const deleteResponse = await fetch(deleteUrl, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    })

    if (!deleteResponse.ok) {
      const errorText = await deleteResponse.text()
      console.error("[v0] Supabase delete error:", errorText)
      return NextResponse.json({ error: `삭제 실패: ${errorText}` }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Image delete error:", error)
    return NextResponse.json(
      { error: `이미지 삭제 실패: ${error instanceof Error ? error.message : "알 수 없는 오류"}` },
      { status: 500 },
    )
  }
}
