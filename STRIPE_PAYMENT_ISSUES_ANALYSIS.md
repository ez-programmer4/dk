# Stripe Payment Gateway Issues - Comprehensive Analysis

## Executive Summary

This document provides a detailed analysis of issues found in the Stripe payment gateway implementation, specifically focusing on subscription creation, upgrades, downgrades, cancellations, and verification processes.

---

## 1. SUBSCRIPTION CREATION ISSUES

### 1.1 Payment Link Metadata Missing

**Location:** `src/app/student/mini-app/[chatId]/page.tsx` (handleSubscribe)
**Issue:** When using static payment links, the subscription metadata (studentId, packageId) is not included in the Stripe subscription at creation time.

**Problem Flow:**

1. User clicks subscribe with a payment link
2. Payment link redirects to Stripe (no metadata)
3. Webhook receives subscription but has no studentId/packageId
4. Verification fails or requires manual intervention

**Impact:** Subscriptions created via payment links cannot be automatically linked to students.

**Current Workaround:**

- SessionStorage is used to store metadata client-side
- Return page attempts to match subscription by packageId
- Complex retry logic in verify-session endpoint

**Recommended Fix:**

- Use dynamic checkout sessions instead of static payment links
- Ensure metadata is always included in subscription_data

### 1.2 Race Condition Between Webhook and Return Page

**Location:** `src/app/api/payments/stripe/webhook/route.ts` & `src/app/api/payments/stripe/verify-session/route.ts`
**Issue:** Both webhook and return page try to finalize subscriptions, causing race conditions.

**Problem:**

- `checkout.session.completed` webhook fires immediately
- Return page also calls `verify-session`
- Both try to create subscription records
- Can result in duplicate processing or missing data

**Current Mitigation:**

- Multiple checks for existing subscriptions
- Retry logic with delays
- Complex metadata extraction from multiple sources

**Recommended Fix:**

- Implement idempotency keys
- Use database transactions with proper locking
- Single source of truth for finalization

### 1.3 Customer ID Mismatch

**Location:** `src/app/api/payments/stripe/verify-session/route.ts` (lines 147-200)
**Issue:** When payment links create new customers, the customer ID doesn't match the student's stored customer ID.

**Problem:**

- Payment links may create new Stripe customers
- Student record has different customer ID
- Verification fails customer ID checks
- Subscription cannot be linked

**Current Workaround:**

- Lenient customer ID matching (15-30 minute window)
- Allows proceeding if subscription not assigned to another student
- Updates student's customer ID after the fact

**Recommended Fix:**

- Always use existing customer ID when creating checkout
- Update customer ID in database before redirecting
- Validate customer ID before allowing payment

---

## 2. VERIFICATION ISSUES

### 2.1 Missing Metadata in Subscription

**Location:** `src/app/api/payments/stripe/webhook/route.ts` (handleCheckoutSessionCompleted)
**Issue:** Subscriptions created via payment links often lack studentId in metadata.

**Problem Flow:**

1. Payment link doesn't include studentId in metadata
2. Webhook tries to extract from multiple sources
3. Complex fallback logic with multiple retries
4. May still fail if customer metadata also missing

**Current Extraction Methods:**

1. Session metadata
2. Payment checkout record
3. Stripe subscription metadata
4. Customer metadata
5. Payment link matching

**Recommended Fix:**

- Always include studentId in subscription metadata at creation
- Use dynamic checkout sessions with proper metadata
- Validate metadata before allowing payment

### 2.2 Search Window Too Lenient

**Location:** `src/app/api/payments/stripe/verify-session/route.ts` (lines 66-79)
**Issue:** 15-30 minute search window for finding subscriptions is too broad and could match wrong subscriptions.

**Problem:**

- Searches all subscriptions created in last 15-30 minutes
- Could match another student's subscription
- Only protected by customer ID check (which may fail)

**Risk:** Cross-student subscription assignment

**Recommended Fix:**

- Reduce search window to 5 minutes
- Require exact customer ID match
- Add additional verification (IP address, session token)

