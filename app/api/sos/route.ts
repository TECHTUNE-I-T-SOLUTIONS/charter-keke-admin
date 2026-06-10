import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { notifyAdmins } from "@/lib/admin-notifications"

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const session = await getSessionFromRequest(request)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const location = body?.location && typeof body.location === "object" ? body.location : {}
    const address = body?.address && typeof body.address === "object" ? body.address : {}
    const device = body?.device && typeof body.device === "object" ? body.device : {}

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, email, phone_number, role")
      .eq("id", session.user.id)
      .single()

    const role = user?.role || session.user.role || null
    const userName = `${user?.first_name || session.user.firstName || ""} ${user?.last_name || session.user.lastName || ""}`.trim() || "Charter Keke user"

    let activeRide: any = null
    if (role === "driver") {
      const { data: driver } = await supabaseAdmin.from("drivers").select("id").eq("user_id", session.user.id).maybeSingle()
      if (driver?.id) {
        const { data } = await supabaseAdmin
          .from("rides")
          .select("id, status, rider_id, assigned_driver_id, pickup_zone, destination_zone")
          .eq("assigned_driver_id", session.user.id)
          .in("status", ["accepted", "in_progress", "dispatched"])
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle()
        activeRide = data
      }
    } else {
      const { data } = await supabaseAdmin
        .from("rides")
        .select("id, status, rider_id, assigned_driver_id, pickup_zone, destination_zone")
        .eq("rider_id", session.user.id)
        .in("status", ["pending", "accepted", "in_progress", "dispatched"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      activeRide = data
    }

    let driverUser: any = null
    if (activeRide?.assigned_driver_id) {
      const { data } = await supabaseAdmin
        .from("users")
        .select("id, first_name, last_name, phone_number")
        .eq("id", activeRide.assigned_driver_id)
        .maybeSingle()
      driverUser = data
    }

    const latitude = Number(location.latitude ?? location.lat)
    const longitude = Number(location.longitude ?? location.lng)

    const { data: alert, error } = await supabaseAdmin
      .from("sos_alerts")
      .insert({
        user_id: session.user.id,
        user_role: role,
        user_name: userName,
        user_email: user?.email || null,
        user_phone: user?.phone_number || null,
        latitude: Number.isFinite(latitude) ? latitude : null,
        longitude: Number.isFinite(longitude) ? longitude : null,
        accuracy: Number.isFinite(Number(location.accuracy)) ? Number(location.accuracy) : null,
        altitude: Number.isFinite(Number(location.altitude)) ? Number(location.altitude) : null,
        heading: Number.isFinite(Number(location.heading)) ? Number(location.heading) : null,
        speed: Number.isFinite(Number(location.speed)) ? Number(location.speed) : null,
        full_address: text(address.fullAddress) || text(address.address) || text(body?.fullAddress),
        street: text(address.street),
        place_name: text(address.placeName) || text(address.name),
        city: text(address.city),
        region: text(address.region),
        country: text(address.country),
        postal_code: text(address.postalCode),
        active_ride_id: activeRide?.id || null,
        active_ride_status: activeRide?.status || null,
        active_ride_note: activeRide ? `${activeRide.pickup_zone || "Unknown pickup"} to ${activeRide.destination_zone || "Unknown destination"}` : "No active ride found at SOS time",
        driver_user_id: driverUser?.id || null,
        driver_name: driverUser ? `${driverUser.first_name || ""} ${driverUser.last_name || ""}`.trim() : null,
        driver_phone: driverUser?.phone_number || null,
        device_name: text(device.deviceName) || text(device.name),
        device_brand: text(device.brand),
        device_model: text(device.modelName) || text(device.model),
        os_name: text(device.osName),
        os_version: text(device.osVersion),
        app_version: text(device.appVersion),
        raw_location: location,
        raw_device: device,
        metadata: {
          source: body?.source || "mobile_app",
          note: body?.note || null,
        },
      })
      .select("*")
      .single()

    if (error || !alert) {
      return NextResponse.json({ error: error?.message || "Failed to create SOS alert" }, { status: 400 })
    }

    await notifyAdmins({
      allAdmins: true,
      department: "support",
      title: "SOS alert triggered",
      body: `${userName} triggered SOS${alert.full_address ? ` at ${alert.full_address}` : ""}.`,
      type: "sos_alert",
      actionUrl: `/admin/sos?alert=${alert.id}`,
      metadata: { sosAlertId: alert.id, userId: session.user.id, activeRideId: alert.active_ride_id },
      sourceEventId: `sos_alert:${alert.id}`,
      persist: false,
    })

    return NextResponse.json({ success: true, alert }, { status: 201 })
  } catch (error) {
    console.error("[SOS][POST]", error)
    return NextResponse.json({ error: "Failed to send SOS alert" }, { status: 500 })
  }
}
