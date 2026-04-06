# Complete Push Notification Setup - Your System Explained

## 🎯 What You Have vs What You Need

### ❌ VAPID Keys (You have them but DON'T use them for mobile)
- **Purpose**: For sending notifications to **web browsers only**
- **System**: Web Push Protocol (specific to browsers)
- **Flow**: Your server → Browser's push service → Browser notification
- **Status**: Configured in your env files but NOT used for mobile app

### ✅ Expo Push Tokens (THIS IS WHAT YOU USE FOR MOBILE)
- **Purpose**: For sending notifications to **Expo mobile apps** (Android/iOS)
- **System**: Expo Push Notification Service  
- **Flow**: Mobile app → gets token → Your API → Database → Server sends to Expo → Device
- **Status**: Fully implemented - this is your main system

---

## 📱 How Your Mobile App Gets a Push Token

### Step-by-Step Flow

```
1️⃣  APP LAUNCHES
     ↓
2️⃣  User logs in with custom auth
     ↓
3️⃣  AuthContext calls: subscribeToPushNotifications()
     ↓
4️⃣  Mobile app requests permission:
     "Allow notifications?" {YES/NO}
     ↓
5️⃣  User grants permission ✅
     ↓
6️⃣  Expo service gives token:
     "ExponentPushToken[abc123def456...]"
     ↓
     This is YOUR unique device identifier!
     ↓
7️⃣  App saves locally:
     AsyncStorage.setItem('expo_push_token', token)
     ↓
8️⃣  App sends to your API:
     POST /api/notifications/subscribe
     Body: {
       push_token: "ExponentPushToken[...]",
       platform: "android"
     }
     ↓
9️⃣  Your API authenticates user (custom auth)
     and saves to database:
     
     push_subscriptions row:
     {
       user_id: "user-123",
       push_token: "ExponentPushToken[...]",
       platform: "android",
       is_active: true,
       subscribed_at: "2024-04-05T10:30:00Z"
     }
     ↓
✅  DONE! Device is now subscribed
```

---

## 💾 What Gets Saved in Database

Your `push_subscriptions` table stores:

```sql
-- Clean, simple structure (no RLS needed)
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID,              -- ← Who owns this subscription
  push_token TEXT,           -- ← EXPO token (device identifier)
  platform TEXT,            -- ← 'ios' OR 'android'
  subscribed_at TIMESTAMP,
  last_verified_at TIMESTAMP,
  is_active BOOLEAN,         -- ← Can toggle on/off in settings
  UNIQUE(user_id, push_token)
);
```

**Why these columns?**
- `user_id`: Link to your user
- `push_token`: The actual value Expo gives your phone
- `platform`: Know which OS to use  
- `is_active`: User can disable notifications

---

## 🔔 What the Push Token IS Used For

### The Token is a "Mailing Address"

```
Phone gets token: "ExponentPushToken[WK47jNQM9WshB4YS1RnXg]"
                                      ↓
Server stores in database: push_token column
                                      ↓
Event happens (ride assigned): 
  SELECT push_token FROM push_subscriptions
  WHERE user_id = '123' AND is_active = true
  Result: "ExponentPushToken[WK47jNQM9WshB4YS1RnXg]"
                                      ↓
Server sends to Expo service:
  POST https://exp.host/--/api/v2/push/send
  {
    to: "ExponentPushToken[WK47jNQM9WshB4YS1RnXg]",  ← THE TOKEN!
    title: "New Ride Request",
    body: "Pickup location: Main Street",
    sound: "default"
  }
                                      ↓
Expo recognizes token → Routes to Firebase/APNS
                                      ↓
Device receives notification ✅
```

---

## 🔄 Complete Flow: From User Toggle to Notification

### Flow 1: User Subscribes (Toggle ON)

```
Profile Screen
  ↓
User taps: Notifications ON
  ↓
usePushNotificationToggle hook:
  - Checks if token exists
  - If not, request permission
  - Get token from Expo
  - POST /api/notifications/subscribe {push_token, platform}
  ↓
Your API route:
  - Verify auth (custom auth works here)
  - Store in database via push-service.ts
  ↓
Database:
  INSERT into push_subscriptions {user_id, push_token, is_active: true}
  ↓
✅ User subscribed!
```

### Flow 2: User Unsubscribes (Toggle OFF)

```
Profile Screen
  ↓
User taps: Notifications OFF
  ↓
usePushNotificationToggle hook:
  - DELETE /api/notifications/subscribe {push_token}
  ↓
Your API route:
  - Verify auth
  - Call removeSubscription(userId, pushToken)
  ↓
Database:
  UPDATE push_subscriptions SET is_active = false WHERE push_token = '...'
  ↓
✅ User unsubscribed! (no more notifications on this device)
```

