"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { CrmSidebar } from "@/components/crm-sidebar"

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <div className="flex min-h-screen bg-background dark:bg-[radial-gradient(circle_at_top_left,rgba(176,124,38,0.15),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(14,116,144,0.08),transparent_30%),linear-gradient(180deg,rgba(7,10,18,0.99),rgba(10,14,24,0.98))] text-foreground font-sans antialiased overflow-hidden">
        {/* Dedicated CRM Left Rail Sidebar */}
        <CrmSidebar />

        {/* Main Operational Console Work Area */}
        <main className="flex-1 pt-16 lg:pt-0 min-w-0 flex flex-col h-screen overflow-hidden relative">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
