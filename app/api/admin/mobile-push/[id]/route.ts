import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, isSuperAdminUser } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"
import { sendPushNotification } from "@/lib/push-service"

const ADMIN_ALLOWED_DEPARTMENTS = new Set(["super", "support", "general", "customer_support", "product", "riders"])

async function assertAccess(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!access.authorized || !access.session?.user?.id) return { authorized: false as const, access }
  const department = String(access.admin?.department || "").trim().toLowerCase()
  if (isSuperAdminUser(access.session.user, access.admin) || ADMIN_ALLOWED_DEPARTMENTS.has(department)) {
    return { authorized: true as const, access }
  }
  return { authorized: false as const, access }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }
    const { authorized } = await assertAccess(request)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    const { data, error } = await supabaseAdmin
      .from("mobile_push_campaigns")
      .select("*, recipients:mobile_push_campaign_recipients(*, users:user_id(id, first_name, last_name, email, phone_number, role))")
      .eq("id", id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!data) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    return NextResponse.json({ campaign: data })
  } catch (error: any) {
    console.error("[ADMIN][MOBILE_PUSH][DETAIL]", error)
    return NextResponse.json({ error: error?.message || "Failed to load campaign" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }
    const { authorized } = await assertAccess(request)
    if (!authorized) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { id } = await context.params
    const body = await request.json().catch(() => ({}))
    const force = body?.force === true
    const failedOnly = body?.failedOnly === true

    const { data: campaign, error } = await supabaseAdmin
      .from("mobile_push_campaigns")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 })

    const { data: recipients } = await supabaseAdmin
      .from("mobile_push_campaign_recipients")
      .select("user_id, status")
      .eq("campaign_id", id)

    const recipientIds = Array.from(
      new Set(
        (recipients || [])
          .filter((row: any) => {
            const status = String(row.status || "").toLowerCase()
            if (force) return true
            if (failedOnly) return status === "failed"
            return status === "failed" || status === "pending"
          })
          .map((row: any) => String(row.user_id))
          .filter(Boolean)
      )
    )
    if (!recipientIds.length) {
      return NextResponse.json({ error: "No recipients eligible for resend" }, { status: 400 })
    }

    const result = await sendPushNotification(recipientIds, {
      title: campaign.title,
      body: campaign.body,
      type: "ride_update" as any,
      categoryId: campaign.category_id || "mobile_campaign",
      imageUrl: campaign.image_url || undefined,
      data: {
        campaignId: campaign.id,
        actionUrl: campaign.action_url,
        deeplink: campaign.action_url,
        replay: true,
      },
    } as any)

    const deliveredCount = Array.isArray(result) ? result.filter((item) => item.success).length : 0

    await supabaseAdmin
      .from("mobile_push_campaigns")
      .update({
        last_sent_at: new Date().toISOString(),
        delivered_count: Number(campaign.delivered_count || 0) + deliveredCount,
      })
      .eq("id", id)

    return NextResponse.json({ success: true, deliveredCount, result })
  } catch (error: any) {
    console.error("[ADMIN][MOBILE_PUSH][RESEND]", error)
    return NextResponse.json({ error: error?.message || "Failed to resend campaign" }, { status: 500 })
  }
}
