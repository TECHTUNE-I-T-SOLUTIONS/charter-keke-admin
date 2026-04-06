# Termii SMS Integration - Complete Testing Guide

## ✅ System Status

All Termii SMS integration components are now correctly configured and ready for production testing.

### Updated Configuration

```env
TERMII_API_KEY=TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK
TERMII_SENDER_ID=charterkeke
TERMII_BASE_URL=https://v3.api.termii.com
TERMII_WEBHOOK_SECRET=tsk_iqQ6K3CQ6etPY0zs4EwHqJs0nT
TERMII_WEBHOOK_URL=https://charterkeke.vercel.app/api/webhooks/termii
TERMII_REQUIRE_WEBHOOK_SIGNATURE=false
TERMII_SMS_FALLBACK_TO_GENERIC=true
```

✅ **Webhook URL is correct**: `https://charterkeke.vercel.app/api/webhooks/termii`

## Driver Phone Number Retrieval

The system retrieves driver phone numbers from the `users` table via the following flow:

```
Ride Creation
    ↓
Get driver IDs from "drivers" table → user_id field
    ↓
Query "users" table for phone_number
    ↓
Group by user_id → phoneByUserId Map
    ↓
Send SMS to each driver phone with ride request
```

### Database Schema Validation

Your `users` table has:
- ✅ `phone_number` column (VARCHAR 20)
- ✅ Unique constraint on `phone_number`
- ✅ Index on `phone_number` for fast lookups
- ✅ Role field to distinguish drivers from riders

### Phone Number Formats Supported

The system automatically normalizes phone numbers:

```typescript
// All these formats are accepted and converted to: 2347015250000
toTermiiPhoneNumber("2347015250000")     // ✅ Already normalized
toTermiiPhoneNumber("+2347015250000")    // ✅ International with +
toTermiiPhoneNumber("07015250000")       // ✅ Nigerian national format
toTermiiPhoneNumber("07015250000")       // ✅ Leading 0 stripped
```

## Complete SMS Flow

### 1️⃣ Rider Creates Ride

**Route**: `POST /api/rides`

**Request**:
```json
{
  "pickup_zone": "Lekki Phase 1",
  "pickup_description": "Shell Petrol Station",
  "destination_zone": "Victoria Island",
  "destination_description": "Ajose Adeogun Street",
  "fare": 2500,
  "estimated_distance": 15
}
```

**SMS Sent to All Available Drivers**:
```
New ride CK-550E8400: Shell Petrol Station -> Ajose Adeogun Street. Fare: N2500. Reply ACCEPT 550e8400-e29b-41d4-a716-446655440000 to take this trip.
```

**Backend Flow**:
1. Accept ride creation request at `/api/rides`
2. Query available drivers: `drivers` table
3. Get driver user IDs and query `users.phone_number`
4. Send SMS via Termii DND (transactional) channel
5. Log dispatch in `ride_dispatch_logs` table
6. Send push notifications simultaneously

### 2️⃣ Driver Accepts via SMS

**SMS from Driver**:
```
Driver replies: "ACCEPT 550e8400-e29b-41d4-a716-446655440000"
```

**Webhook Triggered**: `POST /api/webhooks/termii`

Termii sends payload:
```json
{
  "type": "incoming_sms",
  "from": "2347015250000",
  "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-05T10:30:00Z"
}
```

**Backend Processing**:
1. Parse incoming SMS at webhook endpoint
2. Extract driver phone number and message
3. Check if message contains "ACCEPT" + valid ride UUID
4. Look up driver by phone number in `users` table
5. Update ride in database: `driver_id`, `status: accepted`
6. Send confirmation SMS to driver
7. Send notification SMS to rider

### 3️⃣ Driver Accepts via App

**Route**: `POST /api/driver/accept-ride`

**Request**:
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**SMS Sent**:
- To Driver: "Ride 550E8400 accepted! Rider [Name] will be with you shortly."
- To Rider: "Your ride has been accepted! Driver [Name] will be with you shortly."

### 4️⃣ Driver Marks Trip In Progress

**Route**: `POST /api/driver/update-ride-status`

**Request**:
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "in_progress"
}
```

**SMS Sent**:
- To Rider: "Trip started! Your driver [Name] is heading to Lekki Phase 1."
- To Driver: "Trip 550E8400 started! Heading to Lekki Phase 1."

### 5️⃣ Driver Completes Ride

**Route**: `POST /api/driver/update-ride-status`

**Request**:
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

**SMS Sent**:
- To Rider: "Ride completed! Total fare: ₦2,500. Thank you for using Charter Keke."
- To Driver: "Ride 550E8400 completed! Fare: ₦2,500. Thank you!"

---

## Testing Instructions

### Phase 1: Local Testing (Development)

#### Test 1: Simple SMS Test
```bash
curl -X POST http://localhost:3000/api/termii/test \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "simple",
    "phone": "+2347015250000",
    "message": "Test SMS from Charter Keke"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "normalizedPhone": "2347015250000",
  "termiiResponse": {
    "code": "ok",
    "balance": 1047.57,
    "message_id": "xyz123...",
    "message": "Successfully Sent"
  }
}
```

#### Test 2: Ride Request SMS Test
```bash
curl -X POST http://localhost:3000/api/termii/test \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "ride",
    "phone": "+2347015250000",
    "rideId": "550e8400-e29b-41d4-a716-446655440000",
    "pickup": "Lekki Phase 1",
    "destination": "Victoria Island",
    "fare": 2500
  }'
