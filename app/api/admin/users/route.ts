import { NextRequest, NextResponse } from "next/server"
import { supabase, supabaseAdmin } from "@/lib/supabase"
import { getSessionFromRequest } from "@/lib/auth"
import { checkAdminAccess, logAdminAction } from "@/lib/admin"

/**
 * GET /api/admin/users
 * Fetch users list with optional filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    let query = supabase
      .from("users")
      .select("id, first_name, last_name, email, phone_number, role, status, created_at, profile_picture_url")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    // Add status filter
    if (status) {
      query = query.eq("status", status)
    }

    // Add search filter
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone_number.ilike.%${search}%`
      )
    }

    const { data: users, error, count } = await query

    if (error) {
      console.error("Users fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json(
      {
        users: users || [],
        count: count || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Users error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Admin client not available" },
        { status: 503 }
      );
    }

    const hasAccess = await checkAdminAccess(
      session.user.id,
      "suspend_users"
    );
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Permission denied" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, status } = body;

    if (!userId || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: updatedUser, error } = await supabaseAdmin
      .from("users")
      .update({ status })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "User status updated",
      user: updatedUser,
    });
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
