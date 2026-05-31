import { NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

/**
 * GET /api/admin/drivers/[id]/settlements
 * Fetch settlement summary and settlement rows for a driver.
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

    const { data: driver, error: driverError } = await supabaseAdmin
      .from("drivers")
      .select("id")
      .or(`id.eq.${driverId},user_id.eq.${driverId}`)
      .single()

    if (driverError || !driver?.id) {
      console.error("Driver settlement lookup error:", driverError)
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    const { data: settlements, error: settlementError } = await supabaseAdmin
      .from("driver_daily_settlement")
      .select(
        `
        id,
        settlement_date,
        total_rides,
        total_fare_amount,
        total_platform_fees,
        total_driver_earnings,
        settlement_status,
        payment_due_date,
        paid_at,
        created_at,
        updated_at
      `
      )
      .eq("driver_id", driver.id)
      .order("settlement_date", { ascending: false })

    if (settlementError) {
      console.error("Settlement fetch error:", settlementError)
      return NextResponse.json({ error: "Failed to fetch settlement" }, { status: 500 })
    }

    const rows = settlements || []
    const pending = rows.filter((row: any) => ["pending", "overdue"].includes(row.settlement_status))
    const paid = rows.filter((row: any) => row.settlement_status === "paid")
    const totalDue = pending.reduce((sum: number, row: any) => sum + Number(row.total_platform_fees || 0), 0)
    const totalPaid = paid.reduce((sum: number, row: any) => sum + Number(row.total_platform_fees || 0), 0)
    const status = pending.some((row: any) => row.settlement_status === "overdue")
      ? "overdue"
      : pending.length > 0
        ? "pending"
        : rows.length > 0
          ? "paid"
          : "none"

    return NextResponse.json(
      {
        status,
        summary: {
          totalDue,
          totalPaid,
          pendingCount: pending.length,
          paidCount: paid.length,
          settlementCount: rows.length,
        },
        settlements: rows,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error fetching settlement:", error)
    return NextResponse.json(
      { error: "Failed to fetch settlement status" },
      { status: 500 }
    )
  }
}
