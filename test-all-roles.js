const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAllRoles() {
  try {
    console.log('🔍 Available users by role:\n');

    // Controllers
    const controllers = await prisma.wpos_wpdatatable_28.findMany({
      select: { username: true, name: true },
      take: 5
    });
    console.log('👮 Controllers:');
    controllers.forEach(c => console.log(`   ${c.username} (${c.name})`));

    // Registrals
    const registrals = await prisma.wpos_wpdatatable_33.findMany({
      select: { username: true, name: true },
      take: 5
    });
    console.log('\n📝 Registrals:');
    registrals.forEach(r => console.log(`   ${r.username} (${r.name})`));

    // Teachers
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      select: { ustazname: true },
      take: 5
    });
    console.log('\n👨‍🏫 Teachers:');
    teachers.forEach(t => console.log(`   ${t.ustazname}`));

    // Admins
    const admins = await prisma.admin.findMany({
      select: { username: true, name: true },
      take: 5
    });
    console.log('\n👔 Admins:');
    admins.forEach(a => console.log(`   ${a.username} (${a.name})`));

    // Super Admins
    const superAdmins = await prisma.superAdmin.findMany({
      select: { username: true, name: true },
      take: 5
    });
    console.log('\n👑 Super Admins:');
    superAdmins.forEach(sa => console.log(`   ${sa.username} (${sa.name})`));

    console.log('\n🎯 Test Credentials:');
    console.log('Controller: cont1 / password123');
    console.log('Registral: r1 / password123');
    console.log('Teacher: ustaz1 / password123');
    console.log('Admin: ezu / password123');
    console.log('Super Admin: super / password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAllRoles();
