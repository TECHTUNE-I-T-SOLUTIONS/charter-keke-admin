import { supabaseAdmin } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"
import {
  getDateRangeForOffset,
  getOutstandingSettlements,
  updateOverdueSettlements,
  upsertSettlementForDate,
} from "@/lib/driver-settlement"

// This endpoint should be called by a cron job (e.g., Vercel Cron)
// Configure in vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/check-overdue-settlements",
//     "schedule": "0 0 * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database client not configured" },
        { status: 500 }
      )
    }

    // Verify cron secret
    if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const targetDriverId = searchParams.get("driverId")

    let driverIds: string[] = []

    if (targetDriverId) {
      driverIds = [targetDriverId]
    } else {
      const { data: drivers, error: driversError } = await supabaseAdmin
        .from("drivers")
        .select("id")

      if (driversError) throw driversError
      driverIds = (drivers || []).map((driver) => driver.id).filter(Boolean)
    }

    if (!driverIds.length) {
      return NextResponse.json({
        success: true,
        message: "No drivers found for settlement check",
        processed: 0,
      })
    }

    const { dateString } = getDateRangeForOffset(-1)

    let processedCount = 0
    let blockedDrivers = 0
    let totalOutstanding = 0

    for (const driverId of driverIds) {
      try {
        await upsertSettlementForDate(driverId, dateString)
        await updateOverdueSettlements(driverId)

        const outstanding = await getOutstandingSettlements(driverId)
        const amountDue = outstanding.reduce(
          (sum, settlement) => sum + Number(settlement.total_platform_fees || 0),
          0
        )

        totalOutstanding += amountDue

        if (amountDue > 0) {
          blockedDrivers += 1
          await supabaseAdmin
            .from("drivers")
            .update({
              availability_status: "offline",
              updated_at: new Date().toISOString(),
            })
            .eq("id", driverId)
        }

        processedCount++
      } catch (error) {
        console.error(`Error processing settlement for driver ${driverId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Daily settlement check completed",
      processed: processedCount,
      blockedDrivers,
      totalOutstanding,
      settlementDateChecked: dateString,
      mode: targetDriverId ? "single_driver" : "all_drivers",
    })
  } catch (error) {
    console.error("Error checking overdue settlements:", error)
    return NextResponse.json(
      { error: "Failed to check overdue settlements" },
      { status: 500 }
    )
  }
}
