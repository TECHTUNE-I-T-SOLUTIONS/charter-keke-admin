import { useEffect, useRef } from "react"

interface LocationTrackingOptions {
  rideId?: string
  enabled?: boolean
  interval?: number // milliseconds between updates, default 10000 (10 seconds)
}

export function useDriverLocationTracking({
  rideId,
  enabled = true,
  interval = 10000,
}: LocationTrackingOptions = {}) {
  const watchIdRef = useRef<number | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastLocationRef = useRef<{
    latitude: number
    longitude: number
    accuracy: number
    speed: number | null
    heading: number | null
  } | null>(null)

  useEffect(() => {
    // Don't start tracking if disabled or no ride ID
    if (!enabled || !rideId) {
      return
    }

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser")
      return
    }

    // Start watching position with high accuracy for real-time tracking
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        const speed = position.coords.speed || null
        const heading = position.coords.heading || null

        // Store the latest location
        lastLocationRef.current = {
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
        }

        console.log(`📍 Location updated: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`)
      },
      (error) => {
        // Handle geolocation errors gracefully
        const errorMessage = error?.message || "Unknown geolocation error"
        const errorCode = error?.code || "Unknown"
        
        // Only log timeout errors as info, not as errors
        if (error?.code === 3) {
          console.log(`📍 Geolocation timeout (${errorMessage}) - retrying...`)
        } else {
          console.error(`📍 Geolocation error (${errorCode}): ${errorMessage}`)
        }
        // Continue tracking even if there are permission issues
        // The user might grant permission later
      },
      {
        enableHighAccuracy: true, // Use GPS for more accurate location
        maximumAge: 0, // Don't use cached position
        timeout: 5000, // 5 second timeout
      }
    )

    // Set up interval to send location to server
    updateIntervalRef.current = setInterval(async () => {
      if (!lastLocationRef.current || !rideId) {
        return
      }

      const { latitude, longitude, accuracy, speed, heading } = lastLocationRef.current

      try {
        const response = await fetch("/api/driver/update-location", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rideId,
            latitude,
            longitude,
            accuracy,
            speed,
            heading,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Failed to update location:", errorData.error)
        } else {
          console.log("✅ Location sent to server")
        }
      } catch (error) {
        console.error("Error sending location:", error)
      }
    }, interval)

    // Cleanup function
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        console.log("🛑 Location tracking stopped")
      }

      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [enabled, rideId, interval])

  return {
    lastLocation: lastLocationRef.current,
  }
}
