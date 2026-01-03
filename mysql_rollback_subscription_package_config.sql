-- ROLLBACK script - Run this first to remove what was already created
-- This will safely remove the subscription package config system
-- 
-- Note: If you get errors about columns/constraints not existing, that's okay - 
-- it means they weren't created yet. Just continue with the next step.

-- Step 1: Remove foreign key and column from wpos_wpdatatable_23 (student table)
-- First, drop the foreign key constraint (if it exists)
ALTER TABLE `wpos_wpdatatable_23` 
DROP FOREIGN KEY `wpos_wpdatatable_23_subscriptionPackageConfigId_fkey`;

-- Then drop the index (if it exists)
ALTER TABLE `wpos_wpdatatable_23` 
DROP INDEX `wpos_wpdatatable_23_subscriptionPackageConfigId_idx`;

-- Finally, drop the column (if it exists)
ALTER TABLE `wpos_wpdatatable_23` 
DROP COLUMN `subscriptionPackageConfigId`;

-- Step 2: Remove foreign key and column from subscription_packages table
-- First, drop the foreign key constraint (if it exists)
ALTER TABLE `subscription_packages` 
DROP FOREIGN KEY `subscription_packages_configId_fkey`;

-- Then drop the index (if it exists)
ALTER TABLE `subscription_packages` 
DROP INDEX `subscription_packages_configId_idx`;

-- Finally, drop the column (if it exists)
ALTER TABLE `subscription_packages` 
DROP COLUMN `configId`;

-- Step 3: Drop the subscription_package_config table
DROP TABLE IF EXISTS `subscription_package_config`;
