# Termii SMS Testing - Postman Requests Guide

## Test Requests Setup

Three Postman requests have been opened in VS Code. Here's the exact payload to use for each:

---

## 📝 Test 1: Simple SMS Test

**Request Tab**: `POST http://localhost:3000/api/termii/test`

### Body (Raw JSON):
```json
{
  "testType": "simple",
  "phone": "+2347015250000",
  "message": "Testing Termii SMS from Charter Keke"
}
```

### Expected Response (Success):
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "normalizedPhone": "2347015250000",
  "termiiResponse": {
    "code": "ok",
    "balance": 1047.57,
    "message_id": "3017544054459083819856413",
    "message": "Successfully Sent",
    "user": "Charter Keke Account"
  }
}
```

### What It Tests:
- ✅ Termii API connectivity
- ✅ Phone number normalization
- ✅ SMS sending with DND channel
- ✅ API key validity
- ✅ Account balance

---

## 📝 Test 2: Ride Request SMS Test

**Request Tab**: `POST http://localhost:3000/api/termii/test`

### Body (Raw JSON):
```json
{
  "testType": "ride",
  "phone": "+2347015250000",
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "pickup": "Lekki Phase 1",
  "destination": "Victoria Island",
  "fare": 2500
}
```

### Expected Response (Success):
```json
{
  "success": true,
  "message": "SMS sent successfully",
  "normalizedPhone": "2347015250000",
  "termiiResponse": {
    "code": "ok",
    "balance": 1045.57,
    "message_id": "3017544054459083819856414",
    "message": "Successfully Sent"
  }
}
```

### Actual SMS Received:
```
New ride CK-550E8400: Lekki Phase 1 -> Victoria Island. Fare: N2500. Reply ACCEPT 550e8400-e29b-41d4-a716-446655440000 to take this trip.
```

### What It Tests:
- ✅ Ride request SMS formatting
- ✅ Ride ID in accept command
- ✅ Fare display in SMS
- ✅ DND channel for transactional SMS

---

## 📝 Test 3: Create Ride & Send SMS to Real Drivers

**Request Tab**: `POST http://localhost:3000/api/rides`

⚠️ **Prerequisites**:
- You must be authenticated as a rider
- Need rider session token from login

### Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_RIDER_SESSION_TOKEN
```

### Body (Raw JSON):
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

### Expected Response (Success):
```json
{
  "message": "Ride created successfully",
  "ride": {
    "id": "abc12345-def6-7890-ghij-klmn1234567o",
    "rider_id": "user-uuid-here",
    "pickup_zone": "Lekki Phase 1",
    "pickup_description": "Shell Petrol Station",
    "destination_zone": "Victoria Island",
    "destination_description": "Ajose Adeogun Street",
    "fare": 2500,
    "estimated_distance": 15,
    "status": "dispatched",
    "created_at": "2026-04-05T10:30:00.000Z"
  }
}
```

### Backend Logs You'll See:
```
[RideDispatch] Candidate drivers count: {count: 5, pickup_zone: "Lekki Phase 1"}
[RideDispatch] SMS sent to drivers: +2347015250000
[RideDispatch] SMS dispatch summary: {attempted: 5, successful: 5}
[Termii] SMS sent to: 2347015250000
```

### What It Tests:
- ✅ Ride creation
- ✅ Driver lookup by zone
- ✅ SMS dispatch to all drivers
- ✅ Driver phone number retrieval from users table
- ✅ Push notifications + SMS together

---

## 📝 Test 4: Webhook - Simulate Driver SMS Reply

**Request Tab**: `POST http://localhost:3000/api/webhooks/termii`

This simulates what Termii sends when a driver replies with the ACCEPT command.

### Headers:
```json
Content-Type: application/json
```

### Body (Raw JSON):
```json
{
  "type": "incoming_sms",
  "from": "2347015250000",
  "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000",
  "sender_id": "charterkeke",
  "message_id": "msg123456789",
  "timestamp": "2026-04-05T10:35:00Z"
}
```

### Expected Response (Success):
```json
{
  "received": true,
  "accepted": true,
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "driverUserId": "driver-uuid-here"
}
```

