"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useMemo } from "react"
import {
  Home,
  Info,
  HelpCircle,
  MapPin,
  DollarSign,
  Shield,
  LogIn,
  UserPlus,
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const publicNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: <Home className="h-6 w-6" /> },
  { label: "About", href: "/about", icon: <Info className="h-6 w-6" /> },
  { label: "How It Works", href: "/how-it-works", icon: <MapPin className="h-6 w-6" /> },
  { label: "Pricing", href: "/pricing", icon: <DollarSign className="h-6 w-6" /> },
  { label: "More", href: "/faq", icon: <HelpCircle className="h-6 w-6" /> },
]

const authNavItems: NavItem[] = [
  { label: "Home", href: "/", icon: <Home className="h-6 w-6" /> },
  { label: "Login", href: "/auth/login", icon: <LogIn className="h-6 w-6" /> },
  { label: "Register", href: "/auth/register", icon: <UserPlus className="h-6 w-6" /> },
  { label: "Safety", href: "/safety", icon: <Shield className="h-6 w-6" /> },
  { label: "Help", href: "/help", icon: <HelpCircle className="h-6 w-6" /> },
]

export function PublicBottomNavigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  // Don't show if user is logged in (they should see dashboard nav instead)
  if (session?.user) return null

  // Don't show on admin pages
  if (pathname.includes("/admin")) return null

  // Determine which nav items to show based on current path
  const isAuthPage = pathname.includes("/auth")
  const navItems = isAuthPage ? authNavItems : publicNavItems

  // Only show on public pages
  const isPublicPage =
    pathname === "/" ||
    pathname.includes("/about") ||
    pathname.includes("/how-it-works") ||
    pathname.includes("/pricing") ||
    pathname.includes("/faq") ||
    pathname.includes("/help") ||
    pathname.includes("/safety") ||
    pathname.includes("/contact") ||
    pathname.includes("/privacy") ||
    pathname.includes("/terms") ||
    pathname.includes("/cookies") ||
    pathname.includes("/auth")

  if (!isPublicPage) return null

  // Determine if link is active
  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true
    if (href !== "/" && pathname.includes(href)) return true
    if (href === "/faq" && (pathname.includes("/faq") || pathname.includes("/help"))) return true
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
