const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSuperAdminId() {
  try {
    const admin = await prisma.superAdmin.findFirst({
      select: { id: true, username: true }
    });
    console.log('SuperAdmin ID:', admin?.id);
    console.log('SuperAdmin Username:', admin?.username);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getSuperAdminId();








