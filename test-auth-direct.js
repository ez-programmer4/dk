const { PrismaClient } = require('@prisma/client');
const { compare } = require('bcryptjs');

const prisma = new PrismaClient();

async function testAuth(username, password, role) {
  console.log(`\n🧪 Testing authentication for ${role}: ${username}`);

  try {
    let user = null;

    if (role === "controller") {
      user = await prisma.wpos_wpdatatable_28.findFirst({
        where: { username: username },
      });
    }

    if (!user) {
      console.log('❌ User not found');
      return null;
    }

    console.log('✅ User found:', user.username);

    if (!user.password) {
      console.log('❌ No password set');
      return null;
    }

    console.log('🔑 Password exists, checking...');

    const isHashed = user.password.startsWith("$2");
    let isValid = false;

    if (isHashed) {
      isValid = await compare(password, user.password);
    } else {
      isValid = password === user.password;
    }

    console.log(`🔐 Password valid: ${isValid}`);

    if (isValid) {
      console.log('✅ Authentication successful!');
      return {
        id: user.wdt_ID.toString(),
        name: user.name ?? "",
        username: user.username ?? "",
        role,
        code: user.code || "",
      };
    } else {
      console.log('❌ Authentication failed - invalid password');
      return null;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing Direct Authentication Logic');

  const result1 = await testAuth('cont1', 'password123', 'controller');
  const result2 = await testAuth('cont1', 'wrongpassword', 'controller');
  const result3 = await testAuth('nonexistent', 'password123', 'controller');

  console.log('\n📊 Test Results:');
  console.log('cont1/password123/controller:', result1 ? '✅ PASS' : '❌ FAIL');
  console.log('cont1/wrongpassword/controller:', result2 ? '✅ PASS' : '❌ FAIL');
  console.log('nonexistent/password123/controller:', result3 ? '✅ PASS' : '❌ FAIL');

  await prisma.$disconnect();
}

runTests();
