"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

interface AdminRideMapProps {
  ride: {
    pickup_zone: string
    pickup_latitude?: number
    pickup_longitude?: number
    destination_zone: string
    destination_latitude?: number
    destination_longitude?: number
  }
}

// Default coordinates for fallback (Lagos center)
const DEFAULT_LAT = 6.5244
const DEFAULT_LNG = 3.3792

export default function AdminRideMap({ ride }: AdminRideMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    // Import CSS dynamically to avoid build issues
    import("leaflet/dist/leaflet.css")

    // Initialize map
    map.current = L.map(mapContainer.current).setView(
      [ride.pickup_latitude || DEFAULT_LAT, ride.pickup_longitude || DEFAULT_LNG],
      13
    )

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.current)

    // Add pickup marker
    if (ride.pickup_latitude && ride.pickup_longitude) {
      L.circleMarker([ride.pickup_latitude, ride.pickup_longitude], {
        radius: 8,
        fillColor: "#10b981",
        color: "#059669",
        weight: 2,
        fillOpacity: 0.8,
      })
        .addTo(map.current)
        .bindPopup(`<div class="text-sm"><strong>Pickup:</strong> ${ride.pickup_zone}</div>`)
        .openPopup()
    }

    // Add destination marker
    if (ride.destination_latitude && ride.destination_longitude) {
      L.circleMarker([ride.destination_latitude, ride.destination_longitude], {
        radius: 8,
        fillColor: "#ef4444",
        color: "#dc2626",
        weight: 2,
        fillOpacity: 0.8,
      })
        .addTo(map.current)
        .bindPopup(`<div class="text-sm"><strong>Destination:</strong> ${ride.destination_zone}</div>`)
    }

    // Draw route line if both points exist
    if (
      ride.pickup_latitude &&
      ride.pickup_longitude &&
      ride.destination_latitude &&
      ride.destination_longitude
    ) {
      const route = L.polyline(
        [
          [ride.pickup_latitude, ride.pickup_longitude],
          [ride.destination_latitude, ride.destination_longitude],
        ],
        {
          color: "#3b82f6",
          weight: 3,
          opacity: 0.7,
          dashArray: "5, 5",
        }
      ).addTo(map.current)

      // Fit bounds to show both markers
      map.current.fitBounds(route.getBounds(), { padding: [50, 50] })
    }

    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [ride])

  return <div ref={mapContainer} className="w-full h-full" />
}
