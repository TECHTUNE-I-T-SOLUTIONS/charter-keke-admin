import { NextRequest, NextResponse } from "next/server"
import { canCreateAdmins, requireAdminSession } from "@/lib/admin-access"
import { purgeDeletedUsersFromUsersTable } from "@/lib/contact-hygiene"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminSession(request)
    if (!access.authorized || !canCreateAdmins(access.admin?.admin_level, access.admin?.department)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = String(searchParams.get("search") || "").trim().toLowerCase()
    const role = String(searchParams.get("role") || "").trim()
    const limit = Math.min(Number(searchParams.get("limit") || 100), 250)

    let query = supabaseAdmin
      .from("deleted_accounts")
      .select("*")
      .order("deleted_at", { ascending: false })
      .limit(limit)

    if (role && role !== "all") {
      query = query.eq("role", role)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === "42P01") {
        return NextResponse.json({ deletedAccounts: [], stats: { total: 0, riders: 0, drivers: 0, admins: 0 }, migrationRequired: true })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const rows = (data || []).filter((row: any) => {
      if (!search) return true
      const haystack = [
        row.original_user_id,
        row.role,
        row.previous_status,
        row.masked_email,
        row.masked_phone,
        row.deletion_reason,
        row.email_hash,
        row.phone_hash,
      ].join(" ").toLowerCase()
      return haystack.includes(search)
    })

    const stats = {
      total: rows.length,
      riders: rows.filter((row: any) => row.role === "user").length,
      drivers: rows.filter((row: any) => row.role === "driver").length,
      admins: rows.filter((row: any) => row.role === "admin" || row.role === "super_admin").length,
    }

    return NextResponse.json({ deletedAccounts: rows, stats, migrationRequired: false })
  } catch (error) {
    console.error("[ADMIN][DELETED_ACCOUNTS][GET]", error)
    return NextResponse.json({ error: "Failed to load deleted accounts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAdminSession(request)
    if (!access.authorized || !canCreateAdmins(access.admin?.admin_level, access.admin?.department)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    if (body?.action !== "purge_deleted_users") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    }

    const result = await purgeDeletedUsersFromUsersTable(Math.min(Number(body?.limit || 100), 500))
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error("[ADMIN][DELETED_ACCOUNTS][POST]", error)
    return NextResponse.json({ error: "Failed to purge deleted users" }, { status: 500 })
  }
}
