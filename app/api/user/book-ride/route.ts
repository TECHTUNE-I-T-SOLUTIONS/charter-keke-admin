import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      pickup_location, // { lat, lng, address }
      dropoff_location, // { lat, lng, address }
      pickup_time,
      estimated_distance, // in kilometers
      number_of_seats,
    } = body

    if (!pickup_location || !dropoff_location || !estimated_distance || !number_of_seats) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate fare: N600 per kilometer
    const base_fare_per_km = 600
    const fare_amount = estimated_distance * base_fare_per_km

    // Create ride record
    const { data: ride, error } = await supabaseAdmin
      .from("rides")
      .insert({
        rider_id: session.user.id,
        pickup_latitude: pickup_location.lat,
        pickup_longitude: pickup_location.lng,
        pickup_address: pickup_location.address,
        dropoff_latitude: dropoff_location.lat,
        dropoff_longitude: dropoff_location.lng,
        dropoff_address: dropoff_location.address,
        pickup_time: pickup_time || new Date().toISOString(),
        estimated_distance: estimated_distance,
        fare_amount: fare_amount,
        seats_booked: number_of_seats,
        status: "pending", // Waiting for driver to accept
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Failed to create ride:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      ride: {
        ...ride,
        fare_amount: fare_amount,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to book ride" },
      { status: 500 }
    )
  }
}
