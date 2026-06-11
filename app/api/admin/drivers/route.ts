import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { requireAdminSession, isSuperAdminUser } from "@/lib/admin-access"
import bcrypt from "bcryptjs"

/**
 * GET /api/admin/drivers
 * Fetch drivers list with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminSession(request)
    const department = String(access.admin?.department || "").toLowerCase()
    const canViewDrivers =
      access.authorized &&
      (isSuperAdminUser(access.session?.user, access.admin) ||
        ["hr", "human_resources", "operations", "driver_management"].includes(department))

    if (!canViewDrivers) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const verified = searchParams.get("verified")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Fetch drivers without user data first
    let driverQuery = supabaseAdmin
      .from("drivers")
      .select(
        `
        id,
        user_id,
        vehicle_type,
        plate_number,
        verified,
        average_rating,
        total_rides_completed,
        total_earnings,
        created_at
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add verification filter
    if (verified !== null && verified !== undefined && verified !== "") {
      driverQuery = driverQuery.eq("verified", verified === "true")
    }

    // Add search filter
    if (search) {
      driverQuery = driverQuery.or(
        `plate_number.ilike.%${search}%,vehicle_type.ilike.%${search}%`
      )
    }

    const { data: driversData, error: driverError, count } = await driverQuery

    if (driverError) {
      console.error("Drivers fetch error:", driverError)
      return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 })
    }

    console.log(`Fetched ${driversData?.length || 0} drivers from database`)

    if (!driversData || driversData.length === 0) {
      return NextResponse.json(
        {
          drivers: [],
          count: 0,
        },
        { status: 200 }
      )
    }

    // Get user IDs and fetch user details
    const userIds = driversData.map((d: any) => d.user_id)
    const { data: users, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, phone_number, profile_picture_url")
      .in("id", userIds)

    if (userError) {
      console.error("Users fetch error:", userError)
      return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 })
    }

    // Create user lookup map
    const userMap = new Map(users?.map((u: any) => [u.id, u]) || [])

    // Get driver IDs for earnings calculation
    const driverIds = driversData.map((d: any) => d.id)

    // Calculate earnings per driver from rides
    const earningsMap = new Map<string, number>()
    const ridesCountMap = new Map<string, number>()

    // Fetch all rides for these drivers
    if (driverIds && driverIds.length > 0) {
      const { data: rides, error: ridesError } = await supabaseAdmin
        .from("rides")
        .select("id, driver_id, driver_earnings, status, created_at")
        .in("driver_id", driverIds)

      console.log(`Fetched ${rides?.length || 0} rides for ${driverIds.length} drivers`)

      if (ridesError) {
        console.error("Rides fetch error:", ridesError)
      } else if (rides && rides.length > 0) {
        // Sum earnings from rides with accepted, in_progress, completed, or dispatched status
        rides.forEach((ride: any) => {
          const status = (ride.status || "").toLowerCase()
          // Include accepted, in_progress, completed, and dispatched rides
          const validStatuses = ["accepted", "in_progress", "completed", "dispatched"]
          
          if (validStatuses.includes(status)) {
            const earningsAmount = ride.driver_earnings 
              ? parseFloat(ride.driver_earnings.toString()) 
              : 0
            
            // Add earnings even if 0, to ensure driver is counted
            const current = earningsMap.get(ride.driver_id) || 0
            earningsMap.set(ride.driver_id, current + earningsAmount)
            ridesCountMap.set(ride.driver_id, (ridesCountMap.get(ride.driver_id) || 0) + 1)
            console.log(`Driver ${ride.driver_id}: +${earningsAmount} from ride ${ride.id} (status: ${ride.status})`)
          }
        })
        console.log(`Calculated earnings for ${earningsMap.size} drivers`)
      }
    }

    // Flatten and combine data
    const drivers = driversData.map((driver: any) => {
      const user = userMap.get(driver.user_id)
      // Use calculated earnings from rides, with fallback
      const calculatedEarnings = earningsMap.get(driver.id) || 0
      const calculatedRides = ridesCountMap.get(driver.id) || 0
      const storedEarnings = driver.total_earnings ? parseFloat(driver.total_earnings.toString()) : 0
      const storedRides = Number(driver.total_rides_completed || 0)
      const earnings = calculatedEarnings > storedEarnings ? calculatedEarnings : storedEarnings
      const ridesCompleted = Math.max(calculatedRides, storedRides)
      
      console.log(`Driver ${driver.id} (${user?.first_name}): calculated=${calculatedEarnings}, stored=${storedEarnings}, final=${earnings}`)
      
      return {
        id: driver.id,
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        phone_number: user?.phone_number || "",
        profile_picture_url: user?.profile_picture_url || "",
        vehicle_type: driver.vehicle_type,
        plate_number: driver.plate_number,
        verified: driver.verified,
        avg_rating: driver.average_rating || 0,
        rides_completed: ridesCompleted,
        earnings: earnings,
        created_at: driver.created_at,
      }
    })

    return NextResponse.json(
      {
        drivers,
        count: count || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Drivers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminSession(request)
    const department = String(access.admin?.department || "").toLowerCase()
    const canManageDrivers =
      access.authorized &&
      (isSuperAdminUser(access.session?.user, access.admin) ||
        ["hr", "human_resources", "operations", "driver_management"].includes(department))

    if (!canManageDrivers) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const firstName = String(body?.firstName || "").trim()
    const lastName = String(body?.lastName || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const phone = String(body?.phone || "").trim()
    const password = String(body?.password || "").trim()
    const vehicleType = String(body?.vehicleType || "keke").trim()
    const plateNumber = String(body?.plateNumber || "").trim().toUpperCase()

    if (!firstName || !lastName || !email || !phone || !password || !plateNumber) {
      return NextResponse.json({ error: "First name, last name, email, phone, password, and plate number are required" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        password_hash: passwordHash,
        role: "driver",
        status: "active",
        profile_complete: true,
        emergency_contact: body?.emergencyContact || null,
        emergency_phone: body?.emergencyPhone || null,
      })
      .select("id, first_name, last_name, email, phone_number, profile_picture_url")
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    const zones = Array.isArray(body?.operatingZones)
      ? body.operatingZones.map((zone: unknown) => String(zone).trim()).filter(Boolean)
      : String(body?.operatingZones || "")
          .split(",")
          .map((zone) => zone.trim())
          .filter(Boolean)

    const { data: driver, error: driverError } = await supabaseAdmin
      .from("drivers")
      .insert({
        user_id: user.id,
        vehicle_type: vehicleType,
        plate_number: plateNumber,
        operating_zones: zones,
        guarantor_name: body?.guarantorName || null,
        guarantor_phone: body?.guarantorPhone || null,
        guarantor_address: body?.guarantorAddress || null,
        bank_name: body?.bankName || null,
        bank_code: body?.bankCode || null,
        bank_account_number: body?.bankAccountNumber || null,
        account_name: body?.accountName || null,
        emergency_contact: body?.emergencyContact || null,
        identity_type: "nin",
        nin_number: body?.nin ? String(body.nin).replace(/\D/g, "") : null,
        identity_last4: body?.nin ? String(body.nin).replace(/\D/g, "").slice(-4) : null,
        identity_verification_status: body?.nin ? "pending" : "pending_details",
        identity_verification_provider: "manual_admin",
        verified: Boolean(body?.verified),
        availability_status: "offline",
      })
      .select("id, user_id, vehicle_type, plate_number, verified, average_rating, total_rides_completed, total_earnings, created_at")
      .single()

    if (driverError) {
      await supabaseAdmin.from("users").delete().eq("id", user.id)
      return NextResponse.json({ error: driverError.message }, { status: 400 })
    }

    return NextResponse.json({
      driver: {
        id: driver.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        profile_picture_url: user.profile_picture_url || "",
        vehicle_type: driver.vehicle_type,
        plate_number: driver.plate_number,
        verified: driver.verified,
        avg_rating: driver.average_rating || 0,
        rides_completed: driver.total_rides_completed || 0,
        earnings: driver.total_earnings || 0,
        created_at: driver.created_at,
      },
    }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN][DRIVERS][POST]", error)
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 })
  }
}
