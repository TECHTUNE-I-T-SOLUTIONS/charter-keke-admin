import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import bcrypt from "bcryptjs";
import { uploadFileWithServiceRole } from "@/lib/upload-file";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const dob = formData.get("dob") as string;
    const gender = formData.get("gender") as string;
    const role = (formData.get("role") as string) || "user";
    const homeAddress = ((formData.get("homeAddress") as string) || "").trim();
    const workAddress = ((formData.get("workAddress") as string) || "").trim();
    const emergencyContactName = ((formData.get("emergencyContactName") as string) || "").trim();
    const emergencyContactPhone = ((formData.get("emergencyContactPhone") as string) || "").trim();

    // Driver fields
    const vehicleType = formData.get("vehicleType") as string;
    const plateNumber = formData.get("plateNumber") as string;
    const unionName = formData.get("unionName") as string;
    const bankName = formData.get("bankName") as string;
    const bankAccountNumber = formData.get("bankAccountNumber") as string;
    const emergencyContact = formData.get("emergencyContact") as string;

    // Admin fields
    const adminLevel = (formData.get("adminLevel") as string) || "support";

    // File uploads
    const profilePictureFile = formData.get("profilePicture") as File | null;

    // Validate input
    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ["user", "driver", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},phone_number.eq.${phone}`)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or phone number already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate referral code
    const referralCode = `EASE${firstName.substring(0, 2).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Upload profile picture if provided
    let profilePictureUrl: string | null = null;
    if (profilePictureFile && profilePictureFile.size > 0) {
      try {
        const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
        const timestamp = Date.now();
        const filePath = `${email}/${timestamp}-profile.${profilePictureFile.name.split(".").pop()}`;
        
        const uploadResult = await uploadFileWithServiceRole(
          "profile-pictures",
          filePath,
          buffer,
          profilePictureFile.type
        );
        
        profilePictureUrl = uploadResult.url;
      } catch (uploadError) {
        console.error("Profile picture upload error:", uploadError);
        return NextResponse.json(
          { error: "Profile picture upload failed. Please try again." },
          { status: 502 }
        );
      }
    }

    // Create user
    const createPayload: Record<string, any> = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phone,
      password_hash: hashedPassword,
      dob: dob || null,
      gender: gender || null,
      profile_picture_url: profilePictureUrl,
      role,
      status: "active",
      profile_complete: true,
      emergency_contact: emergencyContactName || null,
      emergency_phone: emergencyContactPhone || null,
      home_address: homeAddress || null,
      work_address: workAddress || null,
    };

    let { data: newUser, error: createError } = await supabase
      .from("users")
      .insert(createPayload)
      .select()
      .single();

    if (createError && /home_address|work_address/i.test(createError.message || "")) {
      const payloadWithoutAddresses = { ...createPayload };
      delete payloadWithoutAddresses.home_address;
      delete payloadWithoutAddresses.work_address;

      const fallbackInsert = await supabase
        .from("users")
        .insert(payloadWithoutAddresses)
        .select()
        .single();

      newUser = fallbackInsert.data;
      createError = fallbackInsert.error;
    }

    if (createError) {
      console.error("Create user error:", createError);
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Create wallet for new user (check if it exists first)
    const { data: existingWallet } = await supabase
      .from("wallets")
      .select("id")
      .eq("user_id", newUser.id)
      .maybeSingle();

    if (!existingWallet) {
      const { error: walletError } = await supabase.from("wallets").insert({
        user_id: newUser.id,
        balance: 0,
        currency: "NGN",
      });

      if (walletError) {
        console.error("Wallet creation error:", walletError);
      }
    }

    // Create notification preferences (check if it exists first)
    const { data: existingNotif } = await supabase
      .from("notification_preferences")
      .select("id")
      .eq("user_id", newUser.id)
      .maybeSingle();

    if (!existingNotif) {
      const { error: notifError } = await supabase.from("notification_preferences").insert({
        user_id: newUser.id,
        push_enabled: true,
        sms_enabled: true,
        email_enabled: true,
      });

      if (notifError) {
        console.error("Notification preferences error:", notifError);
      }
    }

    // Create referral record for the user
    const { error: referralError } = await supabase.from("referrals").insert({
      referrer_id: newUser.id,
      referral_code: referralCode,
      status: "pending",
    });

    if (referralError) {
      console.error("Referral creation error:", referralError);
    }

    // Create role-specific records
    // Note: Driver and Rider profiles are created via dedicated endpoints (/api/drivers, /api/riders)
    if (role === "admin") {
      const { error: adminError } = await supabase.from("admins").insert({
        user_id: newUser.id,
        admin_level: adminLevel,
        permissions: {},
      });

      if (adminError) {
        console.error("Admin record creation error:", adminError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.first_name,
          lastName: newUser.last_name,
          phone: newUser.phone_number,
          dob: newUser.dob,
          gender: newUser.gender,
          profilePictureUrl: newUser.profile_picture_url,
          homeAddress: (newUser as any).home_address || "",
          workAddress: (newUser as any).work_address || "",
          emergencyContactName: (newUser as any).emergency_contact || "",
          emergencyContactPhone: (newUser as any).emergency_phone || "",
          role: newUser.role,
          referralCode: referralCode,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

