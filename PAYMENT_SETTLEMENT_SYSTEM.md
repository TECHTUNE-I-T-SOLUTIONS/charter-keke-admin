# Driver Payment Settlement System

## Overview

The Driver Payment Settlement System tracks daily platform fees, manages payment processing, and enforces driver availability rules based on payment status. This system automatically calculates daily settlement fees, sends payment reminders, and locks driver accounts when fees are overdue.

## Key Features

### 1. **Daily Settlement Tracking**
- Automatically creates daily settlements when rides are completed
- Calculates total platform fees (15% of fare) per day
- Tracks rides, earnings, and fees in one unified record
- Settlements are created per driver per day

### 2. **Payment Status Management**
- Three settlement statuses: **pending**, **paid**, **overdue**
- Payment due dates set to next day of settlement date
- Automatic status updates via Paystack integration
- Payment history with full transaction details

### 3. **Paystack Integration**
- Seamless payment initialization with Paystack API
- Automatic payment verification and confirmation
- Payment callbacks update settlement status
- Secure payment processing with reference tracking

### 4. **Driver Availability Locking**
- Drivers are automatically locked when settlements become overdue
- Lock reason tracked for transparency
- Automatic unlock when payment is confirmed
- Prevents earning new money while owing fees

### 5. **Payment Reminders**
- First reminder: Due date
- Second reminder: 2 days overdue
- Final reminder: 5 days overdue
- Automatic notifications sent to drivers

## Database Schema

### Tables

#### `driver_daily_settlement`
Tracks daily settlement fees for each driver.

```sql
Columns:
- id (UUID, PK)
- driver_id (UUID, FK)
- settlement_date (DATE)
- total_rides (INT)
- total_fare_amount (DECIMAL)
- total_platform_fees (DECIMAL)
- total_driver_earnings (DECIMAL)
- settlement_status (VARCHAR: pending/paid/overdue)
- payment_due_date (TIMESTAMP)
- paid_at (TIMESTAMP, nullable)
- created_at, updated_at (TIMESTAMP)

Unique Constraint: (driver_id, settlement_date)
```

#### `driver_payments`
Tracks all payment transactions from drivers.

```sql
Columns:
- id (UUID, PK)
- driver_id (UUID, FK)
- settlement_id (UUID, FK, nullable)
- amount (DECIMAL)
- payment_method (VARCHAR: paystack/bank_transfer/cash)
- payment_reference (VARCHAR, UNIQUE)
- status (VARCHAR: pending/completed/failed/refunded)
- payment_date (TIMESTAMP)
- confirmed_at (TIMESTAMP, nullable)
- metadata (JSONB)
- created_at, updated_at (TIMESTAMP)
```

#### `driver_payment_reminders`
Tracks payment reminders sent to drivers.

```sql
Columns:
- id (UUID, PK)
- driver_id (UUID, FK)
- settlement_id (UUID, FK)
- reminder_type (VARCHAR: first_notice/second_notice/final_notice)
- amount_owed (DECIMAL)
- sent_at (TIMESTAMP)
- acknowledged_at (TIMESTAMP, nullable)
- created_at (TIMESTAMP)
```

### Triggers

1. **ride_settlement_trigger**
   - Event: After ride status updated to 'completed'
   - Action: Creates or updates daily settlement record

2. **settlement_overdue_notify_trigger**
   - Event: After settlement status updated to 'overdue'
   - Action: Sends notification to driver

3. **payment_confirmed_notify_trigger**
   - Event: After payment status updated to 'completed'
   - Action: Sends confirmation notification and unlocks driver

## API Endpoints

### 1. Get Payment Status
**Endpoint:** `GET /api/driver/payment-status?driver_id={id}`

Returns driver's current settlements and payment history.

**Response:**
```json
{
  "settlements": [
    {
      "id": "uuid",
      "settlement_date": "2024-01-15",
      "total_rides": 5,
      "total_platform_fees": 4500,
      "settlement_status": "pending",
      "payment_due_date": "2024-01-16T00:00:00Z",
      "paid_at": null
    }
  ],
  "payments": [
    {
      "id": "uuid",
      "amount": 4500,
      "payment_method": "paystack",
      "status": "completed",
      "payment_date": "2024-01-16T10:30:00Z",
      "payment_reference": "ref_xxxxx",
      "confirmed_at": "2024-01-16T10:35:00Z"
    }
  ],
  "totalPending": 9000,
  "success": true
}
```

### 2. Initiate Payment
**Endpoint:** `POST /api/driver/initiate-payment`

**Request:**
```json
{
  "driverId": "uuid",
  "settlementIds": ["uuid1", "uuid2"],
  "amount": 9000
}
```

**Response:**
```json
{
  "authUrl": "https://checkout.paystack.com/...",
  "accessCode": "xxxxx",
  "reference": "ref_xxxxx",
  "paymentId": "uuid",
  "success": true
}
```

### 3. Payment Callback
**Endpoint:** `POST /api/driver/payment-callback`

Verifies payment with Paystack and updates settlement status.

**Request:**
```json
{
  "reference": "ref_xxxxx"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment verified and settlement updated",
  "payment": {...}
}
```

