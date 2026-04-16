import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest, { params }: { params: Promise<{ driverId: string }> }) {
  const { driverId } = await params;
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch driver profile data from users table
    const { data: driver, error: driverError } = await supabaseAdmin!
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
      .eq('id', driverId)
      .eq('role', 'driver')
      .single();

    if (driverError) {
      console.error('Driver fetch error:', driverError);
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    return NextResponse.json({ driver });
  } catch (error) {
    console.error('Driver profile GET error:', error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}