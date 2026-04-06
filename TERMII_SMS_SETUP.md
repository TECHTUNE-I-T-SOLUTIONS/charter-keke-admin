# Termii SMS Integration Setup Guide

## Current Status

✅ **SMS Integration Complete** - The backend is now fully configured to send and receive SMS notifications using Termii API.

## Environment Configuration

Your `.env.local` now has the Termii configuration:

```env
TERMII_API_KEY=TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK
TERMII_SENDER_ID=charterkeke
TERMII_BASE_URL=https://v3.api.termii.com
TERMII_WEBHOOK_SECRET=tsk_iqQ6K3CQ6etPY0zs4EwHqJs0nT
TERMII_WEBHOOK_URL=https://charterkeke.vercel.app/api/webhooks/termii
TERMII_REQUIRE_WEBHOOK_SIGNATURE=false
TERMII_SMS_FALLBACK_TO_GENERIC=true
```

### Configuration Explanation:

- **TERMII_API_KEY**: Your Termii account API key for authentication
- **TERMII_SENDER_ID**: The display name for SMS (charterkeke)
- **TERMII_BASE_URL**: The v3 API endpoint (https://v3.api.termii.com)
- **TERMII_WEBHOOK_SECRET**: For validating webhook requests from Termii
- **TERMII_REQUIRE_WEBHOOK_SIGNATURE**: Set to false for development (verify webhook is working first, then enable signature validation)
- **TERMII_SMS_FALLBACK_TO_GENERIC**: Automatically fallback to generic channel if DND fails

## SMS Functionality Implemented

### 1. Ride Request SMS to Drivers
**Endpoint**: `/api/rides` (POST)
**Trigger**: When a rider creates a new ride
**Recipients**: All nearby available drivers
**Message Format**:
```
New ride CK-XXXXXXXX: Lekki Phase 1 -> VI. Fare: N2,500. Reply ACCEPT [rideId] to take this trip.
```

### 2. Ride Acceptance SMS
**Endpoint**: `/api/driver/accept-ride` (POST)
**Trigger**: When a driver accepts a ride (via app or SMS)
**Recipients**: Both driver and rider
**Driver Message**: "Ride [ID] accepted! You'll receive updates shortly."
**Rider Message**: "Your ride has been accepted! Driver [Name] will be with you shortly."

### 3. Trip Status Update SMS
**Endpoint**: `/api/driver/update-ride-status` (POST)
**Trigger**: When driver marks trip as in_progress or completed
**Recipients**: Both driver and rider

**When Trip Starts (in_progress)**:
- To Rider: "Trip started! Your driver [Name] is heading to [Pickup]."
- To Driver: "Trip XXXXXXXX started! Heading to [Pickup]."

**When Trip Completed**:
- To Rider: "Ride completed! Total fare: ₦X,XXX. Thank you for using Charter Keke."
- To Driver: "Ride XXXXXXXX completed! Fare: ₦X,XXX. Thank you!"

### 4. Ride Request SMS Acceptance via SMS
**Endpoint**: `/api/webhooks/termii` (POST - Webhook)
**Trigger**: When driver replies to the ride request SMS with "ACCEPT [rideId]"
**Action**: 
- Looks up driver by phone number
- Marks ride as accepted
- Sends confirmation notifications to both parties

## Testing the SMS Service

### Option 1: Using the Test Endpoint

**URL**: `http://localhost:3000/api/termii/test`

**Method**: GET (to see instructions) or POST (to send test SMS)

#### Simple SMS Test
```bash
curl -X POST http://localhost:3000/api/termii/test \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "simple",
    "phone": "+234901234567",
    "message": "Test SMS from Charter Keke"
  }'
```

#### Ride Request SMS Test
```bash
curl -X POST http://localhost:3000/api/termii/test \
  -H "Content-Type: application/json" \
  -d '{
    "testType": "ride",
    "phone": "+234901234567",
    "rideId": "550e8400-e29b-41d4-a716-446655440000",
    "pickup": "Lekki Phase 1",
    "destination": "Victoria Island",
    "fare": 2500
  }'
```

### Option 2: Using Postman

1. Create a new POST request to: `http://localhost:3000/api/termii/test`
2. Set Body to raw JSON:
```json
{
  "testType": "simple",
  "phone": "+234901234567",
  "message": "Testing Termii SMS"
}
```
3. Send and check response

## Setting Up Webhook in Termii Dashboard

### Step 1: Access Termii Dashboard
1. Go to https://dashboard.termii.com (or your Termii account)
2. Log in with your credentials
3. Navigate to **Settings** or **Webhooks** section

### Step 2: Configure Webhook URL
1. Find the Webhook URL configuration
2. Set the webhook URL to: **`https://charterkeke.vercel.app/api/webhooks/termii`**
   - ✅ This is the correct production URL
   - For local development with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/termii`
3. Select event types to receive:
   - ✅ **Incoming SMS** (for ride request acceptance via SMS)
   - ✅ **Delivery Report** (optional, to track SMS delivery)

### Step 3: Webhook Events Configuration
The webhook should be configured to receive:
- **Event Type**: `incoming_sms` - When a driver replies to the SMS
- **URL**: Your API endpoint
- **Method**: POST

### Step 4: Test Webhook (Optional)
Termii provides a test button in the dashboard. Click "Test Webhook" to verify it's working.

## SMS Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ Rider Creates Ride (/api/rides)                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ├─→ Push Notification to Nearby Drivers
                 └─→ SMS to Nearby Drivers
                    "New ride CK-XXXX: Pickup -> Destination
                     Fare: N2500. Reply ACCEPT [rideId]"
                 │
┌────────────────▼────────────────────────────────────┐
│ Driver Options:                                      │
├──────────────────────────────────────────────────────┤
│ Option A: Accept via App (/api/driver/accept-ride) │
│ Option B: Accept via SMS (replies "ACCEPT [rideId]")│
└────────────────┬────────────────────────────────────┘
                 │
                 ├─→ Termii Webhook (/api/webhooks/termii)
                 │   (receives driver's SMS reply)
                 │
┌────────────────▼────────────────────────────────────┐
│ Driver Acceptance Processed                         │
├──────────────────────────────────────────────────────┤
│ ✓ Ride marked as accepted                          │
│ ✓ Push notification to rider                       │
│ ✓ SMS to rider: "Driver accepted your ride"       │
│ ✓ SMS to driver: "Ride accepted confirmation"     │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Driver Marks Trip In Progress                       │
│ (/api/driver/update-ride-status)                   │
├──────────────────────────────────────────────────────┤
│ ✓ Push notification to both                         │
│ ✓ SMS to rider: "Driver on the way"                │
│ ✓ SMS to driver: "Trip started"                    │
└────────────────┬────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────┐
│ Driver Completes Ride                              │
│ (/api/driver/update-ride-status)                   │
├──────────────────────────────────────────────────────┤
│ ✓ Push notification to both                         │
│ ✓ SMS to rider: "Ride completed, fare: N2500"      │
│ ✓ SMS to driver: "Ride completed, thank you!"      │
└─────────────────────────────────────────────────────┘
```

## Troubleshooting

### SMS Not Sending to Drivers

1. **Check API Credentials**
   - Verify `TERMII_API_KEY` in `.env.local`
   - Check Termii dashboard for API key validity
   - Ensure account has sufficient credits

2. **Check Base URL**
   - Should be: `https://v3.api.termii.com`
   - ❌ OLD: `https://api.ng.termii.com` (no longer works)

3. **Check Phone Numbers**
   - Must be in international format (e.g., 234XXXXXXXXXX)
   - Accepted formats:
     - ✅ `2347015250000` (Nigerian)
     - ✅ `+234701525000` (with +)
     - ✅ `07015250000` (Nigerian national format)
   - Use `/api/termii/test` endpoint to validate phone number conversion

4. **Check Sender ID**
   - Sender ID must be approved in Termii: `charterkeke`
   - If SMS fails, check Termii dashboard under "Sender IDs"

5. **Check Logs**
   - Check backend server logs for `[Termii]` messages
   - Check `[RideDispatch]` messages for SMS task failures

### Webhook Not Receiving SMS Replies

1. **Verify Webhook URL** in Termii dashboard:
   - ✅ Must be publicly accessible (use ngrok for local development)
   - ✅ Must point to `/api/webhooks/termii`
   - ✅ Must use HTTPS (if not ngrok, use production HTTPS)

2. **Test Webhook Delivery**
   - Use test endpoint to send SMS
   - Check if webhook receives the incoming SMS event
   - Look for `[Termii] Webhook received` in logs

3. **Check Phone Number Matching**
   - Driver phone in database must match the phone in SMS
   - Use phone number normalization: all converted to international format

4. **Check Event Type**
   - Webhook expects event type: `incoming_sms`
   - Or system auto-detects if event type is not provided

### High Credit Usage

- Each SMS costs credits from your Termii account
- Monitor usage in Termii dashboard
- SMS is sent to all available drivers for each ride request
- Consider filtering drivers by proximity to reduce SMS count

## Production Checklist

Before deploying to production:

- [ ] Update TERMII_BASE_URL to match your Termii region (already set to v3)
- [ ] Verify all phone numbers are in correct format
- [ ] Set TERMII_REQUIRE_WEBHOOK_SIGNATURE to `true` and verify signature validation works
- [ ] Configure webhook URL in Termii dashboard (production URL)
- [ ] Test SMS sending with a test ride
- [ ] Test SMS acceptance with a test driver reply
- [ ] Monitor Termii API usage and credit balance
- [ ] Set up alerts for low credit balance
- [ ] Test fallback behavior (DND -> Generic) if needed

## API Reference

### sendRideRequestSMS (termii.ts)
```typescript
sendRideRequestSMS({
  to: string              // Driver phone number
  rideId: string         // UUID of the ride
  pickup: string         // Pickup location
  destination: string    // Destination location
  fare: number          // Fare amount
})
```

### sendRideAcceptanceSMS (termii.ts)
```typescript
sendRideAcceptanceSMS(
  driverPhone: string,   // Phone number
  rideId: string,        // Ride UUID
  riderName?: string     // Optional rider name
)
```

### sendRideStatusUpdateSMS (termii.ts)
```typescript
sendRideStatusUpdateSMS(
  driverPhone: string,   // Phone number
  rideId: string,        // Ride UUID
  status: string,        // "in_progress" | "completed"
  message?: string       // Optional custom message
)
```

### sendBulkSMS (termii.ts)
```typescript
sendBulkSMS(
  phoneNumbers: string[],              // Array of phone numbers
  message: string,                     // Message to send
  channel?: "generic" | "dnd"          // SMS channel
)
```

## Support

For issues with Termii:
- Check Termii documentation: https://developers.termii.com
- Contact Termii support for API issues
- Check webhook logs in Termii dashboard

For issues with Charter Keke integration:
- Check server logs for `[Termii]` messages
- Verify all environment variables are set
- Test using `/api/termii/test` endpoint
