import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

// Platform fee: 13% of each ride amount
const PLATFORM_FEE_PERCENTAGE = 0.13

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeframe = searchParams.get("timeframe") || "day" // day, week, month, all

    // Calculate date range
    let startDate = new Date()
    switch (timeframe) {
      case "day":
        startDate.setDate(startDate.getDate() - 1)
        break
      case "week":
        startDate.setDate(startDate.getDate() - 7)
        break
      case "month":
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case "all":
        startDate = new Date("2000-01-01")
        break
    }

    // Get driver record
    const { data: driver, error: driverError } = await supabaseAdmin
      .from("drivers")
      .select("id, user_id, bank_account_number, bank_name")
      .eq("user_id", session.user.id)
      .single()

    if (driverError) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Get all rides accepted by this driver in the timeframe
    const { data: rides, error: ridesError } = await supabaseAdmin
      .from("rides")
      .select("id, fare_amount, status, created_at")
      .eq("driver_id", driver.id)
      .gte("created_at", startDate.toISOString())
      .in("status", ["accepted", "in_progress", "completed"])

    if (ridesError) {
      return NextResponse.json({ error: ridesError.message }, { status: 400 })
    }

    // Calculate earnings: Driver pays platform 13% per ride
    let totalRideAmount = 0
    let totalPlatformFee = 0

    rides?.forEach((ride) => {
      totalRideAmount += ride.fare_amount
      const platformFee = Math.round(ride.fare_amount * PLATFORM_FEE_PERCENTAGE)
      totalPlatformFee += platformFee
    })

    return NextResponse.json({
      earnings: {
        timeframe,
        total_rides_accepted: rides?.length || 0,
        total_ride_earnings: totalRideAmount, // What riders paid
        platform_fee_percentage: PLATFORM_FEE_PERCENTAGE * 100, // 13%
        total_platform_fee: totalPlatformFee, // What driver owes platform
        driver_net_amount: totalRideAmount - totalPlatformFee, // What driver keeps
        driver_payable_to_platform: totalPlatformFee, // For Paystack payment
        driver_bank_details: {
          account_number: driver.bank_account_number,
          bank_name: driver.bank_name,
        },
      },
    })

    // Get transaction history
    const { data: wallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    const { data: transactions } = await supabase
      .from("transactions")
      .select("id, amount, transaction_type, source, created_at, description")
      .eq("wallet_id", wallet?.id)
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: false })

    const periodEarnings = (ridesData || []).reduce(
      (sum, ride) => sum + (ride.driver_earnings || 0),
      0
    )

    return NextResponse.json({
      earnings: {
        total: driverData?.total_earnings || 0,
        period: periodEarnings,
        timeframe,
        completedRides: driverData?.total_rides_completed || 0,
        averageRating: driverData?.average_rating || 0,
      },
      transactions: transactions || [],
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    )
  }
}
