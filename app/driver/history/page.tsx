"use client"

import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MapPin, Calendar, Star, AlertCircle, Loader } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

function RideHistoryContent() {
  const { data: session } = useSession()
  const { user: contextUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rides, setRides] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  const user = session?.user
    ? {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        firstName: (session.user as any).firstName || "User",
      }
    : contextUser

  useEffect(() => {
    if (!user?.id) return

    const fetchRides = async () => {
      try {
        setLoading(true)
        const ridesRes = await fetch(`/api/driver/ride-history?page=${page}`)
        const ridesData = await ridesRes.json()

        if (page === 1) {
          setRides(ridesData.rides || [])
        } else {
          setRides((prev) => [...prev, ...(ridesData.rides || [])])
        }

        setHasMore((ridesData.rides || []).length === 10)
      } catch (error) {
        console.error("Failed to fetch ride history:", error)
        toast.error("Failed to load ride history")
      } finally {
        setLoading(false)
      }
    }

    fetchRides()
  }, [user?.id, page])

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  if (loading && page === 1) {
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
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
              Ride History
            </h1>
            <p className="text-muted-foreground mt-1">
              View all your completed and cancelled rides
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {rides.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No ride history yet</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {rides.map((ride) => (
                  <Card key={ride.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col gap-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">
                            {ride.users?.first_name} {ride.users?.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(ride.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>
                        <Badge
                          className={
                            ride.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }
                        >
                          {ride.status}
                        </Badge>
                      </div>

                      {/* Route Info */}
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{ride.pickup_zone}</p>
                          <p className="text-xs text-muted-foreground">→</p>
                          <p className="text-sm font-medium">{ride.destination_zone}</p>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                        <div>
                          <p className="text-xs text-muted-foreground">Fare</p>
                          <p className="font-bold">₦{ride.fare_amount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Distance</p>
                          <p className="font-bold">{ride.distance_km || 0} km</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-bold">{ride.duration_minutes || 0} min</p>
                        </div>
                      </div>

                      {/* Rating */}
                      {ride.driver_rating && (
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < ride.driver_rating
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {ride.driver_review || "No review"}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}

                {hasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={handleLoadMore}
                      disabled={loading}
                      variant="outline"
                    >
                      {loading ? "Loading..." : "Load More"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  )
}

export default function HistoryPage() {
  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <RideHistoryContent />
    </ProtectedRoute>
  )
}
