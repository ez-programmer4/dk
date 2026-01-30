import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const { schoolId } = params;

    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch detailed school information
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        primaryColor: true,
        secondaryColor: true,
        status: true,
        statusReason: true,
        statusChangedAt: true,
        statusChangedById: true,
        timezone: true,
        defaultCurrency: true,
        defaultLanguage: true,
        createdAt: true,
        logoUrl: true,
        telegramBotToken: true,
        features: true,
        _count: {
          select: {
            students: true,
            teachers: true,
            admins: true,
          },
        },
        pricingTier: {
          select: {
            id: true,
            name: true,
            monthlyFee: true,
            currency: true,
            features: true,
          },
        },
        subscription: {
          select: {
            status: true,
            currentStudents: true,
            trialEndsAt: true,
            subscribedAt: true,
            nextBillingDate: true,
          },
        },
        admins: {
          select: {
            id: true,
            name: true,
            username: true,
            passcode: false, // Don't expose passwords
            phoneno: true,
            role: true,
            createdAt: true,
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
    console.error("School details fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { schoolId: string } }
) {
  try {
    const { schoolId } = params;
    const updateData = await req.json();

    // Get super admin from token
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify school exists
    const existingSchool = await prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, name: true },
    });

    if (!existingSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Update school
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        name: updateData.name,
        email: updateData.email,
        phone: updateData.phone,
        address: updateData.address,
        primaryColor: updateData.primaryColor,
        secondaryColor: updateData.secondaryColor,
        timezone: updateData.timezone,
        defaultCurrency: updateData.defaultCurrency,
        defaultLanguage: updateData.defaultLanguage,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        primaryColor: true,
        secondaryColor: true,
        status: true,
        timezone: true,
        defaultCurrency: true,
        defaultLanguage: true,
        updatedAt: true,
      },
    });

    // Log audit action
    const superAdminId = "78er9w"; // Hardcoded for now, should come from JWT
    await prisma.superAdminAuditLog.create({
      data: {
        superAdminId,
        action: "UPDATE_SCHOOL",
        resourceType: "school",
        resourceId: schoolId,
        details: {
          schoolName: existingSchool.name,
          changes: updateData,
        },
      },
    });

    return NextResponse.json({
      success: true,
      school: updatedSchool,
      message: "School updated successfully",
    });

  } catch (error) {
    console.error("School update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
