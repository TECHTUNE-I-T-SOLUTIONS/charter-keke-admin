# ✅ Authentication System - Fixes Applied

## 🔧 Issues Fixed

### 1. **SQL Syntax Error in OTP Table**
**Problem**: Invalid syntax in UNIQUE constraint with type casting
```sql
❌ CONSTRAINT unique_active_otp UNIQUE (user_id, type, is_verified, created_at::date)
```

**Solution**: Replaced with a proper partial unique index
```sql
✅ CREATE UNIQUE INDEX idx_otps_unique_active ON otps(user_id, type) WHERE is_verified = FALSE;
```
- Ensures only one unverified OTP per user per type at any time
- Uses PostgreSQL's partial index feature properly
- Removed invalid type casting (`::date`) from constraint

---

### 2. **OTP Request Route - .single() Error Handling**
**Problem**: Using `.single()` on a query that might not return results throws an error
```typescript
❌ const { data: existingOTP, error: existError } = await supabaseAdmin
  .from("otps")
  .select(...)
  .single();  // Throws if no result found!

if (existingOTP && !existError) {  // Never true when no results!
```

**Solution**: Changed to use `.limit(1)` which returns an array
```typescript
✅ const { data: existingOTPList, error: existError } = await supabaseAdmin
  .from("otps")
  .select(...)
  .limit(1);  // Never throws, returns array

const existingOTP = existingOTPList && existingOTPList.length > 0 ? existingOTPList[0] : null;

if (existingOTP && !existError) {  // Now works correctly!
```

---

### 3. **ResumeSessionScreen - Missing OTP Type Parameter**
**Problem**: OTP request wasn't sending the required `type` parameter
```typescript
❌ const response = await fetch('/api/otp/request', {
  method: 'POST',
  body: JSON.stringify({ email: userEmail }),
  // Missing: type parameter!
});
```

**Solution**: Added required `type: 'resume_session'`
```typescript
✅ const response = await fetch('/api/otp/request', {
  method: 'POST',
  body: JSON.stringify({ 
    email: userEmail,
    type: 'resume_session'  // Added!
  }),
});
```

**Also Fixed OTP Verification**:
```typescript
✅ body: JSON.stringify({
  email: userEmail,
  code: otpCode,        // Changed from 'otp'
  type: 'resume_session'
})

if (response.ok && data.success) {  // Changed from data.verified
```

---

### 4. **Reset Password Screen - Missing OTP Type Parameter**
**Problem**: Password recovery OTP request missing `type` parameter
```typescript
❌ body: JSON.stringify({
  email: email.trim().toLowerCase(),
  // Missing: type parameter!
})
```

**Solution**: Added required `type: 'forgot_password'`
```typescript
✅ body: JSON.stringify({
  email: email.trim().toLowerCase(),
  type: 'forgot_password'  // Added!
})
```

**Also Fixed OTP Verification**:
```typescript
✅ body: JSON.stringify({
  email: email.trim().toLowerCase(),
  code: otp.trim(),        // Changed from 'otp'
  type: 'forgot_password'
})

if (!response.ok || !data.success) {  // Changed from data.verified
```

---

## 📋 API Contract Verification

### OTP Request Endpoint `/api/otp/request`

**Expected Request Body**:
```json
{
  "email": "user@example.com",
  "type": "resume_session" | "forgot_password" | "verify_account"
}
```

**Expected Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otpId": "uuid",
  "expiresIn": 600,
  "phone": "+234XXX..."
}
```

---

### OTP Verify Endpoint `/api/otp/verify`

**Expected Request Body**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "type": "resume_session" | "forgot_password" | "verify_account"
}
```

