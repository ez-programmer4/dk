-- MySQL queries to create subscription package config system
-- This system allows grouping packages into configs and assigning configs to students
-- 
-- IMPORTANT: If you already ran the first query, run the rollback script first:
-- mysql_rollback_subscription_package_config.sql

-- Step 1: Create subscription_package_config table (the config/group)
CREATE TABLE IF NOT EXISTS `subscription_package_config` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `isActive` TINYINT(1) NOT NULL DEFAULT 1,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `subscription_package_config_isActive_idx` (`isActive`),
  INDEX `subscription_package_config_name_idx` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Add configId column to subscription_packages table
ALTER TABLE `subscription_packages` 
ADD COLUMN `configId` INT NULL AFTER `isActive`,
ADD INDEX `subscription_packages_configId_idx` (`configId`),
ADD CONSTRAINT `subscription_packages_configId_fkey` 
  FOREIGN KEY (`configId`) 
  REFERENCES `subscription_package_config` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;

-- Step 3: Add subscriptionPackageConfigId column to wpos_wpdatatable_23 (student table)
ALTER TABLE `wpos_wpdatatable_23` 
ADD COLUMN `subscriptionPackageConfigId` INT NULL AFTER `stripeCustomerId`,
ADD INDEX `wpos_wpdatatable_23_subscriptionPackageConfigId_idx` (`subscriptionPackageConfigId`),
ADD CONSTRAINT `wpos_wpdatatable_23_subscriptionPackageConfigId_fkey` 
  FOREIGN KEY (`subscriptionPackageConfigId`) 
  REFERENCES `subscription_package_config` (`id`) 
  ON DELETE SET NULL 
  ON UPDATE CASCADE;