```

### Phase 2: With Real Driver Data

#### Step 1: Create Test Drivers in Database

```sql
-- Get current drivers with phone numbers
SELECT id, first_name, last_name, phone_number, role 
FROM users 
WHERE role = 'driver' 
LIMIT 5;
```

#### Step 2: Create Test Ride with Real Drivers

```bash
curl -X POST http://localhost:3000/api/rides \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_RIDER_SESSION_TOKEN" \
  -d '{
    "pickup_zone": "Lekki Phase 1",
    "pickup_description": "Shell Petrol Station",
    "destination_zone": "Victoria Island",
    "destination_description": "Ajose Adeogun Street",
    "fare": 2500,
    "estimated_distance": 15
  }'
```

**Check Backend Logs** for:
```
[RideDispatch] SMS dispatch summary
[RideDispatch] Candidate drivers count: 5
[RideDispatch] SMS sent successfully to: X drivers
[Termii] SMS sent to: 2347015250000
```

### Phase 3: Webhook Configuration Testing

#### Step 1: Access Termii Dashboard
1. Go to: https://dashboard.termii.com
2. Login with your account
3. Navigate to: Settings → Webhooks

#### Step 2: Verify Webhook URL
```
URL: https://charterkeke.vercel.app/api/webhooks/termii
Event Type: Incoming SMS
Method: POST
```

#### Step 3: Test Webhook (Termii Dashboard)
1. Click "Test Webhook" in the dashboard
2. Should receive: `{ "received": true }`
3. Check your backend logs for: `[Termii] Webhook received`

#### Step 4: Test Real SMS Response

**From a phone from your Termii account:**
1. Send SMS: `ACCEPT 550e8400-e29b-41d4-a716-446655440000` to your Termii number
2. Check backend logs for:
   ```
   [Termii] Incoming SMS from: +2347015250000
   [Termii] Message: ACCEPT 550e8400-e29b-41d4-a716-446655440000
   [RideAcceptance] Ride accepted successfully
   ```
3. Should receive confirmation SMS: "Ride 550E8400 accepted!"

---

## Production Deployment Checklist

- [ ] Update `.env.local` with live Termii credentials (already done ✅)
- [ ] Deploy backend to Vercel
- [ ] Configure Termii webhook URL: `https://charterkeke.vercel.app/api/webhooks/termii`
- [ ] Test webhook delivery from Termii dashboard
- [ ] Create test drivers with valid phone numbers
- [ ] Create test ride and verify SMS sent
- [ ] Test SMS acceptance flow
- [ ] Monitor Termii API logs in dashboard
- [ ] Set up credit balance alerts
- [ ] Enable webhook signature verification when ready: `TERMII_REQUIRE_WEBHOOK_SIGNATURE=true`

---

## Monitoring & Debugging

### Backend Logs to Monitor

```bash
# Ride dispatch logs
[RideDispatch] Candidate drivers count
[RideDispatch] SMS dispatch summary
[RideDispatch] Failed to send SMS

# Termii operation logs
[Termii] SMS sent to
[Termii] DND SMS failed, considering generic fallback
[Termii] Webhook received
[Termii] Incoming SMS from

# Ride acceptance logs
[RideAcceptance] Ride accepted successfully
[RideAcceptance] SMS sent to driver
[RideAcceptance] SMS sent to rider

# Webhook logs
[Termii] Webhook received
[Termii] incoming_sms event processed
```

### Common Issues & Solutions

#### ❌ "SMS not being sent to drivers"
✅ Check:
- [ ] Drivers have phone_number in users table: `SELECT phone_number FROM users WHERE role = 'driver' LIMIT 1;`
- [ ] Phone numbers are in correct format (national or international)
- [ ] Termii dashboard shows sufficient credits
- [ ] API key is correct in `.env.local`
- [ ] Check `[RideDispatch]` logs for "No driver phone numbers available"

#### ❌ "Webhook not receiving driver SMS responses"
✅ Check:
- [ ] Webhook URL is set in Termii dashboard: `https://charterkeke.vercel.app/api/webhooks/termii`
- [ ] Webhook URL is publicly accessible (not localhost)
- [ ] Check Termii dashboard webhook logs for delivery status
- [ ] Check backend logs for `[Termii] Webhook received`
- [ ] Verify driver phone sending reply is the same as in database

