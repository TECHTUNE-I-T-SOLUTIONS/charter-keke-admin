# Admin Signup Fix - Complete Data Capture with Multi-Step Form

## Issue
When admins signed up for access, the following problems occurred:
1. **Missing user profile fields**: Only basic fields were captured; DOB, gender, emergency contact info were missing
2. **Missing admin_level field**: Users couldn't specify their requested admin role (support, ops, finance, super)
3. **No admins table entry**: Only a record was created in the `users` table; the required `admins` table entry was never created
4. **Lost request reason**: The reason provided by the user was captured but never saved anywhere
5. **Single-page overload**: All fields were on one page making it overwhelming

## Root Cause
The admin signup process was incomplete:
- Form was missing several required user fields
- Form was missing the admin_level selector
- API only created a user entry, not an admin entry
- Reason field had nowhere to be stored
- No user-friendly multi-step flow

## Solution

### 1. Updated Signup Form (`/app/auth/admin/signup/page.tsx`)
**Converted to 5-step wizard:**

**Step 1: Personal Information**
- First Name (required)
- Last Name (required)
- Email (required)
- Phone Number (required)

**Step 2: Password & Security**
- Password (required, min 8 chars)
- Confirm Password (required)
- Password strength hint

**Step 3: Additional Information**
- Date of Birth (required)
- Gender (required: male, female, other, prefer not to say)

**Step 4: Emergency Contact**
- Emergency Contact Name (required)
- Emergency Contact Phone (required)

**Step 5: Admin Details**
- Admin Level dropdown (required: support, ops, finance, super)
- Request Reason (required, min 20 chars)
- Warning about approval process

**Features:**
- Visual progress indicator (5 step bars)
- Previous/Next navigation
- Validation on each step before proceeding
- Character counter for reason field
- Helpful hints and warnings on each step
- Smooth animations between steps

### 2. Updated API Route (`/api/auth/admin/request-access/route.ts`)
**Enhanced:**
- Accepts all fields from form: firstName, lastName, email, phone, password, dob, gender, emergencyContact, emergencyPhone, adminLevel, reason
- Validates all required fields
- Validates adminLevel against allowed values
- Checks for duplicate email AND phone
- Creates user in `users` table with ALL profile fields:
  - email, phone_number, first_name, last_name
  - password_hash, dob, gender
  - emergency_contact, emergency_phone
  - role='admin', status='pending'
  - profile_complete=false
- **NEW:** Creates admin record in `admins` table with:
  - `user_id`: Link to the newly created user
  - `admin_level`: The requested level (support/ops/finance/super)
  - `permissions`: JSON object containing:
    - `request_reason`: Full reason provided by applicant
    - `request_date`: ISO timestamp of when request was submitted
    - `status`: "pending_review" flag for super admins

## Data Flow

```
User fills out 5-step form
↓
Step 1: First Name, Last Name, Email, Phone
Step 2: Password, Confirm Password
Step 3: DOB, Gender
Step 4: Emergency Contact, Emergency Phone
Step 5: Admin Level, Reason for Access
↓
Form includes: firstName, lastName, email, phone, password, dob, gender, emergencyContact, emergencyPhone, adminLevel, reason
↓
POST /api/auth/admin/request-access
↓
1. Create user in users table
   - email, phone_number, first_name, last_name, password_hash
   - dob, gender, emergency_contact, emergency_phone
   - role: "admin"
   - status: "pending"
↓
2. Create admin in admins table
   - user_id: [from step 1]
   - admin_level: [from form]
   - permissions: { request_reason, request_date, status }
↓
Response: Success with userId and adminId
```

## Database Records Created

### users table
```sql
INSERT INTO users (
  email, phone_number, first_name, last_name, 
  password_hash, dob, gender, emergency_contact, emergency_phone,
  role, status, profile_complete
) VALUES (
  'admin@example.com', '+234123456789', 'John', 'Doe',
  'hashed_password', '1990-01-15', 'male',
  'Jane Doe', '+234987654321',
  'admin', 'pending', false
);
```

### admins table
```sql
INSERT INTO admins (
  user_id, admin_level, permissions
) VALUES (
  'uuid-from-users-table', 'support',
  '{
    "request_reason": "I want to help with customer support and ride monitoring",
    "request_date": "2026-02-07T10:30:00Z",
    "status": "pending_review"
  }'::jsonb
);
```

