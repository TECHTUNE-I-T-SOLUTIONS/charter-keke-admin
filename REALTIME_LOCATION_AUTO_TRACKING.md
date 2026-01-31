# Driver & Rider Real-Time Location Tracking - Automatic Setup

## Overview

The system now automatically tracks driver and rider locations in real-time as soon as they:
1. Are logged in
2. Have an active ride (status: "accepted" or "in_progress")
3. Are on the driver/rider rides page

Locations are updated every 10 seconds automatically and stored in the database.

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│ Browser (Driver/Rider)                                  │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Driver/Rider Rides Page (page.tsx)                  │ │
│ │                                                     │ │
│ │ useDriverLocationTracking({                         │ │
│ │   rideId,        // Auto-detected active ride       │ │
│ │   enabled: true, // Only when logged in             │ │
│ │   interval: 10000                                   │ │
│ │ })                                                  │ │
│ └─────────────────────────────────────────────────────┘ │
│              ↓                                          │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ useDriverLocationTracking Hook                      │ │
│ │                                                     │ │
│ │ 1. Calls navigator.geolocation.watchPosition()     │ │
│ │    - Gets lat/lng with high accuracy               │ │
│ │    - Stores speed & heading                        │ │
│ │                                                     │ │
│ │ 2. Every 10 seconds:                               │ │
│ │    - Send POST to /api/driver/update-location      │ │
│ │    - Includes: rideId, lat, lng, accuracy,         │ │
│ │                speed, heading                      │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ API Endpoints                                           │
├─────────────────────────────────────────────────────────┤
│ POST /api/driver/update-location                        │
│ POST /api/user/update-location                          │
│                                                         │
│ - Validate driver/user authorization                   │
│ - Insert location into driver_locations/user_locations │
│ - Include: accuracy, speed, heading, timestamp         │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Supabase Database                                       │
├─────────────────────────────────────────────────────────┤
│ driver_locations table                                  │
│ ├─ id (UUID)                                           │
│ ├─ driver_id (FK)                                      │
│ ├─ ride_id (FK)                                        │
│ ├─ latitude (numeric)                                  │
│ ├─ longitude (numeric)                                 │
│ ├─ accuracy (numeric)                                  │
│ ├─ speed (numeric)                                     │
│ ├─ heading (numeric)                                   │
│ └─ timestamp (auto)                                    │
│                                                         │
│ user_locations table (same schema)                      │
│                                                         │
│ Indexes:                                                │
│ ├─ ride_id (for quick queries)                         │
│ ├─ timestamp (for ordered results)                     │
│ └─ (driver_id, ride_id) composite                      │
│                                                         │
│ RLS Policies:                                           │
│ ├─ Users can only SELECT/INSERT their own locations   │
│ ├─ Drivers can only SELECT/INSERT their own locations │
│ └─ System can query for ride tracking                  │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ Real-Time Display                                       │
├─────────────────────────────────────────────────────────┤
│ Ride Details Modal                                      │
│                                                         │
│ Subscribes to postgres_changes:                         │
│ ├─ driver_locations table                              │
│ ├─ user_locations table                                │
│ └─ Updates map markers instantly                       │
│                                                         │
│ Displays:                                               │
│ ├─ 🚗 Driver location                                  │
│ ├─ 👤 Rider location                                   │
│ ├─ 📍 Pickup point                                     │
│ ├─ 🎯 Destination point                                │
│ └─ Live map with routes                                │
└─────────────────────────────────────────────────────────┘
```

## Files Modified/Created

### 1. **hooks/use-driver-location-tracking.ts** (NEW)
Automatic location tracking for drivers.

**Features:**
- Watches driver's GPS position continuously
- Sends location every 10 seconds
- Stores: latitude, longitude, accuracy, speed, heading
- Stops when ride ends or driver logs out
- Includes error handling and cleanup

**Usage:**
```tsx
const { lastLocation } = useDriverLocationTracking({
  rideId: activeRideId,
  enabled: !!activeRideId && !!session?.user,
  interval: 10000, // 10 seconds
})
```

### 2. **hooks/use-user-location-tracking.ts** (NEW)
Automatic location tracking for riders/users.

**Features:**
- Same as driver tracking
- Sends to `/api/user/update-location`
- Stores in `user_locations` table

### 3. **app/driver/rides/page.tsx** (MODIFIED)
Added automatic location tracking to driver's active rides page.

**Changes:**
```tsx
// Auto-detect active ride
const activeRideId = rides.find(r => r.status === "accepted" || r.status === "in_progress")?.id