### 2.3 Subscription Already Assigned Check

**Location:** `src/app/api/payments/stripe/verify-session/route.ts` (lines 159-180)
**Issue:** Check for existing subscription assignment happens but may not prevent all race conditions.

**Problem:**

- Check happens before assignment
- Another request could assign between check and assignment
- Database transaction doesn't cover entire flow

**Recommended Fix:**

- Use database-level unique constraint on stripeSubscriptionId
- Implement proper transaction isolation
- Use optimistic locking

---

## 3. UPGRADE ISSUES

### 3.1 Complex Proration Logic

**Location:** `src/app/api/student/subscriptions/[id]/upgrade/route.ts`
**Issue:** Manual proration calculation with invoice items is complex and error-prone.

**Problem:**

- Creates invoice items manually
- Calculates proration separately from Stripe
- Multiple invoice creation/voiding steps
- Amounts may not match between calculation and Stripe

**Current Flow:**

1. Calculate proration manually
2. Create credit invoice item (negative)
3. Create charge invoice item (full price)
4. Update subscription with proration_behavior: "none"
5. Create new invoice manually
6. Void incorrect draft invoices
7. Finalize and pay invoice

**Issues:**

- Invoice amounts may not match calculations
- Multiple invoices may be created
- Timing issues with invoice item attachment

**Recommended Fix:**

- Use Stripe's built-in proration (`proration_behavior: "always"`)
- Simplify to single subscription update
- Trust Stripe's calculation (more accurate)

### 3.2 Months Table Update Logic

**Location:** `src/app/api/student/subscriptions/[id]/upgrade/route.ts` (lines 660-764)
**Issue:** Updates ALL months from original start date, which may overwrite historical data incorrectly.

**Problem:**

- Updates months that were already paid at old rate
- Should only update future months
- May cause accounting discrepancies

**Current Logic:**

```typescript
// Updates ALL months from originalStartDate to newEndDate
const allMonths = generateMonthStrings(originalStartDate, newEndDate);
// Updates all to newMonthlyRate
```

**Recommended Fix:**

- Only update months from upgrade date forward
- Preserve historical month records
- Create new months for new period

### 3.3 Payment Record Duplication

**Location:** `src/app/api/student/subscriptions/[id]/upgrade/route.ts` (lines 567-632)
**Issue:** Webhook may create payment record before upgrade endpoint, causing duplicates or conflicts.

**Problem:**

- Upgrade endpoint creates payment
- Webhook also tries to create payment
- Both check for existing but timing may cause duplicates

**Current Mitigation:**

- 5-minute window check
- Updates existing payment if found
- Still may miss in race conditions

**Recommended Fix:**

- Use idempotency keys
- Single source of truth (webhook or endpoint, not both)
- Database unique constraint on transaction ID

---

## 4. DOWNGRADE ISSUES

### 4.1 No Immediate Proration

**Location:** `src/app/api/student/subscriptions/[id]/downgrade/route.ts` (line 243)
**Issue:** Downgrade uses `proration_behavior: "none"`, meaning no immediate credit/charge.

**Problem:**

- Downgrade takes effect at period end
- Credit is created in database but not in Stripe
- Student pays full old price until period ends
- Credit may not be properly applied

**Current Behavior:**

- Creates credit record in database
- Updates Stripe subscription (no proration)
- Creates new months with new rate
- But Stripe still charges old rate until period end

**Recommended Fix:**

- Use immediate proration for downgrades too
- Apply credit immediately in Stripe
- Update subscription immediately

### 4.2 Months Preservation Logic

**Location:** `src/app/api/student/subscriptions/[id]/downgrade/route.ts` (lines 344-386)
**Issue:** Preserves existing months but creates new months, which may cause confusion.

**Problem:**

- Existing months keep old (higher) rate
- New months get new (lower) rate
- Creates inconsistent monthly rates
- May cause accounting issues

**Recommended Fix:**

- Clarify business logic: should downgrade be immediate or at period end?
- If immediate: update all future months
- If at period end: don't create new months until period ends

