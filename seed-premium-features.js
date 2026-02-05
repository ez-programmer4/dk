const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PREMIUM_FEATURES = [
  {
    code: "teacher_payment",
    name: "Teacher Payment System",
    description: "Complete salary management and payment processing for teachers",
    category: "payment",
    basePricePerStudent: 25,
  },
  {
    code: "student_mini_app",
    name: "Student Mini App",
    description: "Mobile app access for students with personalized dashboard",
    category: "engagement",
    basePricePerStudent: 15,
  },
  {
    code: "student_analytics",
    name: "Student Analytics Dashboard",
    description: "Advanced analytics and insights for student performance",
    category: "analytics",
    basePricePerStudent: 20,
  },
  {
    code: "lateness_management",
    name: "Lateness Management System",
    description: "Automated tracking and management of student lateness",
    category: "management",
    basePricePerStudent: 10,
  },
  {
    code: "quality_review",
    name: "Quality Review System",
    description: "Teacher performance evaluation and quality assurance",
    category: "assessment",
    basePricePerStudent: 18,
  },
];

async function seedPremiumFeatures() {
  try {
    console.log('Seeding premium features...');

    for (let i = 0; i < PREMIUM_FEATURES.length; i++) {
      const feature = PREMIUM_FEATURES[i];

      // Check if feature already exists
      const existing = await prisma.premiumFeature.findUnique({
        where: { code: feature.code }
      });

      if (!existing) {
        await prisma.premiumFeature.create({
          data: {
            ...feature,
            sortOrder: i,
            currency: "ETB",
          }
        });
        console.log(`✅ Created feature: ${feature.name}`);
      } else {
        console.log(`⏭️  Feature already exists: ${feature.name}`);
      }
    }

    console.log('Premium features seeding completed!');
  } catch (error) {
    console.error('Error seeding premium features:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPremiumFeatures();




