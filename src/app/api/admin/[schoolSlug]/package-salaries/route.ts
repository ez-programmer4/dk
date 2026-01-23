import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Verify admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: session.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }
  try {
    // Get all student packages
    const studentPackages = await prisma.studentPackage.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    // Get all configured package salaries
    const packageSalaries = await prisma.packageSalary.findMany();

    // Create a map of configured salaries for quick lookup
    const salaryMap = new Map(
      packageSalaries.map((salary) => [salary.packageName, salary])
    );

    // Combine student packages with their salary configurations
    const packagesWithSalaries = await Promise.all(
      studentPackages.map(async (studentPackage) => {
        const salaryConfig = salaryMap.get(studentPackage.name);

        // Count active students using this package
        const activeStudentCount = await prisma.wpos_wpdatatable_23.count({
          where: {
            package: studentPackage.name,
            status: {
              in: ["Active", "Not yet"],
            },
          },
        });

        return {
          id: studentPackage.id,
          packageName: studentPackage.name,
          isActive: studentPackage.isActive,
          createdAt: studentPackage.createdAt,
          updatedAt: studentPackage.updatedAt,
          activeStudentCount,
          salaryConfigured: !!salaryConfig,
          salaryPerStudent: salaryConfig?.salaryPerStudent || 0,
          salaryId: salaryConfig?.id || null,
          salaryCreatedAt: salaryConfig?.createdAt || null,
          salaryUpdatedAt: salaryConfig?.updatedAt || null,
        };
      })
    );

    return NextResponse.json(packagesWithSalaries);
  } catch (error) {
    console.error("Error fetching packages:", error);
    return NextResponse.json(
      { error: "Failed to fetch packages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (
      !session ||
      (session.role !== "admin" && session.role !== "controller")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { packageName, salaryPerStudent } = await req.json();

    if (!packageName || salaryPerStudent === undefined) {
      return NextResponse.json(
        { error: "Package name and salary are required" },
        { status: 400 }
      );
    }

    if (salaryPerStudent <= 0) {
      return NextResponse.json(
        { error: "Salary per student must be greater than 0" },
        { status: 400 }
      );
    }

    // Check if package already exists
    const existingPackage = await prisma.packageSalary.findUnique({
      where: { packageName },
    });

    if (existingPackage) {
      return NextResponse.json(
        { error: "Package salary already exists" },
        { status: 409 }
      );
    }

    const packageSalary = await prisma.packageSalary.create({
      data: {
        packageName,
        salaryPerStudent: Number(salaryPerStudent),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(packageSalary, { status: 201 });
  } catch (error: any) {
    console.error("Error creating package salary:", error);
    return NextResponse.json(
      {
        error: "Failed to save package salary",
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
