import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireCrmAccess } from "@/lib/admin-access"
import { notifyAdmins } from "@/lib/admin-notifications"
import { processOutboundQueue } from "@/lib/crm-email-service"

type Params = { params: Promise<{ ticketId: string }> }

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function renderSupportReplyEmail({
  customerName,
  ticketId,
  subject,
  message,
}: {
  customerName?: string | null
  ticketId: string
  subject?: string | null
  message: string
}) {
  const logoUrl = "https://admin.charterkeke.com/charter%20keke.png"
  const safeName = escapeHtml(customerName || "there")
  const safeSubject = escapeHtml(subject || "Support Request")
  const safeMessage = escapeHtml(message).replace(/\n/g, "<br />")
  return `
    <div style="margin:0;padding:0;background:#f6f2ec;font-family:Arial,Helvetica,sans-serif;color:#171717">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f2ec;padding:28px 12px">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border:1px solid #f0dec8;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px rgba(24,24,27,.08)">
              <tr>
                <td style="background:#111111;padding:24px 28px;color:#ffffff">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td width="62" style="vertical-align:middle">
                        <img src="${logoUrl}" width="54" height="54" alt="Charter Keke" style="display:block;border-radius:14px;border:1px solid rgba(255,138,0,.45)" />
                      </td>
                      <td style="vertical-align:middle;padding-left:14px">
                        <div style="font-size:12px;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:#ff8a00">Charter Keke Support</div>
                        <div style="font-size:24px;line-height:1.25;font-weight:900;margin-top:4px">We replied to your ticket</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 28px">
                  <p style="margin:0 0 16px;font-size:16px;line-height:1.65;color:#333333">Hello ${safeName},</p>
                  <p style="margin:0 0 22px;font-size:16px;line-height:1.65;color:#333333">Our support team has replied to your request.</p>
                  <div style="border:1px solid #f0dec8;border-radius:18px;overflow:hidden;margin-bottom:22px">
                    <div style="background:#fff5e8;padding:14px 18px;border-bottom:1px solid #f0dec8">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#9a5a00;font-weight:800">Ticket</div>
                      <div style="font-size:16px;font-weight:800;color:#171717;margin-top:4px">${safeSubject}</div>
                      <div style="font-size:12px;color:#6b7280;margin-top:3px">Reference: ${escapeHtml(ticketId)}</div>
                    </div>
                    <div style="padding:18px;background:#ffffff">
                      <div style="font-size:12px;text-transform:uppercase;letter-spacing:.12em;color:#6b7280;font-weight:800;margin-bottom:10px">Admin reply</div>
                      <div style="font-size:15px;line-height:1.7;color:#222222">${safeMessage || "Please check your support thread for the latest update."}</div>
                    </div>
                  </div>
                  <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280">You can reply to this email to continue the conversation. If your request was opened in the mobile app, the latest update will also appear in your support screen.</p>
                </td>
              </tr>
              <tr>
                <td style="background:#ff8a00;padding:16px 28px;color:#111111;font-size:13px;font-weight:700">
                  Charter Keke - Affordable Keke rides in Lagos
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `
}

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

    await supabaseAdmin.from("audit_logs").insert({
      user_id: session.user.id,
      action: isInternal ? "CRM internal message added" : "CRM customer reply sent",
      entity_type: "ticket_message",
      entity_id: created.id,
      changes: {
        ticketId,
        isInternal,
        messageType,
        summary: (message || "[attachment]").slice(0, 180),
      },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
    })

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
        body_html: renderSupportReplyEmail({
          customerName: ticket.source_name,
          ticketId,
          subject: ticket.subject,
          message: message || "Please check your support thread for the latest update.",
        }),
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

      processOutboundQueue(10).catch((error) => {
        console.error("[CRM][MESSAGES][POST] outbound delivery failed", error)
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
