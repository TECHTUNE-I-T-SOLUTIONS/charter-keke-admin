"use client"

import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Star, AlertCircle, Loader, TrendingUp, DollarSign, Zap } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"

interface RideHistory {
  created_at: string
  id: string
  pickup_zone: string
  destination_zone: string
  fare_amount: number
  driver_earnings: number
  platform_fee: number
  distance_km: number
  completed_at: string
  status: string
  rating?: number
  users: {
    first_name: string
    last_name: string
  }
}

interface Stats {
  totalRides: number
  totalEarnings: number
  totalPlatformFees: number
  averageRating: number
  totalDistance: number
}

function RideHistoryContent() {
  const { data: session } = useSession()
  const { user: contextUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rides, setRides] = useState<RideHistory[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filter, setFilter] = useState<"all" | "today" | "week">("all")
  const isMountedRef = useRef(true)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/10 text-emerald-700 border-emerald-200"
      case "in_progress":
        return "bg-blue-500/10 text-blue-700 border-blue-200"
      case "accepted":
        return "bg-amber-500/10 text-amber-700 border-amber-200"
      case "pending":
        return "bg-slate-500/10 text-slate-700 border-slate-200"
      default:
        return "bg-slate-500/10 text-slate-700 border-slate-200"
    }
  }

  const user = session?.user
    ? {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        firstName: (session.user as any).firstName || "User",
      }
    : contextUser

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fetch rides and stats
  useEffect(() => {
    if (!user?.id || !isMountedRef.current) return

    const fetchData = async () => {
      try {
        setLoading(true)
        const ridesRes = await fetch(`/api/driver/ride-history?filter=${filter}&page=${page}`)
        const ridesData = await ridesRes.json()

        if (!isMountedRef.current) return

        if (page === 1) {
          setRides(ridesData.rides || [])
        } else {
          setRides((prev) => [...prev, ...(ridesData.rides || [])])
        }

        setHasMore((ridesData.rides || []).length === 10)

        // Fetch stats from earnings endpoint (same as earnings page)
        const statsRes = await fetch("/api/driver/earnings?timeframe=all")
        const statsData = await statsRes.json()
        
        if (isMountedRef.current && statsData.earnings) {
          // Transform earnings data to match stats interface
          setStats({
            totalRides: statsData.earnings.total_rides_accepted,
            totalEarnings: statsData.earnings.total_driver_earnings,
            totalPlatformFees: statsData.earnings.total_platform_fee,
            averageRating: statsData.earnings.average_rating,
            totalDistance: statsData.earnings.total_distance,
          })
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        toast.error("Failed to load ride history")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user?.id, filter])

  if (loading && rides.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your ride history...</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="flex min-h-screen bg-background pb-24 lg:pb-0">
        <AnimatedSidebar />

        <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
          <div className="p-4 md:p-6 lg:p-8 space-y-6">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-2xl md:text-3xl font-bold">Ride History & Earnings</h1>
              <p className="text-muted-foreground mt-1">
                Track your completed rides and daily earnings
              </p>
            </motion.div>

            {/* Stats Cards */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4"
              >
                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Rides</p>
                        <p className="text-3xl font-bold mt-1">{stats.totalRides}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Earnings</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                          ₦{stats.totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Platform Fees</p>
                        <p className="text-3xl font-bold text-orange-600 mt-1">
                          ₦{stats.totalPlatformFees.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-orange-600/50" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Rating</p>
                        <p className="text-3xl font-bold text-purple-600 mt-1">
                          {stats.averageRating.toFixed(1)} ⭐
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-purple-600/50" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex gap-2"
            >
              {["all", "today", "week"].map((f) => (
                <Button
                  key={f}
                  onClick={() => {
                    setFilter(f as "all" | "today" | "week")
                    setPage(1)
                  }}
                  variant={filter === f ? "default" : "outline"}
                  className="capitalize"
                >
                  {f === "all" ? "All Time" : f === "today" ? "Today" : "This Week"}
                </Button>
              ))}
            </motion.div>

            {/* Rides List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-3"
            >
              {rides.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No ride history for this period</p>
                </Card>
              ) : (
                <>
                  {rides.map((ride, idx) => (
                    <motion.div
                      key={ride.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      <Card className="hover:shadow-md transition-shadow overflow-hidden">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Header */}
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">
                                  {ride.users?.first_name} {ride.users?.last_name}
                                </h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(ride.completed_at || ride.created_at).toLocaleDateString(
                                    "en-US",
                                    { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                                  )}
                                </p>
                              </div>
                              <Badge className={`capitalize ${getStatusColor(ride.status)}`}>
                                {ride.status.replace(/_/g, " ")}
                              </Badge>
                            </div>

                            {/* Route */}
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-green-500" />
                              <span className="font-medium">{ride.pickup_zone}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-medium">{ride.destination_zone}</span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-4 gap-2 pt-2 border-t">
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Distance</p>
                                <p className="font-bold text-sm">{ride.distance_km.toFixed(1)} km</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Fare</p>
                                <p className="font-bold text-sm">₦{ride.fare_amount.toLocaleString()}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-muted-foreground">Platform</p>
                                <p className="font-bold text-sm text-orange-600">₦{ride.platform_fee.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                              </div>
                              <div className="text-center bg-green-500/10 rounded">
                                <p className="text-xs text-muted-foreground">You Get</p>
                                <p className="font-bold text-sm text-green-600">₦{ride.driver_earnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                              </div>
                            </div>

                            {/* Rating */}
                            {ride.rating && (
                              <div className="flex items-center gap-1 text-sm">
                                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                <span className="text-muted-foreground">
                                  Rating: {ride.rating.toFixed(1)} / 5
                                </span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}

                  {/* Load More */}
                  {hasMore && (
                    <Button
                      onClick={() => setPage((p) => p + 1)}
                      variant="outline"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader className="h-4 w-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        "Load More"
                      )}
                    </Button>
                  )}
                </>
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

export default function HistoryPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <RideHistoryContent />
    </ProtectedRoute>
  )
}
