-- ============================================================================
-- REFERRAL CODES TABLE AND TRIGGERS FOR CHARTER KEKE
-- This file creates the referral codes management system with auto-notifications
-- ============================================================================

-- 1. CREATE REFERRAL CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  referral_code character varying(20) NOT NULL UNIQUE,
  code_type character varying(20) NOT NULL DEFAULT 'personal'::character varying CHECK (
    (code_type)::text = ANY (
      (
        ARRAY[
          'personal'::character varying,
          'driver'::character varying,
          'admin'::character varying
        ]
      )::text[]
    )
  ),
  total_referrals integer NOT NULL DEFAULT 0,
  active_referrals integer NOT NULL DEFAULT 0,
  total_rewards numeric NOT NULL DEFAULT 0,
  created_at timestamp without time zone NOT NULL DEFAULT now(),
  updated_at timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT referral_codes_pkey PRIMARY KEY (id),
  CONSTRAINT referral_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
) TABLESPACE pg_default;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON public.referral_codes USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_referral_codes_referral_code ON public.referral_codes USING btree (referral_code) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_referral_codes_code_type ON public.referral_codes USING btree (code_type) TABLESPACE pg_default;

-- ============================================================================
-- 2. FUNCTION TO GENERATE UNIQUE REFERRAL CODE
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_referral_code(p_first_name character varying, p_user_id uuid)
RETURNS character varying AS $$
DECLARE
  v_code character varying;
  v_counter integer := 0;
  v_base character varying;
BEGIN
  -- Base code: EASE + first 2 letters of name + random 4 chars
  v_base := 'EASE' || UPPER(LEFT(p_first_name, 2)) || UPPER(substring(md5(p_user_id::text || NOW()::text), 1, 4));
  v_code := v_base;
  
  -- Check if code already exists, if so, append counter
  WHILE EXISTS (SELECT 1 FROM public.referral_codes WHERE referral_code = v_code) LOOP
    v_counter := v_counter + 1;
    v_code := v_base || v_counter;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 3. FUNCTION TO CREATE REFERRAL CODE ON USER CREATION
-- ============================================================================
CREATE OR REPLACE FUNCTION create_referral_code_on_user_creation()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code character varying;
  v_code_type character varying;
BEGIN
  -- Determine code type based on role
  v_code_type := CASE 
    WHEN NEW.role = 'driver' THEN 'driver'
    WHEN NEW.role = 'admin' THEN 'admin'
    ELSE 'personal'
  END;
  
  -- Generate unique referral code
  v_referral_code := generate_referral_code(NEW.first_name, NEW.id);
  
  -- Create referral code record
  INSERT INTO public.referral_codes (user_id, referral_code, code_type)
  VALUES (NEW.id, v_referral_code, v_code_type)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. TRIGGER TO CREATE REFERRAL CODE WHEN USER IS CREATED
-- ============================================================================
DROP TRIGGER IF EXISTS referral_code_on_user_create ON public.users;
CREATE TRIGGER referral_code_on_user_create
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_referral_code_on_user_creation();