### Backend Logs You'll See:
```
[Termii] Webhook received: {type: "incoming_sms", from: "2347015250000"}
[Termii] Incoming SMS from: +2347015250000 Message: ACCEPT 550e8400-e29b-41d4-a716-446655440000
[RideAcceptance] Ride accepted successfully
[RideAcceptance] SMS sent to driver: confirmation received
[RideAcceptance] SMS sent to rider: notification received
```

### What It Tests:
- ✅ Webhook parsing
- ✅ ACCEPT command extraction
- ✅ Driver lookup by phone number
- ✅ Ride acceptance logic
- ✅ SMS confirmation to both parties

---

## 📝 Test 5: Driver Accept Ride via App

**Request Tab**: `POST http://localhost:3000/api/driver/accept-ride`

⚠️ **Prerequisites**:
- Must be authenticated as a driver
- Need driver session token from login
- Ride must exist in database with status "pending" or "dispatched"

### Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_DRIVER_SESSION_TOKEN
```

### Body (Raw JSON):
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Expected Response (Success):
```json
{
  "success": true,
  "ride": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "rider_id": "rider-uuid",
    "driver_id": "driver-uuid",
    "status": "accepted",
    "pickup_zone": "Lekki Phase 1",
    "destination_zone": "Victoria Island",
    "fare": 2500
  }
}
```

### Backend Logs You'll See:
```
[AcceptRide] Push notification sent to rider
[RideAcceptance] SMS sent to driver: Ride 550E8400 accepted!
[RideAcceptance] SMS sent to rider: Your ride has been accepted! Driver [Name] will be with you shortly.
```

### What It Tests:
- ✅ Driver authentication
- ✅ Ride acceptance
- ✅ SMS to both driver and rider
- ✅ Push notifications
- ✅ Database ride status update

---

## 📝 Test 6: Driver Update Ride Status (In Progress)

**Request Tab**: Create new POST request: `http://localhost:3000/api/driver/update-ride-status`

### Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_DRIVER_SESSION_TOKEN
```

### Body (Raw JSON):
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "in_progress"
}
```

### Expected Response (Success):
```json
{
  "success": true,
  "ride": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "in_progress",
    "driver_id": "driver-uuid",
    "rider_id": "rider-uuid"
  }
}
```

### SMS Sent:
- **To Rider**: "Trip started! Your driver [Name] is heading to Lekki Phase 1."
- **To Driver**: "Trip 550E8400 started! Heading to Lekki Phase 1."

### Backend Logs You'll See:
```
[UpdateRideStatus] Sending SMS notifications for status update
[UpdateRideStatus] SMS sent to driver and rider: in_progress
```

### What It Tests:
- ✅ Trip start status update
- ✅ SMS to both parties about trip start
- ✅ Push notifications
- ✅ Driver location tracking

---

## 📝 Test 7: Driver Complete Ride

**Request Tab**: Use same request as Test 6, change body

