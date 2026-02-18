import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";
import { uploadFileWithServiceRole } from "@/lib/upload-file";

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const formData = await request.formData();
    const profilePictureFile = formData.get("profilePicture") as File | null;

    if (!profilePictureFile || profilePictureFile.size === 0) {
      return NextResponse.json({ error: "Profile picture file is required" }, { status: 400 });
    }

    if (!profilePictureFile.type?.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
    }

    let profilePictureUrl: string;
    try {
      const buffer = Buffer.from(await profilePictureFile.arrayBuffer());
      const ext = profilePictureFile.name.split(".").pop() || "jpg";
      const filePath = `${session.user.id}/${Date.now()}-avatar.${ext}`;

      const uploadResult = await uploadFileWithServiceRole(
        "profile-pictures",
        filePath,
        buffer,
        profilePictureFile.type
      );

      profilePictureUrl = uploadResult.url;
    } catch (uploadError) {
      console.error("Avatar upload error:", uploadError);
      return NextResponse.json({ error: "Avatar upload failed" }, { status: 502 });
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update({ profile_picture_url: profilePictureUrl, updated_at: new Date().toISOString() })
      .eq("id", session.user.id)
      .select("id,email,first_name,last_name,profile_picture_url,updated_at")
      .single();

    if (error) {
      console.error("Avatar DB update error:", error);
      return NextResponse.json({ error: "Failed to save avatar" }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Avatar updated successfully",
        user: updatedUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Avatar route error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
