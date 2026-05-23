import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { supabase } from "@/lib/supabase"

function errorResponse(status: number, error: string, meta?: Record<string, unknown>) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...meta,
    },
    { status }
  )
}

/**
 * POST /api/auth/reset-password
 * Reset password using valid token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const token = body.token || body.resetToken || body.passwordResetToken
    const password = body.password || body.newPassword || body.new_password

    console.log("🔑 [RESET-PASSWORD] Incoming request", {
      hasToken: !!token,
      hasPassword: !!password,
      keys: Object.keys(body || {}),
    })

    if (!token || !password) {
      console.warn("❌ [RESET-PASSWORD] Missing token or password", {
        hasToken: !!token,
        hasPassword: !!password,
        bodyKeys: Object.keys(body || {}),
      })
      return errorResponse(400, "Token and password are required")
    }

    if (password.length < 8) {
      console.warn("❌ [RESET-PASSWORD] Password too short", { tokenPresent: !!token, passwordLength: password.length })
      return errorResponse(400, "Password must be at least 8 characters")
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
      console.warn("❌ [RESET-PASSWORD] Invalid token", {
        tokenHash,
        fetchError: fetchError?.message,
      })
      return errorResponse(400, "Invalid token")
    }

    // Check if token has expired
    const expiryTime = new Date(user.password_reset_expiry).getTime()
    const currentTime = Date.now()

    if (currentTime > expiryTime) {
      console.warn("❌ [RESET-PASSWORD] Token has expired", {
        userId: user.id,
        email: user.email,
        expiryTime,
        currentTime,
      })
      return errorResponse(400, "Token has expired")
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
      return errorResponse(500, updateError.message || "Failed to update password", {
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
      })
    }

    return NextResponse.json(
      { success: true, message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return errorResponse(
      500,
      error instanceof Error ? error.message : "Internal server error"
    )
  }
}

