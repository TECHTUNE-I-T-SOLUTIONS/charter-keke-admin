import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { CRM_DEPARTMENTS, resolveDepartmentKeyFromText } from "@/lib/crm"

async function assertAdmin(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "super_admin"
  return { session, isAdmin }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const { isAdmin } = await assertAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const department = searchParams.get("department")
    const sourceChannel = searchParams.get("sourceChannel")
    const search = searchParams.get("search")
    const includeClosed = searchParams.get("includeClosed") === "true"
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100)

    let query = supabaseAdmin
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
      .order("last_message_at", { ascending: false })
      .limit(limit)

    if (!includeClosed) {
      query = query.not("status", "in", "(closed)")
    }

    if (status) query = query.eq("status", status)
    if (department) {
      if (department === "assigned") {
        query = query.not("assigned_to", "is", null)
      } else {
        const matchedDepartment = CRM_DEPARTMENTS.find((item) => item.key === department || item.aliases.includes(department))
        if (matchedDepartment) {
          query = query.eq("departments.department_key", matchedDepartment.key)
        }
      }
    }
    if (sourceChannel) query = query.eq("source_channel", sourceChannel)
    if (search) {
      query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%,source_email.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ tickets: data || [] })
  } catch (error) {
    console.error("[CRM][TICKETS][GET]", error)
    return NextResponse.json({ error: "Failed to load CRM tickets" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const { session, isAdmin } = await assertAdmin(request)
    if (!isAdmin || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const subject = String(body?.subject || "").trim()
    const description = String(body?.description || "").trim()
    const sourceChannel = String(body?.sourceChannel || "crm").trim() || "crm"
    const senderEmail = String(body?.senderEmail || "").trim().toLowerCase() || null
    const senderName = String(body?.senderName || "").trim() || null
    const recipientEmail = String(body?.recipientEmail || "").trim().toLowerCase() || null
    const priority = String(body?.priority || "normal")
    const initialDepartment = String(body?.department || "").trim().toLowerCase() || null
    const externalThreadId = String(body?.externalThreadId || "").trim() || null
    const externalMessageId = String(body?.externalMessageId || "").trim() || null
    const crmMetadata = body?.crmMetadata && typeof body.crmMetadata === "object" ? body.crmMetadata : {}

    if (!subject || !description) {
      return NextResponse.json({ error: "subject and description are required" }, { status: 400 })
    }

    const departmentKey = initialDepartment || resolveDepartmentKeyFromText({
      subject,
      body: description,
      senderEmail,
      recipientEmail,
    })

    const { data: department } = await supabaseAdmin
      .from("crm_departments")
      .select("id, department_key")
      .eq("department_key", departmentKey)
      .single()

    const { data: ticket, error } = await supabaseAdmin
      .from("support_tickets")
      .insert({
        user_id: session.user.id,
        subject,
        description,
        category: String(body?.category || departmentKey),
        priority,
        status: String(body?.status || "open"),
        assigned_to: body?.assignedTo || null,
        department_id: department?.id || null,
        source_channel: sourceChannel,
        source_email: senderEmail,
        source_name: senderName,
        external_thread_id: externalThreadId,
        external_message_id: externalMessageId,
        routing_reason: body?.routingReason || null,
        routing_confidence: Number(body?.routingConfidence || 0),
        crm_metadata: {
          ...crmMetadata,
          departmentKey,
          recipientEmail,
          senderEmail,
        },
        user_last_read_at: new Date().toISOString(),
        last_message_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    console.error("[CRM][TICKETS][POST]", error)
    return NextResponse.json({ error: "Failed to create CRM ticket" }, { status: 500 })
  }
}