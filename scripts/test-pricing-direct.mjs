import { PrismaClient } from '@prisma/client';
import { PricingCalculator } from '../src/lib/billing/pricing-calculator.js';

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

    // Test 3: Test pricing calculator
    console.log('\n🧮 3. Testing pricing calculator...');
    const calculation = await PricingCalculator.calculateSchoolPricing(schoolId);

    if (calculation) {
      console.log('✅ Pricing calculation successful:');
      console.log(`  - Base Fee: ${calculation.currency} ${calculation.baseFee.toFixed(2)}`);
      console.log(`  - Active Students: ${calculation.activeStudentCount}`);
      console.log(`  - Feature Fees: ${calculation.featureFees.filter(f => f.price > 0).length} features`);
      calculation.featureFees.filter(f => f.price > 0).forEach(feature => {
        console.log(`    - ${feature.featureName}: ${calculation.currency} ${feature.price.toFixed(2)}`);
      });
      console.log(`  - Total Fee: ${calculation.currency} ${calculation.totalFee.toFixed(2)}`);
      console.log(`  - Breakdown: ${calculation.breakdown.total}`);
    } else {
      console.log('❌ Pricing calculation failed');
    }

    // Test 4: Test plan preview with different student counts
    console.log('\n📊 4. Testing plan preview calculations...');
    const basicPlan = plans.find(p => p.slug === 'basic');
    if (basicPlan) {
      const preview5 = await PricingCalculator.calculatePlanPreview(basicPlan.id, 5);
      const preview25 = await PricingCalculator.calculatePlanPreview(basicPlan.id, 25);
      const preview100 = await PricingCalculator.calculatePlanPreview(basicPlan.id, 100);

      console.log('Basic Plan pricing preview:');
      console.log(`  - 5 students: ${preview5?.currency} ${preview5?.totalFee.toFixed(2)}`);
      console.log(`  - 25 students: ${preview25?.currency} ${preview25?.totalFee.toFixed(2)}`);
      console.log(`  - 100 students: ${preview100?.currency} ${preview100?.totalFee.toFixed(2)}`);
    }

    // Test 5: Test student counting
    console.log('\n👥 5. Testing student counting...');
    const studentCount = await PricingCalculator.getActiveStudentCount(schoolId);
    console.log(`✅ Active student count for school: ${studentCount}`);

    // Test 6: Test all plans pricing
    console.log('\n📈 6. Testing all plans comparison...');
    const allPlansPricing = await PricingCalculator.getAllPlansPricing(50);
    console.log('All plans pricing for 50 students:');
    allPlansPricing.forEach(item => {
      console.log(`  - ${item.plan.name}: ${item.plan.currency} ${item.pricing.totalFee.toFixed(2)}/month`);
    });

    console.log('\n🎉 All pricing system tests passed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPricingSystem().catch(console.error);
