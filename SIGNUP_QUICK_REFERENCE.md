# Enhanced Signup System - Quick Reference

## Files Created/Modified

### ✅ New Files
1. **lib/upload-file.ts** - Service role file upload utility
   - `uploadFileWithServiceRole()` - Upload files using service role key
   - `deleteFileWithServiceRole()` - Delete files using service role key

2. **lib/form-validation.ts** - Form validation utilities
   - `validateEmail()` - Email format validation
   - `validatePhone()` - Nigerian phone validation
   - `validatePassword()` - Password strength check
   - `validatePlateNumber()` - Vehicle plate format
   - `validateBankAccount()` - Bank account validation
   - `validateDOB()` - Date of birth and age check
   - `validateFile()` - File upload validation
   - `validateSignupForm()` - Complete form validation
   - And more...

3. **SIGNUP_ENHANCEMENT_DOCS.md** - Complete documentation

### 📝 Modified Files
1. **app/auth/register/page.tsx**
   - Added all database fields to signup form
   - Added file upload with preview
   - Added driver-specific form section
   - Added form state for all fields
   - Improved UX with scrollable form container

2. **app/api/auth/signup/route.ts**
   - Changed from JSON to FormData handling
   - Added file upload processing with service role
   - Added profile picture upload to profile-pictures bucket
   - Added vehicle picture upload to vehicle-pictures bucket
   - Added license picture upload to license-documents bucket
   - Enhanced driver record creation with all fields
   - Improved error handling

---

## Form Fields By Role

### All Users (Riders, Drivers, Admins)
```
Basic Information:
✓ First Name (required)
✓ Last Name (required)
✓ Email (required, unique)
✓ Phone (required, unique)
✓ Date of Birth (optional)
✓ Gender (optional)
✓ Profile Picture (optional, image file)

Security:
✓ Password (required, min 8 chars)
✓ Confirm Password (required)
✓ Referral Code (optional)
```

### Drivers Only (Additional)
```
Vehicle Information:
✓ Vehicle Type (required) - Tricycle/Auto/Tuk Tuk/Keke Napep
✓ Plate Number (required) - ABC 123 XY format
✓ Union Name (optional)
✓ Bank Name (required)
✓ Account Number (required)
✓ Emergency Contact (optional)
✓ Vehicle Picture (optional, image file)
✓ License Picture (optional, image file)
```

---

## File Upload Details

### Storage Buckets
| Bucket | Purpose | Path Format |
|--------|---------|-------------|
| profile-pictures | User profile photos | {email}/{timestamp}-profile.{ext} |
| vehicle-pictures | Driver vehicle photos | {email}/{timestamp}-vehicle.{ext} |
| license-documents | Driver license/permits | {email}/{timestamp}-license.{ext} |

### Upload Process
1. User selects file → Preview displayed
2. File sent in FormData to /api/auth/signup
3. API processes file:
   - Converts to Buffer
   - Creates unique filename with timestamp
   - Uploads using service role key
   - Gets public URL
   - Stores URL in database
4. If upload fails → Continues registration without image
5. URLs saved in database:
   - users.profile_picture_url
   - drivers.vehicle_picture_url
   - drivers.license_picture_url

---

## Database Records Created on Signup

### Created for All Users
1. **users** table
   - All basic info + profile_picture_url
   - dob and gender fields populated

2. **wallets** table
   - Auto-created with ₦0 balance

3. **notification_preferences** table
   - Auto-created with defaults

4. **referrals** table
   - Referral code tracking

5. **referral_codes** table (via trigger)
   - Auto-generated unique code

### Created for Drivers
6. **drivers** table with all fields:
   - vehicle_type
   - plate_number
   - operating_zones: []
   - union_name
   - bank_name
   - bank_account_number
   - emergency_contact
   - verified: false
   - vehicle_picture_url
   - license_picture_url

---

## Validation Rules

### Email
- Must be valid format (user@domain.com)
- Must be unique in database

### Phone
- Supports Nigerian formats: +234, 0234, 234
- Must be unique in database

### Password
- Minimum 8 characters
- Optional: Uppercase, lowercase, numbers for strength

### Plate Number
- Format: ABC 123 XY or variations
- Auto-uppercased

