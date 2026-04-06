# 🚀 Termii Webhook - Quick Testing & Deployment Guide

## 1️⃣ Pre-Deployment Checklist

### Backend Setup
- [ ] Run database migrations to create `otps` table
  ```bash
  npm run db:migrate
  ```
- [ ] Verify migrations in Supabase dashboard
- [ ] Set environment variables in `.env.local`:
  ```env
  TERMII_API_KEY=TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK
  TERMII_WEBHOOK_SECRET=tsk_iqQ6K3CQ6etPY0zs4EwHqJs0nT  # Optional
  TERMII_REQUIRE_WEBHOOK_SIGNATURE=false  # Optional
  ```

### Database Verification
```sql
-- Check OTP table exists
\dt otps

-- Check ride-related tables
\dt rides
\dt drivers
\dt users

-- Check ride statuses are working
SELECT DISTINCT status FROM rides;
```

---

## 2️⃣ Local Testing

### Start Backend Server
```bash
npm run dev
# Should show: ▲ Next.js 14.0.0
# Ready in: 1.23s on 0.0.0.0:3000
```

### Test 1: Basic Webhook Acceptance
```bash
curl -X POST http://localhost:3000/api/webhooks/termii \
  -H "Content-Type: application/json" \
  -d '{
    "type": "inbound",
    "sender": "2347069549231",
    "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "received": true,
  "accepted": true,
  "rideId": "550e8400-e29b-41d4-a716-446655440000",
  "driverUserId": "driver-user-id"
}
```

### Test 2: Driver Not Found
```bash
curl -X POST http://localhost:3000/api/webhooks/termii \
  -H "Content-Type: application/json" \
  -d '{
    "type": "inbound",
    "sender": "2349999999999",
    "message": "ACCEPT 550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Expected Response:**
```json
{
  "received": true,
  "ignored": true,
  "reason": "Driver not found for incoming phone number"
}
```

### Test 3: Invalid ACCEPT Command
```bash
curl -X POST http://localhost:3000/api/webhooks/termii \
  -H "Content-Type: application/json" \
  -d '{
    "type": "inbound",
    "sender": "2347069549231",
    "message": "Hello, this is just a regular message"
  }'
```

**Expected Response:**
```json
{
  "received": true,
  "ignored": true,
  "reason": "No valid ACCEPT command with ride ID"
}
```

### Test 4: Ride Already Taken
```bash
# (Device: First driver sends ACCEPT - success)
curl -X POST http://localhost:3000/api/webhooks/termii \
  -d '{"type": "inbound", "sender": "2347069549231", "message": "ACCEPT 550e8400..."}'

# (Device: Second driver sends ACCEPT - should fail)
curl -X POST http://localhost:3000/api/webhooks/termii \
  -d '{"type": "inbound", "sender": "2348888888888", "message": "ACCEPT 550e8400..."}'
```

**Expected Second Response:**
```json
{
  "received": true,
  "accepted": false,
  "reason": "Ride already taken"
}
```

### Backend Logs to Look For
```
[Termii] Webhook received: { type: "inbound", sender: "...", message: "..." }
[Termii-Webhook] Incoming SMS from: 2347069549231 Message: ACCEPT 550e8400...
[Termii-Webhook] ACCEPT command found, rideId: 550e8400-...
[Termii-Webhook] Driver found: ff123456-...
[RideAcceptance] Attempting to accept ride: { rideId: '550e8400-...', driverUserId: '...' }
[RideAcceptance] Driver found: dd123456-...
[RideAcceptance] ✅ Ride updated successfully
[Termii-Webhook] ✅ Ride accepted successfully
```

---

## 3️⃣ Using ngrok for Local Testing with Real Termii

### Install & Start ngrok
```bash
# Download from: https://ngrok.com/download
ngrok http 3000
# Output: Forwarding https://abc123def456.ngrok.io -> http://localhost:3000
```

### Update Termii Webhook URL
1. Go to: https://termii.com/dashboard
2. Navigate to: Settings → Webhooks → Incoming Messages
3. Set Webhook URL: `https://abc123def456.ngrok.io/api/webhooks/termii`
4. Save configuration

