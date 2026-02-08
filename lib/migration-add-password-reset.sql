-- ============================================================================
-- ADMIN AUTHENTICATION ENHANCEMENT
-- ============================================================================
-- Adds password reset functionality for admin accounts

-- Add password reset columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMP;

-- Create index for password reset lookups
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token ON users(password_reset_token);

-- Enable realtime for password reset changes (if not already enabled)
ALTER TABLE users REPLICA IDENTITY FULL;