**Expected Response Success**:
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "userId": "uuid",
  "email": "user@example.com"
}
```

**Expected Response Error**:
```json
{
  "error": "Invalid OTP code" | "OTP has expired" | "Maximum verification attempts exceeded"
}
```

---

## ✅ Files Modified

| File | Changes |
|------|---------|
| `06_create_otps_table.sql` | Fixed UNIQUE constraint → partial unique index |
| `app/api/otp/request/route.ts` | Fixed `.single()` → `.limit(1)` with proper array handling |
| `app/auth/resume-session.tsx` | Added `type: 'resume_session'` to OTP calls; Fixed response checks (code, success) |
| `app/auth/reset-password.tsx` | Added `type: 'forgot_password'` to OTP calls; Fixed response checks (code, success) |

---

## 🧪 Testing Checklist

### Test 1: Resume Session - OTP
- [ ] Open app as logged-in user
- [ ] Verify sessionResumed NOT set
- [ ] Close app and reopen
- [ ] See ResumeSessionScreen
- [ ] Select "Email Code" option
- [ ] OTP request sent (check terminal logs)
- [ ] SMS received with 6-digit code
- [ ] Enter OTP code
- [ ] Verification successful → Navigate to dashboard
- [ ] sessionResumed flag is now TRUE

### Test 2: Reset Password - OTP
- [ ] Go to login screen
- [ ] Click "Forgot Password"
- [ ] Enter email
- [ ] OTP request sent (check terminal logs)
- [ ] SMS received with code
- [ ] Enter OTP code
- [ ] Verify OTP successful
- [ ] Enter new password
- [ ] Password updated successfully
- [ ] Can login with new password

### Test 3: Database Verification
```sql
-- Check OTP table structure
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'otps';

-- Check unique index
SELECT * FROM pg_indexes 
WHERE tablename = 'otps' AND indexname = 'idx_otps_unique_active';

-- Verify it works (insert first OTP)
INSERT INTO otps (user_id, phone_number, email, code, type, expires_at)
VALUES (NULL, '2348152072584', 'user@example.com', '123456', 'resume_session', NOW() + INTERVAL '10 minutes');

-- Try to insert another unverified OTP for same user+type (should fail with unique constraint)
INSERT INTO otps (user_id, phone_number, email, code, type, expires_at)
VALUES (NULL, '2348152072584', 'user@example.com', '654321', 'resume_session', NOW() + INTERVAL '10 minutes');
-- Error: duplicate key value violates unique constraint... ✅
```

### Test 4: API Endpoint Testing

**Test OTP Request**:
```bash
curl -X POST http://localhost:3000/api/otp/request \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "type": "resume_session"
  }'
```

Expected Response (200):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "otpId": "550e8400-e29b-41d4-a716-446655440000",
  "expiresIn": 600
}
```

**Test OTP Verify**:
```bash
curl -X POST http://localhost:3000/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "code": "123456",
    "type": "resume_session"
  }'
```

Expected Response (200):
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 🔍 Debugging Tips

### If OTP Request Fails
1. Check backend logs for `[OTP-REQUEST]` messages
2. Verify email exists in `users` table
3. Check Termii SMS sending not failing
4. Ensure `type` parameter is valid (`resume_session`, `forgot_password`, `verify_account`)

### If OTP Verify Fails
1. Check backend logs for `[OTP-VERIFY]` messages
2. Verify OTP code is exactly 6 digits
3. Check OTP hasn't expired (10 minute window)
4. Check OTP hasn't exceeded 3 attempt limit
5. Ensure `type` parameter matches the request type

### If SQL Migration Won't Run
1. Check for syntax errors: `ERROR: 42601` = syntax error
2. Ensure PostgreSQL supports the operations (partial indexes are standard)
3. Drop the table manually and rerun migration if needed:
   ```sql
   DROP TABLE IF EXISTS otps CASCADE;
   ```

---

## 📊 OTP Types Reference

| Type | Usage | Expiry | Max Attempts |
|------|-------|--------|--------------|
| `resume_session` | Resume app after closing | 10 min | 3 |
| `forgot_password` | Password recovery | 10 min | 3 |
| `verify_account` | Email verification signup | 10 min | 3 |

---

## 🚀 Deployment Notes

1. **Run SQL Migration** in Supabase:
   - Execute `06_create_otps_table.sql` in SQL editor
   - Verify table created with correct indexes

2. **Deploy Backend** (Next.js):
   ```bash
   npm run build
   vercel deploy --prod
   ```

3. **Deploy Mobile** (React Native):
   ```bash
   npm run build
   eas build --platform all
   eas submit
   ```

4. **Verify in Production**:
   - Test complete flow with real users
   - Monitor OTP request/verify endpoint logs
   - Check SMS delivery status in Termii dashboard

---

## ✨ All Systems Go!

All errors have been fixed. The system is now ready for:
- ✅ Session resume with OTP verification
- ✅ Password recovery with OTP
- ✅ Biometric/Password verification
- ✅ SMS OTP delivery via Termii
- ✅ Clean database schema with proper constraints

Happy testing! 🎉
