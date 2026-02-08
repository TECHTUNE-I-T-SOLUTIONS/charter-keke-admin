import { supabase } from "./supabase"

/**
 * Check if a user has admin access with specific permissions
 * @param userId - The user ID to check
 * @param permission - The permission to verify (optional)
 * @returns True if user has access, false otherwise
 */
export async function checkAdminAccess(userId: string, permission?: string): Promise<boolean> {
  try {
    if (!userId) return false

    // Get the user details
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single()

    if (userError || !user) {
      console.error("Failed to fetch user:", userError)
      return false
    }

    // Check if user has admin or super_admin role
    if (user.role !== "admin" && user.role !== "super_admin") {
      return false
    }

    // If no specific permission is required, user is authorized
    if (!permission) {
      return true
    }

    // Get admin details with permissions
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("admin_level, permissions")
      .eq("user_id", userId)
      .single()

    if (adminError || !adminData) {
      console.error("Failed to fetch admin details:", adminError)
      return false
    }

    // Super admins have all permissions
    if (user.role === "super_admin") {
      return true
    }

    // Check if admin has the specific permission
    if (adminData.permissions && typeof adminData.permissions === "object") {
      const permissions = adminData.permissions as Record<string, boolean>
      return permissions[permission] === true
    }

    // Default permissions based on admin level
    const defaultPermissions: Record<string, string[]> = {
      support: ["view_users", "view_rides", "view_payments"],
      ops: ["view_users", "view_rides", "suspend_users", "view_drivers"],
      finance: ["view_payments", "view_drivers", "process_payouts"],
      super: ["*"], // Super admin has all permissions
    }

    const allowedPerms = defaultPermissions[adminData.admin_level] || []
    return allowedPerms.includes("*") || allowedPerms.includes(permission)
  } catch (error) {
    console.error("Admin access check error:", error)
    return false
  }
}

/**
 * Audit log an admin action
 * @param userId - The admin user ID
 * @param action - The action performed
 * @param entityType - Type of entity affected
 * @param entityId - ID of the affected entity
 * @param changes - Changes made
 */
export async function logAdminAction(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  changes?: Record<string, unknown>
): Promise<void> {
  try {
    // Get user IP and agent from headers (if available)
    const ipAddress = "0.0.0.0" // Would come from request headers in real implementation
    const userAgent = "Web Admin Panel"

    const { error } = await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      changes: changes || {},
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      console.error("Failed to log admin action:", error)
    }
  } catch (error) {
    console.error("Audit log error:", error)
  }
}
