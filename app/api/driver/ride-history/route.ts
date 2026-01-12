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
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Get driver's completed/cancelled rides
    const { data: rides, error, count } = await supabase
      .from("rides")
      .select(
        `
        id,
        rider_id,
        pickup_zone,
        destination_zone,
        fare_amount,
        driver_earnings,
        status,
        rating,
        review,
        pickup_time,
        dropoff_time,
        distance_km,
        duration_minutes,
        completed_at,
        created_at,
        users:rider_id (id, first_name, last_name, profile_picture_url)
      `,
        { count: "exact" }
      )
      .eq("driver_id", session.user.id)
      .in("status", ["completed", "cancelled"])
      .order("completed_at", { ascending: false, nullsFirst: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Failed to fetch ride history:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      rides: rides || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch ride history" },
      { status: 500 }
    )
  }
}
