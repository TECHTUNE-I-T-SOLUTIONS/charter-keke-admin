import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const verified = searchParams.get("verified");

    let query = supabaseAdmin.from("drivers").select("*, users(*)");

    if (status) query = query.eq("availability_status", status);
    if (verified) query = query.eq("verified", verified === "true");

    const { data: drivers, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch drivers" },
        { status: 500 }
      );
    }

    return NextResponse.json({ drivers });
  } catch (error) {
    console.error("Driver fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
