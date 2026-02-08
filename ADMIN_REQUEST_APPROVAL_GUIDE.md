# Admin Access Request Management Guide

## Finding Pending Admin Requests

When a user requests admin access via `/auth/admin/signup`, they are created with:
- **role**: 'admin'
- **status**: 'pending' 
- **role + status combo**: Identifies pending requests

### Query to Find Pending Admin Requests

```sql
SELECT 
  id, 
  first_name, 
  last_name, 
  email, 
  phone_number, 
  created_at 
FROM users 
WHERE role = 'admin' AND status = 'pending'
ORDER BY created_at DESC;
```

### Result fields explained:
- `id` - User ID (store this for approving)
- `first_name`, `last_name` - Admin name
- `email` - Contact email
- `phone_number` - Contact phone
- `created_at` - When request was submitted

## Approving an Admin Request

### 1. Basic Approval (Make account active)

```sql
UPDATE users 
SET status = 'active' 
WHERE id = '[USER_ID]' AND role = 'admin' AND status = 'pending';
```

### 2. Full Approval (Activate + Create admin profile)

```sql
-- Step 1: Approve the account
UPDATE users 
SET status = 'active' 
WHERE id = '[USER_ID]' AND role = 'admin' AND status = 'pending';

-- Step 2: Create admin profile entry (optional but recommended)
-- This stores admin-level permissions (support/ops/finance/super)
INSERT INTO admins (user_id, admin_level, permissions)
VALUES ('[USER_ID]', 'support', '{}');
```

### Admin Levels

- `support` - Support team can handle user support tickets
- `ops` - Operations team can manage drivers, rides, zones
- `finance` - Finance team can manage payments and settlements
- `super` - Super admin with full system access

Choose the appropriate level for the new admin's role.

## Rejecting an Admin Request

### Delete the pending request

```sql
DELETE FROM users 
WHERE id = '[USER_ID]' AND role = 'admin' AND status = 'pending';
```

## Revoking Admin Access

### Suspend an active admin

```sql
UPDATE users 
SET status = 'suspended' 
WHERE id = '[USER_ID]' AND role = 'admin' AND status = 'active';
```

## Full Admin Status Report

```sql
SELECT 
  id,
  first_name || ' ' || last_name AS full_name,
  email,
  status,
  CASE 
    WHEN status = 'pending' THEN 'Awaiting approval'
    WHEN status = 'active' THEN 'Approved'
    WHEN status = 'suspended' THEN 'Disabled'
  END AS status_desc,
  created_at,
  CASE 
    WHEN a.admin_level IS NOT NULL THEN a.admin_level
    ELSE 'No profile yet'
  END AS admin_level
FROM users u
LEFT JOIN admins a ON u.id = a.user_id
WHERE u.role IN ('admin', 'super_admin')
ORDER BY u.status, u.created_at DESC;
```

### Output Explanation:
- Shows all admin users (active, pending, suspended)
- Shows admin level if profile exists
- Shows creation date for reference

## Using in Admin Dashboard (TODO)

In the future, create an admin management page at `/admin/settings/admins` where super admins can:

1. View all pending admin requests
2. Click "Approve" to activate
3. Set admin level (support/ops/finance/super)
4. Click "Reject" to delete request
5. Manage existing admins (suspend/revoke)

## Important Notes

⚠️ **Restrictions and Status Values:**
- Users can ONLY have status: `'active'`, `'pending'`, or `'suspended'`
- `'pending_approval'` and other values will cause database errors
- To identify pending admin requests, query: `role='admin' AND status='pending'`

✅ **Best Practice:**
- Before approving, verify the email is correct
- Set an appropriate admin_level for the new admin
- Log admin approvals for audit purposes (TODO)

## Quick Workflow

1. **User requests access** → visits `/auth/admin/signup`
2. **User created** with role='admin', status='pending'
3. **Super admin reviews** pending requests via admin dashboard (currently manual SQL)
4. **Super admin approves** by running update SQL + creating admins table entry
5. **New admin logins** at `/auth/admin/login` with their credentials
6. **New admin redirected** to `/admin/dashboard`
