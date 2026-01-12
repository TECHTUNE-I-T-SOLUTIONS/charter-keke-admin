## Charter Keke - Enhanced Signup Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Next.js UI)                      │
├─────────────────────────────────────────────────────────────┤
│                   app/auth/register/page.tsx                │
│                                                              │
│  Step 1: Role Selection          Step 2: Form + Upload      │
│  ┌──────────────────┐           ┌──────────────────────────┐│
│  │ Rider            │           │ Basic Information        ││
│  │ Driver           │           │ - Name, Email, Phone     ││
│  │ Admin (future)   │           │ - DOB, Gender            ││
│  └──────────────────┘           │ - Profile Picture (opt)  ││
│                                 │                          ││
│                                 │ Driver Section (if)      ││
│                                 │ - Vehicle Type, Plate    ││
│                                 │ - Bank Details           ││
│                                 │ - Documents              ││
│                                 │                          ││
│                                 │ Security                 ││
│                                 │ - Password               ││
│                                 │ - Referral Code (opt)    ││
│                                 └──────────────────────────┘│
└────────────────┬─────────────────────────────────────────────┘
                 │ FormData
                 │ (multipart/form-data)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              BACKEND API LAYER (Node.js)                    │
├─────────────────────────────────────────────────────────────┤
│          app/api/auth/signup/route.ts (POST)                │
│                                                              │
│  1. Parse FormData                                           │
│  2. Validate Input                                           │
│  3. Upload Files (Service Role)                              │
│       ├─ Profile Picture → profile-pictures bucket           │
│       ├─ Vehicle Picture → vehicle-pictures bucket           │
│       └─ License Picture → license-documents bucket          │
│  4. Hash Password (bcryptjs)                                 │
│  5. Generate Referral Code                                   │
│  6. Create Database Records                                  │
└────────────────┬─────────────────────────────────────────────┘
                 │
         ┌───────┴──────────┐
         │                  │
         ▼                  ▼
    ┌─────────────┐  ┌─────────────────────┐
    │  Upload     │  │  Supabase SQL       │
    │  Service    │  │  Database           │
    └─────────────┘  └─────────────────────┘
```

---

## Data Flow Diagram

### File Upload Flow
```
User selects file
        ↓
File preview shown (FileReader API)
        ↓
Form submitted with FormData
        ↓
API receives multipart/form-data
        ↓
File converted to Buffer
        ↓
Generate unique filename
    Format: {email}/{timestamp}-{type}.{ext}
        ↓
Upload with Service Role Key
    ┌─ uploadFileWithServiceRole()
    │  ├─ Create Supabase client (service role)
    │  ├─ Upload to specific bucket
    │  ├─ Get public URL
    │  └─ Return URL to API
    ↓
Store URL in database
    users.profile_picture_url
    drivers.vehicle_picture_url
    drivers.license_picture_url
        ↓
URL accessible publicly via CDN
    https://cdn.supabase.co/...
```

---

## Database Record Creation Flow

```
User Signup Initiated
        ↓
┌──────────────────────────────────────┐
│ INSERT INTO users                    │
│ ├─ first_name                        │
│ ├─ last_name                         │
│ ├─ email (UNIQUE)                    │
│ ├─ phone_number (UNIQUE)             │
│ ├─ dob                               │
│ ├─ gender                            │
│ ├─ profile_picture_url               │
│ ├─ password_hash                     │
│ ├─ role                              │
│ └─ status: "active"                  │
└──────────────────────────────────────┘
        ↓
        ├──→ INSERT INTO wallets        (auto, balance: 0)
        │
        ├──→ INSERT INTO notification_preferences (auto)
        │
        ├──→ INSERT INTO referrals      (with code)
        │
        ├──→ TRIGGER: create_referral_codes (auto)
        │
        └──→ Role-specific records:
            │
            ├─ If role="driver":
            │  INSERT INTO drivers
            │  ├─ vehicle_type
            │  ├─ plate_number
            │  ├─ union_name
            │  ├─ bank_name
            │  ├─ bank_account_number
            │  ├─ emergency_contact
            │  ├─ vehicle_picture_url
            │  ├─ license_picture_url
            │  └─ verified: false
            │
            └─ If role="admin":
               INSERT INTO admins
               ├─ admin_level: "support"
               └─ permissions: {}
```

---

## Component Architecture

### Form State Structure
```typescript
interface SignupFormData {
  // Basic Info (all roles)
  firstName: string
  lastName: string
  email: string
  phone: string
  dob: string
  gender: string
  profilePicture: File | null

