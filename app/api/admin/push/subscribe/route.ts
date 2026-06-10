import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"
import { notifyAdmins } from "@/lib/admin-notifications"

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized || !access.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const endpoint = new URL(request.url).searchParams.get("endpoint")
    if (!endpoint) {
      const { count } = await supabaseAdmin
        .from("admin_push_subscriptions")
        .select("id", { count: "exact", head: true })
        .eq("admin_user_id", access.session.user.id)
        .eq("is_active", true)

      return NextResponse.json({ subscribed: Boolean(count) })
    }

    const { data } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .select("id")
      .eq("admin_user_id", access.session.user.id)
      .eq("endpoint", endpoint)
      .eq("is_active", true)
      .maybeSingle()

    return NextResponse.json({ subscribed: Boolean(data?.id) })
  } catch (error) {
    console.error("[ADMIN][PUSH][STATUS]", error)
    return NextResponse.json({ error: "Failed to read admin push status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized || !access.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    let endpoint = String(body?.endpoint || "").trim()
    let p256dh = String(body?.keys?.p256dh || body?.p256dh || "").trim()
    let auth = String(body?.keys?.auth || body?.auth || "").trim()

    if ((!endpoint || !p256dh || !auth) && body?.adoptExisting) {
      const { data: existingWebSubscription } = await supabaseAdmin
        .from("push_subscriptions")
        .select("push_token")
        .eq("user_id", access.session.user.id)
        .eq("platform", "web")
        .eq("is_active", true)
        .not("push_token", "is", null)
        .order("last_verified_at", { ascending: false, nullsFirst: false })
        .order("subscribed_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      try {
        const parsed = existingWebSubscription?.push_token ? JSON.parse(existingWebSubscription.push_token) : null
        endpoint = String(parsed?.endpoint || "").trim()
        p256dh = String(parsed?.keys?.p256dh || parsed?.p256dh || "").trim()
        auth = String(parsed?.keys?.auth || parsed?.auth || "").trim()
      } catch {
        endpoint = ""
        p256dh = ""
        auth = ""
      }
    }

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "A valid browser push subscription is required" }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .upsert(
        {
          admin_user_id: access.session.user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: request.headers.get("user-agent"),
          is_active: true,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      )
      .select("id, admin_user_id, endpoint, is_active, last_seen_at")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    await notifyAdmins({
      userIds: [access.session.user.id],
      title: "Admin notifications enabled",
      body: "This browser is now subscribed to Charter Keke admin alerts.",
      type: "admin_push_subscribed",
      actionUrl: "/admin/settings",
      metadata: { subscriptionId: data.id },
      sourceEventId: `admin_push_subscribed:${data.id}:${Date.now()}`,
    })

    return NextResponse.json({ subscription: data })
  } catch (error) {
    console.error("[ADMIN][PUSH][SUBSCRIBE]", error)
    return NextResponse.json({ error: "Failed to subscribe admin push notifications" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized || !access.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const endpoint = String(body?.endpoint || "").trim()
    if (!endpoint) {
      return NextResponse.json({ error: "endpoint is required" }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from("admin_push_subscriptions")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("admin_user_id", access.session.user.id)
      .eq("endpoint", endpoint)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN][PUSH][UNSUBSCRIBE]", error)
    return NextResponse.json({ error: "Failed to unsubscribe admin push notifications" }, { status: 500 })
  }
}
