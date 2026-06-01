import { NextRequest } from "next/server"
import { getSessionFromRequest } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

const CRM_DEPARTMENTS = new Set(["support", "general", "customer_support"])
const ADMIN_CREATOR_DEPARTMENTS = new Set(["hr", "human_resources"])

export async function getAdminProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("admins")
    .select("id, user_id, admin_level, department, crm_enabled, permissions")
    .eq("user_id", userId)
    .maybeSingle()

  return data || null
}

export async function requireAdminSession(request: NextRequest) {
  const session = await getSessionFromRequest(request)
  const role = session?.user?.role

  if (!session?.user?.id || (role !== "admin" && role !== "super_admin")) {
    return { session: null, admin: null, authorized: false }
  }

  const admin = await getAdminProfile(session.user.id)
  return { session, admin, authorized: true }
}

export async function requireCrmAccess(request: NextRequest) {
  const result = await requireAdminSession(request)
  if (!result.authorized || !result.session?.user) return { ...result, authorized: false }
  if (result.session.user.role === "super_admin") return result

  const department = String(result.admin?.department || "").toLowerCase()
  const crmEnabled = result.admin?.crm_enabled !== false
  return {
    ...result,
    authorized: crmEnabled && CRM_DEPARTMENTS.has(department),
  }
}

export function canCreateAdmins(role?: string | null, department?: string | null) {
  if (role === "super_admin") return true
  return ADMIN_CREATOR_DEPARTMENTS.has(String(department || "").toLowerCase())
}
