"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "user" | "driver" | "admin"

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
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (emailOrPhone: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
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

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem("easely_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Session check failed:", error)
      } finally {
        setIsLoading(false)
      }
    }
    checkSession()
  }, [])

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
        "user@easely.com": {
          id: "1",
          email: "user@easely.com",
          phone: "+2348083191228",
          firstName: "Demo",
          lastName: "User",
          role: "user",
          referralCode: "EASEUSER01",
          createdAt: new Date().toISOString(),
        },
        "driver@easely.com": {
          id: "2",
          email: "driver@easely.com",
          phone: "+2348083191229",
          firstName: "Demo",
          lastName: "Driver",
          role: "driver",
          referralCode: "EASEDRV01",
          createdAt: new Date().toISOString(),
        },
        "admin@easely.com": {
          id: "3",
          email: "admin@easely.com",
          phone: "+2348083191230",
          firstName: "Demo",
          lastName: "Admin",
          role: "admin",
          referralCode: "EASEADM01",
          createdAt: new Date().toISOString(),
        },
      }

      const foundUser = demoUsers[emailOrPhone.toLowerCase()]

      if (foundUser && password === "demo123") {
        setUser(foundUser)
        localStorage.setItem("easely_user", JSON.stringify(foundUser))
        return { success: true }
      }

      return { success: false, error: "Invalid credentials. Try demo accounts with password: demo123" }
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
      localStorage.setItem("easely_user", JSON.stringify(newUser))
      return { success: true }
    } catch (error) {
      return { success: false, error: "Registration failed. Please try again." }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 500))
      setUser(null)
      localStorage.removeItem("easely_user")
      setShowLogoutConfirm(false)
      router.push("/")
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
