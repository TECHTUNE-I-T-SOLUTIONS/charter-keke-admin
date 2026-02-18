import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const MAX_FILE_SIZE = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 });
    }

    const session = await getSessionFromRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const ticketId = String(formData.get("ticketId") || "unassigned");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image uploads are supported" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File must be less than 8MB" }, { status: 400 });
    }

    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `tickets/${ticketId}/${session.user.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("support-attachments")
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data } = supabaseAdmin.storage.from("support-attachments").getPublicUrl(filePath);

    return NextResponse.json(
      {
        url: data.publicUrl,
        path: filePath,
        name: file.name,
        mimeType: file.type,
        size: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[SUPPORT][UPLOAD]", error);
    return NextResponse.json({ error: "Failed to upload attachment" }, { status: 500 });
  }
}
