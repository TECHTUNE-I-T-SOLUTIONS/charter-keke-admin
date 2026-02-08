import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/payments
 * Fetch payments and transactions list with optional filtering
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get("status") || ""
    const type = searchParams.get("type") || ""
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    // Fetch payments without nested data
    let paymentQuery = supabase
      .from("driver_payments")
      .select(
        `
        id,
        driver_id,
        settlement_id,
        amount,
        payment_method,
        status,
        payment_date,
        created_at
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add status filter
    if (status && status !== "all") {
      paymentQuery = paymentQuery.eq("status", status)
    }

    // Add payment method filter
    if (type && type !== "all") {
      paymentQuery = paymentQuery.eq("payment_method", type)
    }

    const { data: paymentsData, error: paymentError, count } = await paymentQuery

    if (paymentError) {
      console.error("Payments fetch error:", paymentError)
      return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
    }

    if (!paymentsData || paymentsData.length === 0) {
      return NextResponse.json(
        {
          payments: [],
          count: 0,
        },
        { status: 200 }
      )
    }

    // Get distinct driver IDs
    const driverIds = [...new Set(paymentsData.map((p: any) => p.driver_id))]

    // Fetch driver details
    const { data: drivers, error: driverError } = await supabase
      .from("drivers")
      .select("id, user_id")
      .in("id", driverIds)

    if (driverError) {
      console.error("Drivers fetch error:", driverError)
      return NextResponse.json({ error: "Failed to fetch driver details" }, { status: 500 })
    }

    // Get user IDs from drivers
    const userIds = (drivers || []).map((d: any) => d.user_id)
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id, first_name, last_name")
      .in("id", userIds)

    if (userError) {
      console.error("Users fetch error:", userError)
      return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 })
    }

    // Create lookup maps
    const driverMap = new Map((drivers || []).map((d: any) => [d.id, d]))
    const userMap = new Map((users || []).map((u: any) => [u.id, u]))

    // Flatten and combine data
    const payments = paymentsData.map((payment: any) => {
      const driver = driverMap.get(payment.driver_id)
      const user = userMap.get(driver?.user_id)

      return {
        id: payment.id,
        driver_first_name: user?.first_name || "",
        driver_last_name: user?.last_name || "",
        amount: payment.amount || 0,
        payment_method: payment.payment_method,
        status: payment.status,
        created_at: payment.created_at,
      }
    })

    return NextResponse.json(
      {
        payments,
        count: count || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Payments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
