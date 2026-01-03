# Stripe Payment Gateway - Testing Guide

## Overview

This guide provides comprehensive testing instructions for all the improvements made to the Stripe payment gateway.

---

## ✅ Completed Improvements Summary

1. **Subscription Creation** - Always uses dynamic checkout sessions with metadata
2. **Idempotency** - Prevents duplicate processing
3. **Verification** - Simplified (webhook is single source of truth)
4. **Upgrade Proration** - Uses Stripe's built-in proration
5. **Months Table Logic** - Only updates future months, preserves history
6. **Database Constraint** - Unique constraint on stripeSubscriptionId (already exists)
7. **Downgrade Logic** - Uses immediate proration
8. **Error Handling** - Improved logging throughout

---

## 🧪 Test Cases

### Test 1: Subscription Creation

**Objective:** Verify subscription is created with metadata and finalized correctly

**Steps:**
1. Navigate to student mini-app
2. Select a student with non-ETB currency
3. Click "Subscribe" on a subscription package
4. Complete payment in Stripe checkout
5. Return to the app

**Expected Results:**
- ✅ Checkout session includes studentId and packageId in metadata
- ✅ Webhook finalizes subscription automatically
- ✅ Return page shows subscription status (no manual finalization needed)
- ✅ Subscription appears in database with correct studentId and packageId
- ✅ Months_table entries created for package duration

**Verification:**
```sql
-- Check subscription was created
SELECT * FROM student_subscriptions 
WHERE studentId = <studentId> 
ORDER BY createdAt DESC LIMIT 1;

-- Check months were created
SELECT * FROM months_table 
WHERE studentid = <studentId> 
ORDER BY month DESC;
```

---

### Test 2: Idempotency (Race Condition Prevention)

**Objective:** Verify no duplicate records when webhook and return page both try to finalize

**Steps:**
1. Create a subscription (Test 1)
2. Manually trigger webhook event (or wait for it)
3. Simultaneously call verify-session endpoint
4. Check database

**Expected Results:**
- ✅ Only ONE subscription record created
- ✅ Only ONE payment record created
- ✅ No duplicate months_table entries
- ✅ Idempotency key prevents duplicates

**Verification:**
```sql
-- Should return 1
SELECT COUNT(*) FROM student_subscriptions 
WHERE stripeSubscriptionId = '<subscriptionId>';

-- Should return 1
SELECT COUNT(*) FROM payment 
WHERE subscriptionId = <subscriptionId> 
AND reason LIKE '%Subscription payment%';
```

---

### Test 3: Upgrade Subscription

**Objective:** Verify upgrade uses Stripe's proration and only updates future months

**Prerequisites:**
- Active subscription (at least 1 month old)

**Steps:**
1. Navigate to subscription management
2. Click "Upgrade" on a higher-tier package
3. Confirm upgrade
4. Check Stripe dashboard for invoice
5. Check database records

**Expected Results:**
- ✅ Stripe creates invoice automatically with proration
- ✅ Invoice amount matches Stripe's calculation (not manual)
- ✅ Only future months updated to new rate
- ✅ Historical months preserve original amounts
- ✅ Payment record created with actual invoice amount

**Verification:**
```sql
-- Check months before upgrade date (should have old rate)
SELECT month, paid_amount 
FROM months_table 
WHERE studentid = <studentId> 
AND month < '<upgradeMonth>'
ORDER BY month;

-- Check months after upgrade date (should have new rate)
SELECT month, paid_amount 
FROM months_table 
WHERE studentid = <studentId> 
AND month >= '<upgradeMonth>'
ORDER BY month;
```

**Stripe Dashboard:**
- Check invoice for upgrade
- Verify proration line items
- Verify invoice amount

---

### Test 4: Downgrade Subscription

**Objective:** Verify downgrade uses immediate proration

**Prerequisites:**
- Active subscription

**Steps:**
1. Navigate to subscription management
2. Click "Downgrade" on a lower-tier package
3. Confirm downgrade
4. Check Stripe dashboard
5. Check database records

**Expected Results:**
- ✅ Stripe creates invoice immediately with proration
- ✅ Credit applied immediately (not at period end)
- ✅ Subscription updated immediately
- ✅ Only future months updated
- ✅ Historical months preserved

**Verification:**
- Check Stripe invoice shows credit/charge immediately
- Check subscription status in database
- Check months_table entries

---

### Test 5: Cancel Subscription

**Objective:** Verify cancellation works correctly

**Steps:**
1. Navigate to subscription management
2. Click "Cancel Subscription"
3. Confirm cancellation
4. Check database and Stripe

**Expected Results:**
- ✅ Status set to "cancelled" in database
- ✅ Stripe subscription has `cancel_at_period_end: true`
- ✅ UI updates immediately
- ✅ Subscription continues until period end

**Verification:**
```sql
SELECT status, endDate 
FROM student_subscriptions 
WHERE id = <subscriptionId>;
```

