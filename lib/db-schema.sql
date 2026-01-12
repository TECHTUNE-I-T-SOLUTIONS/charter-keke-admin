-- CHARTER KEKE DATABASE SCHEMA
-- This is the single source of truth for all system tables
-- Created: December 23, 2025
-- DO NOT modify schema without full team review

-- Create storage bucket for profile pictures (run in Supabase)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profile-pictures', 'profile-pictures', true);
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. USERS TABLE (CORE IDENTITY)
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

-- 2. DRIVERS TABLE
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(100),
  plate_number VARCHAR(50),
  operating_zones TEXT[] DEFAULT ARRAY[]::TEXT[],
  union_name VARCHAR(255),
  availability_status VARCHAR(50) DEFAULT 'offline' CHECK (availability_status IN ('online', 'offline', 'busy')),
  bank_name VARCHAR(100),
  bank_account_number VARCHAR(50),
  emergency_contact VARCHAR(100),
  verified BOOLEAN DEFAULT FALSE,
  vehicle_picture_url VARCHAR(500),
  license_picture_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drivers_user_id ON drivers(user_id);
CREATE INDEX idx_drivers_verified ON drivers(verified);
CREATE INDEX idx_drivers_availability ON drivers(availability_status);

-- 3. ADMINS TABLE
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

-- 4. WALLETS TABLE (ALL USERS)
CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'NGN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- 5. RIDES TABLE
CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pickup_zone VARCHAR(255) NOT NULL,
  pickup_description TEXT,
  destination_zone VARCHAR(255) NOT NULL,
  destination_description TEXT,
  ride_type VARCHAR(50) NOT NULL DEFAULT 'single' CHECK (ride_type IN ('single', 'shared', 'delivery')),
  fare_amount DECIMAL(10, 2),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'dispatched', 'accepted', 'in_progress', 'completed', 'cancelled')),
  assigned_driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_rides_rider_id ON rides(rider_id);
CREATE INDEX idx_rides_driver_id ON rides(assigned_driver_id);
CREATE INDEX idx_rides_status ON rides(status);
CREATE INDEX idx_rides_created ON rides(created_at);

-- 6. DISPATCH & MATCHING LOGS
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

-- 7. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'payout', 'refund')),
  reference VARCHAR(255),
  source VARCHAR(100) NOT NULL CHECK (source IN ('ride', 'admin_adjustment', 'payout', 'deposit')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_type ON transactions(transaction_type);
CREATE INDEX idx_transactions_status ON transactions(status);

-- 8. NOTIFICATIONS TABLE (UNIFIED FOR ALL ROLES)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (type IN ('system', 'ride', 'payment', 'admin')),
  channel VARCHAR(50) NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'push', 'sms', 'email')),
  related_table VARCHAR(100),
  related_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- TRIGGERS FOR AUTO-UPDATING updated_at
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
CREATE TRIGGER notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
