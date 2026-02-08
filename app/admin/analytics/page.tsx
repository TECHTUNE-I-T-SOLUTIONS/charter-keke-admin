"use client"

import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Users, Car, Wallet, Activity } from "lucide-react"

function AnalyticsContent() {
  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Analytics</h1>
            <p className="text-muted-foreground mt-1">Comprehensive insights and real-time data</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs defaultValue="overview">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="rides">Rides</TabsTrigger>
                <TabsTrigger value="revenue">Revenue</TabsTrigger>
                <TabsTrigger value="users">Users</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-card/50 backdrop-blur border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">Total Users</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-xs text-emerald-500">+0% this week</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-4 w-4 text-secondary" />
                        <span className="text-sm text-muted-foreground">Total Rides</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-xs text-emerald-500">+0% this week</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Wallet className="h-4 w-4 text-amber-500" />
                        <span className="text-sm text-muted-foreground">Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">₦0</p>
                      <p className="text-xs text-emerald-500">+0% this week</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-card/50 backdrop-blur border-primary/10">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-emerald-500" />
                        <span className="text-sm text-muted-foreground">Active Now</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">0</p>
                      <p className="text-xs text-muted-foreground">Real-time</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                  <Card className="bg-card/50 backdrop-blur border-primary/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Growth Trends
                      </CardTitle>
                      <CardDescription>User and ride growth over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Chart data will appear here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 backdrop-blur border-primary/10">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        Revenue Breakdown
                      </CardTitle>
                      <CardDescription>Revenue by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64 flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg">
                        <div className="text-center">
                          <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">Revenue data will appear here</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <AnalyticsContent />
    </ProtectedRoute>
  )
}
