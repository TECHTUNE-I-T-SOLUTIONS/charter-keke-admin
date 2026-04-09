import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database connection not available" }, { status: 500 });
    }
    const body = await request.json();
    const {
      first_name,
      last_name,
      email,
      phone_number,
      password,
      role,
      dob,
      gender,
    } = body;

    // Validate required fields
    if (!first_name || !last_name || !email || !phone_number || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .or(`email.eq.${email},phone_number.eq.${phone_number}`)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or phone number already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert([
        {
          first_name,
          last_name,
          email,
          phone_number,
          password_hash,
          role: role || "user",
          dob: dob || null,
          gender: gender || null,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (userError) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create wallet for user
    await supabaseAdmin.from("wallets").insert([
      {
        user_id: user.id,
        balance: 0,
        currency: "NGN",
      },
    ]);

    // If driver role, create driver profile
    if (role === "driver") {
      await supabaseAdmin.from("drivers").insert([
        {
          user_id: user.id,
          availability_status: "offline",
          verified: false,
        },
      ]);
    }

    // Create notification preferences
    await supabaseAdmin.from("notifications").insert([
      {
        user_id: user.id,
        title: "Welcome to Charter Keke",
        message: "Complete your profile to start using Charter Keke",
        type: "system",
        channel: "in_app",
        read: false,
      },
    ]);

    // Send verification email (if Resend API key is configured)
    if (resend) {
      await resend.emails.send({
        from: "noreply@charterkeke.com",
        to: email,
        subject: "Verify your Charter Keke account",
        html: `
          <h1>Welcome to Charter Keke!</h1>
          <p>Hi ${first_name},</p>
          <p>Thank you for signing up. Please complete your profile to start using Charter Keke.</p>
          <p><a href="${process.env.NEXTAUTH_URL}/auth/complete-profile?userId=${user.id}">Complete Profile</a></p>
        `,
      });
    }

    return NextResponse.json(
      {
        message: "User created successfully. Check your email for next steps.",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
