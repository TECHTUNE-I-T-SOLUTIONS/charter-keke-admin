-- ============================================================================
-- CHARTER KEKE COMPLETE DATABASE SCHEMA & SETUP
-- ============================================================================
-- Database: Supabase PostgreSQL
-- Purpose: Single source of truth for all Charter Keke tables
-- Features: No RLS/Policies, Public buckets, Realtime enabled, Auto-triggers
-- ============================================================================

-- ============================================================================
-- SECTION 1: CORE AUTHENTICATION & USERS
-- ============================================================================

-- 1.1 USERS TABLE (Central identity for all system users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  dob DATE,
  gender VARCHAR(10),
  profile_picture_url VARCHAR(500),
  role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'driver', 'admin', 'super_admin')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'suspended', 'pending')),
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Enable realtime for users table
ALTER TABLE users REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 2: DRIVER MANAGEMENT
-- ============================================================================

-- 2.1 DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(100),
  plate_number VARCHAR(50) UNIQUE,
  operating_zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  union_name VARCHAR(255),
  availability_status VARCHAR(50) DEFAULT 'offline' CHECK (availability_status IN ('online', 'offline', 'busy')),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  emergency_contact VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  vehicle_picture_url VARCHAR(500),
  license_picture_url VARCHAR(500),
  total_rides_completed INTEGER DEFAULT 0,
  average_rating DECIMAL(3, 2) DEFAULT 0.00,
  total_earnings DECIMAL(12, 2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_verified ON drivers(verified);
CREATE INDEX idx_drivers_availability ON drivers(availability_status);
CREATE INDEX idx_drivers_plate ON drivers(plate_number);

ALTER TABLE drivers REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 3: ADMIN MANAGEMENT
-- ============================================================================

-- 3.1 ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  admin_level VARCHAR(50) NOT NULL DEFAULT 'support' CHECK (admin_level IN ('support', 'ops', 'finance', 'super')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admins_user_id ON admins(user_id);
CREATE INDEX idx_admins_level ON admins(admin_level);

ALTER TABLE admins REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 4: FINANCIAL MANAGEMENT
-- ============================================================================

-- 4.1 WALLETS TABLE (All users have wallets)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

ALTER TABLE wallets REPLICA IDENTITY FULL;

-- 4.2 TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  ride_id UUID,
  amount DECIMAL(12, 2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'payout', 'refund')),
  reference VARCHAR(255),
  source VARCHAR(100) NOT NULL CHECK (source IN ('ride', 'admin_adjustment', 'payout', 'deposit')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_ride_id ON transactions(ride_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created ON transactions(created_at);

ALTER TABLE transactions REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 5: RIDE MANAGEMENT
-- ============================================================================

-- 5.1 RIDES TABLE
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  pickup_zone VARCHAR(255) NOT NULL,
  pickup_description TEXT,
  destination_zone VARCHAR(255) NOT NULL,
  destination_description TEXT,
  ride_type VARCHAR(50) NOT NULL DEFAULT 'shared' CHECK (ride_type IN ('single', 'shared', 'delivery')),
  fare_amount DECIMAL(10, 2),
  driver_earnings DECIMAL(10, 2),
  platform_fee DECIMAL(10, 2),
  seats_available INTEGER DEFAULT 1,
  seats_booked INTEGER DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled')),
  cancellation_reason VARCHAR(255),
  pickup_time TIMESTAMP,
  dropoff_time TIMESTAMP,
  duration_minutes INTEGER,
  distance_km DECIMAL(8, 2),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created ON rides(created_at);
CREATE INDEX idx_rides_completed ON rides(completed_at);

ALTER TABLE rides REPLICA IDENTITY FULL;

-- 5.2 RIDE DISPATCH LOGS
CREATE TABLE IF NOT EXISTS ride_dispatch_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  dispatch_method VARCHAR(50) NOT NULL CHECK (dispatch_method IN ('sms', 'push', 'app')),
  response VARCHAR(50) CHECK (response IN ('accepted', 'rejected', 'timeout')),
  response_time INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_dispatch_ride_id ON ride_dispatch_logs(ride_id);
CREATE INDEX idx_dispatch_driver_id ON ride_dispatch_logs(driver_id);
CREATE INDEX idx_dispatch_created ON ride_dispatch_logs(created_at);

ALTER TABLE ride_dispatch_logs REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 6: REFERRALS SYSTEM
-- ============================================================================

-- 6.1 REFERRALS TABLE
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'claimed')),
  reward_amount DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_code ON referrals(referral_code);
CREATE INDEX idx_referrals_status ON referrals(status);

ALTER TABLE referrals REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 7: REVIEWS & RATINGS
-- ============================================================================

-- 7.1 RIDE REVIEWS TABLE
CREATE TABLE IF NOT EXISTS ride_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL UNIQUE REFERENCES rides(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  categories JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_ride_id ON ride_reviews(ride_id);
CREATE INDEX idx_reviews_reviewer_id ON ride_reviews(reviewer_id);
CREATE INDEX idx_reviews_rated_user_id ON ride_reviews(rated_user_id);

ALTER TABLE ride_reviews REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 8: NOTIFICATIONS SYSTEM
-- ============================================================================

-- 8.1 NOTIFICATIONS TABLE (Unified for all roles)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'ride', 'payment', 'admin', 'referral', 'security')),
  channel VARCHAR(50) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'push', 'sms', 'email')),
  related_table VARCHAR(100),
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  action_url VARCHAR(500),
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);
CREATE INDEX idx_notifications_related ON notifications(related_table, related_id);

