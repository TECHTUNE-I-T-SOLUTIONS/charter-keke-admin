import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, isSuperAdminUser } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"
import { sendPushNotification } from "@/lib/push-service"

const RIDER_ROLES = new Set(["user", "rider", "passenger"])
const ADMIN_ALLOWED_DEPARTMENTS = new Set(["super", "support", "general", "customer_support", "product", "riders"])

const SCREEN_ROUTES = {
  rider_booking: "/rider/booking",
  rider_active_ride: "/rider/active-ride",
  rider_ride_details: "/rider/ride-details",
  rider_notifications: "/rider/notifications",
  rider_support: "/rider/help-and-support",
  rider_wallet: "/rider/wallet",
  rider_rides_history: "/rider/rides-history",
  rider_profile: "/rider/profile",
  driver_home: "/driver/home",
  driver_active_ride: "/driver/ride-details",
  driver_rides: "/driver/rides",
  driver_notifications: "/driver/notifications",
  driver_support: "/driver/help-and-support",
  driver_wallet: "/driver/wallet",
  driver_profile: "/driver/profile",
} as const

function normalizeRole(value: unknown) {
  return String(value || "").trim().toLowerCase()
}

function normalizeUrl(value: unknown) {
  const url = String(value || "").trim()
  if (!url) return ""
  if (/^https?:\/\//i.test(url)) return url
  return url.startsWith("/") ? url : `/${url}`
}

function isValidUrl(value: string) {
  if (!value) return true
  try {
    if (value.startsWith('/')) return true
    new URL(value)
    return true
  } catch {
    return false
  }
}

function buildActionUrl(screenKey?: string, customUrl?: string) {
  const screen = screenKey ? (SCREEN_ROUTES as Record<string, string>)[screenKey] : ""
  return normalizeUrl(customUrl) || screen || "/rider/booking"
}

function absoluteAdminUrl(path: string) {
  const base = process.env.ADMIN_APP_URL || process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.charterkeke.com"
  return `${base.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`
}

async function assertAccess(request: NextRequest) {
  const access = await requireAdminSession(request)
  if (!access.authorized || !access.session?.user?.id) return { authorized: false as const, access }

  const department = normalizeRole(access.admin?.department)
  if (isSuperAdminUser(access.session.user, access.admin) || ADMIN_ALLOWED_DEPARTMENTS.has(department)) {
    return { authorized: true as const, access }
  }

  return { authorized: false as const, access }
}

async function resolveRecipientIds(target: string, selectedIds: string[] = []) {
  if (!supabaseAdmin) return []

  if (target === "selected") {
    return Array.from(new Set(selectedIds.map(String).filter(Boolean)))
  }

  let query = supabaseAdmin.from("users").select("id").eq("status", "active")
  if (target === "drivers") {
    query = query.eq("role", "driver")
  } else if (target === "riders") {
    query = query.in("role", Array.from(RIDER_ROLES))
  } else {
    query = query.in("role", ["driver", ...Array.from(RIDER_ROLES)])
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return Array.from(new Set((data || []).map((item: any) => String(item.id)).filter(Boolean)))
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const { authorized } = await assertAccess(request)
    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const mode = String(request.nextUrl.searchParams.get("mode") || "list").toLowerCase()

    if (mode === "screens") {
      return NextResponse.json({ screens: SCREEN_ROUTES })
    }

    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit") || 20), 100)
    const { data, error } = await supabaseAdmin
      .from("mobile_push_campaigns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ campaigns: data || [] })
  } catch (error: any) {
    console.error("[ADMIN][MOBILE_PUSH][GET]", error)
    return NextResponse.json({ error: error?.message || "Failed to load mobile push campaigns" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const { authorized, access } = await assertAccess(request)
    if (!authorized || !access.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const title = String(body?.title || "").trim()
    const message = String(body?.message || body?.body || "").trim()
    const target = String(body?.target || "all").toLowerCase()
    const selectedUserIds = Array.isArray(body?.selectedUserIds) ? body.selectedUserIds.map(String).filter(Boolean) : []
    const screenKey = String(body?.screenKey || "").trim()
    const customUrl = String(body?.customUrl || body?.actionUrl || "").trim()
    const imageUrl = String(body?.imageUrl || "").trim() || null
    const badgeText = String(body?.badgeText || "").trim() || null
    const categoryId = String(body?.categoryId || "").trim() || "mobile_campaign"
    const ctaLabel = String(body?.ctaLabel || "").trim() || null
    const actionType = String(body?.actionType || "campaign").trim() || "campaign"
    const sendNow = body?.sendNow !== false
    const enableActionButtons = body?.enableActionButtons === true

    if (!title || !message) {
      return NextResponse.json({ error: "title and message are required" }, { status: 400 })
    }

    // Validate image URL if provided
    if (imageUrl && !isValidUrl(imageUrl)) {
      return NextResponse.json({ error: "Invalid image URL format" }, { status: 400 })
    }

    // Validate custom URL if provided
    if (customUrl && !isValidUrl(customUrl) && !customUrl.startsWith('/')) {
      return NextResponse.json({ error: "Invalid custom URL format" }, { status: 400 })
    }

    const recipientIds = await resolveRecipientIds(target, selectedUserIds)
    if (!recipientIds.length) {
      return NextResponse.json({ error: "No recipients matched the selected audience" }, { status: 400 })
    }

    const actionUrl = buildActionUrl(screenKey, customUrl)
    const campaignPayload = {
      title,
      body: message,
      target_audience: target,
      recipient_count: recipientIds.length,
      image_url: imageUrl,
      action_url: actionUrl,
      cta_label: ctaLabel,
      category_id: categoryId,
      status: sendNow ? "sending" : "draft",
      created_by: access.session.user.id,
      metadata: {
        screenKey,
        actionType,
        badgeText,
        source: "admin_mobile_push",
      },
    }

    const { data: campaign, error: campaignError } = await supabaseAdmin
      .from("mobile_push_campaigns")
      .insert(campaignPayload)
      .select("*")
      .single()

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 400 })
    }

    const recipientRows = recipientIds.map((userId) => ({
      campaign_id: campaign.id,
      user_id: userId,
      status: "pending",
    }))
    await supabaseAdmin.from("mobile_push_campaign_recipients").insert(recipientRows)

    if (!sendNow) {
      return NextResponse.json({ success: true, campaign, recipientCount: recipientIds.length })
    }

    const result = await sendPushNotification(recipientIds, {
      title,
      body: message,
      type: actionType === "ride_update" || actionType === "ride_request" || actionType === "ride_accepted"
        ? (actionType as any)
        : "mobile_campaign",
      categoryId,
      imageUrl: imageUrl || undefined,
      actions: enableActionButtons && ctaLabel ? [{
        id: "open_action",
        title: ctaLabel,
        action: actionUrl
      }] : undefined,
      data: {
        campaignId: campaign.id,
        actionUrl,
        deeplink: actionUrl,
        screenKey,
        badgeText,
        ctaLabel,
        type: actionType,
      },
    } as any)

    const deliveredCount = Array.isArray(result) ? result.filter((item) => item.success).length : 0

    await supabaseAdmin
      .from("mobile_push_campaigns")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        delivered_count: deliveredCount,
      })
      .eq("id", campaign.id)

    await supabaseAdmin
      .from("mobile_push_campaign_recipients")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("campaign_id", campaign.id)

    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      recipientCount: recipientIds.length,
      deliveredCount,
      result,
      actionUrl: absoluteAdminUrl(`/admin/mobile-push/${campaign.id}`),
    })
  } catch (error: any) {
    console.error("[ADMIN][MOBILE_PUSH][POST]", error)
    return NextResponse.json({ error: error?.message || "Failed to send mobile push notification" }, { status: 500 })
  }
}
