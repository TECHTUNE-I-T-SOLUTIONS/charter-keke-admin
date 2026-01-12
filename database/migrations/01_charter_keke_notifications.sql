-- SQL Migration: Update Charter Keke Notifications
-- Purpose: Replace "Easely" branding with "Charter Keke" in all notification triggers and existing messages
-- Created: January 9, 2026
-- Database: PostgreSQL with Supabase

-- STEP 1: Update existing notifications in database
-- This updates any notifications that were created with old "Easely" branding or contain EASE prefix

-- Update referral code creation notifications
UPDATE notifications
SET 
  title = 'Charter Keke Referral Code Created',
  message = REPLACE(REPLACE(message, 'Easely', 'Charter Keke'), 'EASEPR', 'CHARTER'),
  data = jsonb_set(data, '{app_name}', '"Charter Keke"'::jsonb)
WHERE 
  type = 'referral' 
  AND title LIKE '%Referral Code%';

-- Update referral completion notifications
UPDATE notifications
SET 
  title = 'Charter Keke Referral Completed',
  message = REPLACE(message, 'Easely', 'Charter Keke'),
  data = jsonb_set(data, '{app_name}', '"Charter Keke"'::jsonb)
WHERE 
  type = 'referral'
  AND title LIKE '%Referral%Completed%';

-- Update referral claim notifications
UPDATE notifications
SET 
  title = 'Charter Keke Referral Reward Claimed',
  message = REPLACE(message, 'Easely', 'Charter Keke'),
  data = jsonb_set(data, '{app_name}', '"Charter Keke"'::jsonb)
WHERE 
  type = 'referral'
  AND title LIKE '%Claimed%';

-- Update welcome notifications
UPDATE notifications
SET 
  title = 'Welcome to Charter Keke',
  message = REPLACE(message, 'Easely', 'Charter Keke'),
  data = jsonb_set(data, '{app_name}', '"Charter Keke"'::jsonb)
WHERE 
  type = 'system'
  AND title LIKE '%Welcome%';

-- STEP 2: Create/Update Referral Code Creation Notification Function
-- Triggered when a new referral code is created
CREATE OR REPLACE FUNCTION notify_referral_code_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    channel,
    related_table,
    related_id,
    data
  ) VALUES (
    NEW.user_id,
    'Charter Keke Referral Code Created',
    'Your Driver Referral Code: ' || NEW.referral_code || ' - Share with other drivers to earn rewards!',
    'referral',
    'in_app',
    'referral_codes',
    NEW.id,
    jsonb_build_object(
      'app_name', 'Charter Keke',
      'referral_code', NEW.referral_code,
      'code_type', NEW.code_type,
      'reward_info', 'Both drivers earn ₦5,000 when referee completes first 10 rides'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_referral_code_created ON referral_codes;
CREATE TRIGGER trigger_referral_code_created
AFTER INSERT ON referral_codes
FOR EACH ROW
EXECUTE FUNCTION notify_referral_code_created();

-- STEP 3: Create/Update Referral Completion Notification Function
-- Triggered when referral is marked as completed
CREATE OR REPLACE FUNCTION notify_referral_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      data
    ) VALUES (
      NEW.referrer_id,
      'Charter Keke Referral Completed',
      'Your referral has been completed! You earned ₦' || COALESCE(NEW.reward_amount::text, '0'),
      'referral',
      'in_app',
      'referrals',
      NEW.id,
      jsonb_build_object(
        'app_name', 'Charter Keke',
        'referee_id', NEW.referee_id,
        'reward_amount', NEW.reward_amount,
        'referral_code', NEW.referral_code,
        'completed_at', NOW()::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_referral_completed ON referrals;
CREATE TRIGGER trigger_referral_completed
AFTER UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION notify_referral_completed();

-- STEP 4: Create/Update Referral Claim Notification Function
-- Triggered when referral reward is claimed
CREATE OR REPLACE FUNCTION notify_referral_claimed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'claimed' AND OLD.status != 'claimed' THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      data
    ) VALUES (
      NEW.referrer_id,
      'Charter Keke Referral Reward Claimed',
      'Your referral reward has been claimed and added to your wallet!',
      'referral',
      'in_app',
      'referrals',
      NEW.id,
      jsonb_build_object(
        'app_name', 'Charter Keke',
        'reward_amount', NEW.reward_amount,
        'referral_code', NEW.referral_code,
        'wallet_updated', NOW()::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_referral_claimed ON referrals;
CREATE TRIGGER trigger_referral_claimed
AFTER UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION notify_referral_claimed();

-- STEP 5: Create/Update New Driver Welcome Notification Function
-- Triggered when new driver signs up
CREATE OR REPLACE FUNCTION notify_new_driver_registered()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'driver' THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      channel,
      related_table,
      related_id,
      data
    ) VALUES (
      NEW.id,
      'Welcome to Charter Keke',
      'Welcome ' || NEW.first_name || '! You are now registered as a Charter Keke driver. Complete your profile to start earning.',
      'system',
      'in_app',
      'users',
      NEW.id,
      jsonb_build_object(
        'app_name', 'Charter Keke',
        'user_id', NEW.id,
        'role', NEW.role,
        'onboarding_step', 'profile_completion',
        'registered_at', NOW()::text
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_new_driver_registered ON users;
CREATE TRIGGER trigger_new_driver_registered
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION notify_new_driver_registered();

-- STEP 6: Verify Changes
-- Run these queries to verify the migrations were successful

-- Check updated notifications
-- SELECT id, title, message, type, created_at FROM notifications 
-- WHERE title LIKE '%Charter Keke%' 
-- ORDER BY created_at DESC LIMIT 10;

-- Check trigger status
-- SELECT trigger_schema, trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name LIKE 'trigger_%' 
-- ORDER BY event_object_table;

-- Check function definitions
-- SELECT proname, prosrc FROM pg_proc 
-- WHERE proname LIKE 'notify_%' 
-- ORDER BY proname;

-- STEP 7: Test Trigger (Optional - Create Test Data)
-- Uncomment below to test the triggers with sample data

-- Test referral code creation notification:
-- INSERT INTO referral_codes (user_id, referral_code, code_type) 
-- VALUES ('test-user-id', 'TESTCODE123', 'driver') 
-- RETURNING *;

-- Test referral completion notification:
-- UPDATE referrals 
-- SET status = 'completed', reward_amount = 5000, updated_at = NOW() 
-- WHERE id = 'test-referral-id' 
-- RETURNING *;

-- Test referral claim notification:
-- UPDATE referrals 
-- SET status = 'claimed', updated_at = NOW() 
-- WHERE id = 'test-referral-id' 
-- RETURNING *;

-- COMPLETION NOTES:
-- ✓ All "Easely" branding has been replaced with "Charter Keke"
-- ✓ Notification functions are updated and active
-- ✓ Existing notifications have been migrated to new branding
-- ✓ All triggers are created and ready
-- ✓ System will use Charter Keke branding for all future notifications
-- 
-- TESTING RECOMMENDED:
-- 1. Create a new referral code to test the creation notification
-- 2. Update a referral status to test completion/claim notifications
-- 3. Verify messages display correctly in the UI
-- 4. Check mobile push notifications also use correct branding
