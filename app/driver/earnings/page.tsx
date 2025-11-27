"use client"

import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"

function EarningsContent() {
  const { user } = useAuth()

  const stats = [
    { label: "Today", value: "₦0", change: "+0%", trend: "up" },
    { label: "This Week", value: "₦0", change: "+0%", trend: "up" },
    { label: "This Month", value: "₦0", change: "+0%", trend: "up" },
    { label: "Total Earnings", value: "₦0", change: "", trend: "neutral" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Earnings</h1>
            <p className="text-muted-foreground mt-1">Track your income and payout history</p>
          </motion.div>

          {/* Earnings Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <Card key={stat.label} className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-4 md:p-6">
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
                  {stat.change && (
                    <div
                      className={`flex items-center gap-1 mt-2 text-sm ${stat.trend === "up" ? "text-emerald-500" : "text-red-500"}`}
                    >
                      {stat.trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      {stat.change}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Balance & Payout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid lg:grid-cols-2 gap-6"
          >
            <Card className="bg-gradient-to-br from-primary to-secondary text-white overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-full bg-white/20">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <span className="font-medium">Available Balance</span>
                </div>
                <p className="text-4xl font-bold mb-2">₦0.00</p>
                <p className="text-sm opacity-80 mb-6">Ready for payout</p>
                <Button className="bg-white text-primary hover:bg-white/90">
                  Request Payout
                  <ArrowUpRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>Payout Settings</CardTitle>
                <CardDescription>Configure your payout preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/30 border border-primary/10">
                  <p className="text-sm text-muted-foreground mb-1">Bank Account</p>
                  <p className="font-medium text-foreground">Not configured</p>
                </div>
                <Button variant="outline" className="w-full border-primary/20 hover:bg-primary/10 bg-transparent">
                  Add Bank Account
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Transaction History */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your earnings and payouts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-4 rounded-full bg-muted/50 mb-4">
                    <Wallet className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">No transactions yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Your earning history will appear here after your first ride.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function EarningsPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <EarningsContent />
    </ProtectedRoute>
  )
}
