import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSchoolCreationWithPlanSelection() {
  console.log('🎓 Testing School Creation with Plan Selection...\n');

  try {
    // Get available pricing plans
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      include: {
        planFeatures: {
          include: { feature: true }
        }
      }
    });

    console.log(`✅ Found ${plans.length} active pricing plans:`);
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: ${plan.currency} ${plan.baseSalaryPerStudent}/student`);
    });

    // Select the first available plan (usually Basic Plan)
    const selectedPlan = plans[0];
    if (!selectedPlan) {
      console.log('❌ No active pricing plans found. Please create plans first.');
      return;
    }

    console.log(`\n🎯 Selected Plan: ${selectedPlan.name} (${selectedPlan.currency} ${selectedPlan.baseSalaryPerStudent}/student)`);

    // Create school with plan selection
    const timestamp = Date.now();
    const schoolData = {
      name: 'Plan Selection Test School',
      slug: `plan-selection-test-${timestamp}`,
      email: 'plan@test.com',
      phone: '+251911111111',
      address: '123 Plan Selection Street',
      pricingPlanId: selectedPlan.id,
      enabledFeatures: {}, // No custom feature overrides
      logoUrl: '',
      primaryColor: '#3B82F6',
      secondaryColor: '#1F2937',
      timezone: 'Africa/Addis_Ababa',
      defaultCurrency: 'ETB',
      defaultLanguage: 'en',
      features: {
        zoom: true,
        analytics: true,
        reports: true,
        notifications: true,
        integrations: false,
        apiAccess: false,
        customDomain: false,
        telegramBot: true,
        mobileApp: false,
        multiLanguage: false,
      },
      adminName: 'Plan Test Admin',
      adminUsername: `admin_plan_${timestamp}`,
      adminPhone: '+251911111111',
      adminPassword: 'Admin123!',
    };

    console.log('🏫 Creating school with plan selection...');

    // Simulate the API call - create school
    const school = await prisma.school.create({
      data: {
        name: schoolData.name,
        slug: schoolData.slug,
        email: schoolData.email,
        phone: schoolData.phone,
        address: schoolData.address,
        logoUrl: schoolData.logoUrl,
        primaryColor: schoolData.primaryColor,
        secondaryColor: schoolData.secondaryColor,
        timezone: schoolData.timezone,
        defaultCurrency: schoolData.defaultCurrency,
        defaultLanguage: schoolData.defaultLanguage,
        features: schoolData.features,
      },
    });

    console.log(`✅ School created: ${school.name} (ID: ${school.id})`);

    // Create subscription with selected plan
    const subscription = await prisma.schoolSubscription.create({
      data: {
        schoolId: school.id,
        planId: selectedPlan.id,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        activeStudentCount: 0,
        enabledFeatures: schoolData.enabledFeatures,
      },
    });

    console.log(`✅ Subscription created: ${subscription.id} with plan ${selectedPlan.name}`);

    // Create admin
    const hashedPassword = await import('bcryptjs').then(({ hash }) => hash(schoolData.adminPassword, 12));

    const admin = await prisma.admin.create({
      data: {
        name: schoolData.adminName,
        username: schoolData.adminUsername,
        passcode: hashedPassword,
        phoneno: schoolData.adminPhone,
        schoolId: school.id,
        chat_id: `admin_${school.slug}_${Date.now()}`,
      }
    });

    console.log(`✅ Admin created: ${admin.name} (${admin.username})`);

    // Test billing calculation
    console.log('\n🧮 Testing billing calculation for selected plan...');

    // Add some students for testing
    console.log('👥 Adding test students...');
    for (let i = 1; i <= 30; i++) {
      await prisma.wpos_wpdatatable_23.upsert({
        where: { wdt_ID: 3000 + i },
        update: {
          name: `Plan Test Student ${i}`,
          schoolId: school.id,
        },
        create: {
          wdt_ID: 3000 + i,
          name: `Plan Test Student ${i}`,
          schoolId: school.id,
        },
      });
    }

    // Update subscription student count
    await prisma.schoolSubscription.update({
      where: { schoolId: school.id },
      data: { activeStudentCount: 30 },
    });

    console.log('✅ Added 30 test students');

    // Calculate billing manually
    const baseFee = Number(selectedPlan.baseSalaryPerStudent) * 30;
    const planFeatures = await prisma.planFeature.findMany({
      where: { planId: selectedPlan.id },
      include: { feature: true }
    });

    let featureFee = 0;
    console.log('📋 Plan features:');
    planFeatures.forEach(pf => {
      if (pf.isEnabled && pf.price > 0) {
        featureFee += Number(pf.price);
        console.log(`  - ${pf.feature.name}: +${selectedPlan.currency} ${pf.price}`);
      }
    });

    const totalFee = baseFee + featureFee;

    console.log(`\n💰 Billing Calculation for ${school.name}:`);
    console.log(`   - Plan: ${selectedPlan.name}`);
    console.log(`   - Students: 30`);
    console.log(`   - Base Fee: ${selectedPlan.currency} ${selectedPlan.baseSalaryPerStudent} × 30 = ${selectedPlan.currency} ${baseFee}`);
    console.log(`   - Feature Fees: ${selectedPlan.currency} ${featureFee}`);
    console.log(`   - Total Monthly: ${selectedPlan.currency} ${totalFee}`);

    console.log('\n🎉 School creation with plan selection test completed successfully!');
    console.log(`\n📋 Test Summary:`);
    console.log(`   - School: ${school.name}`);
    console.log(`   - Selected Plan: ${selectedPlan.name}`);
    console.log(`   - Plan Price: ${selectedPlan.currency} ${selectedPlan.baseSalaryPerStudent}/student`);
    console.log(`   - Students: 30`);
    console.log(`   - Monthly Cost: ${selectedPlan.currency} ${totalFee}`);
    console.log(`   - Features: ${planFeatures.filter(pf => pf.isEnabled).length} enabled`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSchoolCreationWithPlanSelection().catch(console.error);
