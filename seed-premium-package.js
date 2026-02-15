const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedPremiumPackage() {
  try {
    console.log('Seeding premium package...');

    // Check if package already exists
    const existing = await prisma.premiumPackage.findFirst({
      where: { name: "All Premium Features Package" }
    });

    if (!existing) {
      await prisma.premiumPackage.create({
        data: {
          name: "All Premium Features Package",
          description: "Complete access to all premium features at a discounted rate",
          packagePricePerStudent: 75, // Discounted from individual total of ~90
          currency: "ETB",
          sortOrder: 1,
        }
      });
      console.log('✅ Created premium package: All Premium Features Package');
    } else {
      console.log('⏭️  Premium package already exists');
    }

    console.log('Premium package seeding completed!');
  } catch (error) {
    console.error('Error seeding premium package:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedPremiumPackage();













