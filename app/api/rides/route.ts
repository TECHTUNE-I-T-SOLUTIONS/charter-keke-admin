import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";
import { notifyDriverAboutRide } from "@/lib/notifications";
import { emitRideRequest, emitRideUpdate } from "@/lib/push-emitters";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      pickup_zone,
      pickup_description,
      destination_zone,
      destination_description,
      ride_type = "single",
      fare,
      estimated_distance,
    } = body;

    // Validate required fields
    if (!pickup_zone || !destination_zone) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const parsedFare = Number.isFinite(Number(fare)) ? Number(fare) : 0;
    const parsedDistance = Number.isFinite(Number(estimated_distance))
      ? Number(estimated_distance)
      : 0;

    // Create ride
    const { data: ride, error: rideError } = await supabaseAdmin!
      .from("rides")
      .insert([
        {
          rider_id: session.user.id,
          pickup_zone,
          pickup_description,
          destination_zone,
          destination_description,
          ride_type,
          fare: parsedFare,
          estimated_distance: parsedDistance,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (rideError || !ride) {
      return NextResponse.json(
        { error: "Failed to create ride" },
        { status: 500 }
      );
    }

    // Find available drivers in the zone
    const { data: drivers } = await supabaseAdmin!
      .from("drivers")
      .select("user_id")
      .contains("operating_zones", [pickup_zone])
      .eq("availability_status", "online")
      .eq("verified", true)
      .limit(5);

    // Emit push notification to all nearby drivers
    if (ride) {
      await emitRideRequest(
        ride.id,
        pickup_description || pickup_zone,
        destination_description || destination_zone,
        Number(ride.fare || 0),
        Number(ride.estimated_distance || 0)
      );

      await emitRideUpdate(
        session.user.id,
        ride.id,
        "status",
        `Your ride request from ${pickup_zone} to ${destination_zone} has been created successfully.`
      );
    }

    // Notify drivers
    if (drivers && drivers.length > 0) {
      for (const driver of drivers) {
        await notifyDriverAboutRide(
          driver.user_id,
          ride.id,
          pickup_zone,
          destination_zone
        );

        // Log dispatch
        await supabaseAdmin!.from("ride_dispatch_logs").insert([
          {
            ride_id: ride.id,
            driver_id: driver.user_id,
            dispatch_method: "push",
            created_at: new Date().toISOString(),
          },
        ]);
      }

      // Update ride status to dispatched
      await supabaseAdmin!
        .from("rides")
        .update({ status: "dispatched" })
        .eq("id", ride.id);
    }

    return NextResponse.json(
      {
        message: "Ride created successfully",
        ride,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Ride creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Fetch rides with driver details using Supabase joins
    let query = supabaseAdmin!
      .from("rides")
      .select(`
        *,
        drivers:driver_id (
          id,
          user_id,
          vehicle_type,
          plate_number,
          vehicle_picture_url,
          average_rating,
          users:user_id (
            first_name,
            last_name,
            phone_number,
            profile_picture_url
          )
        )
      `)
      .eq("rider_id", session.user.id)
      .order("created_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    // Apply limit
    query = query.limit(limit);

    const { data: rides, error } = await query;

    if (error) {
      console.error("Ride fetch error from Supabase:", error);
      return NextResponse.json(
        { error: "Failed to fetch rides", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ rides });
  } catch (error) {
    console.error("Ride fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
