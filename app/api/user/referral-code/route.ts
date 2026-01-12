import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get referral code for this user
    const { data: referral, error } = await supabase
      .from("referrals")
      .select("referral_code")
      .eq("referrer_id", session.user.id)
      .single();

    if (error || !referral) {
      return NextResponse.json(
        { referralCode: `EASE${Math.random().toString(36).substring(2, 8).toUpperCase()}` },
        { status: 200 }
      );
    }

    return NextResponse.json({ referralCode: referral.referral_code }, { status: 200 });
  } catch (error) {
    console.error("Get referral code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
