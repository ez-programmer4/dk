const { PrismaClient } = require('@prisma/client');

async function checkEzedinTeachers() {
  const prisma = new PrismaClient();

  try {
    console.log('=== CHECKING EZEDIN SCHOOL TEACHERS ===\n');

    // Find ezedin school
    const ezedinSchool = await prisma.school.findUnique({
      where: { slug: 'ezedin' },
      select: { id: true, name: true, slug: true }
    });

    if (!ezedinSchool) {
      console.log('❌ Ezedin school not found!');
      return;
    }

    console.log('✅ Ezedin school found:', ezedinSchool);

    // Get all teachers for ezedin school
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      where: { schoolId: ezedinSchool.id },
      select: {
        ustazid: true,
        ustazname: true,
        password: true,
        phone: true
      }
    });

    console.log(`\n=== TEACHERS FOR EZEDIN SCHOOL (${teachers.length} found) ===`);
    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. TEACHER DETAILS:`);
      console.log(`   - Teacher ID: ${teacher.ustazid}`);
      console.log(`   - Name: ${teacher.ustazname || 'N/A'}`);
      console.log(`   - Phone: ${teacher.phone || 'N/A'}`);
      console.log(`   - Has Password: ${!!teacher.password}`);
      console.log('');
    });

    console.log('🎯 LOGIN INSTRUCTIONS:');
    console.log('URL: http://localhost:3001/ezedin/teachers/login');
    console.log('');
    console.log('Use any of the Teacher IDs above with their corresponding passwords.');
    console.log('Note: Passwords may be encrypted (bcrypt) or plain text.');

    console.log('\n=== EXAMPLE LOGIN ===');
    if (teachers.length > 0) {
      console.log('Teacher ID: ' + teachers[0].ustazid);
      console.log('Password: [Check the database or ask admin]');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkEzedinTeachers();
