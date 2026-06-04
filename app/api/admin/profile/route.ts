import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { requireAdminSession } from "@/lib/admin-access"
import { supabaseAdmin } from "@/lib/supabase"

const USER_FIELDS =
  "id, first_name, last_name, phone_number, email, profile_picture_url, role, status, profile_complete, emergency_contact, emergency_phone, created_at, updated_at"

const ADMIN_FIELDS =
  "id, user_id, admin_level, department, crm_enabled, crm_meta, permissions, created_at, updated_at"

async function loadProfile(userId: string) {
  const [{ data: user, error: userError }, { data: admin, error: adminError }] = await Promise.all([
    supabaseAdmin.from("users").select(USER_FIELDS).eq("id", userId).single(),
    supabaseAdmin.from("admins").select(ADMIN_FIELDS).eq("user_id", userId).single(),
  ])

  if (userError) throw userError
  if (adminError) throw adminError

  return { user, admin }
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export async function GET(request: NextRequest) {
  try {
    const access = await requireAdminSession(request)
    if (!access.authorized || !access.session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const profile = await loadProfile(access.session.user.id)
    return NextResponse.json({ profile })
  } catch (error) {
    console.error("[ADMIN][PROFILE][GET]", error)
    return NextResponse.json({ error: "Failed to load admin profile" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireAdminSession(request)
    if (!access.authorized || !access.session?.user?.id || !access.admin?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const userId = access.session.user.id
    const { user: existingUser, admin: existingAdmin } = await loadProfile(userId)
    const userUpdates: Record<string, unknown> = {}
    const changedFields: Record<string, unknown> = {}

    if ("firstName" in body) userUpdates.first_name = cleanString(body.firstName)
    if ("lastName" in body) userUpdates.last_name = cleanString(body.lastName)
    if ("phone" in body) userUpdates.phone_number = cleanString(body.phone)
    if ("email" in body) userUpdates.email = cleanString(body.email).toLowerCase()
    if ("emergencyContact" in body) userUpdates.emergency_contact = cleanString(body.emergencyContact) || null
    if ("emergencyPhone" in body) userUpdates.emergency_phone = cleanString(body.emergencyPhone) || null

    if (Object.keys(userUpdates).length > 0) {
      if (!userUpdates.first_name && "first_name" in userUpdates) {
        return NextResponse.json({ error: "First name is required" }, { status: 400 })
      }
      if (!userUpdates.last_name && "last_name" in userUpdates) {
        return NextResponse.json({ error: "Last name is required" }, { status: 400 })
      }
      if (!userUpdates.email && "email" in userUpdates) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 })
      }
      if (!userUpdates.phone_number && "phone_number" in userUpdates) {
        return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
      }

      const { error: updateUserError } = await supabaseAdmin
        .from("users")
        .update(userUpdates)
        .eq("id", userId)

      if (updateUserError) {
        return NextResponse.json({ error: updateUserError.message }, { status: 400 })
      }

      changedFields.profile = userUpdates
    }

    if (body?.crmMeta && typeof body.crmMeta === "object" && !Array.isArray(body.crmMeta)) {
      const existingMeta =
        existingAdmin.crm_meta && typeof existingAdmin.crm_meta === "object" && !Array.isArray(existingAdmin.crm_meta)
          ? existingAdmin.crm_meta
          : {}
      const nextMeta = {
        ...existingMeta,
        preferences: {
          ...((existingMeta as Record<string, any>).preferences || {}),
          ...body.crmMeta.preferences,
        },
      }

      const { error: adminUpdateError } = await supabaseAdmin
        .from("admins")
        .update({ crm_meta: nextMeta })
        .eq("id", existingAdmin.id)

      if (adminUpdateError) {
        return NextResponse.json({ error: adminUpdateError.message }, { status: 400 })
      }

      changedFields.crm_meta = nextMeta
    }

    const currentPassword = cleanString(body?.currentPassword)
    const newPassword = cleanString(body?.newPassword)
    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 })
      }

      const { data: passwordUser, error: passwordFetchError } = await supabaseAdmin
        .from("users")
        .select("password_hash")
        .eq("id", userId)
        .single()

      if (passwordFetchError || !passwordUser?.password_hash) {
        return NextResponse.json({ error: "Unable to verify current password" }, { status: 400 })
      }

      const passwordMatches = await bcrypt.compare(currentPassword, passwordUser.password_hash)
      if (!passwordMatches) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }

      const passwordHash = await bcrypt.hash(newPassword, 10)
      const { error: passwordUpdateError } = await supabaseAdmin
        .from("users")
        .update({ password_hash: passwordHash })
        .eq("id", userId)

      if (passwordUpdateError) {
        return NextResponse.json({ error: passwordUpdateError.message }, { status: 400 })
      }

      changedFields.password = "updated"
    }

    if (Object.keys(changedFields).length > 0) {
      await supabaseAdmin.from("audit_logs").insert({
        user_id: userId,
        action: "Admin profile updated",
        entity_type: "admin",
        entity_id: existingAdmin.id,
        changes: {
          fields: changedFields,
          previous: {
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            email: existingUser.email,
            phone_number: existingUser.phone_number,
          },
        },
        ip_address: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: request.headers.get("user-agent"),
      })
    }

    const profile = await loadProfile(userId)
    return NextResponse.json({ profile, message: "Profile updated successfully" })
  } catch (error) {
    console.error("[ADMIN][PROFILE][PATCH]", error)
    return NextResponse.json({ error: "Failed to update admin profile" }, { status: 500 })
  }
}
