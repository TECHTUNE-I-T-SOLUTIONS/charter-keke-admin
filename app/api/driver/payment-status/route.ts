import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get("driver_id")

    if (!driverId) {
      return NextResponse.json(
        { error: "Driver ID required" },
        { status: 400 }
      )
    }

    // Get pending settlements with payment reminders
    const { data: settlements, error } = await supabase
      .from("driver_daily_settlement")
      .select(
        `
        id,
        settlement_date,
        total_rides,
        total_platform_fees,
        settlement_status,
        payment_due_date,
        paid_at
      `
      )
      .eq("driver_id", driverId)
      .order("settlement_date", { ascending: false })
      .limit(30)

    if (error) throw error

    // Get payment history
    const { data: payments, error: paymentError } = await supabase
      .from("driver_payments")
      .select("*")
      .eq("driver_id", driverId)
      .order("payment_date", { ascending: false })
      .limit(20)

    if (paymentError) throw paymentError

    // Calculate total owed
    const { data: totalOwed } = await supabase
      .from("driver_daily_settlement")
      .select("total_platform_fees")
      .eq("driver_id", driverId)
      .eq("settlement_status", "pending")

    const totalPending = totalOwed?.reduce(
      (sum, s) => sum + (s.total_platform_fees || 0),
      0
    ) || 0

    return NextResponse.json({
      settlements,
      payments,
      totalPending,
      success: true,
    })
  } catch (error) {
    console.error("Error fetching payment status:", error)
    return NextResponse.json(
      { error: "Failed to fetch payment status" },
      { status: 500 }
    )
  }
}
