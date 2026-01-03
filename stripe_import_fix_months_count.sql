-- ============================================================================
-- STRIPE IMPORT: Fix Months Count
-- ============================================================================
-- This script fixes the months_table entries by using the correct package duration
-- from the database instead of the incorrect package_duration from import data
-- ============================================================================

-- ============================================================================
-- STEP 1: Delete incorrect months_table entries
-- ============================================================================
-- Remove months that were created with wrong duration

DELETE mt FROM months_table mt
INNER JOIN wpos_wpdatatable_29 p ON mt.paymentId = p.wdt_ID
INNER JOIN stripe_import_temp si ON CONVERT(p.providerReference USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
WHERE p.source = 'stripe' 
  AND p.intent = 'subscription'
  AND JSON_EXTRACT(p.providerPayload, '$.isLegacy') = true;

-- ============================================================================
-- STEP 2: Recreate months_table entries with correct duration
-- ============================================================================
-- Use the actual package duration from subscription_packages table

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
    INNER JOIN subscription_packages pkg2 ON pkg2.id = si2.package_id
    CROSS JOIN (
        SELECT 0 as n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 
        UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9
        UNION SELECT 10 UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14
        UNION SELECT 15 UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19
        UNION SELECT 20 UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24
    ) months
    WHERE n < pkg2.duration  -- Use actual package duration from database
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
-- STEP 3: Verification - Check month counts
-- ============================================================================

-- Show expected vs actual month counts
SELECT 
    si.subscription_id,
    si.student_id,
    si.customer_name,
    pkg.id as package_id,
    pkg.name as package_name,
    pkg.duration as expected_months,
    COUNT(mt.id) as actual_months,
    CASE 
        WHEN COUNT(mt.id) = pkg.duration THEN '✅ Correct'
        ELSE '❌ Wrong'
    END as status
FROM stripe_import_temp si
INNER JOIN student_subscriptions ss ON CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
INNER JOIN subscription_packages pkg ON ss.packageId = pkg.id
INNER JOIN wpos_wpdatatable_29 p ON p.subscriptionId = ss.id
LEFT JOIN months_table mt ON mt.paymentId = p.wdt_ID
WHERE si.student_id IS NOT NULL
GROUP BY si.subscription_id, si.student_id, si.customer_name, pkg.id, pkg.name, pkg.duration
ORDER BY si.subscription_id;

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

