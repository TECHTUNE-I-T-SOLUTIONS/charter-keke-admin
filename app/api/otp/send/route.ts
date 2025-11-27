import { type NextRequest, NextResponse } from "next/server"
import { sendOTP } from "@/lib/termii"

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number required" }, { status: 400 })
    }

    const result = await sendOTP({ to: phoneNumber })

    if (result.pinId) {
      return NextResponse.json({
        success: true,
        pinId: result.pinId,
        message: "OTP sent successfully",
      })
    }

    return NextResponse.json({ error: result.message || "Failed to send OTP" }, { status: 400 })
  } catch (error) {
    console.error("[OTP] Send error:", error)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
