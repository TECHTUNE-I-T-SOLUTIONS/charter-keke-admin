-- ============================================================================
-- Fix: Ambiguous column reference in create_daily_settlement() function
-- ============================================================================
-- Error: "column reference 'settlement_date' is ambiguous"
-- Cause: Query has 'settlement_date = settlement_date' which PostgreSQL 
--        cannot disambiguate between table column and PL/pgSQL variable
--
-- Solution: Explicitly qualify the table column name
-- ============================================================================

-- Step 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS ride_settlement_trigger ON public.rides CASCADE;

-- Step 2: Drop the problematic function
DROP FUNCTION IF EXISTS public.create_daily_settlement() CASCADE;

-- Step 3: Recreate with EXPLICIT column qualification
CREATE OR REPLACE FUNCTION public.create_daily_settlement()
RETURNS TRIGGER AS $$
DECLARE
  v_settlement_date date;
  v_existing_settlement uuid;
BEGIN
  -- Only process when ride transitions to 'accepted' status
  -- This fires ONCE when driver accepts, not again on completion
  IF NEW.status = 'accepted' AND NEW.driver_id IS NOT NULL THEN
    -- Get today's date for settlement_date
    v_settlement_date := CURRENT_DATE;
    
    -- Check if a settlement record already exists for this driver on this date
    -- EXPLICITLY qualify table column to avoid ambiguity
    SELECT id INTO v_existing_settlement
    FROM public.driver_daily_settlement
    WHERE driver_id = NEW.driver_id 
      AND public.driver_daily_settlement.settlement_date = v_settlement_date
    LIMIT 1;
    
    -- If settlement doesn't exist for today, create a new one
    IF v_existing_settlement IS NULL THEN
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
        v_settlement_date,
        1,
        COALESCE(NEW.fare_amount, 0),
        COALESCE(NEW.platform_fee, 0),
        COALESCE(NEW.driver_earnings, 0),
        v_settlement_date::timestamp + interval '1 day'
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
      WHERE id = v_existing_settlement;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the trigger that fires ONLY when rides are ACCEPTED
CREATE TRIGGER ride_settlement_trigger
AFTER UPDATE ON public.rides
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'accepted')
EXECUTE FUNCTION public.create_daily_settlement();

-- ============================================================================
-- WHAT WAS FIXED
-- ============================================================================
-- 1. Variable naming: Changed to use v_ prefix for ALL variables
--    - v_settlement_date (instead of settlement_date)
--    - v_existing_settlement (instead of existing_settlement)
--    - This prevents ANY ambiguity with column names
--
-- 2. Explicit table qualification in WHERE clause:
--    - public.driver_daily_settlement.settlement_date = v_settlement_date
--    - Now clear which side is table column vs variable
--
-- 3. Used v_ prefixed variables everywhere consistently
--    - Makes code more readable
--    - Prevents future ambiguity issues

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify:
--
-- SELECT trigger_name, event_manipulation, event_object_table
-- FROM information_schema.triggers
-- WHERE trigger_name = 'ride_settlement_trigger';
--
-- Expected: 1 row showing AFTER UPDATE trigger on rides table

-- ============================================================================
-- TEST
-- ============================================================================
-- 1. Deploy this SQL to Supabase
-- 2. Try accepting a ride as a driver
-- 3. Should work without "ambiguous column" error
-- 4. Settlement record should be created in driver_daily_settlement table
-- 5. Check logs - should see "[RideAcceptance] ✅ Ride updated successfully"

-- ============================================================================
