import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCustomPlanCreation() {
  console.log('🧪 Testing Custom Plan Creation...\n');

  try {
    // Get existing features
    const features = await prisma.feature.findMany();
    console.log(`✅ Found ${features.length} features for testing`);

    // Create a test school with custom plan
    const timestamp = Date.now();
    const schoolData = {
      name: 'Custom Plan Test School',
      slug: `custom-plan-test-${timestamp}`,
      email: 'custom@test.com',
      phone: '+251911111111',
      address: '123 Custom Test Street',
      status: 'active',
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
    };

    console.log('🏫 Creating school with custom plan...');
    const school = await prisma.school.create({
      data: schoolData,
    });

    console.log(`✅ School created: ${school.name} (ID: ${school.id})`);

    // Create custom pricing plan
    const customPlanData = {
      name: `Custom Plan for ${school.name}`,
      description: `Custom pricing plan created for ${school.name}`,
      slug: `custom-${school.slug}`,
      baseSalaryPerStudent: 45.00, // Custom price
      currency: 'ETB',
      isActive: true,
      isDefault: false,
    };

    console.log('💰 Creating custom pricing plan...');
    const customPlan = await prisma.pricingPlan.create({
      data: customPlanData,
    });

    console.log(`✅ Custom plan created: ${customPlan.name} (${customPlan.currency} ${customPlan.baseSalaryPerStudent}/student)`);

    // Add some features to the custom plan
    const teacherPaymentFeature = features.find(f => f.code === 'teacher_payment');
    const advancedAnalyticsFeature = features.find(f => f.code === 'advanced_analytics');

    if (teacherPaymentFeature) {
      await prisma.planFeature.create({
        data: {
          planId: customPlan.id,
          featureId: teacherPaymentFeature.id,
          price: 30.00, // Custom price for teacher payment
          isEnabled: true,
        },
      });
      console.log(`✅ Added Teacher Payment feature (+${customPlan.currency} 30.00)`);
    }

    if (advancedAnalyticsFeature) {
      await prisma.planFeature.create({
        data: {
          planId: customPlan.id,
          featureId: advancedAnalyticsFeature.id,
          price: 25.00, // Custom price for analytics
          isEnabled: true,
        },
      });
      console.log(`✅ Added Advanced Analytics feature (+${customPlan.currency} 25.00)`);
    }

    // Create subscription
    console.log('🔗 Creating subscription...');
    const subscription = await prisma.schoolSubscription.create({
      data: {
        schoolId: school.id,
        planId: customPlan.id,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        activeStudentCount: 0,
      },
    });

    console.log(`✅ Subscription created: ${subscription.id}`);

    // Create admin
    const hashedPassword = await import('bcryptjs').then(({ hash }) => hash('Admin123!', 12));

    const admin = await prisma.admin.create({
      data: {
        name: `Custom Plan Admin`,
        username: `admin_custom_${timestamp}`,
        passcode: hashedPassword,
        phoneno: '+251911111111',
        schoolId: school.id,
        chat_id: `admin_${school.slug}_${Date.now()}`,
      }
    });

    console.log(`✅ Admin created: ${admin.name} (${admin.username})`);

    // Test pricing calculation
    console.log('\n🧮 Testing pricing calculation for custom plan...');

    // Add some mock students
    console.log('👥 Adding mock students...');
    for (let i = 1; i <= 20; i++) {
      await prisma.wpos_wpdatatable_23.upsert({
        where: { wdt_ID: 2000 + i },
        update: {
          name: `Custom Mock Student ${i}`,
          schoolId: school.id,
        },
        create: {
          wdt_ID: 2000 + i,
          name: `Custom Mock Student ${i}`,
          schoolId: school.id,
        },
      });
    }

    // Update subscription student count
    await prisma.schoolSubscription.update({
      where: { schoolId: school.id },
      data: { activeStudentCount: 20 },
    });

    console.log('✅ Added 20 mock students');

    // Calculate pricing manually
    const baseFee = Number(customPlan.baseSalaryPerStudent) * 20;
    const planFeatures = await prisma.planFeature.findMany({
      where: { planId: customPlan.id },
      include: { feature: true }
    });

    let featureFee = 0;
    planFeatures.forEach(pf => {
      if (pf.isEnabled && pf.price > 0) {
        featureFee += Number(pf.price);
        console.log(`  - ${pf.feature.name}: +${customPlan.currency} ${pf.price}`);
      }
    });

    const totalFee = baseFee + featureFee;

    console.log(`💵 Custom plan calculation for 20 students:`);
    console.log(`   - Base fee: ${customPlan.currency} ${customPlan.baseSalaryPerStudent} × 20 = ${customPlan.currency} ${baseFee}`);
    console.log(`   - Feature fees: ${customPlan.currency} ${featureFee}`);
    console.log(`   - Total monthly: ${customPlan.currency} ${totalFee}`);

    console.log('\n🎉 Custom plan creation test completed successfully!');
    console.log(`\n📋 Test Results:`);
    console.log(`   - School: ${school.name}`);
    console.log(`   - Custom Plan: ${customPlan.name}`);
    console.log(`   - Base Price: ${customPlan.currency} ${customPlan.baseSalaryPerStudent}/student`);
    console.log(`   - Students: 20`);
    console.log(`   - Custom Features: ${planFeatures.length}`);
    console.log(`   - Monthly Cost: ${customPlan.currency} ${totalFee}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testCustomPlanCreation().catch(console.error);
