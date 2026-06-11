import { NextRequest, NextResponse } from "next/server"
import { requireCrmAccess } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"
import { notifyAdmins } from "@/lib/admin-notifications"

type Params = { params: Promise<{ ticketId: string }> }

export async function POST(request: NextRequest, { params }: Params) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    const session = access.session
    if (!access.authorized || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params
    const body = await request.json()
    const note = String(body?.note || "").trim()
    const visibility = String(body?.visibility || "internal")
    const mentions = Array.isArray(body?.mentions) ? body.mentions : []
    const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : {}
    const departmentId = body?.departmentId || null

    if (!note) {
      return NextResponse.json({ error: "note is required" }, { status: 400 })
    }

    const { data: adminRecord, error: adminError } = await supabaseAdmin
      .from("admins")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (adminError || !adminRecord) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 404 })
    }

    const { data, error } = await supabaseAdmin
      .from("crm_internal_notes")
      .insert({
        ticket_id: ticketId,
        author_admin_id: adminRecord.id,
        department_id: departmentId,
        note,
        visibility,
        mentions,
        metadata,
      })
      .select(
        `
          id,
          ticket_id,
          author_admin_id,
          department_id,
          note,
          visibility,
          mentions,
          metadata,
          created_at,
          updated_at
        `
      )
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: session.user.id,
      action: "CRM internal note added",
      entity_type: "crm_internal_note",
      entity_id: data.id,
      changes: {
        ticketId,
        visibility,
        departmentId,
        summary: note.slice(0, 180),
      },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
    })

    await notifyAdmins({
      allAdmins: true,
      title: "New CRM internal note",
      body: note.slice(0, 180),
      type: "crm_internal_note",
      actionUrl: `/admin/crm?ticket=${ticketId}`,
      metadata: { ticketId, noteId: data.id, visibility, mentions },
      sourceEventId: `crm_internal_note:${data.id}`,
    }).catch((error) => console.error("[CRM][NOTES][NOTIFY]", error))

    return NextResponse.json({ note: data }, { status: 201 })
  } catch (error) {
    console.error("[CRM][NOTES][POST]", error)
    return NextResponse.json({ error: "Failed to create CRM note" }, { status: 500 })
  }
}
