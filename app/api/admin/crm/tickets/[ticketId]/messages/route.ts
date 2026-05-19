import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

type Params = { params: Promise<{ ticketId: string }> }

async function assertAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin"
  return { session, isAdmin }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const { session, isAdmin } = await assertAdmin(request)
    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params
    const body = await request.json()
    const message = String(body?.message || "").trim()
    const attachments = Array.isArray(body?.attachments) ? body.attachments : []
    const messageType = String(body?.messageType || (attachments.length ? "image" : "text"))
    const attachmentUrl = body?.attachmentUrl || null
    const attachmentName = body?.attachmentName || null
    const attachmentMimeType = body?.attachmentMimeType || null
    const attachmentSize = body?.attachmentSize || null
    const isInternal = body?.isInternal === true

    if (!message && !attachments.length && !attachmentUrl) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 })
    }

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("support_tickets")
      .select("id, user_id, status")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const { data: created, error: createError } = await supabaseAdmin
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        sender_id: session.user.id,
        message: message || "[attachment]",
        attachments,
        message_type: messageType,
        attachment_url: attachmentUrl,
        attachment_name: attachmentName,
        attachment_mime_type: attachmentMimeType,
        attachment_size: attachmentSize,
        is_internal: isInternal,
      })
      .select(
        `
          id,
          ticket_id,
          sender_id,
          message,
          attachments,
          created_at,
          message_type,
          attachment_url,
          attachment_name,
          attachment_mime_type,
          attachment_size,
          is_internal,
          users:sender_id (
            id,
            first_name,
            last_name,
            role,
            profile_picture_url
          )
        `
      )
      .single()

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    const now = new Date().toISOString()
    await supabaseAdmin
      .from("support_tickets")
      .update({
        last_message_at: now,
        updated_at: now,
        admin_last_read_at: now,
        status: ticket.status === "open" ? "in_progress" : ticket.status,
      })
      .eq("id", ticketId)

    return NextResponse.json({ message: created }, { status: 201 })
  } catch (error) {
    console.error("[CRM][MESSAGES][POST]", error)
    return NextResponse.json({ error: "Failed to create CRM message" }, { status: 500 })
  }
}