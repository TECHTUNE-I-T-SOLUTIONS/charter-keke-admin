import { NextRequest, NextResponse } from "next/server"
import { canCreateAdmins, requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

const VALID_ADMIN_LEVELS = new Set(["support", "ops", "finance", "super"])
const VALID_DEPARTMENTS = new Set([
  "general",
  "support",
  "operations",
  "billing",
  "finance",
  "technical",
  "engineering",
  "product",
  "trust_safety",
  "rider_management",
  "driver_management",
  "hr",
])

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
            phone_number,
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

export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized || !canCreateAdmins(access.admin?.admin_level, access.admin?.department)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const adminId = String(body?.adminId || "").trim()
    const reviewStatus = String(body?.reviewStatus || "").trim()
    const reviewMessage = String(body?.reviewMessage || "").trim()

    if (!adminId || !["approved", "rejected", "pending_review"].includes(reviewStatus)) {
      return NextResponse.json({ error: "adminId and a valid reviewStatus are required" }, { status: 400 })
    }

    const { data: currentAdmin, error: currentError } = await supabaseAdmin
      .from("admins")
      .select("id, user_id, permissions")
      .eq("id", adminId)
      .single()

    if (currentError || !currentAdmin) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const previousPermissions = currentAdmin.permissions && typeof currentAdmin.permissions === "object"
      ? currentAdmin.permissions as Record<string, unknown>
      : {}

    const nextPermissions = {
      ...previousPermissions,
      status: reviewStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: access.session?.user?.id || null,
      review_message: reviewMessage || (
        reviewStatus === "approved"
          ? "Admin access approved."
          : reviewStatus === "rejected"
            ? "Admin access rejected."
            : "Admin access returned to pending review."
      ),
    }

    const adminUpdates: Record<string, unknown> = { permissions: nextPermissions }
    if (reviewStatus === "approved") adminUpdates.crm_enabled = true
    if (reviewStatus === "rejected") adminUpdates.crm_enabled = false

    const { data: updatedAdmin, error: updateError } = await supabaseAdmin
      .from("admins")
      .update(adminUpdates)
      .eq("id", adminId)
      .select(`
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
          phone_number,
          role,
          status
        )
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    await supabaseAdmin.from("audit_logs").insert({
      user_id: access.session?.user?.id || null,
      action: `Admin review ${reviewStatus}`,
      entity_type: "admin",
      entity_id: adminId,
      changes: {
        permissions: { from: previousPermissions, to: nextPermissions },
        summary: `Admin access marked ${reviewStatus}`,
      },
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({
      admin: updatedAdmin,
      message: reviewStatus === "approved"
        ? "Admin access approved successfully."
        : reviewStatus === "rejected"
          ? "Admin access rejected."
          : "Admin access returned to pending review.",
    })
  } catch (error) {
    console.error("[ADMIN][ADMINS][PATCH]", error)
    return NextResponse.json({ error: "Failed to update admin review status" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase admin client unavailable" }, { status: 503 })
    }

    const access = await requireAdminSession(request)
    if (!access.authorized || !canCreateAdmins(access.admin?.admin_level, access.admin?.department)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const firstName = String(body?.firstName || "").trim()
    const lastName = String(body?.lastName || "").trim()
    const email = String(body?.email || "").trim().toLowerCase()
    const phone = String(body?.phone || "").trim()
    const password = String(body?.password || "").trim()
    const adminLevel = String(body?.adminLevel || "support").trim().toLowerCase()
    const department = String(body?.department || "general").trim().toLowerCase()
    const crmEnabled = Boolean(body?.crmEnabled)

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json({ error: "First name, last name, email, phone, and password are required" }, { status: 400 })
    }

    if (!VALID_ADMIN_LEVELS.has(adminLevel)) {
      return NextResponse.json({ error: "Invalid admin level for the current database schema" }, { status: 400 })
    }

    if (!VALID_DEPARTMENTS.has(department)) {
      return NextResponse.json({ error: "Invalid department" }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phone,
        password_hash: passwordHash,
        role: "admin",
        status: "active",
        profile_complete: true,
      })
      .select("id, first_name, last_name, email, phone_number, role, status, created_at")
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 400 })
    }

    const { data: admin, error: adminError } = await supabaseAdmin
      .from("admins")
      .insert({
        user_id: user.id,
        admin_level: adminLevel,
        department,
        crm_enabled: crmEnabled,
        permissions: body?.permissions && typeof body.permissions === "object" ? body.permissions : {},
      })
      .select("id, user_id, admin_level, department, crm_enabled, permissions, created_at, updated_at")
      .single()

    if (adminError) {
      await supabaseAdmin.from("users").delete().eq("id", user.id)
      return NextResponse.json({ error: adminError.message }, { status: 400 })
    }

    return NextResponse.json({ admin: { ...admin, users: user } }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN][ADMINS][POST]", error)
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 })
  }
}
