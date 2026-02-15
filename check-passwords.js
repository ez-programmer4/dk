const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkPasswords() {
  try {
    const controllers = await prisma.wpos_wpdatatable_28.findMany();

    console.log('Controller passwords:');
    controllers.forEach(c => {
      const isHashed = c.password.startsWith('$2');
      console.log(`${c.username}: ${isHashed ? 'HASHED' : 'PLAIN: ' + c.password}`);
    });

    // Check admins too
    const admins = await prisma.admin.findMany({ take: 3 });
    console.log('\nAdmin passwords:');
    admins.forEach(a => {
      const isHashed = a.password.startsWith('$2');
      console.log(`${a.username}: ${isHashed ? 'HASHED' : 'PLAIN: ' + a.password}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPasswords();
