import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get("x-paystack-signature")

    // Verify webhook signature
    const secret = process.env.PAYSTACK_SECRET_KEY || ""
    const hash = crypto.createHmac("sha512", secret).update(body).digest("hex")

    if (hash !== signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const event = JSON.parse(body)

    switch (event.event) {
      case "charge.success":
        // Handle successful payment
        console.log("[Paystack] Payment successful:", event.data.reference)
        // Update wallet balance, confirm ride payment, etc.
        break

      case "transfer.success":
        // Handle successful transfer to driver
        console.log("[Paystack] Transfer successful:", event.data.reference)
        break

      case "transfer.failed":
        // Handle failed transfer
        console.log("[Paystack] Transfer failed:", event.data.reference)
        break

      default:
        console.log("[Paystack] Unhandled event:", event.event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Paystack] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