### Flow 3: Server Sends Notification

```
Event: Admin creates new ride for a driver
  ↓
Your backend code:
  const driverId = ride.driver_id;
  await sendPushNotification([driverId], {
    title: 'New Ride Request',
    body: `Pickup: ${ride.location}`,
    type: 'ride_request'
  });
  ↓
sendPushNotification function:
  1. SELECT push_token FROM push_subscriptions
     WHERE user_id = driverId AND is_active = true
  2. Result: ['ExponentPushToken[abc...]', 'ExponentPushToken[xyz...]']
     (same driver might be on multiple devices)
  3. For each token:
     POST https://exp.host/--/api/v2/push/send
     {
       to: token,
       title: 'New Ride Request',
       body: 'Pickup: ...'
     }
  ↓
Expo Service:
  - Identifies which device this token belongs to
  - Routes to Firebase (Android) or APNS (iOS)
  ↓
Device receives notification ✅
```

---

## 📋 System Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│ MOBILE APP (React Native)                               │
│                                                          │
│ 1. App launches → User login (custom auth)             │
│ 2. Gets Expo token: "ExponentPushToken[...]"           │
│ 3. Sends to API: POST /notifications/subscribe         │
│ 4. Stores token locally: AsyncStorage                  │
│                                                          │
│ Profile Screen:                                         │
│ - Toggle switch for notifications                       │
│ - Uses usePushNotificationToggle hook                   │
│ - Shows current subscription status                     │
└─────────────────────────────────────────────────────────┘
              ↓↑ HTTP API Calls ↓↑
┌─────────────────────────────────────────────────────────┐
│ YOUR API SERVER (Next.js)                               │
│                                                          │
│ POST /api/notifications/subscribe                       │
│   ├─ Authenticate user (custom auth, not Supabase)     │
│   ├─ Get push_token from request body                  │
│   └─ Call storePushSubscription(user_id, token)        │
│                                                          │
│ DELETE /api/notifications/subscribe                     │
│   ├─ Authenticate user                                  │
│   ├─ Get push_token from request body                  │
│   └─ Call removeSubscription(user_id, token)           │
│                                                          │
│ GET /api/notifications/subscribe                        │
│   ├─ Authenticate user                                  │
│   └─ Return user's active subscriptions                │
│                                                          │
│ Other endpoints that send notifications:                │
│   POST /api/rides/assign                                │
│   POST /api/chat/send                                   │
│   POST /api/payments/settled                            │
│   (etc. - any event that needs notifications)          │
└─────────────────────────────────────────────────────────┘
              ↓↑ SQL Queries ↓↑
┌─────────────────────────────────────────────────────────┐
│ SUPABASE DATABASE (PostgreSQL)                          │
│                                                          │
│ push_subscriptions table:                               │
│ {                                                        │
│   id: UUID,                                             │
│   user_id: UUID,        ← Your user                      │
│   push_token: TEXT,     ← Expo token                     │
│   platform: TEXT,       ← 'android' or 'ios'           │
│   is_active: BOOLEAN,   ← User preference              │
│   subscribed_at: TIMESTAMP,                             │
│   last_verified_at: TIMESTAMP                           │
│ }                                                        │
│                                                          │
│ Queries:                                                 │
│ - INSERT new subscription                               │
│ - UPDATE is_active when user toggles                    │
│ - SELECT tokens to send notifications                   │
└─────────────────────────────────────────────────────────┘
              ↓↑ Sends notifications ↓↑
┌─────────────────────────────────────────────────────────┐
│ EXPO PUSH SERVICE (Expires Push APIs)                   │
│ https://exp.host/--/api/v2/push/send                    │
│                                                          │
│ Input: { to: "ExponentPushToken[...]", ... }           │
│ Function: Route to correct service based on token       │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ NATIVE PUSH SERVICES                                    │
│                                                          │
│ Android: Firebase Cloud Messaging (FCM)                │
│ iOS: Apple Push Notification (APN)                      │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│ USER'S PHONE                                            │
│                                                          │
│ Notification arrives:                                   │
│ - App foreground: Show banner + play sound + badge      │
│ - App background: Show in notification center           │
│ - App closed: Show on lock screen                       │
│                                                          │
│ User taps: App handles notification response            │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Mobile App Code Integration

### In your Profile screen (driver/profile.tsx):

```tsx
// 1. Import the hook
import { usePushNotificationToggle } from '@/hooks/usePushNotificationToggle';

// 2. Use it in component
const { isSubscribed, isLoading, error, toggleSubscription } = usePushNotificationToggle();

// 3. Render toggle switch
<Switch 
  value={isSubscribed}
  onValueChange={toggleSubscription}
  disabled={isLoading || Boolean(error)}
/>
```

