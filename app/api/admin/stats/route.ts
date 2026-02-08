import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/stats
 * Fetch dashboard statistics: users, drivers, rides, revenue
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch total users by status
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, role, status", { count: "exact" })

    // Fetch total drivers
    const { data: drivers, error: driversError } = await supabase
      .from("drivers")
      .select("id, verified", { count: "exact" })

    // Fetch active rides
    const { data: rides, error: ridesError } = await supabase
      .from("rides")
      .select("id, status, fare_amount", { count: "exact" })
      .eq("status", "in_progress")

    // Fetch revenue from accepted, in_progress, and completed rides
    const { data: revenueRides, error: revenueError } = await supabase
      .from("rides")
      .select("fare_amount, platform_fee, status")
      .in("status", ["accepted", "in_progress", "completed"])

    // Fetch completed and cancelled rides for stats
    const { count: completedCount } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")

    const { count: cancelledCount } = await supabase
      .from("rides")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")

    if (usersError || driversError || ridesError || revenueError) {
      console.error("Stats fetch errors:", { usersError, driversError, ridesError, revenueError })
      return NextResponse.json(
        { error: "Failed to fetch stats" },
        { status: 500 }
      )
    }

    // Calculate stats
    const totalUsers = users?.length || 0
    const activeUsers = users?.filter((u) => u.status === "active").length || 0
    const pendingUsers = users?.filter((u) => u.status === "pending").length || 0
    const suspendedUsers = users?.filter((u) => u.status === "suspended").length || 0

    const totalDrivers = drivers?.length || 0
    const verifiedDrivers = drivers?.filter((d) => d.verified).length || 0

    const activeRides = rides?.length || 0

    // Calculate total revenue from accepted, in_progress, and completed rides
    const totalRevenue = revenueRides?.reduce((sum, ride) => {
      const fare = ride.fare_amount ? parseFloat(ride.fare_amount.toString()) : 0
      return sum + fare
    }, 0) || 0

    const totalPlatformFees = revenueRides?.reduce((sum, ride) => {
      const fee = ride.platform_fee ? parseFloat(ride.platform_fee.toString()) : 0
      return sum + fee
    }, 0) || 0

    return NextResponse.json(
      {
        users: {
          total: totalUsers,
          active: activeUsers,
          pending: pendingUsers,
          suspended: suspendedUsers,
        },
        drivers: {
          total: totalDrivers,
          verified: verifiedDrivers,
          pending: totalDrivers - verifiedDrivers,
        },
        rides: {
          active: activeRides,
          completed: completedCount || 0,
          cancelled: cancelledCount || 0,
        },
        revenue: {
          total: Math.round(totalRevenue),
          platformFees: Math.round(totalPlatformFees),
          fromAcceptedAndInProgress: Math.round(totalRevenue),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
