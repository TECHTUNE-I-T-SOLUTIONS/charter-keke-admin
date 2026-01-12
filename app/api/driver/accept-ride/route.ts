import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";
import { notifyRiderAboutRideStatus } from "@/lib/notifications";

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

    // Get ride
    const { data: ride } = await supabaseAdmin
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    // Check if ride is already accepted
    if (ride.status !== "dispatched") {
      return NextResponse.json(
        { error: "Ride is no longer available" },
        { status: 409 }
      );
    }

    // Accept the ride
    const { data: updatedRide, error } = await supabaseAdmin
      .from("rides")
      .update({
        status: "accepted",
        assigned_driver_id: driver.id,
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to accept ride" },
        { status: 500 }
      );
    }

    // Update dispatch log
    await supabaseAdmin
      .from("ride_dispatch_logs")
      .update({ response: "accepted", response_time: Date.now() })
      .eq("ride_id", rideId)
      .eq("driver_id", driver.id);

    // Notify rider
    await notifyRiderAboutRideStatus(ride.rider_id, rideId, "accepted");

    return NextResponse.json({
      message: "Ride accepted successfully",
      ride: updatedRide,
    });
  } catch (error) {
    console.error("Accept ride error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
