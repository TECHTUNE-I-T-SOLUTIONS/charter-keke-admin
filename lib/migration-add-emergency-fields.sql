-- Add emergency contact fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(20);
