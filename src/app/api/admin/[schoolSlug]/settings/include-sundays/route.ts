import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const setting = await prisma.setting.findFirst({
      where: { key: "include_sundays_in_salary", schoolId: school.id },
    });

    return NextResponse.json({
      includeSundays: setting?.value === "true",
    });
  } catch (error: any) {
    console.error("Error fetching Sunday setting:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    const { includeSundays } = await req.json();

    if (typeof includeSundays !== "boolean") {
      return NextResponse.json(
        { error: "includeSundays must be a boolean" },
        { status: 400 }
      );
    }

    await prisma.setting.upsert({
      where: {
        key_schoolId: {
          key: "include_sundays_in_salary",
          schoolId: school.id,
        }
      },
      update: { value: includeSundays.toString() },
      create: {
        key: "include_sundays_in_salary",
        schoolId: school.id,
        value: includeSundays.toString(),
        updatedAt: new Date(),
      },
    });

    // Clear salary calculator cache since this affects calculations
    try {
      const { createSalaryCalculator } = await import(
        "@/lib/salary-calculator"
      );
      const calculator = await createSalaryCalculator();
      calculator.clearCache();
    } catch (error) {
      console.warn("âڑ ï¸ڈ Failed to clear salary calculator cache:", error);
    }

    // Clear teacher payments API calculator cache
    try {
      const { clearCalculatorCache } = await import("@/lib/calculator-cache");
      clearCalculatorCache();
    } catch (error) {
      console.warn(
        "âڑ ï¸ڈ Failed to clear teacher payments calculator cache:",
        error
      );
    }

    return NextResponse.json({
      success: true,
      includeSundays,
    });
  } catch (error: any) {
    console.error("Error updating Sunday setting:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
