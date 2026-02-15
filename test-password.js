const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testPassword() {
  try {
    const user = await prisma.wpos_wpdatatable_28.findFirst({
      where: { username: 'cont1' }
    });

    if (user) {
      const isValid = await compare('password123', user.password);
      console.log('cont1 password test:', isValid);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPassword();
