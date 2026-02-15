const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserSchools() {
  try {
    console.log('Checking user school associations...\n');

    // Check controllers
    const controllers = await prisma.wpos_wpdatatable_28.findMany({
      include: { school: true },
      take: 3
    });

    console.log('Controllers:');
    controllers.forEach(c => {
      console.log(`- ${c.username}: schoolId=${c.schoolId}, school=${c.school ? c.school.name : 'NONE'}`);
    });

    // Check registrals
    const registrals = await prisma.wpos_wpdatatable_33.findMany({
      include: { school: true },
      take: 3
    });

    console.log('\nRegistrals:');
    registrals.forEach(r => {
      console.log(`- ${r.username}: schoolId=${r.schoolId}, school=${r.school ? r.school.name : 'NONE'}`);
    });

    // Check teachers
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      include: { school: true },
      take: 3
    });

    console.log('\nTeachers:');
    teachers.forEach(t => {
      console.log(`- ${t.ustazname}: schoolId=${t.schoolId}, school=${t.school ? t.school.name : 'NONE'}`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSchools();
