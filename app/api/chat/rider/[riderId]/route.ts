import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ riderId: string }> }) {
  const { riderId } = await params;
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch rider profile data from users table
    const { data: rider, error: riderError } = await supabaseAdmin!
      .from("users")
      .select(`
        id,
        first_name,
        last_name,
        phone_number,
        profile_picture_url,
        email,
        role,
        created_at
      `)
      .eq('id', riderId)
      .single();

    if (riderError) {
      console.error('Rider fetch error:', riderError);
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    if (!rider) {
      return NextResponse.json({ error: "Rider not found" }, { status: 404 });
    }

    return NextResponse.json({ rider });
  } catch (error) {
    console.error('Rider profile GET error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}