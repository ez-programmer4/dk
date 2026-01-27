const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('Setting up test pricing data...');

    // Create features
    const features = [
      { name: 'Student Management', code: 'student_management', description: 'Basic student CRUD operations', isCore: true },
      { name: 'Teacher Management', code: 'teacher_management', description: 'Basic teacher profiles', isCore: true },
      { name: 'Basic Reporting', code: 'basic_reporting', description: 'Simple reports', isCore: true },
      { name: 'Teacher Payment', code: 'teacher_payment', description: 'Automated salary calculations', isCore: false },
      { name: 'Advanced Analytics', code: 'advanced_analytics', description: 'Comprehensive analytics', isCore: false },
    ];

    for (const feature of features) {
      await prisma.feature.upsert({
        where: { code: feature.code },
        update: feature,
        create: feature,
      });
    }

    // Create pricing plans
    const plans = [
      {
        name: 'Trial Plan',
        slug: 'trial',
        description: 'Free trial plan',
        baseSalaryPerStudent: 0,
        currency: 'ETB',
        isActive: true,
        isDefault: true,
      },
      {
        name: 'Basic Plan',
        slug: 'basic',
        description: 'Basic features plan',
        baseSalaryPerStudent: 50,
        currency: 'ETB',
        isActive: true,
        isDefault: false,
      },
      {
        name: 'Professional Plan',
        slug: 'professional',
        description: 'Advanced features plan',
        baseSalaryPerStudent: 100,
        currency: 'ETB',
        isActive: true,
        isDefault: false,
      },
    ];

    for (const plan of plans) {
      const createdPlan = await prisma.pricingPlan.upsert({
        where: { slug: plan.slug },
        update: plan,
        create: plan,
      });

      // Add features to plans
      if (plan.slug === 'trial') {
        const trialFeatures = await prisma.feature.findMany({
          where: { isCore: true },
        });
        for (const feature of trialFeatures) {
          await prisma.planFeature.upsert({
            where: { planId_featureId: { planId: createdPlan.id, featureId: feature.id } },
            update: { price: 0, isEnabled: true },
            create: { planId: createdPlan.id, featureId: feature.id, price: 0, isEnabled: true },
          });
        }
      } else if (plan.slug === 'basic') {
        const allFeatures = await prisma.feature.findMany();
        for (const feature of allFeatures) {
          await prisma.planFeature.upsert({
            where: { planId_featureId: { planId: createdPlan.id, featureId: feature.id } },
            update: { price: feature.isCore ? 0 : 25, isEnabled: feature.isCore },
            create: { planId: createdPlan.id, featureId: feature.id, price: feature.isCore ? 0 : 25, isEnabled: feature.isCore },
          });
        }
      } else if (plan.slug === 'professional') {
        const allFeatures = await prisma.feature.findMany();
        for (const feature of allFeatures) {
          await prisma.planFeature.upsert({
            where: { planId_featureId: { planId: createdPlan.id, featureId: feature.id } },
            update: { price: feature.isCore ? 0 : 50, isEnabled: true },
            create: { planId: createdPlan.id, featureId: feature.id, price: feature.isCore ? 0 : 50, isEnabled: true },
          });
        }
      }
    }

    // Get first school and assign a plan
    const school = await prisma.school.findFirst();
    if (school) {
      const professionalPlan = await prisma.pricingPlan.findUnique({
        where: { slug: 'professional' },
      });

      if (professionalPlan) {
        await prisma.schoolSubscription.upsert({
          where: { schoolId: school.id },
          update: { planId: professionalPlan.id },
          create: { schoolId: school.id, planId: professionalPlan.id },
        });
        console.log(`Assigned Professional plan to school: ${school.name}`);
      }
    }

    console.log('Test data setup complete!');
  } catch (error) {
    console.error('Error setting up test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
