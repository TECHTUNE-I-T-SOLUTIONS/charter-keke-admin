"use client"

import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CharterKeKeMap } from "@/components/easely-map"
import { MapPin, Clock, AlertCircle, Loader, Star, Phone, Building2, RotateCcw } from "lucide-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface DriverDetails {
  name: string
  phone: string
  bank_name: string
  bank_account: string
  amount_to_pay: number
}

interface RideRoute {
  id: string
  pickupLat: number
  pickupLng: number
  dropoffLat: number
  dropoffLng: number
  pickupZone: string
  destinationZone: string
  distance: number
  fare: number
  platformFee?: number
  driverEarnings?: number
  status: string
  pickupTime?: string
  durationMinutes?: number
  driverLat?: number
  driverLng?: number
  rating?: number
}

function RidesContent() {
  const { data: session } = useSession()
  const { user: contextUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [activeRides, setActiveRides] = useState<any[]>([])
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null)
  const [completedRideId, setCompletedRideId] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedRideRoute, setSelectedRideRoute] = useState<RideRoute | null>(null)
  const [showRideModal, setShowRideModal] = useState(false)

  const user = session?.user
    ? {
        id: (session.user as any).id || "",
        email: session.user.email || "",
        firstName: (session.user as any).firstName || "User",
      }
    : contextUser

  // Fetch rides data
  const fetchRidesData = async () => {
    try {
      setIsRefreshing(true)
      const ridesRes = await fetch("/api/user/active-rides", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (!ridesRes.ok) {
        throw new Error("Failed to fetch rides")
      }

      const ridesData = await ridesRes.json()
      setActiveRides(ridesData.rides || [])

      // Create map markers from active rides
      const markers: any[] = []
      ridesData.rides?.forEach((ride: any) => {
        // Parse coordinates from descriptions if available
        let pickupLat = 6.5244 + Math.random() * 0.05
        let pickupLng = 3.3792 + Math.random() * 0.05
        let dropoffLat = 6.5244 + Math.random() * 0.1
        let dropoffLng = 3.3792 + Math.random() * 0.1

        // Try to extract coordinates from description
        if (ride.pickup_description) {
          const pickupMatch = ride.pickup_description.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/)
          if (pickupMatch) {
            pickupLat = parseFloat(pickupMatch[1])
            pickupLng = parseFloat(pickupMatch[2])
          }
        }
        if (ride.destination_description) {
          const dropoffMatch = ride.destination_description.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/)
          if (dropoffMatch) {
            dropoffLat = parseFloat(dropoffMatch[1])
            dropoffLng = parseFloat(dropoffMatch[2])
          }
        }

        markers.push({
          id: `pickup-${ride.id}`,
          lat: pickupLat,
          lng: pickupLng,
          title: ride.pickup_zone,
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
      toast.error("Failed to load active rides")
    } finally {
      setIsRefreshing(false)
      setLoading(false)
    }
  }

  // Fetch on component mount only
  useEffect(() => {
    if (!user?.id) return

    fetchRidesData()
  }, [user?.id])

  const calculateMapCenter = (ride: any): [number, number] => {
    // Parse coordinates from descriptions
    let pickupLat = 6.5244
    let pickupLng = 3.3792
    let dropoffLat = 6.5244
    let dropoffLng = 3.3792

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

    // Calculate center point between pickup and dropoff
    const centerLat = (pickupLat + dropoffLat) / 2
    const centerLng = (pickupLng + dropoffLng) / 2
    return [centerLat, centerLng]
  }

  const handleRideCompleted = async (rideId: string) => {
    try {
      const response = await fetch("/api/user/ride-completed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rideId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to get payment details")
      }

      setCompletedRideId(rideId)
      setDriverDetails(data.driver_details)
      setShowPaymentDialog(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error processing ride completion")
    }
  }

  const handleViewRoute = (ride: any) => {
    // Parse coordinates from descriptions
    let pickupLat = 6.5244
    let pickupLng = 3.3792
    let dropoffLat = 6.5244
    let dropoffLng = 3.3792

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

    setSelectedRideRoute({
      id: ride.id,
      pickupLat,
      pickupLng,
      dropoffLat,
      dropoffLng,
      pickupZone: ride.pickup_zone,
      destinationZone: ride.destination_zone,
      distance: ride.distance_km || 0,
      fare: ride.fare_amount || 0,
      platformFee: ride.platform_fee || 0,
      driverEarnings: ride.driver_earnings || 0,
      status: ride.status,
      pickupTime: ride.pickup_time,
      durationMinutes: ride.duration_minutes,
      rating: ride.rating || undefined,
    })
    setShowRideModal(true)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your rides...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 pb-24 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">
                  Active Rides
                </h1>
                <p className="text-muted-foreground mt-1">
                  Track your current and recent rides
                </p>
              </div>
              <Button
                onClick={fetchRidesData}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Tabs defaultValue="map" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="map">Map View</TabsTrigger>
                <TabsTrigger value="list">
                  Rides ({activeRides.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="map" className="space-y-4">
                {activeRides.length > 0 && (
                  <div className="p-4 bg-card/50 rounded-lg border border-border space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      Viewing: {activeRides[0].pickup_zone} → {activeRides[0].destination_zone}
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Distance</p>
                        <p className="font-semibold">{activeRides[0].distance_km?.toFixed(2) || '0.00'} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Status</p>
                        <p className="font-semibold capitalize">{activeRides[0].status}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Fare</p>
                        <p className="font-semibold">₦{activeRides[0].fare_amount?.toLocaleString() || '0'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Time</p>
                        <p className="font-semibold">
                          {new Date(activeRides[0].pickup_time).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <CharterKeKeMap
                  height="h-96"
                  center={activeRides.length > 0 ? calculateMapCenter(activeRides[0]) : [6.5244, 3.3792]}
                  markers={mapMarkers}
                  showRoute={activeRides.length > 0}
                  showGeolocation={false}
                  className="mt-4"
                />
              </TabsContent>

              <TabsContent value="list" className="space-y-4">
                {activeRides.length === 0 ? (
                  <Card className="p-8 text-center">
                    <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No active rides</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeRides.map((ride) => (
                      <Card
                        key={ride.id}
                        className="p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sm">
                              {ride.drivers?.users?.first_name}{" "}
                              {ride.drivers?.users?.last_name || "Driver"}
                            </h3>
                            <Badge className="capitalize">{ride.status}</Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-xs font-medium line-clamp-1">{ride.pickup_zone}</p>
                              <p className="text-xs text-center">↓</p>
                              <p className="text-xs font-medium line-clamp-1">{ride.destination_zone}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Distance</p>
                              <p className="font-semibold text-sm">{ride.distance_km?.toFixed(2) || '0.00'} km</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Fare</p>
                              <p className="font-semibold text-sm">₦{ride.fare_amount?.toLocaleString() || '0'}</p>
                            </div>
                          </div>

                          {ride.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-muted-foreground">
                                {ride.rating.toFixed(1)}
                              </span>
                            </div>
                          )}

                          <Button
                            onClick={() => handleViewRoute(ride)}
                            variant="secondary"
                            size="sm"
                            className="w-full"
                          >
                            <MapPin className="h-4 w-4 mr-2" />
                            View Route
                          </Button>

                          {ride.status === "completed" && (
                            <Button
                              onClick={() => handleRideCompleted(ride.id)}
                              className="w-full bg-primary hover:bg-primary/90"
                            >
                              View Payment Details
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>

      {/* Payment Dialog */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Payment Details</AlertDialogTitle>
            <AlertDialogDescription>
              Your ride is complete. Please pay the driver directly.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {driverDetails && (
            <div className="space-y-4 py-4">
              {/* Amount to Pay */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-muted-foreground mb-1">Amount to Pay</p>
                <p className="text-3xl font-bold text-primary">₦{driverDetails.amount_to_pay.toLocaleString()}</p>
              </div>

              {/* Driver Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-sm mb-3">Driver Information</h4>

                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium text-sm">{driverDetails.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bank</p>
                      <p className="font-medium text-sm">{driverDetails.bank_name}</p>
                      <p className="font-mono text-xs text-muted-foreground mt-1">
                        {driverDetails.bank_account}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800">
                  💡 <strong>Tip:</strong> Make sure to confirm the account details with the driver before paying.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <AlertDialogCancel className="flex-1">Close</AlertDialogCancel>
            <AlertDialogAction className="flex-1 bg-primary">
              I've Paid the Driver
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ride Route Modal */}
      {/* Ride Route Modal with Map Background */}
      {showRideModal && selectedRideRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40">
          {/* Compact Modal Container - Much smaller */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full sm:max-w-sm md:max-w-md h-[60vh] sm:h-[500px] rounded-2xl overflow-hidden bg-background relative shadow-2xl border border-border"
          >
            {/* Map - Takes majority of space */}
            <CharterKeKeMap
              height="100%"
              center={[
                (selectedRideRoute.pickupLat + selectedRideRoute.dropoffLat) / 2,
                (selectedRideRoute.pickupLng + selectedRideRoute.dropoffLng) / 2,
              ]}
              zoom={13}
              markers={[
                {
                  id: "pickup",
                  lat: selectedRideRoute.pickupLat,
                  lng: selectedRideRoute.pickupLng,
                  title: selectedRideRoute.pickupZone,
                  type: "pickup",
                },
                {
                  id: "destination",
                  lat: selectedRideRoute.dropoffLat,
                  lng: selectedRideRoute.dropoffLng,
                  title: selectedRideRoute.destinationZone,
                  type: "destination",
                },
              ]}
              showRoute={true}
              showGeolocation={false}
              className="w-full h-full"
            />

            {/* Close Button - Top Right */}
            <button
              onClick={() => setShowRideModal(false)}
              className="absolute top-2 right-2 z-20 bg-background/90 hover:bg-background/100 rounded-full p-1.5 transition-all shadow-md"
            >
              <span className="text-base font-bold text-foreground">✕</span>
            </button>

            {/* Route Info Overlay - Top Left */}
            <div className="absolute top-2 left-2 right-10 z-20 bg-card/95 backdrop-blur rounded-lg p-2 shadow-lg border border-border/50">
              <p className="text-xs font-bold text-foreground line-clamp-1">
                {selectedRideRoute.distance.toFixed(2)} km • ₦{selectedRideRoute.fare.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground line-clamp-1">
                {selectedRideRoute.pickupZone} → {selectedRideRoute.destinationZone}
              </p>
            </div>

            {/* Bottom Compact Info Panel */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-card/98 via-card/95 to-transparent backdrop-blur-sm pt-8 pb-2 px-2">
              <div className="space-y-1.5">
                {/* Mini Status Row */}
                <div className="flex items-center justify-between gap-1 px-1">
                  <Badge variant="outline" className="capitalize text-xs h-5">
                    {selectedRideRoute.status}
                  </Badge>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Your Pay</p>
                    <p className="text-sm font-bold text-primary">₦{selectedRideRoute.fare.toLocaleString()}</p>
                  </div>
                </div>

                {/* Mini Details Grid */}
                <div className="grid grid-cols-3 gap-1">
                  <div className="p-1.5 rounded bg-muted/50 text-center">
                    <p className="text-[9px] text-muted-foreground">Distance</p>
                    <p className="text-xs font-bold text-foreground">{selectedRideRoute.distance.toFixed(1)} km</p>
                  </div>
                  {/* <div className="p-1.5 rounded bg-green-500/10 border border-green-500/20 text-center">
                    <p className="text-[9px] text-muted-foreground">Driver</p>
                    <p className="text-xs font-bold text-green-600 dark:text-green-400">
                      ₦{Math.round((selectedRideRoute.driverEarnings || 0) / 100) * 100}
                    </p>
                  </div> */}
                  <button
                    onClick={() => setShowRideModal(false)}
                    className="p-1.5 rounded bg-muted/50 hover:bg-muted transition-colors text-center"
                  >
                    <p className="text-xs font-bold text-foreground">Close</p>
                  </button>
                </div>

                {/* Expandable Details */}
                {(selectedRideRoute.pickupTime || selectedRideRoute.rating || selectedRideRoute.platformFee) && (
                  <details className="group">
                    <summary className="text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground px-1 py-0.5">
                    More Details
                    </summary>
                    <div className="text-xs space-y-1 pt-1 px-1">
                      {selectedRideRoute.pickupTime && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pickup:</span>
                          <span className="font-medium">
                            {new Date(selectedRideRoute.pickupTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {selectedRideRoute.rating && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="font-medium">⭐ {selectedRideRoute.rating.toFixed(1)}</span>
                        </div>
                      )}
                      {/* {selectedRideRoute.platformFee !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Platform Fee:</span>
                          <span className="font-medium">₦{selectedRideRoute.platformFee.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                        </div>
                      )} */}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}


export default function RidesPage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <RidesContent />
    </ProtectedRoute>
  )
}
