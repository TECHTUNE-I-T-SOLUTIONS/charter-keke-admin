import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

/**
 * POST /api/auth/verify-session-password
 * Verifies user password for session resume verification
 * This endpoint allows users to verify their identity when resuming a closed session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Validate inputs
    if (!email || !password) {
      return NextResponse.json(
        { verified: false, message: "Email and password are required, kindly logout and login again" },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, password_hash")
      .eq("email", email.toLowerCase())
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { verified: false, message: "Email not found, kindly logout and login again or signup" },
        { status: 404 }
      )
    }

    // Verify password
    let passwordMatch = false
    
    // Try bcrypt comparison if password_hash exists
    if (user.password_hash) {
      passwordMatch = await bcrypt.compare(password, user.password_hash)
    }

    if (!passwordMatch) {
      return NextResponse.json(
        { verified: false, message: "Invalid password, kindly logout and login again" },
        { status: 401 }
      )
    }

    // Log the verification for security
    console.log(`[SessionVerification] User ${email} verified via password`)

    // Return success
    return NextResponse.json(
      {
        verified: true,
        message: "Password verified successfully",
        userId: user.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[VerifySessionPassword] Error:", error)
    return NextResponse.json(
      { verified: false, message: "Verification failed" },
      { status: 500 }
    )
  }
}
