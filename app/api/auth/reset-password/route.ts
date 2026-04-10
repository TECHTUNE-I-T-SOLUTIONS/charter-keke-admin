import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/auth/reset-password
 * Reset password using valid token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
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
        { error: "Invalid token" },
        { status: 400 }
      )
    }

    // Check if token has expired
    const expiryTime = new Date(user.password_reset_expiry).getTime()
    const currentTime = Date.now()

    if (currentTime > expiryTime) {
      return NextResponse.json(
        { error: "Token has expired" },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password and clear reset token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        password_reset_token: null,
        password_reset_expiry: null,
        updated_at: new Date(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

