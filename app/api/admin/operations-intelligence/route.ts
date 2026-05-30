import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

type Ride = {
  id: string
  rider_id?: string
  driver_id?: string | null
  pickup_zone?: string | null
  destination_zone?: string | null
  fare_amount?: number | null
  platform_fee?: number | null
  driver_earnings?: number | null
  distance_km?: number | null
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
  completed_at?: string | null
}

const money = (value: unknown) => Number(value || 0)
const label = (value?: string | null) => (value || "Unknown").trim() || "Unknown"
const isAccepted = (status?: string | null) => ["accepted", "in_progress", "completed"].includes((status || "").toLowerCase())
const isRejectedDemand = (status?: string | null) => ["pending", "dispatched", "cancelled"].includes((status || "").toLowerCase())

function increment(map: Map<string, any>, key: string, patch: Record<string, number | string>) {
  const current = map.get(key) || { name: key }
  for (const [field, value] of Object.entries(patch)) {
    current[field] = typeof value === "number" ? Number(current[field] || 0) + value : value
  }
  map.set(key, current)
}

function topRows(map: Map<string, any>, sortKey: string, limit = 12) {
  return Array.from(map.values())
    .sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0))
    .slice(0, limit)
}

export async function GET() {
  try {
    const since = new Date()
    since.setDate(since.getDate() - 30)

    const [
      ridesResult,
      driversResult,
      usersResult,
      subscriptionsResult,
      ticketsResult,
      paymentsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("rides")
        .select("id, rider_id, driver_id, pickup_zone, destination_zone, fare_amount, platform_fee, driver_earnings, distance_km, status, created_at, updated_at, completed_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(2500),
      supabaseAdmin
        .from("drivers")
        .select("id, user_id, vehicle_type, plate_number, verified, availability_status, average_rating, total_rides_completed, total_earnings, updated_at, created_at")
        .limit(2500),
      supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, email, phone_number, role, status, created_at")
        .limit(5000),
      supabaseAdmin
        .from("push_subscriptions")
        .select("id, user_id, platform, is_active, subscribed_at, last_verified_at")
        .eq("is_active", true)
        .limit(5000),
      supabaseAdmin
        .from("support_tickets")
        .select("id, status, priority, category, created_at, updated_at")
        .limit(1000),
      supabaseAdmin
        .from("driver_daily_settlement")
        .select("id, driver_id, settlement_status, total_platform_fees, settlement_date, payment_due_date")
        .limit(2500),
    ])

    if (ridesResult.error) throw ridesResult.error
    if (driversResult.error) throw driversResult.error
    if (usersResult.error) throw usersResult.error

    const rides = (ridesResult.data || []) as Ride[]
    const drivers = driversResult.data || []
    const users = usersResult.data || []
    const subscriptions = subscriptionsResult.data || []
    const tickets = ticketsResult.data || []
    const settlements = paymentsResult.data || []

    const userById = new Map(users.map((user: any) => [user.id, user]))
    const pickupMap = new Map<string, any>()
    const destinationMap = new Map<string, any>()
    const corridorMap = new Map<string, any>()
    const driverMap = new Map<string, any>()
    const dailyMap = new Map<string, any>()

    for (const driver of drivers as any[]) {
      const user: any = userById.get(driver.user_id) || {}
      driverMap.set(driver.id, {
        id: driver.id,
        userId: driver.user_id,
        name: `${user.first_name || ""} ${user.last_name || ""}`.trim() || driver.plate_number || "Unknown Driver",
        plateNumber: driver.plate_number || "N/A",
        verified: !!driver.verified,
        status: driver.availability_status || "offline",
        rating: Number(driver.average_rating || 0),
        accepted: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0,
        platformFees: 0,
        lastSeen: driver.updated_at || driver.created_at,
      })
    }

    for (const ride of rides) {
      const status = (ride.status || "unknown").toLowerCase()
      const pickup = label(ride.pickup_zone)
      const destination = label(ride.destination_zone)
      const fare = money(ride.fare_amount)
      const platformFee = money(ride.platform_fee)
      const day = (ride.created_at || "").slice(0, 10) || "unknown"

      increment(pickupMap, pickup, {
        bookings: 1,
        accepted: isAccepted(status) ? 1 : 0,
        unaccepted: isRejectedDemand(status) ? 1 : 0,
        completed: status === "completed" ? 1 : 0,
        cancelled: status === "cancelled" ? 1 : 0,
        revenue: fare,
        platformFees: platformFee,
      })
      increment(destinationMap, destination, {
        bookings: 1,
        accepted: isAccepted(status) ? 1 : 0,
        completed: status === "completed" ? 1 : 0,
        revenue: fare,
      })
      increment(corridorMap, `${pickup} -> ${destination}`, {
        bookings: 1,
        accepted: isAccepted(status) ? 1 : 0,
        cancelled: status === "cancelled" ? 1 : 0,
        revenue: fare,
      })
      increment(dailyMap, day, {
        bookings: 1,
        accepted: isAccepted(status) ? 1 : 0,
        completed: status === "completed" ? 1 : 0,
        cancelled: status === "cancelled" ? 1 : 0,
        revenue: fare,
        platformFees: platformFee,
      })

      if (ride.driver_id && driverMap.has(ride.driver_id)) {
        const driver = driverMap.get(ride.driver_id)
        driver.accepted += isAccepted(status) ? 1 : 0
        driver.completed += status === "completed" ? 1 : 0
        driver.cancelled += status === "cancelled" ? 1 : 0
        driver.revenue += money(ride.driver_earnings)
        driver.platformFees += platformFee
        driverMap.set(ride.driver_id, driver)
      }
    }

    const pickupDemand = topRows(pickupMap, "bookings").map((row) => ({
      ...row,
      acceptanceRate: row.bookings ? Math.round((row.accepted / row.bookings) * 100) : 0,
      nonAcceptanceRate: row.bookings ? Math.round((row.unaccepted / row.bookings) * 100) : 0,
    }))
    const destinationDemand = topRows(destinationMap, "bookings").map((row) => ({
      ...row,
      acceptanceRate: row.bookings ? Math.round((row.accepted / row.bookings) * 100) : 0,
    }))
    const corridors = topRows(corridorMap, "bookings").map((row) => ({
      ...row,
      acceptanceRate: row.bookings ? Math.round((row.accepted / row.bookings) * 100) : 0,
    }))
    const driverPerformance = Array.from(driverMap.values())
      .map((driver) => ({
        ...driver,
        acceptanceShare: rides.length ? Math.round((driver.accepted / rides.length) * 100) : 0,
        completionRate: driver.accepted ? Math.round((driver.completed / driver.accepted) * 100) : 0,
      }))
      .sort((a, b) => b.accepted - a.accepted)

    const activeDrivers = driverPerformance.filter((driver) => driver.status === "online" || driver.status === "busy").length
    const completedRides = rides.filter((ride) => ride.status === "completed").length
    const acceptedRides = rides.filter((ride) => isAccepted(ride.status)).length
    const cancelledRides = rides.filter((ride) => ride.status === "cancelled").length
    const platformFees = rides.reduce((sum, ride) => sum + money(ride.platform_fee), 0)
    const grossRevenue = rides.reduce((sum, ride) => sum + money(ride.fare_amount), 0)
    const overdueSettlements = settlements.filter((settlement: any) => settlement.settlement_status === "overdue")

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      windowDays: 30,
      summary: {
        rides: rides.length,
        acceptedRides,
        completedRides,
        cancelledRides,
        acceptanceRate: rides.length ? Math.round((acceptedRides / rides.length) * 100) : 0,
        cancellationRate: rides.length ? Math.round((cancelledRides / rides.length) * 100) : 0,
        grossRevenue,
        platformFees,
        drivers: drivers.length,
        activeDrivers,
        verifiedDrivers: drivers.filter((driver: any) => driver.verified).length,
        riders: users.filter((user: any) => user.role === "user").length,
        activeDevices: subscriptions.length,
        openTickets: tickets.filter((ticket: any) => !["resolved", "closed"].includes(ticket.status)).length,
        overdueSettlements: overdueSettlements.length,
        overdueAmount: overdueSettlements.reduce((sum: number, item: any) => sum + money(item.total_platform_fees), 0),
      },
      demand: {
        pickup: pickupDemand,
        destination: destinationDemand,
        corridors,
        lowAcceptance: [...pickupDemand].sort((a, b) => b.nonAcceptanceRate - a.nonAcceptanceRate).slice(0, 8),
      },
      drivers: {
        topAccepted: driverPerformance.slice(0, 12),
        mostActive: [...driverPerformance].sort((a, b) => Number(new Date(b.lastSeen || 0)) - Number(new Date(a.lastSeen || 0))).slice(0, 12),
        needsReview: driverPerformance
          .filter((driver) => !driver.verified || driver.completionRate < 50 || driver.rating < 3)
          .slice(0, 12),
      },
      mobile: {
        devicesByPlatform: ["ios", "android", "web", "unknown"].map((platform) => ({
          name: platform,
          devices: subscriptions.filter((sub: any) => (sub.platform || "unknown") === platform).length,
        })),
        daily: Array.from(dailyMap.values()).sort((a, b) => String(a.name).localeCompare(String(b.name))),
      },
      moderation: {
        ticketsByStatus: ["open", "in_progress", "resolved", "closed"].map((status) => ({
          name: status,
          count: tickets.filter((ticket: any) => ticket.status === status).length,
        })),
        pendingDrivers: driverPerformance.filter((driver) => !driver.verified).slice(0, 12),
        overdueSettlements: overdueSettlements.slice(0, 12),
      },
    })
  } catch (error) {
    console.error("[OperationsIntelligence] error:", error)
    return NextResponse.json({ error: "Failed to load operations intelligence" }, { status: 500 })
  }
}
