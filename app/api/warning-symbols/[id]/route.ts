import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

// PUT - 경고 표지 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("warning_symbols")
      .update({
        name: body.name,
        description: body.description,
        image_url: body.imageUrl,
        category: body.category,
        is_active: body.isActive ?? true,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating warning symbol:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/warning-symbols/[id]:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// DELETE - 경고 표지 삭제
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = createAdminClient()

    // 먼저 연결된 msds_warning_symbols 삭제
    await supabase.from("msds_warning_symbols").delete().eq("warning_symbol_id", id)

    // 경고 표지 삭제
    const { error } = await supabase.from("warning_symbols").delete().eq("id", id)

    if (error) {
      console.error("Error deleting warning symbol:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/warning-symbols/[id]:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