### Test With Real SMS
1. Get any phone number
2. Send SMS to your Termii shortcode with message: `ACCEPT [ride-id]`
3. Watch ngrok log and backend logs for webhook processing
4. Verify ride was updated in database

---

## 4️⃣ Deployment to Production

### Step 1: Deploy Backend
```bash
# Commit changes
git add -A
git commit -m "feat: Implement Termii webhook for SMS ride acceptance"

# Push to Vercel (auto-deploys)
git push origin main
# Monitor deployment at: https://vercel.com/dashboard

# Alternative: Manual deploy
vercel deploy --prod
```

### Step 2: Update Environment Variables in Vercel
1. Go to: https://vercel.com/dashboard
2. Select project: **easely**
3. Settings → Environment Variables
4. Add/Update:
   ```
   TERMII_API_KEY=TLAVibfUbePidfNsbHPATGNlpBJouvXiuEthLIJJGlHXuTEkQmFmRSVvEXMPNK
   TERMII_WEBHOOK_SECRET=tsk_iqQ6K3CQ6etPY0zs4EwHqJs0nT  (optional)
   TERMII_REQUIRE_WEBHOOK_SIGNATURE=false  (optional)
   ```

### Step 3: Update Termii Webhook Configuration
1. Go to: https://termii.com/dashboard
2. Settings → Webhooks → Incoming Messages
3. Set Webhook URL: `https://easely-abc.vercel.app/api/webhooks/termii`
   - Replace with your actual Vercel domain
   - Can find at: https://vercel.com/dashboard > easely > Domains
4. Test webhook using Termii dashboard webhook tester

### Step 4: Verify Deployment
```bash
# Test endpoint is live
curl https://easely-abc.vercel.app/api/webhooks/termii \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"type": "inbound", "sender": "2347069549231", "message": "test"}'

# Check Vercel logs
# https://vercel.com/dashboard > easely > Deployments > [latest] > Logs
```

---

## 5️⃣ Production Testing

### Test 1: End-to-End Real SMS Flow
1. **Rider**: Create a ride request via mobile app
2. **System**: Should send SMS to 5 nearby drivers
3. **Driver**: Receive SMS with: `"Reply: ACCEPT [ride-id]"`
4. **Driver**: Send SMS reply with: `"ACCEPT [ride-id]"`
5. **Webhook**: Receives SMS from Termii
6. **Database**: Ride status changes to "accepted"
7. **Driver**: Receives SMS: `"✅ RIDE ACCEPTED - CK-[ride-id]"`
8. **Rider**: Receives SMS: `"✅ Driver found - [Driver Name]"`

### Test 2: Multiple Drivers (First-Come-First-Served)
1. **Rider**: Create ride
2. **Driver 1**: Receive SMS, reply ACCEPT immediately
3. **Driver 2**: Receive SMS, reply ACCEPT 2 seconds later
4. **Expected**: Ride assigned to Driver 1
5. **Driver 2**: Should NOT see ride accepted (may receive new ride offer)

### Test 3: Invalid Commands
1. **Driver**: Reply with: `"OK"` (no ACCEPT)
2. **Webhook**: Should ignore (log: "No valid ACCEPT command")
3. **Ride**: Should stay pending

### Test 4: Unknown Driver
1. **System**: Simulate SMS from unknown phone number
2. **Webhook**: Should ignore (log: "Driver not found")
3. **No database changes** should occur

---

## 6️⃣ Monitoring & Debugging

### Check Vercel Logs
```
https://vercel.com/dashboard 
→ easely project 
→ Deployments tab 
→ Click latest deployment 
→ Function Logs

Filter by:
- [Termii-Webhook]
- [RideAcceptance]
```

### Check Termii Dashboard
1. https://termii.com/dashboard
2. Logs section → Webhooks
3. See all incoming webhook calls
4. View payload and response for each

