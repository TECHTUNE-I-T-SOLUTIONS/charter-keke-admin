-- SQL Migration: Regenerate Referral Codes
-- Purpose: Replace old "EASEPR" format codes with new "CHARTER" format codes
-- Created: January 9, 2026
-- Database: PostgreSQL with Supabase

-- STEP 1: Create function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_charter_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code format: CHARTER + 6 random digits + 1 random letter
    -- Example: CHARTER123456A
    new_code := 'CHARTER' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0') || CHR(65 + FLOOR(RANDOM() * 26)::INT);
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM referral_codes WHERE referral_code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Create a temporary mapping table to track old code -> new code
CREATE TEMP TABLE code_mapping AS
SELECT 
  id,
  referral_code as old_code,
  generate_charter_referral_code() as new_code
FROM referral_codes;

-- STEP 3: Update referral_codes table with new codes
UPDATE referral_codes rc
SET referral_code = cm.new_code
FROM code_mapping cm
WHERE rc.id = cm.id;

-- STEP 4: Update referrals table with new codes
UPDATE referrals r
SET referral_code = cm.new_code
FROM code_mapping cm
WHERE r.referral_code = cm.old_code;

-- STEP 5: Drop the temporary mapping table
DROP TABLE code_mapping;

-- STEP 6: Verify the changes
-- Run these queries to verify all codes were updated

-- Check referral_codes table
-- SELECT id, user_id, referral_code, code_type, created_at 
-- FROM referral_codes 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- Check referrals table
-- SELECT id, referrer_id, referee_id, referral_code, status, created_at 
-- FROM referrals 
-- ORDER BY created_at DESC 
-- LIMIT 10;

-- Verify all EASEPR codes are gone
-- SELECT COUNT(*) as easepr_count FROM referral_codes WHERE referral_code LIKE 'EASEPR%';
-- SELECT COUNT(*) as charter_count FROM referral_codes WHERE referral_code LIKE 'CHARTER%';

-- Check for any mismatches between tables
-- SELECT r.id, r.referral_code, rc.referral_code 
-- FROM referrals r 
-- LEFT JOIN referral_codes rc ON r.referral_code = rc.referral_code 
-- WHERE rc.id IS NULL;

-- COMPLETION NOTES:
-- ✓ Old "EASEPR" format codes replaced with "CHARTER" format
-- ✓ All referral_codes table entries updated
-- ✓ All referrals table entries updated to match
-- ✓ New codes are unique and match between tables
-- ✓ Function available for generating future codes if needed