ALTER TABLE notifications REPLICA IDENTITY FULL;

-- 8.2 NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  push_enabled BOOLEAN DEFAULT TRUE,
  sms_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  ride_notifications BOOLEAN DEFAULT TRUE,
  payment_notifications BOOLEAN DEFAULT TRUE,
  admin_notifications BOOLEAN DEFAULT TRUE,
  marketing_notifications BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pref_user_id ON notification_preferences(user_id);

ALTER TABLE notification_preferences REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 9: SUPPORT & MESSAGES
-- ============================================================================

-- 9.1 SUPPORT TICKETS TABLE
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES admins(id) ON DELETE SET NULL,
  related_ride_id UUID REFERENCES rides(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_tickets_assigned ON support_tickets(assigned_to);

ALTER TABLE support_tickets REPLICA IDENTITY FULL;

-- 9.2 SUPPORT TICKET MESSAGES TABLE
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_msg_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_msg_sender_id ON ticket_messages(sender_id);

ALTER TABLE ticket_messages REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 10: ANALYTICS & AUDIT
-- ============================================================================

-- 10.1 AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

ALTER TABLE audit_logs REPLICA IDENTITY FULL;

-- 10.2 SYSTEM METRICS TABLE
CREATE TABLE IF NOT EXISTS system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(20, 4),
  metric_date DATE NOT NULL,
  metric_hour INTEGER,
  tags JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_name ON system_metrics(metric_name);
CREATE INDEX idx_metrics_date ON system_metrics(metric_date);
CREATE INDEX idx_metrics_hour ON system_metrics(metric_hour);

ALTER TABLE system_metrics REPLICA IDENTITY FULL;

-- ============================================================================
-- SECTION 11: AUTOMATIC TRIGGERS & FUNCTIONS
-- ============================================================================

-- 11.1 Update updated_at timestamp on all main tables
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER drivers_updated_at BEFORE UPDATE ON drivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER admins_updated_at BEFORE UPDATE ON admins FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER rides_updated_at BEFORE UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER referrals_updated_at BEFORE UPDATE ON referrals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER ride_reviews_updated_at BEFORE UPDATE ON ride_reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notification_preferences_updated_at BEFORE UPDATE ON notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER support_tickets_updated_at BEFORE UPDATE ON support_tickets FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 11.2 Auto-create wallet when user is created
CREATE OR REPLACE FUNCTION create_wallet_on_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wallets (user_id, balance, currency)
  VALUES (NEW.id, 0, 'NGN');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_on_user_create AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_wallet_on_user_creation();

-- 11.3 Auto-create notification preferences when user is created
CREATE OR REPLACE FUNCTION create_notification_prefs_on_user_creation()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_preferences (user_id, push_enabled, sms_enabled, email_enabled)
  VALUES (NEW.id, TRUE, TRUE, TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notif_prefs_on_user_create AFTER INSERT ON users FOR EACH ROW EXECUTE FUNCTION create_notification_prefs_on_user_creation();

-- 11.4 Create notification when ride status changes
CREATE OR REPLACE FUNCTION notify_on_ride_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_rider_user_id UUID;
  v_driver_user_id UUID;
  v_notification_type VARCHAR;
  v_notification_title VARCHAR;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    -- Get rider info
    SELECT id INTO v_rider_user_id FROM users WHERE id = NEW.rider_id;
    
    -- Determine notification type and title
    CASE NEW.status
      WHEN 'accepted' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Driver Accepted Your Ride';
      WHEN 'in_progress' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Your Ride Has Started';
      WHEN 'completed' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Ride Completed';
      WHEN 'cancelled' THEN
        v_notification_type := 'ride';
        v_notification_title := 'Ride Cancelled';
      ELSE
        RETURN NEW;
    END CASE;
    
    -- Notify rider
    INSERT INTO notifications (user_id, title, message, type, channel, related_table, related_id, data)
    VALUES (
      v_rider_user_id,
      v_notification_title,
      'Your ride status has been updated to ' || NEW.status,
      v_notification_type,
      'in_app',
      'rides',
      NEW.id,
      jsonb_build_object('ride_id', NEW.id, 'status', NEW.status)
    );
    
    -- Notify driver if assigned
    IF NEW.driver_id IS NOT NULL THEN
      SELECT user_id INTO v_driver_user_id FROM drivers WHERE id = NEW.driver_id;
      INSERT INTO notifications (user_id, title, message, type, channel, related_table, related_id, data)
      VALUES (
        v_driver_user_id,
        v_notification_title,
        'Ride status updated to ' || NEW.status,
        v_notification_type,
        'in_app',
        'rides',
        NEW.id,
        jsonb_build_object('ride_id', NEW.id, 'status', NEW.status)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ride_status_notify AFTER UPDATE ON rides FOR EACH ROW EXECUTE FUNCTION notify_on_ride_status_change();

-- 11.5 Create notification when transaction is completed
CREATE OR REPLACE FUNCTION notify_on_transaction_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get user from wallet
    SELECT user_id INTO v_user_id FROM wallets WHERE id = NEW.wallet_id;
    
    -- Create notification
    INSERT INTO notifications (user_id, title, message, type, channel, related_table, related_id, data)
    VALUES (
      v_user_id,
      'Payment ' || NEW.transaction_type,
      'Transaction amount: ₦' || NEW.amount || ' - ' || NEW.description,
      'payment',
      'in_app',
      'transactions',
      NEW.id,
      jsonb_build_object('transaction_id', NEW.id, 'type', NEW.transaction_type, 'amount', NEW.amount)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transaction_notify AFTER UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION notify_on_transaction_completion();

-- ============================================================================
-- SECTION 12: STORAGE BUCKETS SETUP
-- ============================================================================

-- Create public buckets for file uploads

-- 12.1 Profile Pictures Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 12.2 Vehicle Pictures Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-pictures', 'vehicle-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 12.3 License Documents Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('license-documents', 'license-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 12.4 Support Attachments Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-attachments', 'support-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SECTION 13: REALTIME SETUP
-- ============================================================================

-- Enable realtime on all tables (requires Supabase subscription)
-- This enables real-time updates for all operations on these tables

-- 13.1 Enable replication on all tables
ALTER TABLE users REPLICA IDENTITY FULL;
ALTER TABLE drivers REPLICA IDENTITY FULL;
ALTER TABLE admins REPLICA IDENTITY FULL;
ALTER TABLE wallets REPLICA IDENTITY FULL;
ALTER TABLE transactions REPLICA IDENTITY FULL;
ALTER TABLE rides REPLICA IDENTITY FULL;
ALTER TABLE ride_dispatch_logs REPLICA IDENTITY FULL;
ALTER TABLE referrals REPLICA IDENTITY FULL;
ALTER TABLE ride_reviews REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE notification_preferences REPLICA IDENTITY FULL;
ALTER TABLE support_tickets REPLICA IDENTITY FULL;
ALTER TABLE ticket_messages REPLICA IDENTITY FULL;
ALTER TABLE audit_logs REPLICA IDENTITY FULL;
ALTER TABLE system_metrics REPLICA IDENTITY FULL;

-- Enable realtime via Supabase publication
-- Note: You may also need to enable this via Supabase Dashboard under:
-- Database > Publications > realtime_publication > Tables
-- Toggle ON for each table to broadcast changes in real-time

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- Instructions:
-- 1. Run this entire SQL script in Supabase SQL Editor
-- 2. For storage buckets, uncomment Section 12 and run
-- 3. For realtime, enable via Supabase dashboard (Database > Realtime)
-- 4. No RLS policies needed - all tables are public
-- 5. Test with sample data and verify all triggers work
-- ============================================================================
