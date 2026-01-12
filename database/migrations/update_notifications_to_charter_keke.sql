-- Migration: Update Notification Messages from Easely to Charter Keke
-- Date: 2026-01-09
-- Description: Updates all notification triggers and messages to use "Charter Keke" branding instead of "Easely"

-- ============================================================================
-- FUNCTION: Create notification for referral code
-- ============================================================================
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
      'referral_code', NEW.referral_code,
      'code_type', NEW.code_type
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_referral_code_created ON referral_codes;

-- Create trigger for referral code creation
CREATE TRIGGER trigger_referral_code_created
AFTER INSERT ON referral_codes
FOR EACH ROW
EXECUTE FUNCTION notify_referral_code_created();

-- ============================================================================
-- FUNCTION: Create notification when referral is completed
-- ============================================================================
CREATE OR REPLACE FUNCTION notify_referral_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Notify the referrer
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
        'referee_id', NEW.referee_id,
        'reward_amount', NEW.reward_amount,
        'referral_code', NEW.referral_code
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_referral_completed ON referrals;

-- Create trigger for referral completion
CREATE TRIGGER trigger_referral_completed
AFTER UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION notify_referral_completed();

-- ============================================================================
-- FUNCTION: Create notification when referral is claimed
-- ============================================================================
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
        'reward_amount', NEW.reward_amount,
        'referral_code', NEW.referral_code
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_referral_claimed ON referrals;

-- Create trigger for referral claim
CREATE TRIGGER trigger_referral_claimed
AFTER UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION notify_referral_claimed();

-- ============================================================================
-- FUNCTION: Create welcome notification for new drivers
-- ============================================================================
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
        'user_id', NEW.id,
        'role', NEW.role
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_new_driver_registered ON users;

-- Create trigger for new driver registration
CREATE TRIGGER trigger_new_driver_registered
AFTER INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION notify_new_driver_registered();

-- ============================================================================
-- Update existing referral code notifications (if any exist)
-- ============================================================================
UPDATE notifications
SET 
  title = 'Charter Keke Referral Code Created',
  message = 'Your Driver Referral Code: ' || COALESCE(data->>'referral_code', 'N/A') || ' - Share with other drivers to earn rewards!',
  data = jsonb_set(data, '{app_name}', '"Charter Keke"'::jsonb)
WHERE 
  type = 'referral' 
  AND title LIKE '%Easely%'
  AND related_table = 'referral_codes';

-- Update existing referral completion notifications
UPDATE notifications
SET 
  title = 'Charter Keke Referral Completed',
  message = 'Your referral has been completed! You earned ₦' || COALESCE(data->>'reward_amount', '0'),
  data = jsonb_set(data, '{app_name}', '"Charter Keke"'::jsonb)
WHERE 
  type = 'referral' 
  AND title LIKE '%Easely%'
  AND message LIKE '%completed%';

-- ============================================================================
-- Verification: Check updated notifications
-- ============================================================================
-- SELECT * FROM notifications WHERE title LIKE '%Charter Keke%' LIMIT 5;
-- SELECT * FROM notifications WHERE type = 'referral' ORDER BY created_at DESC LIMIT 10;
