import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionFromRequest } from "@/lib/auth";

const SUPER_ADMIN_LEVELS = new Set(["super", "super_admin", "super-admin", "superadmin"]);

function isSuperAdminLevel(level?: string | null) {
  return SUPER_ADMIN_LEVELS.has(String(level || "").trim().toLowerCase().replace(/\s+/g, "_"));
}

/**
 * GET /api/auth/me
 * Get current authenticated user's profile
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabaseAdmin!
      .from("users")
      .select(`
        id,
        email,
        phone_number,
        first_name,
        last_name,
        profile_picture_url,
        role,
        created_at,
        updated_at
      `)
      .eq("id", session.user.id)
      .single();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: adminProfile } = user.role === "admin" || user.role === "super_admin"
      ? await supabaseAdmin!
          .from("admins")
          .select("id, admin_level, department, crm_enabled, permissions")
          .eq("user_id", user.id)
          .maybeSingle()
      : { data: null };

    return NextResponse.json({
      id: user.id,
      email: user.email,
      phone_number: user.phone_number,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_picture_url: user.profile_picture_url,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
      admin_id: adminProfile?.id || null,
      admin_level: adminProfile?.admin_level || null,
      department: adminProfile?.department || null,
      crm_enabled: adminProfile?.crm_enabled ?? false,
      permissions: isSuperAdminLevel(adminProfile?.admin_level)
        ? { "*": true, super_admin: true }
        : adminProfile?.permissions || {},
    });
  } catch (error) {
    console.error("[GET /api/auth/me] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
