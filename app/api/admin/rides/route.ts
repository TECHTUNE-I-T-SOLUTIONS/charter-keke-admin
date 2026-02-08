import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/rides
 * Fetch rides list with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || ""
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Fetch rides with basic info
    let ridesQuery = supabase
      .from("rides")
      .select(
        `
        id,
        rider_id,
        driver_id,
        pickup_zone,
        destination_zone,
        ride_type,
        fare_amount,
        driver_earnings,
        platform_fee,
        status,
        rating,
        created_at,
        completed_at
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add status filter
    if (status && status !== "all") {
      ridesQuery = ridesQuery.eq("status", status)
    }

    const { data: ridesData, error: ridesError, count } = await ridesQuery

    if (ridesError) {
      console.error("Rides fetch error:", ridesError)
      return NextResponse.json({ error: "Failed to fetch rides" }, { status: 500 })
    }

    if (!ridesData || ridesData.length === 0) {
      return NextResponse.json(
        {
          rides: [],
          count: 0,
        },
        { status: 200 }
      )
    }

    // Get rider and driver IDs
    const riderIds = [...new Set(ridesData.map((r: any) => r.rider_id))]
    const driverIds = [...new Set(ridesData.map((r: any) => r.driver_id).filter(Boolean))]

    // Fetch rider and driver details separately
    const [{ data: riders }, { data: driversData }] = await Promise.all([
      supabase.from("users").select("id, first_name, last_name, phone_number").in("id", riderIds),
      driverIds.length > 0
        ? supabase
            .from("drivers")
            .select("id, user_id")
            .in("id", driverIds)
            .then(async (result) => {
              if (result.data) {
                const userIds = result.data.map((d: any) => d.user_id)
                const { data: driverUsers } = await supabase
                  .from("users")
                  .select("id, first_name, last_name")
                  .in("id", userIds)
                return { data: result.data.map((d: any) => ({ ...d, users: driverUsers?.find((u: any) => u.id === d.user_id) })) }
              }
              return result
            })
        : Promise.resolve({ data: [] }),
    ])

    // Create lookup maps
    const riderMap = new Map(riders?.map((r: any) => [r.id, r]) || [])
    const driverMap = new Map(driversData?.map((d: any) => [d.id, d]) || [])

    // Flatten and combine data
    const rides = ridesData.map((ride: any) => {
      const rider = riderMap.get(ride.rider_id)
      const driver = driverMap.get(ride.driver_id)

      return {
        id: ride.id,
        rider_first_name: rider?.first_name || "",
        rider_last_name: rider?.last_name || "",
        driver_first_name: driver?.users?.first_name || "",
        driver_last_name: driver?.users?.last_name || "",
        pickup_zone: ride.pickup_zone,
        destination_zone: ride.destination_zone,
        ride_type: ride.ride_type,
        estimated_fare: ride.fare_amount || 0,
        driver_earnings: ride.driver_earnings || 0,
        platform_fee: ride.platform_fee || 0,
        status: ride.status,
        rating: ride.rating,
        created_at: ride.created_at,
        completed_at: ride.completed_at,
      }
    })

    return NextResponse.json(
      {
        rides,
        count: count || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Rides error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
