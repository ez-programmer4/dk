const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmins() {
  try {
    const admins = await prisma.admin.findMany({
      include: { school: true },
      take: 5
    });

    console.log('Existing admins:');
    admins.forEach(admin => {
      console.log(`- ${admin.username}: ${admin.name} (ID: ${admin.id})`);
      console.log(`  School: ${admin.school ? admin.school.name + ' (' + admin.school.slug + ')' : 'No school assigned'}`);
    });

    if (admins.length === 0) {
      console.log('No admins found in database.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmins();







