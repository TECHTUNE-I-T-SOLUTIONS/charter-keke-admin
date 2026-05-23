import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { supabase } from "@/lib/supabase"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * POST /api/auth/admin/forgot-password
 * Send password reset email to admin
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, phone_number } = body

    if (!email && !phone_number) {
      return NextResponse.json(
        { error: "Email or phone number is required" },
        { status: 400 }
      )
    }

    const query = supabase
      .from("users")
      .select("id, email, phone_number, role, status")

    const { data: user, error: userError } = await (email
      ? query.eq("email", email).single()
      : query.eq("phone_number", phone_number).single())

    // Always return success for security (don't reveal if email exists or not)
    if (userError || !user) {
      return NextResponse.json(
        { success: true, message: "If this email is registered as an admin, you will receive a reset link" },
        { status: 200 }
      )
    }

    // Only allow active admin users
    if (user.role !== "admin" && user.role !== "super_admin") {
      return NextResponse.json(
        { success: true, message: "If this email is registered as an admin, you will receive a reset link" },
        { status: 200 }
      )
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { success: true, message: "If this email is registered as an admin, you will receive a reset link" },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token in database (you may need to add these columns to users table)
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
        { success: true, message: "If this email is registered as an admin, you will receive a reset link" },
        { status: 200 }
      )
    }

    const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || "https://charterkeke.vercel.app"
    const resetLink = `${baseUrl}/auth/admin/reset-password?token=${resetToken}`

    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "Charter Keke Admin <noreply@charterkeke.com>",
          to: user.email,
          subject: "Reset your Charter Keke admin password",
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
              <h1>Reset your admin password</h1>
              <p>We received a request to reset the password for your Charter Keke admin account.</p>
              <p><a href="${resetLink}" style="display:inline-block;padding:12px 18px;background:#FF9203;color:#fff;text-decoration:none;border-radius:8px;">Reset password</a></p>
              <p>If the button does not work, copy this link into your browser:</p>
              <p>${resetLink}</p>
              <p>This link expires in 1 hour.</p>
            </div>
          `,
        })
      } catch (emailError) {
        console.error("Admin reset email send failed:", emailError)
      }
    }

    console.log("Password reset token generated for admin:", user.email)
    console.log("Reset link:", resetLink)
    if (process.env.NODE_ENV === "development") {
      console.log("Reset token (dev only):", resetToken)
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "If this account is registered as an admin, you will receive a reset link" 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { 
        success: true,
        message: "If this account is registered as an admin, you will receive a reset link" 
      },
      { status: 200 }
    )
  }
}
