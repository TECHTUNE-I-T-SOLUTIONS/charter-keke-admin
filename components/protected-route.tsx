"use client"

import type React from "react"

import { signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { DashboardLoader } from "./dashboard-loader"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  loginPath?: string
}

let hasCompletedInitialAuthGate = false
const ADMIN_IDLE_TIMEOUT_MS = 10 * 60 * 1000

export function ProtectedRoute({ children, allowedRoles, loginPath = "/auth/login" }: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [showLoader, setShowLoader] = useState(!hasCompletedInitialAuthGate)
  const initialLoadRef = useRef(!hasCompletedInitialAuthGate)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  useEffect(() => {
    const userRole = (session?.user as any)?.role
    const isAdminRoute =
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin")
    const isAdminSession = userRole === "admin" || userRole === "super_admin"

    if (status !== "authenticated" || !isAdminSession || !isAdminRoute) return

    const resetTimer = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      idleTimerRef.current = setTimeout(() => {
        signOut({
          callbackUrl: `${loginPath}?reason=inactive`,
          redirect: true,
        })
      }, ADMIN_IDLE_TIMEOUT_MS)
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"]
    events.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
      events.forEach((event) => window.removeEventListener(event, resetTimer))
    }
  }, [session, status, loginPath])

  if (status === "loading" || showLoader) {
    return <DashboardLoader />
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
