-- SQL script to add test subscription data
-- Run this in your MySQL database

-- First, create the subscription package if it doesn't exist
INSERT INTO subscription_packages (name, duration, price, currency, description, isActive, createdAt, updatedAt)
VALUES ('3', 1, 90.00, 'usd', '3 - 1month', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
  price = 90.00,
  currency = 'usd',
  updatedAt = NOW();

-- Get the package ID (you may need to adjust this based on your data)
SET @package_id = (SELECT id FROM subscription_packages WHERE name = '3' LIMIT 1);

-- Add the student subscription
INSERT INTO student_subscriptions (
  studentId,
  packageId,
  stripeSubscriptionId,
  stripeCustomerId,
  status,
  startDate,
  endDate,
  nextBillingDate,
  autoRenew,
  createdAt,
  updatedAt
) VALUES (
  9595,                                    -- studentId from metadata
  @package_id,                            -- packageId (from above)
  'sub_1SXVX0AoqPpU95beDAInXBlH',        -- stripeSubscriptionId
  'cus_TUUVemZR6EHCXT',                  -- stripeCustomerId
  'active',                               -- status
  '2025-11-25 23:20:00',                 -- startDate (Start Date UTC)
  '2026-02-25 23:20:00',                 -- endDate (Current Period End UTC)
  '2026-02-25 23:20:00',                 -- nextBillingDate
  1,                                      -- autoRenew (true)
  '2025-11-25 23:20:00',                 -- createdAt (Created UTC)
  NOW()                                   -- updatedAt
);

-- Update student's Stripe customer ID if not already set
UPDATE wpos_wpdatatable_23 
SET stripeCustomerId = 'cus_TUUVemZR6EHCXT'
WHERE wdt_ID = 9595 AND (stripeCustomerId IS NULL OR stripeCustomerId = '');

-- Verify the data was inserted correctly
SELECT 
  ss.id,
  ss.studentId,
  s.name as studentName,
  sp.name as packageName,
  ss.stripeSubscriptionId,
  ss.stripeCustomerId,
  ss.status,
  ss.startDate,
  ss.endDate,
  sp.price,
  sp.currency
FROM student_subscriptions ss
JOIN wpos_wpdatatable_23 s ON ss.studentId = s.wdt_ID
JOIN subscription_packages sp ON ss.packageId = sp.id
WHERE ss.studentId = 9595
ORDER BY ss.createdAt DESC;