### 4. Lock/Unlock Driver Availability
**Endpoint:** `POST /api/driver/lock-availability`

Locks driver account due to unpaid settlements.

**Request:**
```json
{
  "driverId": "uuid",
  "reason": "unpaid_settlement"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver availability locked",
  "driver": {...}
}
```

**Endpoint:** `PUT /api/driver/lock-availability`

Unlocks driver account after payment.

**Request:**
```json
{
  "driverId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Driver availability unlocked",
  "driver": {...}
}
```

### 5. Check Overdue Settlements (Cron Job)
**Endpoint:** `GET /api/cron/check-overdue-settlements`

Checks for overdue settlements and locks drivers automatically.

**Headers:**
```
Authorization: Bearer {CRON_SECRET}
```

**Response:**
```json
{
  "success": true,
  "message": "Overdue settlements processed",
  "processed": 5
}
```

## Frontend Components

### Driver Payments Page (`/driver/payments`)

Located at `app/driver/payments/page.tsx`

**Features:**
- View pending settlements with "Pay Now" button
- Track paid settlements
- View full payment history
- Select multiple settlements to pay together
- Real-time payment status updates
- Integration with Paystack checkout

**Tabs:**
1. **Pending** - Settlements awaiting payment
2. **Paid** - Successfully paid settlements
3. **History** - All payment transactions

## Configuration

### Environment Variables

Add these to your `.env.local`:

```env
# Paystack
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx

# Cron Jobs
CRON_SECRET=your_secret_cron_key

# App URL
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Vercel Cron Configuration

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-overdue-settlements",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This runs the overdue settlement check daily at midnight UTC.

## Business Logic

### Settlement Calculation

When a ride is marked as completed:

1. Extract completion date from `completed_at`
2. Look up daily settlement for driver + date
3. If exists: Add ride stats (fare, fees, earnings)
4. If not: Create new settlement with ride stats
5. Update totals automatically

**Formulas:**
```
Platform Fee = Fare Amount × 0.15
Driver Earnings = Fare Amount × 0.85
Due Date = Settlement Date + 1 day
Overdue Status = TODAY > Due Date AND Status = 'pending'
```

### Payment Processing

1. Driver initiates payment via Paystack
2. System creates pending payment record
3. Driver completes Paystack checkout
4. Callback verifies with Paystack API
5. Update payment to 'completed'
6. Update all settlements to 'paid'
7. Unlock driver availability
8. Send confirmation notification

### Driver Lock/Unlock Flow

**Lock Conditions:**
- Settlement status becomes 'overdue' (24+ hours past due date)
- Driver has unpaid/overdue settlements
- Automatic via cron job check

**Unlock Conditions:**
- All settlements for driver marked as 'paid'
- Manual unlock via API
- Automatic when payment completed

## Notifications

### Notification Types

1. **Pending Reminder** - Settlement created
2. **Overdue Alert** - Settlement becomes overdue
3. **Payment Confirmed** - Payment successful
4. **Status Locked** - Driver account disabled
5. **Status Restored** - Driver account re-enabled

All notifications include:
- Settlement/payment details
- Action URLs to payments page
- Metadata for frontend processing

## Testing

### Manual Testing Steps

1. **Create a test ride:**
   - Book and complete a ride as a user
   - Driver accepts and completes ride

2. **Verify settlement creation:**
   - Check `driver_daily_settlement` table
   - Verify platform fees calculated correctly

3. **Initiate payment:**
   - Go to `/driver/payments`
   - Select pending settlement
   - Click "Pay Now"
   - Use Paystack test card

4. **Verify payment processing:**
   - Check `driver_payments` table
   - Verify status is 'completed'
   - Check if driver is still locked

### Sample Test Data

Create a test settlement:

```sql
INSERT INTO driver_daily_settlement (
  driver_id,
  settlement_date,
  total_rides,
  total_platform_fees,
  settlement_status,
  payment_due_date
) VALUES (
  'driver-uuid-here',
  CURRENT_DATE - interval '2 days',
  5,
  4500,
  'pending',
  CURRENT_TIMESTAMP + interval '1 day'
);
```

## Troubleshooting

### Common Issues

**Issue: Settlements not creating**
- Check ride completion status (must be 'completed')
- Verify driver_id is set on rides
- Check trigger is enabled in database

**Issue: Paystack payment not verifying**
- Verify PAYSTACK_SECRET_KEY is correct
- Check payment reference format
- Review Paystack API response in logs

**Issue: Driver not unlocking after payment**
- Verify settlement_id linked to payment
- Check driver availability logic
- Review database logs for errors

## Future Enhancements

1. **Partial Payments** - Allow paying individual settlements
2. **Payment Plans** - Installment options for large fees
3. **Incentives** - Early payment bonuses
4. **Reports** - Driver settlement history reports
5. **Email Notifications** - In addition to in-app
6. **SMS Reminders** - Via Termii integration
7. **Admin Dashboard** - Settlement management UI

## Support

For issues or questions:
1. Check error logs in `/app/api` routes
2. Verify database triggers are enabled
3. Review Paystack integration status
4. Check environment variables are set correctly

