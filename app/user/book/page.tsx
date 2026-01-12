"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { useAuth } from "@/lib/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { AnimatedSidebar } from "@/components/animated-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import {
  MapPin,
  Navigation,
  Car,
  Loader2,
  ArrowRight,
  Search,
  Trash2,
  Route,
  Info,
} from "lucide-react"

// Base fare per kilometer
const BASE_FARE_PER_KM = 600

interface Location {
  lat: number
  lng: number
  address: string
}

interface SearchResult {
  address: string
  lat: number
  lng: number
}

// Lazy load Leaflet map component
const MapComponent = dynamic(
  () => import("@/components/leaflet-map").then((mod) => mod.LeafletMap),
  {
    loading: () => (
      <div className="bg-gray-100 rounded-lg flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    ),
    ssr: false,
  }
)

function BookRideContent() {
  const { user } = useAuth()
  const mapRef = useRef<HTMLDivElement>(null)

  const [pickupLocation, setPickupLocation] = useState<Location | null>(null)
  const [dropoffLocation, setDropoffLocation] = useState<Location | null>(null)
  const [pickupSearch, setPickupSearch] = useState("")
  const [dropoffSearch, setDropoffSearch] = useState("")
  const [estimatedDistance, setEstimatedDistance] = useState(0)
  const [estimatedFare, setEstimatedFare] = useState(0)
  const [activeLocationPicker, setActiveLocationPicker] = useState<"pickup" | "dropoff" | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isBooking, setIsBooking] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Update fare when locations change
  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const distance = calculateDistance(
        pickupLocation.lat,
        pickupLocation.lng,
        dropoffLocation.lat,
        dropoffLocation.lng
      )
      setEstimatedDistance(parseFloat(distance.toFixed(2)))
      setEstimatedFare(Math.round(distance * BASE_FARE_PER_KM))
    }
  }, [pickupLocation, dropoffLocation])

  // Search locations
  const handleSearch = async (query: string, type: "pickup" | "dropoff") => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&bounded=1&viewbox=2.9,6.9,3.6,6.1`
      )
      const data = await response.json()

      const results = data.slice(0, 5).map((item: any) => ({
        address: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      }))

      setSearchResults(results)
      setShowSearchResults(true)
    } catch (error) {
      console.error("Search error:", error)
    }
  }

  // Select from search result
  const selectSearchResult = (result: SearchResult, type: "pickup" | "dropoff") => {
    if (type === "pickup") {
      setPickupLocation(result)
      setPickupSearch("")
    } else {
      setDropoffLocation(result)
      setDropoffSearch("")
    }
    setSearchResults([])
    setShowSearchResults(false)
    toast.success("Location selected!")
  }

  // Book ride
  const handleBookRide = async () => {
    if (!pickupLocation || !dropoffLocation) {
      toast.error("Please select both pickup and dropoff locations")
      return
    }

    setIsBooking(true)

    try {
      const response = await fetch("/api/user/book-ride", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickup_location: pickupLocation,
          dropoff_location: dropoffLocation,
          estimated_distance: estimatedDistance,
          number_of_seats: 1, // Always 1 for charter
          pickup_time: new Date().toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to book ride")
      }

      toast.success("Ride booked successfully! Finding drivers...")
      // Reset form
      setPickupLocation(null)
      setDropoffLocation(null)
      setEstimatedFare(0)
      setEstimatedDistance(0)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to book ride")
    } finally {
      setIsBooking(false)
    }
  }


  return (
    <div className="flex min-h-screen bg-background">
      <AnimatedSidebar />

      <main className="flex-1 lg:pl-0 pt-16 lg:pt-0 pb-24 lg:pb-0">
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Image src="/charter keke.png" alt="Charter Keke" width={24} height={24} />
              <span className="text-sm text-primary font-medium">Charter Keke Rider</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-foreground">Book a Ride</h1>
            <p className="text-muted-foreground mt-1">Select pickup & dropoff on the map below</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 md:gap-6">
            {/* Sidebar - Location Selection */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-1"
            >
            <Card className="bg-card/50 backdrop-blur border-primary/10 overflow-visible">
                <CardHeader>
                  <CardTitle className="text-lg">Trip Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 relative z-10">
                  {/* Pickup Location */}
                  <div className="space-y-2 relative">
                    <Label className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span>Pickup</span>
                    </Label>
                    <div className="space-y-2 relative z-20">
                      <Input
                        placeholder="Search location..."
                        value={pickupSearch}
                        onChange={(e) => {
                          setPickupSearch(e.target.value)
                          handleSearch(e.target.value, "pickup")
                        }}
                        onFocus={() => setShowSearchResults(true)}
                        className="bg-background/50 h-9"
                      />
                      {pickupLocation && (
                        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                          <p className="font-medium text-green-700 dark:text-green-400 truncate">
                            {pickupLocation.address}
                          </p>
                          <Button
                            onClick={() => {
                              setPickupLocation(null)
                              if (pickupMarkerRef.current && mapInstanceRef.current) {
                                mapInstanceRef.current.removeLayer(pickupMarkerRef.current)
                                pickupMarkerRef.current = null
                              }
                              drawRoute()
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 mt-1 w-full text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        </div>
                      )}
                      {!pickupLocation && (
                        <Button
                          onClick={() => setActiveLocationPicker("pickup")}
                          variant={activeLocationPicker === "pickup" ? "default" : "outline"}
                          className="w-full h-9 text-sm"
                        >
                          {activeLocationPicker === "pickup" ? "Click map..." : "Pick on map"}
                        </Button>
                      )}
                      {/* Pickup Search Results Dropdown */}
                      {showSearchResults && searchResults.length > 0 && pickupSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto">
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSearchResult(result, "pickup")}
                              className="w-full p-3 text-left hover:bg-primary/10 border-b border-border/50 last:border-b-0 transition-colors text-sm"
                            >
                              <p className="font-medium truncate">{result.address}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Dropoff Location */}
                  <div className="space-y-2 relative z-20">
                    <Label className="flex items-center gap-2 text-sm">
                      <Navigation className="h-4 w-4 text-red-500" />
                      <span>Dropoff</span>
                    </Label>
                    <div className="space-y-2 relative z-20">
                      <Input
                        placeholder="Search location..."
                        value={dropoffSearch}
                        onChange={(e) => {
                          setDropoffSearch(e.target.value)
                          handleSearch(e.target.value, "dropoff")
                        }}
                        onFocus={() => setShowSearchResults(true)}
                        className="bg-background/50 h-9"
                      />
                      {dropoffLocation && (
                        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                          <p className="font-medium text-red-700 dark:text-red-400 truncate">
                            {dropoffLocation.address}
                          </p>
                          <Button
                            onClick={() => {
                              setDropoffLocation(null)
                              if (dropoffMarkerRef.current && mapInstanceRef.current) {
                                mapInstanceRef.current.removeLayer(dropoffMarkerRef.current)
                                dropoffMarkerRef.current = null
                              }
                              drawRoute()
                            }}
                            variant="ghost"
                            size="sm"
                            className="h-6 mt-1 w-full text-xs"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear
                          </Button>
                        </div>
                      )}
                      {!dropoffLocation && (
                        <Button
                          onClick={() => setActiveLocationPicker("dropoff")}
                          variant={activeLocationPicker === "dropoff" ? "default" : "outline"}
                          className="w-full h-9 text-sm"
                        >
                          {activeLocationPicker === "dropoff" ? "Click map..." : "Pick on map"}
                        </Button>
                      )}
                      {/* Dropoff Search Results Dropdown */}
                      {showSearchResults && searchResults.length > 0 && dropoffSearch && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-[9999] max-h-48 overflow-y-auto">
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSearchResult(result, "dropoff")}
                              className="w-full p-3 text-left hover:bg-primary/10 border-b border-border/50 last:border-b-0 transition-colors text-sm"
                            >
                              <p className="font-medium truncate">{result.address}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border" />

                  {/* Fare Estimate */}
                  {pickupLocation && dropoffLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-3 p-3 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Distance</span>
                        <span className="font-semibold">{estimatedDistance.toFixed(2)} km</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Rate/km</span>
                        <span className="font-semibold">₦{BASE_FARE_PER_KM}</span>
                      </div>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between">
                        <span className="text-muted-foreground font-medium">Total Fare</span>
                        <span className="text-2xl font-bold text-primary">₦{estimatedFare.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Pay directly to driver after ride</p>
                    </motion.div>
                  )}

                  {/* Book Button */}
                  <Button
                    onClick={handleBookRide}
                    disabled={isBooking || !pickupLocation || !dropoffLocation}
                    className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 py-6 h-11 text-base font-semibold"
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Booking...
                      </>
                    ) : (
                      <>
                        <Car className="h-5 w-5 mr-2" />
                        Book Ride
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Map Section */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-3"
            >
              <Card className="bg-card/50 backdrop-blur border-primary/10">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <Route className="h-5 w-5" />
                        Interactive Map
                      </CardTitle>
                      <CardDescription className="mt-1 text-xs md:text-sm">
                        {activeLocationPicker
                          ? `Click on the map to set your ${activeLocationPicker} location`
                          : "Click the buttons on the left to set pickup & dropoff locations"}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 pb-4 relative">
                  <MapComponent
                    pickupLocation={pickupLocation}
                    dropoffLocation={dropoffLocation}
                    onPickupSet={setPickupLocation}
                    onDropoffSet={setDropoffLocation}
                    activeLocationPicker={activeLocationPicker}
                    setActiveLocationPicker={setActiveLocationPicker}
                  />

                  {/* Instructions */}
                  {!pickupLocation && !dropoffLocation && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 md:p-4 max-w-xs text-center">
                        <Info className="h-8 w-8 mx-auto mb-2 text-primary" />
                        <p className="text-sm font-medium mb-1">Get Started</p>
                        <p className="text-xs text-muted-foreground">Use the location selector on the left to pick your journey on the map</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function BookRidePage() {
  return (
    <ProtectedRoute allowedRoles={["user"]}>
      <BookRideContent />
    </ProtectedRoute>
  )
}
