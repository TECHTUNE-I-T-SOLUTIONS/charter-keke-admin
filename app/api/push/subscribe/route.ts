import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const subscription = await request.json()

    // Store subscription in database
    // In production, save to your database with user ID
    console.log("[Push] New subscription:", subscription.endpoint)

    return NextResponse.json({
      success: true,
      message: "Subscription saved",
    })
  } catch (error) {
    console.error("[Push] Subscribe error:", error)
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 })
  }
}
