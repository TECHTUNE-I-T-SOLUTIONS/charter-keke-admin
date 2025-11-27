"use client"

import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, MapPin, Clock, Wallet, Gift, ArrowRight, GraduationCap } from "lucide-react"
import Link from "next/link"

function UserDashboardContent() {
  const { user } = useAuth()

  const stats = [
    { label: "Total Rides", value: "0", icon: <Car className="h-5 w-5" />, color: "from-primary to-primary/70" },
    { label: "Distance", value: "0 km", icon: <MapPin className="h-5 w-5" />, color: "from-secondary to-secondary/70" },
    { label: "Time Saved", value: "0h", icon: <Clock className="h-5 w-5" />, color: "from-emerald-500 to-emerald-400" },
    { label: "Wallet", value: "₦0", icon: <Wallet className="h-5 w-5" />, color: "from-amber-500 to-amber-400" },
  ]

  const quickActions = [
    { label: "Book a Ride", href: "/user/book", icon: <Car className="h-6 w-6" />, description: "Campus to Town" },
    { label: "View Rides", href: "/user/rides", icon: <Clock className="h-6 w-6" />, description: "See your history" },
    { label: "Add Funds", href: "/user/wallet", icon: <Wallet className="h-6 w-6" />, description: "Top up wallet" },
    {
      label: "Invite Friends",
      href: "/user/referrals",
      icon: <Gift className="h-6 w-6" />,
      description: "Earn 5% off",
    },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Welcome Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">UNILORIN Student</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-muted-foreground mt-1">Ready to book your next ride to campus?</p>
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
                <Card className="bg-card/50 backdrop-blur border-primary/10 overflow-hidden group hover:shadow-lg hover:border-primary/20 transition-all duration-300">
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

          {/* Referral Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 border-primary/20 overflow-hidden">
              <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, repeatDelay: 3 }}
                    className="p-3 rounded-full bg-gradient-to-r from-primary to-secondary text-white"
                  >
                    <Gift className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <h3 className="font-semibold text-foreground">Share EASELY with fellow students!</h3>
                    <p className="text-sm text-muted-foreground">
                      Your referral code: <span className="font-mono font-bold text-primary">{user?.referralCode}</span>
                    </p>
                  </div>
                </div>
                <Button
                  asChild
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 whitespace-nowrap"
                >
                  <Link href="/user/referrals">
                    Invite Friends
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Your latest rides and transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    className="p-4 rounded-full bg-muted/50 mb-4"
                  >
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </motion.div>
                  <h3 className="font-medium text-foreground mb-1">No rides yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">Book your first ride between campus and town!</p>
                  <Button asChild className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                    <Link href="/user/book">
                      Book Your First Ride
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function UserDashboard() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <UserDashboardContent />
    </ProtectedRoute>
  )
}
