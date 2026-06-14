import { NextRequest, NextResponse } from "next/server"
import { requireCrmAccess } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

function compact(value: unknown, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim()
}

type AdminNotificationRow = {
  id: string
  created_at: string
  [key: string]: any
}

function buildSelect() {
  return `
    *,
    recipient_user:users!admin_notifications_recipient_user_id_fkey (
      id,
      first_name,
      last_name,
      email,
      role
    )
  `
}

function applyFilters(query: any, request: NextRequest) {
  const params = request.nextUrl.searchParams
  const search = compact(params.get("q") || params.get("search"))
  const type = compact(params.get("type"))
  const department = compact(params.get("department"))
  const readState = compact(params.get("read"))

  if (type) query = query.eq("type", type)
  if (department) query = query.eq("recipient_department", department)
  if (readState === "read") query = query.not("read_at", "is", null)
  if (readState === "unread") query = query.is("read_at", null)
  if (search) {
    query = query.or(
      [
        `title.ilike.%${search}%`,
        `body.ilike.%${search}%`,
        `type.ilike.%${search}%`,
        `recipient_department.ilike.%${search}%`,
        `action_url.ilike.%${search}%`,
      ].join(",")
    )
  }

  return query
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

    const id = request.nextUrl.searchParams.get("id")
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 40), 100)
    const cursorCreatedAt = request.nextUrl.searchParams.get("cursorCreatedAt")
    const cursorId = request.nextUrl.searchParams.get("cursorId")

    if (id) {
      const { data, error } = await supabaseAdmin
        .from("admin_notifications")
        .select(buildSelect())
        .eq("id", id)
        .maybeSingle()

      if (error) {
        console.error("Error fetching notification:", error)
        return NextResponse.json({ error: "Failed to load notification" }, { status: 500 })
      }

      if (!data) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      return NextResponse.json({ notification: data })
    }

    let query = supabaseAdmin
      .from("admin_notifications")
      .select(buildSelect())
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit)

    query = applyFilters(query, request)

    if (cursorCreatedAt && cursorId) {
      query = query.or(`created_at.lt.${cursorCreatedAt},and(created_at.eq.${cursorCreatedAt},id.lt.${cursorId})`)
    }

    const { data, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ error: "Failed to load notifications" }, { status: 500 })
    }

    const notifications = (data || []) as unknown as AdminNotificationRow[]
    const last = notifications[notifications.length - 1]
    return NextResponse.json({
      notifications,
      nextCursor: last ? { cursorCreatedAt: last.created_at, cursorId: last.id } : null,
      hasMore: notifications.length === limit,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const id = compact(body?.id)
    const readAt = body?.read_at ? new Date(body.read_at).toISOString() : new Date().toISOString()

    if (!id) {
      return NextResponse.json({ error: "Missing notification id" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("admin_notifications")
      .update({ read_at: readAt, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select(buildSelect())
      .maybeSingle()

    if (error) {
      console.error("Error marking notification read:", error)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({ notification: data })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
