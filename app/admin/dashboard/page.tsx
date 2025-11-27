"use client"

import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, MapPin, Wallet, TrendingUp, Activity, ArrowUpRight, Clock, GraduationCap } from "lucide-react"
import Link from "next/link"

function AdminDashboardContent() {
  const { user } = useAuth()

  const stats = [
    {
      label: "Total Students",
      value: "0",
      change: "+0%",
      icon: <Users className="h-5 w-5" />,
      color: "from-primary to-primary/70",
      href: "/admin/users",
    },
    {
      label: "Total Drivers",
      value: "0",
      change: "+0%",
      icon: <Car className="h-5 w-5" />,
      color: "from-secondary to-secondary/70",
      href: "/admin/drivers",
    },
    {
      label: "Active Rides",
      value: "0",
      change: "+0%",
      icon: <MapPin className="h-5 w-5" />,
      color: "from-emerald-500 to-emerald-400",
      href: "/admin/rides",
    },
    {
      label: "Revenue",
      value: "₦0",
      change: "+0%",
      icon: <Wallet className="h-5 w-5" />,
      color: "from-amber-500 to-amber-400",
      href: "/admin/payments",
    },
  ]

  const recentActivities = [
    { type: "info", message: "System initialized", time: "Just now" },
    { type: "success", message: "Admin dashboard ready", time: "Just now" },
    { type: "info", message: "UNILORIN routes configured", time: "Just now" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">University of Ilorin - Admin</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName}. Managing EASELY for UNILORIN students.
            </p>
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
                <Link href={stat.href}>
                  <Card className="bg-card/50 backdrop-blur border-primary/10 overflow-hidden group hover:shadow-lg hover:border-primary/30 transition-all duration-300 cursor-pointer h-full">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${stat.color} text-white`}>{stat.icon}</div>
                        <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <span className="text-xs text-emerald-500">{stat.change}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            {/* Rides Chart Placeholder */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ride Analytics
                </CardTitle>
                <CardDescription>UNILORIN route statistics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                      <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    </motion.div>
                    <p className="text-muted-foreground">Charts will appear once data is available</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart Placeholder */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>Monthly revenue breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                  <div className="text-center">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    >
                      <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    </motion.div>
                    <p className="text-muted-foreground">Revenue data will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity & Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Recent Activity */}
            <Card className="bg-card/50 backdrop-blur border-primary/10 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-lg bg-muted/30"
                    >
                      <div
                        className={`w-2 h-2 mt-2 rounded-full ${activity.type === "success" ? "bg-emerald-500" : "bg-primary"}`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-foreground">{activity.message}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          {activity.time}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>All systems operational</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { name: "API", status: "Online", color: "bg-emerald-500" },
                  { name: "Database", status: "Connected", color: "bg-emerald-500" },
                  { name: "Payments", status: "Ready", color: "bg-emerald-500" },
                  { name: "SMS Gateway", status: "Ready", color: "bg-emerald-500" },
                ].map((item, index) => (
                  <motion.div
                    key={item.name}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${item.color}`} />
                      <span className="text-sm text-emerald-500">{item.status}</span>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminDashboardContent />
    </ProtectedRoute>
  )
}