---

## 5. CANCELLATION ISSUES

### 5.1 Status Update Verification

**Location:** `src/app/api/student/subscriptions/[id]/route.ts` (DELETE, lines 106-124)
**Issue:** Status update is verified but webhook may overwrite it.

**Problem:**

- Endpoint sets status to "cancelled"
- Webhook receives `customer.subscription.updated`
- Webhook may set status back to "active" if cancel_at_period_end logic fails

**Current Logic:**

```typescript
// Endpoint sets to "cancelled"
status: "cancelled";

// Webhook checks cancel_at_period_end
if (subscription.cancel_at_period_end === true) {
  finalStatus = "cancelled";
}
```

**Issue:** If webhook fires before cancel_at_period_end is set, status may be wrong.

**Recommended Fix:**

- Always check cancel_at_period_end in webhook
- Preserve "cancelled" status if already set
- Add proper state machine for subscription status

### 5.2 UI Status Not Updating

**Location:** `src/app/student/mini-app/[chatId]/page.tsx` (handleCancel, lines 1502-1516)
**Issue:** UI updates status immediately but doesn't reload subscription data.

**Problem:**

- Status updated in local state
- Database updated
- But subscription details not reloaded
- May show incorrect information

**Current Fix:**

- Updates currentSubscriptionDetails state
- Doesn't reload from server
- Status may be out of sync

**Recommended Fix:**

- Reload subscription data after cancellation
- Verify status from server
- Show loading state during update

---

## 6. WEBHOOK PROCESSING ISSUES

### 6.1 Multiple Webhook Handlers

**Location:** Multiple files
**Issue:** Two separate webhook endpoints may process same events.

**Files:**

- `src/app/api/payments/stripe/webhook/route.ts` (subscription webhooks)
- `src/app/api/payments/webhooks/stripe/route.ts` (general webhooks)

**Problem:**

- Both may process same events
- Duplicate processing
- Inconsistent state

**Recommended Fix:**

- Consolidate to single webhook endpoint
- Use event deduplication
- Implement idempotency

### 6.2 Invoice Payment Succeeded Logic

**Location:** `src/app/api/payments/stripe/webhook/route.ts` (handleInvoicePaymentSucceeded)
**Issue:** Complex logic to determine if payment is initial or renewal.

**Problem:**

- Checks billing_reason
- Waits for metadata if missing
- May skip processing if metadata never arrives

**Current Logic:**

```typescript
const isRenewal =
  invoice.billing_reason === "subscription_cycle" ||
  invoice.billing_reason === "subscription_update";
const isInitialPayment =
  invoice.billing_reason === "subscription_create" ||
  invoice.billing_reason === null ||
  invoice.billing_reason === undefined;
```

**Issue:** Null/undefined billing_reason treated as initial, may be wrong.

**Recommended Fix:**

- Check if subscription exists in database
- If exists, it's a renewal
- If not, it's initial (with metadata check)

### 6.3 Metadata Retry Logic

**Location:** `src/app/api/payments/stripe/webhook/route.ts` (lines 740-772)
**Issue:** Retries up to 6 times (3 seconds) waiting for metadata, may still fail.

**Problem:**

- If metadata never arrives, payment is not processed
- No fallback mechanism
- Payment may be lost

**Recommended Fix:**

- Implement proper queue for missing metadata
- Admin interface to manually link subscriptions
- Alert system for unprocessed payments

---

## 7. FINALIZATION ISSUES

### 7.1 Months Table Entry Creation

**Location:** `src/lib/payments/finalizeSubscription.ts` (lines 456-667)
**Issue:** Complex logic for creating/updating months_table entries.

**Problem:**

- Handles upgrades, downgrades, initial payments differently
- May skip months for downgrades
- May update months incorrectly for upgrades

**Current Logic:**

- For upgrades: Updates all months to new rate
- For downgrades: Preserves existing, creates new
- For initial: Creates all months

**Issue:** Logic is scattered and inconsistent.

