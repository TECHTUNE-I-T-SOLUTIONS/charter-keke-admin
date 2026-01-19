import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get driver
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!driver) {
      return NextResponse.json(
        { error: "Driver profile not found" },
        { status: 404 }
      )
    }

    // Fetch completed rides stats
    const { data: rides } = await supabase
      .from("rides")
      .select(
        `
        fare_amount,
        driver_earnings,
        platform_fee,
        distance_km,
        rating
      `
      )
      .eq("driver_id", driver.id)
      .eq("status", "completed")

    if (!rides || rides.length === 0) {
      return NextResponse.json({
        stats: {
          totalRides: 0,
          totalEarnings: 0,
          totalPlatformFees: 0,
          averageRating: 0,
          totalDistance: 0,
        },
      })
    }

    // Calculate stats
    const stats = {
      totalRides: rides.length,
      totalEarnings: rides.reduce((sum: number, ride: any) => sum + (ride.driver_earnings || 0), 0),
      totalPlatformFees: rides.reduce((sum: number, ride: any) => sum + (ride.platform_fee || 0), 0),
      averageRating: rides.filter((r: any) => r.rating).length > 0
        ? rides.reduce((sum: number, ride: any) => sum + (ride.rating || 0), 0) /
          rides.filter((r: any) => r.rating).length
        : 0,
      totalDistance: rides.reduce((sum: number, ride: any) => sum + (ride.distance_km || 0), 0),
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Stats fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
