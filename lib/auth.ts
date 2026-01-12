import { supabase } from "./supabase";
import bcrypt from "bcryptjs";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

/**
 * Get the current session from the request
 * Used in API route handlers
 */
export async function getSessionFromRequest(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return null;
    }

    return {
      user: {
        id: token.id as string,
        email: token.email as string,
        firstName: token.firstName as string,
        lastName: token.lastName as string,
        role: token.role as string,
        phone: token.phone as string,
        referralCode: token.referralCode as string,
        createdAt: token.createdAt as string,
      },
    };
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


