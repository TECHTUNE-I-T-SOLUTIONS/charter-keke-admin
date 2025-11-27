import { type NextRequest, NextResponse } from "next/server"
import webpush from "web-push"

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  "mailto:techtune.it.solutions@gmail.com",
  process.env.VAPID_PUBLIC_KEY ||
    "BAU0Sa9i4kfJdEJGpK5oGU3N2zEe_puzFqfelO9w4y0PbUxNr5MFs2cyE9ZMX3ZmUjDa-PeJnYueyfRZcB57QS4",
  process.env.VAPID_PRIVATE_KEY || "ouMMb-sGqz7l5mGKV2m-aNWWZGQvicdQ2kGb7mRkje8",
)

export async function POST(request: NextRequest) {
  try {
    const { subscription, title, body, url, tag } = await request.json()

    if (!subscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 400 })
    }

    const payload = JSON.stringify({
      title: title || "EASELY",
      body: body || "You have a new notification",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: tag || "easely-notification",
      data: { url: url || "/" },
    })

    await webpush.sendNotification(subscription, payload)

    return NextResponse.json({
      success: true,
      message: "Notification sent",
    })
  } catch (error) {
    console.error("[Push] Send error:", error)
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 })
  }
}
