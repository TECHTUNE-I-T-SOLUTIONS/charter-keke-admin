import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/admin/drivers/[id]/deactivate
 * Deactivate a driver until settlement is paid
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: driverId } = await params

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    // Get the driver's user_id
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("user_id")
      .eq("id", driverId)
      .single()

    if (driverError) {
      console.error("Driver fetch error:", driverError)
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Update user status to suspended
    const { error: updateError } = await supabase
      .from("users")
      .update({
        status: "suspended",
        updated_at: new Date().toISOString(),
      })
      .eq("id", driver.user_id)

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json(
        { error: "Failed to deactivate driver" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: "Driver deactivated successfully", status: "suspended" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error deactivating driver:", error)
    return NextResponse.json(
      { error: "Failed to deactivate driver" },
      { status: 500 }
    )
  }
}
