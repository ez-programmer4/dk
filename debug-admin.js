const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const admin = await prisma.admin.findFirst({
      where: { username: 'admin' },
      include: { school: true }
    });

    if (admin) {
      console.log('Admin found:');
      console.log('- Username:', admin.username);
      console.log('- ID:', admin.id);
      console.log('- School ID:', admin.schoolId);
      console.log('- School:', admin.school ? {
        name: admin.school.name,
        slug: admin.school.slug,
        id: admin.school.id
      } : 'No school assigned');
    } else {
      console.log('Admin not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();












