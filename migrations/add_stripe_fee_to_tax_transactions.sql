-- Migration: Add stripeFee column to tax_transactions table
-- Date: 2025-12-09
-- Description: Adds stripeFee column to store Stripe processing fees for each tax transaction

-- Check if column already exists before adding
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'tax_transactions'
    AND COLUMN_NAME = 'stripeFee'
);

-- Add stripeFee column if it doesn't exist
SET @sql = IF(@column_exists = 0,
    'ALTER TABLE tax_transactions ADD COLUMN stripeFee DECIMAL(10, 2) NULL AFTER totalAmount',
    'SELECT "Column stripeFee already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index for better query performance (optional)
-- CREATE INDEX idx_tax_transactions_stripeFee ON tax_transactions(stripeFee) WHERE stripeFee IS NOT NULL;

