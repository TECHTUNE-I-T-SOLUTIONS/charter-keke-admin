import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/revenue
 * Fetch revenue details from rides with accepted, in_progress, or completed status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || ""
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("rides")
      .select(
        `
        id,
        status,
        fare_amount,
        platform_fee,
        driver_earnings,
        created_at,
        completed_at,
        rider:rider_id(first_name, last_name, email),
        driver:driver_id(id, operating_zones),
        driver_profile:driver_id(user_id)
      `,
        { count: "exact" }
      )
      .in("status", ["accepted", "in_progress", "completed"])
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && ["accepted", "in_progress", "completed"].includes(status)) {
      query = query.eq("status", status)
    }

    const { data: rides, error, count } = await query

    if (error) {
      console.error("Revenue fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch revenue" }, { status: 500 })
    }

    // Calculate totals
    const totalFares = rides?.reduce((sum, ride) => sum + (ride.fare_amount ? parseFloat(ride.fare_amount.toString()) : 0), 0) || 0
    const totalPlatformFees = rides?.reduce((sum, ride) => sum + (ride.platform_fee ? parseFloat(ride.platform_fee.toString()) : 0), 0) || 0
    const totalDriverEarnings = rides?.reduce((sum, ride) => sum + (ride.driver_earnings ? parseFloat(ride.driver_earnings.toString()) : 0), 0) || 0

    // Calculate Easely's earnings (fares + platform fees - driver earnings)
    const easelsEarnings = totalFares + totalPlatformFees - totalDriverEarnings

    return NextResponse.json({
      rides: rides || [],
      count: count || 0,
      summary: {
        totalFares: Math.round(totalFares),
        totalPlatformFees: Math.round(totalPlatformFees),
        totalDriverEarnings: Math.round(totalDriverEarnings),
        easelsEarnings: Math.round(easelsEarnings),
      },
    })
  } catch (error) {
    console.error("Revenue error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