### Check Database
```sql
-- Verify ride was accepted
SELECT id, status, driver_id, updated_at 
FROM rides 
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Check dispatch logs
SELECT * 
FROM ride_dispatch_logs 
WHERE ride_id = '550e8400-e29b-41d4-a716-446655440000' 
ORDER BY created_at DESC;

-- See all recent ride acceptances
SELECT id, status, driver_id, updated_at 
FROM rides 
WHERE status = 'accepted' 
ORDER BY updated_at DESC 
LIMIT 10;
```

---

## 7️⃣ Issues & Solutions

### Problem: Webhook Not Receiving from Termii
**Check List:**
1. ✅ Is webhook URL set in Termii dashboard?
2. ✅ Is URL publicly accessible? Test: `curl https://your-domain.vercel.app/api/webhooks/termii` -X POST
3. ✅ Are environment variables set on Vercel?
4. ✅ Is SMS event type correct? (Should be "inbound")
5. ✅ Check Vercel logs for 404 or 500 errors

**Solution:**
```bash
# Check endpoint exists
curl -I https://your-domain.vercel.app/api/webhooks/termii

# Should return: 405 Method Not Allowed
# This means the endpoint exists, just needs POST

# If you get 404, endpoint doesn't exist
# Check deployment completed, URL is correct
```

### Problem: "Driver not found"
**Check List:**
1. ✅ Does driver exist in `users` table with role='driver'?
   ```sql
   SELECT id, phone_number FROM users WHERE role = 'driver';
   ```
2. ✅ Is phone number exact match?
3. ✅ Check phone formatting (should include country code, e.g., 2347069549231)

**Solution:**
```sql
-- Add driver if missing
INSERT INTO users (id, first_name, last_name, phone_number, role, password_hash)
VALUES (
  gen_random_uuid(),
  'Test',
  'Driver',
  '2347069549231',
  'driver',
  crypt('password123', gen_salt('bf'))
);

-- Then create driver record
INSERT INTO drivers (id, user_id, vehicle_type, availability_status)
VALUES (gen_random_uuid(), (SELECT id FROM users WHERE phone_number = '2347069549231'), 'sedan', true);
```

### Problem: "Ride already taken"
**Expected Behavior:**
- First driver to accept: ✅ Success
- Second driver (same ride): ❌ "Ride already taken" (409)
- This is correct! Ride dispatch should prevent multiple assignments

**Solution:**
- Create a new ride to test
- Or use different ride ID in test message

### Problem: 500 Server Error
**Check:**
1. Vercel logs for error message
2. Check database connection (SUPABASE_URL and SUPABASE_ANON_KEY)
3. Check supabaseAdmin is initialized properly
4. Error might be in ride-acceptance.ts logic

**Common Causes:**
```
Error: SUPABASE_URL not set
→ Add to Vercel environment variables

Error: Database connection failed
→ Check URL is correct and connection is active

Error: acceptRideFirstCome() threw
→ Check rides table structure, verify columns exist
```

---

## 8️⃣ Quick Deployment Summary

**Before Deploying:**
- [ ] Database migrations run (`otps` table created)
- [ ] Environment variables set in Vercel
- [ ] Webhook endpoint tested locally (curl)
- [ ] Code committed and pushed

**Deployment Steps:**
```bash
# 1. Verify local setup
npm run dev
curl -X POST http://localhost:3000/api/webhooks/termii \
  -H "Content-Type: application/json" \
  -d '{"type":"inbound","sender":"test","message":"test"}'

# 2. Deploy to Vercel
git add -A
git commit -m "feat: Implement Termii webhook"
git push origin main
# Vercel auto-deploys

# 3. Update Termii dashboard
# Settings → Webhooks → https://your-domain.vercel.app/api/webhooks/termii

# 4. Test with real SMS
# Send: ACCEPT [ride-id] to your number
# Webhook should accept ride automatically

# 5. Monitor
# Vercel logs: https://vercel.com/dashboard
# Termii logs: https://termii.com/dashboard
```

---

All set! The webhook is ready for production. 🎉
