-- ============================================================================
-- MIGRATION SCRIPT: Payment System & Subscription Features
-- ============================================================================
-- This script adds all the new tables, columns, and enums for the payment
-- system including Chapa, Stripe, and subscription functionality.
-- ============================================================================

-- ============================================================================
-- 1. CREATE ENUMS (if not using MySQL ENUM, we'll use VARCHAR with CHECK constraints)
-- ============================================================================

-- Note: MySQL doesn't have native ENUM types like PostgreSQL, so we use VARCHAR
-- The application will enforce the enum values

-- ============================================================================
-- 2. ALTER EXISTING TABLES
-- ============================================================================

-- Update wpos_wpdatatable_24: Change schedule column type
ALTER TABLE `wpos_wpdatatable_24` 
MODIFY COLUMN `schedule` TEXT NULL;

-- Update wpos_wpdatatable_23: Add new columns
ALTER TABLE `wpos_wpdatatable_23`
ADD COLUMN `classfeeCurrency` VARCHAR(10) NOT NULL DEFAULT 'ETB' AFTER `classfee`,
ADD COLUMN `stripeCustomerId` VARCHAR(255) NULL AFTER `parent_phone`;

-- Update months_table: Add payment tracking columns
ALTER TABLE `months_table`
ADD COLUMN `paymentId` INT NULL AFTER `is_free_month`,
ADD COLUMN `source` VARCHAR(20) NOT NULL DEFAULT 'manual' AFTER `paymentId`,
ADD COLUMN `providerReference` VARCHAR(255) NULL AFTER `source`,
ADD COLUMN `providerStatus` VARCHAR(50) NULL AFTER `providerReference`,
ADD COLUMN `providerPayload` JSON NULL AFTER `providerStatus`,
ADD INDEX `idx_paymentId` (`paymentId`),
ADD CONSTRAINT `fk_months_payment` 
    FOREIGN KEY (`paymentId`) 
    REFERENCES `wpos_wpdatatable_29` (`wdt_ID`) 
    ON DELETE SET NULL;

-- Update payment table (wpos_wpdatatable_29): Add new columns
ALTER TABLE `wpos_wpdatatable_29`
ADD COLUMN `currency` VARCHAR(10) NOT NULL DEFAULT 'ETB' AFTER `status`,
ADD COLUMN `source` VARCHAR(20) NOT NULL DEFAULT 'manual' AFTER `currency`,
ADD COLUMN `intent` VARCHAR(20) NOT NULL DEFAULT 'tuition' AFTER `source`,
ADD COLUMN `providerReference` VARCHAR(255) NULL AFTER `intent`,
ADD COLUMN `providerStatus` VARCHAR(50) NULL AFTER `providerReference`,
ADD COLUMN `providerFee` DECIMAL(10, 2) NULL AFTER `providerStatus`,
ADD COLUMN `providerPayload` JSON NULL AFTER `providerFee`,
ADD COLUMN `subscriptionId` INT NULL AFTER `providerPayload`;

-- ============================================================================
-- 3. CREATE NEW TABLES
-- ============================================================================

-- Create payment_checkout table
CREATE TABLE IF NOT EXISTS `payment_checkout` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `txRef` VARCHAR(255) NOT NULL,
    `studentId` INT NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `intent` VARCHAR(20) NOT NULL DEFAULT 'tuition',
    `amount` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `status` VARCHAR(32) NOT NULL DEFAULT 'initialized',
    `months` JSON NULL,
    `checkoutUrl` VARCHAR(500) NULL,
    `returnUrl` VARCHAR(500) NULL,
    `callbackUrl` VARCHAR(500) NULL,
    `paymentId` INT NULL,
    `metadata` JSON NULL,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_txRef` (`txRef`),
    INDEX `idx_studentId` (`studentId`),
    INDEX `idx_provider` (`provider`),
    CONSTRAINT `fk_payment_checkout_student` 
        FOREIGN KEY (`studentId`) 
        REFERENCES `wpos_wpdatatable_23` (`wdt_ID`) 
        ON DELETE CASCADE,
    CONSTRAINT `fk_payment_checkout_payment` 
        FOREIGN KEY (`paymentId`) 
        REFERENCES `wpos_wpdatatable_29` (`wdt_ID`) 
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create subscription_packages table
CREATE TABLE IF NOT EXISTS `subscription_packages` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `duration` INT NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `currency` VARCHAR(10) NOT NULL,
    `description` TEXT NULL,
    `paymentLink` VARCHAR(500) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_isActive` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create student_subscriptions table
CREATE TABLE IF NOT EXISTS `student_subscriptions` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `studentId` INT NOT NULL,
    `packageId` INT NOT NULL,
    `stripeSubscriptionId` VARCHAR(255) NOT NULL,
    `stripeCustomerId` VARCHAR(255) NOT NULL,
    `status` VARCHAR(50) NOT NULL,
    `startDate` DATETIME NOT NULL,
    `endDate` DATETIME NOT NULL,
    `nextBillingDate` DATETIME NULL,
    `autoRenew` BOOLEAN NOT NULL DEFAULT TRUE,
    `createdAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updatedAt` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_stripeSubscriptionId` (`stripeSubscriptionId`),
    INDEX `idx_studentId` (`studentId`),
    INDEX `idx_stripeSubscriptionId` (`stripeSubscriptionId`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_student_subscriptions_student` 
        FOREIGN KEY (`studentId`) 
        REFERENCES `wpos_wpdatatable_23` (`wdt_ID`) 
        ON DELETE CASCADE,
    CONSTRAINT `fk_student_subscriptions_package` 
        FOREIGN KEY (`packageId`) 
        REFERENCES `subscription_packages` (`id`) 
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key from payment to student_subscriptions
ALTER TABLE `wpos_wpdatatable_29`
ADD CONSTRAINT `fk_payment_subscription` 
    FOREIGN KEY (`subscriptionId`) 
    REFERENCES `student_subscriptions` (`id`) 
    ON DELETE SET NULL;

-- ============================================================================
-- 5. UPDATE EXISTING DATA (if needed)
-- ============================================================================

-- Set default currency for existing payments
UPDATE `wpos_wpdatatable_29` 
SET `currency` = 'ETB' 
WHERE `currency` IS NULL OR `currency` = '';

-- Set default source for existing payments
UPDATE `wpos_wpdatatable_29` 
SET `source` = 'manual' 
WHERE `source` IS NULL OR `source` = '';

-- Set default intent for existing payments
UPDATE `wpos_wpdatatable_29` 
SET `intent` = 'tuition' 
WHERE `intent` IS NULL OR `intent` = '';

-- Set default currency for existing students
UPDATE `wpos_wpdatatable_23` 
SET `classfeeCurrency` = 'ETB' 
WHERE `classfeeCurrency` IS NULL OR `classfeeCurrency` = '';

-- Set default source for existing months_table entries
UPDATE `months_table` 
SET `source` = 'manual' 
WHERE `source` IS NULL OR `source` = '';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Verify the changes:
-- SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME IN ('wpos_wpdatatable_23', 'wpos_wpdatatable_24', 'wpos_wpdatatable_29', 'months_table', 'payment_checkout', 'subscription_packages', 'student_subscriptions');
-- ============================================================================

