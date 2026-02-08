import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/drivers/[id]/settlements
 * Check today's settlement status for a driver
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: driverId } = await params

    if (!driverId) {
      return NextResponse.json({ error: "Driver ID is required" }, { status: 400 })
    }

    // Get today's date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch today's settlement for this driver
    const { data: settlement, error: settlementError } = await supabase
      .from("driver_daily_settlement")
      .select("settlement_status")
      .eq("driver_id", driverId)
      .gte("settlement_date", today.toISOString().split("T")[0])
      .lte("settlement_date", today.toISOString().split("T")[0])
      .single()

    if (settlementError && settlementError.code !== "PGRST116") {
      console.error("Settlement fetch error:", settlementError)
      return NextResponse.json({ error: "Failed to fetch settlement" }, { status: 500 })
    }

    // If no settlement found, default to "pending"
    const status = settlement?.settlement_status || "pending"

    return NextResponse.json({ status }, { status: 200 })
  } catch (error) {
    console.error("Error fetching settlement:", error)
    return NextResponse.json(
      { error: "Failed to fetch settlement status" },
      { status: 500 }
    )
  }
}
