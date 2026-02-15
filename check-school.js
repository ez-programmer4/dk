const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchool() {
  try {
    const school = await prisma.school.findUnique({
      where: { slug: 'zubeyr-ibnu-awam' },
      select: { id: true, slug: true, name: true }
    });

    console.log('School zubeyr-ibnu-awam:', school);

    // Check what the registral's session contains
    console.log('\nRegistral school mapping check:');
    console.log('Student schoolId:', 'cmldne7w60002sk77cit564lb');
    console.log('Expected schoolId for registral:', school?.id);

    if (school?.id === 'cmldne7w60002sk77cit564lb') {
      console.log('✅ School IDs match');
    } else {
      console.log('❌ School IDs do not match');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchool();
