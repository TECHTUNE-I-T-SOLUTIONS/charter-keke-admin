import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireCrmAccess } from "@/lib/admin-access"

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [openTickets, inProgressTickets, escalatedTickets, resolvedTickets, queuedEmails, internalNotes, departments, emailAccounts] = await Promise.all([
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "in_progress"),
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "escalated"),
      supabaseAdmin.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "resolved"),
      supabaseAdmin.from("crm_email_messages").select("id", { count: "exact", head: true }).eq("processing_status", "queued").eq("direction", "inbound"),
      supabaseAdmin.from("crm_internal_notes").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("crm_departments").select("id, department_key, department_name, email_alias, route_priority, is_active, created_at").order("route_priority", { ascending: true }),
      supabaseAdmin.from("crm_email_accounts").select("id", { count: "exact", head: true }).eq("is_active", true),
    ])

    return NextResponse.json({
      summary: {
        openTickets: openTickets.count || 0,
        inProgressTickets: inProgressTickets.count || 0,
        escalatedTickets: escalatedTickets.count || 0,
        resolvedTickets: resolvedTickets.count || 0,
        queuedInboundEmails: queuedEmails.count || 0,
        internalNotes: internalNotes.count || 0,
        emailAccounts: emailAccounts.count || 0,
      },
      departments: departments.data || [],
    })
  } catch (error) {
    console.error("[CRM][SUMMARY][GET]", error)
    return NextResponse.json({ error: "Failed to load CRM summary" }, { status: 500 })
  }
}
