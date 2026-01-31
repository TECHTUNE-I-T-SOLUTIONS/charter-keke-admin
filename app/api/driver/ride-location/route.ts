import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rideId = searchParams.get("rideId")

    if (!rideId) {
      return NextResponse.json(
        { error: "Ride ID required" },
        { status: 400 }
      )
    }

    // Fetch ride details
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("id, driver_id, rider_id, status")
      .eq("id", rideId)
      .single()

    if (rideError || !ride) {
      return NextResponse.json(
        { error: "Ride not found" },
        { status: 404 }
      )
    }

    // Verify driver is assigned to this ride
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (ride.driver_id !== driver?.id && ride.status === "pending") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      )
    }

    const locations: any = {}

    // Get latest driver location
    const { data: driverLocation } = await supabase
      .from("driver_locations")
      .select("latitude, longitude, timestamp, accuracy, speed, heading")
      .eq("ride_id", rideId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    if (driverLocation) {
      locations.driver = {
        lat: parseFloat(driverLocation.latitude),
        lng: parseFloat(driverLocation.longitude),
        timestamp: driverLocation.timestamp,
        accuracy: driverLocation.accuracy,
        speed: driverLocation.speed,
        heading: driverLocation.heading,
      }
    }

    // Get latest user/rider location
    const { data: userLocation } = await supabase
      .from("user_locations")
      .select("latitude, longitude, timestamp, accuracy, speed, heading")
      .eq("ride_id", rideId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    if (userLocation) {
      locations.rider = {
        lat: parseFloat(userLocation.latitude),
        lng: parseFloat(userLocation.longitude),
        timestamp: userLocation.timestamp,
        accuracy: userLocation.accuracy,
        speed: userLocation.speed,
        heading: userLocation.heading,
      }
    }

    return NextResponse.json({
      rideId,
      locations,
      status: ride.status,
      note: "This endpoint returns current location data. For real-time updates, use Supabase realtime subscriptions on driver_locations and user_locations tables.",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
