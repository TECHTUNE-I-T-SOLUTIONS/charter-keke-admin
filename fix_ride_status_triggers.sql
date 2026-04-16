-- ============================================================================
-- Fix: Proper notification trigger for ride status changes
-- ============================================================================
-- Issue: notify_on_ride_status_change() has JSONB type casting issues
-- When building JSONB with UUID and VARCHAR values, they must be explicitly cast to text
--
-- Error: "operator does not exist: text ->> integer"
-- Cause: Mixing UUID/VARCHAR with JSONB without proper type casting
--
-- Solution: Recreate the function with proper type casting in JSONB operations
-- ============================================================================

-- Step 1: Drop the broken trigger and function
DROP TRIGGER IF EXISTS ride_status_notify ON public.rides CASCADE;
DROP FUNCTION IF EXISTS public.notify_on_ride_status_change() CASCADE;

-- Step 2: Recreate the function with PROPER TYPE CASTING for JSONB
CREATE OR REPLACE FUNCTION public.notify_on_ride_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_rider_user_id UUID;
  v_driver_user_id UUID;
  v_notification_type VARCHAR;
  v_notification_title VARCHAR;
  v_notification_message TEXT;
BEGIN
  -- Only process status changes
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Get rider user_id
    SELECT id INTO v_rider_user_id FROM public.users WHERE id = NEW.rider_id;
    
    -- Determine notification type and title based on new status
    CASE NEW.status
      WHEN 'accepted' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Driver Accepted Your Ride';
        v_notification_message := 'A driver has accepted your ride request and is on the way.';
      WHEN 'in_progress' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Your Ride Has Started';
        v_notification_message := 'Your ride has started. Your driver is picking you up.';
      WHEN 'completed' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Ride Completed';
        v_notification_message := 'Your ride has been completed. Thank you for riding with us!';
      WHEN 'cancelled' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Ride Cancelled';
        v_notification_message := 'Your ride has been cancelled.';
      ELSE
        RETURN NEW;
    END CASE;
    
    -- =====================================================================
    -- Notify Rider (if user_id exists)
    -- =====================================================================
    IF v_rider_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id, 
        title, 
        message, 
        type, 
        channel, 
        related_table, 
        related_id, 
        data,
        read,
        created_at,
        updated_at
      ) VALUES (
        v_rider_user_id,
        v_notification_title,
        v_notification_message,
        v_notification_type,
        'in_app',
        'rides',
        NEW.id,
        jsonb_build_object(
          'ride_id', NEW.id::text,
          'status', NEW.status::text,
          'pickup_zone', COALESCE(NEW.pickup_zone, ''),
          'destination_zone', COALESCE(NEW.destination_zone, '')
        ),
        false,
        now(),
        now()
      );
    END IF;
    
    -- =====================================================================
    -- Notify Driver (if driver is assigned)
    -- =====================================================================
    IF NEW.driver_id IS NOT NULL THEN
      SELECT user_id INTO v_driver_user_id FROM public.drivers WHERE id = NEW.driver_id;
      
      IF v_driver_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (
          user_id, 
          title, 
          message, 
          type, 
          channel, 
          related_table, 
          related_id, 
          data,
          read,
          created_at,
          updated_at
        ) VALUES (
          v_driver_user_id,
          v_notification_title,
          v_notification_message,
          v_notification_type,
          'in_app',
          'rides',
          NEW.id,
          jsonb_build_object(
            'ride_id', NEW.id::text,
            'status', NEW.status::text,
            'pickup_zone', COALESCE(NEW.pickup_zone, ''),
            'destination_zone', COALESCE(NEW.destination_zone, '')
          ),
          false,
          now(),
          now()
        );
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Recreate the trigger
CREATE TRIGGER ride_status_notify
AFTER UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_ride_status_change();

-- ============================================================================
-- WHAT WAS FIXED
-- ============================================================================
-- 1. Added explicit ::text casting for JSONB operations
--    - OLD: jsonb_build_object('ride_id', NEW.id, 'status', NEW.status)
--    - NEW: jsonb_build_object('ride_id', NEW.id::text, 'status', NEW.status::text, ...)
--
-- 2. Set all required NOT NULL fields explicitly:
--    - user_id (from users table)
--    - title (dynamic based on status)
--    - message (detailed message for each status)
--    - type (always 'ride' for ride status notifications)
--    - channel (always 'in_app' for automatic notifications)
--    - read (set to false, user can mark as read)
--    - created_at (set to now())
--    - updated_at (set to now())
--
-- 3. Enhanced data JSONB to include useful context:
--    - ride_id, status, pickup_zone, destination_zone
--
-- 4. Added NULL checks before inserting:
--    - Only insert rider notification if rider user exists
--    - Only insert driver notification if driver is assigned AND driver user exists
--
-- 5. Used COALESCE for optional fields in JSONB:
--    - Prevents NULL values in JSONB data
--    - Ensures pickup_zone and destination_zone default to empty string if NULL

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run this to verify the fix:
--
-- SELECT trigger_name, event_manipulation, event_object_table, action_timing
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'public'
--   AND event_object_table = 'rides'
--   AND trigger_name = 'ride_status_notify';
--
-- Expected: 1 row showing AFTER UPDATE trigger

-- ============================================================================
-- TEST WORKFLOW
-- ============================================================================
-- 1. Deploy this SQL to Supabase
-- 2. Complete a ride in your app (driver marks it as 'completed')
-- 3. Check notifications table:
--    SELECT * FROM notifications 
--    WHERE related_table = 'rides' AND type = 'ride'
--    ORDER BY created_at DESC LIMIT 5;
-- 4. Should see 2 new records (one for rider, one for driver)
-- 5. Both should have proper data JSONB with ride_id and status

-- ============================================================================

