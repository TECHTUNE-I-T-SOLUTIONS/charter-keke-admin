"use client"

import type React from "react"
import { useState, memo } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  Inbox,
  Building2,
  Mail,
  History,
  ArrowLeft,
  Menu,
  X,
  Shield,
  LifeBuoy,
  Sun,
  Moon
} from "lucide-react"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const crmNavItems: NavItem[] = [
  { label: "Inbox Console", href: "/admin/crm", icon: <Inbox className="h-5 w-5" /> },
  { label: "Departments", href: "/admin/crm/departments", icon: <Building2 className="h-5 w-5" /> },
  { label: "Email Aliases", href: "/admin/crm/emails", icon: <Mail className="h-5 w-5" /> },
  { label: "Activity Logs", href: "/admin/crm/logs", icon: <History className="h-5 w-5" /> },
]

// Memoized sidebar content
const SidebarContent = memo(({ user, pathname, setIsMobileOpen }: { user: any; pathname: string; setIsMobileOpen: (open: boolean) => void }) => {
  const { theme, setTheme } = useTheme()
  const { data: session } = useSession()
  const [avatarUrl] = useState("")
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    (session?.user as any)?.firstName || session?.user?.name || "Admin"
  )}&background=FF9101&color=000`

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background backdrop-blur-xl dark:bg-slate-950/80 border-r border-primary/10">
      {/* Brand Logo */}
      <div className="p-5 border-b border-primary/10 flex items-center justify-between">
        <Link href="/admin/crm" className="flex items-center gap-2">
          <Image src="/charter keke.png" alt="Charter Keke" width={38} height={38} className="rounded-lg shadow-md border border-amber-500/20" />
          <div>
            <span className="text-xs tracking-[0.2em] font-bold text-amber-500 block leading-tight">
              CHARTER KEKE
            </span>
            <span className="text-sm font-serif font-semibold text-foreground tracking-wide block leading-none mt-0.5">
              CRM Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Admin User Info Profile */}
      <div className="p-4 border-b border-primary/10 bg-primary/5">
        <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-200 dark:bg-slate-900/50 border border-primary/5">
          <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/10">
            <Image
              src={avatarUrl || (session?.user as any)?.image || fallbackAvatar}
              alt="Admin avatar"
              width={42}
              height={42}
              className="h-[42px] w-[42px] rounded-full border-2 border-primary object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Shield className="h-3 w-3 text-amber-500/80" />
              <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                {user?.role || "Admin"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Navigation Options */}
      <nav className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
          Operations
        </p>
        {crmNavItems.map((item) => {
          // Precise active logic matching sub-routes
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3.5 px-4 py-3 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-gradient-to-r from-amber-600/20 to-amber-700/10 text-amber-400 border-l-2 border-amber-500 shadow-md shadow-amber-500/5"
                  : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
              )}
            >
              <div className={cn(isActive ? "text-amber-400 animate-pulse" : "text-muted-foreground group-hover:text-amber-400/80")}>
                {item.icon}
              </div>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* System Status / Help & Exit */}
      <div className="shrink-0 p-4 border-t border-primary/10 bg-slate-100 dark:bg-slate-950 space-y-2">
        <div className="flex items-center gap-2 p-2 rounded bg-amber-500/5 border border-amber-500/10 text-amber-800 dark:text-amber-400/80 text-[11px] mb-1.5">
          <LifeBuoy className="h-4 w-4 text-amber-900 dark:text-amber-500 flex-shrink-0" />
          <span>Lagos Node: Active & Syncing</span>
        </div>

        <Button
          variant="outline"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3 border-primary/10 text-muted-foreground hover:bg-primary/5 hover:text-foreground bg-transparent h-10"
        >
          {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-slate-800 dark:text-slate-200" />}
          <span className="text-sm font-medium">Toggle Theme</span>
        </Button>
        
        <Link href="/admin/dashboard" passHref className="w-full block">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 border-primary/10 text-muted-foreground hover:bg-primary/5 hover:text-foreground bg-transparent h-10"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Exit CRM Panel</span>
          </Button>
        </Link>
      </div>
    </div>
  )
})
SidebarContent.displayName = "SidebarContent"

export const CrmSidebar = memo(function CrmSidebarComponent() {
  const { user } = useAuth()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  if (!user) return null

  return (
    <>
      {/* Desktop CRM Left Rail Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col h-screen sticky top-0 z-30 flex-shrink-0">
        <SidebarContent user={user} pathname={pathname} setIsMobileOpen={setIsMobileOpen} />
      </aside>

      {/* Mobile CRM Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background dark:bg-slate-950/80 backdrop-blur-xl border-b border-primary/10">
        <div className="flex items-center justify-between p-4">
          <Link href="/admin/crm" className="flex items-center gap-2">
            <Image src="/charter keke.png" alt="Charter Keke" width={32} height={32} className="rounded-lg" />
            <div>
              <span className="text-[10px] tracking-[0.15em] font-bold text-amber-500 block leading-tight">
                CHARTER KEKE
              </span>
              <span className="text-xs font-serif font-semibold text-foreground block">
                CRM Portal
              </span>
            </div>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="text-foreground h-9 w-9">
            <Menu className="h-5.5 w-5.5" />
          </Button>
        </div>
      </header>

      {/* Mobile CRM Navigation Drawer */}
      {isMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
            onClick={() => setIsMobileOpen(false)}
          />
          <aside className="lg:hidden fixed left-0 top-0 bottom-0 z-50 flex w-[86vw] max-w-80 bg-slate-950 transition-transform duration-300 ease-in-out">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground h-8 w-8 z-50"
            >
              <X className="h-4.5 w-4.5" />
            </Button>
            <SidebarContent user={user} pathname={pathname} setIsMobileOpen={setIsMobileOpen} />
          </aside>
        </>
      )}
    </>
  )
})
CrmSidebar.displayName = "CrmSidebar"
