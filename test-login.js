const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin(username, password, role) {
  try {
    console.log(`Testing login for ${role}: ${username}`);

    let user = null;

    if (role === "controller") {
      user = await prisma.wpos_wpdatatable_28.findFirst({
        where: { username: username },
      });
      console.log('Controller found:', !!user);
    }

    if (!user) {
      console.log('User not found');
      return false;
    }

    if (!user.password) {
      console.log('No password set');
      return false;
    }

    const isHashed = user.password.startsWith("$2");
    let isValid = false;

    if (isHashed) {
      isValid = await compare(password, user.password);
      console.log('Password comparison result:', isValid);
    } else {
      isValid = password === user.password;
      console.log('Plain text password match:', isValid);
    }

    return isValid;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Test with cont1
testLogin('cont1', 'cont1', 'controller').then(result => {
  console.log('Login result:', result);
});
