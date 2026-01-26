const { PrismaClient } = require('@prisma/client');
const { seedPricingData } = require('../src/lib/pricing-seed');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting pricing data seeding...');
  const result = await seedPricingData();
  console.log(result.message);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
