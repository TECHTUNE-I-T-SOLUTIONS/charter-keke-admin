import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import {
  getDateRangeForOffset,
  upsertSettlementForDate,
  updateOverdueSettlements,
  getOutstandingSettlements,
  summarizeSettlement,
} from "@/lib/driver-settlement"

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: driver } = await supabaseAdmin!
      .from("drivers")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!driver?.id) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    await updateOverdueSettlements(driver.id)

    const { dateString } = getDateRangeForOffset(-1)
    const settlement = await upsertSettlementForDate(driver.id, dateString)

    const outstanding = await getOutstandingSettlements(driver.id)
    const totalOutstanding = outstanding.reduce(
      (sum, entry) => sum + Number(entry.total_platform_fees || 0),
      0
    )

    const blocked = totalOutstanding > 0

    return NextResponse.json({
      blocked,
      reason: blocked
        ? "Please settle outstanding platform fees before accepting new rides."
        : null,
      currentSettlement: summarizeSettlement(settlement),
      outstandingSettlements: outstanding,
      totalOutstanding,
    })
  } catch (error) {
    console.error("[SettlementStatus] error:", error)
    return NextResponse.json(
      { error: "Failed to fetch settlement status" },
      { status: 500 }
    )
  }
}
