import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPricingData() {
  try {
    console.log('🌱 Seeding pricing data...');

    // Create features
    const features = [
      {
        name: "Teacher Payment Management",
        code: "teacher_payment",
        description: "Advanced teacher salary and payment tracking system",
        isCore: false,
      },
      {
        name: "Zoom Integration",
        code: "zoom_integration",
        description: "Integrated video conferencing for classes",
        isCore: false,
      },
      {
        name: "Advanced Analytics",
        code: "advanced_analytics",
        description: "Detailed reporting and analytics dashboard",
        isCore: false,
      },
      {
        name: "Custom Branding",
        code: "custom_branding",
        description: "Customizable school branding and themes",
        isCore: false,
      },
      {
        name: "API Access",
        code: "api_access",
        description: "REST API access for integrations",
        isCore: false,
      },
      {
        name: "Mobile App",
        code: "mobile_app",
        description: "Dedicated mobile application",
        isCore: false,
      },
      {
        name: "Multi-language Support",
        code: "multi_language",
        description: "Support for multiple languages",
        isCore: false,
      },
      {
        name: "Student Portal",
        code: "student_portal",
        description: "Dedicated portal for students and parents",
        isCore: true,
      },
      {
        name: "Basic Reporting",
        code: "basic_reporting",
        description: "Standard reports and attendance tracking",
        isCore: true,
      },
    ];

    console.log('Creating features...');
    for (const feature of features) {
      await prisma.feature.upsert({
        where: { code: feature.code },
        update: feature,
        create: feature,
      });
    }

    // Get all features
    const allFeatures = await prisma.feature.findMany();

    // Create pricing plans
    const plans = [
      {
        name: "Basic Plan",
        description: "Essential features for small schools",
        slug: "basic",
        baseSalaryPerStudent: 25.00,
        currency: "ETB",
        isDefault: true,
        features: [
          { code: "student_portal", price: 0 },
          { code: "basic_reporting", price: 0 },
          { code: "zoom_integration", price: 15.00 },
        ],
      },
      {
        name: "Professional Plan",
        description: "Advanced features for growing schools",
        slug: "professional",
        baseSalaryPerStudent: 35.00,
        currency: "ETB",
        isDefault: false,
        features: [
          { code: "student_portal", price: 0 },
          { code: "basic_reporting", price: 0 },
          { code: "zoom_integration", price: 0 },
          { code: "teacher_payment", price: 25.00 },
          { code: "advanced_analytics", price: 20.00 },
          { code: "custom_branding", price: 15.00 },
        ],
      },
      {
        name: "Enterprise Plan",
        description: "Complete solution for large institutions",
        slug: "enterprise",
        baseSalaryPerStudent: 50.00,
        currency: "ETB",
        isDefault: false,
        features: [
          { code: "student_portal", price: 0 },
          { code: "basic_reporting", price: 0 },
          { code: "zoom_integration", price: 0 },
          { code: "teacher_payment", price: 0 },
          { code: "advanced_analytics", price: 0 },
          { code: "custom_branding", price: 0 },
          { code: "api_access", price: 0 },
          { code: "mobile_app", price: 45.00 },
          { code: "multi_language", price: 30.00 },
        ],
      },
    ];

    // Get super admin for createdById
    const superAdmin = await prisma.superAdmin.findFirst();

    console.log('Creating pricing plans...');
    for (const plan of plans) {
      const { features: planFeatures, ...planData } = plan;

      const createdPlan = await prisma.pricingPlan.upsert({
        where: { slug: plan.slug },
        update: {
          ...planData,
          createdById: superAdmin?.id,
        },
        create: {
          ...planData,
          createdById: superAdmin?.id,
        },
      });

      // Create plan features
      for (const feature of planFeatures) {
        const featureData = allFeatures.find(f => f.code === feature.code);
        if (featureData) {
          await prisma.planFeature.upsert({
            where: {
              planId_featureId: {
                planId: createdPlan.id,
                featureId: featureData.id,
              },
            },
            update: {
              price: feature.price,
              isEnabled: feature.price >= 0,
            },
            create: {
              planId: createdPlan.id,
              featureId: featureData.id,
              price: feature.price,
              isEnabled: feature.price >= 0,
            },
          });
        }
      }
    }

    console.log('✅ Pricing data seeded successfully!');
    console.log('\n📋 Created Plans:');
    console.log('- Basic Plan: 25 ETB/student + premium features');
    console.log('- Professional Plan: 35 ETB/student + more included features');
    console.log('- Enterprise Plan: 50 ETB/student + all features included');

    console.log('\n🔧 Available Features:');
    features.forEach(f => {
      console.log(`- ${f.name} (${f.isCore ? 'Core' : 'Premium'})`);
    });

  } catch (error) {
    console.error('❌ Error seeding pricing data:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedPricingData();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
