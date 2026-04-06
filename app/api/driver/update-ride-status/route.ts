import { NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"
import { emitDriverArrived, emitRideCompleted, emitRideUpdate } from "@/lib/push-emitters"
import { sendPushNotification } from "@/lib/push-service"

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { rideId, status } = body

    if (!rideId || !status) {
      return NextResponse.json(
        { error: "Ride ID and status are required" },
        { status: 400 }
      )
    }

    if (!["in_progress", "completed"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
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

    // Get ride
    const { data: ride } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single()

    if (!ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 })
    }

    // Verify driver is the one who accepted the ride
    if (ride.driver_id !== driver.id) {
      return NextResponse.json(
        { error: "You are not assigned to this ride" },
        { status: 403 }
      )
    }

    // Verify ride status is valid for update
    if (status === "in_progress" && ride.status !== "accepted") {
      return NextResponse.json(
        { error: "Ride must be accepted first" },
        { status: 409 }
      )
    }

    if (status === "completed" && ride.status !== "in_progress") {
      return NextResponse.json(
        { error: "Ride must be in progress" },
        { status: 409 }
      )
    }

    // Update ride status
    const updateData: any = { status }
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }

    const { data: updatedRide, error } = await supabase
      .from("rides")
      .update(updateData)
      .eq("id", rideId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: "Failed to update ride status" },
        { status: 500 }
      )
    }

    // Send push notifications based on status
    try {
      if (status === "in_progress") {
        // Driver arrived at pickup
        const { data: driverUser } = await supabaseAdmin!
          .from("users")
          .select("first_name, last_name, phone_number")
          .eq("id", session.user.id)
          .single()

        const driverName = driverUser 
          ? `${driverUser.first_name} ${driverUser.last_name}` 
          : "Your Driver"

        // WebSocket notifications
        await emitDriverArrived(
          ride.rider_id,
          rideId,
          driverName,
          "Keke Tricycle"
        )

        await emitRideUpdate(
          session.user.id,
          rideId,
          "status",
          `You started trip ${rideId.slice(0, 8)} from ${ride.pickup_zone} to ${ride.destination_zone}.`
        )

        await emitRideUpdate(
          ride.rider_id,
          rideId,
          "status",
          `Your ride is now in progress from ${ride.pickup_zone} to ${ride.destination_zone}.`
        )

        // Push notification to rider
        await sendPushNotification([ride.rider_id], {
          title: "🚗 Driver Arrived",
          body: `${driverName} is on the way to pick you up`,
          type: "ride_update",
          data: {
            rideId,
            status: "in_progress",
            driverName,
            pickup: ride.pickup_zone,
            destination: ride.destination_zone,
          },
        })

        // Push notification to driver
        await sendPushNotification([session.user.id], {
          title: "🚗 Trip Started",
          body: `Trip ${rideId.slice(0, 8)} started. Heading to ${ride.pickup_zone}`,
          type: "ride_update",
          data: {
            rideId,
            status: "in_progress",
            pickup: ride.pickup_zone,
            destination: ride.destination_zone,
          },
        })
      } else if (status === "completed") {
        // Ride completed - send completion notification to rider
        await emitRideCompleted(
          ride.rider_id,
          session.user.id,
          rideId,
          updatedRide.fare || 0,
          updatedRide.rating
        )

        await emitRideUpdate(
          session.user.id,
          rideId,
          "status",
          `Trip ${rideId.slice(0, 8)} completed successfully. Final fare: ₦${updatedRide.fare || 0}.`
        )

        // Push notification to rider
        await sendPushNotification([ride.rider_id], {
          title: "✅ Ride Completed",
          body: `Trip completed. Fare: ₦${updatedRide.fare || 0}`,
          type: "ride_update",
          data: {
            rideId,
            status: "completed",
            fare: updatedRide.fare || 0,
          },
        })

        // Push notification to driver
        await sendPushNotification([session.user.id], {
          title: "✅ Ride Complete",
          body: `Trip ${rideId.slice(0, 8)} completed. Total fare: ₦${updatedRide.fare || 0}`,
          type: "ride_update",
          data: {
            rideId,
            status: "completed",
            fare: updatedRide.fare || 0,
          },
        })
      }
    } catch (notificationError) {
      console.error("Failed to send status notifications:", notificationError)
      // Don't fail the entire request if notifications fail
    }

    return NextResponse.json({
      success: true,
      ride: updatedRide,
    })
  } catch (error) {
    console.error("Update ride status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
