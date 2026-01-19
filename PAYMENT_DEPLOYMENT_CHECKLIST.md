# Payment Settlement System - Implementation Checklist

## Pre-Deployment Checklist

### 1. Database Setup
- [ ] Run migration: `database/migrations/04_driver_payment_settlement.sql`
- [ ] Verify tables created: `driver_daily_settlement`, `driver_payments`, `driver_payment_reminders`
- [ ] Verify triggers created: `ride_settlement_trigger`, `settlement_overdue_notify_trigger`, `payment_confirmed_notify_trigger`
- [ ] Verify RLS policies enabled
- [ ] Verify indexes created

### 2. Environment Variables
- [ ] Set `PAYSTACK_SECRET_KEY=sk_live_xxxxx`
- [ ] Set `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx`
- [ ] Set `CRON_SECRET=your_secure_cron_secret_key`
- [ ] Verify `NEXT_PUBLIC_APP_URL` is set correctly
- [ ] Verify `NEXT_PUBLIC_SUPABASE_URL` exists
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` exists

### 3. Vercel Configuration
- [ ] Add cron job to `vercel.json`:
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

### 4. API Endpoints
- [ ] `/api/driver/payment-status` - GET endpoint created
- [ ] `/api/driver/initiate-payment` - POST endpoint created
- [ ] `/api/driver/payment-callback` - POST endpoint created
- [ ] `/api/driver/lock-availability` - POST/PUT endpoints created
- [ ] `/api/cron/check-overdue-settlements` - GET endpoint created

### 5. Frontend Components
- [ ] `/driver/payments` page created and working
- [ ] Payment status display working
- [ ] Settlement selection working
- [ ] "Pay Now" button initiates Paystack
- [ ] Sidebar updated with Payments link

### 6. Testing
- [ ] Test ride completion → settlement creation
- [ ] Test settlement shows in `/driver/payments`
- [ ] Test Paystack payment flow with test card
- [ ] Test payment verification and status update
- [ ] Test driver locking with overdue settlement
- [ ] Test cron job endpoint with secret
- [ ] Test driver unlock after payment

### 7. Notifications
- [ ] Verify notifications created on settlement overdue
- [ ] Verify notifications created on payment confirmed
- [ ] Verify notifications created on driver locked
- [ ] Check notification messages are clear
- [ ] Verify action URLs in notifications work

## Deployment Steps

### Step 1: Database Migration
```bash
# Connect to Supabase SQL Editor and run:
# Copy contents of: database/migrations/04_driver_payment_settlement.sql
# Execute in Supabase SQL Editor
```

### Step 2: Environment Variables
```bash
# In Vercel/hosting dashboard, set:
PAYSTACK_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
CRON_SECRET=your_secure_cron_secret_key
```

### Step 3: Vercel Configuration
```bash
# Update vercel.json with cron job
# Commit and push to main branch
```

### Step 4: Deploy
```bash
git add .
git commit -m "Add payment settlement system"
git push origin main
# Vercel will auto-deploy
```

### Step 5: Verify Deployment
- [ ] Check `/api/driver/payment-status` responds
- [ ] Check `/driver/payments` page loads
- [ ] Test payment flow end-to-end
- [ ] Monitor logs for any errors

## Post-Deployment

### Week 1 - Monitoring
- [ ] Monitor Paystack integration for errors
- [ ] Check database triggers are firing
- [ ] Review payment success rate
- [ ] Monitor cron job execution
- [ ] Check notification delivery

### Week 2 - Optimization
- [ ] Optimize database indexes if needed
- [ ] Review performance metrics
- [ ] Adjust reminder timing if needed
- [ ] Review error logs

### Ongoing
- [ ] Daily: Monitor cron job execution
- [ ] Weekly: Review payment reports
- [ ] Monthly: Analyze settlement patterns
- [ ] Quarterly: Update documentation

## Troubleshooting Guide

### Issue: Settlement not creating after ride completion
**Solution:**
1. Verify ride status is 'completed'
2. Verify driver_id is set on ride
3. Check trigger is enabled: `SELECT * FROM information_schema.triggers WHERE trigger_name = 'ride_settlement_trigger'`
4. Check database logs for errors

### Issue: Paystack payment fails
**Solution:**
1. Verify `PAYSTACK_SECRET_KEY` is correct
2. Check Paystack account has test mode disabled (production)
3. Verify payment amount is > 100 kobo
4. Check Paystack API status

### Issue: Driver not unlocking after payment
**Solution:**
1. Verify payment status is 'completed'
2. Verify settlement_id is linked to payment
3. Check for other unpaid settlements
4. Run manual unlock: `PUT /api/driver/lock-availability`

### Issue: Cron job not running
**Solution:**
1. Verify `CRON_SECRET` is set correctly
2. Check Vercel deployment includes cron configuration
3. Verify cron endpoint returns 200 status
4. Check Vercel logs for cron execution

## Rollback Plan

If issues occur:

1. **Disable Cron Job**
   - Remove from `vercel.json` and redeploy
   - Prevents automatic driver locking

2. **Disable Payment Processing**
   - Set `PAYSTACK_SECRET_KEY=""` to disable payments
   - API will return error but won't lock drivers

3. **Revert Database**
   - Drop tables: `DROP TABLE driver_payment_reminders CASCADE;`
   - Don't lose settlement data
   - Can rebuild migrations

4. **Full Rollback**
   - Revert code commit
   - Redeploy previous version
   - Restore database backup if available

## Support Resources

1. **Paystack Documentation:** https://paystack.com/docs/api/
2. **Supabase Triggers:** https://supabase.com/docs/guides/database/postgres/function-triggers
3. **Vercel Cron:** https://vercel.com/docs/cron-jobs
4. **System Documentation:** See `PAYMENT_SETTLEMENT_SYSTEM.md`

## Sign-Off

- [ ] Database migration successful
- [ ] API endpoints tested
- [ ] Frontend working
- [ ] Notifications functional
- [ ] Cron job configured
- [ ] Environment variables set
- [ ] Deployment complete
- [ ] User documentation updated
- [ ] Admin training completed

**Deployed by:** ___________________
**Date:** ___________________
**Version:** 1.0.0

