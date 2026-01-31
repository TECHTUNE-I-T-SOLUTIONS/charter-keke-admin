"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import "leaflet/dist/leaflet.css"
import { toast } from "sonner"

// Dynamically import Leaflet only on client side
let L: any = null

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

export function LeafletMap({
  pickupLocation,
  dropoffLocation,
  onPickupSet,
  onDropoffSet,
  activeLocationPicker,
  setActiveLocationPicker,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const pickupMarkerRef = useRef<any>(null)
  const dropoffMarkerRef = useRef<any>(null)
  const lineRef = useRef<any>(null)

  // Custom marker icons (defined inside component to use L after it's loaded)
  const createPickupIcon = useCallback(() => {
    if (!L) return undefined
    return L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    })
  }, [])

  const createDropoffIcon = useCallback(() => {
    if (!L) return undefined
    return L.icon({
      iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    })
  }, [])

  const drawRoute = useCallback(() => {
    if (!L || !mapInstanceRef.current || !pickupMarkerRef.current || !dropoffMarkerRef.current) return

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

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapLoaded) return

    const initializeMap = async () => {
      try {
        // Dynamically import Leaflet only on client side
        if (!L) {
          L = (await import("leaflet")).default
        }

        if (mapInstanceRef.current) return

        // Fix for default marker icons
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        })

        const map = L.map(mapRef.current, {
          zoomControl: true,
          dragging: true,
        }).setView([6.5244, 3.3792], 13)

        // Using more reliable tile provider from easely-map.tsx
        L.tileLayer("https://tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
          minZoom: 10,
        }).addTo(map)

        mapInstanceRef.current = map

        // Handle resizing (fixes grey box issues)
        const resizeObserver = new ResizeObserver(() => {
          map.invalidateSize()
        })
        if (mapRef.current) resizeObserver.observe(mapRef.current)

        setMapLoaded(true)
        map.invalidateSize()

        // Cleanup
        return () => {
          resizeObserver.disconnect()
        }
      } catch (error) {
        console.error("Map initialization error:", error)
        toast.error("Failed to load map")
      }
    }

    initializeMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [mapLoaded])

  // Handle map clicks
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    const handleMapClick = async (e: any) => {
      if (activeLocationPicker) {
        const { lat, lng } = e.latlng

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
            { signal: controller.signal }
          )

          clearTimeout(timeoutId)

          const data = await response.json()
          const address = data.address?.road || data.address?.suburb || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`

          const location: Location = { lat, lng, address }

          if (activeLocationPicker === "pickup") {
            onPickupSet(location)
            toast.success("Pickup location set!")
          } else {
            onDropoffSet(location)
            toast.success("Dropoff location set!")
          }

          setActiveLocationPicker(null)
        } catch (error) {
          console.warn("Reverse geocoding failed, using coordinates:", error)
          const location: Location = { lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` }

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
    }

    mapInstanceRef.current.on("click", handleMapClick)

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.off("click", handleMapClick)
      }
    }
  }, [mapLoaded, activeLocationPicker, onPickupSet, onDropoffSet, setActiveLocationPicker])

  // Update pickup marker
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    if (!pickupLocation) {
      if (pickupMarkerRef.current) {
        mapInstanceRef.current.removeLayer(pickupMarkerRef.current)
        pickupMarkerRef.current = null
      }
      return
    }

    try {
      const map = mapInstanceRef.current
      if (pickupMarkerRef.current) {
        map.removeLayer(pickupMarkerRef.current)
      }

      const marker = L.marker([pickupLocation.lat, pickupLocation.lng], {
        icon: createPickupIcon(),
      })

      marker.bindPopup(`<div class="text-xs"><b>📍 Pickup Location</b><br/>${pickupLocation.address}</div>`)
      marker.addTo(map)
      pickupMarkerRef.current = marker

      // Auto-fit bounds if dropoff exists
      if (dropoffMarkerRef.current) {
        const dropoffLatLng = dropoffMarkerRef.current.getLatLng()
        map.fitBounds(L.latLngBounds([pickupLocation.lat, pickupLocation.lng], [dropoffLatLng.lat, dropoffLatLng.lng]), { padding: [50, 50] })
      } else {
        map.setView([pickupLocation.lat, pickupLocation.lng], 15)
      }

      drawRoute()
    } catch (error) {
      console.error("Error updating pickup marker:", error)
    }
  }, [pickupLocation, mapLoaded, createPickupIcon, drawRoute])

  // Update dropoff marker
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return

    if (!dropoffLocation) {
      if (dropoffMarkerRef.current) {
        mapInstanceRef.current.removeLayer(dropoffMarkerRef.current)
        dropoffMarkerRef.current = null
      }
      return
    }

    try {
      const map = mapInstanceRef.current
      if (dropoffMarkerRef.current) {
        map.removeLayer(dropoffMarkerRef.current)
      }

      const marker = L.marker([dropoffLocation.lat, dropoffLocation.lng], {
        icon: createDropoffIcon(),
      })

      marker.bindPopup(`<div class="text-xs"><b>🏁 Dropoff Location</b><br/>${dropoffLocation.address}</div>`)
      marker.addTo(map)
      dropoffMarkerRef.current = marker

      // Auto-fit bounds if pickup exists
      if (pickupMarkerRef.current) {
        const pickupLatLng = pickupMarkerRef.current.getLatLng()
        map.fitBounds(L.latLngBounds([pickupLatLng.lat, pickupLatLng.lng], [dropoffLocation.lat, dropoffLocation.lng]), { padding: [50, 50] })
      } else {
        map.setView([dropoffLocation.lat, dropoffLocation.lng], 15)
      }

      drawRoute()
    } catch (error) {
      console.error("Error updating dropoff marker:", error)
    }
  }, [dropoffLocation, mapLoaded, createDropoffIcon, drawRoute])

  return (
    <div className="relative w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
      <div
        ref={mapRef}
        className={`w-full h-full rounded-lg overflow-hidden border border-border/50 ${activeLocationPicker ? 'cursor-crosshair' : 'cursor-grab'}`}
      />
      {activeLocationPicker && (
        <div className="absolute inset-0 rounded-lg pointer-events-none flex items-center justify-center z-[1000]">
          <div className="bg-black/60 backdrop-blur text-white px-4 py-3 rounded-lg text-center animate-pulse">
            <div className="text-sm font-semibold">Click on the map to set {activeLocationPicker} location</div>
            <div className="text-xs mt-1 opacity-80">Press Escape or select another location to cancel</div>
          </div>
        </div>
      )}
    </div>
  )
}
