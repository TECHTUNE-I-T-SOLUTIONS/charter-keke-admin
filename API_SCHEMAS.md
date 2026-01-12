# Charter Keke - API Response Schemas

## Authentication API

### POST /api/auth/register

**Request:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone_number": "+2349012345678",
  "password": "SecurePass123!",
  "role": "user",
  "dob": "1995-01-15",
  "gender": "male"
}
```

**Success Response (201):**
```json
{
  "message": "User created successfully. Check your email for next steps.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error Response (400):**
```json
{
  "error": "Missing required fields"
}
```

**Error Response (409):**
```json
{
  "error": "Email or phone number already exists"
}
```

---

## Rides API

### GET /api/rides

**Query Parameters:**
- `status` (optional): pending, dispatched, accepted, in_progress, completed, cancelled
- `limit` (optional, default: 10): Maximum number of rides to return

**Success Response (200):**
```json
{
  "rides": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "rider_id": "550e8400-e29b-41d4-a716-446655440001",
      "pickup_zone": "Debari",
      "pickup_description": "Near main market",
      "destination_zone": "Yaba",
      "destination_description": "Yaba bus stop",
      "ride_type": "single",
      "fare_amount": 1500,
      "status": "completed",
      "assigned_driver_id": "550e8400-e29b-41d4-a716-446655440002",
      "created_at": "2025-12-23T10:30:00Z",
      "completed_at": "2025-12-23T10:45:00Z",
      "updated_at": "2025-12-23T10:45:00Z"
    }
  ]
}
```

### POST /api/rides

**Request:**
```json
{
  "pickup_zone": "Debari",
  "pickup_description": "Near the main market",
  "destination_zone": "Yaba",
  "destination_description": "Yaba bus stop",
  "ride_type": "single"
}
```

**Success Response (201):**
```json
{
  "message": "Ride created successfully",
  "ride": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "rider_id": "550e8400-e29b-41d4-a716-446655440001",
    "pickup_zone": "Debari",
    "pickup_description": "Near the main market",
    "destination_zone": "Yaba",
    "destination_description": "Yaba bus stop",
    "ride_type": "single",
    "fare_amount": null,
    "status": "dispatched",
    "assigned_driver_id": null,
    "created_at": "2025-12-23T10:30:00Z",
    "completed_at": null,
    "updated_at": "2025-12-23T10:30:00Z"
  }
}
```

---

## Driver API

### GET /api/driver/available-rides

**Success Response (200):**
```json
{
  "rides": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "rider_id": "550e8400-e29b-41d4-a716-446655440001",
      "pickup_zone": "Debari",
      "destination_zone": "Yaba",
      "ride_type": "single",
      "fare_amount": 1500,
      "status": "dispatched",
      "created_at": "2025-12-23T10:30:00Z"
    }
  ]
}
```

### POST /api/driver/accept-ride

**Request:**
```json
{
  "rideId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response (200):**
```json
{
  "message": "Ride accepted successfully",
  "ride": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "rider_id": "550e8400-e29b-41d4-a716-446655440001",
    "pickup_zone": "Debari",
    "destination_zone": "Yaba",
    "ride_type": "single",
    "fare_amount": 1500,
    "status": "accepted",
    "assigned_driver_id": "550e8400-e29b-41d4-a716-446655440002",
    "created_at": "2025-12-23T10:30:00Z"
  }
}
```

---

## Wallet API

### GET /api/wallet

**Success Response (200):**
```json
{
  "wallet": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "balance": 5000.00,
    "currency": "NGN",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
  }
}
```

### GET /api/wallet/transactions

**Query Parameters:**
- `limit` (optional, default: 20): Maximum number of transactions
- `type` (optional): credit, debit, payout, refund

**Success Response (200):**
```json
{
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "wallet_id": "550e8400-e29b-41d4-a716-446655440001",
      "amount": 1500.00,
      "transaction_type": "credit",
      "reference": "RIDE_550e8400",
      "source": "ride",
      "status": "completed",
      "created_at": "2025-12-23T10:45:00Z",
      "updated_at": "2025-12-23T10:45:00Z"
    }
  ]
}
```

---

## Admin API

### GET /api/admin/users

**Query Parameters:**
- `role` (optional): user, driver, admin, super_admin
- `status` (optional): active, suspended, pending
- `limit` (optional, default: 50)

**Success Response (200):**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "+2349012345678",
      "role": "user",
      "status": "active",
      "dob": "1995-01-15",
      "gender": "male",
      "created_at": "2025-12-23T10:30:00Z",
      "updated_at": "2025-12-23T10:30:00Z"
    }
  ]
}
```

### PUT /api/admin/users/:id

**Request:**
```json
{
  "status": "suspended",
  "reason": "Violation of terms"
}
```

**Success Response (200):**
```json
{
  "message": "User status updated",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+2349012345678",
    "role": "user",
    "status": "suspended",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
  }
}
```

### GET /api/admin/drivers

**Query Parameters:**
- `status` (optional): online, offline, busy
- `verified` (optional): true or false

**Success Response (200):**
```json
{
  "drivers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "vehicle_type": "Bajaj Auto",
      "plate_number": "ABC123",
      "operating_zones": ["Debari", "Shomolu"],
      "union_name": "KK Union 1",
      "availability_status": "online",
      "bank_name": "GTBank",
      "bank_account_number": "0123456789",
      "verified": true,
      "created_at": "2025-12-23T10:30:00Z"
    }
  ]
}
```

---

## User Profile API

### GET /api/user/profile

**Success Response (200):**
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+2349012345678",
    "role": "user",
    "status": "active",
    "dob": "1995-01-15",
    "gender": "male",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T10:30:00Z"
  },
  "wallet": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "balance": 5000.00,
    "currency": "NGN"
  },
  "driver": null
}
```

### PUT /api/user/profile

**Request:**
```json
{
  "first_name": "Jonathan",
  "dob": "1995-01-15",
  "gender": "male"
}
```

**Success Response (200):**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "first_name": "Jonathan",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "+2349012345678",
    "role": "user",
    "status": "active",
    "dob": "1995-01-15",
    "gender": "male",
    "created_at": "2025-12-23T10:30:00Z",
    "updated_at": "2025-12-23T11:00:00Z"
  }
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "Email or phone number already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Common HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid input or missing fields |
| 401 | Unauthorized | Missing or invalid auth |
| 403 | Forbidden | Authenticated but no permission |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 500 | Server Error | Unexpected error |

---

## Testing with cURL

### Register User
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

### Create Ride
```bash
curl -X POST http://localhost:3000/api/rides \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pickup_zone": "Debari",
    "pickup_description": "Near main market",
    "destination_zone": "Yaba",
    "destination_description": "Yaba bus stop",
    "ride_type": "single"
  }'
```

### Get Wallet
```bash
curl -X GET http://localhost:3000/api/wallet \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

**API Documentation Version**: 1.0
**Last Updated**: December 23, 2025
**Status**: Complete
