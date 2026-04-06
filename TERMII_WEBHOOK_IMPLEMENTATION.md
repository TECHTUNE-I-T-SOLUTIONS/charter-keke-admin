# ✅ Termii Webhook Implementation - Complete Guide

## 📝 Webhook Overview

The Termii webhook endpoint handles incoming SMS messages from drivers accepting rides. When a driver replies to an SMS with the ACCEPT command, the system automatically:

1. Receives the webhook from Termii
2. Extracts driver phone number and message
3. Looks up driver in database
4. Parses ACCEPT command with ride ID
5. Updates ride with driver acceptance
6. Sends confirmation SMS to both parties
7. Sends push notifications

---

## 🔗 Webhook Endpoint

**URL**: `POST /api/webhooks/termii`  
**Public**: ✅ Yes (no authentication required)  
**Termii Configuration**: Should be set in Termii Developer Console

### Termii Webhook Configuration

1. Go to: https://termii.com/dashboard
2. Settings → Webhooks → Incoming Messages
3. Webhook URL: `https://your-domain.vercel.app/api/webhooks/termii`
4. Optional: Add webhook signature secret to `.env.local`

---

## 📨 Webhook Payload Structure

### Termii Sends (Based on Official Docs)

```json
{
  "type": "inbound",
  "id": "8248611476370959318",
  "message_id": "3905204342778053556",
  "receiver": "12022214836",
  "sender": "2347069549231",
  "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000",
  "received_at": "2020-12-16T10:51:03.000000Z",
  "cost": null,
  "command": "Received",
  "status": "Received",
  "channel": null
}
```

### Key Fields Used

| Field | Purpose |
|-------|---------|
| `type` | "inbound" for incoming SMS (webhook event type) |
| `sender` | Driver's phone number (used to find driver in database) |
| `message` | SMS message content (parsed for ACCEPT command & ride ID) |
| `receiver` | Your shortcode/number (our system number) |
| `message_id` | Termii's message ID (for tracking) |
| `received_at` | Timestamp when message was received |

---

## 🔐 Webhook Signature Verification

The implementation supports optional webhook signature verification:

```typescript
// Optional: Add to .env.local
TERMII_WEBHOOK_SECRET=your_webhook_secret
TERMII_REQUIRE_WEBHOOK_SIGNATURE=true  // Optional, defaults to false
```

If signature verification fails, webhook returns:
```json
{
  "error": "Invalid signature",
  "status": 401
}
```

---

## 📨 Workflow: Driver Accepts Ride via SMS

### Step 1: Ride Dispatch
```
System creates ride → Sends SMS to 5 nearby drivers
SMS content: "Reply: ACCEPT 550e8400-e29b-41d4-a716-446655440000"
```

### Step 2: Driver Replies
```
Driver receives SMS on their phone
Driver types: "ACCEPT 550e8400-e29b-41d4-a716-446655440000"
Driver sends SMS back to your number (charterkeke)
```

### Step 3: Webhook Received
```
Termii receives driver's reply
Termii sends POST to: /api/webhooks/termii
Body includes: sender (driver phone), message (ACCEPT command)
```

### Step 4: Webhook Processing
```
[Termii-Webhook] Incoming SMS from: 2347069549231 Message: ACCEPT 550e8400...
[Termii-Webhook] ACCEPT command found, rideId: 550e8400-e29b-41d4-a716-446655440000
[Termii-Webhook] Driver found: 550e8400-e29b-41d4-a716-446655211111
[RideAcceptance] Attempting to accept ride: { rideId: '550e8400-...', driverUserId: '550e8400-...' }
[RideAcceptance] Driver found: 550e8400-e29b-41d4-a716-446655222222
[RideAcceptance] ✅ Ride updated successfully
```

### Step 5: Database Update
```sql
UPDATE rides SET
  driver_id = '550e8400-e29b-41d4-a716-446655222222',
  status = 'accepted',
  updated_at = now()
WHERE
  id = '550e8400-e29b-41d4-a716-446655440000'
  AND status IN ('pending', 'dispatched')
  AND driver_id IS NULL;
```

