import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireCrmAccess } from "@/lib/admin-access"
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
      .select("id, user_id, status, source_channel, source_email, source_name, subject, external_thread_id, department_id")
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

    if (!isInternal && ticket.source_channel === "email" && ticket.source_email) {
      await supabaseAdmin.from("crm_email_messages").insert({
        email_account_id: null,
        ticket_id: ticketId,
        direction: "outbound",
        from_email: "support@charterkeke.com",
        from_name: "Charter Keke Support",
        to_emails: [ticket.source_email],
        cc_emails: [],
        bcc_emails: [],
        subject: ticket.subject?.startsWith("Re:") ? ticket.subject : `Re: ${ticket.subject || "Support Request"}`,
        body_text: message,
        body_html: null,
        attachments,
        external_message_id: null,
        external_thread_id: ticket.external_thread_id,
        processing_status: "queued",
        processing_reason: "Queued admin CRM reply for SMTP delivery",
        raw_headers: {},
        raw_payload: { createdByAdminId: session.user.id },
        received_at: now,
        processed_at: null,
      })
    }

    if (isInternal) {
      await notifyAdmins({
        userIds: [session.user.id],
        title: "New internal CRM note",
        body: message.slice(0, 140) || "A CRM internal message was added.",
        type: "crm_internal_message",
        actionUrl: `/admin/crm?ticket=${ticketId}`,
        metadata: { ticketId, departmentId: ticket.department_id },
      })
    }

    return NextResponse.json({ message: created }, { status: 201 })
  } catch (error) {
    console.error("[CRM][MESSAGES][POST]", error)
    return NextResponse.json({ error: "Failed to create CRM message" }, { status: 500 })
  }
}
