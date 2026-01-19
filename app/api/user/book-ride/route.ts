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
      fare_amount,
      platform_fee,
      driver_earnings,
      seats_available,
    } = body

    if (!pickup_location || !dropoff_location || !estimated_distance || !number_of_seats) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Calculate fare: N600 per kilometer (if not provided)
    const base_fare_per_km = 600
    const final_fare_amount = fare_amount || estimated_distance * base_fare_per_km
    const final_platform_fee = platform_fee || final_fare_amount * 0.15
    const final_driver_earnings = driver_earnings || final_fare_amount * 0.85

    // Create ride record
    const { data: ride, error } = await supabaseAdmin
      .from("rides")
      .insert({
        rider_id: session.user.id,
        pickup_zone: pickup_location.address,
        pickup_description: `Lat: ${pickup_location.lat}, Lng: ${pickup_location.lng}`,
        destination_zone: dropoff_location.address,
        destination_description: `Lat: ${dropoff_location.lat}, Lng: ${dropoff_location.lng}`,
        pickup_time: pickup_time || new Date().toISOString(),
        distance_km: estimated_distance,
        fare_amount: final_fare_amount,
        platform_fee: final_platform_fee,
        driver_earnings: final_driver_earnings,
        seats_available: seats_available || 1,
        seats_booked: number_of_seats,
        ride_type: "single",
        status: "pending",
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
        fare_amount: final_fare_amount,
        platform_fee: final_platform_fee,
        driver_earnings: final_driver_earnings,
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