---

### Test 6: Webhook Processing

**Objective:** Verify webhook handles all events correctly

**Test Events:**
1. `checkout.session.completed` - Initial subscription
2. `invoice.payment_succeeded` - Renewal payment
3. `invoice.payment_failed` - Failed payment
4. `customer.subscription.updated` - Status changes
5. `customer.subscription.deleted` - Cancellation

**Expected Results:**
- ✅ All events processed without errors
- ✅ Proper logging for each event
- ✅ Database updated correctly
- ✅ No duplicate processing

**Verification:**
- Check application logs
- Check database records
- Verify idempotency prevents duplicates

---

### Test 7: Return Page Verification

**Objective:** Verify return page just checks status (doesn't finalize)

**Steps:**
1. Complete payment
2. Return to return page
3. Check network requests
4. Verify subscription status

**Expected Results:**
- ✅ Return page calls status endpoint (not verify-session)
- ✅ Status endpoint checks if subscription exists
- ✅ If exists, shows success
- ✅ If not, shows pending (webhook still processing)
- ✅ No duplicate finalization attempts

**Verification:**
- Check browser network tab
- Verify only status check, no finalization
- Check logs for duplicate attempts

---

### Test 8: Error Handling

**Objective:** Verify improved error messages and logging

**Test Scenarios:**
1. Invalid subscription ID
2. Missing package
3. Currency mismatch
4. Stripe API errors
5. Database errors

**Expected Results:**
- ✅ Clear error messages for users
- ✅ Detailed logging for debugging
- ✅ Proper error codes
- ✅ No stack traces exposed to users

**Verification:**
- Check error responses
- Check application logs
- Verify error messages are user-friendly

---

## 🔍 Manual Verification Checklist

### Database Checks

- [ ] No duplicate subscriptions for same stripeSubscriptionId
- [ ] No duplicate payments for same transaction
- [ ] Historical months preserved with original amounts
- [ ] Future months updated correctly
- [ ] Subscription status matches Stripe status

### Stripe Dashboard Checks

- [ ] Subscription metadata includes studentId and packageId
- [ ] Invoices show correct proration amounts
- [ ] No duplicate invoices
- [ ] Customer ID matches student record

### Application Logs

- [ ] Structured logging with context
- [ ] Error messages are clear
- [ ] Idempotency keys logged
- [ ] No duplicate processing logs

---

## 🐛 Common Issues & Solutions

### Issue: Subscription not finalizing

**Possible Causes:**
- Webhook not configured correctly
- Metadata missing
- Idempotency check failing

**Solution:**
- Check webhook endpoint configuration
- Verify metadata in Stripe dashboard
- Check logs for idempotency key conflicts

### Issue: Months not updating correctly

**Possible Causes:**
- Upgrade/downgrade date calculation wrong
- Historical months being overwritten

**Solution:**
- Verify only future months are updated
- Check upgradeDate/downgradeDate calculation
- Verify months before date are preserved

### Issue: Invoice amounts don't match

**Possible Causes:**
- Using old manual proration logic
- Stripe proration not working

**Solution:**
- Verify using `proration_behavior: "always"`
- Check Stripe invoice line items
- Trust Stripe's calculation

---

## 📊 Performance Testing

### Load Testing

1. **Concurrent Subscriptions:**
   - Create 10 subscriptions simultaneously
   - Verify all finalize correctly
   - Check for race conditions

2. **Rapid Upgrades:**
   - Upgrade subscription multiple times quickly
   - Verify no conflicts
   - Check database consistency

3. **Webhook Flood:**
   - Send multiple webhook events rapidly
   - Verify idempotency prevents duplicates
   - Check system stability

---

## 🔐 Security Testing

1. **Cross-Student Assignment:**
   - Try to assign subscription to wrong student
   - Verify validation prevents this
   - Check customer ID matching

2. **Metadata Tampering:**
   - Try to modify subscription metadata
   - Verify validation prevents unauthorized changes
   - Check database constraints

3. **Idempotency Bypass:**
   - Try to create duplicate with different keys
   - Verify unique constraint prevents this
   - Check application-level checks

---

## 📝 Test Results Template

```
Test Case: [Name]
Date: [Date]
Tester: [Name]

Steps:
1. [Step]
2. [Step]
3. [Step]

Expected: [Expected result]
Actual: [Actual result]

Status: ✅ Pass / ❌ Fail

Notes: [Any observations]
```

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] Database migration applied (if needed)
- [ ] Webhook endpoint configured in Stripe
- [ ] Environment variables set correctly
- [ ] Logging configured
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Rollback plan ready

---

## 📞 Support

If you encounter issues during testing:

1. Check application logs
2. Check Stripe dashboard
3. Check database records
4. Review error messages
5. Contact development team with:
   - Error logs
   - Stripe subscription ID
   - Student ID
   - Timestamp of issue

