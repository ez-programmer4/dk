const { PrismaClient } = require('@prisma/client');

async function checkFields() {
  const prisma = new PrismaClient();

  try {
    console.log('SubscriptionPlan fields:');
    console.log(Object.keys(prisma.subscriptionPlan.fields));
    console.log('pricingTiers exists:', 'pricingTiers' in prisma.subscriptionPlan.fields);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFields();