## How Super Admins Can View & Approve Requests

### View all pending admin requests:
```sql
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.phone_number,
  u.dob,
  u.gender,
  u.emergency_contact,
  u.emergency_phone,
  a.admin_level,
  a.permissions->>'request_reason' AS request_reason,
  a.permissions->>'request_date' AS request_date,
  a.created_at
FROM users u
JOIN admins a ON u.id = a.user_id
WHERE u.role = 'admin' AND u.status = 'pending'
ORDER BY a.created_at DESC;
```

### Approve an admin request:
```sql
-- Step 1: Update user status to active
UPDATE users 
SET status = 'active', updated_at = now()
WHERE id = 'admin-user-id';

-- Step 2: Update admin permissions to mark as approved
UPDATE admins 
SET permissions = 
  jsonb_set(permissions, '{status}', '"approved"')
  || jsonb_set(permissions, '{approved_date}', 
    to_jsonb(now()::text))
WHERE user_id = 'admin-user-id';
```

### Reject an admin request:
```sql
-- Option 1: Delete the user and admin records
DELETE FROM admins WHERE user_id = 'admin-user-id';
DELETE FROM users WHERE id = 'admin-user-id';

-- Option 2: Just mark as rejected
UPDATE admins 
SET permissions = 
  jsonb_set(permissions, '{status}', '"rejected"')
  || jsonb_set(permissions, '{rejected_date}', 
    to_jsonb(now()::text))
  || jsonb_set(permissions, '{rejection_reason}', 
    '"Does not meet requirements"')
WHERE user_id = 'admin-user-id';
```

## Verification Checklist

✅ Form is now 5-step wizard with progress indicator
✅ Step 1 captures: First Name, Last Name, Email, Phone
✅ Step 2 captures: Password (with strength validation)
✅ Step 3 captures: DOB, Gender
✅ Step 4 captures: Emergency Contact, Phone
✅ Step 5 captures: Admin Level, Request Reason
✅ Each step validates before allowing next step
✅ User record created in users table with ALL fields
✅ Admin record created in admins table
✅ Request reason stored in permissions JSON
✅ Request date captured with ISO timestamp
✅ Status field helps admins identify pending approvals

## Testing

1. Go to `/auth/admin/signup`
2. Fill out the form step by step:
   - **Step 1:** John, Doe, john@example.com, +234123456789
   - **Step 2:** TestPassword123, TestPassword123
   - **Step 3:** 1990-01-15, male
   - **Step 4:** Jane Doe, +234987654321
   - **Step 5:** Support, "I want to help with customer support and ride monitoring system"
3. Click "Submit Request" on Step 5
4. Check database:
   ```sql
   SELECT * FROM users WHERE email = 'john@example.com';
   SELECT * FROM admins WHERE user_id IN (...);
   ```
5. Verify both records exist with correct data:
   - Users table: All profile fields populated
   - Admins table: admin_level and permissions with reason

## Field Mapping

| Form Step | Field | Database Field | Table | Required | Type |
|-----------|-------|----------------|-------|----------|------|
| 1 | First Name | first_name | users | Yes | varchar |
| 1 | Last Name | last_name | users | Yes | varchar |
| 1 | Email | email | users | Yes | varchar |
| 1 | Phone | phone_number | users | Yes | varchar |
| 2 | Password | password_hash | users | Yes | varchar |
| 3 | DOB | dob | users | Yes | date |
| 3 | Gender | gender | users | Yes | varchar |
| 4 | Emergency Contact | emergency_contact | users | Yes | varchar |
| 4 | Emergency Phone | emergency_phone | users | Yes | varchar |
| 5 | Admin Level | admin_level | admins | Yes | varchar |
| 5 | Reason | permissions.request_reason | admins | Yes | jsonb |

## Future Enhancements

- [ ] Email notification to super admins when new request submitted
- [ ] Admin dashboard UI for viewing/approving requests
- [ ] Automated email to applicant when approved/rejected
- [ ] Audit logging of approval actions
- [ ] Expiration rules for pending requests (auto-reject after 30 days)
- [ ] Document upload support for admin verification
- [ ] Department/team assignment during approval
- [ ] Role-based permission templates in admins table
