import { NextRequest, NextResponse } from "next/server"
import { requireCrmAccess } from "@/lib/admin-access"
import { sendPushNotification } from "@/lib/push-service"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireCrmAccess(request)
    if (!access.authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body?.title || "").trim()
    const message = String(body?.message || body?.body || "").trim()
    const target = String(body?.target || "specific").toLowerCase()
    const userIds: string[] = Array.isArray(body?.userIds) ? body.userIds.map(String).filter(Boolean) : []
    const role = body?.role ? String(body.role).toLowerCase() : null
    const deeplink = String(body?.deeplink || body?.deepLink || "/support").trim()

    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 })
    }

    let targetUserIds: string[] = userIds
    if (target === "all" || role) {
      let query = supabaseAdmin.from("users").select("id").eq("status", "active")
      if (role && ["user", "driver", "admin"].includes(role)) {
        query = query.eq("role", role)
      } else if (target === "all") {
        query = query.in("role", ["user", "driver"])
      }

      const { data, error } = await query
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      targetUserIds = (data || []).map((user: { id?: string }) => user.id).filter(Boolean) as string[]
    }

    targetUserIds = Array.from(new Set(targetUserIds))
    if (!targetUserIds.length) {
      return NextResponse.json({ error: "No target users found" }, { status: 400 })
    }

    await supabaseAdmin.from("notifications").insert(
      targetUserIds.map((userId) => ({
        user_id: userId,
        title,
        message,
        type: "support_broadcast",
        channel: "push",
        read: false,
        deeplink,
        action_url: deeplink,
        target_type: "support",
        metadata: {
          sentBy: access.session?.user?.id,
          source: "admin_crm_mobile_push",
        },
      }))
    )

    const result = await sendPushNotification(targetUserIds, {
      title,
      body: message,
      data: {
        type: "support_broadcast",
        deeplink,
        actionUrl: deeplink,
      },
    } as any)

    return NextResponse.json({
      success: true,
      targeted: targetUserIds.length,
      result,
    })
  } catch (error) {
    console.error("[CRM][MOBILE_PUSH]", error)
    return NextResponse.json({ error: "Failed to send mobile push notification" }, { status: 500 })
  }
}
