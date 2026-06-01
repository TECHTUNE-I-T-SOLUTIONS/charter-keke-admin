import { NextRequest, NextResponse } from "next/server"
import { requireCrmAccess } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

function compact(value: unknown, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim()
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 150), 250)

    const [auditLogs, notes, messages, tickets, emails] = await Promise.all([
      supabaseAdmin
        .from("audit_logs")
        .select(`
          id,
          user_id,
          action,
          entity_type,
          entity_id,
          changes,
          ip_address,
          user_agent,
          created_at,
          users:user_id (first_name, last_name, email, role)
        `)
        .in("entity_type", ["support_ticket", "crm_internal_note", "ticket_message", "crm_email_message", "admin"])
        .order("created_at", { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from("crm_internal_notes")
        .select(`
          id,
          ticket_id,
          note,
          visibility,
          created_at,
          metadata,
          admins:author_admin_id (
            user_id,
            department,
            users:user_id (first_name, last_name, email, role)
          ),
          departments:department_id (department_key, department_name)
        `)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from("ticket_messages")
        .select(`
          id,
          ticket_id,
          sender_id,
          message,
          is_internal,
          message_type,
          created_at,
          users:sender_id (first_name, last_name, email, role)
        `)
        .order("created_at", { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from("support_tickets")
        .select(`
          id,
          subject,
          status,
          priority,
          category,
          source_channel,
          source_email,
          source_name,
          routing_reason,
          created_at,
          updated_at,
          departments:department_id (department_key, department_name),
          admins:assigned_to (
            user_id,
            users:user_id (first_name, last_name, email, role)
          )
        `)
        .order("updated_at", { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from("crm_email_messages")
        .select(`
          id,
          ticket_id,
          direction,
          from_email,
          from_name,
          to_emails,
          subject,
          processing_status,
          processing_reason,
          received_at,
          created_at
        `)
        .order("created_at", { ascending: false })
        .limit(limit),
    ])

    const events = [
      ...((auditLogs.data || []) as any[]).map((log) => ({
        id: `audit:${log.id}`,
        eventId: log.id,
        action: log.action,
        entityType: log.entity_type || "audit",
        entityId: log.entity_id,
        summary: compact(log.changes?.summary || log.action),
        details: log.changes || {},
        actor: log.users ? {
          name: compact(`${log.users.first_name || ""} ${log.users.last_name || ""}`, "Admin"),
          email: log.users.email,
          role: log.users.role,
        } : null,
        actionUrl: log.entity_type === "support_ticket" && log.entity_id ? `/admin/crm?ticket=${log.entity_id}` : "/admin/crm/logs",
        createdAt: log.created_at,
        source: "audit",
      })),
      ...((notes.data || []) as any[]).map((note) => ({
        id: `note:${note.id}`,
        eventId: note.id,
        action: "Internal note added",
        entityType: "crm_internal_note",
        entityId: note.id,
        ticketId: note.ticket_id,
        summary: compact(note.note).slice(0, 220),
        details: {
          visibility: note.visibility,
          department: note.departments?.department_name || note.departments?.department_key || note.admins?.department,
          metadata: note.metadata || {},
        },
        actor: note.admins?.users ? {
          name: compact(`${note.admins.users.first_name || ""} ${note.admins.users.last_name || ""}`, "Admin"),
          email: note.admins.users.email,
          role: note.admins.users.role,
        } : null,
        actionUrl: `/admin/crm?ticket=${note.ticket_id}`,
        createdAt: note.created_at,
        source: "internal_note",
      })),
      ...((messages.data || []) as any[]).map((message) => ({
        id: `message:${message.id}`,
        eventId: message.id,
        action: message.is_internal ? "Internal ticket message" : "Customer thread message",
        entityType: "ticket_message",
        entityId: message.id,
        ticketId: message.ticket_id,
        summary: compact(message.message).slice(0, 220),
        details: { isInternal: message.is_internal, messageType: message.message_type },
        actor: message.users ? {
          name: compact(`${message.users.first_name || ""} ${message.users.last_name || ""}`, "User"),
          email: message.users.email,
          role: message.users.role,
        } : null,
        actionUrl: `/admin/crm?ticket=${message.ticket_id}`,
        createdAt: message.created_at,
        source: "ticket_message",
      })),
      ...((tickets.data || []) as any[]).map((ticket) => ({
        id: `ticket:${ticket.id}`,
        eventId: ticket.id,
        action: "Ticket updated",
        entityType: "support_ticket",
        entityId: ticket.id,
        ticketId: ticket.id,
        summary: compact(ticket.subject, "Support ticket"),
        details: {
          status: ticket.status,
          priority: ticket.priority,
          category: ticket.category,
          source: ticket.source_channel,
          sourceEmail: ticket.source_email,
          department: ticket.departments?.department_name || ticket.departments?.department_key,
          routingReason: ticket.routing_reason,
        },
        actor: ticket.admins?.users ? {
          name: compact(`${ticket.admins.users.first_name || ""} ${ticket.admins.users.last_name || ""}`, "Assigned admin"),
          email: ticket.admins.users.email,
          role: ticket.admins.users.role,
        } : null,
        actionUrl: `/admin/crm?ticket=${ticket.id}`,
        createdAt: ticket.updated_at || ticket.created_at,
        source: "support_ticket",
      })),
      ...((emails.data || []) as any[]).map((email) => ({
        id: `email:${email.id}`,
        eventId: email.id,
        action: email.direction === "outbound" ? "Outbound email queued" : "Inbound email received",
        entityType: "crm_email_message",
        entityId: email.id,
        ticketId: email.ticket_id,
        summary: compact(email.subject, "CRM email"),
        details: {
          direction: email.direction,
          fromEmail: email.from_email,
          toEmails: email.to_emails,
          status: email.processing_status,
          reason: email.processing_reason,
        },
        actor: {
          name: email.from_name || email.from_email || "Email service",
          email: email.from_email,
          role: "email",
        },
        actionUrl: email.ticket_id ? `/admin/crm?ticket=${email.ticket_id}` : "/admin/crm/emails",
        createdAt: email.created_at || email.received_at,
        source: "email",
      })),
    ]
      .filter((event) => event.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)

    return NextResponse.json({ logs: events })
  } catch (error) {
    console.error("[CRM][LOGS][GET]", error)
    return NextResponse.json({ error: "Failed to load CRM logs" }, { status: 500 })
  }
}
