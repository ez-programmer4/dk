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

    // Check if salary visibility is enabled
    const visibilitySetting = await prisma.setting.findUnique({
      where: { key: "teacher_salary_visible" },
    });

    if (visibilitySetting?.value !== "true") {
      return NextResponse.json(
        { error: "Salary access is currently disabled by administrator" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const includeDetails = url.searchParams.get("details") === "true";
    const schoolSlug = params.schoolSlug;

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing date range parameters" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    const teacherId = session.id as string;

    // Get school ID for filtering
    let schoolId = null;
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true }
      });
      schoolId = school?.id || null;
    } catch (error) {
      console.error("Error looking up school:", error);
      schoolId = null;
    }

    // Verify teacher belongs to this school
    const teacherCheck = await prisma.wpos_wpdatatable_24.findFirst({
      where: {
        ustazid: teacherId,
        ...(schoolId ? { schoolId } : {}),
      },
    });

    if (!teacherCheck) {
      return NextResponse.json(
        { error: "Teacher not found in this school" },
        { status: 403 }
      );
    }

    // Get salary data with school filtering
    const salaryCalculator = await createSalaryCalculator(
      teacherId,
      fromDate,
      toDate,
      includeDetails,
      schoolId
    );

    const result = await salaryCalculator.calculateSalary();

    return NextResponse.json({
      teacher: {
        id: teacherId,
        name: teacherCheck.ustazname,
      },
      period: {
        from: format(fromDate, "yyyy-MM-dd"),
        to: format(toDate, "yyyy-MM-dd"),
      },
      ...result,
    });
  } catch (error) {
    console.error("Teacher salary API error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
