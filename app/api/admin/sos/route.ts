import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Math.min(Number(searchParams.get("limit") || 100), 200)

    let query = supabaseAdmin
      .from("sos_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status && status !== "all") query = query.eq("status", status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const alerts = data || []
    return NextResponse.json({
      alerts,
      summary: {
        open: alerts.filter((item) => item.status === "open").length,
        acknowledged: alerts.filter((item) => item.status === "acknowledged").length,
        resolved: alerts.filter((item) => item.status === "resolved").length,
        total: alerts.length,
      },
    })
  } catch (error) {
    console.error("[ADMIN][SOS][GET]", error)
    return NextResponse.json({ error: "Failed to load SOS alerts" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized || !access.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const alertId = String(body?.alertId || "").trim()
    const status = String(body?.status || "").trim()
    if (!alertId || !["acknowledged", "resolved", "false_alarm"].includes(status)) {
      return NextResponse.json({ error: "Valid alertId and status are required" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const patch: Record<string, unknown> = { status, updated_at: now }
    if (status === "acknowledged") {
      patch.acknowledged_by = access.session.user.id
      patch.acknowledged_at = now
    }
    if (status === "resolved" || status === "false_alarm") {
      patch.resolved_by = access.session.user.id
      patch.resolved_at = now
    }

    const { data, error } = await supabaseAdmin
      .from("sos_alerts")
      .update(patch)
      .eq("id", alertId)
      .select("*")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ alert: data })
  } catch (error) {
    console.error("[ADMIN][SOS][PATCH]", error)
    return NextResponse.json({ error: "Failed to update SOS alert" }, { status: 500 })
  }
}
