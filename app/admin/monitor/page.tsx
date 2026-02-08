"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Database, Clock, AlertCircle, CheckCircle, Loader2, RefreshCw, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

function ApiMonitorContent() {
  const [metrics, setMetrics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/metrics")
      if (!response.ok) throw new Error("Failed to fetch metrics")
      const data = await response.json()
      setMetrics(data.metrics)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch metrics")
      console.error("Metrics fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  // Simulated metrics data
  const systemHealthMetrics = [
    { label: "Database CPU", value: 42, max: 100, status: "good" },
    { label: "Memory Usage", value: 65, max: 100, status: "good" },
    { label: "Disk Space", value: 72, max: 100, status: "warning" },
    { label: "Connection Pool", value: 24, max: 150, status: "good" },
  ]

  const performanceMetrics = [
    { label: "Query Latency", value: "245ms", icon: Clock, color: "text-blue-500" },
    { label: "Throughput", value: "8,200 q/s", icon: TrendingUp, color: "text-emerald-500" },
    { label: "Error Rate", value: "0.02%", icon: AlertCircle, color: "text-red-500" },
    { label: "Cache Hit", value: "94.2%", icon: CheckCircle, color: "text-green-500" },
  ]

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">API Monitor</h1>
              <p className="text-muted-foreground mt-1">Real-time database and API performance metrics</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">
                Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"}
              </div>
              <Button
                onClick={fetchMetrics}
                disabled={isLoading}
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </motion.div>

          {/* Status Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Database Status</span>
                </div>
                <p className="text-2xl font-bold text-emerald-500">Connected</p>
                <p className="text-xs text-muted-foreground mt-1">All systems operational</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">API Health</span>
                </div>
                <p className="text-2xl font-bold text-primary">99.8%</p>
                <p className="text-xs text-muted-foreground mt-1">Uptime this month</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                </div>
                <p className="text-2xl font-bold text-amber-500">245ms</p>
                <p className="text-xs text-muted-foreground mt-1">Database queries</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Connections</span>
                </div>
                <p className="text-2xl font-bold text-blue-500">24/150</p>
                <p className="text-xs text-muted-foreground mt-1">Active connections</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Performance Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {performanceMetrics.map((metric, index) => (
              <Card key={metric.label} className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                    <metric.icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>Resource utilization metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {systemHealthMetrics.map((metric) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                      <span className="text-sm font-medium text-foreground">
                        {metric.value} / {metric.max}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          metric.status === "good"
                            ? "bg-emerald-500"
                            : metric.status === "warning"
                              ? "bg-amber-500"
                              : "bg-red-500"
                        }`}
                        style={{ width: `${(metric.value / metric.max) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Activity Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system events and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { type: "success", message: "Database connection pool expanded", time: "2 mins ago" },
                  { type: "info", message: "Query performance optimized", time: "5 mins ago" },
                  { type: "warning", message: "Disk usage approaching limit", time: "12 mins ago" },
                  { type: "success", message: "Cache cleared successfully", time: "25 mins ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div
                      className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                        activity.type === "success"
                          ? "bg-emerald-500"
                          : activity.type === "warning"
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Alerts */}
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <Card className="bg-red-500/10 border-red-500/30">
                <CardContent className="p-4 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-red-500 text-sm">{error}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </main>      <AdminBottomNavigation />    </div>
  )
}

export default function ApiMonitorPage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
      <ApiMonitorContent />
    </ProtectedRoute>
  )
}
