"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar />
        <div className="flex-1">{children}</div>
        <AdminBottomNavigation />
      </div>
    </ProtectedRoute>
  )
}
