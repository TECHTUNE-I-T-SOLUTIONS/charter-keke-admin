-- SQL Migration: Add Account Name Column to Drivers Table
-- Purpose: Store Paystack verified account name for drivers
-- Created: January 9, 2026
-- Database: PostgreSQL with Supabase

-- STEP 1: Add account_name column to drivers table
ALTER TABLE drivers
ADD COLUMN account_name VARCHAR(255) NULL;

-- STEP 2: Add comment to explain the column
COMMENT ON COLUMN drivers.account_name IS 'Bank account holder name fetched from Paystack API verification or manually entered by driver';

-- STEP 3: Create index for account_name (optional, for future queries)
CREATE INDEX IF NOT EXISTS idx_drivers_account_name 
ON drivers(account_name);

-- STEP 4: Verify the column was added
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'drivers' AND column_name = 'account_name';

-- COMPLETION NOTES:
-- ✓ account_name column added (nullable)
-- ✓ Column indexed for performance
-- ✓ Won't affect existing data or functionality
-- ✓ Ready to be populated via Paystack API or manual entry
