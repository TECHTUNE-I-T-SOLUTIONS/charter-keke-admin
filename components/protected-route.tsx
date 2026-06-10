"use client"

import type React from "react"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { DashboardLoader } from "./dashboard-loader"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  loginPath?: string
}

let hasCompletedInitialAuthGate = false

export function ProtectedRoute({ children, allowedRoles, loginPath = "/auth/login" }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showLoader, setShowLoader] = useState(!hasCompletedInitialAuthGate)
  const initialLoadRef = useRef(!hasCompletedInitialAuthGate)

  useEffect(() => {
    if (status === "unauthenticated") {
      const callbackUrl =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/"
      router.replace(`${loginPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`)
      return
    }

    if (status === "authenticated") {
      const userRole = (session?.user as any)?.role
      
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        // Redirect to appropriate dashboard based on role
        switch (userRole) {
          case "admin":
          case "super_admin":
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

      // Only show loader on initial load, not on navigation
      if (initialLoadRef.current) {
        const timer = setTimeout(() => {
          setIsAuthorized(true)
          setShowLoader(false)
          hasCompletedInitialAuthGate = true
          initialLoadRef.current = false
        }, 500)

        return () => clearTimeout(timer)
      } else {
        setIsAuthorized(true)
        setShowLoader(false)
      }
    }
  }, [session, status, allowedRoles, router, loginPath])

  if (status === "loading" || showLoader) {
    return <DashboardLoader />
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
