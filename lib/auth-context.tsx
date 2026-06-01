"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

export type UserRole = "user" | "driver" | "admin" | "super_admin"

export interface User {
  id: string
  email: string
  phone?: string
  firstName: string
  lastName: string
  role: UserRole
  referralCode: string
  referredBy?: string
  createdAt: string
  profilePictureUrl?: string
  adminLevel?: string | null
  department?: string | null
  crmEnabled?: boolean
  permissions?: Record<string, boolean>
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: (redirectTo?: string) => Promise<void>
  showLogoutConfirm: boolean
  setShowLogoutConfirm: (show: boolean) => void
}

interface RegisterData {
  email: string
  phone: string
  password: string
  firstName: string
  lastName: string
  role: UserRole
  referralCode?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    // First, check NextAuth session
    if (status === "authenticated" && session?.user) {
      const nextAuthUser: User = {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        phone: (session.user as any).phone,
        firstName: (session.user as any).firstName || "",
        lastName: (session.user as any).lastName || "",
        role: (session.user as any).role || "user",
        referralCode: (session.user as any).referralCode || "",
        referredBy: (session.user as any).referredBy,
        profilePictureUrl: (session.user as any).profilePictureUrl || "",
        createdAt: (session.user as any).createdAt || new Date().toISOString(),
        adminLevel: (session.user as any).adminLevel || null,
        department: (session.user as any).department || null,
        crmEnabled: (session.user as any).crmEnabled !== false,
        permissions: (session.user as any).permissions || {},
      }
      setUser(nextAuthUser)
      localStorage.setItem("charterkeke_user", JSON.stringify(nextAuthUser))
      setIsLoading(false)

      if (nextAuthUser.role === "admin" || nextAuthUser.role === "super_admin") {
        fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
          .then((response) => (response.ok ? response.json() : null))
          .then((profile) => {
            if (!profile) return
            const hydratedUser: User = {
              ...nextAuthUser,
              adminLevel: profile.admin_level || nextAuthUser.adminLevel || null,
              department: profile.department || nextAuthUser.department || null,
              crmEnabled: profile.crm_enabled ?? nextAuthUser.crmEnabled,
              permissions: profile.permissions || nextAuthUser.permissions || {},
            }
            setUser(hydratedUser)
            localStorage.setItem("charterkeke_user", JSON.stringify(hydratedUser))
          })
          .catch((error) => {
            console.error("Admin profile hydration failed:", error)
          })
      }
    } else if (status === "unauthenticated") {
      // Check for existing session in localStorage as fallback
      try {
        const storedUser = localStorage.getItem("charterkeke_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error("Session check failed:", error)
        setUser(null)
      }
      setIsLoading(false)
    }
    // status === "loading" - keep isLoading true
  }, [session, status])

  const generateReferralCode = () => {
    return `EASE${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  }

  const login = async (emailOrPhone: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call - replace with actual API
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Demo users for testing
      const demoUsers: Record<string, User> = {
        "user@charterkeke.com": {
          id: "1",
          email: "user@charterkeke.com",
          phone: "+2348083191228",
          firstName: "Demo",
          lastName: "Rider",
          role: "user",
          referralCode: "CKRIDER01",
          createdAt: new Date().toISOString(),
        },
        "driver@charterkeke.com": {
          id: "2",
          email: "driver@charterkeke.com",
          phone: "+2348083191229",
          firstName: "Demo",
          lastName: "Driver",
          role: "driver",
          referralCode: "CKDRIVER01",
          createdAt: new Date().toISOString(),
        },
        "admin@charterkeke.com": {
          id: "3",
          email: "admin@charterkeke.com",
          phone: "+2348083191230",
          firstName: "Demo",
          lastName: "Admin",
          role: "admin",
          referralCode: "CKADMIN01",
          createdAt: new Date().toISOString(),
        },
      }

      const foundUser = demoUsers[emailOrPhone.toLowerCase()]

      if (foundUser && password === "demo123") {
        setUser(foundUser)
        localStorage.setItem("charterkeke_user", JSON.stringify(foundUser))
        return { success: true }
      }

      return { success: false, error: "Invalid credentials. Try again" }
    } catch (error) {
      return { success: false, error: "An error occurred. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const newUser: User = {
        id: Math.random().toString(36).substring(7),
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        referralCode: generateReferralCode(),
        referredBy: data.referralCode,
        createdAt: new Date().toISOString(),
      }

      setUser(newUser)
      localStorage.setItem("charterkeke_user", JSON.stringify(newUser))
      return { success: true }
    } catch (error) {
      return { success: false, error: "Registration failed. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async (redirectTo = "/") => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setUser(null)
      localStorage.removeItem("charterkeke_user")
      setShowLogoutConfirm(false)
      router.push(redirectTo)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        showLogoutConfirm,
        setShowLogoutConfirm,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
