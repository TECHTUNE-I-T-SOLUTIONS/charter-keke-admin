import { supabase } from "./supabase";
import bcrypt from "bcryptjs";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authSecret } from "./auth-secret";

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
      return {
        user: {
          id: nextAuthToken.id as string,
          email: nextAuthToken.email as string,
          firstName: nextAuthToken.firstName as string,
          lastName: nextAuthToken.lastName as string,
          role: nextAuthToken.role as string,
          phone: nextAuthToken.phone as string,
          referralCode: nextAuthToken.referralCode as string,
          createdAt: nextAuthToken.createdAt as string,
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
      const { data: user, error } = await supabase
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


