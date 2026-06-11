import { NextRequest, NextResponse } from "next/server"
import { requireCrmAccess } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"
import { notifyAdmins } from "@/lib/admin-notifications"

type Params = { params: Promise<{ ticketId: string }> }

export async function GET(request: NextRequest, { params }: Params) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params

    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from("support_tickets")
      .select(
        `
          id,
          user_id,
          subject,
          description,
          category,
          priority,
          status,
          assigned_to,
          department_id,
          source_channel,
          source_email,
          source_name,
          external_thread_id,
          external_message_id,
          routing_reason,
          routing_confidence,
          crm_metadata,
          created_at,
          updated_at,
          resolved_at,
          resolution_note,
          resolution_requested_at,
          resolution_confirmed_at,
          user_last_read_at,
          admin_last_read_at,
          last_message_at,
          closed_by_user,
          metadata,
          users:user_id (
            id,
            first_name,
            last_name,
            email,
            role,
            profile_picture_url
          ),
          admins:assigned_to (
            id,
            user_id,
            department,
            crm_enabled,
            users:user_id (
              id,
              first_name,
              last_name,
              email,
              role,
              profile_picture_url
            )
          ),
          departments:department_id (
            id,
            department_key,
            department_name,
            email_alias
          )
        `
      )
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const [messagesResult, notesResult, emailMessagesResult] = await Promise.all([
      supabaseAdmin
        .from("ticket_messages")
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
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("crm_internal_notes")
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
            updated_at,
            admins:author_admin_id (
              id,
              user_id,
              department,
              users:user_id (
                id,
                first_name,
                last_name,
                email,
                role,
                profile_picture_url
              )
            ),
            departments:department_id (
              id,
              department_key,
              department_name
            )
          `
        )
        .eq("ticket_id", ticketId)
        .order("created_at", { ascending: true }),
      supabaseAdmin
        .from("crm_email_messages")
        .select(
          `
            id,
            email_account_id,
            ticket_id,
            direction,
            from_email,
            from_name,
            to_emails,
            cc_emails,
            bcc_emails,
            subject,
            body_text,
            body_html,
            attachments,
            external_message_id,
            external_thread_id,
            processing_status,
            processing_reason,
            raw_headers,
            raw_payload,
            received_at,
            processed_at,
            created_at,
            updated_at
          `
        )
        .eq("ticket_id", ticketId)
        .order("received_at", { ascending: true }),
    ])

    return NextResponse.json({
      ticket,
      messages: messagesResult.data || [],
      notes: notesResult.data || [],
      emailMessages: emailMessagesResult.data || [],
    })
  } catch (error) {
    console.error("[CRM][TICKET][GET]", error)
    return NextResponse.json({ error: "Failed to fetch CRM ticket" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { ticketId } = await params
    const body = await request.json()

    const updates: Record<string, unknown> = {}

    const { data: beforeTicket } = await supabaseAdmin
      .from("support_tickets")
      .select("id, status, priority, assigned_to, department_id, resolution_note, routing_reason, routing_confidence, crm_metadata")
      .eq("id", ticketId)
      .maybeSingle()

    if (typeof body?.status === "string") updates.status = body.status
    if (typeof body?.priority === "string") updates.priority = body.priority
    if (typeof body?.assignedTo === "string" || body?.assignedTo === null) updates.assigned_to = body.assignedTo || null
    if (typeof body?.departmentId === "string" || body?.departmentId === null) updates.department_id = body.departmentId || null
    if (typeof body?.resolutionNote === "string") updates.resolution_note = body.resolutionNote
    if (typeof body?.routingReason === "string") updates.routing_reason = body.routingReason
    if (typeof body?.routingConfidence === "number") updates.routing_confidence = body.routingConfidence
    if (body?.crmMetadata && typeof body.crmMetadata === "object") updates.crm_metadata = body.crmMetadata

    if (body?.confirmResolved === true) {
      updates.resolution_confirmed_at = new Date().toISOString()
      updates.status = "closed"
    }

    if (body?.closeByUser === true) {
      updates.closed_by_user = true
      updates.status = "closed"
    }

    if (body?.status === "resolved") {
      updates.resolved_at = new Date().toISOString()
      updates.resolution_requested_at = new Date().toISOString()
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields were provided" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("support_tickets")
      .update(updates)
      .eq("id", ticketId)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const changes = Object.fromEntries(
      Object.entries(updates).map(([key, to]) => [key, { from: (beforeTicket as any)?.[key] ?? null, to }])
    )

    await supabaseAdmin.from("audit_logs").insert({
      user_id: access.session?.user?.id || null,
      action: "CRM ticket updated",
      entity_type: "support_ticket",
      entity_id: ticketId,
      changes: {
        ...changes,
        summary: `Ticket ${ticketId} updated`,
      },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
    })

    if (Object.prototype.hasOwnProperty.call(updates, "assigned_to") && data.assigned_to && data.assigned_to !== beforeTicket?.assigned_to) {
      const { data: assignedAdmin } = await supabaseAdmin
        .from("admins")
        .select("user_id")
        .eq("id", data.assigned_to)
        .maybeSingle()

      if (assignedAdmin?.user_id) {
        await notifyAdmins({
          allAdmins: true,
          userIds: [assignedAdmin.user_id],
          title: "CRM ticket assigned to you",
          body: data.subject || `Ticket ${ticketId} needs your attention.`,
          type: "crm_ticket_assigned",
          actionUrl: `/admin/crm?ticket=${ticketId}`,
          metadata: { ticketId, assignedTo: data.assigned_to },
          sourceEventId: `crm_ticket_assigned:${ticketId}:${data.assigned_to}:${data.updated_at}`,
        })
      }
    }

    if (Object.prototype.hasOwnProperty.call(updates, "department_id") && data.department_id && data.department_id !== beforeTicket?.department_id) {
      const { data: department } = await supabaseAdmin
        .from("crm_departments")
        .select("department_key")
        .eq("id", data.department_id)
        .maybeSingle()

      await notifyAdmins({
        allAdmins: true,
        department: department?.department_key || "support",
        title: "CRM ticket moved departments",
        body: data.subject || `Ticket ${ticketId} was reassigned to your department.`,
        type: "crm_ticket_department_changed",
        actionUrl: `/admin/crm?ticket=${ticketId}`,
        metadata: { ticketId, departmentId: data.department_id },
        sourceEventId: `crm_ticket_department:${ticketId}:${data.department_id}:${data.updated_at}`,
      })
    }

    if (Object.prototype.hasOwnProperty.call(updates, "status") && data.status !== beforeTicket?.status) {
      await notifyAdmins({
        allAdmins: true,
        title: "CRM ticket status changed",
        body: `${data.subject || "A CRM ticket"} is now ${String(data.status).replace(/_/g, " ")}.`,
        type: "crm_ticket_status_changed",
        actionUrl: `/admin/crm?ticket=${ticketId}`,
        metadata: { ticketId, status: data.status },
        sourceEventId: `crm_ticket_status:${ticketId}:${data.status}:${data.updated_at}`,
      })
    }

    return NextResponse.json({ ticket: data })
  } catch (error) {
    console.error("[CRM][TICKET][PATCH]", error)
    return NextResponse.json({ error: "Failed to update CRM ticket" }, { status: 500 })
  }
}
