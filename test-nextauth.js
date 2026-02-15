const NextAuth = require('next-auth');
const { authOptions } = require('./src/lib/auth.ts');

// Mock NextAuth request
const mockReq = {
  body: {
    username: 'cont1',
    password: 'password123',
    role: 'controller'
  }
};

async function testNextAuth() {
  console.log('Testing NextAuth authorize function directly...');

  try {
    const result = await authOptions.providers[0].authorize(mockReq.body);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testNextAuth();
