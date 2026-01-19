"use client"

import { useEffect, useState, useRef } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CharterKeKeMap } from "@/components/easely-map"
import { Badge } from "@/components/ui/badge"
import { Loader, MapPin, Clock, Wallet, ArrowRight, AlertCircle, CheckCircle, Navigation } from "lucide-react"
import { toast } from "sonner"

interface Ride {
  id: string
  pickup_zone: string
  destination_zone: string
  pickup_description?: string
  destination_description?: string
  fare_amount: number
  driver_earnings: number
  platform_fee: number
  status: string
  users: {
    first_name: string
    last_name: string
    phone_number: string
  }
  created_at: string
  distance_km: number
  pickup_time?: string
}

export default function DriverRides() {
  const { data: session } = useSession()
  const [rides, setRides] = useState<Ride[]>([])
  const [availableRides, setAvailableRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"available" | "accepted">("available")
  const [acceptingRide, setAcceptingRide] = useState<string | null>(null)
  const [updatingRide, setUpdatingRide] = useState<string | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Fetch rides
  const fetchRides = async () => {
    try {
      setLoading(true)
      
      // Fetch available rides
      const availRes = await fetch("/api/driver/available-rides")
      const availData = await availRes.json()
      setAvailableRides(availData.rides || [])

      // Fetch accepted/active rides
      const activeRes = await fetch("/api/driver/active-rides")
      const activeData = await activeRes.json()
      setRides(activeData.rides || [])

      // Create map markers for all rides
      const markers: any[] = []
      ;[...(availData.rides || []), ...(activeData.rides || [])].forEach((ride: Ride) => {
        let pickupLat = 6.5244
        let pickupLng = 3.3792
        let dropoffLat = 6.6244
        let dropoffLng = 3.4792

        if (ride.pickup_description) {
          const match = ride.pickup_description.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/)
          if (match) {
            pickupLat = parseFloat(match[1])
            pickupLng = parseFloat(match[2])
          }
        }
        if (ride.destination_description) {
          const match = ride.destination_description.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/)
          if (match) {
            dropoffLat = parseFloat(match[1])
            dropoffLng = parseFloat(match[2])
          }
        }

        markers.push({
          id: `pickup-${ride.id}`,
          lat: pickupLat,
          lng: pickupLng,
          title: ride.pickup_zone,
          description: `Pickup for ${ride.users?.first_name}`,
          type: "pickup",
        })

        markers.push({
          id: `destination-${ride.id}`,
          lat: dropoffLat,
          lng: dropoffLng,
          title: ride.destination_zone,
          type: "destination",
        })
      })
      setMapMarkers(markers)
    } catch (error) {
      console.error("Failed to fetch rides:", error)
      toast.error("Failed to load rides")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (!session?.user || !isMountedRef.current) return
    
    // Fetch rides once on mount
    fetchRides()
    
    // Only refresh if tab is "accepted" (for active rides), no need to refresh available rides
    if (activeTab === "accepted") {
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) fetchRides()
      }, 30000) // 30 seconds for accepted rides
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [session?.user, activeTab])

  // Accept a ride
  const handleAcceptRide = async (rideId: string) => {
    try {
      setAcceptingRide(rideId)
      const response = await fetch("/api/driver/accept-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to accept ride")
      }

      toast.success("Ride accepted! Heading to pickup location.")
      await fetchRides()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to accept ride")
    } finally {
      setAcceptingRide(null)
    }
  }

  // Update ride status (picked up / completed)
  const handleUpdateRideStatus = async (rideId: string, newStatus: "in_progress" | "completed") => {
    try {
      setUpdatingRide(rideId)
      const response = await fetch("/api/driver/update-ride-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId, status: newStatus }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to update ride")
      }

      const statusText = newStatus === "in_progress" ? "Passenger picked up" : "Ride completed"
      toast.success(statusText)
      await fetchRides()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update ride")
    } finally {
      setUpdatingRide(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const displayRides = activeTab === "available" ? availableRides : rides

  return (
    <ProtectedRoute allowedRoles={["driver"]}>
      <div className="flex min-h-screen bg-background pb-24 lg:pb-0">
        <AnimatedSidebar />

        <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
          <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Rides</h1>
              <p className="text-muted-foreground mt-2">
                {availableRides.length} available • {rides.length} accepted
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab("available")}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  activeTab === "available"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Available ({availableRides.length})
              </button>
              <button
                onClick={() => setActiveTab("accepted")}
                className={`px-4 py-2 border-b-2 font-medium transition-colors ${
                  activeTab === "accepted"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Accepted ({rides.length})
              </button>
            </div>

            {displayRides.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {activeTab === "available"
                    ? "No available rides at the moment"
                    : "No accepted rides"}
                </p>
              </Card>
            ) : (
              <>
                {mapMarkers.length > 0 && (
                  <Card className="overflow-hidden">
                    <CharterKeKeMap
                      height="h-96"
                      markers={mapMarkers}
                      showRoute={true}
                      className="w-full"
                    />
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {displayRides.map((ride) => (
                    <Card
                      key={ride.id}
                      className="hover:shadow-md hover:border-primary/50 transition-all"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">
                              {ride.users?.first_name} {ride.users?.last_name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ride.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {ride.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Pickup */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-green-500" />
                            From
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            {ride.pickup_zone}
                          </p>
                          {ride.pickup_time && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <Clock className="h-3 w-3" />
                              {new Date(ride.pickup_time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>

                        <div className="h-6 flex items-center justify-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        </div>

                        {/* Dropoff */}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-red-500" />
                            To
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            {ride.destination_zone}
                          </p>
                        </div>

                        {/* Ride Details */}
                        <div className="pt-3 border-t space-y-2">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div>
                              <p className="text-xs text-muted-foreground">Distance</p>
                              <p className="text-sm font-bold">{ride.distance_km.toFixed(1)} km</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Fare</p>
                              <p className="text-sm font-bold">₦{ride.fare_amount.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">You Get</p>
                              <p className="text-sm font-bold text-emerald-600">
                                ₦{ride.driver_earnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">Passenger Contact</p>
                          <p className="text-sm font-semibold">{ride.users?.phone_number}</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t space-y-2">
                          {activeTab === "available" && ride.status === "pending" && (
                            <Button
                              onClick={() => handleAcceptRide(ride.id)}
                              disabled={acceptingRide === ride.id}
                              className="w-full bg-green-600 hover:bg-green-700"
                            >
                              {acceptingRide === ride.id ? (
                                <>
                                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Accept Ride
                                </>
                              )}
                            </Button>
                          )}

                          {activeTab === "accepted" && (
                            <>
                              {ride.status === "accepted" && (
                                <Button
                                  onClick={() => handleUpdateRideStatus(ride.id, "in_progress")}
                                  disabled={updatingRide === ride.id}
                                  className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                  {updatingRide === ride.id ? (
                                    <>
                                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <Navigation className="h-4 w-4 mr-2" />
                                      Mark Picked Up
                                    </>
                                  )}
                                </Button>
                              )}

                              {ride.status === "in_progress" && (
                                <Button
                                  onClick={() => handleUpdateRideStatus(ride.id, "completed")}
                                  disabled={updatingRide === ride.id}
                                  className="w-full"
                                >
                                  {updatingRide === ride.id ? (
                                    <>
                                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                                      Updating...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Mark Completed
                                    </>
                                  )}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
