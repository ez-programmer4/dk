-- ============================================================================
-- STRIPE IMPORT: Fix Missing Payments
-- ============================================================================
-- This script creates missing payments for subscriptions that were already created
-- Run this after Step 5 if payments are missing
-- ============================================================================

-- ============================================================================
-- STEP 4 (FIX): Create payment records for existing subscriptions
-- ============================================================================
-- This creates payments for subscriptions that exist but don't have payments yet

INSERT INTO wpos_wpdatatable_29 (
    studentid,
    studentname,
    paymentdate,
    transactionid,
    paidamount,
    reason,
    status,
    currency,
    source,
    intent,
    providerReference,
    providerStatus,
    providerPayload
)
SELECT 
    ss.studentId,
    si.customer_name,
    si.start_date,
    si.subscription_id,
    si.amount,
    CONCAT('Stripe subscription payment - ', COALESCE(p.name, 'Legacy Package')),
    'Approved',
    si.currency,
    'stripe',
    'subscription',
    si.subscription_id,
    si.status,
    JSON_OBJECT(
        'stripeSubscriptionId', si.subscription_id,
        'stripeCustomerId', si.customer_id,
        'importedAt', NOW(),
        'isLegacy', true
    )
FROM stripe_import_temp si
INNER JOIN student_subscriptions ss ON CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
LEFT JOIN subscription_packages p ON p.id = si.package_id
WHERE si.student_id IS NOT NULL
  AND si.package_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM wpos_wpdatatable_29 p2
      WHERE CONVERT(p2.providerReference USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
  );

-- ============================================================================
-- STEP 6: Link payments to subscriptions
-- ============================================================================

UPDATE wpos_wpdatatable_29 p
INNER JOIN stripe_import_temp si ON CONVERT(p.providerReference USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
INNER JOIN student_subscriptions ss ON CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
SET p.subscriptionId = ss.id
WHERE p.subscriptionId IS NULL;

-- ============================================================================
-- STEP 7: Create months_table entries
-- ============================================================================
-- Generate exactly the number of months in package duration

INSERT INTO months_table (
    studentid,
    month,
    paid_amount,
    payment_status,
    payment_type,
    start_date,
    end_date,
    source,
    providerReference,
    providerStatus,
    paymentId
)
SELECT 
    ss.studentId,
    DATE_FORMAT(month_date, '%Y-%m') as month,
    ROUND(pkg.price / pkg.duration, 0) as paid_amount,
    'Paid',
    'auto',
    DATE_FORMAT(month_date, '%Y-%m-01'),
    LAST_DAY(month_date),
    'stripe',
    p.providerReference,
    'success',
    p.wdt_ID
FROM student_subscriptions ss
INNER JOIN subscription_packages pkg ON ss.packageId = pkg.id
INNER JOIN wpos_wpdatatable_29 p ON p.subscriptionId = ss.id
INNER JOIN stripe_import_temp si ON CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
CROSS JOIN (
    SELECT 
        DATE_ADD(si2.start_date, INTERVAL n MONTH) as month_date,
        si2.subscription_id as sub_id,
        si2.package_id
    FROM stripe_import_temp si2
    CROSS JOIN (
        SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
        UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
        UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
        UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
    ) months
    WHERE n < si2.package_duration
) month_range
WHERE CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
  AND CONVERT(si.subscription_id USING utf8mb3) = CONVERT(month_range.sub_id USING utf8mb3)
  AND si.package_id = month_range.package_id
  AND NOT EXISTS (
      SELECT 1 FROM months_table mt
      WHERE mt.studentid = ss.studentId
        AND mt.month = DATE_FORMAT(month_range.month_date, '%Y-%m')
        AND mt.paymentId = p.wdt_ID
  );

-- ============================================================================
-- STEP 8: Update student records (Set stripeCustomerId)
-- ============================================================================

UPDATE wpos_wpdatatable_23 s
INNER JOIN stripe_import_temp si ON s.wdt_ID = si.student_id
SET s.stripeCustomerId = si.customer_id
WHERE (s.stripeCustomerId IS NULL OR s.stripeCustomerId = '')
  AND si.customer_id IS NOT NULL;

-- ============================================================================
-- STEP 9: Verification queries
-- ============================================================================

-- Summary
SELECT 
    'Summary' as info,
    COUNT(DISTINCT p.wdt_ID) as payments_created,
    COUNT(DISTINCT ss.id) as subscriptions_created,
    COUNT(DISTINCT mt.id) as months_created,
    COUNT(DISTINCT si.student_id) as students_imported
FROM stripe_import_temp si
LEFT JOIN wpos_wpdatatable_29 p ON CONVERT(p.providerReference USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
LEFT JOIN student_subscriptions ss ON CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
LEFT JOIN months_table mt ON mt.paymentId = p.wdt_ID;

-- Check for any issues
SELECT 
    'Issues Check' as type,
    si.subscription_id,
    si.student_id,
    si.customer_name,
    CASE WHEN s.wdt_ID IS NULL THEN '❌ Student Not Found' ELSE '✅ Student Exists' END as student_exists,
    CASE WHEN p.wdt_ID IS NULL THEN 'Missing Payment' ELSE 'OK' END as payment_status,
    CASE WHEN ss.id IS NULL THEN 'Missing Subscription' ELSE 'OK' END as subscription_status,
    (SELECT COUNT(*) FROM months_table WHERE paymentId = p.wdt_ID) as months_count
FROM stripe_import_temp si
LEFT JOIN wpos_wpdatatable_23 s ON s.wdt_ID = si.student_id
LEFT JOIN wpos_wpdatatable_29 p ON CONVERT(p.providerReference USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
LEFT JOIN student_subscriptions ss ON CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
ORDER BY si.subscription_id;

