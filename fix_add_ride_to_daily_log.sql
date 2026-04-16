-- ============================================================================
-- Fix: add_ride_to_daily_log function - JSONB type casting issue
-- ============================================================================
-- Issue: When ride status is updated to 'completed', the trg_add_ride_to_daily_log
-- trigger fires and tries to append ride IDs to a JSONB array
--
-- Error: "operator does not exist: text ->> integer"
-- Cause: Incorrect JSONB operations or type mismatches when updating ride_ids array
--
-- Solution: Recreate the function with proper JSONB array handling
-- ============================================================================

-- Step 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS trg_add_ride_to_daily_log ON public.rides CASCADE;

-- Step 2: Drop the problematic function
DROP FUNCTION IF EXISTS public.add_ride_to_daily_log() CASCADE;

-- Step 3: Recreate the function with proper JSONB handling
CREATE OR REPLACE FUNCTION public.add_ride_to_daily_log()
RETURNS TRIGGER AS $$
DECLARE
  v_log_id uuid;
  v_log_date date;
  v_ride_ids jsonb;
BEGIN
  -- Only process when driver_id is set (ride is assigned to driver)
  IF NEW.driver_id IS NOT NULL THEN
    -- Get today's date for the log
    v_log_date := CURRENT_DATE;
    
    -- Check if a log entry exists for this driver on this date
    SELECT id, ride_ids INTO v_log_id, v_ride_ids
    FROM public.driver_daily_rides_log
    WHERE driver_id = NEW.driver_id 
      AND log_date = v_log_date
    LIMIT 1;
    
    -- If no log exists, create one
    IF v_log_id IS NULL THEN
      -- Create new log entry with this ride ID
      INSERT INTO public.driver_daily_rides_log (
        driver_id,
        log_date,
        ride_ids,
        status
      ) VALUES (
        NEW.driver_id,
        v_log_date,
        jsonb_build_array(NEW.id::text),  -- Create array with ride ID as text
        'pending'
      ) 
      ON CONFLICT DO NOTHING;
    ELSE
      -- Log exists, append ride ID to the ride_ids array if not already present
      -- Check if ride ID already in array
      IF NOT (v_ride_ids @> jsonb_build_array(NEW.id::text)) THEN
        -- Append the ride ID to the array using array concatenation
        UPDATE public.driver_daily_rides_log
        SET 
          ride_ids = v_ride_ids || jsonb_build_array(NEW.id::text),
          updated_at = now()
        WHERE id = v_log_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Recreate the trigger to fire on both INSERT and UPDATE
CREATE TRIGGER trg_add_ride_to_daily_log
AFTER INSERT OR UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.add_ride_to_daily_log();

-- ============================================================================
-- WHAT WAS FIXED
-- ============================================================================
-- 1. Explicit type casting for JSONB arrays:
--    - NEW.id::text ensures UUID is converted to text before JSONB operations
--    - jsonb_build_array(NEW.id::text) creates proper JSONB array
--
-- 2. Proper JSONB array operations:
--    - OLD: Possibly used -> or ->> incorrectly
--    - NEW: Uses || for array concatenation (correct operator)
--    - NEW: Uses @> for containment checking (correct operator)
--
-- 3. Duplicate detection:
--    - Checks if ride ID already exists in array before appending
--    - Prevents duplicate ride IDs in the log
--
-- 4. NULL safety:
--    - Only processes when driver_id is set
--    - Uses ON CONFLICT DO NOTHING for insert safety
--
-- 5. Log entry creation:
--    - Creates entry if doesn't exist for driver on that date
--    - Updates existing entry if it already exists

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the fix:
--
-- SELECT trigger_name, event_manipulation, event_object_table, action_timing
-- FROM information_schema.triggers
-- WHERE trigger_name = 'trg_add_ride_to_daily_log';
--
-- Expected: 1 row showing AFTER INSERT OR UPDATE trigger

-- ============================================================================
-- TEST WORKFLOW
-- ============================================================================
-- 1. Deploy this SQL to Supabase
-- 2. Complete a ride in your app (driver marks it as 'completed')
-- 3. Check driver_daily_rides_log table:
--    SELECT * FROM driver_daily_rides_log
--    WHERE log_date = CURRENT_DATE
--    ORDER BY created_at DESC LIMIT 1;
-- 4. Should see ride IDs appended to ride_ids array
-- 5. No "operator does not exist" error should occur

-- ============================================================================