### Bank Account
- 10 digits (Nigerian standard)
- Optional: NUBAN checksum validation

### File Upload
- Max 5MB by default
- Allowed types: JPEG, PNG, WebP
- Preview shown before upload

---

## API Endpoint

### POST /api/auth/signup

**Request**: `multipart/form-data`

**Basic Fields**:
```
firstName: string
lastName: string
email: string
phone: string
password: string
role: "user" | "driver" | "admin"
dob: string (YYYY-MM-DD, optional)
gender: string (optional)
profilePicture: File (optional)
```

**Driver Fields** (if role="driver"):
```
vehicleType: string (required)
plateNumber: string (required)
unionName: string (optional)
bankName: string (required)
bankAccountNumber: string (required)
emergencyContact: string (optional)
vehiclePicture: File (optional)
licensePicture: File (optional)
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+234...",
    "dob": "1990-01-01",
    "gender": "male",
    "profilePictureUrl": "https://...",
    "role": "driver",
    "referralCode": "EASEJO1A2B"
  }
}
```

---

## Testing Checklist

- [ ] Rider signup with all fields
- [ ] Driver signup with vehicle info
- [ ] Profile picture uploads
- [ ] Vehicle pictures upload
- [ ] License pictures upload
- [ ] Password validation (min 8 chars)
- [ ] Email validation
- [ ] Phone validation (Nigerian format)
- [ ] Plate number formatting (auto-uppercase)
- [ ] File preview displays
- [ ] Auto-login after signup
- [ ] Redirect to correct dashboard
- [ ] Database records created
- [ ] URLs stored in database
- [ ] Graceful error handling
- [ ] Duplicate email/phone detection

---

## Environment Variables

```env
# Required for file uploads
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Standard Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

---

## Usage Examples

### For Riders
```
1. Register → I'm a Keke Rider
2. Fill: Name, Email, Phone, Password
3. Optional: DOB, Gender, Profile Picture
4. Submit → Auto-login → /user/dashboard
```

### For Drivers
```
1. Register → I'm a Driver
2. Fill: Name, Email, Phone, Password
3. Optional: DOB, Gender, Profile Picture
4. Fill: Vehicle Type, Plate, Bank Details
5. Optional: Union, Emergency Contact, Vehicle/License Photos
6. Submit → Auto-login → /driver/dashboard
```

---

## Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| "Please fill in all required fields" | Missing basic info | Fill all marked fields |
| "Passwords do not match" | Password fields differ | Ensure passwords match |
| "Password must be at least 8 characters" | Too short password | Use 8+ characters |
| "Please fill in all required driver fields" | Missing driver info | Fill vehicle/bank details |
| "Email or phone number already exists" | Duplicate account | Use different email/phone |
| "Invalid email format" | Bad email | Check email format |
| "Invalid phone number format" | Bad phone | Use Nigerian format |
| "Invalid plate number format" | Bad plate | Use ABC 123 XY format |
| "Invalid account number format" | Not 10 digits | Use 10-digit account number |

---

## Performance Notes

- ✅ Images uploaded server-side (safe with service role)
- ✅ No client-side image compression (optional future feature)
- ✅ Graceful error handling (continues if upload fails)
- ✅ File size validation on frontend + backend
- ✅ Automatic public URL generation
- ✅ Scrollable form for better mobile UX
- ✅ Form preview before final upload

---

## Security Features

- ✅ Service role key used for file uploads (bypasses RLS)
- ✅ Password hashing with bcryptjs (10 salt rounds)
- ✅ Input sanitization available (optional usage)
- ✅ MIME type validation
- ✅ File size limits enforced
- ✅ Unique email/phone in database
- ✅ NextAuth session management
- ✅ Referral code generation with timestamp

---

## Future Enhancements

- [ ] Real-time form validation
- [ ] OTP verification before signup
- [ ] Email confirmation required
- [ ] Image compression before upload
- [ ] Drag-and-drop file upload
- [ ] Multiple file upload at once
- [ ] Document verification workflow
- [ ] Two-factor authentication setup
- [ ] Social authentication (Google, Facebook)

---

**Status**: Ready for Testing ✅
**Last Updated**: January 8, 2026
