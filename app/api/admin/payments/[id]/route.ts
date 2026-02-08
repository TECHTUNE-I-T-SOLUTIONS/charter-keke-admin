import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/admin/payments/[id]
 * Fetch detailed payment information
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: paymentId } = await params

    // Fetch payment details
    const { data: payment, error: paymentError } = await supabase
      .from("driver_payments")
      .select("*")
      .eq("id", paymentId)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Fetch driver info
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select("id, user_id, vehicle_type, plate_number, verified, average_rating, total_rides_completed, total_earnings")
      .eq("id", payment.driver_id)
      .single()

    if (driverError) {
      console.error("Driver fetch error:", driverError)
      return NextResponse.json({ error: "Failed to fetch driver details" }, { status: 500 })
    }

    // Fetch user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, first_name, last_name, email, phone_number")
      .eq("id", driver.user_id)
      .single()

    if (userError) {
      console.error("User fetch error:", userError)
      return NextResponse.json({ error: "Failed to fetch user details" }, { status: 500 })
    }

    // Fetch settlement info if exists
    let settlement = null
    if (payment.settlement_id) {
      const { data: settlementData } = await supabase
        .from("driver_daily_settlement")
        .select("*")
        .eq("id", payment.settlement_id)
        .single()

      settlement = settlementData
    }

    // Fetch related rides
    const { data: relatedRides } = await supabase
      .from("rides")
      .select("id, fare_amount, driver_earnings, status, created_at, completed_at")
      .eq("driver_id", payment.driver_id)
      .order("created_at", { ascending: false })
      .limit(5)

    return NextResponse.json(
      {
        payment: {
          id: payment.id,
          driverId: payment.driver_id,
          driver: {
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone_number,
            vehicleType: driver.vehicle_type,
            plateName: driver.plate_number,
            verified: driver.verified,
            rating: driver.average_rating,
            totalRides: driver.total_rides_completed,
            totalEarnings: driver.total_earnings,
          },
          amount: payment.amount,
          paymentMethod: payment.payment_method,
          status: payment.status,
          paymentDate: payment.payment_date,
          createdAt: payment.created_at,
          settlement: settlement
            ? {
                id: settlement.id,
                date: settlement.settlement_date,
                totalRides: settlement.total_rides,
                totalEarnings: settlement.total_driver_earnings,
                status: settlement.settlement_status,
              }
            : null,
          relatedRides: (relatedRides || []).map((ride: any) => ({
            id: ride.id,
            fare: ride.fare_amount,
            earnings: ride.driver_earnings,
            status: ride.status,
            createdAt: ride.created_at,
            completedAt: ride.completed_at,
          })),
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Payment details error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
