"use client"

import { useAuth } from "@/lib/auth-context"
import { signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LogOut } from "lucide-react"

export function LogoutDialog() {
  const { user, showLogoutConfirm, setShowLogoutConfirm, logout, isLoading } = useAuth()
  const pathname = usePathname()

  const handleLogout = async () => {
    const isAdminSession =
      pathname?.startsWith("/admin") ||
      pathname?.startsWith("/auth/admin") ||
      user?.role === "admin" ||
      user?.role === "super_admin"
    const callbackUrl = isAdminSession ? "/auth/admin/login" : "/auth/login"

    await signOut({ redirect: false, callbackUrl })
    await logout(callbackUrl)
  }

  return (
    <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
      <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-primary/20">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <LogOut className="h-5 w-5 text-primary" />
            Confirm Logout
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Are you sure you want to log out? You&apos;ll need to sign in again to access your dashboard.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-primary/20 hover:bg-primary/10">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          >
            {isLoading ? "Logging out..." : "Yes, Logout"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
