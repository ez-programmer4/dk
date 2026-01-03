/**
 * Script to manually finalize pending Stripe subscription payments
 * 
 * Usage:
 *   node scripts/finalize-pending-stripe-payments.js
 * 
 * This script will:
 * 1. Find all pending subscription checkouts
 * 2. For each checkout, retrieve the session from Stripe
 * 3. If payment was successful, finalize the subscription
 */

const { PrismaClient } = require('@prisma/client');
const Stripe = require('stripe');

const prisma = new PrismaClient();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function finalizePendingPayments() {
  try {
    console.log('🔍 Finding pending subscription checkouts...\n');

    // Find all pending subscription checkouts
    const pendingCheckouts = await prisma.payment_checkout.findMany({
      where: {
        provider: 'stripe',
        intent: 'subscription',
        status: { not: 'completed' },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (pendingCheckouts.length === 0) {
      console.log('✅ No pending checkouts found!');
      return;
    }

    console.log(`📋 Found ${pendingCheckouts.length} pending checkouts:\n`);

    for (const checkout of pendingCheckouts) {
      const metadata = checkout.metadata || {};
      const sessionId = metadata.stripeSessionId;

      if (!sessionId) {
        console.log(`⚠️  Checkout ${checkout.id}: No session ID in metadata, skipping`);
        continue;
      }

      console.log(`\n🔄 Processing Checkout ID: ${checkout.id}`);
      console.log(`   Session ID: ${sessionId}`);
      console.log(`   Student ID: ${checkout.studentId}`);

      try {
        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['subscription'],
        });

        console.log(`   Payment Status: ${session.payment_status}`);
        console.log(`   Session Status: ${session.status}`);

        if (session.payment_status !== 'paid') {
          console.log(`   ⚠️  Payment not completed, skipping`);
          continue;
        }

        if (session.mode !== 'subscription') {
          console.log(`   ⚠️  Not a subscription checkout, skipping`);
          continue;
        }

        const subscriptionId = session.subscription;
        if (!subscriptionId) {
          console.log(`   ⚠️  No subscription ID found, skipping`);
          continue;
        }

        console.log(`   ✅ Subscription ID: ${subscriptionId}`);

        // Call the finalize endpoint
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const response = await fetch(`${baseUrl}/api/admin/payments/stripe/manual-finalize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Note: You'll need to provide admin authentication
            // For now, this will fail without proper auth
          },
          body: JSON.stringify({
            sessionId: sessionId,
            subscriptionId: subscriptionId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`   ✅ Successfully finalized: ${result.message}`);
        } else {
          const error = await response.json();
          console.log(`   ❌ Failed: ${error.error || error.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    console.log('\n✅ Done processing all checkouts!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
finalizePendingPayments();





