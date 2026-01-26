import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testPricingSystem() {
  console.log('🚀 Testing pricing system directly...\n');

  try {
    // Test 1: Check seeded data
    console.log('📋 1. Checking seeded pricing data...');
    const plans = await prisma.pricingPlan.findMany({
      include: {
        planFeatures: {
          include: { feature: true }
        },
        _count: { select: { subscriptions: true } }
      }
    });

    console.log(`✅ Found ${plans.length} pricing plans:`);
    plans.forEach(plan => {
      console.log(`  - ${plan.name} (${plan.slug}): ${plan.currency} ${plan.baseSalaryPerStudent}/student, ${plan.planFeatures.length} features, ${plan._count.subscriptions} subscriptions`);
    });

    const features = await prisma.feature.findMany();
    console.log(`✅ Found ${features.length} features:`);
    features.forEach(feature => {
      console.log(`  - ${feature.name} (${feature.code}) - ${feature.isCore ? 'Core' : 'Premium'}`);
    });

    // Test 2: Check school subscription
    console.log('\n🏫 2. Checking school subscription...');
    const schoolId = 'cmku42lad0003cjylzkdqr82j';
    const subscription = await prisma.schoolSubscription.findUnique({
      where: { schoolId },
      include: {
        plan: {
          include: {
            planFeatures: {
              include: { feature: true }
            }
          }
        }
      }
    });

    if (subscription) {
      console.log('✅ School has active subscription:');
      console.log(`  - Plan: ${subscription.plan.name}`);
      console.log(`  - Status: ${subscription.status}`);
      console.log(`  - Students: ${subscription.activeStudentCount}`);
      console.log(`  - Billing Cycle: ${subscription.billingCycle}`);
    } else {
      console.log('❌ School has no subscription');
    }

    // Test 3: Manual pricing calculation
    console.log('\n🧮 3. Manual pricing calculation test...');
    if (subscription) {
      const baseSalary = Number(subscription.plan.baseSalaryPerStudent);
      const studentCount = subscription.activeStudentCount;
      const baseFee = baseSalary * studentCount;

      let featureFee = 0;
      subscription.plan.planFeatures.forEach(pf => {
        if (pf.isEnabled && pf.price > 0) {
          featureFee += Number(pf.price);
          console.log(`  - ${pf.feature.name}: +${subscription.plan.currency} ${pf.price}`);
        }
      });

      const totalFee = baseFee + featureFee;

      console.log(`✅ Calculation for ${studentCount} students on ${subscription.plan.name}:`);
      console.log(`  - Base Fee: ${subscription.plan.currency} ${baseSalary} × ${studentCount} = ${subscription.plan.currency} ${baseFee}`);
      console.log(`  - Feature Fees: ${subscription.plan.currency} ${featureFee}`);
      console.log(`  - Total Monthly: ${subscription.plan.currency} ${totalFee}`);
    }

    // Test 4: Compare all plans for 50 students
    console.log('\n📊 4. Plan comparison for 50 students...');
    plans.forEach(plan => {
      const baseFee = Number(plan.baseSalaryPerStudent) * 50;
      const featureFee = plan.planFeatures
        .filter(pf => pf.isEnabled)
        .reduce((sum, pf) => sum + Number(pf.price), 0);
      const total = baseFee + featureFee;

      console.log(`  - ${plan.name}: ${plan.currency} ${total}/month (${plan.planFeatures.filter(pf => pf.isEnabled && pf.price > 0).length} premium features)`);
    });

    console.log('\n🎉 Pricing system tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPricingSystem().catch(console.error);
