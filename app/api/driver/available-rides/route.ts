import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get driver info
    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (!driver) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 }
      );
    }

    // Get available rides in driver's zones
    const { data: rides } = await supabaseAdmin
      .from("rides")
      .select("*")
      .in("pickup_zone", driver.operating_zones || [])
      .eq("status", "dispatched")
      .order("created_at", { ascending: false })
      .limit(10);

    return NextResponse.json({ rides });
  } catch (error) {
    console.error("Available rides fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
