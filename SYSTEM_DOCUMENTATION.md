# Charter Keke System Architecture Documentation

## 1. Authentication System

### Overview
- **Method**: NextAuth with Credentials Provider
- **Password Hashing**: bcryptjs
- **Session**: JWT-based, 30-day expiration
- **Database**: Supabase PostgreSQL

### User Roles
- `user`: Regular rider
- `driver`: Keke driver
- `admin`: Support, operations, finance staff
- `super_admin`: Full system access

### Authentication Flow
1. User signs up with email, phone, password, and basic info
2. Password is hashed using bcryptjs
3. OTP verification (email/SMS)
4. User must complete profile before gaining access
5. Wallet created automatically
6. Role-based redirect after login

---

## 2. Database Schema

### Core Tables

#### users
- Central identity table
- All users (riders, drivers, admins) start here
- Fields: id, first_name, last_name, email, phone_number, password_hash, dob, gender, role, status
- Indexes: phone_number, email, role

#### drivers
- Driver-specific information
- One-to-one relationship with users via user_id
- Fields: vehicle_type, plate_number, operating_zones[], union_name, availability_status, bank info, verified status
- Indexes: user_id, verified, availability_status

#### admins
- Admin-specific information
- Permissions stored as JSONB
- Fields: user_id, admin_level (support/ops/finance/super), permissions
- Example permissions: view_users, suspend_users, verify_drivers, adjust_wallets, view_audit_logs

#### wallets
- One per user (created at signup)
- Tracks balance for each user
- Fields: user_id, balance, currency (NGN)
- Every ride payout or payment updates this

#### rides
- Complete ride record
- Stores all pickup/destination/pricing info
- Fields: rider_id, driver_id, zones, description, ride_type, fare, status, timestamps
- Status flow: pending → dispatched → accepted → in_progress → completed

#### ride_dispatch_logs
- Immutable audit trail for ride matching
- Records every dispatch attempt to every driver
- Fields: ride_id, driver_id, dispatch_method, response, response_time
- Used for analytics and dispute resolution

#### transactions
- Ledger of all wallet movements
- Sources: ride completion, admin adjustments, payouts, deposits
- Fields: wallet_id, amount, type, reference, source, status
- Immutable for audit compliance

#### notifications
- Unified notification table for all users
- Supabase triggers send via SMS/Email (Termii)
- Fields: user_id, title, message, type, channel, related_table, related_id, read
- Channels: in_app, push, sms, email
- Types: system, ride, payment, admin

---

## 3. Notification System

### Architecture
- **Primary Storage**: Supabase notifications table
- **SMS/Email**: Supabase database triggers → Termii API
- **Push**: Frontend service worker handles subscriptions
- **Real-time**: Supabase RealtimeSubscription for live updates

### Notification Types
- **system**: Platform updates, welcome messages
- **ride**: Ride status changes, new ride available
- **payment**: Wallet credits, payouts, failed transactions
- **admin**: User actions, policy updates

### Trigger Rules (Supabase Triggers)
1. Ride created → notify matching drivers
2. Ride accepted → notify rider
3. Ride completed → notify both parties + payment notification
4. Wallet transaction → notify user
5. Admin action → notify affected user

### No Backend Notification Service
- Instead of building backend notification workers, use Supabase PostgreSQL triggers
- Triggers automatically insert into notifications table
- Triggers call Termii API for SMS/Email
- Reduces infrastructure complexity

---

## 4. Admin Management

### Admin Creation
1. Super admin creates admin user account (via API)
2. Admin role and specific permissions assigned
3. Admin completes profile
4. Access granted per permissions

### Admin Permissions (JSONB)
```json
{
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
}
```

### Admin Dashboard Capabilities
- View all users, drivers, rides with filters
- Suspend/reinstate users
- Verify or reject drivers
- Manually assign/reassign rides
- View wallet balances and transaction history
- Trigger or approve payouts
- Send system notifications
- View SMS/Push/Email logs
- Full audit trails for all actions

### GraphQL Access
- Admins with `access_graphql` permission can query system data
- Read-only unless explicitly granted write permissions
- Queries: users, drivers, rides, wallets, transactions, notifications

---

## 5. Wallets & Payments

### Wallet System
- **One wallet per user**: Created at signup
- **Currency**: NGN (Nigerian Naira)
- **Balance tracking**: Real-time via transactions table

