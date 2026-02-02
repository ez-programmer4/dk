import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
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

    // Validate required fields
    if (!schoolName || !adminName || !adminEmail || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if school already exists
    const existingSchool = await prisma.school.findFirst({
      where: {
        OR: [
          { name: schoolName },
          { adminEmail: adminEmail }
        ]
      }
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: 'School with this name or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create school with admin account
    const newSchool = await prisma.school.create({
      data: {
        name: schoolName,
        address: address,
        city: city,
        country: country,
        adminName: adminName,
        adminEmail: adminEmail,
        adminPhone: adminPhone,
        password: hashedPassword,
        isSelfRegistered: true,
        registrationStatus: 'PENDING',
        registrationData: {
          schoolName,
          adminName,
          adminEmail,
          adminPhone,
          address,
          city,
          country,
          registrationDate: new Date().toISOString(),
          verificationCompleted: true
        }
      }
    });

    // Send welcome email (you would implement this)
    console.log(`Welcome email would be sent to ${adminEmail} for school ${schoolName}`);

    // Don't send password back
    const { password: _, ...schoolResponse } = newSchool;

    return NextResponse.json({
      success: true,
      message: 'School registration successful! Our team will review your application within 24 hours.',
      school: schoolResponse
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
