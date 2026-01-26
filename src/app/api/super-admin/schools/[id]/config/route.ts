import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/super-admin/schools/[id]/config - Update school configuration
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify that the SuperAdmin exists in the database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
    }

    const schoolId = params.id;
    const body = await req.json();

    // Check if school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};

    // Handle individual field updates
    if (body.timezone !== undefined) updateData.timezone = body.timezone;
    if (body.defaultCurrency !== undefined) updateData.defaultCurrency = body.defaultCurrency;
    if (body.defaultLanguage !== undefined) updateData.defaultLanguage = body.defaultLanguage;
    if (body.logoUrl !== undefined) updateData.logoUrl = body.logoUrl;
    if (body.primaryColor !== undefined) updateData.primaryColor = body.primaryColor;
    if (body.secondaryColor !== undefined) updateData.secondaryColor = body.secondaryColor;
    if (body.features !== undefined) updateData.features = body.features;

    // Update school configuration
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: updateData,
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
          action: "update_school_config",
          resourceType: "school",
          resourceId: schoolId,
          details: {
            changes: Object.keys(updateData).reduce((acc, key) => {
              acc[key] = {
                from: existingSchool[key as keyof typeof existingSchool],
                to: updateData[key],
              };
              return acc;
            }, {} as any),
            schoolName: existingSchool.name,
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
      message: "School configuration updated successfully",
    });
  } catch (error) {
    console.error("Update school config API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

