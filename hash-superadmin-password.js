const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashSuperAdminPasswords() {
  try {
    console.log('Hashing SuperAdmin passwords...');

    const superAdmins = await prisma.superAdmin.findMany();

    for (const admin of superAdmins) {
      // Check if password is already hashed (bcrypt hashes start with $2)
      if (!admin.password.startsWith('$2')) {
        console.log(`Hashing password for ${admin.username}...`);
        const hashedPassword = await bcrypt.hash(admin.password, 12);

        await prisma.superAdmin.update({
          where: { id: admin.id },
          data: { password: hashedPassword }
        });

        console.log(`✓ Password hashed for ${admin.username}`);
      } else {
        console.log(`- Password already hashed for ${admin.username}`);
      }
    }

    console.log('Password hashing complete!');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

hashSuperAdminPasswords();



