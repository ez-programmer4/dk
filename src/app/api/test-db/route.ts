import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🧪 Testing database operations...');

    // Test school count
    const schoolCount = await prisma.school.count();
    console.log(`✅ Schools in DB: ${schoolCount}`);

    // Test admin count
    const adminCount = await prisma.admin.count();
    console.log(`✅ Admins in DB: ${adminCount}`);

    // Test school creation (minimal)
    console.log('🏫 Testing school creation...');
    const testSchool = await prisma.school.create({
      data: {
        name: `Test School ${Date.now()}`,
        email: `test${Date.now()}@example.com`,
        isSelfRegistered: true,
        registrationStatus: 'pending'
      }
    });
    console.log(`✅ Created test school: ${testSchool.id}`);

    // Test admin creation (minimal)
    console.log('👤 Testing admin creation...');
    const testAdmin = await prisma.admin.create({
      data: {
        name: `Test Admin ${Date.now()}`,
        email: `admin${Date.now()}@example.com`,
        passcode: 'testpass123',
        role: 'admin',
        schoolId: testSchool.id,
        chat_id: `test_chat_${Date.now()}`
      }
    });
    console.log(`✅ Created test admin: ${testAdmin.id}`);

    // Clean up test records
    await prisma.admin.delete({ where: { id: testAdmin.id } });
    await prisma.school.delete({ where: { id: testSchool.id } });
    console.log('🧹 Cleaned up test records');

    return NextResponse.json({
      success: true,
      message: 'Database operations test successful',
      data: {
        schoolCount,
        adminCount,
        testSchoolId: testSchool.id,
        testAdminId: testAdmin.id
      }
    });

  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}









