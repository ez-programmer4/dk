import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting simplified school registration...');

    const {
      schoolName,
      adminName,
      adminEmail,
      password
    } = await request.json();

    console.log('📥 Received data:', { schoolName, adminName, adminEmail });

    // Generate unique slug
    const baseSlug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingSlug = await prisma.school.findFirst({ where: { slug } });
      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log('🏫 Creating school with slug:', slug);

    // Create school
    const newSchool = await prisma.school.create({
      data: {
        name: schoolName,
        slug: slug
      }
    });

    console.log('✅ School created:', newSchool.id);

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const chatId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newAdmin = await prisma.admin.create({
      data: {
        name: adminName,
        email: adminEmail,
        passcode: hashedPassword,
        role: 'admin',
        schoolId: newSchool.id,
        chat_id: chatId
      }
    });

    console.log('✅ Admin created:', newAdmin.id);

    return NextResponse.json({
      success: true,
      message: 'Registration successful!',
      school: {
        id: newSchool.id,
        name: newSchool.name,
        slug: newSchool.slug
      },
      admin: {
        id: newAdmin.id,
        name: newAdmin.name,
        email: newAdmin.email
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed', details: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}








