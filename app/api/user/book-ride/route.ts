import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"
import { notifyDriverAboutRide } from "@/lib/notifications"
import { emitRideRequest, emitRideUpdate } from "@/lib/push-emitters"
import { sendRideRequestSMS } from "@/lib/termii"

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

    // Find available drivers in the pickup zone
    const pickupZone = pickup_location.address
    const destinationZone = dropoff_location.address

    const { data: zoneDrivers } = await supabaseAdmin
      .from("drivers")
      .select("id, user_id")
      .contains("operating_zones", [pickupZone])
      .eq("availability_status", "online")
      .eq("verified", true)
      .limit(5)

    let drivers = zoneDrivers || []

    if (drivers.length === 0) {
      console.log("[RideDispatch] No zone-matched drivers found, using online fallback", {
        pickupZone,
      })

      const { data: fallbackDrivers } = await supabaseAdmin
        .from("drivers")
        .select("id, user_id")
        .eq("availability_status", "online")
        .eq("verified", true)
        .limit(5)

      drivers = fallbackDrivers || []
    }

    console.log("[RideDispatch] Candidate drivers count", {
      rideId: ride.id,
      count: drivers.length,
      pickupZone,
    })

    // Existing push flow stays intact
    await emitRideRequest(
      ride.id,
      pickupZone,
      destinationZone,
      Number(final_fare_amount || 0),
      Number(estimated_distance || 0)
    )

    await emitRideUpdate(
      session.user.id,
      ride.id,
      "status",
      `Your ride request from ${pickupZone} to ${destinationZone} has been created successfully.`
    )

    // Additional SMS + in-app dispatch logs/notifications
    if (drivers && drivers.length > 0) {
      const driverUserIds = drivers.map((driver: any) => driver.user_id)

      const { data: driverUsers } = await supabaseAdmin
        .from("users")
        .select("id, phone_number")
        .in("id", driverUserIds)

      const phoneByUserId = new Map<string, string>()
      for (const user of driverUsers || []) {
        if (user.phone_number) {
          phoneByUserId.set(user.id, user.phone_number)
        }
      }

      const smsTasks: Promise<any>[] = []

      for (const driver of drivers) {
        await notifyDriverAboutRide(driver.user_id, ride.id, pickupZone, destinationZone)

        await supabaseAdmin.from("ride_dispatch_logs").insert([
          {
            ride_id: ride.id,
            driver_id: driver.id,
            dispatch_method: "push",
            created_at: new Date().toISOString(),
          },
        ])

        const driverPhone = phoneByUserId.get(driver.user_id)
        if (driverPhone) {
          smsTasks.push(
            sendRideRequestSMS({
              to: driverPhone,
              rideId: ride.id,
              pickup: pickupZone,
              destination: destinationZone,
              fare: Number(final_fare_amount || 0),
            }).then(() =>
              supabaseAdmin.from("ride_dispatch_logs").insert([
                {
                  ride_id: ride.id,
                  driver_id: driver.id,
                  dispatch_method: "sms",
                  created_at: new Date().toISOString(),
                },
              ])
            )
          )
        }
      }

      const smsResults = await Promise.allSettled(smsTasks)
      let smsSuccessCount = 0
      for (const result of smsResults) {
        if (result.status === "rejected") {
          console.error("SMS dispatch failed:", result.reason)
        } else {
          smsSuccessCount += 1
        }
      }

      console.log("[RideDispatch] SMS dispatch summary", {
        rideId: ride.id,
        attempted: smsTasks.length,
        successful: smsSuccessCount,
      })

      await supabaseAdmin
        .from("rides")
        .update({ status: "dispatched", updated_at: new Date().toISOString() })
        .eq("id", ride.id)
    } else {
      console.log("[RideDispatch] No online verified drivers available for dispatch", {
        rideId: ride.id,
        pickupZone,
      })
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
