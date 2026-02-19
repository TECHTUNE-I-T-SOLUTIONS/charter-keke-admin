import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { summarizeSettlement, upsertSettlementForDate } from "@/lib/driver-settlement"

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      const message = String(error?.message || "").toLowerCase()
      const retryable =
        message.includes("fetch failed") ||
        message.includes("econn") ||
        message.includes("timeout") ||
        message.includes("network")

      if (!retryable || i === attempts - 1) {
        throw error
      }

      await sleep(300 * (i + 1))
    }
  }

  throw lastError
}

function isValidDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime())
}

function getDayRange(dateString: string) {
  const start = new Date(`${dateString}T00:00:00.000Z`)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 1)
  return { start, end }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database client not configured" }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const requestedDate = searchParams.get("date")
    const dateString = requestedDate || new Date().toISOString().slice(0, 10)

    if (!isValidDateInput(dateString)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 }
      )
    }

    const { data: driver } = await supabaseAdmin
      .from("drivers")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!driver?.id) {
      return NextResponse.json({ error: "Driver profile not found" }, { status: 404 })
    }

    const settlement = await withRetry(() => upsertSettlementForDate(driver.id, dateString))

    const { start, end } = getDayRange(dateString)

    const { data: rides, error: ridesError } = await withRetry(async () =>
      supabaseAdmin!
        .from("rides")
        .select("id, fare_amount, platform_fee, driver_earnings, status, pickup_zone, destination_zone, distance_km, duration_minutes, created_at, updated_at")
        .eq("driver_id", driver.id)
        .in("status", ["accepted", "in_progress", "completed"])
        .gte("updated_at", start.toISOString())
        .lt("updated_at", end.toISOString())
        .order("updated_at", { ascending: false })
    )

    if (ridesError) {
      throw ridesError
    }

    const ridesList = (rides || []).map((ride: any) => ({
      id: ride.id,
      status: ride.status,
      pickup_zone: ride.pickup_zone,
      destination_zone: ride.destination_zone,
      fare_amount: Number(ride.fare_amount || 0),
      platform_fee: Number(ride.platform_fee || 0),
      driver_earnings: Number(ride.driver_earnings || 0),
      distance_km: Number(ride.distance_km || 0),
      duration_minutes: Number(ride.duration_minutes || 0),
      accepted_at: ride.updated_at,
      ride_created_at: ride.created_at,
    }))

    const directPaymentsResult = await withRetry(async () =>
      supabaseAdmin!
        .from("driver_payments")
        .select("id, amount, status, payment_date, confirmed_at")
        .eq("driver_id", driver.id)
        .eq("status", "completed")
        .eq("settlement_id", settlement.id)
    )

    if (directPaymentsResult.error) {
      throw directPaymentsResult.error
    }

    const metadataPaymentsResult = await withRetry(async () =>
      supabaseAdmin!
        .from("driver_payments")
        .select("id, amount, status, payment_date, confirmed_at")
        .eq("driver_id", driver.id)
        .eq("status", "completed")
        .contains("metadata", { settlement_ids: [settlement.id] })
    )

    if (metadataPaymentsResult.error) {
      throw metadataPaymentsResult.error
    }

    const { data: wallet } = await withRetry(async () =>
      supabaseAdmin!
        .from("wallets")
        .select("id")
        .eq("user_id", session.user.id)
        .single()
    )

    const txFallbackResult = wallet?.id
      ? await withRetry(async () =>
          supabaseAdmin!
            .from("transactions")
            .select("id, amount, reference, created_at, updated_at, description")
            .eq("wallet_id", wallet.id)
            .eq("source", "payout")
            .eq("status", "completed")
            .ilike("description", `%${dateString}%`)
        )
      : { data: [], error: null }

    if (txFallbackResult.error) {
      throw txFallbackResult.error
    }

    const paymentMap = new Map<string, any>()
    for (const payment of directPaymentsResult.data || []) {
      paymentMap.set(payment.id, payment)
    }
    for (const payment of metadataPaymentsResult.data || []) {
      paymentMap.set(payment.id, payment)
    }

    const transactionFallbackMap = new Map<string, any>()
    for (const tx of txFallbackResult.data || []) {
      const key = tx.reference || tx.id
      transactionFallbackMap.set(key, tx)
    }

    const completedPayments = Array.from(paymentMap.values())
    const paidFromDriverPayments = completedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    )
    const paidFromTransactions = Array.from(transactionFallbackMap.values()).reduce(
      (sum, tx) => sum + Number(tx.amount || 0),
      0
    )
    const paidPlatformFees = Math.max(paidFromDriverPayments, paidFromTransactions)
    const totalPlatformFees = Number(settlement.total_platform_fees || 0)
    const outstandingPlatformFees = Math.max(totalPlatformFees - paidPlatformFees, 0)
    const effectiveStatus = outstandingPlatformFees <= 0 ? "paid" : "pending"

    if (settlement.settlement_status !== effectiveStatus) {
      await supabaseAdmin
        .from("driver_daily_settlement")
        .update({
          settlement_status: effectiveStatus,
          updated_at: new Date().toISOString(),
          ...(effectiveStatus === "paid"
            ? { paid_at: new Date().toISOString() }
            : { paid_at: null }),
        })
        .eq("id", settlement.id)
    }

    const lastPaymentDate = completedPayments
      .map((payment) => payment.confirmed_at || payment.payment_date)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null

    const lastTransactionPaymentDate = Array.from(transactionFallbackMap.values())
      .map((tx) => tx.updated_at || tx.created_at)
      .filter(Boolean)
      .sort()
      .reverse()[0] || null

    const resolvedLastPaymentDate =
      (lastPaymentDate && lastTransactionPaymentDate
        ? (new Date(lastPaymentDate) > new Date(lastTransactionPaymentDate)
            ? lastPaymentDate
            : lastTransactionPaymentDate)
        : lastPaymentDate || lastTransactionPaymentDate) || null

    return NextResponse.json({
      date: dateString,
      settlement: {
        ...summarizeSettlement(settlement),
        status: effectiveStatus,
        paidPlatformFees,
        outstandingPlatformFees,
        lastPaymentDate: resolvedLastPaymentDate,
      },
      rides: ridesList,
      totals: {
        acceptedRides: ridesList.length,
        grossAmount: ridesList.reduce((sum, ride) => sum + Number(ride.fare_amount || 0), 0),
        platformFee: ridesList.reduce((sum, ride) => sum + Number(ride.platform_fee || 0), 0),
        netDriverEarnings: ridesList.reduce((sum, ride) => sum + Number(ride.driver_earnings || 0), 0),
      },
      paymentSummary: {
        completedPaymentsCount: completedPayments.length,
        paidPlatformFees,
        outstandingPlatformFees,
        lastPaymentDate: resolvedLastPaymentDate,
      },
    })
  } catch (error) {
    console.error("[SettlementDaily] error:", error)
    return NextResponse.json(
      { error: "Failed to fetch daily settlement" },
      { status: 500 }
    )
  }
}
