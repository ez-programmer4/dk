#!/usr/bin/env node

/**
 * Test Database Operations Directly
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testOperations() {
  console.log('🧪 Testing Database Operations Directly...\n');

  try {
    // Test connection
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    console.log('✅ Connected successfully');

    // Test counts
    const schoolCount = await prisma.school.count();
    const adminCount = await prisma.admin.count();
    console.log(`📊 Found ${schoolCount} schools, ${adminCount} admins`);

    // Test school creation
    console.log('🏫 Creating test school...');
    const testSchool = await prisma.school.create({
      data: {
        name: `Test School ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        isSelfRegistered: true,
        registrationStatus: 'pending'
      }
    });
    console.log(`✅ School created: ${testSchool.id}`);

    // Test password hashing
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash('testpass123', 12);
    console.log('✅ Password hashed');

    // Test admin creation
    console.log('👤 Creating test admin...');
    const testAdmin = await prisma.admin.create({
      data: {
        name: `Test Admin ${Date.now()}`,
        email: `admin${Date.now()}@example.com`,
        phoneno: '+1234567890',
        passcode: hashedPassword,
        role: 'admin',
        schoolId: testSchool.id,
        chat_id: `test_chat_${Date.now()}`
      }
    });
    console.log(`✅ Admin created: ${testAdmin.id}`);

    // Clean up
    console.log('🧹 Cleaning up...');
    await prisma.admin.delete({ where: { id: testAdmin.id } });
    await prisma.school.delete({ where: { id: testSchool.id } });
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All database operations successful!');

  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOperations();








