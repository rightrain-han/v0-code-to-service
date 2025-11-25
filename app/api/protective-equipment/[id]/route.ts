import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-admin"

// PUT - 보호 장구 수정
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("protective_equipment")
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
      console.error("Error updating protective equipment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in PUT /api/protective-equipment/[id]:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}

// DELETE - 보호 장구 삭제
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = createAdminClient()

    // 먼저 연결된 msds_protective_equipment 삭제
    await supabase.from("msds_protective_equipment").delete().eq("protective_equipment_id", id)

    // 보호 장구 삭제
    const { error } = await supabase.from("protective_equipment").delete().eq("id", id)

    if (error) {
      console.error("Error deleting protective equipment:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/protective-equipment/[id]:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 })
  }
}
