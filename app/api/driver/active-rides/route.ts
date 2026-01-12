import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get driver's active rides (in_progress or accepted)
    const { data: rides, error } = await supabase
      .from("rides")
      .select(
        `
        id,
        rider_id,
        pickup_zone,
        pickup_description,
        destination_zone,
        destination_description,
        fare_amount,
        driver_earnings,
        seats_booked,
        status,
        pickup_time,
        created_at,
        users:rider_id (id, first_name, last_name, phone_number, profile_picture_url)
      `
      )
      .eq("driver_id", session.user.id)
      .in("status", ["accepted", "in_progress"])
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Active rides fetch error:", error)
      return NextResponse.json(
        { error: "Failed to fetch rides" },
        { status: 500 }
      )
    }

    return NextResponse.json({ rides: rides || [] }, { status: 200 })
  } catch (error) {
    console.error("Get active rides error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
