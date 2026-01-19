import { createClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { driverId, settlementIds, amount } = await request.json()

    if (!driverId || !amount || !settlementIds?.length) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Get driver email for Paystack
    const { data: driver } = await supabase
      .from("drivers")
      .select("user_id")
      .eq("id", driverId)
      .single()

    if (!driver?.user_id) {
      return NextResponse.json(
        { error: "Driver not found" },
        { status: 404 }
      )
    }

    // Get user email
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", driver.user_id)
      .single()

    if (!user?.email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 404 }
      )
    }

    // Create Paystack payment URL
    const paystackUrl = "https://api.paystack.co/transaction/initialize"

    const paystackResponse = await fetch(paystackUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100), // Convert to kobo (Paystack expects smallest unit)
        metadata: {
          driverId,
          settlementIds,
          type: "settlement_payment",
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/driver/payment-callback`,
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      throw new Error(paystackData.message)
    }

    // Store pending payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from("driver_payments")
      .insert({
        driver_id: driverId,
        amount,
        payment_method: "paystack",
        payment_reference: paystackData.data.reference,
        status: "pending",
        payment_date: new Date().toISOString(),
        metadata: {
          paystack_access_code: paystackData.data.access_code,
          settlement_ids: settlementIds,
        },
      })
      .select()
      .single()

    if (paymentError) throw paymentError

    return NextResponse.json({
      authUrl: paystackData.data.authorization_url,
      accessCode: paystackData.data.access_code,
      reference: paystackData.data.reference,
      paymentId: payment.id,
      success: true,
    })
  } catch (error) {
    console.error("Error initiating payment:", error)
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    )
  }
}
