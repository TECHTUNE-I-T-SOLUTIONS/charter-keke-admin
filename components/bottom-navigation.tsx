"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { useMemo } from "react"
import {
  Home,
  Car,
  History,
  Wallet,
  Gift,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const userBottomNavItems: NavItem[] = [
  { label: "Home", href: "/user/dashboard", icon: <Home className="h-6 w-6" /> },
  { label: "Book", href: "/user/book", icon: <Car className="h-6 w-6" /> },
  { label: "Rides", href: "/user/rides", icon: <History className="h-6 w-6" /> },
  { label: "Wallet", href: "/user/wallet", icon: <Wallet className="h-6 w-6" /> },
  { label: "More", href: "/user/referrals", icon: <Gift className="h-6 w-6" /> },
]

const driverBottomNavItems: NavItem[] = [
  { label: "Home", href: "/driver/dashboard", icon: <Home className="h-6 w-6" /> },
  { label: "Rides", href: "/driver/rides", icon: <Car className="h-6 w-6" /> },
  { label: "History", href: "/driver/history", icon: <History className="h-6 w-6" /> },
  { label: "Earnings", href: "/driver/earnings", icon: <Wallet className="h-6 w-6" /> },
  { label: "More", href: "/driver/referrals", icon: <Gift className="h-6 w-6" /> },
]

function getBottomNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case "driver":
      return driverBottomNavItems
    default:
      return userBottomNavItems
  }
}

export function BottomNavigation() {
  const { user: contextUser } = useAuth()
  const { data: session } = useSession()
  const pathname = usePathname()

  const user = useMemo(() => {
    if (session?.user) {
      return {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        firstName: (session.user as any).firstName || "User",
        role: ((session.user as any).role || "user") as UserRole,
      }
    }
    return contextUser
  }, [session?.user, contextUser])

  const navItems = useMemo(() => {
    if (!user?.role) return []
    return getBottomNavItems(user.role)
  }, [user?.role])

  if (!user?.role) return null

  // Only show in dashboard pages
  const isDashboard = pathname.includes("/dashboard") || pathname.includes("/rides") || pathname.includes("/wallet") || pathname.includes("/book") || pathname.includes("/earnings") || pathname.includes("/history") || pathname.includes("/referrals") || pathname.includes("/notifications") || pathname.includes("/settings")
  
  if (!isDashboard) return null

  // Determine if link is active
  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href.includes("referrals") && pathname.includes("referrals")) return true
    if (href.includes("referrals") && pathname.includes("notifications")) return true
    if (href.includes("referrals") && pathname.includes("settings")) return true
    return false
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40">
      <div className="flex items-center justify-around h-20 px-2">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 relative group transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-all ${
                  active
                    ? "text-primary bg-primary/10 scale-110"
                    : "text-muted-foreground group-hover:text-foreground"
                }`}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium">
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
