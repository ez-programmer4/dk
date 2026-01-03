import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/super-admin/schools/[id]/plan - Change school subscription plan
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
    const { planId, effectiveDate, notes } = body;

    // Validate required fields
    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        planId: true,
        subscriptionTier: true,
        maxStudents: true,
        status: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Check if plan exists and is active
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      select: {
        id: true,
        name: true,
        isActive: true,
        maxStudents: true,
        features: true,
      },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (!plan.isActive) {
      return NextResponse.json({ error: "Plan is not active" }, { status: 400 });
    }

    // Calculate effective date
    const effectiveAt = effectiveDate ? new Date(effectiveDate) : new Date();

    // Update school plan
    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: {
        planId: plan.id,
        subscriptionTier: "premium", // or determine based on plan
        maxStudents: plan.maxStudents || school.maxStudents,
        // Reset trial if changing plans
        trialEndsAt: school.planId ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      include: {
        plan: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            perStudentPrice: true,
            currency: true,
            maxStudents: true,
            features: true,
          },
        },
      },
    });

    // Create plan change record (you might want to add this to your schema)
    try {
      // You could create a plan_change_history table to track changes
      await prisma.$executeRaw`
        INSERT INTO plan_change_history (schoolId, oldPlanId, newPlanId, changedBy, effectiveAt, notes, createdAt)
        VALUES (${schoolId}, ${school.planId}, ${planId}, ${session.user.id}, ${effectiveAt}, ${notes || null}, NOW())
        ON DUPLICATE KEY UPDATE notes = VALUES(notes)
      `;
    } catch (historyError) {
      // Log but don't fail if history recording fails
      console.error("Failed to record plan change history:", historyError);
    }

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "change_school_plan",
          resourceType: "school",
          resourceId: schoolId,
          details: {
            schoolName: school.name,
            oldPlanId: school.planId,
            newPlanId: planId,
            newPlanName: plan.name,
            effectiveDate: effectiveAt.toISOString(),
            notes: notes || null,
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
      message: "School plan updated successfully",
    });
  } catch (error) {
    console.error("Change school plan API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}