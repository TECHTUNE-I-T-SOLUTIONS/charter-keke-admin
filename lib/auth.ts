import { supabase, supabaseAdmin } from "./supabase";
import bcrypt from "bcryptjs";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authSecret } from "./auth-secret";

const SUPER_ADMIN_LEVELS = new Set(["super", "super_admin", "super-admin", "superadmin"]);

function isSuperAdminLevel(level?: string | null) {
  return SUPER_ADMIN_LEVELS.has(String(level || "").trim().toLowerCase().replace(/\s+/g, "_"));
}

async function getAdminProfile(userId?: string | null) {
  if (!userId) return null;

  const { data, error } = await supabaseAdmin
    .from("admins")
    .select("id, admin_level, department, crm_enabled, permissions")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("[AUTH] Failed to load admin profile:", error);
    return null;
  }

  return data;
}

/**
 * Get the current session from the request
 * Supports both NextAuth JWT tokens and custom Bearer tokens (mobile app)
 * Used in API route handlers
 */
export async function getSessionFromRequest(request: NextRequest) {
  try {
    // First, try to get NextAuth token (for web app)
    const nextAuthToken = await getToken({
      req: request,
      secret: authSecret,
    });

    if (nextAuthToken) {
      const userId = (nextAuthToken.id as string) || (nextAuthToken.sub as string) || "";

      if (!userId) {
        console.warn("⚠️ [AUTH] NextAuth token found but no user id/sub present");
        return null;
      }

      let role = (nextAuthToken.role as string) || "";
      let email = (nextAuthToken.email as string) || "";
      let firstName = (nextAuthToken.firstName as string) || "";
      let lastName = (nextAuthToken.lastName as string) || "";
      let phone = (nextAuthToken.phone as string) || "";
      let referralCode = (nextAuthToken.referralCode as string) || "";
      let createdAt = (nextAuthToken.createdAt as string) || "";
      let adminLevel = (nextAuthToken.adminLevel as string) || "";
      let department = (nextAuthToken.department as string) || "";
      let crmEnabled = nextAuthToken.crmEnabled !== false;
      let adminId = (nextAuthToken.adminId as string) || "";
      let permissions = (nextAuthToken.permissions as Record<string, boolean>) || {};

      if (!role || !email) {
        const { data: user } = await supabase
          .from("users")
          .select("id, role, email, first_name, last_name, phone_number, referral_code, created_at")
          .eq("id", userId)
          .single();

        if (user) {
          role = role || user.role || "user";
          email = email || user.email || "";
          firstName = firstName || user.first_name || "";
          lastName = lastName || user.last_name || "";
          phone = phone || user.phone_number || "";
          referralCode = referralCode || user.referral_code || "";
          createdAt = createdAt || user.created_at || "";
        }
      }

      if (role === "admin" || role === "super_admin") {
        const adminProfile = await getAdminProfile(userId);
        if (adminProfile) {
          adminId = adminProfile.id || adminId;
          adminLevel = adminProfile.admin_level || adminLevel;
          department = adminProfile.department || department;
          crmEnabled = adminProfile.crm_enabled !== false;
          permissions = isSuperAdminLevel(adminProfile.admin_level)
            ? { "*": true, super_admin: true }
            : adminProfile.permissions || permissions || {};
        }
      }

      return {
        user: {
          id: userId,
          email,
          firstName,
          lastName,
          role: role || "user",
          phone,
          referralCode,
          createdAt,
          adminId,
          adminLevel,
          department,
          crmEnabled,
          permissions,
        },
      };
    }

    // If no NextAuth token, try custom Bearer token (mobile app)
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      const hasNextAuthCookie = request.cookies.getAll().some((c) => c.name.includes("next-auth.session-token"));
      if (hasNextAuthCookie) {
        console.warn("⚠️ [AUTH] NextAuth session cookie exists but token decode failed. Check NEXTAUTH_SECRET/AUTH_SECRET consistency.");
      }
      return null;
    }

    const customToken = authHeader.substring(7); // Remove "Bearer " prefix
    console.log("🔐 [AUTH] Validating custom Bearer token");

    try {
      // Decode the custom token (format: userId:timestamp encoded in base64)
      const decoded = Buffer.from(customToken, "base64").toString("utf-8");
      const [userId] = decoded.split(":"); // Extract userId

      if (!userId) {
        console.error("❌ [AUTH] Invalid custom token format");
        return null;
      }

      // Fetch user from database to get session info
      const { data: user, error } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !user) {
        console.error("❌ [AUTH] User not found for custom token:", error);
        return null;
      }

      if (user.status !== "active") {
        console.error("❌ [AUTH] User is not active:", user.status);
        return null;
      }

      console.log("✅ [AUTH] Custom Bearer token validated for user:", userId);

      const adminProfile = user.role === "admin" || user.role === "super_admin"
        ? await getAdminProfile(user.id)
        : null;

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          phone: user.phone_number,
          referralCode: user.referral_code,
          createdAt: user.created_at,
          adminId: adminProfile?.id || "",
          adminLevel: adminProfile?.admin_level || "",
          department: adminProfile?.department || "",
          crmEnabled: adminProfile?.crm_enabled !== false,
          permissions: isSuperAdminLevel(adminProfile?.admin_level)
            ? { "*": true, super_admin: true }
            : adminProfile?.permissions || {},
        },
      };
    } catch (e) {
      console.error("❌ [AUTH] Failed to decode custom token:", e);
      return null;
    }
  } catch (error) {
    console.error("Get session error:", error);
    return null;
  }
}

/**
 * Utility function to verify user credentials
 * Used in API endpoints for custom authentication logic
 */
export async function verifyCredentials(emailOrPhone: string, password: string) {
  try {
    let user;

    // Try email first
    if (emailOrPhone.includes("@")) {
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("email", emailOrPhone)
        .single();
      user = data;
    } else {
      // Try phone
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", emailOrPhone)
        .single();
      user = data;
    }

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid || user.status !== "active") {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Verify credentials error:", error);
    return null;
  }
}

/**
 * Utility function to hash passwords
 */
export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}


