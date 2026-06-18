import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

function compact(value: unknown) {
  return String(value || "").trim()
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const body = await request.json().catch(() => ({}))
    const campaignId = compact(body?.campaignId)
    const userId = compact(body?.userId || body?.recipientUserId)
    const notificationId = compact(body?.notificationId)
    const openedAt = body?.openedAt ? new Date(body.openedAt).toISOString() : new Date().toISOString()

    if (!campaignId || !userId) {
      return NextResponse.json({ error: "campaignId and userId are required" }, { status: 400 })
    }

    const { error: recipientError } = await supabaseAdmin
      .from("mobile_push_campaign_recipients")
      .upsert(
        {
          campaign_id: campaignId,
          user_id: userId,
          status: "opened",
          opened_at: openedAt,
          read_at: openedAt,
          updated_at: openedAt,
        },
        { onConflict: "campaign_id,user_id" }
      )

    if (recipientError) {
      return NextResponse.json({ error: recipientError.message }, { status: 400 })
    }

    const { data: campaignRow, error: campaignError } = await supabaseAdmin
      .from("mobile_push_campaigns")
      .select("opened_count")
      .eq("id", campaignId)
      .maybeSingle()

    if (campaignError) {
      return NextResponse.json({ error: campaignError.message }, { status: 400 })
    }

    const { data: existingRecipient, error: existingRecipientError } = await supabaseAdmin
      .from("mobile_push_campaign_recipients")
      .select("status")
      .eq("campaign_id", campaignId)
      .eq("user_id", userId)
      .maybeSingle()

    if (existingRecipientError) {
      return NextResponse.json({ error: existingRecipientError.message }, { status: 400 })
    }

    const shouldIncrement = String(existingRecipient?.status || "").toLowerCase() !== "opened"

    if (shouldIncrement) {
      const currentOpened = Number(campaignRow?.opened_count || 0)
      const { error: updateError } = await supabaseAdmin
        .from("mobile_push_campaigns")
        .update({
          opened_count: currentOpened + 1,
          last_opened_at: openedAt,
          updated_at: openedAt,
        })
        .eq("id", campaignId)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 400 })
      }
    }

    if (notificationId) {
      await supabaseAdmin
        .from("notifications")
        .update({
          read: true,
          read_at: openedAt,
        })
        .eq("id", notificationId)
        .eq("user_id", userId)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[ADMIN][MOBILE_PUSH][OPEN]", error)
    return NextResponse.json({ error: error?.message || "Failed to record push open" }, { status: 500 })
  }
}
