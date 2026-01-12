"use client"

import type React from "react"

import { useSession, signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { DashboardLoader } from "./dashboard-loader"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showLoader, setShowLoader] = useState(true)
  const initialLoadRef = useRef(true)

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn(undefined, { callbackUrl: "/auth/login" })
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
          initialLoadRef.current = false
        }, 500)

        return () => clearTimeout(timer)
      } else {
        setIsAuthorized(true)
        setShowLoader(false)
      }
    }
  }, [session, status, allowedRoles, router])

  if (status === "loading" || showLoader) {
    return <DashboardLoader />
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
