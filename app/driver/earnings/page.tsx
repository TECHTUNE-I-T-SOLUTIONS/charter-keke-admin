"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader, TrendingUp, Calendar, AlertCircle, MapPin, DollarSign, Zap, Star } from "lucide-react"
import { toast } from "sonner"

interface Ride {
  id: string
  status: string
  pickup_zone: string
  destination_zone: string
  fare_amount: number
  driver_earnings: number
  platform_fee: number
  distance_km: number
  rating?: number
  created_at: string
  completed_at?: string
  users?: {
    first_name: string
    last_name: string
  }
}

interface EarningsData {
  timeframe: string
  total_rides_accepted: number
  total_ride_earnings: number
  platform_fee_percentage: number
  total_platform_fee: number
  total_driver_earnings: number
  driver_payable_to_platform: number
  average_rating: number
  total_distance: number
}

export default function DriverEarnings() {
  const { data: session } = useSession()
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState("month")

  useEffect(() => {
    if (!session?.user) return

    const fetchEarnings = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/driver/earnings?timeframe=${timeframe}`
        )
        const data = await response.json()
        setEarnings(data.earnings)
        setRides(data.rides || [])
      } catch (error) {
        console.error("Failed to fetch earnings:", error)
        toast.error("Failed to load earnings")
      } finally {
        setLoading(false)
      }
    }

    fetchEarnings()
  }, [session?.user, timeframe])

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

  if (loading && !earnings) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <AnimatedSidebar />

        <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 pb-24 lg:pb-0">
          <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Earnings</h1>
              <p className="text-muted-foreground mt-2">Track your income from all rides</p>
            </div>

            {/* Earnings Summary */}
            {earnings && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Total Rides ({earnings.timeframe})
                        </p>
                        <p className="text-3xl font-bold mt-2">
                          {earnings.total_rides_accepted}
                        </p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Gross Earnings
                        </p>
                        <p className="text-3xl font-bold mt-2">
                          ₦{(earnings.total_ride_earnings || 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Platform Fees ({earnings.platform_fee_percentage}%)
                        </p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                          ₦{(earnings.total_platform_fee || 0).toLocaleString()}
                        </p>
                      </div>
                      <Zap className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground font-medium">
                          Avg Rating
                        </p>
                        <p className="text-3xl font-bold text-amber-600 mt-2">
                          {earnings.average_rating.toFixed(1)} ⭐
                        </p>
                      </div>
                      <Star className="h-8 w-8 text-amber-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Time Period Selector */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Filter by Period</h2>
              <Tabs defaultValue="month" onValueChange={setTimeframe}>
                <TabsList className="grid w-full max-w-md grid-cols-5">
                  <TabsTrigger value="day">Day</TabsTrigger>
                  <TabsTrigger value="week">Week</TabsTrigger>
                  <TabsTrigger value="month">Month</TabsTrigger>
                  <TabsTrigger value="year">Year</TabsTrigger>
                  <TabsTrigger value="all">All Time</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Rides List */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Your Rides</h2>

              {rides.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-muted-foreground">No rides for this period</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {rides.map((ride) => (
                    <Card key={ride.id} className="overflow-hidden hover:shadow-md transition-shadow">
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
                              <p className="font-bold text-sm text-orange-600">
                                ₦{ride.platform_fee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </p>
                            </div>
                            <div className="text-center bg-green-500/10 rounded">
                              <p className="text-xs text-muted-foreground">You Get</p>
                              <p className="font-bold text-sm text-green-600">
                                ₦{ride.driver_earnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </p>
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
