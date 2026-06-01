import { NextRequest, NextResponse } from "next/server"
import { canCreateAdmins, requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized || !canCreateAdmins(access.admin?.admin_level, access.admin?.department)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabaseAdmin
      .from("admins")
      .select(
        `
          id,
          user_id,
          admin_level,
          department,
          crm_enabled,
          permissions,
          created_at,
          updated_at,
          users:user_id (
            id,
            first_name,
            last_name,
            email,
            role,
            status
          )
        `
      )
      .order("created_at", { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ admins: data || [] })
  } catch (error) {
    console.error("[ADMIN][ADMINS][GET]", error)
    return NextResponse.json({ error: "Failed to load admins" }, { status: 500 })
  }
}
