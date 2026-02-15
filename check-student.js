const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkStudent() {
  try {
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: 5 },
      select: {
        wdt_ID: true,
        name: true,
        schoolId: true
      }
    });

    console.log('Student 5:', student);

    // Also check what registral users exist and their schools
    const registrals = await prisma.wpos_wpdatatable_33.findMany({
      take: 5,
      include: {
        school: {
          select: {
            id: true,
            slug: true,
            name: true
          }
        }
      }
    });

    console.log('\nRegistrals:');
    registrals.forEach(r => {
      console.log(`- ${r.username}: School ${r.school?.slug || 'darulkubra'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudent();
