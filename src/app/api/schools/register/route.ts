import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting school registration...');

    const {
      schoolName,
      adminName,
      adminEmail,
      adminPhone,
      password,
      address,
      city,
      country
    } = await request.json();

    console.log('📥 Received data:', { schoolName, adminName, adminEmail, adminPhone, address, city, country });

    // Validate required fields
    if (!schoolName || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if school already exists (by name)
    console.log('🔍 Checking for existing school...');
    let existingSchool;
    try {
      existingSchool = await prisma.school.findFirst({
        where: { name: schoolName }
      });
      console.log('📊 School exists check result:', !!existingSchool);
    } catch (schoolCheckError) {
      console.error('❌ Error checking existing school:', schoolCheckError);
      throw schoolCheckError;
    }

    if (existingSchool) {
      return NextResponse.json(
        { error: 'School with this name already exists' },
        { status: 409 }
      );
    }

    // Check if admin email already exists (any status)
    console.log('🔍 Checking for existing admin...');
    let existingAdmin;
    try {
      existingAdmin = await prisma.admin.findFirst({
        where: { email: adminEmail }
      });
      console.log('📊 Admin exists check result:', !!existingAdmin);

      if (existingAdmin) {
        if (existingAdmin.isActive) {
          return NextResponse.json(
            { error: 'An active admin account already exists with this email address. Please use a different email.' },
            { status: 409 }
          );
        } else {
          return NextResponse.json(
            { error: 'This email was used for a previous registration that was not approved. Please contact support to reactivate your account or use a different email.' },
            { status: 409 }
          );
        }
      }

    } catch (adminCheckError) {
      console.error('❌ Error checking existing admin:', adminCheckError);
      throw adminCheckError;
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate unique slug for school
    const baseSlug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existingSlug = await prisma.school.findFirst({ where: { slug } });
      if (!existingSlug) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    console.log('🏫 Creating school record with slug:', slug);

    // Create school (minimal fields first)
    console.log('🏫 Creating school record...');
    let newSchool;
    try {
      newSchool = await prisma.school.create({
        data: {
          name: schoolName,
          slug: slug,
          email: adminEmail,
          phone: adminPhone,
          address: address,
          isSelfRegistered: true,
          registrationStatus: 'pending_review', // Set to pending review for approval
          registrationData: {
            schoolName,
            adminName,
            adminEmail,
            adminPhone,
            address,
            city,
            country,
            registrationDate: new Date().toISOString(),
            verificationCompleted: true,
            submittedAt: new Date().toISOString()
          }
        }
      });
      console.log('✅ School created:', newSchool.id);
    } catch (schoolCreateError) {
      console.error('❌ Error creating school:', schoolCreateError);
      throw schoolCreateError;
    }

    // Create admin account for the school
    console.log('👤 Creating admin account...');
    let admin;
    try {
      // Generate unique chat_id
      const chatId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      admin = await prisma.admin.create({
        data: {
          name: adminName,
          email: adminEmail,
          phoneno: adminPhone,
          passcode: hashedPassword,
          role: 'admin',
          isActive: false, // Inactive until approved by super admin
          schoolId: newSchool.id,
          chat_id: chatId
        }
      });
      console.log('✅ Admin created:', admin.id);
    } catch (adminError) {
      console.error('❌ Error creating admin:', adminError);
      throw adminError;
    }

    // Send welcome email (you would implement this)
    console.log(`Welcome email would be sent to ${adminEmail} for school ${schoolName}`);

    return NextResponse.json({
      success: true,
      message: 'School registration submitted successfully! Our team will review your application and contact you within 24-48 hours for verification.',
      school: {
        id: newSchool.id,
        name: newSchool.name,
        slug: newSchool.slug,
        registrationStatus: newSchool.registrationStatus,
        submittedAt: new Date().toISOString()
      },
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('School registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

