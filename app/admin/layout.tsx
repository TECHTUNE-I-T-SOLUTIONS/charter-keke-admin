"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"
import { AdminPushFloatingBell } from "@/components/admin-push-floating-bell"
import { usePathname } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCrmRoute = pathname?.startsWith("/admin/crm")

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]} loginPath="/auth/admin/login">
      <div className="flex min-h-screen bg-background">
        {!isCrmRoute && <DashboardSidebar />}
        <div className="flex-1">{children}</div>
        <AdminPushFloatingBell />
        {!isCrmRoute && <AdminBottomNavigation />}
      </div>
    </ProtectedRoute>
  )
}
