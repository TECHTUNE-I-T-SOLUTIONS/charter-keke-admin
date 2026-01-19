import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json(
        { error: "Reference required" },
        { status: 400 }
      )
    }

    // Verify payment with Paystack
    const verifyUrl = `https://api.paystack.co/transaction/verify/${reference}`

    const verifyResponse = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data.status !== "success") {
      // Mark payment as failed
      await supabase
        .from("driver_payments")
        .update({ status: "failed" })
        .eq("payment_reference", reference)

      return NextResponse.json(
        { error: "Payment verification failed" },
        { status: 400 }
      )
    }

    const paymentData = verifyData.data
    const { driverId, settlementIds } = paymentData.metadata

    // Update payment status to completed
    const { data: payment } = await supabase
      .from("driver_payments")
      .update({
        status: "completed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("payment_reference", reference)
      .select()
      .single()

    // Update all related settlements to paid
    if (settlementIds?.length) {
      await supabase
        .from("driver_daily_settlement")
        .update({
          settlement_status: "paid",
          paid_at: new Date().toISOString(),
        })
        .in("id", settlementIds)
    }

    // Update driver availability status to active if it was disabled
    const { data: driver } = await supabase
      .from("drivers")
      .select("id")
      .eq("id", driverId)
      .single()

    if (driver) {
      // Check if driver has any unpaid settlements
      const { data: unpaidSettlements } = await supabase
        .from("driver_daily_settlement")
        .select("id")
        .eq("driver_id", driverId)
        .eq("settlement_status", "pending")

      // If no unpaid settlements, enable driver
      if (!unpaidSettlements?.length) {
        await supabase
          .from("drivers")
          .update({ is_available: true })
          .eq("id", driverId)
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and settlement updated",
      payment,
    })
  } catch (error) {
    console.error("Error processing payment callback:", error)
    return NextResponse.json(
      { error: "Failed to process payment callback" },
      { status: 500 }
    )
  }
}