### Step 6: Notifications Sent
```
✅ Push notification to rider: "Driver found! [Driver Name] is heading to pickup"
✅ SMS to driver: "✅ RIDE ACCEPTED - CK-550E8400..."
✅ SMS to rider: "✅ DRIVER FOUND - CK-550E8400..."
✅ Dispatch log recorded
```

---

## 🔍 Data Flow & Database Lookups

### Phone Number → User

```typescript
// Input: sender = "2347069549231"
→ Normalize to: "2347069549231"
→ Try variants: [
    "2347069549231",          // Direct
    "+2347069549231",         // With +
    "07069549231"             // National format
  ]
→ Query: SELECT id, phone_number FROM users
         WHERE role = 'driver' AND phone_number = variant
→ Result: { id: 'user-uuid', phone_number: '2347069549231' }
```

### User → Driver

```typescript
// Input: user_id = 'user-uuid'
→ Query: SELECT id, user_id FROM drivers
         WHERE user_id = 'user-uuid'
→ Result: { id: 'driver-uuid', user_id: 'user-uuid' }
```

### Update Ride

```typescript
// Input: rideId = '550e8400-...', driver_id = 'driver-uuid'
→ Query: UPDATE rides SET
         driver_id = 'driver-uuid',
         status = 'accepted',
         updated_at = now()
         WHERE id = '550e8400-...'
         AND status IN ('pending', 'dispatched')
         AND driver_id IS NULL
→ Result: updatedRide with all fields
```

---

## 💾 Ride Fields Updated on Acceptance

When a ride is accepted via SMS, these fields are set:

| Field | Value | Purpose |
|-------|-------|---------|
| `driver_id` | driver.id | Links ride to driver |
| `status` | "accepted" | Indicates ride is accepted |
| `updated_at` | NOW() | Tracks when acceptance occurred |
| `created_at` | (unchanged) | Keeps ride creation time |
| `rider_id` | (unchanged) | Preserves rider |
| All others | (unchanged) | Preserved for later updates |

**NOT updated on acceptance**:
- `pickup_time` - Set when driver arrives/starts trip
- `dropoff_time` - Set when trip completes
- `duration_minutes` - Calculated on completion
- `distance_km` - Calculated on completion
- `fare_amount` - Already set at creation
- `rating` - Added after trip completion

---

## 📊 API Responses

### Success Response

```json
{
  "received": true,
  "accepted": true,
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "driverUserId": "550e8400-e29b-41d4-a716-446655211111"
}
// Status: 200
```

### Ride Already Accepted

```json
{
  "received": true,
  "accepted": false,
  "reason": "Ride already taken"
}
// Status: 409
```

### Driver Not Found

```json
{
  "received": true,
  "ignored": true,
  "reason": "Driver not found for incoming phone number"
}
// Status: 200
```

### Invalid ACCEPT Command

```json
{
  "received": true,
  "ignored": true,
  "reason": "No valid ACCEPT command with ride ID"
}
// Status: 200
```

### Server Error

```json
{
  "error": "Webhook processing failed"
}
// Status: 500
```

---

## 🧪 Testing Webhook Locally

### Option 1: Using curl

```bash
curl -X POST http://localhost:3000/api/webhooks/termii \
  -H "Content-Type: application/json" \
  -d '{
    "type": "inbound",
    "id": "8248611476370959318",
    "message_id": "3905204342778053556",
    "receiver": "12022214836",
    "sender": "2347069549231",
    "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000",
    "received_at": "2024-04-06T10:51:03.000000Z",
    "status": "Received"
  }'
```

### Option 2: Using Postman

1. Create new POST request
2. URL: `http://localhost:3000/api/webhooks/termii`
3. Headers: `Content-Type: application/json`
4. Body (raw JSON):
```json
{
  "type": "inbound",
  "sender": "2347069549231",
  "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000"
}
```

