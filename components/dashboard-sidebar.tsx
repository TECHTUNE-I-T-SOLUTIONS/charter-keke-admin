"use client"

import type React from "react"

import { useState, useMemo, useCallback, memo } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Home,
  Car,
  History,
  Wallet,
  Settings,
  Gift,
  Bell,
  LogOut,
  Menu,
  X,
  Users,
  BarChart3,
  Shield,
  CreditCard,
  MessageSquare,
  MapPin,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

// Memoized nav items to prevent recreation on every render
const userNavItems: NavItem[] = [
  { label: "Dashboard", href: "/user/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Book a Ride", href: "/user/book", icon: <Car className="h-5 w-5" /> },
  { label: "My Rides", href: "/user/rides", icon: <History className="h-5 w-5" /> },
  { label: "Wallet", href: "/user/wallet", icon: <Wallet className="h-5 w-5" /> },
  { label: "Referrals", href: "/user/referrals", icon: <Gift className="h-5 w-5" /> },
  { label: "Notifications", href: "/user/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "Settings", href: "/user/settings", icon: <Settings className="h-5 w-5" /> },
]

const driverNavItems: NavItem[] = [
  { label: "Dashboard", href: "/driver/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Active Rides", href: "/driver/rides", icon: <Car className="h-5 w-5" /> },
  { label: "Ride History", href: "/driver/history", icon: <History className="h-5 w-5" /> },
  { label: "Earnings", href: "/driver/earnings", icon: <Wallet className="h-5 w-5" /> },
  { label: "Payments", href: "/driver/payments", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Referrals", href: "/driver/referrals", icon: <Gift className="h-5 w-5" /> },
  { label: "Notifications", href: "/driver/notifications", icon: <Bell className="h-5 w-5" /> },
  { label: "Settings", href: "/driver/settings", icon: <Settings className="h-5 w-5" /> },
]

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { label: "Drivers", href: "/admin/drivers", icon: <Car className="h-5 w-5" /> },
  { label: "Rides", href: "/admin/rides", icon: <MapPin className="h-5 w-5" /> },
  { label: "Analytics", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5" /> },
  { label: "Payments", href: "/admin/payments", icon: <CreditCard className="h-5 w-5" /> },
  { label: "Messages", href: "/admin/messages", icon: <MessageSquare className="h-5 w-5" /> },
  { label: "Security", href: "/admin/security", icon: <Shield className="h-5 w-5" /> },
  { label: "Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
]

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return adminNavItems
    case "driver":
      return driverNavItems
    default:
      return userNavItems
  }
}

// Memoized sidebar content component
const SidebarContent = memo(({ user, pathname, setIsMobileOpen, onLogout }: { user: any; pathname: string; setIsMobileOpen: (open: boolean) => void; onLogout?: () => void }) => {
  const navItems = useMemo(() => getNavItems(user.role), [user.role])

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-primary/10">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/charter keke.png" alt="Charter Keke" width={40} height={40} className="rounded-lg" />
          <span className="text-sm font-serif font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            CHARTER KEKE
          </span>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-primary/10">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-medium">
            {user.firstName[0]}
            {user.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-primary/25"
                  : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-primary/10">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent"
          onClick={onLogout}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  )
})

export const DashboardSidebar = memo(function DashboardSidebarComponent() {
  const { user, setShowLogoutConfirm } = useAuth()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  if (!user) return null

  // Memoize callback to prevent re-renders
  const handleLogout = useCallback(() => {
    setShowLogoutConfirm(true)
  }, [setShowLogoutConfirm])

  // Memoize the sidebar content render to prevent unnecessary re-renders
  const sidebarContent = useMemo(
    () => <SidebarContent user={user} pathname={pathname} setIsMobileOpen={setIsMobileOpen} onLogout={handleLogout} />,
    [user?.id, user?.firstName, user?.lastName, user?.role, pathname, handleLogout]
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-card/50 backdrop-blur-xl border-r border-primary/10 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-[#052659] to-[#4353a4] rounded-lg flex items-center justify-center text-white font-bold text-lg">
              <Image src="/charter keke.png" alt="Charter Keke" width={32} height={32} className="rounded-lg" />
            </div>
            <span className="text-sm font-serif font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              CHARTER KEKE
            </span>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="text-foreground">
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Sidebar - Simple CSS transitions, no Framer Motion */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-primary/10 transition-transform duration-300 ease-in-out">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </Button>
            <SidebarContent user={user} pathname={pathname} setIsMobileOpen={setIsMobileOpen} onLogout={handleLogout} />
          </aside>
        </>
      )}
    </>
  )
})
