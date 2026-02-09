# 🔐 Authentication Token Fix - Backend

## Problem Identified
The mobile app (ck) was receiving **401 Unauthorized** errors even after successful token refresh, despite sending valid Bearer tokens.

### Root Cause
- **Token Refresh** was working correctly (returning 200)
- Backend API routes were rejecting the custom Bearer tokens from the mobile app
- Issue: `getSessionFromRequest()` function in `lib/auth.ts` only validated **NextAuth JWT tokens** (web app format)
- Mobile app sends **custom Bearer tokens** (base64 encoded: `userId:timestamp`)
- These are two completely different token formats causing validation failures

## Log Trail
```
✅ POST /api/auth/refresh 200  ← Token refresh successful
❌ GET /api/driver/status 401   ← But token rejected here
❌ GET /api/driver/details 401  ← And here
❌ GET /api/driver/active-rides 401 ← And here
```

## Solution Implemented ✅

### File Modified: `lib/auth.ts`

Updated `getSessionFromRequest()` function to support **both token types**:

1. **First attempt**: Validate NextAuth JWT token (for web app)
2. **Fallback**: Validate custom Bearer token (for mobile app)
   - Extract from `Authorization: Bearer <token>` header
   - Decode base64 token to extract userId
   - Verify user exists and is active in database
   - Return session with user data

### Changes Made

```typescript
// OLD: Only supported NextAuth tokens
const token = await getToken({ req: request, secret });
if (!token) return null;

// NEW: Supports both NextAuth and custom Bearer tokens
// 1. Try NextAuth first
const nextAuthToken = await getToken({ req: request, secret });
if (nextAuthToken) return session;

// 2. Fall back to custom Bearer token
const authHeader = request.headers.get("authorization");
if (authHeader?.startsWith("Bearer ")) {
  const customToken = authHeader.substring(7);
  const decoded = Buffer.from(customToken, "base64").toString("utf-8");
  const [userId] = decoded.split(":");
  // Validate and return session
}
```

## Affected API Routes
All driver API routes now properly authenticate mobile app requests:
- ✅ `GET /api/driver/status`
- ✅ `GET /api/driver/details`
- ✅ `GET /api/driver/active-rides`
- ✅ `PUT /api/driver/status`
- And all other driver endpoints using `getSessionFromRequest()`

## Testing
After this fix, the mobile app should:
1. ✅ Successfully refresh tokens
2. ✅ Make authenticated API calls with Bearer tokens
3. ✅ Receive 200 responses instead of 401

## Debug Logging Added
New console logs for troubleshooting:
```
🔐 [AUTH] Validating custom Bearer token
✅ [AUTH] Custom Bearer token validated for user: <userId>
❌ [AUTH] Invalid custom token format
❌ [AUTH] User not found for custom token
❌ [AUTH] User is not active
```

## Important Notes
- ⚠️ Token refresh endpoint (`/api/auth/refresh`) already works correctly
- ⚠️ Custom tokens are NOT JWTs - they're simple base64 encoded strings
- ⚠️ If issues persist, check that mobile app is sending correct Bearer token format
