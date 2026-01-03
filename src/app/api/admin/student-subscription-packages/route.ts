import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/student-subscription-packages
 * Get students with their subscription package configs
 * Query params:
 *   - studentId: (optional) Get config for a specific student
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");

    const whereClause: any = {};
    if (studentIdParam) {
      whereClause.wdt_ID = parseInt(studentIdParam);
    }
    // Only get students that have a config assigned
    whereClause.subscriptionPackageConfigId = { not: null };

    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: whereClause,
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        classfeeCurrency: true,
        subscriptionPackageConfigId: true,
        subscriptionPackageConfig: {
          include: {
            packages: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                currency: true,
              },
            },
          },
        },
      },
      orderBy: {
        wdt_ID: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      students: students.map((student) => ({
        studentId: student.wdt_ID,
        student: {
          wdt_ID: student.wdt_ID,
          name: student.name,
          phoneno: student.phoneno,
          classfeeCurrency: student.classfeeCurrency,
        },
        config: student.subscriptionPackageConfig
          ? {
              ...student.subscriptionPackageConfig,
              packages: student.subscriptionPackageConfig.packages.map((pkg) => ({
                ...pkg,
                price: Number(pkg.price),
              })),
            }
          : null,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/admin/student-subscription-packages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student subscription package configurations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/student-subscription-packages
 * Assign a config to a student (or update existing)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { studentId, configId } = body;

    if (!studentId || !configId) {
      return NextResponse.json(
        { error: "studentId and configId are required" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parseInt(studentId) },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }

    // Verify config exists and is active
    const config = await prisma.subscription_package_config.findUnique({
      where: { id: parseInt(configId) },
      select: { id: true, isActive: true },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Subscription package config not found" },
        { status: 404 }
      );
    }

    if (!config.isActive) {
      return NextResponse.json(
        { error: "Subscription package config is not active" },
        { status: 400 }
      );
    }

    // Update student with configId
    const updatedStudent = await prisma.wpos_wpdatatable_23.update({
      where: { wdt_ID: parseInt(studentId) },
      data: {
        subscriptionPackageConfigId: parseInt(configId),
      },
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        classfeeCurrency: true,
        subscriptionPackageConfig: {
          include: {
            packages: {
              where: {
                isActive: true,
              },
              select: {
                id: true,
                name: true,
                duration: true,
                price: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      student: {
        studentId: updatedStudent.wdt_ID,
        student: {
          wdt_ID: updatedStudent.wdt_ID,
          name: updatedStudent.name,
          phoneno: updatedStudent.phoneno,
          classfeeCurrency: updatedStudent.classfeeCurrency,
        },
        config: updatedStudent.subscriptionPackageConfig
          ? {
              ...updatedStudent.subscriptionPackageConfig,
              packages: updatedStudent.subscriptionPackageConfig.packages.map((pkg) => ({
                ...pkg,
                price: Number(pkg.price),
              })),
            }
          : null,
      },
      message: "Config assigned to student successfully",
    });
  } catch (error: any) {
    console.error("POST /api/admin/student-subscription-packages error:", error);
    return NextResponse.json(
      { error: "Failed to assign config to student" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/student-subscription-packages
 * Remove config assignment from a student
 * Query params:
 *   - studentId: Student ID
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentIdParam = searchParams.get("studentId");

    if (!studentIdParam) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // Remove config from student
    await prisma.wpos_wpdatatable_23.update({
      where: { wdt_ID: parseInt(studentIdParam) },
      data: {
        subscriptionPackageConfigId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Config removed from student successfully",
    });
  } catch (error: any) {
    console.error("DELETE /api/admin/student-subscription-packages error:", error);
    return NextResponse.json(
      { error: "Failed to remove config from student" },
      { status: 500 }
    );
  }
}
