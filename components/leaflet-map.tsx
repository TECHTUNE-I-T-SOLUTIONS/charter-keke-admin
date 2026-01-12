"use client"

import { useEffect, useRef, useCallback } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { toast } from "sonner"

interface Location {
  lat: number
  lng: number
  address: string
}

interface LeafletMapProps {
  pickupLocation: Location | null
  dropoffLocation: Location | null
  onPickupSet: (location: Location) => void
  onDropoffSet: (location: Location) => void
  activeLocationPicker: "pickup" | "dropoff" | null
  setActiveLocationPicker: (type: "pickup" | "dropoff" | null) => void
}

// Custom marker icons
const createPickupIcon = () =>
  L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

const createDropoffIcon = () =>
  L.icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

export function LeafletMap({
  pickupLocation,
  dropoffLocation,
  onPickupSet,
  onDropoffSet,
  activeLocationPicker,
  setActiveLocationPicker,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const mapReadyRef = useRef(false)
  const pickupMarkerRef = useRef<L.Marker | null>(null)
  const dropoffMarkerRef = useRef<L.Marker | null>(null)
  const lineRef = useRef<L.Polyline | null>(null)

  // Initialize map ONLY ONCE
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Add a small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      try {
        if (!mapRef.current) return

        const map = L.map(mapRef.current, {
          zoomControl: true,
          dragging: true,
        }).setView([6.5244, 3.3792], 13)

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
          minZoom: 10,
        }).addTo(map)

        mapInstanceRef.current = map
        mapReadyRef.current = true
      } catch (error) {
        console.error("Map initialization error:", error)
        toast.error("Failed to load map")
      }
    }, 100)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  // Handle map clicks separately
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const handleMapClick = (e: any) => {
      if (activeLocationPicker) {
        const { lat, lng } = e.latlng
        const location: Location = {
          lat,
          lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        }

        if (activeLocationPicker === "pickup") {
          onPickupSet(location)
          toast.success("Pickup location set!")
        } else {
          onDropoffSet(location)
          toast.success("Dropoff location set!")
        }

        setActiveLocationPicker(null)
      }
    }

    mapInstanceRef.current.on("click", handleMapClick)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("click", handleMapClick)
      }
    }
  }, [activeLocationPicker, onPickupSet, onDropoffSet, setActiveLocationPicker])

  // Update pickup marker
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (!pickupLocation) {
      if (pickupMarkerRef.current) {
        try {
          mapInstanceRef.current.removeLayer(pickupMarkerRef.current)
        } catch (e) {
          // Layer might already be removed
        }
        pickupMarkerRef.current = null
      }
      return
    }

    try {
      const map = mapInstanceRef.current
      
      // Remove old marker if exists
      if (pickupMarkerRef.current) {
        try {
          map.removeLayer(pickupMarkerRef.current)
        } catch (e) {
          // Already removed
        }
      }
      
      // Create new marker
      const marker = L.marker([pickupLocation.lat, pickupLocation.lng], {
        icon: createPickupIcon(),
      })
      
      marker.bindPopup("<b>Pickup Location</b>")
      marker.addTo(map)
      pickupMarkerRef.current = marker

      // Auto-fit map bounds
      if (dropoffMarkerRef.current) {
        try {
          const dropoffLatLng = dropoffMarkerRef.current.getLatLng()
          map.fitBounds(
            L.latLngBounds(
              [pickupLocation.lat, pickupLocation.lng],
              [dropoffLatLng.lat, dropoffLatLng.lng]
            ),
            { padding: [50, 50] }
          )
        } catch (e) {
          map.setView([pickupLocation.lat, pickupLocation.lng], 15)
        }
      } else {
        map.setView([pickupLocation.lat, pickupLocation.lng], 15)
      }

      drawRoute()
    } catch (error) {
      console.error("Error updating pickup marker:", error)
    }
  }, [pickupLocation])

  // Update dropoff marker
  useEffect(() => {
    if (!mapInstanceRef.current) return

    if (!dropoffLocation) {
      if (dropoffMarkerRef.current) {
        try {
          mapInstanceRef.current.removeLayer(dropoffMarkerRef.current)
        } catch (e) {
          // Layer might already be removed
        }
        dropoffMarkerRef.current = null
      }
      return
    }

    try {
      const map = mapInstanceRef.current
      
      // Remove old marker if exists
      if (dropoffMarkerRef.current) {
        try {
          map.removeLayer(dropoffMarkerRef.current)
        } catch (e) {
          // Already removed
        }
      }
      
      // Create new marker
      const marker = L.marker([dropoffLocation.lat, dropoffLocation.lng], {
        icon: createDropoffIcon(),
      })
      
      marker.bindPopup("<b>Dropoff Location</b>")
      marker.addTo(map)
      dropoffMarkerRef.current = marker

      // Auto-fit map bounds
      if (pickupMarkerRef.current) {
        try {
          const pickupLatLng = pickupMarkerRef.current.getLatLng()
          map.fitBounds(
            L.latLngBounds(
              [pickupLatLng.lat, pickupLatLng.lng],
              [dropoffLocation.lat, dropoffLocation.lng]
            ),
            { padding: [50, 50] }
          )
        } catch (e) {
          map.setView([dropoffLocation.lat, dropoffLocation.lng], 15)
        }
      } else {
        map.setView([dropoffLocation.lat, dropoffLocation.lng], 15)
      }

      drawRoute()
    } catch (error) {
      console.error("Error updating dropoff marker:", error)
    }
  }, [dropoffLocation])

  const drawRoute = useCallback(() => {
    if (!mapInstanceRef.current || !pickupMarkerRef.current || !dropoffMarkerRef.current) return

    try {
      if (lineRef.current) {
        mapInstanceRef.current.removeLayer(lineRef.current)
        lineRef.current = null
      }

      const pickupLatLng = pickupMarkerRef.current.getLatLng()
      const dropoffLatLng = dropoffMarkerRef.current.getLatLng()

      lineRef.current = L.polyline([pickupLatLng, dropoffLatLng], {
        color: "rgb(59, 130, 246)",
        weight: 3,
        opacity: 0.7,
        dashArray: "5, 5",
      }).addTo(mapInstanceRef.current)
    } catch (error) {
      console.error("Error drawing route:", error)
    }
  }, [])

  return (
    <div className="relative w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-[600px]">
      <div
        ref={mapRef}
        className="w-full h-full rounded-lg overflow-hidden border border-border/50"
        style={{ cursor: activeLocationPicker ? "crosshair" : "grab" }}
      />
    </div>
  )
}
