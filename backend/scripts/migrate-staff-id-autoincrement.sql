-- Migration: Add auto-increment to staff_id column in Staffs table
-- Run this in pgAdmin to fix the "null value in column staff_id" error

-- Step 1: Create a sequence for staff_id if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS staffs_staff_id_seq;

-- Step 2: Set the sequence to start from the current max staff_id + 1
SELECT setval('staffs_staff_id_seq', COALESCE((SELECT MAX(staff_id) FROM "Staffs"), 1), true);

-- Step 3: Alter the staff_id column to use the sequence as default
ALTER TABLE "Staffs" 
ALTER COLUMN staff_id SET DEFAULT nextval('staffs_staff_id_seq');

-- Step 4: Set the sequence ownership to the column (optional but recommended)
ALTER SEQUENCE staffs_staff_id_seq OWNED BY "Staffs".staff_id;

-- Verify the change
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'Staffs' AND column_name = 'staff_id';
