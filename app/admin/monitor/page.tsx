"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Database, Clock, AlertCircle, CheckCircle, RefreshCw, TrendingUp, Server, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"

function ApiMonitorContent() {
  const [metrics, setMetrics] = useState<any>(null)
  const [summary, setSummary] = useState<any>(null)
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
      setSummary(data.summary)
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

  const systemHealthMetrics = summary?.resources || []
  const performanceMetrics = summary?.performance || []
  const services = summary?.services || []
  const activityFeed = summary?.activity || []
  const formatBytes = (bytes: number) => {
    const value = Number(bytes || 0)
    if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)}GB`
    if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(2)}MB`
    if (value >= 1024) return `${(value / 1024).toFixed(2)}KB`
    return `${value}B`
  }

  return (
    <div className="flex min-h-screen bg-background pb-24">

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
                <p className="text-2xl font-bold text-emerald-500">{summary?.databaseStatus || "Checking"}</p>
                <p className="text-xs text-muted-foreground mt-1">{summary?.projectRef || "Supabase project"}</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">API Health</span>
                </div>
                <p className="text-2xl font-bold text-primary">{summary ? `${summary.apiHealth}%` : "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">Health from live telemetry</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Avg Response</span>
                </div>
                <p className="text-2xl font-bold text-amber-500">{summary ? `${summary.avgResponseMs}ms` : "-"}</p>
                <p className="text-xs text-muted-foreground mt-1">Average response latency</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Connections</span>
                </div>
                <p className="text-2xl font-bold text-blue-500">
                  {summary ? `${summary.connections.used}${summary.connections.max ? `/${summary.connections.max}` : ""}` : "-"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{summary?.connections?.waiting || 0} waiting connections</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Service Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {services.map((service: any) => (
              <Card key={service.key || service.name} className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="h-5 w-5 text-primary" />
                      <span className="text-sm text-muted-foreground">{service.name}</span>
                    </div>
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        service.status === "online" ? "bg-emerald-500" : service.status === "warning" ? "bg-amber-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                  <p className="text-lg font-bold capitalize text-foreground">{service.status}</p>
                  <p className="text-xs text-muted-foreground mt-1">{service.detail}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Performance Metrics Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {performanceMetrics.map((metric: any, index: number) => (
              <Card key={metric.label} className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                    {metric.status === "warning" ? (
                      <AlertCircle className="h-5 w-5 text-amber-500" />
                    ) : metric.label.toLowerCase().includes("query") ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : metric.label.toLowerCase().includes("error") ? (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    ) : (
                      <TrendingUp className="h-5 w-5 text-emerald-500" />
                    )}
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
                {systemHealthMetrics.map((metric: any) => (
                  <div key={metric.label}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{metric.label}</span>
                      <span className="text-sm font-medium text-foreground">
                        {metric.value}{metric.unit === "%" ? "%" : ""} / {metric.max}{metric.unit === "%" ? "%" : ""}
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
                    <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Network Summary */}
          {summary?.network && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary" />
                    Network IO
                  </CardTitle>
                  <CardDescription>Database node network throughput and health counters</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Received</p>
                    <p className="text-xl font-bold text-foreground">{formatBytes(summary.network.receiveBytes)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transmitted</p>
                    <p className="text-xl font-bold text-foreground">{formatBytes(summary.network.transmitBytes)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Errors</p>
                    <p className="text-xl font-bold text-foreground">{summary.network.receiveErrors + summary.network.transmitErrors}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Drops</p>
                    <p className="text-xl font-bold text-foreground">{summary.network.receiveDrops + summary.network.transmitDrops}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                {activityFeed.map((activity: any, index: number) => (
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
      </main></div>
  )
}

export default function ApiMonitorPage() {
  return <ApiMonitorContent />
}