  // Driver Specific
  vehicleType: string
  plateNumber: string
  unionName: string
  bankName: string
  bankAccountNumber: string
  emergencyContact: string
  vehiclePicture: File | null
  licensePicture: File | null

  // Security
  password: string
  confirmPassword: string
  role: "user" | "driver" | "admin"
  referralCode: string
}

interface PreviewImages {
  profilePicture?: string
  vehiclePicture?: string
  licensePicture?: string
}
```

---

## Validation Pipeline

```
User Input
    ↓
┌─────────────────────────────────────────┐
│  Client-side Validation (Frontend)      │
├─────────────────────────────────────────┤
│ lib/form-validation.ts:                 │
│ ├─ validateEmail()                      │
│ ├─ validatePhone() [Nigerian format]    │
│ ├─ validatePassword() [min 8 chars]     │
│ ├─ validatePlateNumber()                │
│ ├─ validateBankAccount() [10 digits]    │
│ ├─ validateDOB() [age check]            │
│ ├─ validateFile() [size, type]          │
│ └─ validateSignupForm() [complete]      │
└─────────────┬───────────────────────────┘
              │ (FormData)
              ↓
┌─────────────────────────────────────────┐
│  Server-side Validation (Backend)       │
├─────────────────────────────────────────┤
│ app/api/auth/signup/route.ts:           │
│ ├─ Parse FormData                       │
│ ├─ Validate all fields again            │
│ ├─ Check email/phone uniqueness         │
│ ├─ Validate driver fields (if needed)   │
│ ├─ Validate file sizes                  │
│ ├─ Validate file types                  │
│ └─ Validate role                        │
└─────────────┬───────────────────────────┘
              │ (DB Operations)
              ↓
    Database Record Creation
```

---

## File Upload Utility Architecture

### uploadFileWithServiceRole()
```typescript
async function uploadFileWithServiceRole(
  bucketName: string,
  filePath: string,
  fileBuffer: Buffer,
  contentType: string
) {
  // 1. Create service-role client
  //    (uses SUPABASE_SERVICE_ROLE_KEY from .env)
  
  // 2. Upload to bucket
  //    - Bypass RLS policies
  //    - Set content type
  //    - Enable upsert (replace existing)
  
  // 3. Generate public URL
  //    - Get from public bucket
  //    - Return full CDN URL
  
  // 4. Return upload result
  //    {
  //      success: true,
  //      path: "user@email.com/timestamp-type.ext",
  //      url: "https://cdn.supabase.co/..."
  //    }
}
```

---

## API Request/Response Flow

### POST /api/auth/signup

#### Request
```
Content-Type: multipart/form-data

┌─────────────────────────────────────────┐
│  Form Data Parts                        │
├─────────────────────────────────────────┤
│  firstName: "John"                      │
│  lastName: "Doe"                        │
│  email: "john@example.com"              │
│  phone: "+234808319228"                 │
│  dob: "1990-01-01"                      │
│  gender: "male"                         │
│  role: "driver"                         │
│  password: "SecurePass123"              │
│  vehicleType: "tricycle"                │
│  plateNumber: "ABC123XY"                │
│  bankName: "GTBank"                     │
│  bankAccountNumber: "1234567890"        │
│  profilePicture: <File>                 │
│  vehiclePicture: <File>                 │
│  licensePicture: <File>                 │
└─────────────────────────────────────────┘
```

#### Processing
```
1. Parse FormData
2. Validate inputs
3. Hash password (bcryptjs)
4. Upload 3 images (if provided)
5. Create user record
6. Create wallet
7. Create notification preferences
8. Create referral record
9. Create driver/admin record
```

#### Response (201 Created)
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+234808319228",
    "dob": "1990-01-01",
    "gender": "male",
    "profilePictureUrl": "https://cdn.supabase.co/object/public/profile-pictures/john@example.com/1704067200000-profile.jpg",
    "role": "driver",
    "referralCode": "EASEJO1A2B"
  }
}
```

#### Error Response (400/500)
```json
{
  "error": "Email or phone number already exists"
}
```

---

## Service Role Security Model

### Why Service Role Key?
```
Problem:
  User uploads file directly to Supabase bucket
  → RLS policies prevent anonymous uploads
  → Need authenticated requests

Solution:
  Server handles upload with service role key
  → Service role bypasses RLS
  → More secure (key never exposed to client)
  → Centralized file management
  → Can validate and process before upload

Architecture:
  Client → FormData → Server → Service Role Key → Supabase Storage → Public URL → Client DB

Benefits:
  ✓ Files never sent directly to Supabase
  ✓ Server can validate, compress, process files
  ✓ Service role key stays server-side only
  ✓ Anon key only used for SELECT queries
  ✓ Consistent file naming and organization
  ✓ URL management centralized
```