-- ============================================================================
-- 5. FUNCTION TO CREATE SIGNUP NOTIFICATION
-- ============================================================================
CREATE OR REPLACE FUNCTION create_signup_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_message text;
BEGIN
  -- Create different messages based on role
  v_message := CASE 
    WHEN NEW.role = 'driver' THEN 'Welcome to Charter Keke as a Driver! Start accepting rides and earning today.'
    WHEN NEW.role = 'admin' THEN 'Welcome to Charter Keke Admin Panel! You now have admin privileges.'
    ELSE 'Welcome to Charter Keke! Ready to book your first ride?'
  END;
  
  -- Insert signup notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    channel,
    read,
    data
  ) VALUES (
    NEW.id,
    'Welcome to Charter Keke',
    v_message,
    'system',
    'in_app',
    false,
    jsonb_build_object('signup_date', NOW()::text, 'role', NEW.role)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRIGGER TO CREATE SIGNUP NOTIFICATION WHEN USER IS CREATED
-- ============================================================================
DROP TRIGGER IF EXISTS signup_notification_on_user_create ON public.users;
CREATE TRIGGER signup_notification_on_user_create
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_signup_notification();

-- ============================================================================
-- 7. FUNCTION TO CREATE REFERRAL CODE NOTIFICATION
-- ============================================================================
CREATE OR REPLACE FUNCTION create_referral_code_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_message text;
BEGIN
  -- Create message based on code type
  v_message := CASE 
    WHEN NEW.code_type = 'driver' THEN 'Your Driver Referral Code: ' || NEW.referral_code || ' - Share with other drivers to earn rewards!'
    WHEN NEW.code_type = 'admin' THEN 'Your Admin Referral Code: ' || NEW.referral_code || ' - Use this to manage admin referrals.'
    ELSE 'Your Personal Referral Code: ' || NEW.referral_code || ' - Share with friends and earn discounts on every ride!'
  END;
  
  -- Insert referral code notification
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    channel,
    read,
    data
  ) VALUES (
    NEW.user_id,
    'Your Referral Code Created',
    v_message,
    'referral',
    'in_app',
    false,
    jsonb_build_object(
      'referral_code', NEW.referral_code,
      'code_type', NEW.code_type,
      'created_date', NOW()::text
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. TRIGGER TO CREATE REFERRAL CODE NOTIFICATION WHEN CODE IS CREATED
-- ============================================================================
DROP TRIGGER IF EXISTS referral_code_notification_on_create ON public.referral_codes;
CREATE TRIGGER referral_code_notification_on_create
AFTER INSERT ON public.referral_codes
FOR EACH ROW
EXECUTE FUNCTION create_referral_code_notification();

-- ============================================================================
-- 9. FUNCTION TO UPDATE TIMESTAMP ON REFERRAL CODES
-- ============================================================================
CREATE OR REPLACE FUNCTION update_referral_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 10. TRIGGER TO AUTO-UPDATE TIMESTAMP
-- ============================================================================
DROP TRIGGER IF EXISTS referral_codes_updated_at ON public.referral_codes;
CREATE TRIGGER referral_codes_updated_at
BEFORE UPDATE ON public.referral_codes
FOR EACH ROW
EXECUTE FUNCTION update_referral_codes_updated_at();

-- ============================================================================
-- 11. FUNCTION TO CREATE REFERRAL REWARD NOTIFICATION (when referral succeeds)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_referral_reward_notification(
  p_referrer_id uuid,
  p_referee_name character varying,
  p_reward_amount numeric
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    message,
    type,
    channel,
    read,
    data
  ) VALUES (
    p_referrer_id,
    'Referral Reward Earned!',
    'Your referral of ' || p_referee_name || ' has been completed. You earned ₦' || p_reward_amount,
    'referral',
    'in_app',
    false,
    jsonb_build_object(
      'referee_name', p_referee_name,
      'reward_amount', p_reward_amount::text,
      'reward_date', NOW()::text
    )
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 12. FUNCTION TO LOG REFERRAL USAGE (when someone uses a referral code)
-- ============================================================================
CREATE OR REPLACE FUNCTION log_referral_code_usage(
  p_referral_code character varying,
  p_new_user_id uuid
)
RETURNS void AS $$
DECLARE
  v_referrer_id uuid;
BEGIN
  -- Find the referrer
  SELECT user_id INTO v_referrer_id FROM public.referral_codes WHERE referral_code = p_referral_code;
  
  IF v_referrer_id IS NOT NULL THEN
    -- Update referral count
    UPDATE public.referral_codes 
    SET total_referrals = total_referrals + 1,
        active_referrals = active_referrals + 1
    WHERE user_id = v_referrer_id;
    
    -- Create notification for referrer
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type,
      channel,
      read,
      data
    ) VALUES (
      v_referrer_id,
      'New Referral Used!',
      'Someone signed up using your referral code: ' || p_referral_code,
      'referral',
      'in_app',
      false,
      jsonb_build_object(
        'referral_code', p_referral_code,
        'used_date', NOW()::text
      )
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 13. ENABLE REALTIME FOR REFERRAL CODES TABLE
-- ============================================================================
ALTER TABLE public.referral_codes REPLICA IDENTITY FULL;

-- ============================================================================
-- 14. SAMPLE DATA (Optional - remove if not needed)
-- ============================================================================
-- This demonstrates how the system works
-- Uncomment to test:
/*
-- Example 1: User signs up (triggers will auto-create referral code and notifications)
-- INSERT INTO public.users (first_name, last_name, email, phone_number, password_hash, role)
-- VALUES ('John', 'Rider', 'john@example.com', '+2341234567890', 'hashedpassword', 'user');

-- Example 2: Check if referral code and notification were created
-- SELECT * FROM public.referral_codes ORDER BY created_at DESC LIMIT 1;
-- SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 2;
*/

-- ============================================================================
-- SUMMARY OF WHAT THIS CREATES:
-- ============================================================================
-- 1. referral_codes table - stores referral codes for all users
-- 2. Automatic referral code generation on user signup
-- 3. Automatic signup notification creation
-- 4. Automatic referral code notification creation
-- 5. Helper functions for logging referral usage and rewards
-- 6. Timestamp auto-updates
-- 7. Realtime support enabled
-- ============================================================================
