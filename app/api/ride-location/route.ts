import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const rideId = searchParams.get("rideId")

    if (!rideId) {
      return NextResponse.json(
        { error: "rideId is required" },
        { status: 400 }
      )
    }

    // Get the ride to verify user/driver is involved
    const { data: ride } = await supabase
      .from("rides")
      .select("id, driver_id, rider_id, status")
      .eq("id", rideId)
      .single()

    if (!ride) {
      return NextResponse.json(
        { error: "Ride not found" },
        { status: 404 }
      )
    }

    // Check if user is the driver or the rider
    const isDriver = session.user.role === "driver"
    const isRider = session.user.role === "user"

    if (isDriver) {
      // Verify driver is assigned to this ride
      const { data: driver } = await supabase
        .from("drivers")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (!driver || driver.id !== ride.driver_id) {
        return NextResponse.json(
          { error: "Not authorized for this ride" },
          { status: 403 }
        )
      }
    } else if (isRider) {
      // Verify rider is the passenger for this ride
      if (session.user.id !== ride.rider_id) {
        return NextResponse.json(
          { error: "Not authorized for this ride" },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: "Invalid user role" },
        { status: 403 }
      )
    }

    // Fetch latest driver location
    const { data: driverLocation } = await supabase
      .from("driver_locations")
      .select("*")
      .eq("ride_id", rideId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    // Fetch latest user/rider location
    const { data: userLocation } = await supabase
      .from("user_locations")
      .select("*")
      .eq("ride_id", rideId)
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      driverLocation: driverLocation || null,
      userLocation: userLocation || null,
    })
  } catch (error) {
    console.error("Ride location fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
