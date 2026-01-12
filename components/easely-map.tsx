"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, Locate } from "lucide-react"

// Dynamically import Leaflet only on client side
let L: any = null
let mapInitialized = false

interface MapMarker {
  id: string
  lat: number
  lng: number
  title: string
  description?: string
  type: "pickup" | "destination" | "driver" | "current"
  color?: string
}

interface MapProps {
  height?: string
  center?: [number, number]
  zoom?: number
  markers?: MapMarker[]
  showRoute?: boolean
  onLocationChange?: (lat: number, lng: number) => void
  showGeolocation?: boolean
  className?: string
}

const MAP_COLORS = {
  pickup: "#3B82F6", // Blue
  destination: "#EF4444", // Red
  driver: "#10B981", // Green
  current: "#F59E0B", // Amber
}

const createCustomIcon = (color: string) => {
  if (!L) return undefined
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-13c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5z"/>
        </svg>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
    className: "custom-map-icon",
  })
}

export function CharterKeKeMap({
  height = "h-96",
  center = [6.5244, 3.3792], // Lagos, Nigeria
  zoom = 13,
  markers = [],
  showRoute = false,
  onLocationChange,
  showGeolocation = false,
  className = "",
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<{ [key: string]: L.Marker }>({})
  const polylineRef = useRef<L.Polyline | null>(null)
  const centeredOnUserRef = useRef(false) // Track if we've already centered on user location
  const [mapLoaded, setMapLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Initialize map - only once on mount
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet only on client side
        if (!L) {
          L = (await import("leaflet")).default
          await import("leaflet/dist/leaflet.css")
        }

        // Check if map is already initialized
        if (mapInstanceRef.current) {
          return
        }

        // Ensure DOM is ready
        if (!mapRef.current) {
          return
        }

        // Fix for default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        // Create map
        const map = L.map(mapRef.current).setView(center, zoom)

        // Add Stamen TonerLite tiles (detailed with roads, labels, etc.)
        L.tileLayer(
          "https://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png",
          {
            attribution:
              '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 18,
            minZoom: 1,
          }
        ).addTo(map)

        // Add scale control
        L.control.scale({ position: "bottomleft" }).addTo(map)

        mapInstanceRef.current = map
        setMapLoaded(true)
      } catch (err) {
        console.error("Failed to initialize map:", err)
        setError("Failed to load map")
      }
    }

    initializeMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Update map view when center or zoom changes (but don't override geolocation-based positioning)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    // Don't reset the map if geolocation is active and we've already centered on user
    // This prevents the map from jumping back to the default center
    if (showGeolocation && centeredOnUserRef.current) {
      return
    }

    try {
      mapInstanceRef.current.setView(center, zoom)
    } catch (err) {
      console.error("Failed to update map view:", err)
    }
  }, [center, zoom, mapLoaded, showGeolocation])

  // Add/update markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Remove markers that are not in the new markers array (except "current" which is managed by geolocation)
    Object.keys(markersRef.current).forEach((key) => {
      if (key !== "current" && !markers.some((m) => m.id === key)) {
        markersRef.current[key].remove()
        delete markersRef.current[key]
      }
    })

    // Add new markers (excluding "current" which is managed by geolocation)
    markers
      .filter((m) => m.id !== "current") // Don't add current location marker here
      .forEach((markerData) => {
        // Only add if not already present
        if (!markersRef.current[markerData.id]) {
          const color = markerData.color || MAP_COLORS[markerData.type]
          const marker = L.marker([markerData.lat, markerData.lng], {
            icon: createCustomIcon(color),
            title: markerData.title,
          })
            .addTo(map)
            .bindPopup(`<div class="font-semibold">${markerData.title}</div>
              ${markerData.description ? `<div class="text-sm text-gray-600">${markerData.description}</div>` : ""}`)

          markersRef.current[markerData.id] = marker
        } else {
          // Update existing marker position if it changed
          markersRef.current[markerData.id].setLatLng([markerData.lat, markerData.lng])
        }
      })

    // Draw route if enabled and multiple markers (excluding current location)
    const routeMarkers = markers.filter((m) => m.id !== "current")
    if (showRoute && routeMarkers.length > 1) {
      const latLngs = routeMarkers.map((m) => [m.lat, m.lng] as [number, number])

      // Remove old polyline
      if (polylineRef.current) {
        polylineRef.current.remove()
      }

      // Create new polyline
      polylineRef.current = L.polyline(latLngs, {
        color: "#3B82F6",
        weight: 3,
        opacity: 0.7,
        dashArray: "5, 5",
      }).addTo(map)

      // Fit bounds to show all markers
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [markers, mapLoaded, showRoute])

  // Geolocation
  useEffect(() => {
    if (!showGeolocation || !mapLoaded || !mapInstanceRef.current) return

    let mounted = true
    let watchId: number | null = null

    const success = (position: GeolocationPosition) => {
      if (!mounted) return

      const { latitude, longitude } = position.coords
      setUserLocation([latitude, longitude])

      // Ensure map is still available and fully initialized
      if (!mapInstanceRef.current || !L) {
        console.warn("Map not ready for geolocation update")
        return
      }

      try {
        // Check if map container is still valid
        const mapContainer = mapInstanceRef.current.getContainer()
        if (!mapContainer || !mapContainer.parentElement) {
          console.warn("Map container not available")
          return
        }

        // Check if marker already exists and just update its position
        if (markersRef.current["current"]) {
          // Marker exists, just update its position
          markersRef.current["current"].setLatLng([latitude, longitude])
        } else {
          // Add current location marker only once
          const icon = createCustomIcon(MAP_COLORS.current)
          if (!icon) {
            console.error("Failed to create custom icon")
            return
          }

          const marker = L.marker([latitude, longitude], {
            icon: icon,
            title: "Your Location",
          })
            .addTo(mapInstanceRef.current)
            .bindPopup("<div class='font-semibold'>Your Location</div>")

          markersRef.current["current"] = marker
        }

        // Only center map once on first successful location fetch
        if (!centeredOnUserRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 16)
          centeredOnUserRef.current = true
        }

        // Call callback
        if (onLocationChange) {
          onLocationChange(latitude, longitude)
        }
      } catch (err) {
        console.error("Error adding location marker:", err)
        if (mounted) {
          setError("Failed to add location marker to map")
        }
      }
    }

    const error = (err: GeolocationPositionError) => {
      if (!mounted) return
      console.error("Geolocation error:", err)
      
      let errorMsg = "Unable to retrieve your location."
      if (err.code === err.TIMEOUT) {
        errorMsg = "Location request timed out. Please try again."
      } else if (err.code === err.PERMISSION_DENIED) {
        errorMsg = "Please enable location permissions."
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        errorMsg = "Location unavailable. Please try again."
      }
      setError(errorMsg)
    }

    // Get initial position once
    navigator.geolocation.getCurrentPosition(success, error, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    })

    // Watch position for real-time updates (but don't re-center map)
    watchId = navigator.geolocation.watchPosition(success, error, {
      enableHighAccuracy: false, // Reduce resource usage
      maximumAge: 10000, // Cache position for 10 seconds
      timeout: 20000,
    }) as unknown as number

    return () => {
      mounted = false
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [showGeolocation, mapLoaded])

  const handleRecenterToUser = () => {
    if (userLocation && mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation[0], userLocation[1]], 16)
    } else if (mapInstanceRef.current) {
      // Try to get location if we don't have it
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([latitude, longitude], 16)
          }
        },
        () => {
          console.error("Could not get current location")
        }
      )
    }
  }

  return (
    <Card className={`overflow-hidden ${className} relative z-0`}>
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border-b border-red-200 p-3 text-red-700">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      <div className="relative">
        <div
          ref={mapRef}
          className={`${height} w-full bg-gray-100`}
          style={{ minHeight: "300px", zIndex: 0 }}
        />
        <Button
          onClick={handleRecenterToUser}
          size="sm"
          className="absolute bottom-4 right-4 z-10 bg-white text-foreground hover:bg-primary hover:text-white shadow-lg"
          title="Center map on your location"
        >
          <Locate className="h-4 w-4 mr-1" />
          My Location
        </Button>
      </div>
    </Card>
  )
}
