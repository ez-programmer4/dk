-- ============================================================================
-- STRIPE IMPORT: Bulk Import for Multiple Students (FIXED VERSION)
-- ============================================================================
-- This script imports multiple students from Stripe export
-- Follow these steps in order
-- ============================================================================

-- ============================================================================
-- STEP 1: Create the import table
-- ============================================================================

DROP TABLE IF EXISTS stripe_import_temp;

CREATE TABLE stripe_import_temp (
    subscription_id VARCHAR(255),
    customer_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10),
    status VARCHAR(50),
    start_date DATETIME,
    end_date DATETIME,
    customer_name VARCHAR(255),
    student_id INT,
    package_id INT,
    package_duration INT
);

-- ============================================================================
-- STEP 2: Insert all student data
-- ============================================================================
-- IMPORTANT: Update package_id values based on your subscription_packages table
-- The package_duration is from the export, but verify package_id matches

INSERT INTO stripe_import_temp (
    subscription_id,
    customer_id,
    amount,
    currency,
    status,
    start_date,
    end_date,
    customer_name,
    student_id,
    package_id,
    package_duration
) VALUES
-- Row 1
('sub_1SX6sG', 'cus_TU52M2hqiWR9qL', 90.00, 'usd', 'active', '2025-11-24 21:00:00', '2026-02-24 21:00:00', 'Eman Mohammed Beyan', 244447, 5, 5),
-- Row 2
('sub_1SVgU7', 'cus_TSbhNeh9eNuS4F', 148.50, 'usd', 'active', '2025-11-20 22:37:00', '2026-02-20 22:37:00', 'Feruz medeni', 10806, 10, 10),
-- Row 3
('sub_1SUVHj', 'cus_TRO3yufR9cJV7H', 180.00, 'usd', 'active', '2025-11-17 16:28:00', '2026-02-17 16:28:00', 'Nuria Ahmed', 245401, 1, 1),
-- Row 4
('sub_1STI9qA', 'cus_TQcOIHDAAfnv6O', 60.00, 'usd', 'active', '2025-11-15 15:12:00', '2026-02-15 15:12:00', 'Salih Abdella Ismail', 255533, 3, 3),
-- Row 5
('sub_1SSrwu', 'cus_TPhLKPYQstk5av', 40.00, 'usd', 'active', '2025-11-13 04:15:00', '2026-05-13 04:15:00', 'Kemeria Beshir', 244559, 14, 14),
-- Row 6
('sub_1SSbIM', 'cus_TPQ8sKmnjClxXi', 55.00, 'usd', 'active', '2025-11-12 10:28:00', '2026-02-12 10:28:00', 'Ayantu kedir nur', 11533, 9, 9),
-- Row 7
('sub_1SQNn\\', 'cus_TN836ctRyKhvS4', 60.00, 'usd', 'active', '2025-11-06 07:39:00', '2026-02-06 07:39:00', 'Sofiya Hassen', 245364, 3, 3),
-- Row 8
('sub_1SQFDZ', 'cus_TMzB4jmsccwduo', 40.00, 'usd', 'active', '2025-11-05 22:30:00', '2025-12-05 22:30:00', 'Zeyiba', 245381, 1, 1),
-- Row 9
('sub_1SQACC', 'cus_TMuRr1LzIQq1nG', 40.00, 'usd', 'active', '2025-11-05 17:35:00', '2025-12-05 17:35:00', 'ayda', 245303, 1, 1),
-- Row 10
('sub_1SOk3i/', 'cus_TLQvizRxk6lMSq', 55.00, 'usd', 'active', '2025-11-01 19:01:00', '2026-02-01 19:01:00', 'Sufi gamada', 245348, 9, 9),
-- Row 11
('sub_1SNTEO', 'cus_TK7SiK9Giu6FJn', 55.00, 'usd', 'active', '2025-10-29 06:51:00', '2025-11-29 06:51:00', 'Eman adem', 245244, 1, 1);

-- ============================================================================
-- STEP 3: Verify package IDs match your database
-- ============================================================================
-- Run this to check if package_ids exist and match the amounts

SELECT 
    si.subscription_id,
    si.student_id,
    si.amount,
    si.package_id as import_package_id,
    si.package_duration as import_duration,
    pkg.id as db_package_id,
    pkg.name as package_name,
    pkg.price as db_price,
    pkg.duration as db_duration,
    CASE 
        WHEN si.package_id = pkg.id AND si.amount = pkg.price THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM stripe_import_temp si
LEFT JOIN subscription_packages pkg ON pkg.id = si.package_id
ORDER BY si.subscription_id;

-- ============================================================================
-- STEP 3b: Verify student IDs exist in database
-- ============================================================================
-- Run this to check which student_ids don't exist (will show NULL for missing students)

SELECT 
    si.subscription_id,
    si.student_id,
    si.customer_name,
    s.wdt_ID as db_student_id,
    s.name as db_student_name,
    CASE 
        WHEN s.wdt_ID IS NOT NULL THEN '✅ Student Exists'
        ELSE '❌ Student NOT FOUND - Will be skipped'
    END as student_status
FROM stripe_import_temp si
LEFT JOIN wpos_wpdatatable_23 s ON s.wdt_ID = si.student_id
ORDER BY si.subscription_id;

-- ============================================================================
-- STEP 4: Create payment records (FIXED - Only for existing students)
-- ============================================================================

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
    si.student_id,
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
INNER JOIN wpos_wpdatatable_23 s ON s.wdt_ID = si.student_id
LEFT JOIN subscription_packages p ON p.id = si.package_id
WHERE si.student_id IS NOT NULL
  AND si.package_id IS NOT NULL;

-- ============================================================================
-- STEP 5: Create subscription records (Only for existing students)
-- ============================================================================

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
)
SELECT 
    si.student_id,
    si.package_id,
    si.subscription_id,
    si.customer_id,
    CASE 
        WHEN si.end_date < NOW() THEN 'completed'
        ELSE 'active'
    END,
    si.start_date,
    si.end_date,
    si.end_date,
    false,
    si.start_date,
    NOW()
FROM stripe_import_temp si
INNER JOIN wpos_wpdatatable_23 s ON s.wdt_ID = si.student_id
WHERE si.student_id IS NOT NULL
  AND si.package_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM student_subscriptions ss
      WHERE CONVERT(ss.stripeSubscriptionId USING utf8mb3) = CONVERT(si.subscription_id USING utf8mb3)
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
-- Only updates existing students (no need for additional check since JOIN handles it)

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

-- Show students that were skipped (not found in database)
SELECT 
    'Skipped Students' as type,
    si.subscription_id,
    si.student_id,
    si.customer_name,
    si.amount,
    si.currency,
    'Student ID not found in wpos_wpdatatable_23' as reason
FROM stripe_import_temp si
LEFT JOIN wpos_wpdatatable_23 s ON s.wdt_ID = si.student_id
WHERE s.wdt_ID IS NULL
ORDER BY si.subscription_id;

-- ============================================================================
-- CLEANUP (Optional - uncomment to remove test data)
-- ============================================================================
-- DELETE FROM months_table WHERE paymentId IN (
--     SELECT wdt_ID FROM wpos_wpdatatable_29 
--     WHERE providerReference IN (SELECT subscription_id FROM stripe_import_temp)
-- );
-- DELETE FROM wpos_wpdatatable_29 WHERE providerReference IN (SELECT subscription_id FROM stripe_import_temp);
-- DELETE FROM student_subscriptions WHERE stripeSubscriptionId IN (SELECT subscription_id FROM stripe_import_temp);
-- DROP TABLE IF EXISTS stripe_import_temp;

