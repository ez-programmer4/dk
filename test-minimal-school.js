#!/usr/bin/env node

/**
 * Test Minimal School Creation
 */

require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMinimalSchool() {
  console.log('🧪 Testing Minimal School Creation...\n');

  try {
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Generate unique slug
    const timestamp = Date.now();
    const slug = `test-school-${timestamp}`;

    console.log('🏫 Creating school with slug:', slug);

    const school = await prisma.school.create({
      data: {
        name: `Test School ${timestamp}`,
        slug: slug
      }
    });

    console.log('✅ School created successfully:', school.id);
    console.log('📊 School data:', school);

    // Clean up
    await prisma.school.delete({ where: { id: school.id } });
    console.log('🧹 Test school cleaned up');

  } catch (error) {
    console.log('\n❌ Error:', error.message);
    console.log('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testMinimalSchool();



