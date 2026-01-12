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
        markers.push({
          id: `pickup-${ride.id}`,
          lat: ride.pickup_latitude || 6.5244 + Math.random() * 0.05,
          lng: ride.pickup_longitude || 3.3792 + Math.random() * 0.05,
          title: ride.pickup_address || ride.pickup_zone,
          type: "pickup",
        })

        markers.push({
          id: `destination-${ride.id}`,
          lat: ride.dropoff_latitude || 6.5244 + Math.random() * 0.1,
          lng: ride.dropoff_longitude || 3.3792 + Math.random() * 0.1,
          title: ride.dropoff_address || ride.destination_zone,
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
                <CharterKeKeMap
                  height="h-96"
                  center={userLocation || [6.5244, 3.3792]}
                  markers={mapMarkers}
                  showRoute={false}
                  showGeolocation={true}
                  onLocationChange={(lat, lng) => setUserLocation([lat, lng])}
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
                            <h3 className="font-semibold">
                              {ride.drivers?.users?.first_name}{" "}
                              {ride.drivers?.users?.last_name}
                            </h3>
                            <Badge>{ride.status}</Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0" />
                            <div>
                              <p>{ride.pickup_zone}</p>
                              <p className="text-xs">→</p>
                              <p>{ride.destination_zone}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div>
                              <p className="text-xs text-muted-foreground">Fare</p>
                              <p className="font-bold">₦{ride.fare_amount}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Status</p>
                              <p className="font-medium capitalize text-sm">
                                {ride.status}
                              </p>
                            </div>
                          </div>

                          {ride.drivers?.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                              <span className="text-muted-foreground">
                                {ride.drivers.rating}
                              </span>
                            </div>
                          )}

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
