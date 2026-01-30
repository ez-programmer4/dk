const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const defaultTiers = [
  {
    name: "Free",
    slug: "free",
    description: "Basic features for small schools or testing",
    monthlyFee: 0,
    maxStudents: 50,
    currency: "ETB",
    features: ["basic_reports", "teacher_management", "student_management"],
    trialDays: 30,
    isDefault: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    name: "Basic",
    slug: "basic",
    description: "Essential features for growing schools",
    monthlyFee: 500,
    maxStudents: 200,
    currency: "ETB",
    features: ["basic_reports", "teacher_management", "student_management", "attendance_tracking", "basic_analytics"],
    trialDays: 14,
    isDefault: false,
    sortOrder: 2,
    isActive: true,
  },
  {
    name: "Pro",
    slug: "pro",
    description: "Advanced features for established schools",
    monthlyFee: 1500,
    maxStudents: 1000,
    currency: "ETB",
    features: ["basic_reports", "teacher_management", "student_management", "attendance_tracking", "advanced_analytics", "zoom_integration", "parent_portal", "custom_reports"],
    trialDays: 14,
    isDefault: false,
    sortOrder: 3,
    isActive: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Full-featured solution for large institutions",
    monthlyFee: 5000,
    maxStudents: null, // Unlimited
    currency: "ETB",
    features: ["basic_reports", "teacher_management", "student_management", "attendance_tracking", "advanced_analytics", "zoom_integration", "parent_portal", "custom_reports", "api_access", "white_labeling", "priority_support"],
    trialDays: 30,
    isDefault: false,
    sortOrder: 4,
    isActive: true,
  },
];

async function seedPricingTiers() {
  console.log('🌱 Seeding pricing tiers...');

  try {
    for (const tierData of defaultTiers) {
      const existingTier = await prisma.pricingTier.findUnique({
        where: { slug: tierData.slug }
      });

      if (existingTier) {
        console.log(`⚠️  Tier "${tierData.name}" already exists, updating...`);
        await prisma.pricingTier.update({
          where: { slug: tierData.slug },
          data: tierData,
        });
      } else {
        console.log(`✨ Creating tier "${tierData.name}"...`);
        await prisma.pricingTier.create({
          data: tierData,
        });
      }
    }

    console.log('✅ Pricing tiers seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding pricing tiers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Create a default super admin if none exists
async function seedSuperAdmin() {
  console.log('👤 Checking for super admin...');

  try {
    const existingAdmin = await prisma.superAdmin.findFirst();

    if (!existingAdmin) {
      console.log('✨ Creating default super admin...');

      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);

      await prisma.superAdmin.create({
        data: {
          name: 'Platform Administrator',
          username: 'superadmin',
          password: hashedPassword,
          email: 'admin@platform.com',
          role: 'super-admin',
          isActive: true,
        },
      });

      console.log('✅ Super admin created successfully!');
      console.log('   Username: superadmin');
      console.log('   Password: admin123');
    } else {
      console.log('⚠️  Super admin already exists');
    }
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
  }
}

async function main() {
  console.log('🚀 Starting database seeding...\n');

  await seedSuperAdmin();
  console.log('');
  await seedPricingTiers();

  console.log('\n🎉 Database seeding completed!');
}

main().catch((error) => {
  console.error('💥 Seeding failed:', error);
  process.exit(1);
});