### Option 3: Using ngrok (for real Termii webhooks)

```bash
# Expose local server
ngrok http 3000
# Returns: https://abc123.ngrok.io

# Set webhook URL in Termii:
# https://abc123.ngrok.io/api/webhooks/termii

# Send real test SMS from your phone
```

---

## 🔍 Debugging & Monitoring

### Check Backend Logs

```
[Termii-Webhook] Incoming SMS from: 2347069549231 Message: ACCEPT 550e8400...
[Termii-Webhook] ACCEPT command found, rideId: 550e8400-...
[Termii-Webhook] Driver found: 550e...
[RideAcceptance] Attempting to accept ride: { rideId: '550e...', driverUserId: '550e...' }
[RideAcceptance] Driver found: 550e...
[RideAcceptance] ✅ Ride updated successfully
```

### Check Ride in Database

```sql
SELECT id, status, driver_id, updated_at 
FROM rides 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';
```

Should show:
- `status` = "accepted"
- `driver_id` = (assigned driver UUID)
- `updated_at` = recent timestamp

### Check Dispatch Log

```sql
SELECT * FROM ride_dispatch_logs 
WHERE ride_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;
```

Should show SMS acceptance entry.

---

## ⚠️ Common Issues & Solutions

### Issue: "Driver not found for incoming phone number"
**Cause**: Phone number in SMS doesn't match any driver in database  
**Solution**:
1. Verify driver's phone in users table: `SELECT id, phone_number FROM users WHERE role = 'driver'`
2. Check phone format (should be normalized)
3. Update webhook test payload with correct phone

### Issue: "Ride is no longer available"
**Cause**: Another driver accepted same ride first  
**Solution**: 
1. This is expected behavior (first-come-first-served)
2. Driver should receive new ride offer
3. Check conflict resolution in ride dispatch

### Issue: "No valid ACCEPT command with ride ID"
**Cause**: Message doesn't contain "ACCEPT" or valid UUID  
**Solution**:
1. Check driver's SMS message format
2. Must contain: "ACCEPT" + 36-character UUID
3. Example: "ACCEPT 550e8400-e29b-41d4-a716-446655440000"

### Issue: Webhook not receiving from Termii
**Cause**: Webhook URL not configured in Termii dashboard  
**Solution**:
1. Go to Termii dashboard
2. Settings → Webhooks → Incoming Messages
3. Set URL: `https://your-domain.vercel.app/api/webhooks/termii`
4. Test webhook in Termii dashboard

---

## 🚀 Production Deployment

### Before Going Live

- [ ] Test with real driver phone numbers
- [ ] Configure webhook URL in Termii dashboard
- [ ] Set `.env.local` variables:
  ```env
  TERMII_API_KEY=your_api_key
  TERMII_WEBHOOK_SECRET=your_webhook_secret (optional)
  TERMII_REQUIRE_WEBHOOK_SIGNATURE=false (or true if secret set)
  ```
- [ ] Verify signature verification works (if using)
- [ ] Test with real SMS from driver
- [ ] Monitor logs for 24 hours
- [ ] Check SMS delivery in Termii dashboard

### Monitoring Checklist

- [ ] Webhook receives requests from Termii
- [ ] Phone numbers are correctly normalized
- [ ] Drivers are found in database
- [ ] Rides are updated to "accepted" status
- [ ] SMS confirmations are sent
- [ ] Push notifications are delivered
- [ ] Logs show no errors

---

## 📞 Summary

The webhook implementation:
- ✅ Handles "inbound" SMS events from Termii
- ✅ Parses ACCEPT commands with ride IDs
- ✅ Looks up drivers by phone number
- ✅ Updates rides with driver assignment
- ✅ Uses first-come-first-served logic
- ✅ Sends SMS + push confirmations
- ✅ Logs all activities for debugging
- ✅ Public endpoint (no auth required)
- ✅ Supports optional signature verification

All required ride fields are properly updated for ride acceptance! 🎉
