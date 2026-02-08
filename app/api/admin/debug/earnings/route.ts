import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/debug/earnings
 * Debug endpoint to see what's in the rides and drivers tables
 */
export async function GET(request: NextRequest) {
  try {
    // Get count of rides
    const { count: ridesCount, data: sampleRides } = await supabase
      .from("rides")
      .select("id, driver_id, driver_earnings, status", { count: "exact" })
      .limit(5)

    // Get drivers with rides
    const { data: drivers } = await supabase
      .from("drivers")
      .select("id, user_id, total_earnings")
      .limit(5)

    // Get all rides for first driver
    let driverRidesData = null
    if (drivers && drivers.length > 0) {
      const { data: driverRides } = await supabase
        .from("rides")
        .select("id, driver_earnings, status")
        .eq("driver_id", drivers[0].id)
        .limit(10)

      driverRidesData = driverRides
    }

    return NextResponse.json(
      {
        ridesCount,
        sampleRides: sampleRides?.map(r => ({
          id: r.id,
          driver_id: r.driver_id,
          driver_earnings: r.driver_earnings,
          earnings_type: typeof r.driver_earnings,
          status: r.status,
        })),
        firstDriver: drivers?.[0],
        firstDriverRides: driverRidesData?.map(r => ({
          id: r.id,
          driver_earnings: r.driver_earnings,
          earnings_type: typeof r.driver_earnings,
          status: r.status,
        })),
        driversCount: drivers?.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json(
      { error: "Debug failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
