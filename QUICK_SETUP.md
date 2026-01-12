# Charter Keke - Quick Setup Guide

## 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Fill in all required values in .env.local
# - Supabase credentials
# - NextAuth secret
# - API keys for Termii, Resend, Paystack
# - Redis URL (optional)
```

## 2. Database Setup

### In Supabase Console:

1. Create a new PostgreSQL project
2. Run the SQL schema from `lib/db-schema.sql`:
   - Go to SQL Editor in Supabase console
   - Paste the entire SQL file content
   - Execute it
   - Wait for all tables and indexes to be created

3. Create Storage Bucket for Profile Pictures:
   - Go to Storage in Supabase console
   - Click "Create bucket"
   - Name: `profile-pictures`
   - Make it public (check "Public bucket")
   - Click "Create"
   - (Optional) Run this SQL in editor to ensure bucket exists:
   ```sql
   INSERT INTO storage.buckets (id, name, public) 
   VALUES ('profile-pictures', 'profile-pictures', true);
   ```

4. Set RLS Policies on Storage Bucket (optional but recommended):
   - Go to Storage > profile-pictures > Policies
   - Add policy to allow public read and authenticated write

### Create Initial Admin User (manually):

```sql
-- Run this in Supabase SQL editor
INSERT INTO users (
  id, first_name, last_name, email, phone_number, password_hash, role, status
) VALUES (
  gen_random_uuid(),
  'Admin',
  'User',
  'admin@charterkeke.com',
  '+2349000000000',
  '$2a$10$...',  -- bcrypt hash of password
  'super_admin',
  'active'
);

-- Get the user ID from the insert above, then create admin record
INSERT INTO admins (user_id, admin_level, permissions) VALUES (
  'user-id-here',
  'super',
  '{
    "view_users": true,
    "suspend_users": true,
    "view_drivers": true,
    "verify_drivers": true,
    "view_rides": true,
    "resolve_disputes": true,
    "adjust_wallets": true,
    "trigger_payouts": true,
    "view_system_logs": true,
    "view_notifications": true,
    "access_graphql": true
  }'
);
```

## 3. Install Dependencies

```bash
pnpm install
# or
npm install
```

## 4. Run Development Server

```bash
pnpm dev
# or
npm run dev
```

Visit `http://localhost:3000`

## 5. API Testing

### Register New User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+2349012345678",
    "password": "SecurePass123!",
    "role": "user"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Create a Ride

```bash
curl -X POST http://localhost:3000/api/rides \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_zone": "Debari",
    "pickup_description": "Near the main market",
    "destination_zone": "Yaba",
    "destination_description": "Yaba bus stop",
    "ride_type": "single"
  }'
```

## 6. Key Files & Directories

### Core System Files
- `lib/auth.ts` - NextAuth configuration
- `lib/supabase.ts` - Supabase client setup
- `lib/db-schema.sql` - Database schema
- `lib/notifications.ts` - Notification utilities
- `lib/utils-extra.ts` - Helper functions

### API Routes
- `app/api/auth/register` - User registration
- `app/api/auth/[...nextauth]` - Auth handler
- `app/api/rides` - Ride management
- `app/api/driver/available-rides` - Driver dispatch
- `app/api/driver/accept-ride` - Accept ride
- `app/api/wallet` - Wallet info
- `app/api/wallet/transactions` - Transaction history
- `app/api/admin/users` - Manage users
- `app/api/admin/drivers` - Manage drivers

### Documentation
- `SYSTEM_DOCUMENTATION.md` - Complete system docs
- `.env.example` - Environment template
- `lib/db-schema.sql` - Database schema

## 7. Important Constraints

### DO NOT:
- ❌ Add ad-hoc columns to the database
- ❌ Hardcode API keys or secrets
- ❌ Skip password hashing
- ❌ Bypass role-based access checks
- ❌ Create duplicate notification logic
- ❌ Trust client-side role claims

### DO:
- ✅ Fetch all data from database
- ✅ Enforce RBAC server-side
- ✅ Keep schemas locked after initial setup
- ✅ Use Supabase triggers for notifications
- ✅ Log all admin actions for audit
- ✅ Validate all user input

## 8. Common Issues

### "Table does not exist"
- Make sure you ran the schema SQL in Supabase
- Check that the database connection is working

### "Unauthorized" errors
- Verify NEXTAUTH_SECRET is set in .env.local
- Check session is being created (login first)
- Verify user role in database matches route requirements

### Notification not sending
- Check Termii API key is correct
- Verify phone number format is correct
- Check Supabase triggers are created
- Look at function logs in Supabase console

### Redis connection issues
- If using Redis: verify REDIS_URL is correct
- The app works without Redis (with reduced efficiency)
- Redis is optional and not critical

## 9. Next Steps

1. [ ] Set up Supabase project
2. [ ] Run database schema
3. [ ] Create first admin user
4. [ ] Configure environment variables
5. [ ] Test registration flow
6. [ ] Test login flow
7. [ ] Create sample rides
8. [ ] Test driver dispatch
9. [ ] Test notifications
10. [ ] Set up Termii for SMS
11. [ ] Set up Resend for email
12. [ ] Deploy to production

## 10. Support & Debugging

### Enable Verbose Logging
```typescript
// In auth.ts, set debug to true
NextAuth({
  debug: true, // Set to false in production
  ...
})
```

### Check Database
Use Supabase SQL editor to query tables:
```sql
SELECT * FROM users;
SELECT * FROM rides;
SELECT * FROM notifications WHERE read = false;
```

### Monitor API Calls
- Use browser DevTools Network tab
- Check terminal for request/response logs
- Review Supabase project activity logs

---

For detailed information, see `SYSTEM_DOCUMENTATION.md`
