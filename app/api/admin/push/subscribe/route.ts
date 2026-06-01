import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

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
    const endpoint = String(body?.endpoint || "").trim()
    const p256dh = String(body?.keys?.p256dh || body?.p256dh || "").trim()
    const auth = String(body?.keys?.auth || body?.auth || "").trim()

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

    return NextResponse.json({ subscription: data })
  } catch (error) {
    console.error("[ADMIN][PUSH][SUBSCRIBE]", error)
    return NextResponse.json({ error: "Failed to subscribe admin push notifications" }, { status: 500 })
  }
}
