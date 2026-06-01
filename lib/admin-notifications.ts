import webpush from "web-push"
import { supabaseAdmin } from "@/lib/supabase"

type AdminNotificationInput = {
  userIds?: string[]
  department?: string
  title: string
  body: string
  type?: string
  actionUrl?: string
  metadata?: Record<string, unknown>
}

let vapidConfigured = false

function configureVapid() {
  if (vapidConfigured) return true

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || "mailto:support@charterkeke.com"

  if (!publicKey || !privateKey) return false

  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
  return true
}

export async function notifyAdmins(input: AdminNotificationInput) {
  if (!supabaseAdmin) return { success: false, delivered: 0, error: "Supabase admin client unavailable" }

  const userIds = Array.from(new Set(input.userIds || [])).filter(Boolean)
  const department = input.department?.trim().toLowerCase()

  const rows = [
    ...userIds.map((userId) => ({
      recipient_user_id: userId,
      recipient_department: null,
      title: input.title,
      body: input.body,
      type: input.type || "admin_event",
      action_url: input.actionUrl || null,
      metadata: input.metadata || {},
    })),
    ...(department
      ? [
          {
            recipient_user_id: null,
            recipient_department: department,
            title: input.title,
            body: input.body,
            type: input.type || "admin_event",
            action_url: input.actionUrl || null,
            metadata: input.metadata || {},
          },
        ]
      : []),
  ]

  if (rows.length) {
    await supabaseAdmin.from("admin_notifications").insert(rows)
  }

  const targetUserIds = new Set(userIds)
  if (department) {
    const { data: admins } = await supabaseAdmin
      .from("admins")
      .select("user_id")
      .or(`department.eq.${department},admin_level.eq.super,admin_level.eq.super_admin,admin_level.eq.super-admin`)

    for (const admin of admins || []) {
      if (admin.user_id) targetUserIds.add(admin.user_id)
    }
  }

  if (!targetUserIds.size || !configureVapid()) {
    return { success: true, delivered: 0 }
  }

  const { data: subscriptions } = await supabaseAdmin
    .from("admin_push_subscriptions")
    .select("id, admin_user_id, endpoint, p256dh, auth")
    .eq("is_active", true)
    .in("admin_user_id", Array.from(targetUserIds))

  let delivered = 0
  await Promise.all(
    (subscriptions || []).map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify({
            title: input.title,
            body: input.body,
            type: input.type || "admin_event",
            actionUrl: input.actionUrl,
            metadata: input.metadata || {},
          })
        )
        delivered += 1
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await supabaseAdmin
            .from("admin_push_subscriptions")
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq("id", subscription.id)
        }
      }
    })
  )

  return { success: true, delivered }
}
