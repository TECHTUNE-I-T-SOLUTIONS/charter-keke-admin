# Real-Time Location Tracking - Quick Start

## What Was Created

### 📊 Database Tables
1. **`driver_locations`** ✅ (Already created)
2. **`user_locations`** ✅ (SQL file provided: `sql/create_user_locations_table.sql`)

### 🔌 API Endpoints
1. **POST `/api/driver/update-location`** - Driver sends location
2. **POST `/api/user/update-location`** - User/Rider sends location
3. **GET `/api/driver/ride-location`** - Get current locations of both

### 🎨 Frontend Component
1. **`RideDetailsModal`** - Live tracking modal with real-time subscriptions

---

## Setup Instructions (5 Steps)

### Step 1: Create User Locations Table
1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste contents of `sql/create_user_locations_table.sql`
3. Click **Run**

### Step 2: Enable Real-Time on Both Tables
1. Go to **Supabase Dashboard** → **Database** → **Replication**
2. Find `public.driver_locations` and toggle **ON**
3. Find `public.user_locations` and toggle **ON**

### Step 3: Deploy the API Endpoints
Files already created:
- `/app/api/driver/update-location/route.ts`
- `/app/api/user/update-location/route.ts`
- `/app/api/driver/ride-location/route.ts` (updated)

These are ready to use!

### Step 4: Update Frontend App to Send Locations
Add to driver app (when ride is in_progress):
```typescript
// Every 10 seconds, send driver location
const interval = setInterval(async () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      await fetch('/api/driver/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId: currentRide.id,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed,
          heading: position.coords.heading,
        }),
      })
    })
  }
}, 10000) // Send every 10 seconds
```

Add to rider app (when ride is accepted):
```typescript
// Similar code for user/rider location updates
// Same interval, same structure
```

### Step 5: Test End-to-End
1. Driver opens an accepted ride
2. Clicks "View Full Details" button
3. Modal opens with live map
4. Driver location appears on map (after first location update)
5. Rider location appears on map (after first location update)
6. Both update in real-time as new locations are sent

---

## How Real-Time Works

### Architecture
```
Driver App
    ↓ (sends location every 10s)
POST /api/driver/update-location
    ↓ (inserts into driver_locations table)
Supabase PostgreSQL
    ↓ (broadcasts to subscribers)
Supabase Real-Time Service
    ↓ (sends to all subscribed clients)
Web Dashboard (Ride Details Modal)
    ↓ (updates map with new coordinates)
Driver sees live location of both
```

### WebSocket Connection
- Supabase real-time uses WebSocket
- Connection established when modal opens
- Connection closed when modal closes
- Automatic reconnection on network issues

---

## API Response Examples

### Driver Location Update
```bash
POST /api/driver/update-location
Content-Type: application/json

{
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "accuracy": 10.5,
  "speed": 12.3,
  "heading": 90.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Location updated successfully",
  "location": {
    "driver_id": "uuid",
    "ride_id": "uuid",
    "latitude": 6.5244,
    "longitude": 3.3792,
    "accuracy": 10.5,
    "speed": 12.3,
    "heading": 90.5,
    "timestamp": "2026-01-28T12:00:00.000Z"
  }
}
```

### Get Current Locations
```bash
GET /api/driver/ride-location?rideId=550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "locations": {
    "driver": {
      "lat": 6.5244,
      "lng": 3.3792,
      "timestamp": "2026-01-28T12:00:15.000Z",
      "accuracy": 10.5,
      "speed": 12.3,
      "heading": 90.5
    },
    "rider": {
      "lat": 6.6244,
      "lng": 3.4792,
      "timestamp": "2026-01-28T12:00:10.000Z",
      "accuracy": 8.2,
      "speed": 0,
      "heading": 0
    }
  },
  "status": "in_progress"
}
```

---

## Real-Time Subscription Flow

### In Ride Details Modal
1. Modal mounts → Calls `fetchInitialLocations()`
2. Fetches latest locations from database
3. Sets up 2 WebSocket subscriptions:
   - Listens to `driver_locations` table for changes
   - Listens to `user_locations` table for changes
4. Shows live indicator (🟢 = connected, 🔴 = disconnected)
5. Updates map in real-time as locations stream in
6. Unsubscribes when modal closes

---

## Features Included

✅ **Real-time Updates** - WebSocket-based, no polling
✅ **GPS Accuracy** - Shows confidence radius (±10m, etc.)
✅ **Speed Tracking** - Displays current speed in km/h
✅ **Heading/Direction** - Shows which way vehicle is heading
✅ **Connection Status** - Visual indicator of subscription status
✅ **Coordinates Display** - Shows exact lat/lng to 6 decimals
✅ **Timestamps** - Shows when each location was recorded
✅ **Route Display** - Shows pickup → destination path
✅ **Live Markers** - 🚗 Driver 👤 Rider 📍 Pickup 🎯 Destination
✅ **Mobile Ready** - Responsive design for all screen sizes

---

## Performance Optimizations

### Database Indexes
```sql
-- Already created in user_locations table:
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id)
CREATE INDEX idx_user_locations_ride_id ON user_locations(ride_id)
CREATE INDEX idx_user_locations_timestamp ON user_locations(timestamp DESC)
CREATE INDEX idx_user_locations_user_ride ON user_locations(user_id, ride_id)
```

### Location Update Frequency
- Driver: Every 10 seconds (balance between accuracy & battery)
- Rider: Every 10-15 seconds
- Don't update too frequently → kills battery, causes WebSocket spam
- Don't update too infrequently → map looks laggy

### Data Retention
Consider deleting old locations:
```sql
-- Delete locations older than 7 days
DELETE FROM driver_locations WHERE timestamp < NOW() - INTERVAL '7 days'
DELETE FROM user_locations WHERE timestamp < NOW() - INTERVAL '7 days'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Locations not updating | Check realtime is enabled in Supabase Dashboard |
| WebSocket disconnected | Check browser DevTools → Network → check WS connection |
| Location not appearing | Ensure driver/rider called update-location endpoint |
| Map shows old location | Hard refresh (Ctrl+Shift+R) to clear cache |
| Connection shows 🔴 | Check internet connection and NEXTAUTH_SECRET in env |

---

## Security Notes

✅ Users can only update their own location
✅ Drivers can only update their own location
✅ Can only update location for assigned rides
✅ Row Level Security (RLS) enforced on both tables
✅ All requests require authentication

---

## File Checklist

- ✅ `sql/create_user_locations_table.sql` - Table creation SQL
- ✅ `app/api/driver/update-location/route.ts` - Driver location endpoint
- ✅ `app/api/user/update-location/route.ts` - User location endpoint
- ✅ `app/api/driver/ride-location/route.ts` - Get locations endpoint (updated)
- ✅ `components/ride-details-modal.tsx` - Modal with real-time subscriptions
- ✅ `REALTIME_LOCATION_SETUP.md` - Comprehensive setup guide

All ready to go! 🚀
