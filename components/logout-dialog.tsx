"use client"

import { useAuth } from "@/lib/auth-context"
import { signOut } from "next-auth/react"
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
  const { showLogoutConfirm, setShowLogoutConfirm, logout, isLoading } = useAuth()

  const handleLogout = async () => {
    // First try NextAuth logout
    await signOut({ redirect: true, callbackUrl: "/auth/login" })
    // Also call the context logout for cleanup
    await logout()
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
