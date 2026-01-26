async function testBillingCalculation(schoolId) {
  try {
    console.log('🧮 Testing billing calculation for school:', schoolId);

    const response = await fetch('http://localhost:3000/api/super-admin/billing/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: In production, this would need proper authentication
      },
      body: JSON.stringify({ schoolId }),
    });

    if (!response.ok) {
      console.log('❌ API call failed with status:', response.status);
      const errorText = await response.text();
      console.log('Error response:', errorText);
      return;
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Billing calculation successful!');
      console.log('📊 Calculation Results:');
      console.log('- Base Fee:', data.calculation.currency, data.calculation.baseFee.toFixed(2));
      console.log('- Active Students:', data.calculation.activeStudentCount);
      console.log('- Feature Fees:');
      data.calculation.featureFees.forEach(feature => {
        if (feature.price > 0) {
          console.log(`  - ${feature.featureName}: ${data.calculation.currency} ${feature.price.toFixed(2)} (${feature.isEnabled ? 'Enabled' : 'Disabled'})`);
        }
      });
      console.log('- Total Fee:', data.calculation.currency, data.calculation.totalFee.toFixed(2));
      console.log('- Breakdown:');
      console.log('  - Base:', data.calculation.breakdown.baseCalculation);
      console.log('  - Features:', data.calculation.breakdown.featureCalculation);
      console.log('  - Total:', data.calculation.breakdown.total);
    } else {
      console.log('❌ Calculation failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function testPricingPlans() {
  try {
    console.log('📋 Testing pricing plans API...');

    const response = await fetch('http://localhost:3000/api/super-admin/pricing/plans', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log('❌ API call failed with status:', response.status);
      return;
    }

    const data = await response.json();

    if (data.success) {
      console.log('✅ Pricing plans retrieved successfully!');
      console.log('📋 Available Plans:');
      data.plans.forEach(plan => {
        console.log(`- ${plan.name} (${plan.slug})`);
        console.log(`  - Base Price: ${plan.currency} ${plan.baseSalaryPerStudent}/student`);
        console.log(`  - Features: ${plan.planFeatures.length}`);
        console.log(`  - Default: ${plan.isDefault}`);
        console.log(`  - Schools: ${plan._count.subscriptions}`);
        console.log('');
      });
    } else {
      console.log('❌ Failed to get plans:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting comprehensive pricing system tests...\n');

  // Test 1: Check pricing plans
  await testPricingPlans();
  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Test billing calculation for the school with subscription
  await testBillingCalculation('cmku42lad0003cjylzkdqr82j');
  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Test billing calculation with different student counts
  console.log('🧪 Testing billing calculation with mock student count...');

  // Let's add some mock students to test the calculation
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    // Create some mock students
    console.log('👥 Creating mock students for testing...');
    for (let i = 1; i <= 10; i++) {
      await prisma.wpos_wpdatatable_23.upsert({
        where: { wdt_ID: i },
        update: {
          name: `Test Student ${i}`,
          schoolId: 'cmku42lad0003cjylzkdqr82j',
          // Add other required fields as needed
        },
        create: {
          wdt_ID: i,
          name: `Test Student ${i}`,
          schoolId: 'cmku42lad0003cjylzkdqr82j',
          // Add other required fields as needed
        },
      });
    }
    console.log('✅ Created 10 mock students');

    // Update subscription student count
    await prisma.schoolSubscription.update({
      where: { schoolId: 'cmku42lad0003cjylzkdqr82j' },
      data: { activeStudentCount: 10 },
    });

    console.log('🔄 Testing billing with 10 students...');
    await testBillingCalculation('cmku42lad0003cjylzkdqr82j');

  } catch (error) {
    console.error('❌ Error with mock data:', error);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n🎉 Pricing system tests completed!');
}

// Run the tests
runTests().catch(console.error);
