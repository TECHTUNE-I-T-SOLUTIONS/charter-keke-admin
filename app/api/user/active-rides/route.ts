import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get rider's active rides (pending, dispatched, accepted, in_progress)
    const { data: rides, error } = await supabase
      .from("rides")
      .select(
        `
        id,
        driver_id,
        pickup_zone,
        pickup_description,
        destination_zone,
        destination_description,
        fare_amount,
        seats_available,
        seats_booked,
        status,
        pickup_time,
        created_at,
        drivers:driver_id (id, user_id, vehicle_picture_url, plate_number, users:user_id (first_name, last_name, phone_number, profile_picture_url))
      `
      )
      .eq("rider_id", session.user.id)
      .in("status", ["pending", "dispatched", "accepted", "in_progress"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch active rides:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ rides: rides || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch active rides" },
      { status: 500 }
    )
  }
}
