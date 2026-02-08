"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Clock, DollarSign, User, Car, Phone, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

const AdminRideMap = dynamic(() => import("./admin-ride-map"), { 
  ssr: false, 
  loading: () => <div className="h-full flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> 
})

interface RideDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ride: {
    id: string
    rider_first_name: string
    rider_last_name: string
    rider_email?: string
    rider_phone?: string
    driver_first_name: string
    driver_last_name: string
    driver_email?: string
    driver_phone?: string
    driver_phone_number?: string
    vehicle_type?: string
    plate_number?: string
    pickup_zone: string
    pickup_description?: string
    pickup_latitude?: number
    pickup_longitude?: number
    destination_zone: string
    destination_description?: string
    destination_latitude?: number
    destination_longitude?: number
    ride_type: string
    estimated_fare: number
    platform_fee: number
    driver_earnings?: number
    status: string
    created_at: string
    pickup_time?: string
    dropoff_time?: string
    duration_minutes?: number
    distance_km?: number
    rating?: number
    review?: string
  } | null
}

export function AdminRideDetailsModal({ open, onOpenChange, ride }: RideDetailsModalProps) {
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    setMapReady(true)
  }, [])

  if (!ride) return null

  const statusColor = {
    pending: "bg-gray-500/20 text-gray-500",
    dispatched: "bg-blue-500/20 text-blue-500",
    accepted: "bg-blue-500/20 text-blue-500",
    in_progress: "bg-amber-500/20 text-amber-500",
    ongoing: "bg-amber-500/20 text-amber-500",
    completed: "bg-emerald-500/20 text-emerald-500",
    cancelled: "bg-red-500/20 text-red-500",
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ride Details - {ride.id.slice(0, 8)}</DialogTitle>
          <DialogDescription>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor[ride.status as keyof typeof statusColor] || statusColor.pending}`}>
              {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Map Section */}
          <div className="space-y-4">
            <Card className="bg-card/50 backdrop-blur border-primary/10 overflow-hidden">
              <CardContent className="p-0 h-96">
                {mapReady ? (
                  <AdminRideMap ride={ride} />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            {/* Route Info */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Route Details</h3>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Pickup</p>
                      <p className="font-medium">{ride.pickup_zone}</p>
                      {ride.pickup_description && (
                        <p className="text-sm text-muted-foreground">{ride.pickup_description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Destination</p>
                      <p className="font-medium">{ride.destination_zone}</p>
                      {ride.destination_description && (
                        <p className="text-sm text-muted-foreground">{ride.destination_description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passenger Info */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" /> Passenger
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {ride.rider_first_name} {ride.rider_last_name}
                  </p>
                  {ride.rider_email && <p className="text-muted-foreground">{ride.rider_email}</p>}
                  {ride.rider_phone && (
                    <p className="text-muted-foreground">{ride.rider_phone}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Driver Info */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Car className="h-4 w-4" /> Driver
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">
                    {ride.driver_first_name} {ride.driver_last_name}
                  </p>
                  {ride.driver_email && <p className="text-muted-foreground">{ride.driver_email}</p>}
                  {(ride.driver_phone || ride.driver_phone_number) && (
                    <p className="text-muted-foreground">{ride.driver_phone || ride.driver_phone_number}</p>
                  )}
                  {ride.vehicle_type && (
                    <p className="text-muted-foreground">
                      {ride.vehicle_type} - {ride.plate_number}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Fare Info */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" /> Fare Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ride Fare:</span>
                    <span className="font-medium">₦{ride.estimated_fare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform Fee:</span>
                    <span className="font-medium">₦{ride.platform_fee.toLocaleString()}</span>
                  </div>
                  {ride.driver_earnings && (
                    <div className="flex justify-between border-t border-primary/10 pt-2">
                      <span className="text-muted-foreground">Driver Earnings:</span>
                      <span className="font-medium text-emerald-500">
                        ₦{ride.driver_earnings.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card className="bg-card/50 backdrop-blur border-primary/10">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Trip Details
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{ride.ride_type}</span>
                  </div>
                  {ride.distance_km && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance:</span>
                      <span className="font-medium">{ride.distance_km.toFixed(1)} km</span>
                    </div>
                  )}
                  {ride.duration_minutes && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{ride.duration_minutes} minutes</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booked:</span>
                    <span className="font-medium">{new Date(ride.created_at).toLocaleString()}</span>
                  </div>
                  {ride.pickup_time && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Picked Up:</span>
                      <span className="font-medium">{new Date(ride.pickup_time).toLocaleTimeString()}</span>
                    </div>
                  )}
                  {ride.dropoff_time && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dropped Off:</span>
                      <span className="font-medium">{new Date(ride.dropoff_time).toLocaleTimeString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rating & Review */}
            {ride.rating && (
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3">Rating & Review</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: ride.rating }).map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                      {Array.from({ length: 5 - ride.rating }).map((_, i) => (
                        <span key={i} className="opacity-30">
                          ⭐
                        </span>
                      ))}
                    </div>
                    {ride.review && <p className="text-sm text-muted-foreground italic">&quot;{ride.review}&quot;</p>}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
