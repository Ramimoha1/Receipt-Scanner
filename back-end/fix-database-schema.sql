-- Fix the receipts table schema
-- This script removes the raw_ai_response column and ensures image_url is large enough

-- 1. Drop the raw_ai_response column if it exists
ALTER TABLE receipts DROP COLUMN IF EXISTS raw_ai_response;

-- 2. Alter image_url column to TEXT type if it's not already
ALTER TABLE receipts ALTER COLUMN image_url TYPE TEXT;

-- Verify the schema (optional - run after fixing)
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'receipts'
-- ORDER BY ordinal_position;
