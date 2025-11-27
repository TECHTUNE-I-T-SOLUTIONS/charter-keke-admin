import { type NextRequest, NextResponse } from "next/server"
import { sendSMS } from "@/lib/termii"

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const result = await sendSMS({ to, message })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[SMS] Send error:", error)
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
  }
}
