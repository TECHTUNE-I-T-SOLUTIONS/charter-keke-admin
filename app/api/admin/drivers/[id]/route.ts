import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET /api/admin/drivers/[id]
 * Fetch detailed driver info with rides breakdown for earnings
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Unwrap the Promise params (Next.js 15+)
    const { id: driverId } = await params

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    // Fetch driver details
    const { data: driver, error: driverError } = await supabaseAdmin
      .from("drivers")
      .select(
        `
        id,
        user_id,
        vehicle_type,
        plate_number,
        operating_zones,
        union_name,
        bank_name,
        bank_account_number,
        account_name,
        emergency_contact,
        verified,
        vehicle_picture_url,
        license_picture_url,
        average_rating,
        total_rides_completed,
        total_earnings,
        created_at
      `
      )
      .or(`id.eq.${driverId},user_id.eq.${driverId}`)
      .single()

    if (driverError) {
      console.error("Driver fetch error:", driverError)
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Fetch user details
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, phone_number, profile_picture_url")
      .eq("id", driver.user_id)
      .single()

    if (userError) {
      console.error("User fetch error:", userError)
    }

    // Fetch all rides where driver_id matches and status is accepted, in_progress, or completed
    const { data: rides, error: ridesError } = await supabaseAdmin
      .from("rides")
      .select(
        `
        id,
        driver_earnings,
        status,
        created_at,
        completed_at
      `
      )
      .eq("driver_id", driver.id)
      .in("status", ["accepted", "in_progress", "completed"])
      .order("created_at", { ascending: false })

    if (ridesError) {
      console.error("Rides fetch error:", ridesError)
    }

    // Calculate earnings per day from rides
    const earningsMap: Record<string, { amount: number; rides: number }> = {}
    
    if (rides && rides.length > 0) {
      rides.forEach((ride: any) => {
        const date = new Date(ride.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
        if (!earningsMap[date]) {
          earningsMap[date] = { amount: 0, rides: 0 }
        }
        earningsMap[date].amount += parseFloat(ride.driver_earnings) || 0
        earningsMap[date].rides += 1
      })
    }

    // Convert to sorted array by date (newest first)
    const earningsPerDay = Object.entries(earningsMap)
      .map(([date, data]) => ({
        date,
        amount: data.amount,
        rides: data.rides,
        status: "completed", // Rides already completed
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const calculatedRides = (rides || []).length
    const calculatedEarnings = earningsPerDay.reduce((sum, day) => sum + day.amount, 0)
    const storedRides = Number(driver.total_rides_completed || 0)
    const storedEarnings = Number(driver.total_earnings || 0)

    return NextResponse.json(
      {
        driver: {
          id: driver.id,
          first_name: user?.first_name || "",
          last_name: user?.last_name || "",
          email: user?.email || "",
          phone_number: user?.phone_number || "",
          profile_picture_url: user?.profile_picture_url || "",
          vehicle_type: driver.vehicle_type,
          plate_number: driver.plate_number,
          operating_zones: driver.operating_zones || [],
          union_name: driver.union_name || "",
          bank_name: driver.bank_name || "",
          bank_account_number: driver.bank_account_number || "",
          account_name: driver.account_name || "",
          emergency_contact: driver.emergency_contact || "",
          vehicle_picture_url: driver.vehicle_picture_url || "",
          license_picture_url: driver.license_picture_url || "",
          verified: driver.verified,
          avg_rating: driver.average_rating || 0,
          rides_completed: Math.max(calculatedRides, storedRides),
          total_earnings: Math.max(calculatedEarnings, storedEarnings),
          created_at: driver.created_at,
          settlement_count: earningsPerDay.length,
          earnings_per_day: earningsPerDay,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching driver details:", error)
    return NextResponse.json(
      { error: "Failed to fetch driver details" },
      { status: 500 }
    )
  }
}
