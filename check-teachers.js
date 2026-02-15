const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTeachers() {
  try {
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      take: 5,
      include: {
        school: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
          },
        },
      },
    });

    console.log('Existing teachers:');
    teachers.forEach(t => {
      console.log(`- ${t.ustazid}: ${t.ustazname} (School: ${t.school?.name || 'No school'}, Status: ${t.school?.status || 'No school'})`);
      console.log(`  Password: ${t.password ? t.password.substring(0, 10) + '...' : 'NULL'}`);
    });

    if (teachers.length === 0) {
      console.log('No teachers found in database.');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeachers();
