# Real-Time Location Setup Guide

## Overview
This guide explains how to set up real-time location tracking for both drivers and riders in the Easely app using Supabase.

## Tables Created

### 1. `driver_locations` (Already Created)
Stores real-time location data for drivers during rides.

**Structure:**
- `id` - UUID primary key
- `driver_id` - Foreign key to drivers table
- `latitude` - Driver's current latitude
- `longitude` - Driver's current longitude
- `timestamp` - When the location was recorded
- `ride_id` - Foreign key to rides table (which ride is this for)

### 2. `user_locations` (New - Run the SQL file)
Stores real-time location data for riders/users during rides.

**Structure:**
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `latitude` - User's current latitude
- `longitude` - User's current longitude
- `timestamp` - When the location was recorded
- `ride_id` - Foreign key to rides table (which ride is this for)
- `accuracy` - GPS accuracy in meters (optional)
- `speed` - Current speed in m/s (optional)
- `heading` - Direction in degrees (optional)

## Setup Steps

### Step 1: Create User Locations Table
Run the SQL file: `sql/create_user_locations_table.sql` in Supabase SQL Editor

```sql
-- Run the entire contents of create_user_locations_table.sql
```

### Step 2: Enable Real-Time in Supabase Dashboard

For **both tables** (`driver_locations` and `user_locations`):

1. Go to your Supabase Dashboard
2. Navigate to: **Database** → **Replication**
3. Find both tables:
   - `public.driver_locations`
   - `public.user_locations`
4. Toggle the switch **ON** for each table
5. This enables real-time subscriptions

**Alternative: Using Supabase CLI**
```bash
supabase realtime add --schema public --table driver_locations
supabase realtime add --schema public --table user_locations
```

### Step 3: Update Location API Endpoints

The app will need these endpoints to work:

#### For Drivers to Send Their Location
**POST** `/api/driver/update-location`
```json
{
  "rideId": "ride-uuid",
  "latitude": 6.5244,
  "longitude": 3.3792,
  "accuracy": 10,
  "speed": 45,
  "heading": 90
}
```

#### For Users to Send Their Location
**POST** `/api/user/update-location`
```json
{
  "rideId": "ride-uuid",
  "latitude": 6.6244,
  "longitude": 3.4792,
  "accuracy": 10,
  "speed": 0,
  "heading": 0
}
```

#### For Getting Live Locations
**GET** `/api/driver/ride-location?rideId={rideId}`
- Returns both driver and user current locations
- Auto-updates via real-time subscription

## Real-Time Subscription Flow

### Frontend (Web)
1. Driver opens ride details modal
2. Modal subscribes to changes on **driver_locations** table
   - Filters by: `ride_id = current_ride_id`
3. Modal subscribes to changes on **user_locations** table
   - Filters by: `ride_id = current_ride_id`
4. When locations are inserted/updated:
   - Supabase sends real-time event to frontend
   - Modal updates map with new coordinates
   - Driver sees live location of both driver and rider

### Mobile (React Native / Expo)
1. Driver's phone sends location every 5-10 seconds via:
   - `expo-location` or `react-native-geolocation-service`
   - Calls `/api/driver/update-location`
2. Rider's phone sends location every 10 seconds via:
   - Same libraries
   - Calls `/api/user/update-location`
3. Both listen to real-time updates on their respective location tables

## Supabase Realtime Client Example

### Subscribe to Driver Location Changes
```typescript
const subscription = supabase
  .channel(`ride:${rideId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'driver_locations',
      filter: `ride_id=eq.${rideId}`
    },
    (payload) => {
      console.log('Driver moved:', payload.new)
      // Update driver marker on map
    }
  )
  .subscribe()
```

### Subscribe to User Location Changes
```typescript
const subscription = supabase
  .channel(`ride:${rideId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'user_locations',
      filter: `ride_id=eq.${rideId}`
    },
    (payload) => {
      console.log('Rider moved:', payload.new)
      // Update rider marker on map
    }
  )
  .subscribe()
```

## Security Considerations

### Row Level Security (RLS)
Both tables have RLS policies:
- Users can only INSERT/UPDATE/SELECT their own locations
- Drivers can only INSERT/UPDATE/SELECT their own locations
- The ride_id field connects driver and rider for the same ride

### Data Privacy
- Locations are only stored for active rides
- Locations are automatically deleted when ride ends (via ON DELETE)
- Only authenticated users can access their own location data

## Database Cleanup

To delete old location data (optional):
```sql
-- Delete locations older than 7 days
DELETE FROM public.driver_locations 
WHERE timestamp < NOW() - INTERVAL '7 days';

DELETE FROM public.user_locations 
WHERE timestamp < NOW() - INTERVAL '7 days';
```

Or set up a Postgres trigger to auto-delete:
```sql
-- Auto-delete driver locations after 24 hours
CREATE OR REPLACE FUNCTION delete_old_driver_locations()
RETURNS void AS $$
BEGIN
  DELETE FROM public.driver_locations 
  WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Run daily via pg_cron or Supabase Edge Function
SELECT cron.schedule('delete_old_driver_locations', '0 0 * * *', 'SELECT delete_old_driver_locations()');
```

## Testing

### Test Driver Location Updates
1. Open ride details modal as driver
2. Go to Supabase SQL Editor
3. Insert test data:
```sql
INSERT INTO public.driver_locations (id, driver_id, latitude, longitude, ride_id)
VALUES (gen_random_uuid(), 'driver-uuid', 6.5244, 3.3792, 'ride-uuid');
```
4. Map should update in real-time

### Test User Location Updates
```sql
INSERT INTO public.user_locations (id, user_id, latitude, longitude, ride_id)
VALUES (gen_random_uuid(), 'user-uuid', 6.6244, 3.4792, 'ride-uuid');
```

## Troubleshooting

### Realtime Not Working
1. Check that realtime is enabled in Supabase Dashboard
2. Verify row level security policies are correct
3. Check browser console for WebSocket connection errors
4. Ensure ride_id filter matches current ride

### Performance Issues
- Add indexes on frequently queried columns (already done)
- Limit location history to recent data
- Consider batching location updates (send every 5-10 seconds, not every second)

### Location Accuracy
- GPS accuracy varies (5-30 meters typical)
- Use the `accuracy` field to show confidence
- Consider smoothing location updates with recent history

## Next Steps

1. ✅ Create `user_locations` table (run SQL file)
2. ✅ Enable realtime on both tables in Supabase Dashboard
3. Create location update endpoints for drivers and users
4. Update ride details modal to subscribe to real-time location changes
5. Update mobile app to send location updates periodically
6. Test end-to-end location tracking
