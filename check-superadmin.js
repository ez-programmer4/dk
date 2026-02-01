const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('Checking for SuperAdmin users...');

    const superAdmins = await prisma.superAdmin.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    console.log('Found SuperAdmins:', superAdmins.length);
    superAdmins.forEach(admin => {
      console.log(`- ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}, Active: ${admin.isActive}`);
    });

    if (superAdmins.length === 0) {
      console.log('\nNo SuperAdmin users found. Creating a default SuperAdmin...');

      // Create a default SuperAdmin
      const defaultAdmin = await prisma.superAdmin.create({
        data: {
          name: 'Super Administrator',
          username: 'superadmin',
          email: 'admin@darulkubra.com',
          password: 'admin123', // Plain text for now, will be hashed on login
          role: 'super-admin',
          isActive: true
        }
      });

      console.log('Created default SuperAdmin:', defaultAdmin);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin();







