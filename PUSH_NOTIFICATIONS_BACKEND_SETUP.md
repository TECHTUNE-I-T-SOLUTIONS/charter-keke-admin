# Push Notifications Backend Implementation - Complete Setup

## Status ✅

**All backend features have been implemented and are ready to use!**

### What's Implemented

1. ✅ POST `/api/notifications/subscribe` - Accept and store push tokens
2. ✅ Database schema with `push_subscriptions` table
3. ✅ Expo Notifications API integration for sending
4. ✅ Status tracking (real token vs placeholder)
5. ✅ Broadcasting to drivers/riders with valid tokens
6. ✅ Test endpoint for manual notification sending
7. ✅ Statistics and monitoring functions

---

## How It Works

### Flow: Mobile App Subscribes

**Mobile → Backend:**
```
POST /api/notifications/subscribe
{
  "pushToken": "ExponentPushToken[abc...]",
  "platform": "android",
  "status": "token_ready"
}
```

**Backend:**
1. Authenticates user
2. Stores in database
3. Returns success

### Flow: Backend Sends Notification

**Your Code → Backend:**
```typescript
await sendPushNotification([userId], {
  title: 'New Ride',
  body: 'You have a ride request',
  type: 'ride_request'
});
```

**Backend:**
1. Gets user's push token from database
2. Calls Expo API: `POST https://exp.host/--/api/v2/push/send`
3. Expo delivers to user's phone

---

## Sending Notifications

### From Your Code

```typescript
import { sendPushNotification, broadcastToDrivers } from '@/lib/push-service';

// Send to specific users
await sendPushNotification(['user-1', 'user-2'], {
  title: 'New Ride Request',
  body: 'You have a new ride',
  type: 'ride_request',
  data: { rideId: '123' }
});

// Broadcast to all drivers
await broadcastToDrivers({
  title: 'System Update',
  body: 'New features available',
  type: 'ride_update'
});

// Broadcast to all riders
await broadcastToRiders({
  title: 'Promo',
  body: '30% off available',
  type: 'ride_update'
});
```

### Testing Manually

```bash
# Send yourself a test notification
curl -X POST http://localhost:3000/api/push/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "title": "Test", "body": "This is a test" }'
```

---

## Available Functions

From `/lib/push-service.ts`:

### Send to Specific Users
```typescript
sendPushNotification(userIds, { title, body, type, data })
```

### Broadcast
```typescript
broadcastToDrivers({ title, body, type, data })
broadcastToRiders({ title, body, type, data })
broadcastToDriversWithValidTokens({ ... })  // Filters DB for real tokens
broadcastToRidersWithValidTokens({ ... })   // Filters DB for real tokens
```

### Subscriptions
```typescript
storePushSubscription({ userId, pushToken, platform, status, ... })
getUserSubscriptions(userId)
removeSubscription(userId)
```

### Monitoring
```typescript
getPushSubscriptionStats()              // Get counts by status
findStuckPlaceholderTokens()           // Find old placeholder tokens
cleanupOldPlaceholderTokens()          // Delete tokens older than 24h
getSubscriptionStatus()                // In-memory cache status
```

---

## Implementation Examples

### When Ride Request Created

```typescript
// app/api/rides/create/route.ts
import { sendPushNotification } from '@/lib/push-service';

export async function POST(request: NextRequest) {
  const ride = await db.rides.create({...});
  
  // Notify driver
  await sendPushNotification([ride.driver_id], {
    title: '🚗 New Ride Request',
    body: `Pickup from ${ride.pickup_location}`,
    type: 'ride_request',
    data: { rideId: ride.id }
  });
  
  return NextResponse.json({ success: true });
}
```

### When Driver Accepts

```typescript
// app/api/rides/accept/route.ts
import { sendPushNotification } from '@/lib/push-service';

export async function POST(request: NextRequest) {
  const ride = await db.rides.findById(rideId);
  
  // Notify rider
  await sendPushNotification([ride.rider_id], {
    title: '✅ Driver Accepted',
    body: `${ride.driver_name} is on the way`,
    type: 'ride_accepted',
    data: { rideId }
  });
  
  return NextResponse.json({ success: true });
}
```

### Periodic Cleanup

```typescript
// app/api/cron/cleanup-push-tokens/route.ts
import { cleanupOldPlaceholderTokens } from '@/lib/push-service';

export async function POST(request: NextRequest) {
  const result = await cleanupOldPlaceholderTokens();
  console.log(`Cleaned up ${result.deleted} old tokens`);
  
  return NextResponse.json({ success: true, deleted: result.deleted });
}
```

---

## Notification Types

```typescript
| Type                | Usage                         |
|---|---|
| 'ride_request'      | New ride request for driver   |
| 'ride_accepted'     | Driver accepted rider's ride  |
| 'ride_update'       | General status updates        |
| 'support_message'   | Support/help responses        |
| 'payment_received'  | Payment confirmations         |
```

---

## API Endpoints

### `/api/notifications/subscribe` - POST
Store user's push token
```json
{
  "pushToken": "ExponentPushToken[...]",
  "platform": "android|ios",
  "status": "token_ready"
}
```

### `/api/notifications/subscribe` - GET
Get user's subscriptions

### `/api/notifications/subscribe` - DELETE
Unsubscribe

### `/api/push/test` - POST
Send yourself a test notification

---

## Database Table

```sql
push_subscriptions:
  id - UUID
  user_id - UUID (FK to users)
  push_token - VARCHAR(500)
  platform - VARCHAR(20) - 'ios', 'android', 'web'
  status - VARCHAR(50) - 'token_ready', 'permission_granted_token_pending', 'permission_denied'
  is_placeholder - BOOLEAN - true if Firebase unavailable
  reason - VARCHAR(255)
  token_updated_at - TIMESTAMP
  is_active - BOOLEAN
  subscribed_at, created_at, updated_at
```

---

## Useful Queries

### All active subscriptions
```sql
SELECT * FROM push_subscriptions WHERE is_active = true;
```

### Only users with real tokens
```sql
SELECT * FROM push_subscriptions 
WHERE is_active = true AND is_placeholder = false;
```

### Count by status
```sql
SELECT status, COUNT(*) as count 
FROM push_subscriptions 
WHERE is_active = true 
GROUP BY status;
```

### Find old placeholder tokens
```sql
SELECT * FROM push_subscriptions
WHERE is_placeholder = true
  AND subscribed_at < NOW() - INTERVAL '24 hours';
```

---

## Testing Checklist

- [ ] Mobile app subscribes successfully
- [ ] Token stored in `push_subscriptions` table
- [ ] `/api/push/test` sends notification to your device
- [ ] Notification appears on your phone
- [ ] Subscribe multiple times, see multiple tokens
- [ ] Unsubscribe removes token
- [ ] Placeholder tokens upgrade to real tokens (if tested on emulator)

---

## Summary

Everything is implemented! Just:

1. **Use the export functions** from `@/lib/push-service`
2. **Call them** when you need to send notifications
3. **Test with** `/api/push/test` endpoint
4. **Monitor with** stats functions (optional)

No additional setup needed! 🎉

