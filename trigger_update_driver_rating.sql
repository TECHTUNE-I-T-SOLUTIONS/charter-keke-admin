-- ============================================================================
-- RIDE REVIEW RATING TRIGGER
-- ============================================================================
-- This trigger automatically updates the driver's average rating in the
-- drivers table whenever a new ride review is submitted.
-- 
-- Flow:
-- 1. Rider submits review with rating via /api/ride-reviews
-- 2. Review inserted into ride_reviews table
-- 3. Trigger fires and calculates average of all ratings for that driver
-- 4. Trigger updates drivers.average_rating
-- ============================================================================

-- Create trigger function to update driver average rating
CREATE OR REPLACE FUNCTION public.update_driver_average_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_avg_rating NUMERIC;
BEGIN
  -- Update driver average rating by calculating AVG of all their reviews
  UPDATE public.drivers
  SET 
    average_rating = COALESCE((
      SELECT AVG(rating)::NUMERIC
      FROM public.ride_reviews
      WHERE rated_user_id = NEW.rated_user_id
        AND rating IS NOT NULL
    ), 0),
    updated_at = now()
  WHERE user_id = NEW.rated_user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires after insert on ride_reviews
DROP TRIGGER IF EXISTS trg_update_driver_avg_rating_on_review_insert
ON public.ride_reviews;

CREATE TRIGGER trg_update_driver_avg_rating_on_review_insert
  AFTER INSERT ON public.ride_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_driver_average_rating();

-- ============================================================================
-- OPTIONAL: Also handle updates to reviews (in case rating is modified)
-- ============================================================================
DROP TRIGGER IF EXISTS trg_update_driver_avg_rating_on_review_update
ON public.ride_reviews;

CREATE TRIGGER trg_update_driver_avg_rating_on_review_update
  AFTER UPDATE ON public.ride_reviews
  FOR EACH ROW
  -- Only trigger if the rating was changed
  WHEN (OLD.rating IS DISTINCT FROM NEW.rating)
  EXECUTE FUNCTION public.update_driver_average_rating();

-- ============================================================================
-- Add NOT NULL constraint to average_rating column if it doesn't have one
-- (This ensures the column always has a value)
-- ============================================================================
-- This is optional but recommended - uncomment if needed:
-- ALTER TABLE public.drivers
-- ALTER COLUMN average_rating SET DEFAULT 0;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the trigger is working:

-- 1. Check trigger exists:
-- SELECT * FROM information_schema.triggers 
-- WHERE trigger_name LIKE 'trg_update_driver_avg%';

-- 2. Get driver ratings:
-- SELECT id, user_id, average_rating, updated_at 
-- FROM drivers 
-- ORDER BY updated_at DESC 
-- LIMIT 10;

-- 3. Get recent reviews:
-- SELECT 
--   rr.id, rr.ride_id, rr.rating, rr.created_at,
--   d.id as driver_id, d.user_id, d.average_rating
-- FROM ride_reviews rr
-- LEFT JOIN drivers d ON rr.rated_user_id = d.user_id
-- ORDER BY rr.created_at DESC
-- LIMIT 10;

-- ============================================================================
-- DEBUGGING: Test the trigger
-- ============================================================================
-- To test without a real review, you can temporarily insert a test review:
-- 
-- DO $$
-- DECLARE
--   v_ride_id UUID;
--   v_rider_id UUID;
--   v_driver_id UUID;
--   v_driver_user_id UUID;
-- BEGIN
--   -- Get sample ride, rider, and driver IDs
--   SELECT id, rider_id, driver_id INTO v_ride_id, v_rider_id, v_driver_id
--   FROM rides LIMIT 1;
--   
--   -- Get driver's user_id
--   SELECT user_id INTO v_driver_user_id
--   FROM drivers WHERE id = v_driver_id LIMIT 1;
--   
--   -- Insert test review
--   INSERT INTO ride_reviews (ride_id, reviewer_id, rated_user_id, rating, review_text)
--   VALUES (v_ride_id, v_rider_id, v_driver_user_id, 5, 'Test review - Excellent driver!')
--   ON CONFLICT DO NOTHING;
--   
--   -- Check updated driver rating
--   RAISE NOTICE 'Driver % now has average rating:', v_driver_id;
--   PERFORM average_rating FROM drivers WHERE id = v_driver_id;
-- END $$;

-- ============================================================================
-- NOTES FOR DEPLOYMENT
-- ============================================================================
-- 1. This trigger will fire AFTER an insert on ride_reviews
-- 2. It calculates the average of ALL reviews for that driver (rated_user_id)
-- 3. The average is recalculated from scratch each time (no complex math needed)
-- 4. Safe to run multiple times (function already exists, will be replaced)
-- 5. If drivers table doesn't exist yet, everything will still work fine
--    (the trigger function will silently skip updates)
-- 6. Performance: O(n) where n = number of reviews for that driver
--    For small review counts (< 1000), this is negligible
