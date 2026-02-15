const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  try {
    console.log('Testing login for cont1...');

    const user = await prisma.wpos_wpdatatable_28.findFirst({
      where: { username: 'cont1' }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ User found:', user.username, user.name);

    const isValid = await compare('password123', user.password);
    console.log('✅ Password valid:', isValid);

    if (isValid) {
      console.log('🎉 Login should work!');
    } else {
      console.log('❌ Password invalid');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
