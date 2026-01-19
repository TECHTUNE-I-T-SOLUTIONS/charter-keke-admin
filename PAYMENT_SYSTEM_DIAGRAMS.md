# Payment Settlement System - Visual Architecture

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DRIVER PAYMENT SYSTEM                        │
└─────────────────────────────────────────────────────────────────┘

                         SETTLEMENT FLOW
                         ═══════════════

    RIDE COMPLETED          TRIGGER FIRES        SETTLEMENT CREATED
    ┌─────────────┐        ┌──────────────┐     ┌────────────────┐
    │ Driver      │───────▶│ ride_        │────▶│ driver_daily_  │
    │ finishes    │        │ settlement_  │     │ settlement     │
    │ ride        │        │ trigger      │     │ record         │
    └─────────────┘        └──────────────┘     └────────────────┘
                                                       │
                                                       │ data
                                                       ▼
                                          ┌────────────────────────┐
                                          │ Fields:                │
                                          │ - settlement_date      │
                                          │ - total_rides: 1       │
                                          │ - platform_fees: 300   │
                                          │ - status: pending      │
                                          │ - due_date: tomorrow   │
                                          └────────────────────────┘


                          PAYMENT FLOW
                          ════════════

    DRIVER INITIATES         API CREATES        REDIRECTS TO
    PAYMENT                  PAYSTACK           CHECKOUT
    ┌──────────────┐        ┌──────────────┐   ┌──────────────┐
    │ Select fee   │───────▶│ POST /api/   │──▶│ Paystack     │
    │ Click "Pay   │        │ initiate-    │   │ checkout page│
    │ Now"         │        │ payment      │   │              │
    └──────────────┘        └──────────────┘   └──────────────┘
                                                       │
                                                       │ user pays
                                                       ▼
    PAYMENT CONFIRMED      CALLBACK FIRES      SETTLEMENTS UPDATED
    ┌──────────────┐      ┌──────────────┐    ┌────────────────┐
    │ Paystack     │─────▶│ payment-     │───▶│ status: paid    │
    │ confirms     │      │ callback     │    │ paid_at: now    │
    │ payment      │      │ verifies     │    │ unlock driver   │
    └──────────────┘      └──────────────┘    └────────────────┘
                                                       │
                                                       │ notify
                                                       ▼
                                          ┌────────────────────────┐
                                          │ Notification:          │
                                          │ "Payment Confirmed     │
                                          │ ₦300 received"         │
                                          └────────────────────────┘


                       LOCK/UNLOCK FLOW
                       ════════════════

    SETTLEMENT OVERDUE      CRON JOB RUNS       DRIVER LOCKED
    ┌──────────────┐       ┌──────────────┐    ┌────────────────┐
    │ payment_due  │       │ check-       │───▶│ is_available   │
    │ date passed  │──────▶│ overdue-     │    │ = false        │
    │ status =     │       │ settlements  │    │ alert sent     │
    │ pending      │       │ cron job     │    │                │
    └──────────────┘       └──────────────┘    └────────────────┘
         │                                              ▲
         │                                              │
         │                                     lock_reason:
         │                                     "overdue_settlement"
         │
         ├──────────────────────────────────────────────────┐
         │                                                  │
         │                    OR                           │
         │                                                  │
         │              PAYMENT RECEIVED                    │
         │              ──────────────────                  │
         │                    │                            │
         │                    ▼                            │
         │         ┌──────────────────────┐                │
         │         │ All settlements paid? │                │
         │         │ YES ✓                │                │
         │         └──────────────────────┘                │
         │                    │                            │
         │                    ▼                            │
         │         ┌──────────────────────┐                │
         │         │ DRIVER UNLOCKED      │◀───────────────┘
         │         │ is_available = true  │
         │         │ Success notification │
         │         └──────────────────────┘
         │
         └─ If NO settlement paid:
              └─ STAY LOCKED (need to pay all)


                      DATABASE SCHEMA
                      ═══════════════

    ┌──────────────────────────────────────────┐
    │     driver_daily_settlement table         │
    ├──────────────────────────────────────────┤
    │ • id (UUID)                              │
    │ • driver_id (FK)                         │
    │ • settlement_date (DATE)                 │
    │ • total_platform_fees (DECIMAL)          │
    │ • settlement_status (pending/paid/       │
    │                     overdue)             │
    │ • payment_due_date (TIMESTAMP)           │
    │ • paid_at (TIMESTAMP)                    │
    └──────────────────────────────────────────┘
                    ▲
                    │ links to
                    │
    ┌──────────────────────────────────────────┐
    │        driver_payments table              │
    ├──────────────────────────────────────────┤
    │ • id (UUID)                              │
    │ • driver_id (FK)                         │
    │ • settlement_id (FK)                     │
    │ • amount (DECIMAL)                       │
    │ • payment_method (paystack/...)          │
    │ • payment_reference (UNIQUE)             │
    │ • status (pending/completed/failed)      │
    │ • confirmed_at (TIMESTAMP)               │
    └──────────────────────────────────────────┘
                    │
                    │ notifies via
                    ▼
    ┌──────────────────────────────────────────┐
    │     driver_payment_reminders table       │
    ├──────────────────────────────────────────┤
    │ • id (UUID)                              │
    │ • driver_id (FK)                         │
    │ • settlement_id (FK)                     │
    │ • reminder_type (first/second/final)     │
    │ • sent_at (TIMESTAMP)                    │
    │ • acknowledged_at (TIMESTAMP)            │
    └──────────────────────────────────────────┘


                      API ENDPOINTS
                      ═════════════

    ┌────────────────────────────────────────────────────┐
    │ GET /api/driver/payment-status                     │
    │ Returns: settlements[], payments[], totalPending   │
    └────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────┐
    │ POST /api/driver/initiate-payment                  │
    │ Input: driverId, settlementIds, amount             │
    │ Returns: Paystack authorization URL               │
    └────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────┐
    │ POST /api/driver/payment-callback                  │
    │ Input: reference (from Paystack)                   │
    │ Action: Verify → Update settlements → Unlock      │
    └────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────┐
    │ POST /api/driver/lock-availability                 │
    │ Input: driverId, reason                            │
    │ Action: Lock driver account                        │
    └────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────┐
    │ PUT /api/driver/lock-availability                  │
    │ Input: driverId                                    │
    │ Action: Unlock if all settlements paid             │
    └────────────────────────────────────────────────────┘

    ┌────────────────────────────────────────────────────┐
    │ GET /api/cron/check-overdue-settlements            │
    │ Header: Authorization: Bearer CRON_SECRET          │
    │ Action: Check → Lock → Notify (daily at midnight) │
    └────────────────────────────────────────────────────┘


                   NOTIFICATION FLOW
                   ═════════════════

    ┌─────────────────────┐
    │ SETTLEMENT CREATED  │
    └────────┬────────────┘
             │ (optional: due date reminder)
             ▼
    ┌─────────────────────────────────────────┐
    │ Notification: "Settlement created       │
    │  Platform fee: ₦300 (Due tomorrow)"     │
    └──────────────┬──────────────────────────┘
                   │
            (payment not made)
                   │
                   ▼
    ┌─────────────────────────────────────────┐
    │ SETTLEMENT BECOMES OVERDUE              │
    │ Trigger: settlement_overdue_notify      │
    │ Action: Send alert notification         │
    └──────────────┬──────────────────────────┘
                   │
                   ▼
    ┌─────────────────────────────────────────┐
    │ Notification: "OVERDUE ALERT             │
    │  Settlement for [date] is overdue.      │
    │  Please pay ₦300 to restore access"    │
    └──────────────┬──────────────────────────┘
                   │
            (payment made)
                   │
                   ▼
    ┌─────────────────────────────────────────┐
    │ PAYMENT CONFIRMED                       │
    │ Trigger: payment_confirmed_notify       │
    │ Action: Send success notification       │
    └──────────────┬──────────────────────────┘
                   │
                   ▼
    ┌─────────────────────────────────────────┐
    │ Notification: "PAYMENT CONFIRMED        │
    │  ₦300 received. Driver status active"  │
    │  You can now accept rides!"             │
    └─────────────────────────────────────────┘


                      UI COMPONENTS
                      ═════════════

    DRIVER PAYMENTS PAGE (/driver/payments)
    ══════════════════════════════════════

    ┌───────────────────────────────────────────┐
    │         TOTAL AMOUNT DUE (Red Alert)      │
    │                 ₦9,000                    │
    │                                           │
    │  ⚠️  Your driver account is locked until  │
    │      payment is made. Pay before [date]   │
    │                 [PAY NOW] button          │
    └───────────────────────────────────────────┘

    ┌───────────────────────────────────────────┐
    │  [PENDING] [PAID] [HISTORY]               │
    └───────────────────────────────────────────┘

    PENDING TAB:
    ┌───────────────────────────────────────────┐
    │ ☐ 2024-01-15 Settlement                   │
    │   5 rides | ₦4,500 platform fees          │
    │   Due: 2024-01-16 [OVERDUE] ⚠️             │
    │   [Include in payment]                     │
    └───────────────────────────────────────────┘

    ┌───────────────────────────────────────────┐
    │ ☐ 2024-01-14 Settlement                   │
    │   3 rides | ₦2,700 platform fees          │
    │   Due: 2024-01-15 [OVERDUE] ⚠️             │
    │   [Include in payment]                     │
    └───────────────────────────────────────────┘

    [SELECT ALL] [PAY SELECTED ₦7,200]

    PAID TAB:
    ┌───────────────────────────────────────────┐
    │ ✓ 2024-01-13 Settlement                   │
    │   4 rides | ₦3,600 platform fees          │
    │   Paid: 2024-01-14 [PAID] ✓               │
    └───────────────────────────────────────────┘

    HISTORY TAB:
    ┌───────────────────────────────────────────┐
    │ Payment Confirmed                         │
    │ ₦4,500 | Paystack                         │
    │ Reference: ref_abc123...                  │
    │ Date: 2024-01-14 10:30 [COMPLETED] ✓     │
    └───────────────────────────────────────────┘


                   SETTLEMENT LIFECYCLE
                   ═══════════════════

    Day 1 (Ride Completed)
    ──────────────────────
    Ride marked complete → Settlement created
    Status: PENDING
    Due date: Day 2 midnight

    Day 2 (Due Date) - Morning
    ──────────────────────────
    Settlement still pending
    Driver can still accept rides
    Driver sees payment reminder

    Day 2 (Due Date) - Midnight + 1 hour
    ────────────────────────────────────
    Cron job runs: check-overdue-settlements
    Finds overdue settlements
    Locks drivers: is_available = false
    Sends alert notification

    Day 3-X (Overdue)
    ─────────────────
    Driver account LOCKED
    Cannot accept new rides
    Sees alert: "Pay to restore access"

    Day X (Payment Made)
    ────────────────────
    Driver initiates payment
    Paystack verifies payment
    Settlement marked PAID
    Driver account UNLOCKED
    Success notification sent
    Ready to accept rides again!


                   COST BREAKDOWN
                   ══════════════

    Example: ₦2,000 Ride

    Revenue:        ₦2,000
         │
         ├─ Platform Fee (15%):  ₦300  ◄─── Settlement Fee
         └─ Driver Gets (85%):   ₦1,700

    Settlement Tracking:
    ┌──────────────────────────┐
    │ Total Rides: 5            │
    │ Total Fares: ₦10,000      │
    │ Platform Fees: ₦1,500     │ ◄─── Amount Owed
    │ Driver Earnings: ₦8,500   │
    └──────────────────────────┘

    Payment Due: ₦1,500 by next day


                DEPLOYMENT FLOW
                ═══════════════

    1. RUN DATABASE MIGRATION
       ├─ Create 3 new tables
       ├─ Create 3 triggers
       └─ Create RLS policies

    2. SET ENVIRONMENT VARIABLES
       ├─ PAYSTACK_SECRET_KEY
       ├─ NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
       └─ CRON_SECRET

    3. CONFIGURE VERCEL CRON
       └─ Add cron job schedule (0 0 * * *)

    4. DEPLOY CODE
       ├─ API endpoints
       ├─ Frontend page
       └─ Sidebar updates

    5. TEST SYSTEM
       ├─ Create test settlement
       ├─ Test payment flow
       ├─ Test driver locking
       └─ Test cron job

    6. MONITOR
       ├─ Check logs
       ├─ Verify payments
       └─ Monitor cron execution


═══════════════════════════════════════════════════════════════════
                    SYSTEM STATUS: ✅ READY
═══════════════════════════════════════════════════════════════════
