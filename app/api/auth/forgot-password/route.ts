import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * POST /api/auth/forgot-password
 * Initiate password recovery by sending OTP via SMS
 * 
 * Body:
 * - email (required): User's email address
 * 
 * Response:
 * - success: true
 * - message: "OTP sent to your registered phone number"
 * - phone: Last 4 digits of phone number
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    console.log(`🔑 [FORGOT-PASSWORD] Email: ${email}`);

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, email, phone_number")
      .eq("email", email)
      .single();

    if (userError || !user) {
      console.log(`ℹ️  [FORGOT-PASSWORD] User not found with email: ${email}`);
      // Return generic message for security
      return NextResponse.json(
        { 
          success: true, 
          message: "If an account exists with this email, you will receive an OTP within 60 seconds"
        },
        { status: 200 }
      );
    }

    console.log(`✅ [FORGOT-PASSWORD] User found: ${user.id}`);

    // Check if there's an active OTP for forgot_password
    const { data: existingOTP, error: existError } = await supabaseAdmin
      .from("otps")
      .select("id, expires_at")
      .eq("user_id", user.id)
      .eq("type", "forgot_password")
      .eq("is_verified", false)
      .gte("expires_at", new Date().toISOString())
      .single();

    if (existingOTP && !existError) {
      const expiryDate = new Date(existingOTP.expires_at);
      const minutesLeft = Math.ceil((expiryDate.getTime() - Date.now()) / 60000);
      console.log(`⏱️  [FORGOT-PASSWORD] Active OTP exists, expires in ${minutesLeft} minutes`);
      
      return NextResponse.json(
        {
          success: true,
          message: `If an account exists with this email, you will receive an OTP within 60 seconds`,
        },
        { status: 200 }
      );
    }

    // Generate 6-digit OTP
    const otpCode = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`🔐 [FORGOT-PASSWORD] Generated OTP for user: ${user.id}`);

    // Save OTP to database
    const { data: newOTP, error: insertError } = await supabaseAdmin
      .from("otps")
      .insert({
        user_id: user.id,
        phone_number: user.phone_number,
        email: user.email,
        code: otpCode,
        type: "forgot_password",
        is_verified: false,
        attempts: 0,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(`❌ [FORGOT-PASSWORD] Failed to save OTP:`, insertError);
      return NextResponse.json(
        { error: "Failed to initiate password recovery" },
        { status: 500 }
      );
    }

    console.log(`✅ [FORGOT-PASSWORD] OTP saved, ID: ${newOTP.id}`);

    // Send OTP via SMS
    try {
      const { sendSMS } = await import("@/lib/termii");
      
      const smsMessage = `🔑 Password Recovery\n\nYour OTP is: ${otpCode}\n\nUse this code to reset your password.\nValid for 10 minutes.\n\nDo not share this code.`;
      
      await sendSMS({
        phone_number: user.phone_number,
        message: smsMessage,
        channel: "generic",
      });

      console.log(`📱 [FORGOT-PASSWORD] SMS sent to: ${user.phone_number}`);
    } catch (smsError) {
      console.error(`⚠️  [FORGOT-PASSWORD] SMS failed but OTP saved:`, smsError);
    }

    // Return phone number masked for security
    const maskedPhone = user.phone_number.slice(-4).padStart(user.phone_number.length, '*');

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        phone: maskedPhone,
        userId: user.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [FORGOT-PASSWORD] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
