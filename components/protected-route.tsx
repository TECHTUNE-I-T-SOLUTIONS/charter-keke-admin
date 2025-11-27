"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { DashboardLoader } from "./dashboard-loader"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showLoader, setShowLoader] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/login")
        return
      }

      if (!allowedRoles.includes(user.role)) {
        // Redirect to appropriate dashboard based on role
        switch (user.role) {
          case "admin":
            router.push("/admin/dashboard")
            break
          case "driver":
            router.push("/driver/dashboard")
            break
          default:
            router.push("/user/dashboard")
        }
        return
      }

      // Show loader for a minimum time to allow proper setup
      const timer = setTimeout(() => {
        setIsAuthorized(true)
        setShowLoader(false)
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [user, isLoading, allowedRoles, router])

  if (isLoading || showLoader) {
    return <DashboardLoader />
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
