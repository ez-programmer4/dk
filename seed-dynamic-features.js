const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedDynamicFeatures() {
  console.log('🌱 Seeding dynamic premium features...');

  const features = [
    {
      code: 'custom_reports',
      name: 'Custom Reports Builder',
      description: 'Create and customize reports with advanced filtering and export options',
      category: 'analytics',
      basePricePerStudent: 50,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 1,
    },
    {
      code: 'bulk_operations',
      name: 'Bulk Student Operations',
      description: 'Perform bulk actions on multiple students (enrollment, updates, messaging)',
      category: 'management',
      basePricePerStudent: 75,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 2,
    },
    {
      code: 'parent_portal',
      name: 'Parent Portal Access',
      description: 'Allow parents to view student progress and communicate with teachers',
      category: 'communication',
      basePricePerStudent: 100,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 3,
    },
    {
      code: 'mobile_notifications',
      name: 'Advanced Mobile Notifications',
      description: 'Custom push notifications and SMS alerts for important events',
      category: 'communication',
      basePricePerStudent: 25,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 4,
    },
    {
      code: 'data_export_api',
      name: 'Data Export API',
      description: 'RESTful API access for exporting student and school data',
      category: 'integration',
      basePricePerStudent: 200,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 5,
    },
    {
      code: 'white_label_branding',
      name: 'White Label Branding',
      description: 'Complete rebranding of the platform with school colors and logos',
      category: 'branding',
      basePricePerStudent: 150,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 6,
    },
    {
      code: 'predictive_analytics',
      name: 'Predictive Analytics',
      description: 'AI-powered insights and predictions for student performance',
      category: 'analytics',
      basePricePerStudent: 300,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 7,
    },
    {
      code: 'multi_language_support',
      name: 'Multi-Language Support',
      description: 'Support for multiple languages in the interface and reports',
      category: 'engagement',
      basePricePerStudent: 80,
      currency: 'ETB',
      isActive: true,
      isRequired: false,
      sortOrder: 8,
    },
  ];

  for (const feature of features) {
    try {
      // Check if feature already exists
      const existing = await prisma.premiumFeature.findUnique({
        where: { code: feature.code }
      });

      if (existing) {
        console.log(`⚠️  Feature "${feature.name}" already exists, skipping...`);
        continue;
      }

      await prisma.premiumFeature.create({
        data: feature
      });

      console.log(`✅ Created feature: ${feature.name}`);
    } catch (error) {
      console.error(`❌ Error creating feature ${feature.name}:`, error);
    }
  }

  console.log('🎉 Dynamic features seeding completed!');
}

seedDynamicFeatures()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });













