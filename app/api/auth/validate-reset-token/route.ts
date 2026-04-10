import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"

/**
 * GET /api/auth/validate-reset-token?token=...
 * Validate if a password reset token is valid and not expired
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json(
        { error: "Token is required", valid: false },
        { status: 400 }
      )
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex")

    // Find user with matching reset token
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email, password_reset_expiry")
      .eq("password_reset_token", tokenHash)
      .single()

    if (fetchError || !user) {
      return NextResponse.json(
        { error: "Invalid token", valid: false },
        { status: 400 }
      )
    }

    // Check if token has expired
    const expiryTime = new Date(user.password_reset_expiry).getTime()
    const currentTime = Date.now()

    if (currentTime > expiryTime) {
      return NextResponse.json(
        { error: "Token has expired", valid: false },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { valid: true, email: user.email },
      { status: 200 }
    )
  } catch (error) {
    console.error("Token validation error:", error)
    return NextResponse.json(
      { error: "Internal server error", valid: false },
      { status: 500 }
    )
  }
}
