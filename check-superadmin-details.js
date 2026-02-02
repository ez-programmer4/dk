const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuperAdminDetails() {
  try {
    console.log('Checking SuperAdmin details...');

    const superAdmins = await prisma.superAdmin.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        password: true,
        isActive: true
      }
    });

    console.log('SuperAdmin details:');
    superAdmins.forEach(admin => {
      console.log(`- ID: ${admin.id}`);
      console.log(`  Username: ${admin.username}`);
      console.log(`  Password: ${admin.password}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Email: ${admin.email}`);
      console.log(`  Active: ${admin.isActive}`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdminDetails();



