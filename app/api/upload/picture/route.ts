import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const pictureType = formData.get("type") as string; // 'profile', 'vehicle', or 'license'

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file is image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    // Create unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const filename = `${session.user.id}/${pictureType}/${timestamp}-${randomString}-${file.name}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("profile-pictures")
      .upload(filename, buffer, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("profile-pictures")
      .getPublicUrl(filename);

    const publicUrl = urlData?.publicUrl;

    // Update user or driver profile based on type
    if (pictureType === "profile") {
      const { error: updateError } = await supabaseAdmin
        .from("users")
        .update({ profile_picture_url: publicUrl })
        .eq("id", session.user.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update profile" },
          { status: 500 }
        );
      }
    } else if (pictureType === "vehicle" || pictureType === "license") {
      // Get driver ID
      const { data: driver } = await supabaseAdmin
        .from("drivers")
        .select("id")
        .eq("user_id", session.user.id)
        .single();

      if (!driver) {
        return NextResponse.json(
          { error: "Driver profile not found" },
          { status: 404 }
        );
      }

      const columnName = pictureType === "vehicle" ? "vehicle_picture_url" : "license_picture_url";

      const { error: updateError } = await supabaseAdmin
        .from("drivers")
        .update({ [columnName]: publicUrl })
        .eq("id", driver.id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update driver profile" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      {
        message: "Picture uploaded successfully",
        url: publicUrl,
        type: pictureType,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
