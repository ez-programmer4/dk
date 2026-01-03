# Tax System Deployment Review

## 1. MySQL Migration for stripeFee Column

The `stripeFee` column already exists in the Prisma schema. Run this migration on your production database:

```sql
-- Migration: Add stripeFee column to tax_transactions table
-- File: migrations/add_stripe_fee_to_tax_transactions.sql

ALTER TABLE tax_transactions
ADD COLUMN IF NOT EXISTS stripeFee DECIMAL(10, 2) NULL
AFTER totalAmount;
```

**Note:** The column is already defined in `prisma/schema.prisma` as `stripeFee Decimal? @db.Decimal(10, 2)`, so you may need to run `npx prisma db push` or create a migration.

## 2. Webhook Handlers Review

### Currently Configured Webhooks:

1. ✅ **checkout.session.completed** - **ESSENTIAL**

   - Handles initial subscription creation
   - Updates subscription metadata
   - **Required for automatic tax** - processes initial payment

2. ✅ **invoice.payment_succeeded** - **ESSENTIAL**

   - Handles all successful payments (initial + renewals)
   - **CRITICAL for automatic tax** - extracts and stores tax from invoices
   - Processes tax transactions for both initial and renewal payments

3. ⚠️ **invoice.payment_failed** - **RECOMMENDED**

   - Handles failed payments
   - Updates subscription status
   - Not directly related to tax, but important for subscription management

4. ⚠️ **customer.subscription.deleted** - **RECOMMENDED**

   - Handles subscription cancellations
   - Updates local database
   - Not directly related to tax, but important for subscription lifecycle

5. ⚠️ **customer.subscription.updated** - **OPTIONAL**

   - Handles subscription updates (plan changes, etc.)
   - Updates local database
   - Not directly related to tax

6. ❌ **invoice.upcoming** - **OPTIONAL**
   - Sends notifications before upcoming invoices
   - Not required for tax processing
   - Can be removed if not needed

### Recommendation:

**Keep these webhooks:**

- ✅ `checkout.session.completed` - **REQUIRED**
- ✅ `invoice.payment_succeeded` - **REQUIRED** (most important for tax)
- ✅ `invoice.payment_failed` - **RECOMMENDED** (for subscription management)

**Optional (can remove if not needed):**

- ⚠️ `customer.subscription.deleted` - Only if you need to track cancellations
- ⚠️ `customer.subscription.updated` - Only if you need to track plan changes
- ❌ `invoice.upcoming` - Only if you need to send pre-payment notifications

## 4. Logs Removed

All `console.log` statements have been removed from:

- ✅ `src/app/api/super-admin/tax/reports/route.ts`
- ⚠️ `src/app/api/payments/stripe/webhook/route.ts` - Debug/info logs removed, errors/warnings kept

**Note:** Critical error logs are kept for production debugging.

## 5. Deployment Checklist

- [ ] Run MySQL migration for `stripeFee` column
- [ ] Verify Stripe Tax origin address is configured
- [ ] Verify tax registrations are set up for required jurisdictions
- [ ] Test automatic tax with a real subscription
- [ ] Verify tax appears in super-admin reports
- [ ] Configure webhooks in Stripe Dashboard (minimum required: checkout.session.completed, invoice.payment_succeeded)
- [ ] Verify webhook endpoint is accessible
- [ ] Test webhook signature verification

## 6. Webhook Configuration in Stripe Dashboard

**Minimum Required Webhooks:**

1. `checkout.session.completed`
2. `invoice.payment_succeeded`

**Recommended Additional:** 3. `invoice.payment_failed`

**Optional:** 4. `customer.subscription.deleted` 5. `customer.subscription.updated` 6. `invoice.upcoming` (can be removed)
