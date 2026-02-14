#!/usr/bin/env node

/**
 * Test Database Connection
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing Database Connection...\n');

  try {
    // Test connection
    console.log('🔌 Testing connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // Test simple query
    console.log('📊 Testing query...');
    const schoolCount = await prisma.school.count();
    console.log(`✅ Found ${schoolCount} schools in database`);

    // Test admin count
    const adminCount = await prisma.admin.count();
    console.log(`✅ Found ${adminCount} admins in database`);

    console.log('\n🎉 Database test completed successfully!');

  } catch (error) {
    console.log('\n❌ Database error:', error.message);
    console.log('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDatabase();








