import { NextRequest, NextResponse } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request)

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 })
    }

    const { data: driver } = await supabaseAdmin!
      .from("drivers")
      .select("id")
      .eq("user_id", session.user.id)
      .single()

    if (!driver?.id) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 })
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin!
      .from("driver_payments")
      .select("*")
      .eq("id", paymentId)
      .eq("driver_id", driver.id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Verify with Paystack
    const verifyUrl = `https://api.paystack.co/transaction/verify/${payment.payment_reference}`

    const verifyResponse = await fetch(verifyUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    })

    const verifyData = await verifyResponse.json()

    if (!verifyData.status) {
      return NextResponse.json({ error: "Could not verify payment with Paystack" }, { status: 500 })
    }

    const transaction = verifyData.data
    const paymentStatus = transaction.status
    const normalizedPaymentStatus =
      paymentStatus === "success"
        ? "completed"
        : paymentStatus === "failed" || paymentStatus === "abandoned" || paymentStatus === "cancelled"
          ? "failed"
          : "pending"

    // Update payment status in our database
    const updatePayload: any = { status: normalizedPaymentStatus }
    if (normalizedPaymentStatus === "completed") {
      updatePayload.confirmed_at = new Date().toISOString()
    }

    const { data: updatedPayment, error: updateError } = await supabaseAdmin!
      .from("driver_payments")
      .update(updatePayload)
      .eq("id", paymentId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // Update transaction status
    const transactionStatus = normalizedPaymentStatus === "completed" ? "completed" : normalizedPaymentStatus === "failed" ? "failed" : "pending"
    await supabaseAdmin!
      .from("transactions")
      .update({ status: transactionStatus, updated_at: new Date().toISOString() })
      .eq("reference", payment.payment_reference)

    // If payment successful and was previously pending, update settlement
    if (normalizedPaymentStatus === "completed" && payment.status !== "completed" && payment.settlement_id) {
      await supabaseAdmin!
        .from("driver_daily_settlement")
        .update({
          settlement_status: "paid",
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", payment.settlement_id)

      // Check if driver has remaining unpaid settlements
      const { data: unpaidSettlements } = await supabaseAdmin!
        .from("driver_daily_settlement")
        .select("id")
        .eq("driver_id", driver.id)
        .in("settlement_status", ["pending", "overdue"])

      // If no more unpaid, set driver online
      if (!unpaidSettlements?.length) {
        await supabaseAdmin!
          .from("drivers")
          .update({ availability_status: "online", updated_at: new Date().toISOString() })
          .eq("id", driver.id)
      }

      // Add notification
      await supabaseAdmin!
        .from("notifications")
        .insert({
          user_id: session.user.id,
          title: "Payment Verified",
          message: `Your settlement payment of ₦${(transaction.amount / 100).toLocaleString("en-US")} has been verified and confirmed`,
          type: "payment",
          channel: "in_app",
          related_table: "driver_payments",
          related_id: paymentId,
          data: {
            reference: payment.payment_reference,
            amount: transaction.amount / 100,
            status: "success",
          },
        })
    }

    return NextResponse.json({
      success: normalizedPaymentStatus === "completed",
      paymentStatus,
      payment: updatedPayment,
      message: `Payment status: ${paymentStatus}`,
    })
  } catch (error) {
    console.error("[PaymentReverify] error:", error)
    return NextResponse.json({ error: "Failed to reverify payment" }, { status: 500 })
  }
}
