import { supabaseAdmin } from "@/lib/supabase"
import { emitRideAccepted, emitRideTaken } from "@/lib/push-emitters"

export type RideAcceptanceSource = "app" | "sms"

interface AcceptRideInput {
  rideId: string
  driverUserId: string
  source: RideAcceptanceSource
}

interface AcceptRideResult {
  success: boolean
  status: number
  code: "accepted" | "ride_not_found" | "driver_not_found" | "ride_unavailable" | "internal_error"
  message: string
  ride?: any
}

export async function acceptRideFirstCome(input: AcceptRideInput): Promise<AcceptRideResult> {
  try {
    if (!supabaseAdmin) {
      return {
        success: false,
        status: 500,
        code: "internal_error",
        message: "Database client not initialized",
      }
    }

    const { data: driver, error: driverError } = await supabaseAdmin
      .from("drivers")
      .select("id, user_id")
      .eq("user_id", input.driverUserId)
      .single()

    if (driverError || !driver) {
      return {
        success: false,
        status: 404,
        code: "driver_not_found",
        message: "Driver profile not found",
      }
    }

    const now = new Date().toISOString()

    const { data: updatedRide, error: updateError } = await supabaseAdmin
      .from("rides")
      .update({
        status: "accepted",
        driver_id: driver.id,
        updated_at: now,
      })
      .eq("id", input.rideId)
      .in("status", ["pending", "dispatched"])
      .is("driver_id", null)
      .select("*")
      .maybeSingle()

    if (updateError) {
      console.error("[RideAcceptance] update error:", updateError)
      return {
        success: false,
        status: 500,
        code: "internal_error",
        message: "Failed to accept ride",
      }
    }

    if (!updatedRide) {
      const { data: existingRide } = await supabaseAdmin
        .from("rides")
        .select("id")
        .eq("id", input.rideId)
        .maybeSingle()

      if (!existingRide) {
        return {
          success: false,
          status: 404,
          code: "ride_not_found",
          message: "Ride not found",
        }
      }

      return {
        success: false,
        status: 409,
        code: "ride_unavailable",
        message: "Ride is no longer available",
      }
    }

    const { data: driverUser } = await supabaseAdmin
      .from("users")
      .select("first_name, last_name, phone_number")
      .eq("id", input.driverUserId)
      .single()

    const driverName = driverUser
      ? `${driverUser.first_name || ""} ${driverUser.last_name || ""}`.trim() || "Driver"
      : "Driver"

    const driverPhone = driverUser?.phone_number || ""
    const fare = Number((updatedRide as any).fare_amount ?? (updatedRide as any).fare ?? 0)

    await supabaseAdmin.from("ride_dispatch_logs").insert([
      {
        ride_id: input.rideId,
        driver_id: driver.id,
        dispatch_method: input.source,
        response: "accepted",
        created_at: now,
      },
    ])

    try {
      await emitRideAccepted(
        updatedRide.rider_id,
        input.driverUserId,
        input.rideId,
        driverName,
        driverPhone,
        "Keke Tricycle",
        5,
        updatedRide.pickup_zone,
        updatedRide.destination_zone,
        fare
      )

      await emitRideTaken(input.rideId)
    } catch (notificationError) {
      console.error("[RideAcceptance] notification error:", notificationError)
    }

    return {
      success: true,
      status: 200,
      code: "accepted",
      message: "Ride accepted successfully",
      ride: updatedRide,
    }
  } catch (error) {
    console.error("[RideAcceptance] unexpected error:", error)
    return {
      success: false,
      status: 500,
      code: "internal_error",
      message: "Internal server error",
    }
  }
}
