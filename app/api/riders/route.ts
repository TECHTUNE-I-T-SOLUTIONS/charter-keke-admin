import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const userId = body.userId as string;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user info - riders are just users with role 'user'
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (user.role !== "user") {
      return NextResponse.json(
        { error: "User is not a rider (must have role 'user')" },
        { status: 400 }
      );
    }

    // Return user info - no separate riders table needed
    return NextResponse.json({
      id: user.id,
      user_id: user.id,
      message: "Rider profile retrieved successfully",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
      }
    }, { status: 201 });
  } catch (error) {
    console.error("Rider creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
