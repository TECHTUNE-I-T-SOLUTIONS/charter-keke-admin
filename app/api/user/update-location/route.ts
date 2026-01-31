import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { rideId, latitude, longitude, accuracy, speed, heading } = body

    if (!rideId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "rideId, latitude, and longitude are required" },
        { status: 400 }
      )
    }

    // Verify user is assigned to this ride
    const { data: ride } = await supabase
      .from("rides")
      .select("id, status")
      .eq("id", rideId)
      .eq("rider_id", session.user.id)
      .single()

    if (!ride) {
      return NextResponse.json(
        { error: "Ride not found or not assigned to you" },
        { status: 404 }
      )
    }

    // Insert user location
    const { error: locationError } = await supabase
      .from("user_locations")
      .insert({
        id: crypto.randomUUID(),
        user_id: session.user.id,
        ride_id: rideId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        accuracy: accuracy ? parseFloat(accuracy) : null,
        speed: speed ? parseFloat(speed) : null,
        heading: heading ? parseFloat(heading) : null,
        timestamp: new Date().toISOString(),
      })

    if (locationError) {
      console.error("Location update error:", locationError)
      return NextResponse.json(
        { error: "Failed to update location" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Location updated successfully",
      location: {
        user_id: session.user.id,
        ride_id: rideId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
