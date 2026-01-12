"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CharterKeKeMap } from "@/components/easely-map"
import { Badge } from "@/components/ui/badge"
import { Loader, MapPin, Clock, Wallet, ArrowRight, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function DriverRides() {
  const { data: session } = useSession()
  const [rides, setRides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [mapMarkers, setMapMarkers] = useState<any[]>([])

  useEffect(() => {
    if (!session?.user) return

    const fetchRides = async () => {
      try {
        const response = await fetch("/api/driver/active-rides")
        const data = await response.json()
        setRides(data.rides || [])

        // Create map markers
        const markers: any[] = []
        data.rides?.forEach((ride: any) => {
          markers.push({
            id: `pickup-${ride.id}`,
            lat: 6.5244 + Math.random() * 0.05,
            lng: 3.3792 + Math.random() * 0.05,
            title: ride.pickup_zone,
            description: `Pickup for ${ride.users?.first_name}`,
            type: "pickup",
          })

          markers.push({
            id: `destination-${ride.id}`,
            lat: 6.5244 + Math.random() * 0.1,
            lng: 3.3792 + Math.random() * 0.1,
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

    fetchRides()
  }, [session?.user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="driver">
      <div className="flex min-h-screen bg-background">
        <AnimatedSidebar />

        <main className="flex-1 lg:pl-0 pt-16 lg:pt-0">
          <div className="p-4 md:p-6 lg:p-8 space-y-6">
            <div>
              <h1 className="text-3xl font-bold">Active Rides</h1>
              <p className="text-muted-foreground mt-2">
                {rides.length} active ride{rides.length !== 1 ? "s" : ""}
              </p>
            </div>

            {rides.length === 0 ? (
              <Card className="p-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground">No active rides right now</p>
              </Card>
            ) : (
              <>
                <CharterKeKeMap
                  height="h-96"
                  markers={mapMarkers}
                  showRoute={false}
                  className="w-full"
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {rides.map((ride) => (
                    <Card
                      key={ride.id}
                      className="cursor-pointer hover:shadow-md hover:border-primary/50 transition-all"
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
                          <Badge variant="secondary">{ride.status}</Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            From
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            {ride.pickup_zone}
                          </p>
                          {ride.pickup_description && (
                            <p className="text-xs text-muted-foreground">
                              {ride.pickup_description}
                            </p>
                          )}
                        </div>

                        <div className="h-8 flex items-center justify-center">
                          <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            To
                          </p>
                          <p className="text-sm font-semibold mt-1">
                            {ride.destination_zone}
                          </p>
                          {ride.destination_description && (
                            <p className="text-xs text-muted-foreground">
                              {ride.destination_description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Fare
                            </span>
                            <span className="font-bold">₦{ride.fare_amount}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Your Earnings
                            </span>
                            <span className="font-bold text-emerald-600">
                              ₦{ride.driver_earnings}
                            </span>
                          </div>
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
