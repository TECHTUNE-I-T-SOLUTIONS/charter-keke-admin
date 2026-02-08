# Admin Authentication Setup Checklist

## Database Setup

### 1. Add Password Reset Fields to Users Table
Run this SQL to add password reset functionality:

```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Ensure realtime is enabled for users table
ALTER TABLE users REPLICA IDENTITY FULL;
```

### 2. Verify Admins Table Exists
The admins table should already exist with this structure:

```sql
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  admin_level VARCHAR(50) NOT NULL DEFAULT 'support' 
    CHECK (admin_level IN ('support', 'ops', 'finance', 'super')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_level ON admins(admin_level);
```

## File Structure Created

### Auth Pages
- `/auth/admin/login` - Admin login page
- `/auth/admin/signup` - Admin access request form  
- `/auth/admin/forgot-password` - Password reset request
- `/auth/admin/reset-password` - Password reset form (with token validation)

### API Routes
- `POST /api/auth/admin/request-access` - Submit admin access request
- `POST /api/auth/admin/forgot-password` - Send password reset link
- `GET /api/auth/admin/validate-reset-token` - Validate reset token
- `POST /api/auth/admin/reset-password` - Reset password with token

### Updated Configuration
- **Middleware**: Added admin auth routes to public routes list
- **NextAuth**: Updated to include `status` field in JWT and session
- **Admin Pages**: Updated ProtectedRoute to include both "admin" and "super_admin" roles
- **Documentation**: Created ADMIN_AUTH_DOCUMENTATION.md with full details

## Environment Variables Required

Ensure these are set in `.env.local`:

```
NEXTAUTH_URL=http://localhost:3000  # or your production URL
NEXTAUTH_SECRET=your-long-random-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing the Admin Auth System

### 1. Create a Super Admin Account
```sql
INSERT INTO users (first_name, last_name, email, phone_number, password_hash, role, status, profile_complete)
VALUES (
  'Super', 'Admin', 'admin@charterkeke.com', '+2341234567890',
  '$2a$10$...',  -- bcrypt hash of your chosen password
  'super_admin', 'active', true
);
```

### 2. Test Login Flow
1. Go to `/auth/admin/login`
2. Enter admin email and password
3. Should redirect to `/admin/dashboard`

### 2. Test Signup Request Flow
1. Go to `/auth/admin/signup`
2. Fill in details and reason
3. Should show success message (status='pending' created with role='admin')
4. Super admin can find pending requests by querying: `SELECT * FROM users WHERE role='admin' AND status='pending'`

### 4. Test Forgot Password
1. Go to `/auth/admin/forgot-password`
2. Enter admin email
3. Check database for password_reset_token
4. Use token to access `/auth/admin/reset-password?token=xxx`

## Features Implemented

✅ Admin login with email/password
✅ Admin signup with access request (pending approval)
✅ Forgot password with secure token
✅ Password reset with token validation
✅ Protected admin dashboard pages
✅ NextAuth JWT strategy with admin fields
✅ Username/password reset fields in users table
✅ Middleware allows admin auth routes
✅ ProtectedRoute wrapper for admin pages

## TODO - Future Enhancements

- [ ] Email service integration for password reset links
- [ ] Email notifications for admin access requests
- [ ] Super admin approval interface
- [ ] Two-factor authentication (2FA)
- [ ] Rate limiting on auth endpoints
- [ ] Audit logging for admin actions
- [ ] API key generation for admins
- [ ] Admin level permissions enforcement
- [ ] Session activity logging
- [ ] IP-based access restrictions

## Admin Statuses Explained

- `active`: Admin can login and access dashboard
- `pending`: Admin request waiting for super admin review (role='admin', status='pending')
- `suspended`: Admin account disabled, cannot login

## Admin Levels Explained

- `support`: Support team admin
- `ops`: Operations admin
- `finance`: Finance/payments admin  
- `super`: Super administrator with full system access

## Security Notes

1. **Password Hashing**: All passwords hashed with bcrypt (salt rounds = 10)
2. **Reset Tokens**: SHA256 hashed, stored as hash, expires in 1 hour
3. **Session Security**: JWT tokens, HTTPS only in production
4. **CSRF Protection**: Built-in NextAuth CSRF tokens
5. **Status Validation**: Only 'active' admins can login

## Troubleshooting

### "Invalid admin credentials" error
- Check user status is 'active'
- Check role is 'admin' or 'super_admin'
- Verify password hash is correct

### Reset token validation fails
- Check token hasn't expired (now() > password_reset_expiry)
- Verify token is correctly hashed (SHA256)
- Ensure table has password_reset_token column

### ProtectedRoute redirects to login
- Check session is being created correctly
- Verify ProtectedRoute allowedRoles includes user's role
- Check NextAuth callbacks are working

## Quick SQL Queries

### Check admin users
```sql
SELECT id, email, role, status FROM users WHERE role IN ('admin', 'super_admin');
```

### Find pending admin requests
```sql
SELECT id, email, first_name, last_name, created_at FROM users WHERE role = 'admin' AND status = 'pending';
```

### Approve an admin
```sql
UPDATE users SET status = 'active' WHERE id = '...' AND role = 'admin';
INSERT INTO admins (user_id, admin_level) VALUES ('...', 'support');
```

### Check password reset tokens
```sql
SELECT id, email, password_reset_expiry FROM users WHERE password_reset_token IS NOT NULL;
```

## Links

- Admin Login: `http://localhost:3000/auth/admin/login`
- Admin Signup: `http://localhost:3000/auth/admin/signup`
- Forgot Password: `http://localhost:3000/auth/admin/forgot-password`
- Admin Dashboard: `http://localhost:3000/admin/dashboard` (protected)
