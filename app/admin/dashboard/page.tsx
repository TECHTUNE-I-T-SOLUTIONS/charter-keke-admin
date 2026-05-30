"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import { useSession } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Car, MapPin, Wallet, TrendingUp, Activity, ArrowUpRight, Clock, Loader2, CheckCircle2, XCircle, Banknote, Percent, Route } from "lucide-react"
import Link from "next/link"
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type RevenueRide = {
  id: string
  status?: string
  fare_amount?: number | string | null
  platform_fee?: number | string | null
  driver_earnings?: number | string | null
  created_at?: string
  completed_at?: string | null
  rider?: { first_name?: string; last_name?: string; email?: string } | null
  driver?: { id?: string; operating_zones?: string[] } | null
}

type RevenueData = {
  rides: RevenueRide[]
  count: number
  summary: {
    totalFares: number
    totalPlatformFees: number
    totalDriverEarnings: number
    easelsEarnings: number
  }
}

const money = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0)

const numberValue = (value: unknown) => {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const statusColor: Record<string, string> = {
  accepted: "#f28c00",
  in_progress: "#06b6d4",
  completed: "#10b981",
  cancelled: "#ef4444",
}

function AdminDashboardContent() {
  const { data: session } = useSession()
  const { user: contextUser } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, pending: 0, suspended: 0 },
    drivers: { total: 0, verified: 0, pending: 0 },
    rides: { active: 0, completed: 0, cancelled: 0 },
    revenue: { total: 0, platformFees: 0, fromAcceptedAndInProgress: 0 },
  })
  const [revenueData, setRevenueData] = useState<RevenueData>({
    rides: [],
    count: 0,
    summary: {
      totalFares: 0,
      totalPlatformFees: 0,
      totalDriverEarnings: 0,
      easelsEarnings: 0,
    },
  })

  // Use session data first, fall back to context user
  const user = session?.user
    ? {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        firstName: (session.user as any).firstName || "Admin",
        lastName: (session.user as any).lastName || "",
        role: (session.user as any).role || "admin",
      }
    : contextUser

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)
        const [statsResponse, revenueResponse] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/revenue?limit=1000"),
        ])
        const [statsData, revenuePayload] = await Promise.all([statsResponse.json(), revenueResponse.json()])

        if (statsResponse.ok) setStats(statsData)
        if (revenueResponse.ok) {
          setRevenueData({
            rides: Array.isArray(revenuePayload?.rides) ? revenuePayload.rides : [],
            count: numberValue(revenuePayload?.count),
            summary: {
              totalFares: numberValue(revenuePayload?.summary?.totalFares),
              totalPlatformFees: numberValue(revenuePayload?.summary?.totalPlatformFees),
              totalDriverEarnings: numberValue(revenuePayload?.summary?.totalDriverEarnings),
              easelsEarnings: numberValue(revenuePayload?.summary?.easelsEarnings),
            },
          })
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      label: "Total Riders",
      value: stats.users.total.toString(),
      change: "+0%",
      icon: <Users className="h-5 w-5" />,
      color: "from-primary to-primary/70",
      href: "/admin/users",
    },
    {
      label: "Total Drivers",
      value: stats.drivers.total.toString(),
      change: "+0%",
      icon: <Car className="h-5 w-5" />,
      color: "from-secondary to-secondary/70",
      href: "/admin/drivers",
    },
    {
      label: "Active Rides",
      value: stats.rides.active.toString(),
      change: "+0%",
      icon: <MapPin className="h-5 w-5" />,
      color: "from-emerald-500 to-emerald-400",
      href: "/admin/rides",
    },
    {
      label: "Revenue",
      value: money(revenueData.summary.totalFares || stats.revenue.total || 0),
      change: "+0%",
      icon: <Wallet className="h-5 w-5" />,
      color: "from-amber-500 to-amber-400",
      href: "/admin/payments",
    },
  ]

  const rideStatusData = [
    { name: "Active", value: stats.rides.active, color: statusColor.in_progress },
    { name: "Completed", value: stats.rides.completed, color: statusColor.completed },
    { name: "Cancelled", value: stats.rides.cancelled, color: statusColor.cancelled },
  ].filter((item) => item.value > 0)

  const revenueBreakdown = [
    { label: "Gross Fares", value: revenueData.summary.totalFares, icon: <Banknote className="h-4 w-4" /> },
    { label: "Platform Fees", value: revenueData.summary.totalPlatformFees, icon: <Percent className="h-4 w-4" /> },
    { label: "Driver Earnings", value: revenueData.summary.totalDriverEarnings, icon: <Car className="h-4 w-4" /> },
    { label: "Platform Net", value: revenueData.summary.easelsEarnings, icon: <Wallet className="h-4 w-4" /> },
  ]

  const monthlyRevenue = Object.values(
    revenueData.rides.reduce<Record<string, { month: string; gross: number; fees: number; driver: number; net: number }>>(
      (acc, ride) => {
        const date = ride.completed_at || ride.created_at
        if (!date) return acc
        const month = new Date(date).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
        if (!acc[month]) acc[month] = { month, gross: 0, fees: 0, driver: 0, net: 0 }
        const gross = numberValue(ride.fare_amount)
        const fees = numberValue(ride.platform_fee)
        const driver = numberValue(ride.driver_earnings)
        acc[month].gross += gross
        acc[month].fees += fees
        acc[month].driver += driver
        acc[month].net += gross + fees - driver
        return acc
      },
      {}
    )
  ).slice(-6)

  const statusBreakdown = Object.values(
    revenueData.rides.reduce<Record<string, { status: string; rides: number; revenue: number }>>((acc, ride) => {
      const status = ride.status || "unknown"
      if (!acc[status]) acc[status] = { status: status.replace(/_/g, " "), rides: 0, revenue: 0 }
      acc[status].rides += 1
      acc[status].revenue += numberValue(ride.fare_amount)
      return acc
    }, {})
  )

  const recentActivities =
    revenueData.rides.length > 0
      ? revenueData.rides.slice(0, 5).map((ride) => ({
          type: ride.status === "completed" ? "success" : ride.status === "cancelled" ? "danger" : "info",
          message: `${ride.status?.replace(/_/g, " ") || "Ride"} ride ${ride.id ? `#${ride.id.slice(0, 8)}` : ""}`,
          time: ride.created_at ? new Date(ride.created_at).toLocaleString() : "Recent",
        }))
      : [{ type: "info", message: "No ride activity yet", time: "Waiting for live data" }]

  return (
    <div className="flex min-h-screen bg-background">

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center gap-2 mb-2">
              <Image src="/charter keke.png" alt="Charter Keke" width={24} height={24} />
              <span className="text-sm text-primary font-medium">Charter Keke - Admin</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.firstName}. Managing Charter Keke for Lagos riders.
            </p>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {isLoading ? (
              <div className="col-span-2 lg:col-span-4 flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              statCards.map((stat, index) => (
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
              ))
            )}
          </motion.div>

          {/* Analytics Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary" />
                  Ride Analytics
                </CardTitle>
                <CardDescription>Live ride movement and completion health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-foreground">{stats.rides.active}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold text-emerald-500">{stats.rides.completed}</p>
                  </div>
                  <div className="rounded-lg bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">Cancelled</p>
                    <p className="text-2xl font-bold text-red-500">{stats.rides.cancelled}</p>
                  </div>
                </div>

                <div className="h-56 rounded-lg bg-muted/20 p-3">
                  {rideStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={rideStatusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={78} paddingAngle={4}>
                          {rideStatusData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} rides`, "Count"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No ride activity recorded yet
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {statusBreakdown.map((item) => (
                    <div key={item.status} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                      <span className="text-sm capitalize text-muted-foreground">{item.status}</span>
                      <span className="text-sm font-semibold text-foreground">
                        {item.rides} rides · {money(item.revenue)}
                      </span>
                    </div>
                  ))}
                  {statusBreakdown.length === 0 && (
                    <p className="text-sm text-muted-foreground">No revenue-eligible rides yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>Gross fare, platform fee and driver payout breakdown</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  {revenueBreakdown.map((item) => (
                    <div key={item.label} className="rounded-lg bg-muted/30 p-3">
                      <div className="mb-2 flex items-center gap-2 text-primary">
                        {item.icon}
                        <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                      </div>
                      <p className="text-lg font-bold text-foreground">{money(item.value)}</p>
                    </div>
                  ))}
                </div>

                <div className="h-56 rounded-lg bg-muted/20 p-3">
                  {monthlyRevenue.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyRevenue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(242,140,0,0.12)" />
                        <XAxis dataKey="month" tick={{ fill: "currentColor", fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "currentColor", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(value) => `₦${Number(value) / 1000}k`} />
                        <Tooltip formatter={(value) => money(Number(value))} />
                        <Bar dataKey="gross" name="Gross Fares" fill="#f28c00" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="fees" name="Platform Fees" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                      No revenue data recorded yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Operational Snapshot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="grid md:grid-cols-2 xl:grid-cols-4 gap-4"
          >
            {[
              { label: "Active Users", value: stats.users.active, icon: <Users className="h-4 w-4" />, href: "/admin/users" },
              { label: "Pending Users", value: stats.users.pending, icon: <Clock className="h-4 w-4" />, href: "/admin/users" },
              { label: "Verified Drivers", value: stats.drivers.verified, icon: <CheckCircle2 className="h-4 w-4" />, href: "/admin/drivers" },
              { label: "Pending Drivers", value: stats.drivers.pending, icon: <XCircle className="h-4 w-4" />, href: "/admin/drivers" },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <Card className="bg-card/50 border-primary/10 hover:border-primary/30 transition-colors">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{item.label}</p>
                      <p className="text-2xl font-bold text-foreground">{item.value}</p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">{item.icon}</div>
                  </CardContent>
                </Card>
              </Link>
            ))}
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
      </main></div>
  )
}

export default function AdminDashboard() {
  return <AdminDashboardContent />
}
