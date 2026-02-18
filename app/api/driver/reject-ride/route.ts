import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { rideId } = body;

    if (!rideId) {
      return NextResponse.json({ error: "Ride ID is required" }, { status: 400 });
    }

    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", session.user.id)
      .single();

    if (!driver) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 }
      );
    }

    const { data: ride } = await supabase
      .from("rides")
      .select("id,status")
      .eq("id", rideId)
      .single();

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    if (ride.status !== "pending" && ride.status !== "dispatched") {
      return NextResponse.json({
        success: true,
        message: "Ride is no longer available",
      });
    }

    await supabaseAdmin!.from("ride_dispatch_logs").insert([
      {
        ride_id: rideId,
        driver_id: driver.id,
        dispatch_method: "rejected",
        created_at: new Date().toISOString(),
      },
    ]);

    return NextResponse.json({ success: true, rideId });
  } catch (error) {
    console.error("Reject ride error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
