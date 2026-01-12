import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get referral code info
    const { data: referralCode } = await supabase
      .from("referral_codes")
      .select("*")
      .eq("user_id", session.user.id)
      .single()

    // Get all referrals made by this user with joined user info
    const { data: referrals } = await supabase
      .from("referrals")
      .select(
        `
        id,
        referee_id,
        status,
        reward_amount,
        created_at,
        completed_at,
        users!referral_referee_fk (first_name, last_name, email)
      `
      )
      .eq("referrer_id", session.user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json({
      referralCode: referralCode || {
        referral_code: "",
        total_referrals: 0,
        active_referrals: 0,
        total_rewards: 0,
      },
      referrals: (referrals || []).map((ref: any) => ({
        ...ref,
        referee: ref.users,
      })),
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch referral data" },
      { status: 500 }
    )
  }
}
