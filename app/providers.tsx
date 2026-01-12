"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth-context"
import { LogoutDialog } from "@/components/logout-dialog"
import { BottomNavigation } from "@/components/bottom-navigation"
import { PublicBottomNavigation } from "@/components/public-bottom-navigation"
import { Toaster } from "@/components/ui/sonner"
import { NotificationPrompt } from "@/components/notification-prompt"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
        <AuthProvider>
          {children}
          <LogoutDialog />
          <NotificationPrompt />
          <BottomNavigation />
          <PublicBottomNavigation />
        </AuthProvider>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </SessionProvider>
  )
}
