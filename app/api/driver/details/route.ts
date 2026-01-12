import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id || session.user.role !== "driver") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user and driver details together
    const { data: driver, error: driverError } = await supabase
      .from("drivers")
      .select(`
        *,
        users (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          profile_picture_url,
          dob,
          gender
        )
      `)
      .eq("user_id", session.user.id)
      .single();

    if (driverError || !driver) {
      console.error("Driver fetch error:", driverError);
      return NextResponse.json(
        { error: "Driver record not found" },
        { status: 404 }
      );
    }

    // Also get user data directly
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (userError) {
      console.error("User fetch error:", userError);
      return NextResponse.json(
        { error: "User record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      driver,
      user,
      combined: {
        ...user,
        ...driver,
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Get driver details error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
