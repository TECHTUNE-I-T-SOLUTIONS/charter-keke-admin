"use client"

import { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CharterKeKeMap } from "@/components/easely-map"
import { MapPin, Clock, Phone, X, Loader, Wifi, WifiOff } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface RideLocation {
  driver?: { lat: number; lng: number; timestamp: string; accuracy?: number; speed?: number; heading?: number }
  rider?: { lat: number; lng: number; timestamp: string; accuracy?: number; speed?: number; heading?: number }
}

interface RideDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  ride: {
    id: string
    pickup_zone: string
    destination_zone: string
    pickup_description?: string
    destination_description?: string
    fare_amount: number
    driver_earnings: number
    platform_fee: number
    status: string
    distance_km: number
    users?: {
      first_name: string
      last_name: string
      phone_number: string
    }
  }
}

export function RideDetailsModal({ isOpen, onClose, ride }: RideDetailsModalProps) {
  const [locations, setLocations] = useState<RideLocation>({})
  const [loading, setLoading] = useState(true)
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(true)
  const subscriptionsRef = useRef<any[]>([])
  const isMountedRef = useRef(true)

  // Extract coordinates from description
  const extractCoordinates = (description?: string) => {
    if (!description) return null
    const match = description.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/)
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
    }
    return null
  }

  // Update map markers based on locations
  const updateMapMarkers = (currentLocations: RideLocation) => {
    const newMarkers: any[] = []
    
    // Pickup location (static)
    const pickupCoords = extractCoordinates(ride.pickup_description) || { lat: 6.5244, lng: 3.3792 }
    newMarkers.push({
      id: "pickup",
      lat: pickupCoords.lat,
      lng: pickupCoords.lng,
      title: ride.pickup_zone,
      type: "pickup",
      icon: "📍",
    })

    // Destination location (static)
    const destCoords = extractCoordinates(ride.destination_description) || { lat: 6.6244, lng: 3.4792 }
    newMarkers.push({
      id: "destination",
      lat: destCoords.lat,
      lng: destCoords.lng,
      title: ride.destination_zone,
      type: "destination",
      icon: "🎯",
    })

    // Driver current location
    if (currentLocations.driver) {
      newMarkers.push({
        id: "driver",
        lat: currentLocations.driver.lat,
        lng: currentLocations.driver.lng,
        title: "Driver Current Location",
        type: "driver",
        icon: "🚗",
      })
    }

    // Rider current location
    if (currentLocations.rider) {
      newMarkers.push({
        id: "rider",
        lat: currentLocations.rider.lat,
        lng: currentLocations.rider.lng,
        title: "Rider Current Location",
        type: "rider",
        icon: "👤",
      })
    }

    setMapMarkers(newMarkers)
  }

  // Fetch initial locations
  const fetchInitialLocations = async () => {
    try {
      const response = await fetch(`/api/driver/ride-location?rideId=${ride.id}`)
      const data = await response.json()
      
      if (isMountedRef.current) {
        setLocations(data.locations || {})
        updateMapMarkers(data.locations || {})
        setLoading(false)
      }
    } catch (error) {
      console.error("Failed to fetch locations:", error)
      setLoading(false)
    }
  }

  // Subscribe to real-time location updates
  const subscribeToLocations = () => {
    try {
      // Subscribe to driver location changes
      const driverSub = supabase
        .channel(`ride-driver-${ride.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to INSERT, UPDATE, DELETE
            schema: "public",
            table: "driver_locations",
            filter: `ride_id=eq.${ride.id}`,
          },
          (payload: any) => {
            if (isMountedRef.current && (payload.eventType === "INSERT" || payload.eventType === "UPDATE")) {
              const newLocation = {
                lat: parseFloat(payload.new.latitude),
                lng: parseFloat(payload.new.longitude),
                timestamp: payload.new.timestamp,
                accuracy: payload.new.accuracy,
                speed: payload.new.speed,
                heading: payload.new.heading,
              }
              setLocations((prev) => ({
                ...prev,
                driver: newLocation,
              }))
              // Update map marker immediately
              setMapMarkers((prevMarkers) =>
                prevMarkers.map((marker) =>
                  marker.id === "driver"
                    ? {
                        ...marker,
                        lat: newLocation.lat,
                        lng: newLocation.lng,
                      }
                    : marker
                )
              )
            }
          }
        )
        .subscribe((status) => {
          console.log(`Driver location subscription status: ${status}`)
          setIsConnected(status === "SUBSCRIBED")
        })

      // Subscribe to user location changes
      const userSub = supabase
        .channel(`ride-user-${ride.id}`)
        .on(
          "postgres_changes",
          {
            event: "*", // Listen to INSERT, UPDATE, DELETE
            schema: "public",
            table: "user_locations",
            filter: `ride_id=eq.${ride.id}`,
          },
          (payload: any) => {
            if (isMountedRef.current && (payload.eventType === "INSERT" || payload.eventType === "UPDATE")) {
              const newLocation = {
                lat: parseFloat(payload.new.latitude),
                lng: parseFloat(payload.new.longitude),
                timestamp: payload.new.timestamp,
                accuracy: payload.new.accuracy,
                speed: payload.new.speed,
                heading: payload.new.heading,
              }
              setLocations((prev) => ({
                ...prev,
                rider: newLocation,
              }))
              // Update map marker immediately
              setMapMarkers((prevMarkers) =>
                prevMarkers.map((marker) =>
                  marker.id === "rider"
                    ? {
                        ...marker,
                        lat: newLocation.lat,
                        lng: newLocation.lng,
                      }
                    : marker
                )
              )
            }
          }
        )
        .subscribe((status) => {
          console.log(`User location subscription status: ${status}`)
          setIsConnected(status === "SUBSCRIBED")
        })

      subscriptionsRef.current = [driverSub, userSub]
    } catch (error) {
      console.error("Failed to subscribe to locations:", error)
    }
  }

  // Cleanup subscriptions
  const unsubscribeFromLocations = () => {
    subscriptionsRef.current.forEach((sub) => {
      supabase.removeChannel(sub)
    })
    subscriptionsRef.current = []
  }

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      unsubscribeFromLocations()
    }
  }, [])

  // Subscribe when modal opens
  useEffect(() => {
    if (!isOpen) {
      unsubscribeFromLocations()
      return
    }

    fetchInitialLocations()
    subscribeToLocations()
  }, [isOpen, ride.id])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between w-full pr-8">
            <div>
              <DialogTitle className="text-2xl">
                {ride.users?.first_name} {ride.users?.last_name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                Live Ride Tracking
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-600" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-600" />
                )}
              </p>
            </div>
            <Badge variant="secondary" className="capitalize">
              {ride.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Live Map */}
          <div>
            <h3 className="font-semibold mb-2">Live Map</h3>
            {loading ? (
              <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
                <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Card className="overflow-hidden">
                <CharterKeKeMap
                  height="h-96"
                  markers={mapMarkers}
                  showRoute={ride.status !== "pending"}
                  className="w-full"
                />
              </Card>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Real-time updates • 🚗 Driver • 👤 Rider • 📍 Pickup • 🎯 Destination
            </p>
          </div>

          {/* Route Information */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Route Details</h3>
            <div className="space-y-4">
              {/* Pickup */}
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  Pickup Location
                </p>
                <p className="text-sm font-semibold">{ride.pickup_zone}</p>
                {ride.pickup_description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {ride.pickup_description}
                  </p>
                )}
              </div>

              <div className="border-t" />

              {/* Destination */}
              <div>
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-red-500" />
                  Destination
                </p>
                <p className="text-sm font-semibold">{ride.destination_zone}</p>
                {ride.destination_description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {ride.destination_description}
                  </p>
                )}
              </div>
            </div>
          </Card>

          {/* Live Locations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver Location */}
            <Card className="p-4 border-blue-200">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <span className="text-lg">🚗</span>
                Driver Location
              </h3>
              {locations.driver ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinates</p>
                    <p className="text-sm font-mono">
                      {locations.driver.lat.toFixed(6)}, {locations.driver.lng.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Update
                    </p>
                    <p className="text-sm">
                      {new Date(locations.driver.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {locations.driver.accuracy && (
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="text-sm">±{locations.driver.accuracy.toFixed(0)}m</p>
                    </div>
                  )}
                  {locations.driver.speed !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Speed</p>
                      <p className="text-sm">{(locations.driver.speed * 3.6).toFixed(1)} km/h</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Location not available yet</p>
              )}
            </Card>

            {/* Rider Location */}
            <Card className="p-4 border-purple-200">
              <h3 className="font-semibold flex items-center gap-2 mb-3">
                <span className="text-lg">👤</span>
                Rider Location
              </h3>
              {locations.rider ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinates</p>
                    <p className="text-sm font-mono">
                      {locations.rider.lat.toFixed(6)}, {locations.rider.lng.toFixed(6)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Last Update
                    </p>
                    <p className="text-sm">
                      {new Date(locations.rider.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  {locations.rider.accuracy && (
                    <div>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                      <p className="text-sm">±{locations.rider.accuracy.toFixed(0)}m</p>
                    </div>
                  )}
                  {locations.rider.speed !== undefined && (
                    <div>
                      <p className="text-xs text-muted-foreground">Speed</p>
                      <p className="text-sm">{(locations.rider.speed * 3.6).toFixed(1)} km/h</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Location not available yet</p>
              )}
            </Card>
          </div>

          {/* Ride Statistics */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Ride Details</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Distance</p>
                <p className="text-lg font-bold mt-1">{ride.distance_km.toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Fare Amount</p>
                <p className="text-lg font-bold mt-1">₦{ride.fare_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Platform Fee</p>
                <p className="text-lg font-bold text-orange-600 mt-1">
                  ₦{ride.platform_fee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">You Earn</p>
                <p className="text-lg font-bold text-green-600 mt-1">
                  ₦{ride.driver_earnings.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </Card>

          {/* Passenger Contact */}
          <Card className="p-4 bg-blue-500/50">
            <h3 className="font-semibold mb-3">Passenger Contact</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  {ride.users?.first_name} {ride.users?.last_name}
                </p>
                <p className="text-sm text-primary flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4" />
                  {ride.users?.phone_number}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.href = `tel:${ride.users?.phone_number}`}>
                Call Passenger
              </Button>
            </div>
          </Card>

          {/* Close Button */}
          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
