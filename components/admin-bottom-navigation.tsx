"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Home, Users, Car, MapPin, CreditCard, BarChart3, Settings, MessageSquare } from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <Home className="h-5 w-5" /> },
  { label: "Rides", href: "/admin/rides", icon: <MapPin className="h-5 w-5" /> },
  { label: "Drivers", href: "/admin/drivers", icon: <Car className="h-5 w-5" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { label: "More", href: "/admin/payments", icon: <BarChart3 className="h-5 w-5" /> },
]

export function AdminBottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/80 backdrop-blur border-t border-primary/10">
      <div className="flex items-center justify-around">
        {adminNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.icon}
              <span className="text-xs mt-1 text-center">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