// Start tracking
useDriverLocationTracking({
  rideId: activeRideId,
  enabled: !!activeRideId && !!session?.user,
  interval: 10000,
})
```

**Behavior:**
- Starts tracking when driver accepts first ride
- Continues tracking through in_progress status
- Stops when ride completes or driver leaves page
- Automatically resumes with next active ride

### 4. **app/user/rides/page.tsx** (MODIFIED)
Added automatic location tracking to rider's active rides page.

**Changes:**
Same as driver page but for user_locations table.

### 5. **lib/supabase.ts** (MODIFIED)
Fixed service role key initialization.

**Previous Issue:**
```tsx
// Would fail if SUPABASE_SERVICE_ROLE_KEY is empty
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
```

**Fixed:**
```tsx
// Now safely creates null if key is missing
export const supabaseAdmin = supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null
```

## API Endpoints

### POST /api/driver/update-location
Driver sends their location during active ride.

**Request:**
```json
{
  "rideId": "ride-uuid",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "accuracy": 15.5,
  "speed": 42.3,
  "heading": 180
}
```

**Response:**
```json
{
  "success": true,
  "location": {
    "id": "location-uuid",
    "driver_id": "driver-uuid",
    "ride_id": "ride-uuid",
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 15.5,
    "speed": 42.3,
    "heading": 180,
    "timestamp": "2024-01-28T12:00:00Z"
  }
}
```

### POST /api/user/update-location
Same structure as driver endpoint, stores in user_locations table.

## Real-Time Features

### Ride Details Modal
When driver opens a ride's "View Full Details" button:

1. **Subscriptions Established:**
   ```tsx
   channel.on('postgres_changes', {
     event: '*', // All events (INSERT, UPDATE, DELETE)
     schema: 'public',
     table: 'driver_locations',
     filter: `ride_id=eq.${ride.id}`
   }, updateCallback)
   
   channel.on('postgres_changes', {
     event: '*',
     schema: 'public',
     table: 'user_locations',
     filter: `ride_id=eq.${ride.id}`
   }, updateCallback)
   ```

2. **Map Updates:**
   - Receives location updates via WebSocket
   - Updates map markers instantly
   - Shows driver and rider positions live
   - Displays pickup and destination points

3. **Status Indicator:**
   - 🟢 SUBSCRIBED: Live tracking active
   - 🔴 DISCONNECTED: Connection lost

## Browser Permissions Required

When location tracking starts, users will see:

> **Location Permission**
> 
> This app would like to access your precise location.
> 
> [Allow] [Block]

**For Optimal Experience:**
- Click "Allow" to enable GPS tracking
- Some browsers require HTTPS in production
- Localhost HTTP is fine for development

## Console Logging

Monitor location tracking in browser console:

```
📍 Location updated: 6.524400, 3.379200
✅ Location sent to server
📍 Rider location updated: 6.524401, 3.379201
✅ Rider location sent to server
🛑 Location tracking stopped
```

## Database Storage

### driver_locations Table
```sql
SELECT * FROM driver_locations 
WHERE ride_id = '...' 
ORDER BY timestamp DESC 
LIMIT 10;
```

**Sample Output:**
```
id                  | driver_id | ride_id | latitude  | longitude | accuracy | speed | heading | timestamp
uuid1               | driver1   | ride1   | 6.52440   | 3.37920   | 15.5     | 42.3  | 180     | 2024-01-28 12:00:00
uuid2               | driver1   | ride1   | 6.52441   | 3.37921   | 16.2     | 41.5  | 181     | 2024-01-28 12:00:10
uuid3               | driver1   | ride1   | 6.52442   | 3.37922   | 15.8     | 40.2  | 182     | 2024-01-28 12:00:20
```

### user_locations Table
Same structure, tracks rider locations during rides.

## Troubleshooting

### Location Not Updating

1. **Check Browser Console:**
   - Look for error messages
   - Check if "Location updated" logs appear

2. **Verify Permissions:**
   - Go to browser settings
   - Check if location access is allowed for localhost:3000
   - Reset permissions if needed

3. **Check Network Tab:**
   - Open DevTools → Network tab
   - Look for POST requests to `/api/driver/update-location`
   - Verify responses are successful (200 status)

4. **Verify Active Ride:**
   - Driver must have ride with status: "accepted" or "in_progress"
   - Check rides page shows active rides
   - Verify ride appears in database: 
     ```sql
     SELECT id, status FROM rides 
     WHERE driver_id = '...' 
     ORDER BY created_at DESC;
     ```

### Geolocation Disabled in Browser

Some browsers require HTTPS or have privacy restrictions:

**Firefox:**
- Settings → Privacy & Security → Permissions → Location
- Add exception for localhost

**Chrome:**
- Settings → Privacy and security → Site settings → Location
- Add localhost:3000 as allowed

### No Updates in Real-Time Modal

1. Verify subscriptions are connected:
   - Check console for "SUBSCRIBED" indicator
   - Should show 🟢 green connection status

2. Check database directly:
   ```sql
   SELECT * FROM driver_locations 
   WHERE ride_id = '...' 
   ORDER BY timestamp DESC LIMIT 1;
   ```

3. Verify real-time is enabled on Supabase:
   - Supabase Dashboard → Replication
   - Enable for `driver_locations` and `user_locations`

## Performance Considerations

### Battery Usage
- High accuracy GPS uses more battery
- 10-second interval is reasonable for active rides
- Tracking stops when ride completes or page closes

### Network Usage
- ~100 bytes per location update
- 10-second interval = 6 updates/minute = ~36 KB/hour per driver
- Should be minimal impact

### Server Load
- Locations are just inserts, no complex queries
- Database has proper indexes for quick writes
- Real-time subscriptions are lightweight

## Next Steps for Mobile Apps

When integrating with React Native (Expo) apps:

```typescript
// Expo/React Native version
import * as Location from 'expo-location'

export function useDriverLocationTracking({
  rideId,
  enabled = true,
  interval = 10000,
}: LocationTrackingOptions) {
  const subscriptionRef = useRef<Subscription | null>(null)

  useEffect(() => {
    if (!enabled || !rideId) return

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') return

      subscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 0,
          timeInterval: interval,
        },
        async (location) => {
          // Send to server (same API endpoint)
          await fetch('/api/driver/update-location', {
            method: 'POST',
            body: JSON.stringify({
              rideId,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: location.coords.accuracy,
              speed: location.coords.speed,
              heading: location.coords.heading,
            }),
          })
        }
      )
    }

    startTracking()

    return () => subscriptionRef.current?.remove()
  }, [enabled, rideId, interval])
}
```

## Summary

✅ **Fully Automatic**: No manual setup needed
✅ **Real-Time**: Updates every 10 seconds
✅ **Database Stored**: All locations persisted for history
✅ **Live Display**: Modal shows live locations instantly
✅ **Clean Cleanup**: Stops when ride ends or user logs out
✅ **Production Ready**: Proper error handling and permissions

Drivers and riders can now be tracked in real-time automatically! 🎉
