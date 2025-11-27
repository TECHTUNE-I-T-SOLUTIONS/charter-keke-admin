"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Car, Wallet, Star, TrendingUp, Users, Clock, ArrowRight, Navigation, GraduationCap } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

function DriverDashboardContent() {
  const { user } = useAuth()
  const [isOnline, setIsOnline] = useState(false)

  const handleOnlineToggle = (checked: boolean) => {
    setIsOnline(checked)
    if (checked) {
      toast.success("You're now online!", {
        description: "You'll start receiving ride requests from UNILORIN students.",
      })
    } else {
      toast.info("You're now offline", {
        description: "You won't receive any ride requests.",
      })
    }
  }

  const stats = [
    {
      label: "Today's Earnings",
      value: "₦0",
      icon: <Wallet className="h-5 w-5" />,
      color: "from-emerald-500 to-emerald-400",
    },
    { label: "Rides Completed", value: "0", icon: <Car className="h-5 w-5" />, color: "from-primary to-primary/70" },
    { label: "Rating", value: "5.0", icon: <Star className="h-5 w-5" />, color: "from-amber-500 to-amber-400" },
    {
      label: "Hours Online",
      value: "0h",
      icon: <Clock className="h-5 w-5" />,
      color: "from-secondary to-secondary/70",
    },
  ]

  const quickActions = [
    {
      label: "View Requests",
      href: "/driver/rides",
      icon: <Car className="h-6 w-6" />,
      description: "See ride requests",
    },
    {
      label: "Earnings",
      href: "/driver/earnings",
      icon: <Wallet className="h-6 w-6" />,
      description: "Track your income",
    },
    {
      label: "Navigation",
      href: "/driver/rides",
      icon: <Navigation className="h-6 w-6" />,
      description: "Start navigating",
    },
    {
      label: "Referrals",
      href: "/driver/referrals",
      icon: <Users className="h-6 w-6" />,
      description: "Invite drivers",
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header with Online Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="text-sm text-primary font-medium">UNILORIN Driver</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Welcome, {user?.firstName}!</h1>
              <p className="text-muted-foreground mt-1">Serve UNILORIN students with safe rides.</p>
            </div>

            <motion.div whileHover={{ scale: 1.02 }}>
              <Card
                className={`p-4 transition-all duration-300 ${isOnline ? "bg-emerald-500/10 border-emerald-500/30" : "bg-card/50 border-primary/10"}`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`relative w-3 h-3 rounded-full ${isOnline ? "bg-emerald-500" : "bg-muted-foreground"}`}
                  >
                    {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping" />}
                  </div>
                  <Label htmlFor="online-toggle" className="font-medium text-foreground">
                    {isOnline ? "Online" : "Offline"}
                  </Label>
                  <Switch
                    id="online-toggle"
                    checked={isOnline}
                    onCheckedChange={handleOnlineToggle}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="bg-card/50 backdrop-blur border-primary/10 overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-4 md:p-6">
                    <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${stat.color} text-white mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  whileHover={{ y: -4 }}
                >
                  <Link href={action.href}>
                    <Card className="bg-card/50 backdrop-blur border-primary/10 hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                      <CardContent className="p-4 md:p-6 flex flex-col items-center text-center">
                        <div className="p-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 text-primary group-hover:from-primary group-hover:to-secondary group-hover:text-white transition-all duration-300 mb-3">
                          {action.icon}
                        </div>
                        <h3 className="font-semibold text-foreground">{action.label}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{action.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Active Ride Requests */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" />
                  Ride Requests
                </CardTitle>
                <CardDescription>
                  {isOnline ? "Waiting for ride requests from students..." : "Go online to receive ride requests"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    animate={isOnline ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className={`p-4 rounded-full mb-4 ${isOnline ? "bg-emerald-500/10" : "bg-muted/50"}`}
                  >
                    <Car className={`h-8 w-8 ${isOnline ? "text-emerald-500" : "text-muted-foreground"}`} />
                  </motion.div>
                  <h3 className="font-medium text-foreground mb-1">
                    {isOnline ? "No ride requests yet" : "You're offline"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                    {isOnline
                      ? "New ride requests from UNILORIN students will appear here."
                      : "Toggle your status to online to start receiving ride requests."}
                  </p>
                  {!isOnline && (
                    <Button
                      onClick={() => handleOnlineToggle(true)}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:opacity-90"
                    >
                      Go Online
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Weekly Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                    className="p-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white"
                  >
                    <TrendingUp className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-foreground">This Week's Summary</h3>
                    <p className="text-sm text-muted-foreground">0 rides completed | ₦0 earned</p>
                  </div>
                </div>
                <Button asChild variant="outline" className="border-primary/20 hover:bg-primary/10 bg-transparent">
                  <Link href="/driver/earnings">
                    View Details
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function DriverDashboard() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <DriverDashboardContent />
    </ProtectedRoute>
  )
}
