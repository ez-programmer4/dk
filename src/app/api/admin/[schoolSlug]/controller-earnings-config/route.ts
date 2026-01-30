import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const ConfigSchema = z.object({
  mainBaseRate: z.number().min(0).max(1000),
  referralBaseRate: z.number().min(0).max(1000),
  leavePenaltyMultiplier: z.number().min(0).max(10),
  leaveThreshold: z.number().min(0).max(20),
  unpaidPenaltyMultiplier: z.number().min(0).max(10),
  referralBonusMultiplier: z.number().min(0).max(10),
  targetEarnings: z.number().min(0).max(10000),
  effectiveFrom: z.string().optional(),
});

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  // Get school information
  const school = await prisma.school.findUnique({
    where: { slug: params.schoolSlug },
    select: { id: true, name: true },
  });

  if (!school) {
    return NextResponse.json({ error: "School not found" }, { status: 404 });
  }

  // Get session using getToken
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "No token provided" }, { status: 401 });
  }

  // Allow superAdmins to access any school
  if (token.role === "superAdmin" || token.hasGlobalAccess) {
    // SuperAdmins can access any school, skip school validation
  } else if (token.role !== "admin") {
    return NextResponse.json({ error: "Not an admin" }, { status: 403 });
  } else {
    // Verify regular admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: token.id as string },
      select: { schoolId: true },
    });

    if (!admin) {
      // For development: if no admin record exists, allow access as super admin
      console.log(`Admin ${token.id} not found in database, allowing access for development`);
    } else {
      // If admin has no school assigned yet, allow access for development/setup
      if (!admin.schoolId) {
        console.log(`Admin ${token.id} has no school assigned, allowing access for setup`);
      } else if (admin.schoolId !== school.id) {
        // Find the admin's correct school
        const adminSchool = await prisma.school.findUnique({
          where: { id: admin.schoolId },
          select: { slug: true, name: true }
        });
        return NextResponse.json({
          error: "Unauthorized access to school",
          message: `You don't have access to '${params.schoolSlug}'. Your assigned school is '${adminSchool?.slug || 'unknown'}'`,
          correctSchoolSlug: adminSchool?.slug
        }, { status: 403 });
      }
    }
  }

  try {

    // Get the current active configuration
    const currentConfig = await prisma.controllerearningsconfig.findFirst({
      where: {
        schoolId: school.id,
        isActive: true
      },
      orderBy: { effectiveFrom: "desc" },
    });

    // Get all configurations for history
    const allConfigs = await prisma.controllerearningsconfig.findMany({
      where: { schoolId: school.id },
      orderBy: { effectiveFrom: "desc" },
      include: {
        admin: {
          select: {
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      current: currentConfig,
      history: allConfigs,
    });
  } catch (err) {
    const error = err as Error;
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to fetch earnings config." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get session using getToken
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: token.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json({ error: "Unauthorized access to school" }, { status: 403 });
    }

    const body = await req.json();

    const parseResult = ConfigSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.issues);
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const {
      mainBaseRate,
      referralBaseRate,
      leavePenaltyMultiplier,
      leaveThreshold,
      unpaidPenaltyMultiplier,
      referralBonusMultiplier,
      targetEarnings,
      effectiveFrom,
    } = parseResult.data;

    try {
      // Deactivate all existing configurations for this school
      await prisma.controllerearningsconfig.updateMany({
        where: { isActive: true, schoolId: school.id },
        data: { isActive: false },
      });

      let config;

      // Try Prisma create first
      try {
        config = await prisma.controllerearningsconfig.create({
          data: {
            mainBaseRate,
            referralBaseRate,
            leavePenaltyMultiplier,
            leaveThreshold,
            unpaidPenaltyMultiplier,
            referralBonusMultiplier,
            targetEarnings,
            schoolId: school.id,
            effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
            isActive: true,
            adminId: token.id as string,
            updatedAt: new Date(),
          },
        });
      } catch (createError: any) {
        console.error("Prisma create failed, using raw SQL:", createError);

        const effectiveDate = effectiveFrom ? new Date(effectiveFrom) : new Date();
        const now = new Date();

        await prisma.$executeRaw`
          INSERT INTO controllerearningsconfig
          (mainBaseRate, referralBaseRate, leavePenaltyMultiplier, leaveThreshold,
           unpaidPenaltyMultiplier, referralBonusMultiplier, targetEarnings,
           schoolId, effectiveFrom, isActive, adminId, updatedAt)
          VALUES (${mainBaseRate}, ${referralBaseRate}, ${leavePenaltyMultiplier}, ${leaveThreshold},
                  ${unpaidPenaltyMultiplier}, ${referralBonusMultiplier}, ${targetEarnings},
                  ${school.id}, ${effectiveDate}, 1, ${token.id}, ${now})
        `;

        config = await prisma.controllerearningsconfig.findFirst({
          where: { adminId: token.id, schoolId: school.id, isActive: true },
          orderBy: { id: 'desc' }
        });
      }

      // Log the change (optional, skip if audit table doesn't exist)
      try {
        await prisma.auditlog.create({
          data: {
            actionType: "earnings_config_updated",
            adminId: token.id as string,
            schoolId: school.id,
            details: JSON.stringify({
              mainBaseRate,
              referralBaseRate,
              leavePenaltyMultiplier,
              leaveThreshold,
              unpaidPenaltyMultiplier,
              referralBonusMultiplier,
              targetEarnings,
            }),
          },
        });
      } catch (auditError) {
        console.warn("Failed to create audit log:", auditError);
        // Continue without failing the main operation
      }

      return NextResponse.json(config, { status: 201 });
    } catch (err) {
      const error = err as Error;
      console.error("Failed to create earnings config:", error);
      return NextResponse.json(
        { error: "Failed to create earnings config." },
        { status: 500 }
      );
    }
  } catch (err) {
    const error = err as Error;
    console.error("POST request error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get session using getToken
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: token.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json({ error: "Unauthorized access to school" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Configuration ID is required" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parseResult = ConfigSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const config = await prisma.controllerearningsconfig.update({
      where: { id: parseInt(id), schoolId: school.id },
      data: {
        ...parseResult.data,
        adminId: token.id as string,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(config);
  } catch (err) {
    const error = err as Error;
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update earnings config." },
      { status: 500 }
    );
  }
}
