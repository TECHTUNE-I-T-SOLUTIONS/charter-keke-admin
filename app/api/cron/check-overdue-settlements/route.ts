import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
    // Verify cron secret
    if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const now = new Date()

    // Find all overdue pending settlements
    const { data: overdueSettlements, error: fetchError } = await supabase
      .from("driver_daily_settlement")
      .select("id, driver_id, total_platform_fees, payment_due_date")
      .eq("settlement_status", "pending")
      .lt("payment_due_date", now.toISOString())

    if (fetchError) throw fetchError

    if (!overdueSettlements?.length) {
      return NextResponse.json({
        success: true,
        message: "No overdue settlements",
        processed: 0,
      })
    }

    let processedCount = 0

    // Process each overdue settlement
    for (const settlement of overdueSettlements) {
      try {
        // Update settlement status to overdue
        await supabase
          .from("driver_daily_settlement")
          .update({ settlement_status: "overdue" })
          .eq("id", settlement.id)

        // Check if driver has other unpaid settlements
        const { data: allUnpaidSettlements } = await supabase
          .from("driver_daily_settlement")
          .select("id")
          .eq("driver_id", settlement.driver_id)
          .in("settlement_status", ["pending", "overdue"])

        if (allUnpaidSettlements?.length) {
          // Lock driver availability
          await supabase
            .from("drivers")
            .update({
              is_available: false,
              availability_locked_at: now.toISOString(),
              availability_lock_reason: "overdue_settlement",
            })
            .eq("id", settlement.driver_id)

          // Get driver's user ID for notification
          const { data: driver } = await supabase
            .from("drivers")
            .select("user_id")
            .eq("id", settlement.driver_id)
            .single()

          if (driver?.user_id) {
            // Create notification
            await supabase.from("notifications").insert({
              user_id: driver.user_id,
              title: "Driver Status Disabled - Overdue Payment",
              message: `Your driver account has been disabled due to overdue settlement fees of ₦${settlement.total_platform_fees.toLocaleString(
                "en-NG"
              )}. Please pay immediately to restore access.`,
              type: "alert",
              channel: "in_app",
              data: {
                settlement_id: settlement.id,
                amount_due: settlement.total_platform_fees,
              },
            })
          }
        }

        processedCount++
      } catch (error) {
        console.error(`Error processing settlement ${settlement.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Overdue settlements processed",
      processed: processedCount,
    })
  } catch (error) {
    console.error("Error checking overdue settlements:", error)
    return NextResponse.json(
      { error: "Failed to check overdue settlements" },
      { status: 500 }
    )
  }
}
