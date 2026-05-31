"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"
import { usePathname } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isCrmRoute = pathname?.startsWith("/admin/crm")

  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="flex min-h-screen bg-background">
        {!isCrmRoute && <DashboardSidebar />}
        <div className="flex-1">{children}</div>
        {!isCrmRoute && <AdminBottomNavigation />}
      </div>
    </ProtectedRoute>
  )
}
