const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkControllers() {
  try {
    const controllers = await prisma.wpos_wpdatatable_28.findMany({
      take: 5
    });

    console.log('Existing controllers:');
    controllers.forEach(c => {
      console.log(`- ${c.username}: ${c.name} (ID: ${c.wdt_ID})`);
      console.log(`  Password starts with: ${c.password.substring(0, 10)}...`);
      console.log(`  Code: ${c.code}`);
    });

    if (controllers.length === 0) {
      console.log('No controllers found in database.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkControllers();
