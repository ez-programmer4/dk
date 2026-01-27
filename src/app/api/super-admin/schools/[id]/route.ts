import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/schools/[id] - Get school details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = params.id;

    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        _count: {
          select: {
            admins: true,
            teachers: true,
            students: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        subscription: {
          include: {
            plan: {
              include: {
                planFeatures: {
                  include: {
                    feature: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      school,
    });
  } catch (error) {
    console.error("Get school details API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/schools/[id] - Update school
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = params.id;
    const body = await req.json();
    const {
      name,
      email,
      phone,
      address,
      status,
      logoUrl,
      primaryColor,
      secondaryColor,
      timezone,
      defaultCurrency,
      defaultLanguage,
      features,
    } = body;

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name,
        email,
        phone,
        address,
        status,
        logoUrl,
        primaryColor,
        secondaryColor,
        timezone,
        defaultCurrency,
        defaultLanguage,
        features,
      },
      include: {
        _count: {
          select: {
            admins: true,
            teachers: true,
            students: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "update_school",
          resourceType: "school",
          resourceId: schoolId,
          details: {
            changes: {
              name: existingSchool.name !== name ? { from: existingSchool.name, to: name } : undefined,
              email: existingSchool.email !== email ? { from: existingSchool.email, to: email } : undefined,
              status: existingSchool.status !== status ? { from: existingSchool.status, to: status } : undefined,
              logoUrl: existingSchool.logoUrl !== logoUrl ? { from: existingSchool.logoUrl, to: logoUrl } : undefined,
              primaryColor: existingSchool.primaryColor !== primaryColor ? { from: existingSchool.primaryColor, to: primaryColor } : undefined,
              secondaryColor: existingSchool.secondaryColor !== secondaryColor ? { from: existingSchool.secondaryColor, to: secondaryColor } : undefined,
            },
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      school: updatedSchool,
      message: "School updated successfully",
    });
  } catch (error) {
    console.error("Update school API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/schools/[id] - Delete school
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = params.id;

    // Check if school exists and get details for audit log
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            admins: true,
          },
        },
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if school has active users (optional safety check)
    const totalUsers = school._count.students + school._count.teachers + school._count.admins;
    if (totalUsers > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete school with active users. Please migrate or remove all users first.",
          userCount: totalUsers
        },
        { status: 400 }
      );
    }

    // Delete school (cascade will handle related records)
    await prisma.school.delete({
      where: { id: schoolId },
    });

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "delete_school",
          resourceType: "school",
          resourceId: schoolId,
          details: {
            schoolName: school.name,
            schoolSlug: school.slug,
            userCount: totalUsers,
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      message: "School deleted successfully",
    });
  } catch (error) {
    console.error("Delete school API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