### Transaction Types
- **credit**: Money added (ride completion, referral)
- **debit**: Money removed (payment, refund)
- **payout**: Withdrawal to bank account
- **refund**: Refund for cancelled ride

### Sources
- **ride**: Completion of a ride
- **admin_adjustment**: Admin-initiated change
- **payout**: Driver withdrawal
- **deposit**: User top-up (future)

### Payment Flow
1. Rider completes ride
2. Fare calculated and deducted from wallet
3. Driver earnings added to driver's wallet
4. Transaction logged immutably
5. Notifications sent to both parties
6. Admin can trigger payout to driver's bank

---

## 6. Redis Usage (Optional, Not Required)

### Use Cases
- Preventing double ride acceptance
- Rate limiting API endpoints
- Caching driver availability status
- Temporary locks on ride operations
- Notification deduplication

### Graceful Fallback
- If Redis unavailable, system still works
- Reduced efficiency but maintains consistency
- Database becomes source of truth

### Configuration
- Upstash Redis for serverless
- Redis Cloud for shared tier
- Free tier acceptable for MVP

---

## 7. API Routes

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handler
- `POST /api/auth/login` - NextAuth login

### User Routes
- `GET /api/user/profile` - Get user profile (auth required)
- `PUT /api/user/profile` - Update user profile (auth required)
- `GET /api/rides` - Get user's rides (auth required)
- `POST /api/rides` - Create new ride (auth required)

### Driver Routes
- `PUT /api/driver/profile` - Update driver profile
- `GET /api/driver/available-rides` - Get dispatch rides
- `POST /api/driver/accept-ride` - Accept ride
- `PUT /api/driver/ride/:id/status` - Update ride status

### Admin Routes
- `GET /api/admin/users` - List all users (admin auth required)
- `PUT /api/admin/users/:id` - Update user (admin auth required)
- `GET /api/admin/drivers` - List all drivers
- `GET /api/admin/rides` - List all rides
- `GET /api/admin/wallets` - View wallet data
- `POST /api/admin/transactions/:id/approve` - Approve payout

---

## 8. Security Considerations

### Password Management
- Minimum 8 characters
- Hash with bcryptjs (10 rounds)
- Never stored in plain text
- Reset via email verification

### Role-Based Access Control (RBAC)
- All API routes check session user role
- Admin routes verify specific permissions
- Server-side role enforcement
- Never trust client-side role claims

### Data Isolation
- Users can only view their own data (except admins)
- Drivers see their rides and earnings
- Admins see filtered data based on permissions

### Audit Trail
- All user modifications logged with timestamp
- Admin actions tracked in dedicated table
- Ride dispatch attempts recorded immutably

---

## 9. Deployment Checklist

### Before Production
- [ ] Generate NEXTAUTH_SECRET
- [ ] Set up Supabase project
- [ ] Run database schema SQL
- [ ] Set up Termii SMS/Email
- [ ] Configure Resend for transactional emails
- [ ] Set up Paystack payment gateway
- [ ] Configure Redis (optional)
- [ ] Set NEXTAUTH_URL to production domain
- [ ] Enable HTTPS only
- [ ] Set up monitoring and error tracking

### Environment Variables
- Copy `.env.example` to `.env.local`
- Fill in all required API keys
- Never commit `.env.local` to git

---

## 10. Maintenance & Operations

### Regular Tasks
- Monitor database performance
- Review admin access logs weekly
- Check transaction reconciliation
- Verify Termii delivery rates
- Monitor Redis hit rates (if used)

### Schema Changes
- All schema changes require team review
- Test on staging database first
- No ad-hoc column additions
- Keep schema documentation updated

### Monitoring
- Set up alerts for failed transactions
- Monitor API response times
- Track authentication failure rates
- Alert on unusual admin activity

---

## 11. Tech Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Backend | Next.js API Routes, Node.js |
| Database | Supabase (PostgreSQL) |
| Authentication | NextAuth.js |
| Password Hashing | bcryptjs |
| Notifications | Supabase Triggers + Termii |
| SMS | Termii API |
| Email | Resend or Termii |
| Caching | Redis (optional) |
| Payments | Paystack |
| Push Notifications | Web Push API |

---

Last Updated: December 23, 2025
Maintained by: Technical Team
