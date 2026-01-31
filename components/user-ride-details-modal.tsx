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

interface UserRideDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  ride: {
    id: string
    pickup_zone: string
    destination_zone: string
    pickup_description?: string
    destination_description?: string
    fare_amount: number
    driver_earnings?: number
    platform_fee?: number
    status: string
    distance_km: number
    driver?: {
      first_name: string
      last_name: string
      phone_number: string
    }
  }
}

export function UserRideDetailsModal({
  isOpen,
  onClose,
  ride,
}: UserRideDetailsModalProps) {
  const [locations, setLocations] = useState<RideLocation>({})
  const [mapMarkers, setMapMarkers] = useState<any[]>([])
  const [isSubscribed, setIsSubscribed] = useState(false)
  const isMountedRef = useRef(true)

  // Parse coordinates from ride descriptions
  const parseCoordinates = (description: string | undefined) => {
    if (!description) return { lat: 6.5244, lng: 3.3792 }
    const match = description.match(/Lat:\s*([\d.-]+),\s*Lng:\s*([\d.-]+)/)
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) }
    }
    return { lat: 6.5244, lng: 3.3792 }
  }

  const pickupCoords = parseCoordinates(ride.pickup_description)
  const destinationCoords = parseCoordinates(ride.destination_description)

  // Initialize map markers
  useEffect(() => {
    const initialMarkers = [
      {
        id: "pickup",
        lat: pickupCoords.lat,
        lng: pickupCoords.lng,
        title: ride.pickup_zone,
        type: "pickup",
        icon: "📍",
      },
      {
        id: "destination",
        lat: destinationCoords.lat,
        lng: destinationCoords.lng,
        title: ride.destination_zone,
        type: "destination",
        icon: "🎯",
      },
    ]
    setMapMarkers(initialMarkers)
  }, [ride])

  // Subscribe to real-time locations
  const subscribeToLocations = () => {
    if (!isOpen || !ride.id) return

    const channel = supabase.channel(`ride-locations-${ride.id}`)

    // Subscribe to driver locations
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "driver_locations",
        filter: `ride_id=eq.${ride.id}`,
      },
      (payload) => {
        if (isMountedRef.current && (payload.eventType === "INSERT" || payload.eventType === "UPDATE")) {
          const newLocation = payload.new as any
          setLocations((prev) => ({
            ...prev,
            driver: {
              lat: newLocation.latitude,
              lng: newLocation.longitude,
              timestamp: newLocation.timestamp,
              accuracy: newLocation.accuracy,
              speed: newLocation.speed,
              heading: newLocation.heading,
            },
          }))

          // Update driver marker on map
          // Add or update driver marker on map
          setMapMarkers((prevMarkers) => {
            const exists = prevMarkers.some((m) => m.id === "driver")
            if (exists) {
              return prevMarkers.map((marker) => (marker.id === "driver" ? { ...marker, lat: newLocation.latitude, lng: newLocation.longitude } : marker))
            }
            return [
              ...prevMarkers,
              {
                id: "driver",
                lat: newLocation.latitude,
                lng: newLocation.longitude,
                title: "Driver",
                type: "driver",
                icon: "🚗",
              },
            ]
          })

          console.log("🚗 Driver location updated")
        }
      }
    )

    // Subscribe to rider locations
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_locations",
        filter: `ride_id=eq.${ride.id}`,
      },
      (payload) => {
        if (isMountedRef.current && (payload.eventType === "INSERT" || payload.eventType === "UPDATE")) {
          const newLocation = payload.new as any
          setLocations((prev) => ({
            ...prev,
            rider: {
              lat: newLocation.latitude,
              lng: newLocation.longitude,
              timestamp: newLocation.timestamp,
              accuracy: newLocation.accuracy,
              speed: newLocation.speed,
              heading: newLocation.heading,
            },
          }))

          // Add or update rider marker on map
          setMapMarkers((prevMarkers) => {
            const exists = prevMarkers.some((m) => m.id === "rider")
            if (exists) {
              return prevMarkers.map((marker) => (marker.id === "rider" ? { ...marker, lat: newLocation.latitude, lng: newLocation.longitude } : marker))
            }
            return [
              ...prevMarkers,
              {
                id: "rider",
                lat: newLocation.latitude,
                lng: newLocation.longitude,
                title: "You",
                type: "current",
                icon: "👤",
              },
            ]
          })

          console.log("👤 Rider location updated")
        }
      }
    )

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("✅ Real-time subscription active")
        setIsSubscribed(true)
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error("❌ Real-time subscription failed:", status)
        setIsSubscribed(false)
      }
    })

    return () => {
      if (isMountedRef.current) {
        supabase.removeChannel(channel)
        console.log("🛑 Real-time subscription stopped")
      }
    }
  }

  // Fetch initial locations
  useEffect(() => {
    if (!isOpen || !ride.id) return

    const fetchInitialLocations = async () => {
      try {
        const response = await fetch(`/api/ride-location?rideId=${ride.id}`)
        const data = await response.json()

        if (isMountedRef.current) {
          if (data.driverLocation) {
            setLocations((prev) => ({
              ...prev,
              driver: {
                lat: data.driverLocation.latitude,
                lng: data.driverLocation.longitude,
                timestamp: data.driverLocation.timestamp,
                accuracy: data.driverLocation.accuracy,
                speed: data.driverLocation.speed,
                heading: data.driverLocation.heading,
              },
            }))

            // Add or update driver marker
            setMapMarkers((prev) => {
              const exists = prev.some((m) => m.id === "driver")
              const driverMarker = {
                id: "driver",
                lat: data.driverLocation.latitude,
                lng: data.driverLocation.longitude,
                title: "Driver",
                type: "driver",
                icon: "🚗",
              }
              if (exists) {
                return prev.map((m) => (m.id === "driver" ? { ...m, lat: driverMarker.lat, lng: driverMarker.lng } : m))
              }
              return [...prev, driverMarker]
            })
          }

          if (data.userLocation) {
            setLocations((prev) => ({
              ...prev,
              rider: {
                lat: data.userLocation.latitude,
                lng: data.userLocation.longitude,
                timestamp: data.userLocation.timestamp,
                accuracy: data.userLocation.accuracy,
                speed: data.userLocation.speed,
                heading: data.userLocation.heading,
              },
            }))
            // Add or update rider marker
            setMapMarkers((prev) => {
              const exists = prev.some((m) => m.id === "rider")
              const riderMarker = {
                id: "rider",
                lat: data.userLocation.latitude,
                lng: data.userLocation.longitude,
                title: "You",
                type: "current",
                icon: "👤",
              }
              if (exists) {
                return prev.map((m) => (m.id === "rider" ? { ...m, lat: riderMarker.lat, lng: riderMarker.lng } : m))
              }
              return [...prev, riderMarker]
            })
          }
        }
      } catch (error) {
        console.error("Failed to fetch initial locations:", error)
      }
    }

    isMountedRef.current = true
    fetchInitialLocations()
    const cleanup = subscribeToLocations()

    return () => {
      if (cleanup) cleanup()
    }
  }, [isOpen, ride.id])

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const driverName = ride.driver ? `${ride.driver.first_name} ${ride.driver.last_name}` : "Driver"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0" aria-describedby="ride-modal-description">
        {/* Map Header */}
        <div className="relative h-80 w-full">
          <CharterKeKeMap
            height="320px"
            center={[
              (pickupCoords.lat + destinationCoords.lat) / 2,
              (pickupCoords.lng + destinationCoords.lng) / 2,
            ]}
            zoom={13}
            markers={mapMarkers}
            showRoute={true}
            showGeolocation={false}
            className="w-full h-full"
          />

          {/* Connection Status Badge */}
          <div className="absolute top-4 right-4 z-20">
            <Badge className={`flex items-center gap-2 ${isSubscribed ? "bg-green-600" : "bg-red-600"}`}>
              {isSubscribed ? (
                <>
                  <Wifi className="h-3 w-3" /> SUBSCRIBED
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" /> DISCONNECTED
                </>
              )}
            </Badge>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-20 bg-background/90 hover:bg-background/100 rounded-full p-2 transition-all shadow-md"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle>Live Ride Tracking</DialogTitle>
          </DialogHeader>
          <p id="ride-modal-description" className="sr-only">
            Real-time tracking of your current ride with driver location, route details, and ride summary
          </p>

          {/* Driver Info */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Driver Information</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-muted-foreground">Driver:</span> {driverName}
              </p>
              {ride.driver?.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{ride.driver.phone_number}</span>
                </div>
              )}
              <p>
                <span className="text-muted-foreground">Status:</span>{" "}
                <Badge className="ml-2">{ride.status}</Badge>
              </p>
            </div>
          </Card>

          {/* Route Details */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Route Details</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium">{ride.pickup_zone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Destination</p>
                  <p className="font-medium">{ride.destination_zone}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Location Status */}
          <Card className="p-4 bg-muted/50">
            <h3 className="font-semibold mb-2">Real-Time Status</h3>
            <div className="space-y-2 text-sm">
              {locations.driver ? (
                <p className="text-green-600">
                  ✓ Driver location: {locations.driver.lat.toFixed(6)}, {locations.driver.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-muted-foreground">⏳ Waiting for driver location...</p>
              )}
              {locations.rider ? (
                <p className="text-blue-600">
                  ✓ Your location: {locations.rider.lat.toFixed(6)}, {locations.rider.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-muted-foreground">⏳ Waiting for your location...</p>
              )}
            </div>
          </Card>

          {/* Ride Summary */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Ride Summary</h3>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Distance</p>
                <p className="font-bold">{ride.distance_km.toFixed(1)} km</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fare</p>
                <p className="font-bold">₦{(ride.fare_amount || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Platform Fee</p>
                <p className="font-bold">₦{(ride.platform_fee || 0).toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
