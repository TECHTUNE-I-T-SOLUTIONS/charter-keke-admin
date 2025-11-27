import { type NextRequest, NextResponse } from "next/server"
import { verifyOTP } from "@/lib/termii"

export async function POST(request: NextRequest) {
  try {
    const { pinId, pin } = await request.json()

    if (!pinId || !pin) {
      return NextResponse.json({ error: "Pin ID and pin required" }, { status: 400 })
    }

    const result = await verifyOTP({ pinId, pin })

    if (result.verified) {
      return NextResponse.json({
        success: true,
        message: "OTP verified successfully",
      })
    }

    return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
  } catch (error) {
    console.error("[OTP] Verify error:", error)
    return NextResponse.json({ error: "Failed to verify OTP" }, { status: 500 })
  }
}