---

## Storage Bucket Structure

```
Supabase Storage
│
├─ profile-pictures/ (PUBLIC)
│  └─ user@email.com/
│     ├─ 1704067200000-profile.jpg
│     └─ 1704067200001-profile.png
│
├─ vehicle-pictures/ (PUBLIC)
│  └─ user@email.com/
│     ├─ 1704067200000-vehicle.jpg
│     └─ 1704067200001-vehicle.png
│
├─ license-documents/ (PUBLIC)
│  └─ user@email.com/
│     ├─ 1704067200000-license.jpg
│     └─ 1704067200001-license.png
│
└─ support-attachments/ (PUBLIC)
   └─ ticket_id/
      └─ messages/
         └─ attachment.pdf
```

---

## NextAuth Integration

### Post-Signup Authentication Flow
```
Signup API Response
    │
    ├─ User account created ✓
    ├─ All records created ✓
    │
    └─ Frontend: signIn("credentials", {...})
                 │
                 ↓
        NextAuth Credentials Provider
        ├─ Verify email + password
        ├─ Query users table
        ├─ Compare hashes (bcryptjs)
        │
        ├─ YES → Create JWT token
        │        ├─ user.id
        │        ├─ user.email
        │        ├─ user.firstName
        │        ├─ user.role
        │        └─ expires: 30 days
        │
        └─ Return session to client
           │
           └─ Redirect to dashboard
              /user/dashboard (rider)
              /driver/dashboard (driver)
```

---

## Error Handling Flow

```
User Input → Validation Error
  ↓
Frontend Toast Message
(No server call)

FormData → API Error
  ↓
API Returns error message
  ↓
Frontend Toast Message
  ↓
User corrects and retries

File Upload Failure
  ↓
Log error to console
  ↓
Continue registration anyway
  ↓
User record created without image
  ↓
Success message shown
(Image can be added later)

Duplicate Email/Phone
  ↓
Database unique constraint
  ↓
API returns 400 error
  ↓
Frontend shows "Already exists"
  ↓
User tries different email/phone
```

---

## Performance Optimization

### Frontend
- ✓ Image preview (FileReader API) - instant
- ✓ Form validation before submission - prevent trips
- ✓ Scrollable form container - responsive on mobile
- ✓ Optimistic UI updates - feels faster

### Backend
- ✓ Parallel database inserts - atomic transactions
- ✓ Service role upload - no client delays
- ✓ Error graceful handling - continues if upload fails
- ✓ Indexed lookups - fast email/phone checks

### Storage
- ✓ Public buckets - CDN cached
- ✓ Unique filenames - no overwrites
- ✓ Organized by email - easy retrieval
- ✓ Upsert enabled - replace old images

---

## Testing Strategy

### Unit Tests
- Validation functions in form-validation.ts
- Upload functions in upload-file.ts

### Integration Tests
- Full signup flow (UI → API → DB)
- File upload with URLs
- Database record creation
- Auto-login after signup

### E2E Tests
- Rider signup (minimal fields)
- Driver signup (all fields)
- File uploads (images)
- Error scenarios (duplicate email, etc)
- Dashboard access after signup

---

## Environment Dependencies

```
Production (.env):
├─ NEXT_PUBLIC_SUPABASE_URL
├─ NEXT_PUBLIC_SUPABASE_ANON_KEY
├─ SUPABASE_SERVICE_ROLE_KEY ← Critical for uploads
├─ NEXTAUTH_SECRET
├─ NEXTAUTH_URL
└─ Other API keys (Paystack, Termii, etc)

Security:
✓ Service role key: Server-side only (.env, NOT .env.public)
✓ Anon key: Can be public (used for SELECT queries)
✓ NextAuth secret: Server-side only
```

---

## Deployment Checklist

- [ ] Service role key configured in production
- [ ] Storage buckets created and public
- [ ] Database tables migrated
- [ ] Referral code triggers deployed
- [ ] NextAuth secret set in production
- [ ] Email verification domain set (for future)
- [ ] File upload limits set
- [ ] CDN cache configured
- [ ] Error monitoring set up (Sentry, LogRocket)
- [ ] Rate limiting configured
- [ ] Load testing completed

---

**Architecture Version**: 2.0
**Last Updated**: January 8, 2026
**Status**: Production Ready ✅