✅ **That's it!** The hook handles:
- Checking current subscription status
- Getting/storing Expo token locally
- Making API calls
- Handling errors and loading states

---

## 🔄 How Subscription Status is Checked

When user opens Profile screen:

```
usePushNotificationToggle hook (on mount):
  ↓
1. Get stored token from AsyncStorage
   → "ExponentPushToken[...]" (or null)
  ↓
2. Call API: GET /api/notifications/subscribe
  ↓
3. Your API:
   - Verify user auth
   - Query database: SELECT * FROM push_subscriptions 
     WHERE user_id = ? AND is_active = true
   - Return list of active subscriptions
  ↓
4. Hook checks:
   - Is the stored token in the response?
   - Is is_active = true?
  ↓
5. Set isSubscribed = true/false
  ↓
6. Render toggle with correct state ✅
```

---

## 🆘 If Toggle Doesn't Work

### Checklist:

1. **User logged in?**
   - Toggle won't work if user not authenticated
   - Check `useAuth()` returns valid user ID

2. **Token exists locally?**
   - First time: App requests notification permission
   - If denied: User must enable in Settings → Apps → Notifications
   - If allowed: Token should be in AsyncStorage

3. **API endpoint working?**
   - Check: POST /api/notifications/subscribe returns 200
   - Check: GET /api/notifications/subscribe returns subscriptions array

4. **Database has data?**
   - Query: `SELECT * FROM push_subscriptions WHERE user_id = 'xyz'`
   - Should have row with your push token

5. **Error message from API?**
   - "Unauthorized - please log in first" = Auth issue
   - "push_token and platform are required" = Missing fields
   - "Internal server error" = Check server logs

---

## ✅ Deployment Checklist

Before going live:

- [ ] SQL migration `05_push_subscriptions_persistent.sql` running
- [ ] API endpoint `/api/notifications/subscribe` deployed
- [ ] Mobile app has `usePushNotificationToggle` hook
- [ ] Profile screen has toggle using the hook
- [ ] `notificationService.ts` calls subscribeToPushNotifications on login
- [ ] Test on real Android device (toggle on/off)
- [ ] Test on real iOS device (toggle on/off)
- [ ] Verify database has subscription rows after toggling
- [ ] Test sending notification when toggled on
- [ ] Verify no notifications when toggled off
- [ ] Test re-enabling after disabling

---

## 🎓 Key Concepts Summary

| Concept | What It Is | Where It's Used |
|---------|-----------|-----------------|
| **Expo Token** | Device-specific ID from Expo | Database push_token column |
| **Push Subscription** | Linking user to token | push_subscriptions table |
| **is_active** | User's toggle preference | Enables/disables notifications |
| **VAPID Keys** | For web browsers only | NOT used for mobile app |
| **Expo Service** | Routing service | Delivers to Firebase/APNS |
| **Firebase/APNS** | Native mobile services | Actually delivers to device |

---

## 🚀 TL;DR - How It Works

1. **Phone asks Expo**: "Can I receive notifications?"
   - Expo gives back token: `ExponentPushToken[...]`

2. **Phone tells Your Server**: "Save this token so you can send me notifications"
   - POST /notifications/subscribe with token

3. **Your Server Saves**: Token in database
   - Database row: {user_id, push_token, is_active}

4. **Something Happens**: (Ride assigned, message received, etc.)
   - Your server queries: "Get this user's notification tokens"
   - Result: Token list

5. **Your Server Sends**: Token to Expo service
   - POST exp.host/api/v2/push/send {to: token, title: '...'}

6. **Expo Routes**: To correct service
   - Android → Firebase
   - iOS → Apple Push

7. **Device Gets Notification**: User sees it! ✅

**The token is the key** - it tells Expo exactly which device to send to.

---

## 📞 Support

If something doesn't work:

1. Check the [PUSH_NOTIFICATION_EXPLANATION.md](./PUSH_NOTIFICATION_EXPLANATION.md) for detailed flows
2. Verify all files are in place:
   - `database/migrations/05_push_subscriptions_persistent.sql`
   - `app/api/notifications/subscribe/route.ts`
   - `lib/push-service.ts`
   - `hooks/usePushNotificationToggle.ts`
   - `app/driver/profile.tsx` (with toggle)
3. Check database: `SELECT * FROM push_subscriptions`
4. Check API: Call GET /api/notifications/subscribe
5. Check logs: Look for `[PUSH]` prefixed messages

You're ready! 🚀
