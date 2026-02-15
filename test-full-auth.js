const { authOptions } = require('./src/lib/auth.ts');

async function testFullAuth() {
  console.log('🧪 Testing full NextAuth authorize function...');

  // Test controller
  console.log('\n--- Testing Controller ---');
  const controllerResult = await authOptions.providers[0].authorize({
    username: 'cont1',
    password: 'password123',
    role: 'controller'
  });
  console.log('Controller result:', controllerResult ? '✅ SUCCESS' : '❌ FAILED');

  // Test registral
  console.log('\n--- Testing Registral ---');
  const registralResult = await authOptions.providers[0].authorize({
    username: 'r1',
    password: 'password123',
    role: 'registral'
  });
  console.log('Registral result:', registralResult ? '✅ SUCCESS' : '❌ FAILED');

  // Test teacher
  console.log('\n--- Testing Teacher ---');
  const teacherResult = await authOptions.providers[0].authorize({
    username: 'U1',
    password: 'password123',
    role: 'teacher'
  });
  console.log('Teacher result:', teacherResult ? '✅ SUCCESS' : '❌ FAILED');

  // Test invalid credentials
  console.log('\n--- Testing Invalid Credentials ---');
  const invalidResult = await authOptions.providers[0].authorize({
    username: 'cont1',
    password: 'wrongpassword',
    role: 'controller'
  });
  console.log('Invalid credentials result:', invalidResult ? '✅ SUCCESS' : '❌ FAILED (expected)');
}

testFullAuth().catch(console.error);