### Body (Raw JSON):
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed"
}
```

### Expected Response (Success):
```json
{
  "success": true,
  "ride": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "completed_at": "2026-04-05T10:45:00.000Z",
    "fare": 2500
  }
}
```

### SMS Sent:
- **To Rider**: "Ride completed! Total fare: ₦2,500. Thank you for using Charter Keke."
- **To Driver**: "Ride 550E8400 completed! Fare: ₦2,500. Thank you!"

### Backend Logs You'll See:
```
[UpdateRideStatus] Sending SMS notifications for ride completion
[UpdateRideStatus] SMS sent to driver and rider: completed
```

### What It Tests:
- ✅ Ride completion
- ✅ Completion SMS with fare
- ✅ Payment processing trigger
- ✅ Rating prompt for rider

---

## 🚀 Complete Testing Flow

### Step-by-Step Testing:

1. **Start Backend**
   ```bash
   cd d:\Codes\easely
   npm run dev
   ```
   Wait for: "✓ Ready in XXXms"

2. **Test 1: Simple SMS** ✅
   - In Postman: Send simple test SMS
   - Check response: `"success": true`
   - Verify in Termii dashboard: Balance decreased

3. **Test 2: Ride Request SMS** ✅
   - In Postman: Send ride request SMS
   - Check response: `"success": true`
   - Verify logs for: `[Termii] SMS sent to`

4. **Test 3: Create Ride** ✅ (requires rider login)
   - Login as rider first
   - Copy session token
   - Add to Authorization header
   - Send ride creation request
   - Check backend logs for: `[RideDispatch] SMS dispatch summary`

5. **Test 4: Webhook - SMS Reply** ✅
   - Send webhook request with ACCEPT command
   - Check response: `"accepted": true`
   - Check backend logs for: `[RideAcceptance] Ride accepted successfully`

6. **Test 5: Driver Accept** ✅ (requires driver login)
   - Login as driver
   - Copy session token
   - Send accept request with ride ID from Test 3
   - Check response: `"success": true`
   - Check SMS sent to rider

7. **Test 6: Update to In Progress** ✅
   - Send status update with `status: "in_progress"`
   - Check SMS sent to both parties
   - Verify logs

8. **Test 7: Complete Ride** ✅
   - Send status update with `status: "completed"`
   - Check completion SMS with fare
   - Verify logs

---

## 🔍 Monitoring & Debugging

### Backend Console Watch For:

**Success Indicators**:
```
✅ [Termii] SMS sent to: 2347015250000
✅ [RideDispatch] SMS dispatch summary: attempted=5, successful=5
✅ [RideAcceptance] Ride accepted successfully
✅ [UpdateRideStatus] SMS sent to driver and rider
```

**Error Indicators**:
```
❌ [Termii] DND SMS failed, considering generic fallback
❌ [RideDispatch] Failed to send SMS
❌ [Termii] Incoming SMS from: Driver not found
❌ [Termii] Webhook error
```

### Termii Dashboard Monitoring:

1. **Check API Balance**: https://dashboard.termii.com → Wallet
2. **Monitor SMS Sent**: https://dashboard.termii.com → Analytics
3. **View Webhook Logs**: https://dashboard.termii.com → Settings → Webhooks

---

## ⚠️ Common Issues & Solutions

### "Unauthorized" on Ride/Driver Endpoints
- Need to authenticate first as rider or driver
- Copy session token from login response
- Add to `Authorization: Bearer TOKEN` header

### "No driver phone numbers available"
- Drivers don't have phone numbers in database
- Check: `SELECT phone_number FROM users WHERE role = 'driver' LIMIT 1;`
- Add valid phone numbers to test drivers

### "Driver not found for incoming phone number"
- Webhook phone doesn't match any driver in database
- Change `"from"` in webhook payload to match actual driver phone

### SMS Not Sending (401 Unauthorized)
- Check API key: `TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK`
- Verify base URL: `https://v3.api.termii.com` (not old api.ng.termii.com)
- Check account balance in Termii dashboard

### Webhook Not Working
- Webhook URL should be: `https://charterkeke.vercel.app/api/webhooks/termii`
- For local testing: use ngrok to expose localhost
- Check webhook logs in Termii dashboard

---

## 💡 Pro Tips

1. **Use Environment Variables**
   - All credentials are in `.env.local`
   - No hardcoding needed

2. **Phone Number Formats**
   - ✅ International: `2347015250000`
   - ✅ With +: `+2347015250000`
   - ✅ National: `07015250000`
   - All automatically converted

3. **Ride IDs**
   - Generate UUID: https://www.uuidgenerator.net/
   - Or get from actual ride creation response

4. **Session Tokens**
   - Login to get token
   - Token valid for: 24 hours (check NextAuth config)
   - Paste in `Authorization: Bearer TOKEN`

5. **Monitor Costs**
   - Each SMS costs credits
   - Check balance: https://dashboard.termii.com
   - Current balance visible in SMS test response

---

## Next Steps

After successful testing:
1. ✅ Deploy backend to Vercel
2. ✅ Configure Termii webhook in dashboard
3. ✅ Test with real driver phone numbers
4. ✅ Monitor logs for 24 hours
5. ✅ Enable webhook signature verification when ready
