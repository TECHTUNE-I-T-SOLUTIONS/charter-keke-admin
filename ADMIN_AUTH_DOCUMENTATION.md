/**
 * Admin Authentication System Documentation
 * ==========================================
 * 
 * This system provides complete admin authentication using NextAuth.
 * Admins have a separate auth flow from regular users and drivers.
 * 
 * ## Features
 * - Admin Login (/auth/admin/login)
 * - Admin Signup Request (/auth/admin/signup) - pending super admin approval
 * - Forgot Password (/auth/admin/forgot-password)
 * - Password Reset (/auth/admin/reset-password?token=xxx)
 * - Protected admin dashboard and pages (ProtectedRoute with allowedRoles)
 * 
 * ## Database Requirements
 * 
 * ### 1. Users Table (Existing)
 * Already has required fields:
 * - id, first_name, last_name, email, phone_number, password_hash, role, status, created_at, updated_at
 * 
 * ### 2. Additional Fields Needed in Users Table
 * Add password reset fields to support forgot password flow:
 * 
 * ```sql
 * ALTER TABLE users 
 * ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
 * ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;
 * 
 * CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);
 * ```
 * 
 * ### 3. Admins Table (Existing)
 * Stores admin-specific information:
 * - id, user_id (FK to users), admin_level, permissions, created_at, updated_at
 * - admin_level: 'support', 'ops', 'finance', 'super'
 * - permissions: JSONB object for fine-grained access control
 * 
 * ## Authentication Flow
 * 
 * ### Login Flow
 * 1. Admin enters email + password at /auth/admin/login
 * 2. NextAuth verifies credentials against users table
 * 3. Only "active" admins can login (role must be 'admin' or 'super_admin')
 * 4. Session is created with user info + role + status
 * 5. Admin redirected to /admin/dashboard
 * 
 * ### Signup Flow (Request for Access)
 * 1. New admin fills form at /auth/admin/signup with reason for access
 * 2. User created with status='pending_approval' in users table
 * 3. TODO: Notification sent to super admin for review
 * 4. Super admin approves/rejects the request
 * 5. On approval: status changed to 'active', admins table entry created
 * 
 * ### Forgot Password Flow
 * 1. Admin enters email at /auth/admin/forgot-password
 * 2. System finds admin user by email (only active admins)
 * 3. Generates secure reset token (32 random bytes)
 * 4. Token hashed and stored in password_reset_token + expiry set to 1 hour
 * 5. TODO: Reset link emailed to admin: /auth/admin/reset-password?token=xxx
 * 6. Admin clicks link, system validates token
 * 7. Admin enters new password, password_hash updated, token cleared
 * 
 * ## API Endpoints
 * 
 * ### POST /api/auth/admin/request-access
 * Request admin access from non-admin user
 * - Body: { firstName, lastName, email, phone, password, reason }
 * - Creates user with status='pending_approval'
 * - Returns: { success: true, message: "..." }
 * 
 * ### POST /api/auth/admin/forgot-password
 * Send password reset email
 * - Body: { email }
 * - Always returns success (security: don't reveal if email exists)
 * - Generates and stores password_reset_token
 * - TODO: Sends reset email
 * 
 * ### GET /api/auth/admin/validate-reset-token?token=xxx
 * Validate password reset token
 * - Query: token
 * - Returns: { valid: true, email: "..." } or { valid: false, error: "..." }
 * - Checks token exists, not expired
 * 
 * ### POST /api/auth/admin/reset-password
 * Reset password using valid token
 * - Body: { token, password }
 * - Validates token, hashes new password, clears token
 * - Returns: { success: true, message: "..." }
 * 
 * ## NextAuth Configuration
 * 
 * Provider: Credentials
 * - Credentials: email, phone, password
 * - Checks users table, validates password with bcrypt
 * - Only allows users with status='active' and role in ['admin', 'super_admin']
 * 
 * Callbacks:
 * - jwt: Tokens include id, firstName, lastName, email, phone, role, status, createdAt
 * - session: Session includes all user info from token
 * 
 * Pages:
 * - signIn: /auth/admin/login
 * - error: /auth/admin/login
 * 
 * Session: JWT strategy, 30-day max age
 * 
 * ## Protected Routes
 * 
 * All admin pages wrapped with ProtectedRoute component:
 * ```tsx
 * <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
 *   <AdminPageContent />
 * </ProtectedRoute>
 * ```
 * 
 * Protected pages:
 * - /admin/dashboard
 * - /admin/users
 * - /admin/drivers
 * - /admin/analytics
 * - /admin/payments
 * - /admin/rides
 * - /admin/messages
 * - /admin/security
 * - /admin/settings
 * - /admin/api-monitor
 * 
 * ## User Roles & Statuses
 * 
 * ### User Roles
 * - 'user': Regular rider (default)
 * - 'driver': Driver account
 * - 'admin': Administrator
 * - 'super_admin': Super administrator (full system access)
 * 
 * ### User Status
 * - 'active': Can login
 * - 'pending': Cannot login (email not verified, profile incomplete)
 * - 'pending_approval': Admin request waiting for super admin approval
 * - 'suspended': Account disabled
 * 
 * ## Security Considerations
 * 
 * 1. Password Hashing: bcrypt with salt rounds = 10
 * 2. Reset Tokens: SHA256 hashed, stored in DB, 1-hour expiry
 * 3. NextAuth Secret: Set via NEXTAUTH_SECRET env var
 * 4. Session: JWT strategy, secure + httpOnly cookies (HTTPS only)
 * 5. CSRF Protection: Built-in NextAuth CSRF tokens
 * 6. Rate Limiting: TODO - implement on auth endpoints
 * 7. Audit Logging: TODO - log admin actions to audit_logs table
 * 
 * ## TODO Items
 * 
 * 1. Email Integration
 *    - Send password reset links via email
 *    - Send admin request notifications to super admin
 *    - Send approval/rejection emails
 * 
 * 2. Rate Limiting
 *    - Limit login attempts
 *    - Limit password reset requests
 * 
 * 3. Audit Logging
 *    - Log all admin actions (user creation, status changes, etc.)
 *    - Log failed login attempts
 * 
 * 4. Two-Factor Authentication
 *    - Optional 2FA for super_admin accounts
 *    - TOTP or email-based verification
 * 
 * 5. Admin Approval Flow
 *    - Create super admin interface to approve/reject access requests
 *    - Notification system for approvals
 * 
 * 6. API Key Management
 *    - Generate API keys for admin automation
 *    - Scope and rate limiting per key
 */

export default {};