**Recommended Fix:**

- Centralize months creation logic
- Clear rules for each scenario
- Better error handling

### 7.2 Payment Amount Calculation

**Location:** `src/lib/payments/finalizeSubscription.ts` (lines 197-238)
**Issue:** Tries to get invoice amount from Stripe, falls back to package price.

**Problem:**

- Invoice amount may not be available immediately
- Package price may not match actual charge
- Proration amounts may be wrong

**Current Logic:**

1. Use invoiceAmount if provided
2. Try to fetch from Stripe invoice
3. Fall back to package price

**Issue:** For upgrades/downgrades, invoice amount is prorated, but package price is used for monthly calculation.

**Recommended Fix:**

- Always use actual invoice amount
- Calculate monthly breakdown from invoice
- Don't use package price for prorated payments

---

## 8. RETURN PAGE ISSUES

### 8.1 Complex Verification Flow

**Location:** `src/app/student/payments/return/page.tsx`
**Issue:** Multiple verification methods with complex fallback logic.

**Problem:**

- Tries session_id verification first
- Falls back to metadata matching
- Falls back to txRef lookup
- Multiple retries and polling

**Current Flow:**

1. Check for session_id → verify-session
2. Check for metadata → verify-session without session_id
3. Check for txRef → checkout status
4. Poll every 4 seconds up to 15 times

**Issue:** Too many fallback methods, hard to debug, may cause confusion.

**Recommended Fix:**

- Simplify to single verification method
- Clear error messages
- Better user feedback

### 8.2 SessionStorage Dependency

**Location:** `src/app/student/payments/return/page.tsx` (lines 76-109)
**Issue:** Relies heavily on sessionStorage for metadata.

**Problem:**

- SessionStorage may be cleared
- Different browser/device won't have data
- Not reliable for critical payment data

**Recommended Fix:**

- Store metadata in database before redirect
- Use URL parameters when possible
- Don't rely on client-side storage

---

## 9. RECOMMENDED FIXES PRIORITY

### High Priority (Critical)

1. **Fix subscription creation with metadata** - Always include studentId/packageId
2. **Implement idempotency** - Prevent duplicate processing
3. **Simplify verification** - Single source of truth
4. **Fix upgrade proration** - Use Stripe's built-in proration
5. **Fix months table logic** - Clear rules for each scenario

### Medium Priority (Important)

6. **Consolidate webhook handlers** - Single endpoint
7. **Fix downgrade logic** - Immediate or period-end, be consistent
8. **Improve error handling** - Better logging and alerts
9. **Fix return page flow** - Simplify verification

### Low Priority (Nice to Have)

10. **Improve UI feedback** - Better loading states
11. **Add admin tools** - Manual subscription linking
12. **Better documentation** - Code comments and docs

---

## 10. TESTING RECOMMENDATIONS

### Test Cases Needed

1. **Subscription Creation:**

   - Dynamic checkout session with metadata
   - Payment link without metadata
   - Race condition between webhook and return page

2. **Upgrade:**

   - Mid-period upgrade with proration
   - Upgrade at period start
   - Upgrade at period end
   - Verify invoice amounts match

3. **Downgrade:**

   - Mid-period downgrade
   - Downgrade at period start
   - Verify credit application

4. **Cancellation:**

   - Cancel active subscription
   - Cancel during trial
   - Verify status updates correctly

5. **Verification:**
   - Missing metadata scenarios
   - Customer ID mismatch
   - Multiple simultaneous requests

---

## Conclusion

The current implementation has many workarounds and complex logic to handle edge cases. The main issues stem from:

1. Missing metadata in payment links
2. Race conditions between webhooks and return page
3. Complex manual proration logic
4. Inconsistent months table handling

**Recommended Approach:**

1. Simplify by using Stripe's built-in features (proration, metadata)
2. Implement proper idempotency
3. Single source of truth for finalization
4. Clear business rules for each scenario
5. Better error handling and logging

This will make the system more reliable, easier to maintain, and less prone to edge case failures.
