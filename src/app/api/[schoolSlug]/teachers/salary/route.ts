import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { format } from "date-fns";
import { createSalaryCalculator } from "@/lib/salary-calculator";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school ID for filtering and settings
    const schoolSlug = params.schoolSlug;
    let schoolId = null;
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true },
      });
      schoolId = school?.id || null;
    } catch (error) {
      console.error("Error looking up school:", error);
      schoolId = null;
    }

    // Check if salary visibility is enabled (default to enabled if not set)
    if (schoolId) {
      const visibilitySetting = await prisma.setting.findUnique({
        where: {
          key_schoolId: {
            key: "teacher_salary_visible",
            schoolId: schoolId,
          },
        },
      });

      // Only block access if explicitly set to "false"
      if (visibilitySetting?.value === "false") {
        return NextResponse.json(
          { error: "Salary access is currently disabled by administrator" },
          { status: 403 }
        );
      }
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const includeDetails = url.searchParams.get("details") === "true";

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing date range parameters" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const teacherId = session.id as string;

    // Verify teacher belongs to the school
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: { schoolId: true },
    });

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher not found in this school" },
        { status: 404 }
      );
    }

    // Calculate teacher's salary directly using the same logic as admin
    return await calculateTeacherSalaryDirect(
      teacherId,
      fromDate,
      toDate,
      includeDetails
    );
  } catch (error: any) {
    console.error("Teacher salary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Enhanced salary calculation using teacher change history
async function calculateTeacherSalaryDirect(
  teacherId: string,
  fromDate: Date,
  toDate: Date,
  includeDetails: boolean
) {
  try {
    // Use the same salary calculator that includes teacher change history
    const calculator = await createSalaryCalculator();

    if (includeDetails) {
      const details = await calculator.getTeacherSalaryDetails(
        teacherId,
        fromDate,
        toDate
      );
      return NextResponse.json(details);
    } else {
      const salary = await calculator.calculateTeacherSalary(
        teacherId,
        fromDate,
        toDate
      );
      return NextResponse.json(salary);
    }
  } catch (error) {
    console.error("Direct calculation error:", error);
    return NextResponse.json(
      { error: "Failed to calculate salary" },
      { status: 500 }
    );
  }
}