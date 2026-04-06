import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendSMS } from "@/lib/termii";

/**
 * POST /api/otp/request
 * Request an OTP for various purposes (resume_session, forgot_password, verify_account)
 * 
 * Body:
 * - phone_number (optional): Phone number to send OTP to
 * - email (optional): Email to look up user and get phone
 * - type (required): 'resume_session', 'forgot_password', 'verify_account'
 * - user_id (optional): If user is logged in
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone_number, email, type, user_id } = body;

    console.log(`📱 [OTP-REQUEST] Type: ${type}, Phone: ${phone_number || 'N/A'}, Email: ${email || 'N/A'}`);

    // Validate type
    const validTypes = ["resume_session", "forgot_password", "verify_account"];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid OTP type. Must be one of: " + validTypes.join(", ") },
        { status: 400 }
      );
    }

    let targetPhone = phone_number;
    let targetEmail = email;
    let findUser = null;

    // If email provided, look up user to get phone number
    if (email && !phone_number) {
      console.log(`🔍 [OTP-REQUEST] Looking up user by email: ${email}`);
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, phone_number, email")
        .eq("email", email)
        .single();

      if (userError || !user) {
        console.error(`❌ [OTP-REQUEST] User not found with email: ${email}`);
        return NextResponse.json(
          { error: "User not found with this email" },
          { status: 404 }
        );
      }

      findUser = user;
      targetPhone = user.phone_number;
      targetEmail = user.email;
      console.log(`✅ [OTP-REQUEST] User found, phone: ${targetPhone}`);
    }

    // If phone_number provided, look up user
    if (phone_number && !email) {
      console.log(`🔍 [OTP-REQUEST] Looking up user by phone: ${phone_number}`);
      const { data: user, error: userError } = await supabaseAdmin
        .from("users")
        .select("id, phone_number, email")
        .eq("phone_number", phone_number)
        .single();

      if (userError || !user) {
        console.error(`❌ [OTP-REQUEST] User not found with phone: ${phone_number}`);
        return NextResponse.json(
          { error: "User not found with this phone number" },
          { status: 404 }
        );
      }

      findUser = user;
      targetEmail = user.email;
      console.log(`✅ [OTP-REQUEST] User found, email: ${targetEmail}`);
    }

    // If no phone and no email, we can't proceed
    if (!targetPhone) {
      return NextResponse.json(
        { error: "Phone number or email is required" },
        { status: 400 }
      );
    }

    // Check if there's an active OTP already by user_id (matches the unique constraint)
    let userId = findUser?.id || user_id;
    
    if (!userId && targetEmail) {
      // If we don't have userId yet, we need to get it
      const { data: userByEmail } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", targetEmail)
        .single();
      userId = userByEmail?.id;
    }

    if (userId) {
      // Delete any existing unverified OTPs for this user and type
      // This removes the constraint violation and lets user request a new code
      const { error: deleteError } = await supabaseAdmin
        .from("otps")
        .delete()
        .eq("user_id", userId)
        .eq("type", type)
        .eq("is_verified", false);

      if (deleteError) {
        console.warn(`⚠️  [OTP-REQUEST] Warning deleting old OTP:`, deleteError);
        // Continue anyway - the old OTP might already be expired
      } else {
        console.log(`🔄 [OTP-REQUEST] Deleted previous unverified OTP for user`);
      }
    }

    // Generate 6-digit OTP
    const otpCode = String(Math.floor(Math.random() * 1000000)).padStart(6, "0");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`🔐 [OTP-REQUEST] Generated OTP code: ${otpCode}`);

    // Save OTP to database
    const otpUserId = findUser?.id || user_id || null;
    console.log(`💾 [OTP-REQUEST] Saving OTP for user_id: ${otpUserId}, type: ${type}`);
    
    const { data: newOTP, error: insertError } = await supabaseAdmin
      .from("otps")
      .insert({
        user_id: otpUserId,
        phone_number: targetPhone,
        email: targetEmail,
        code: otpCode,
        type: type,
        is_verified: false,
        attempts: 0,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error(`❌ [OTP-REQUEST] Failed to save OTP:`, insertError);
      return NextResponse.json(
        { error: "Failed to generate OTP" },
        { status: 500 }
      );
    }

    console.log(`✅ [OTP-REQUEST] OTP saved to database, ID: ${newOTP.id}`);

    // Send OTP via SMS
    try {
      const smsMessage = `Your Charter Keke OTP is: ${otpCode}\n\nValid for 10 minutes.\nDo not share this code with anyone.`;
      
      await sendSMS({
        to: targetPhone,
        message: smsMessage,
        channel: "generic",
      });

      console.log(`📱 [OTP-REQUEST] SMS sent successfully to: ${targetPhone}`);
    } catch (smsError) {
      console.error(`⚠️  [OTP-REQUEST] SMS sending failed, but OTP saved:`, smsError);
      // We saved the OTP but couldn't send SMS - still return success
      // The user can view the OTP in logs for testing
    }

    return NextResponse.json(
      {
        success: true,
        message: "OTP sent successfully",
        otpId: newOTP.id,
        expiresIn: 600, // 10 minutes in seconds
        phone: targetPhone,
        // In development, return OTP for testing
        ...(process.env.NODE_ENV === "development" && { otp: otpCode }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ [OTP-REQUEST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
