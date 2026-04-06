-- ============================================================================
-- OTP TABLE FOR SESSION RESUME, PASSWORD RECOVERY, AND ACCOUNT VERIFICATION
-- ============================================================================

-- Create OTP table for storing one-time passwords
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  phone_number VARCHAR(20),
  email VARCHAR(255),
  code VARCHAR(6) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('resume_session', 'forgot_password', 'verify_account')),
  is_verified BOOLEAN DEFAULT FALSE,
  attempts INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  verified_at TIMESTAMP
);

-- Indexes for fast lookup
CREATE INDEX idx_otps_user_id ON otps(user_id);
CREATE INDEX idx_otps_phone_number ON otps(phone_number);
CREATE INDEX idx_otps_email ON otps(email);
CREATE INDEX idx_otps_type ON otps(type);
CREATE INDEX idx_otps_expires_at ON otps(expires_at);
CREATE INDEX idx_otps_code ON otps(code);
CREATE INDEX idx_otps_verified ON otps(is_verified);

-- Unique index to ensure only one unverified OTP per user per type
CREATE UNIQUE INDEX idx_otps_unique_active ON otps(user_id, type) WHERE is_verified = FALSE;

-- Enable realtime for OTP table
ALTER TABLE otps REPLICA IDENTITY FULL;

-- Add trigger to automatically clean up expired OTPs
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM otps WHERE expires_at < NOW() AND is_verified = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job equivalent using pg_cron (if available)
-- Otherwise, you can call this manually or set up a cron job in your application

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 1. OTP generation format: 6-digit code (000000-999999)
-- 2. OTP expiry: 10 minutes from creation
-- 3. Max attempts: 3 attempts per OTP before blocking
-- 4. Types of OTPs:
--    - resume_session: When user reopens app and needs to verify
--    - forgot_password: When user initiates password recovery
--    - verify_account: For email/phone verification during signup
-- 5. After verification, OTP can be marked as is_verified = TRUE
-- 6. Cleanup: Automatically delete expired OTPs periodically
