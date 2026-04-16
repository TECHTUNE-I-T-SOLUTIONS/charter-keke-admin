-- ============================================================================
-- Fix Settlement Trigger - Create Settlements on RIDE ACCEPTANCE (not completion)
-- ============================================================================
-- Issue: Settlement records should only be created when a ride is ACCEPTED
-- This way the driver gets notified ONCE to pay, not again on completion
-- 
-- Workflow:
-- 1. Driver accepts ride → Settlement record created → Driver notified to pay
-- 2. Driver completes ride → No settlement creation (avoid double payment notice)
--
-- Solution: Drop all completion-related settlement triggers and recreate
-- function to trigger ONLY on 'accepted' status change
-- ============================================================================

-- Step 1: Drop all existing settlement-related triggers and functions
DROP TRIGGER IF EXISTS ride_settlement_trigger ON public.rides CASCADE;
DROP TRIGGER IF EXISTS create_driver_settlement_on_ride_complete ON public.rides CASCADE;
DROP TRIGGER IF EXISTS update_driver_settlement_on_ride_complete ON public.rides CASCADE;
DROP TRIGGER IF EXISTS insert_settlement_on_ride_complete ON public.rides CASCADE;
DROP TRIGGER IF EXISTS trg_handle_ride_completion_settlement ON public.rides CASCADE;

DROP FUNCTION IF EXISTS public.create_daily_settlement() CASCADE;
DROP FUNCTION IF EXISTS public.create_driver_daily_settlement() CASCADE;
DROP FUNCTION IF EXISTS public.handle_ride_completion_settlement() CASCADE;

-- Step 2: Create the corrected function that fires on ACCEPTED status
-- This function creates settlement records when a driver ACCEPTS a ride
CREATE OR REPLACE FUNCTION public.create_daily_settlement()
RETURNS TRIGGER AS $$
DECLARE
  settlement_date date;
  existing_settlement uuid;
BEGIN
  -- Only process when ride transitions to 'accepted' status
  -- This fires ONCE when driver accepts, not again on completion
  IF NEW.status = 'accepted' AND NEW.driver_id IS NOT NULL THEN
    -- Get today's date for settlement_date
    settlement_date := CURRENT_DATE;
    
    -- Check if a settlement record already exists for this driver on this date
    SELECT id INTO existing_settlement
    FROM public.driver_daily_settlement
    WHERE driver_id = NEW.driver_id 
      AND public.driver_daily_settlement.settlement_date = settlement_date
    LIMIT 1;
    
    -- If settlement doesn't exist for today, create a new one
    IF existing_settlement IS NULL THEN
      INSERT INTO public.driver_daily_settlement (
        driver_id,
        settlement_date,
        total_rides,
        total_fare_amount,
        total_platform_fees,
        total_driver_earnings,
        payment_due_date
      ) VALUES (
        NEW.driver_id,
        settlement_date,
        1,
        COALESCE(NEW.fare_amount, 0),
        COALESCE(NEW.platform_fee, 0),
        COALESCE(NEW.driver_earnings, 0),
        settlement_date::timestamp + interval '1 day'
      );
    ELSE
      -- Settlement exists for this driver today, increment the totals
      UPDATE public.driver_daily_settlement
      SET
        total_rides = total_rides + 1,
        total_fare_amount = total_fare_amount + COALESCE(NEW.fare_amount, 0),
        total_platform_fees = total_platform_fees + COALESCE(NEW.platform_fee, 0),
        total_driver_earnings = total_driver_earnings + COALESCE(NEW.driver_earnings, 0),
        updated_at = now()
      WHERE id = existing_settlement;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Create the trigger that fires ONLY when rides are ACCEPTED (not completed)
-- This ensures settlement notification happens only once per acceptance
CREATE TRIGGER ride_settlement_trigger
AFTER UPDATE ON public.rides
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted')
EXECUTE FUNCTION public.create_daily_settlement();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the fix:

-- 1. Verify ride_settlement_trigger exists and is set to fire on ACCEPTED:
-- SELECT trigger_schema, trigger_name, event_manipulation, event_object_table, 
--        action_timing, condition
-- FROM information_schema.triggers
-- WHERE trigger_name = 'ride_settlement_trigger';
-- Expected: 1 row with WHEN clause checking for 'accepted' status

-- 2. Verify create_daily_settlement function exists:
-- SELECT proname FROM pg_proc WHERE proname = 'create_daily_settlement';
-- Expected: 1 row

-- 3. Important: Next ride acceptance will create a settlement record
-- Complete test flow:
--   a) Driver accepts a new ride
--   b) Check driver_daily_settlement table:
--      SELECT * FROM driver_daily_settlement 
--      WHERE driver_id = [driver_id] AND settlement_date = CURRENT_DATE;
--   c) Should see 1 record created at ride acceptance
--   d) When ride is completed: NO new settlement created, only this one exists
--   e) Driver sees payment notice only ONCE (at acceptance)

-- ============================================================================


