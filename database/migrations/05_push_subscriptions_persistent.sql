-- Migration: Create Push Subscriptions Table
-- Purpose: Persist user push notification subscriptions for Expo mobile app
-- Users subscribe with their device to receive notifications
-- This stores user ID + push token for notification delivery
-- Created: April 2026
-- Note: Custom authentication - no RLS policies needed

-- Create the push_subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  push_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  
  -- Unique constraint: one token per user per device
  CONSTRAINT unique_user_token UNIQUE(user_id, push_token)
);

-- Create indexes for fast lookups when sending notifications
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_active ON public.push_subscriptions(is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform ON public.push_subscriptions(platform);

-- Function: Get all active subscriptions for a user (for checking subscription status)
CREATE OR REPLACE FUNCTION get_user_active_subscriptions(target_user_id UUID)
RETURNS TABLE(id UUID, push_token TEXT, platform TEXT, is_active BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.id, ps.push_token, ps.platform, ps.is_active
  FROM public.push_subscriptions ps
  WHERE ps.user_id = target_user_id
    AND ps.is_active = true
    AND ps.last_verified_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
  ORDER BY ps.subscribed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get all active subscriptions (for sending to all users)
CREATE OR REPLACE FUNCTION get_all_active_subscriptions()
RETURNS TABLE(user_id UUID, push_token TEXT, platform TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.user_id, ps.push_token, ps.platform
  FROM public.push_subscriptions ps
  WHERE ps.is_active = true
    AND ps.last_verified_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
  ORDER BY ps.subscribed_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get active subscriptions for a specific user (for sending to specific user)
CREATE OR REPLACE FUNCTION get_subscriptions_for_user(target_user_id UUID)
RETURNS TABLE(push_token TEXT, platform TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT ps.push_token, ps.platform
  FROM public.push_subscriptions ps
  WHERE ps.user_id = target_user_id
    AND ps.is_active = true
    AND ps.last_verified_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update last_verified_at on subscription access
CREATE OR REPLACE FUNCTION update_push_subscription_verified_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_verified_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_push_subscription_verified_at ON public.push_subscriptions;
CREATE TRIGGER trigger_update_push_subscription_verified_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_push_subscription_verified_at();
