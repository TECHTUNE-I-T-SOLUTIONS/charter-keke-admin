# Payment Settlement System - Quick Reference

## Key Concepts

### Settlement
- Created per driver per day when rides complete
- Contains: rides count, platform fees, driver earnings
- Status: pending → paid OR overdue
- Due date: settlement date + 1 day

### Payment
- Transaction record linking driver to Paystack
- Contains: amount, method, reference, status
- Can cover one or multiple settlements
- Status: pending → completed or failed

### Lock
- Driver account disabled when fees unpaid
- Automatic: after due date passes
- Manual: via admin API
- Unlock: when payment confirmed

## API Quick Reference

### Get Payment Status
```bash
GET /api/driver/payment-status?driver_id=uuid
```
Returns: settlements, payments, totalPending

### Initiate Payment
```bash
POST /api/driver/initiate-payment
Body: { driverId, settlementIds, amount }
Returns: authUrl (redirect to Paystack)
```

### Handle Payment Callback
```bash
POST /api/driver/payment-callback
Body: { reference }
Returns: payment verified, settlements updated
```

### Lock Driver
```bash
POST /api/driver/lock-availability
Body: { driverId, reason }
Returns: driver locked
```

### Unlock Driver
```bash
PUT /api/driver/lock-availability
Body: { driverId }
Returns: driver unlocked (if no unpaid settlements)
```

### Check Overdue (Cron)
```bash
GET /api/cron/check-overdue-settlements
Header: Authorization: Bearer {CRON_SECRET}
Returns: count of processed overdue settlements
```

## Database Schema Quick Reference

### Settlement Status Flow
```
pending (due tomorrow)
   ↓
[PAYMENT REQUIRED]
   ↓
paid ✓ OR overdue ✗
```

### Settlement Fields
- `id` - UUID primary key
- `driver_id` - Foreign key to drivers
- `settlement_date` - When rides completed
- `total_platform_fees` - Amount owed (15% of fares)
- `settlement_status` - pending/paid/overdue
- `payment_due_date` - When payment due
- `paid_at` - When actually paid

### Payment Fields
- `id` - UUID primary key
- `driver_id` - Which driver paid
- `settlement_id` - Which settlement covered
- `payment_reference` - Paystack reference
- `status` - pending/completed/failed
- `confirmed_at` - When verified with Paystack

## Frontend Quick Reference

### Payments Page (`/driver/payments`)
```
Components:
- Total Due Card (red alert if > 0)
- Tabs: Pending | Paid | History
- Pending: List with checkboxes + Pay Now button
- Paid: List with confirmation dates
- History: All transactions with status
```

### Integration Points
```javascript
// Fetch payment status
const response = await fetch(
  `/api/driver/payment-status?driver_id=${driverId}`
);

// Initiate Paystack payment
const response = await fetch('/api/driver/initiate-payment', {
  method: 'POST',
  body: JSON.stringify({
    driverId,
    settlementIds: [id1, id2],
    amount: totalFees
  })
});

// Redirect to Paystack
window.location.href = response.data.authUrl;
```

## Configuration Quick Reference

### .env.local
```env
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
CRON_SECRET=secure_secret_here
NEXT_PUBLIC_APP_URL=https://domain.com
```

### vercel.json
```json
{
  "crons": [{
    "path": "/api/cron/check-overdue-settlements",
    "schedule": "0 0 * * *"
  }]
}
```

## Notification Quick Reference

### Overdue Settlement
- **Type:** alert
- **Title:** "Payment Due"
- **Message:** "Settlement for [date] is overdue. Please pay."
- **Data:** settlement_id, amount_due, settlement_date

### Payment Confirmed
- **Type:** success
- **Title:** "Payment Confirmed"
- **Message:** "Payment of ₦X confirmed. Driver status active."
- **Data:** payment_id, amount, payment_reference

### Driver Locked
- **Type:** alert
- **Title:** "Driver Status Locked"
- **Message:** "Account disabled due to unpaid settlement."
- **Data:** settlement_id, amount_owed

## Testing Quick Commands

### Create Test Settlement
```sql
INSERT INTO driver_daily_settlement (
  driver_id, settlement_date, total_rides,
  total_platform_fees, settlement_status,
  payment_due_date
) VALUES (
  'driver-uuid', CURRENT_DATE - interval '2 days',
  5, 4500, 'pending',
  CURRENT_TIMESTAMP + interval '1 day'
);
```

### Check Settlements
```sql
SELECT * FROM driver_daily_settlement
WHERE driver_id = 'uuid'
ORDER BY settlement_date DESC;
```

### Check Payments
```sql
SELECT * FROM driver_payments
WHERE driver_id = 'uuid'
ORDER BY payment_date DESC;
```

### Test Cron Endpoint
```bash
curl -H "Authorization: Bearer CRON_SECRET" \
  https://yourdomain.com/api/cron/check-overdue-settlements
```

## Common Operations

### Debug Settlement Not Created
1. Verify ride status = 'completed'
2. Check `completed_at` timestamp exists
3. Run: `SELECT * FROM rides WHERE id = 'ride-uuid'`
4. Check trigger: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'ride_settlement_trigger'`

### Debug Payment Not Processing
1. Verify Paystack key correct
2. Check payment reference: `SELECT * FROM driver_payments WHERE payment_reference = 'ref_xxx'`
3. Verify amount > 100 kobo
4. Check Paystack API response in logs

### Debug Driver Not Unlocking
1. Check payment status: `SELECT status FROM driver_payments WHERE id = 'uuid'`
2. List unpaid settlements: `SELECT * FROM driver_daily_settlement WHERE driver_id = 'uuid' AND settlement_status != 'paid'`
3. Verify driver is_available field

## Performance Tips

1. **Cron Job**
   - Runs once per day (midnight UTC)
   - Processes all overdue settlements
   - Takes ~30 seconds typical

2. **API Calls**
   - Cache payment status (30 seconds)
   - Use indexes on driver_id queries
   - Paginate payment history (10 per page)

3. **Database**
   - Indexes on: driver_id, status, dates
   - RLS policies filter at database level
   - Triggers are efficient (no loops)

## File Locations

```
API Routes:
  /api/driver/payment-status/route.ts
  /api/driver/initiate-payment/route.ts
  /api/driver/payment-callback/route.ts
  /api/driver/lock-availability/route.ts
  /api/cron/check-overdue-settlements/route.ts

Frontend:
  /driver/payments/page.tsx
  components/dashboard-sidebar.tsx (updated)

Database:
  database/migrations/04_driver_payment_settlement.sql
  sql/driver_payment_settlement.sql

Documentation:
  PAYMENT_SETTLEMENT_SYSTEM.md (detailed)
  PAYMENT_IMPLEMENTATION_COMPLETE.md (overview)
  PAYMENT_DEPLOYMENT_CHECKLIST.md (deployment)
```

## Support Contacts

- **Paystack Support:** support@paystack.com
- **Supabase Support:** support@supabase.io
- **Vercel Support:** support@vercel.com

---

**Last Updated:** 2024
**Version:** 1.0.0
