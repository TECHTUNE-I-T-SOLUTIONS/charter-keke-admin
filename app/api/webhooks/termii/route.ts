import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Handle Termii webhook events
    console.log("[Termii] Webhook received:", body)

    // Handle different event types
    switch (body.type) {
      case "delivery_report":
        // Message delivery status
        console.log("[Termii] Delivery report:", body.message_id, body.status)
        break

      case "incoming_sms":
        // Two-way messaging - incoming SMS from user
        console.log("[Termii] Incoming SMS from:", body.from, "Message:", body.message)
        // Process incoming message (e.g., reply to user, trigger actions)
        break

      default:
        console.log("[Termii] Unhandled event type:", body.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Termii] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
