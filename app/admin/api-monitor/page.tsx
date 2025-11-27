"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Activity,
  Server,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react"

interface ApiRequest {
  id: string
  endpoint: string
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
  status: number
  duration: number
  timestamp: Date
  source: string
}

function ApiMonitorContent() {
  const [requests, setRequests] = useState<ApiRequest[]>([])
  const [isLive, setIsLive] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  // Simulated real-time API requests (would be replaced with actual GraphQL subscription)
  useEffect(() => {
    if (!isLive) return

    const endpoints = [
      { endpoint: "/api/rides", method: "GET" as const },
      { endpoint: "/api/users", method: "GET" as const },
      { endpoint: "/api/bookings", method: "POST" as const },
      { endpoint: "/api/payments", method: "POST" as const },
      { endpoint: "/api/drivers/location", method: "PUT" as const },
      { endpoint: "/api/notifications", method: "POST" as const },
    ]

    const interval = setInterval(() => {
      const randomEndpoint = endpoints[Math.floor(Math.random() * endpoints.length)]
      const newRequest: ApiRequest = {
        id: `req_${Date.now()}`,
        endpoint: randomEndpoint.endpoint,
        method: randomEndpoint.method,
        status: Math.random() > 0.1 ? 200 : Math.random() > 0.5 ? 400 : 500,
        duration: Math.floor(Math.random() * 500) + 20,
        timestamp: new Date(),
        source: Math.random() > 0.5 ? "mobile" : "web",
      }

      setRequests((prev) => [newRequest, ...prev].slice(0, 100))
    }, 2000)

    return () => clearInterval(interval)
  }, [isLive])

  const stats = {
    total: requests.length,
    success: requests.filter((r) => r.status >= 200 && r.status < 300).length,
    errors: requests.filter((r) => r.status >= 400).length,
    avgDuration:
      requests.length > 0 ? Math.round(requests.reduce((acc, r) => acc + r.duration, 0) / requests.length) : 0,
  }

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
      case "POST":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20"
      case "PUT":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20"
      case "DELETE":
        return "bg-red-500/10 text-red-500 border-red-500/20"
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20"
    }
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-500"
    if (status >= 400 && status < 500) return "text-amber-500"
    return "text-red-500"
  }

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">API Monitor</h1>
              <p className="text-muted-foreground mt-1">Real-time API request tracking with GraphQL</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant={isLive ? "default" : "outline"}
                onClick={() => setIsLive(!isLive)}
                className={isLive ? "bg-gradient-to-r from-primary to-secondary" : "border-primary/20 bg-transparent"}
              >
                {isLive ? (
                  <>
                    <span className="relative flex h-2 w-2 mr-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    Live
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4 mr-2" />
                    Paused
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="border-primary/20 hover:bg-primary/10 bg-transparent"
                onClick={() => setRequests([])}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Server className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm text-muted-foreground">Successful</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.success}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-muted-foreground">Errors</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.errors}</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-muted-foreground">Avg Duration</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{stats.avgDuration}ms</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Live Feed */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-primary" />
                      Live Request Feed
                    </CardTitle>
                    <CardDescription>Real-time API requests via GraphQL subscription</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Filter endpoints..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-48 bg-background/50 border-primary/20"
                      />
                    </div>
                    <Button variant="outline" size="icon" className="border-primary/20 bg-transparent">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="p-4 rounded-full bg-muted/50 mb-4">
                        <Activity className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <h3 className="font-medium text-foreground mb-1">No requests yet</h3>
                      <p className="text-sm text-muted-foreground">API requests will appear here in real-time</p>
                    </div>
                  ) : (
                    requests
                      .filter((r) => r.endpoint.includes(searchQuery))
                      .map((request, index) => (
                        <motion.div
                          key={request.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={getMethodColor(request.method)}>
                              {request.method}
                            </Badge>
                            <code className="text-sm font-mono text-foreground">{request.endpoint}</code>
                            <Badge variant="outline" className="text-xs">
                              {request.source}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-mono ${getStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                            <span className="text-sm text-muted-foreground">{request.duration}ms</span>
                            <span className="text-xs text-muted-foreground">
                              {request.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* GraphQL Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  GraphQL Subscription Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      <span className="text-sm text-muted-foreground">WebSocket Status</span>
                    </div>
                    <p className="font-medium text-foreground">Connected</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Subscription</p>
                    <code className="text-sm font-mono text-foreground">apiRequests</code>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-2">Endpoint</p>
                    <code className="text-sm font-mono text-foreground">/api/graphql</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function ApiMonitorPage() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <ApiMonitorContent />
    </ProtectedRoute>
  )
}
