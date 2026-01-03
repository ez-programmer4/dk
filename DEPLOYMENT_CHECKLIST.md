# Deployment Checklist: Subscription Upgrade/Downgrade/Cancellation

## 📋 Pre-Deployment Checklist

### 1. Database Migration

- [ ] **Run Prisma migration for `providerPayload` field**
  ```bash
  npx prisma migrate dev --name add_provider_payload_to_payment
  ```
  - The `providerPayload Json?` field was added to the `payment` model
  - This field stores credit information (`isCredit`, `creditAmount`, etc.)
  - **IMPORTANT**: This is a non-breaking change (nullable field), but migration is required

### 2. Environment Variables

Ensure these environment variables are set in production:

- [ ] `STRIPE_SECRET_KEY` - Stripe secret key (required)
- [ ] `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (required)
- [ ] `DATABASE_URL` - Database connection string (required)
- [ ] `NEXTAUTH_SECRET` - NextAuth secret (required)
- [ ] `NEXTAUTH_URL` - Production URL (required)

### 3. Stripe Webhook Configuration

- [ ] **Verify Stripe Webhook Endpoint is Configured**
  - URL: `https://yourdomain.com/api/payments/stripe/webhook`
  - **Existing events are sufficient** (no additional events needed for upgrade/downgrade):
    - `checkout.session.completed` - Handles initial subscription creation
    - `invoice.payment_succeeded` - Handles payments (including upgrade/downgrade payments)
    - `invoice.payment_failed` - Handles failed payments
    - `customer.subscription.updated` - **Handles upgrade/downgrade events automatically**
    - `customer.subscription.deleted` - Handles subscription cancellations
    - `invoice.upcoming` - Handles upcoming invoices
  - [ ] Verify webhook signature validation is working
  - [ ] Test webhook delivery in Stripe dashboard
  - **Note**: `customer.subscription.updated` automatically fires when subscriptions are upgraded/downgraded via Stripe API, so no additional webhook configuration is needed.

### 4. Database Schema Verification

Run this SQL to verify the `providerPayload` column exists:

```sql
DESCRIBE wpos_wpdatatable_29;
-- Should show `providerPayload` as JSON type
```

If the column doesn't exist, run:

```sql
ALTER TABLE wpos_wpdatatable_29
ADD COLUMN providerPayload JSON NULL;
```

### 5. Code Deployment

- [ ] Build the application:
  ```bash
  npm run build
  ```
- [ ] Verify no build errors
- [ ] Deploy to production server
- [ ] Restart the application server

### 6. Post-Deployment Testing

#### Upgrade Functionality

- [ ] Test upgrading from a lower-tier package to a higher-tier package
- [ ] Verify proration calculation is correct
- [ ] Check that payment record is created with correct amount
- [ ] Verify `months_table` is updated with new monthly rate
- [ ] Confirm Stripe invoice shows correct amount and status as "paid"

#### Downgrade Functionality

- [ ] Test downgrading from a higher-tier package to a lower-tier package
- [ ] Verify credit calculation is correct (when customer receives credit)
- [ ] Check that payment record shows credit with "CREDIT:" prefix in reason
- [ ] Verify `providerPayload.isCredit` is set to `true` for credits
- [ ] Confirm `months_table` is updated for future months only (historical months preserved)
- [ ] Verify credit balance is visible to student in payment section

#### Cancellation Functionality

- [ ] Test canceling an active subscription
- [ ] Verify subscription status changes to "cancelled" in database
- [ ] Check that Stripe subscription has `cancel_at_period_end: true`
- [ ] Confirm student retains access until `endDate`
- [ ] Verify no new charges occur after cancellation
- [ ] Test that student can resubscribe after cancellation

#### Config-Dependent Features

- [ ] Test subscription package filtering by config
- [ ] Verify students only see packages assigned to their config
- [ ] Test creating/updating subscription package configs
- [ ] Verify config changes reflect immediately for students

### 7. Monitoring & Logging

- [ ] Check application logs for any errors
- [ ] Monitor Stripe webhook delivery in Stripe dashboard
- [ ] Verify payment records are being created correctly
- [ ] Check for any duplicate payment records (should be none after fix)
- [ ] Monitor database for any constraint violations

### 8. Rollback Plan

If issues occur:

1. Revert code deployment
2. The database changes are non-breaking (nullable field), so no rollback needed
3. Check Stripe dashboard for any pending invoices
4. Review logs to identify the issue

## 🚨 Known Issues Fixed

- ✅ Duplicate payment records from webhook (fixed in `finalizeSubscription.ts`)
- ✅ Credit balance not showing for students (fixed in `parent/child/[studentId]/route.ts`)
- ✅ Months table not updating on downgrade (fixed in `downgrade/route.ts`)
- ✅ Payment records showing positive amount for credits (fixed with `providerPayload`)

## 📝 Additional Features to Consider

### Recommended Enhancements (Not Required for Deployment)

1. **Email Notifications**

   - Send email when subscription is upgraded/downgraded
   - Send email when subscription is cancelled
   - Send email when credit is applied

2. **Admin Dashboard Enhancements**

   - Show credit balances in admin payment view
   - Filter payments by credit/charge type
   - Export subscription change history

3. **Analytics**

   - Track upgrade/downgrade frequency
   - Monitor credit balance trends
   - Subscription retention metrics

4. **Error Handling**
   - Better error messages for failed upgrades/downgrades
   - Retry mechanism for failed Stripe API calls
   - Graceful degradation if Stripe is unavailable

## ✅ Deployment Readiness

**Status**: ✅ **READY TO DEPLOY**

All core functionality is implemented and tested:

- ✅ Upgrade with proration
- ✅ Downgrade with credit handling
- ✅ Cancellation with period-end access (in `[id]/route.ts` PATCH method)
- ✅ Config-dependent package filtering
- ✅ Credit balance tracking and display
- ✅ Duplicate payment prevention
- ✅ Months table updates
- ✅ Webhook handling for subscription updates

## 🔧 Deployment Commands

```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
npm install

# 3. Run database migration
npx prisma migrate deploy

# 4. Generate Prisma client
npx prisma generate

# 5. Build application
npm run build

# 6. Restart application (depends on your deployment setup)
# PM2: pm2 restart your-app
# Docker: docker-compose restart
# Systemd: systemctl restart your-app
```

## 📞 Support

If you encounter any issues during deployment:

1. Check application logs
2. Check Stripe webhook logs
3. Verify database schema matches Prisma schema
4. Test in staging environment first if available
