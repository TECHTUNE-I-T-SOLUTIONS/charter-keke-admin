import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { rideId } = await request.json()

    if (!rideId) {
      return NextResponse.json({ error: "Ride ID is required" }, { status: 400 })
    }

    // Get the ride and verify driver
    const { data: ride, error: rideError } = await supabaseAdmin
      .from("rides")
      .select("id, driver_id, fare_amount, rider_id")
      .eq("id", rideId)
      .eq("driver_id", session.user.id)
      .single()

    if (rideError || !ride) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 })
    }

    // Update ride status to completed
    const { data: updatedRide, error: updateError } = await supabaseAdmin
      .from("rides")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    // Update driver status to online (available)
    await supabaseAdmin
      .from("drivers")
      .update({ availability_status: "online" })
      .eq("user_id", session.user.id)

    // Get driver details for the rider
    const { data: driverProfile } = await supabaseAdmin
      .from("drivers")
      .select("user_id, users:user_id (first_name, last_name, phone_number, profile_picture_url)")
      .eq("user_id", session.user.id)
      .single()

    // Get driver's bank details
    const { data: driverBankDetails } = await supabaseAdmin
      .from("drivers")
      .select("bank_name, bank_account_number")
      .eq("user_id", session.user.id)
      .single()

    return NextResponse.json({
      ride: updatedRide,
      driver_details: {
        name: `${driverProfile?.users?.first_name} ${driverProfile?.users?.last_name}`,
        phone: driverProfile?.users?.phone_number,
        profile_picture: driverProfile?.users?.profile_picture_url,
        bank_name: driverBankDetails?.bank_name,
        bank_account: driverBankDetails?.bank_account_number,
        amount_to_pay: ride.fare_amount,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      { error: "Failed to complete ride" },
      { status: 500 }
    )
  }
}