#### ❌ "Driver lookup failing in webhook"
✅ Check:
- [ ] Webhook `findDriverUserByPhone()` is getting called
- [ ] Phone number normalization is working correctly
- [ ] Database query for driver user is returning results
- [ ] Check logs for `[Termii] Driver not found for incoming phone number`

#### ❌ "Termii API returns 401 Unauthorized"
✅ Check:
- [ ] API Key is correct: `TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK`
- [ ] Using HTTPS in base URL (not HTTP)
- [ ] Base URL is correct: `https://v3.api.termii.com` (not `https://api.ng.termii.com`)
- [ ] Account is active in Termii dashboard

---

## Key Files Reference

- **SMS Service**: [lib/termii.ts](/lib/termii.ts)
  - `sendSMS()` - Send single SMS
  - `sendBulkSMS()` - Send to multiple drivers
  - `sendRideRequestSMS()` - Ride request template
  - `sendRideAcceptanceSMS()` - Acceptance template
  - `sendRideStatusUpdateSMS()` - Status update template
  - `toTermiiPhoneNumber()` - Phone number normalization

- **Ride Dispatch**: [app/api/rides/route.ts](/app/api/rides/route.ts)
  - SMS sent to all available drivers in zone
  - Logs dispatch in `ride_dispatch_logs` table

- **Ride Acceptance**: [lib/ride-acceptance.ts](/lib/ride-acceptance.ts)
  - SMS confirmation to both driver and rider
  - Integrates with webhook acceptance

- **Status Updates**: [app/api/driver/update-ride-status/route.ts](/app/api/driver/update-ride-status/route.ts)
  - SMS on trip start (in_progress)
  - SMS on trip completion

- **Webhook Handler**: [app/api/webhooks/termii/route.ts](/app/api/webhooks/termii/route.ts)
  - Receives incoming SMS from Termii
  - Parses ACCEPT command
  - Looks up driver by phone
  - Automatically accepts ride

- **Test Endpoint**: [app/api/termii/test/route.ts](/app/api/termii/test/route.ts)
  - For development testing only
  - Simple and Ride request SMS tests

---

## Termii API Reference

### Send Single SMS
**Endpoint**: `POST https://v3.api.termii.com/api/sms/send`

Request:
```json
{
  "api_key": "TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK",
  "to": "2347015250000",
  "from": "charterkeke",
  "sms": "Your SMS message",
  "type": "plain",
  "channel": "dnd"
}
```

### Send Bulk SMS
**Endpoint**: `POST https://v3.api.termii.com/api/sms/send/bulk`

Request:
```json
{
  "api_key": "TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK",
  "to": ["2347015250000", "2347015250001"],
  "from": "charterkeke",
  "sms": "Your SMS message",
  "type": "plain",
  "channel": "dnd"
}
```

### Webhook Event (Incoming SMS)
**URL**: `POST https://charterkeke.vercel.app/api/webhooks/termii`

Payload from Termii:
```json
{
  "type": "incoming_sms",
  "from": "2347015250000",
  "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-04-05T10:30:00Z"
}
```

---

## Troubleshooting Termii Account

### Check API Balance
Go to: https://dashboard.termii.com → Dashboard → Wallet → Balance

### Monitor API Usage
Go to: https://dashboard.termii.com → Analytics → SMS Sent

### Check Sender ID Status
Go to: https://dashboard.termii.com → Settings → Sender IDs
- Should see "charterkeke" as Approved

### Check Webhook Delivery
Go to: https://dashboard.termii.com → Settings → Webhooks
- Click on webhook URL
- View delivery logs
- Click "Test Webhook" to send test payload

### Contact Termii Support
- Email: support@termii.com
- Website: https://termii.com
- Dashboard: https://dashboard.termii.com

---

## Success Indicators

✅ System is working when you see:

1. **SMS Dispatch** (when rider creates ride):
   ```
   [RideDispatch] Candidate drivers count: 5
   [RideDispatch] SMS dispatch summary: attempted=5, successful=5
   ```

2. **SMS Acceptance** (when driver replies):
   ```
   [Termii] Webhook received: {...}
   [Termii] Incoming SMS from: +2347015250000
   [RideAcceptance] Ride accepted successfully
   [RideAcceptance] SMS sent to driver: confirmation received
   ```

3. **Status Update SMS** (when trip starts):
   ```
   [UpdateRideStatus] Sending SMS notifications for status update
   [UpdateRideStatus] SMS sent to driver and rider
   ```

---

## Next Steps

1. ✅ Environment variables updated
2. ✅ SMS service fully integrated
3. ✅ Webhook endpoint ready
4. ⏭️ **Deploy to Vercel**
5. ⏭️ **Configure Termii webhook URL**
6. ⏭️ **Test with development numbers**
7. ⏭️ **Monitor for 24 hours before full launch**
