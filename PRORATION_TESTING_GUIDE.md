# Proration Calculation Testing Guide

## Overview

This guide helps you test and verify proration calculations for mid-cycle subscription upgrades and downgrades.

---

## Quick Test Script

Run the test script to see proration calculations:

```bash
node test-proration.js
```

This will show you:
- How proration is calculated for different scenarios
- Expected credit amounts
- Expected net charges
- Real-world examples from your logs

---

## Manual Testing Steps

### Test 1: Upgrade Mid-Cycle

**Scenario:** Upgrade from 3-month package to 5-month package, 14 days into the subscription.

**Steps:**
1. Create a subscription with a 3-month package (e.g., $150)
2. Wait or manually set the subscription to be 14 days old
3. Upgrade to a 5-month package (e.g., $300)
4. Verify the proration calculation

**Expected Calculation:**
- Original: $150 for 3 months = $50/month = $1.67/day
- New: $300 for 5 months = $60/month = $2.00/day
- Days used: 14
- Days remaining: 78 (92 total - 14 used)
- Credit: $1.67 × 78 = $130.26
- Net charge: $300 - $130.26 = $169.74

**Verification:**
1. Check Stripe dashboard invoice amount
2. Check database `payment` record amount
3. Compare with calculated amount

---

### Test 2: Upgrade Early in Cycle

**Scenario:** Upgrade after only 1 day.

**Steps:**
1. Create subscription
2. Upgrade immediately (or set date to 1 day after start)
3. Verify credit is nearly full original package price

**Expected:**
- Most of original package price should be credited
- Net charge should be close to: New Price - (Original Price - 1 day)

---

### Test 3: Upgrade Late in Cycle

**Scenario:** Upgrade near the end of the subscription period.

**Steps:**
1. Create subscription
2. Wait until near end date (or manually set date)
3. Upgrade
4. Verify minimal credit

**Expected:**
- Minimal credit (most of period already used)
- Net charge should be close to full new package price

---

### Test 4: Downgrade Mid-Cycle

**Scenario:** Downgrade from 5-month to 3-month package.

**Steps:**
1. Create subscription with 5-month package
2. Downgrade to 3-month package mid-cycle
3. Verify credit calculation

**Expected:**
- Credit for unused time at higher rate
- Net amount may be negative (customer gets credit)
- Stripe handles this automatically

---

## Verification Checklist

After each test, verify:

### ✅ Stripe Dashboard
- [ ] Invoice created with correct amount
- [ ] Invoice shows proration line items
- [ ] Invoice amount matches calculated net amount (within $0.01)

### ✅ Database Records
- [ ] `payment` record created with correct amount
- [ ] `student_subscriptions` updated with:
  - [ ] Correct `packageId`
  - [ ] Correct `startDate` (should be original start date for upgrades)
  - [ ] Correct `endDate` (original start + new duration)
- [ ] `months_table` entries updated correctly:
  - [ ] All months from original start to new end date
  - [ ] All months have new package rate
  - [ ] No duplicate months

### ✅ Frontend Display
- [ ] Subscription status shows as "active"
- [ ] Package name updated
- [ ] End date extended correctly
- [ ] Proration amount displayed correctly (if shown)

---

## Common Issues & Solutions

### Issue: Net Amount Doesn't Match Stripe Invoice

**Possible Causes:**
- Stripe's proration calculation differs slightly
- Timezone differences in date calculations
- Rounding differences

**Solution:**
- Stripe's calculation is authoritative
- Our calculation is for estimation/display
- Database should store Stripe's actual invoice amount

### Issue: Start Date Changed After Upgrade

**Symptom:** Start date changes from original to upgrade date.

**Solution:**
- Fixed in code: upgrades now preserve original start date
- Verify `startDate` in database matches original subscription start

### Issue: Wrong Number of Months Updated

**Symptom:** Months table has wrong number of entries or wrong amounts.

**Solution:**
- For upgrades: All months from original start to new end should be updated
- For downgrades: Only future months should be updated
- Verify month count = new package duration

---

## Testing with Real Data

### Step 1: Create Test Subscription

```sql
-- Check current subscription
SELECT * FROM student_subscriptions 
WHERE studentId = <your_test_student_id>
ORDER BY createdAt DESC LIMIT 1;
```

### Step 2: Perform Upgrade/Downgrade

Use the UI to upgrade or downgrade the subscription.

### Step 3: Check Stripe Invoice

1. Go to Stripe Dashboard
2. Find the subscription
3. Check the latest invoice
4. Note the invoice amount and line items

### Step 4: Verify Database

```sql
-- Check payment record
SELECT * FROM payment 
WHERE subscriptionId = <subscription_id>
ORDER BY paymentdate DESC LIMIT 1;

-- Check subscription record
SELECT * FROM student_subscriptions 
WHERE id = <subscription_id>;

-- Check months table
SELECT month, paid_amount, payment_status 
FROM months_table 
WHERE studentid = <student_id>
AND paymentId = <payment_id>
ORDER BY month;
```

### Step 5: Compare Amounts

Compare:
- Stripe invoice amount
- Database payment amount
- Calculated proration amount (from test script)

They should all match (within $0.01).

---

## Expected Results Summary

| Scenario | Days Used | Credit Amount | Net Charge |
|----------|-----------|---------------|------------|
| Upgrade early (1 day) | 1 | ~$149.17 | ~$150.83 |
| Upgrade mid (14 days) | 14 | ~$130.26 | ~$169.74 |
| Upgrade late (81 days) | 81 | ~$18.37 | ~$281.63 |
| Downgrade mid (14 days) | 14 | ~$260.53 | ~$-110.53* |

*Negative means customer receives credit

---

## Debugging Tips

1. **Check Logs:**
   - Look for `[UpgradeSubscription]` or `[DowngradeSubscription]` logs
   - Check proration calculation logs
   - Verify Stripe API responses

2. **Check Dates:**
   - Ensure dates are in UTC
   - Verify timezone handling
   - Check date calculations

3. **Check Amounts:**
   - Verify package prices are correct
   - Check currency matches
   - Ensure no rounding errors accumulate

4. **Stripe Dashboard:**
   - Check invoice line items
   - Verify proration breakdown
   - Check subscription metadata

---

## Automated Testing

You can also create automated tests:

```javascript
// Example test
const proration = calculateProration({
  currentPrice: 150,
  currentDuration: 3,
  newPrice: 300,
  newDuration: 5,
  originalStartDate: new Date("2025-11-10"),
  currentEndDate: new Date("2026-02-10"),
  upgradeDate: new Date("2025-11-24"),
});

// Assert
assert.equal(proration.netAmount, 169.74, "Net amount should match");
```

---

## Questions to Answer

After testing, you should be able to answer:

1. ✅ Does the proration calculation match Stripe's invoice?
2. ✅ Is the start date preserved for upgrades?
3. ✅ Is the end date calculated correctly?
4. ✅ Are all months updated with the new rate?
5. ✅ Is the payment record created with the correct amount?
6. ✅ Does the UI display the correct information?

---

## Next Steps

1. Run the test script: `node test-proration.js`
2. Perform manual tests with real subscriptions
3. Compare results with Stripe dashboard
4. Verify database records
5. Check UI display

If everything matches, the proration system is working correctly! 🎉

