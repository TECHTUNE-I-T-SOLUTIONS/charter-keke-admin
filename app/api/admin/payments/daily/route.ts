import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/payments/daily
 * Fetch daily payments breakdown with summaries
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get("limit") || "30")

    // Fetch daily totals
    const { data: allPayments } = await supabase
      .from("driver_payments")
      .select("id, amount, payment_method, status, payment_date, created_at")
      .order("created_at", { ascending: false })
      .limit(1000)

    if (!allPayments || allPayments.length === 0) {
      return NextResponse.json(
        {
          dailyPayments: [],
          summary: {
            totalPending: 0,
            totalCompleted: 0,
            totalFailed: 0,
            averageDaily: 0,
          },
        },
        { status: 200 }
      )
    }

    // Group by date
    const dailyMap = new Map<string, any>()

    allPayments.forEach((payment: any) => {
      const date = new Date(payment.created_at || payment.payment_date)
      const dateStr = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })

      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, {
          date: dateStr,
          totalAmount: 0,
          count: 0,
          completed: 0,
          pending: 0,
          failed: 0,
          methods: new Map<string, number>(),
        })
      }

      const daily = dailyMap.get(dateStr)
      daily.totalAmount += payment.amount || 0
      daily.count += 1

      if (payment.status === "completed") daily.completed += 1
      else if (payment.status === "pending") daily.pending += 1
      else if (payment.status === "failed") daily.failed += 1

      const methodCount = daily.methods.get(payment.payment_method) || 0
      daily.methods.set(payment.payment_method, methodCount + 1)
    })

    // Convert to array and sort
    const dailyPayments = Array.from(dailyMap.values())
      .map((daily: any) => ({
        date: daily.date,
        totalAmount: daily.totalAmount,
        count: daily.count,
        completed: daily.completed,
        pending: daily.pending,
        failed: daily.failed,
        methods: Array.from(daily.methods.entries()).map(([method, count]) => ({
          method,
          count,
        })),
      }))
      .slice(0, limit)

    // Calculate summary
    const summary = {
      totalPending: allPayments.filter((p: any) => p.status === "pending").length,
      totalCompleted: allPayments.filter((p: any) => p.status === "completed").length,
      totalFailed: allPayments.filter((p: any) => p.status === "failed").length,
      averageDaily: dailyPayments.length > 0
        ? dailyPayments.reduce((sum: number, day: any) => sum + day.totalAmount, 0) / dailyPayments.length
        : 0,
    }

    return NextResponse.json(
      {
        dailyPayments,
        summary,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Daily payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
