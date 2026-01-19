import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

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
