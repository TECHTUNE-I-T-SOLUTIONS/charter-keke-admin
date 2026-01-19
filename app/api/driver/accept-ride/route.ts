import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
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
      return NextResponse.json(
        { error: "Ride ID is required" },
        { status: 400 }
      );
    }

    // Get driver profile
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

    // Get ride
    const { data: ride } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    // Check if ride is still available (pending status)
    if (ride.status !== "pending") {
      return NextResponse.json(
        { error: "Ride is no longer available" },
        { status: 409 }
      );
    }

    // Accept the ride - update status to accepted and assign driver
    const { data: updatedRide, error } = await supabase
      .from("rides")
      .update({
        status: "accepted",
        driver_id: driver.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) {
      console.error("Accept ride error:", error);
      return NextResponse.json(
        { error: "Failed to accept ride" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      ride: updatedRide,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
