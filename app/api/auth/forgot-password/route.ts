import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"

/**
 * POST /api/auth/forgot-password
 * Send password reset email to user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, status")
      .eq("email", email)
      .single()

    // Always return success for security (don't reveal if email exists or not)
    if (userError || !user) {
      return NextResponse.json(
        { success: true, message: "If this email is registered, you will receive a reset link" },
        { status: 200 }
      )
    }

    // Only allow active users
    if (user.status !== "active") {
      return NextResponse.json(
        { success: true, message: "If this email is registered, you will receive a reset link" },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token in database
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_reset_token: resetTokenHash,
        password_reset_expiry: resetTokenExpiry.toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating reset token:", updateError)
      return NextResponse.json(
        { success: true, message: "If this email is registered, you will receive a reset link" },
        { status: 200 }
      )
    }

    // TODO: Send email with reset link
    // const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}`
    // await sendPasswordResetEmail(email, resetLink)

    console.log("Password reset token generated for user:", email)
    console.log("Reset link would be sent to:", email)
    // For development, log the reset token
    if (process.env.NODE_ENV === "development") {
      console.log("Reset token (dev only):", resetToken)
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "If this email is registered, you will receive a reset link" 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { 
        success: true,
        message: "If this email is registered, you will receive a reset link" 
      },
      { status: 200 }
    )
  }
}
