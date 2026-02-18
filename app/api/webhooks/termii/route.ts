import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabase"
import { acceptRideFirstCome } from "@/lib/ride-acceptance"
import { toTermiiPhoneNumber } from "@/lib/termii"

function getHeader(request: NextRequest, key: string) {
  return request.headers.get(key) || request.headers.get(key.toLowerCase())
}

function verifyWebhookSignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex")

  if (expected.length !== signature.length) {
    return false
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}

function extractIncomingMessage(body: any) {
  const from = String(body?.from || body?.msisdn || body?.phone_number || body?.sender || "").trim()
  const message = String(body?.message || body?.sms || body?.text || body?.content || "").trim()
  return { from, message }
}

function extractRideAcceptCommand(message: string) {
  if (!message) return { isAccept: false as const, rideId: null as string | null }

  const isAccept = /\baccept\b/i.test(message)
  const rideIdMatch = message.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)

  return {
    isAccept,
    rideId: rideIdMatch?.[0]?.toLowerCase() || null,
  }
}

async function findDriverUserByPhone(phone: string) {
  if (!supabaseAdmin) return null

  const normalized = toTermiiPhoneNumber(phone)
  if (!normalized) return null

  const variants = Array.from(
    new Set([normalized, `+${normalized}`, `0${normalized.slice(3)}`])
  )

  for (const variant of variants) {
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, phone_number")
      .eq("role", "driver")
      .eq("phone_number", variant)
      .maybeSingle()

    if (user) return user
  }

  const last10 = normalized.slice(-10)
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, phone_number")
    .eq("role", "driver")
    .ilike("phone_number", `%${last10}`)
    .limit(1)

  return users?.[0] || null
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    const body = rawBody ? JSON.parse(rawBody) : {}

    const webhookSecret = process.env.TERMII_WEBHOOK_SECRET
    const requireSignature = process.env.TERMII_REQUIRE_WEBHOOK_SIGNATURE === "true"

    if (webhookSecret) {
      const signature =
        getHeader(request, "x-termii-signature") ||
        getHeader(request, "x-termii-signature-hash") ||
        getHeader(request, "termii-signature")

      if (signature && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }

      if (!signature && requireSignature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 })
      }
    }

    // Handle Termii webhook events
    console.log("[Termii] Webhook received:", body)

    const eventType = String(body?.type || body?.event || "").toLowerCase()

    // Handle different event types
    switch (eventType) {
      case "delivery_report":
        // Message delivery status
        console.log("[Termii] Delivery report:", body.message_id, body.status)
        break

      case "incoming_sms":
        {
          const { from, message } = extractIncomingMessage(body)
          console.log("[Termii] Incoming SMS from:", from, "Message:", message)

          const command = extractRideAcceptCommand(message)

          if (!command.isAccept || !command.rideId) {
            return NextResponse.json({
              received: true,
              ignored: true,
              reason: "No valid ACCEPT command with ride ID",
            })
          }

          const driverUser = await findDriverUserByPhone(from)
          if (!driverUser) {
            return NextResponse.json({
              received: true,
              ignored: true,
              reason: "Driver not found for incoming phone number",
            })
          }

          const acceptance = await acceptRideFirstCome({
            rideId: command.rideId,
            driverUserId: driverUser.id,
            source: "sms",
          })

          if (!acceptance.success && acceptance.status === 409) {
            return NextResponse.json({
              received: true,
              accepted: false,
              reason: "Ride already taken",
            })
          }

          if (!acceptance.success) {
            return NextResponse.json(
              {
                received: true,
                accepted: false,
                error: acceptance.message,
                code: acceptance.code,
              },
              { status: acceptance.status }
            )
          }

          return NextResponse.json({
            received: true,
            accepted: true,
            rideId: command.rideId,
            driverUserId: driverUser.id,
          })
        }

        break

      default:
        console.log("[Termii] Unhandled event type:", eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Termii] Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
