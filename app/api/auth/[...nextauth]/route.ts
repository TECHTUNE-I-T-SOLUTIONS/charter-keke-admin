import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { authSecret } from "@/lib/auth-secret";

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

const handler = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "text" },
        phone: { label: "Phone", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.password) {
          return null;
        }

        try {
          let user;

          if (credentials.email) {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("email", credentials.email)
              .single();
            user = data;
          } else if (credentials.phone) {
            const { data } = await supabase
              .from("users")
              .select("*")
              .eq("phone_number", credentials.phone)
              .single();
            user = data;
          }

          if (!user) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password_hash
          );

          if (!isPasswordValid || user.status !== "active") {
            return null;
          }

          const adminProfile = user.role === "admin" || user.role === "super_admin"
            ? await getAdminProfile(user.id)
            : null;

          return {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            phone_number: user.phone_number,
            role: user.role,
            status: user.status,
            image: user.profile_picture_url,
            profilePictureUrl: user.profile_picture_url,
            profileComplete: user.profile_complete,
            createdAt: user.created_at,
            adminId: adminProfile?.id || null,
            adminLevel: adminProfile?.admin_level || null,
            department: adminProfile?.department || null,
            crmEnabled: adminProfile?.crm_enabled ?? false,
            permissions: isSuperAdminLevel(adminProfile?.admin_level)
              ? { "*": true, super_admin: true }
              : adminProfile?.permissions || {},
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.phone = user.phone;
        token.role = user.role;
        token.email = user.email;
        token.profilePictureUrl = user.profilePictureUrl;
        token.profileComplete = user.profileComplete;
        token.createdAt = user.createdAt;
        token.status = user.status;
        token.adminId = user.adminId;
        token.adminLevel = user.adminLevel;
        token.department = user.department;
        token.crmEnabled = user.crmEnabled;
        token.permissions = user.permissions;
      }

      const userId = (token.id as string) || (token.sub as string) || "";
      const role = token.role as string;
      if (userId && (role === "admin" || role === "super_admin")) {
        const adminProfile = await getAdminProfile(userId);
        if (adminProfile) {
          token.adminId = adminProfile.id;
          token.adminLevel = adminProfile.admin_level;
          token.department = adminProfile.department;
          token.crmEnabled = adminProfile.crm_enabled ?? false;
          token.permissions = isSuperAdminLevel(adminProfile.admin_level)
            ? { "*": true, super_admin: true }
            : adminProfile.permissions || {};
        }
      }

      return token;
    },
    async session({ session, token }: any) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.phone = token.phone;
        session.user.role = token.role;
        session.user.profilePictureUrl = token.profilePictureUrl;
        session.user.profileComplete = token.profileComplete;
        session.user.createdAt = token.createdAt;
        session.user.status = token.status;
        session.user.adminId = token.adminId;
        session.user.adminLevel = token.adminLevel;
        session.user.department = token.department;
        session.user.crmEnabled = token.crmEnabled;
        session.user.permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  secret: authSecret,
});

export { handler as GET, handler as POST };
