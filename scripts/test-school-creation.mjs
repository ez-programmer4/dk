import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testSchoolCreation() {
  try {
    console.log('🏫 Testing school creation with pricing...\n');

    // Get a pricing plan
    const basicPlan = await prisma.pricingPlan.findFirst({
      where: { slug: 'basic' },
      include: {
        planFeatures: {
          include: { feature: true }
        }
      }
    });

    if (!basicPlan) {
      console.log('❌ No basic pricing plan found. Please run pricing seed first.');
      return;
    }

    console.log(`✅ Using pricing plan: ${basicPlan.name} (${basicPlan.id})`);

    // Create a test school
    const timestamp = Date.now();
    const schoolData = {
      name: 'Test School',
      slug: `test-school-${timestamp}`,
      email: 'test@school.com',
      phone: '+251911111111',
      address: '123 Test Street',
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

    console.log('📝 Creating school...');
    const school = await prisma.school.create({
      data: schoolData,
    });

    console.log(`✅ School created: ${school.name} (ID: ${school.id})`);

    // Create subscription
    console.log('💰 Creating subscription...');
    const subscription = await prisma.schoolSubscription.create({
      data: {
        schoolId: school.id,
        planId: basicPlan.id,
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        activeStudentCount: 0,
      },
    });

    console.log(`✅ Subscription created: ${subscription.id}`);

    // Create admin without email field
    console.log('👤 Creating admin account...');
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    // Generate unique admin name and username
    const baseAdminName = 'Test Admin';
    const baseUsername = 'admin_test';

    let finalAdminName = baseAdminName;
    let finalUsername = baseUsername;
    let counter = 1;

    while (true) {
      const existingAdmin = await prisma.admin.findFirst({
        where: {
          OR: [
            { name: finalAdminName },
            { username: finalUsername }
          ]
        }
      });

      if (!existingAdmin) break;

      counter++;
      finalAdminName = `${baseAdminName} ${counter}`;
      finalUsername = `${baseUsername}_${counter}`;
    }

    const admin = await prisma.admin.create({
      data: {
        name: finalAdminName,
        username: finalUsername,
        passcode: hashedPassword,
        phoneno: '+251911111111',
        schoolId: school.id,
        chat_id: `admin_${school.slug}_${Date.now()}`,
      }
    });

    console.log(`✅ Admin created: ${admin.name} (${admin.username})`);

    // Test billing calculation
    console.log('🧮 Testing billing calculation...');

    // Add some mock students
    console.log('👥 Adding mock students...');
    for (let i = 1; i <= 25; i++) {
      await prisma.wpos_wpdatatable_23.upsert({
        where: { wdt_ID: 1000 + i },
        update: {
          name: `Mock Student ${i}`,
          schoolId: school.id,
        },
        create: {
          wdt_ID: 1000 + i,
          name: `Mock Student ${i}`,
          schoolId: school.id,
        },
      });
    }

    // Update subscription student count
    await prisma.schoolSubscription.update({
      where: { schoolId: school.id },
      data: { activeStudentCount: 25 },
    });

    console.log('✅ Added 25 mock students');

    // Calculate pricing manually
    const baseFee = Number(basicPlan.baseSalaryPerStudent) * 25;
    const featureFee = basicPlan.planFeatures
      .filter(pf => pf.isEnabled)
      .reduce((sum, pf) => sum + Number(pf.price), 0);
    const totalFee = baseFee + featureFee;

    console.log(`💵 Billing calculation for 25 students:`);
    console.log(`   - Base fee: ${basicPlan.currency} ${basicPlan.baseSalaryPerStudent} × 25 = ${basicPlan.currency} ${baseFee}`);
    console.log(`   - Feature fees: ${basicPlan.currency} ${featureFee}`);
    console.log(`   - Total monthly: ${basicPlan.currency} ${totalFee}`);

    console.log('\n🎉 School creation test completed successfully!');
    console.log(`\n📋 Test School Details:`);
    console.log(`   - Name: ${school.name}`);
    console.log(`   - Slug: ${school.slug}`);
    console.log(`   - Plan: ${basicPlan.name}`);
    console.log(`   - Students: 25`);
    console.log(`   - Monthly Cost: ${basicPlan.currency} ${totalFee}`);
    console.log(`   - Admin: ${admin.name} (${admin.username})`);

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testSchoolCreation().catch(console.error);
