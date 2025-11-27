"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
  ChevronLeft,
  ChevronRight,
  Activity,
  Moon,
  Sun,
} from "lucide-react"
import { useTheme } from "next-themes"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

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
  { label: "API Monitor", href: "/admin/api-monitor", icon: <Activity className="h-5 w-5" /> },
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

export function AnimatedSidebar() {
  const { user, setShowLogoutConfirm } = useAuth()
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!user) return null

  const navItems = getNavItems(user.role)

  const sidebarVariants = {
    expanded: { width: 256 },
    collapsed: { width: 80 },
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "p-4 border-b border-primary/10 flex items-center",
          isCollapsed && !isMobile ? "justify-center" : "justify-between",
        )}
      >
        <Link href="/" className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 5 }}
          >
            <Image src="/images/easely-06.png" alt="EASELY" width={40} height={40} />
          </motion.div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-xl font-serif font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent whitespace-nowrap overflow-hidden"
              >
                EASELY
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-8 w-8 rounded-full hover:bg-primary/10"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* User Info */}
      <div className={cn("p-4 border-b border-primary/10", isCollapsed && !isMobile && "px-2")}>
        <motion.div
          layout
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/10",
            isCollapsed && !isMobile && "flex-col p-2",
          )}
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-medium shrink-0"
          >
            {user.firstName[0]}
            {user.lastName[0]}
          </motion.div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex-1 min-w-0 overflow-hidden"
              >
                <p className="font-medium text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user.role === "user" ? "Student" : user.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        <TooltipProvider delayDuration={0}>
          {navItems.map((item, index) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href} onClick={() => setIsMobileOpen(false)}>
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                        isCollapsed && !isMobile && "justify-center px-3",
                        isActive
                          ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/25"
                          : "text-muted-foreground hover:bg-primary/10 hover:text-foreground",
                      )}
                    >
                      <motion.div animate={isActive ? { rotate: [0, -10, 10, 0] } : {}} transition={{ duration: 0.5 }}>
                        {item.icon}
                      </motion.div>
                      <AnimatePresence>
                        {(!isCollapsed || isMobile) && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="font-medium whitespace-nowrap overflow-hidden"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                </TooltipTrigger>
                {isCollapsed && !isMobile && (
                  <TooltipContent side="right" className="bg-card border-primary/20">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-primary/10 space-y-2">
        {/* Theme Toggle */}
        {mounted && (
          <Button
            variant="ghost"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:bg-primary/10 hover:text-foreground",
              isCollapsed && !isMobile && "justify-center px-3",
            )}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {theme === "dark" ? "Light Mode" : "Dark Mode"}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        )}

        {/* Logout Button */}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-destructive hover:bg-destructive/10 hover:text-destructive",
            isCollapsed && !isMobile && "justify-center px-3",
          )}
          onClick={() => setShowLogoutConfirm(true)}
        >
          <LogOut className="h-5 w-5" />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? "collapsed" : "expanded"}
        variants={sidebarVariants}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="hidden lg:flex flex-col bg-card/50 backdrop-blur-xl border-r border-primary/10 h-screen sticky top-0 shrink-0"
      >
        <SidebarContent />
      </motion.aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-primary/10">
        <div className="flex items-center justify-between p-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/images/easely-06.png" alt="EASELY" width={32} height={32} />
            <span className="text-lg font-serif font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              EASELY
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="text-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 z-50 w-72 bg-card border-r border-primary/10"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileOpen(false)}
                className="absolute right-4 top-4 text-muted-foreground hover:text-foreground z-10"
              >
                <X className="h-5 w-5" />
              </Button>
              <SidebarContent isMobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
