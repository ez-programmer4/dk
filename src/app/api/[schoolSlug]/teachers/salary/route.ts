import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SalaryCalculator } from "@/lib/salary-calculator";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json({ error: "Missing date range" }, { status: 400 });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);

    // Get teacher info
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: session.user.username! },
      select: { ustazid: true, ustazname: true },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    // Calculate salary for the date range
    const salaryData = await SalaryCalculator.calculateTeacherSalary(
      teacher.ustazid,
      startDate,
      endDate
    );

    return NextResponse.json({
      totalSalary: salaryData.totalSalary,
      baseSalary: salaryData.baseSalary,
      bonuses: salaryData.bonuses,
      deductions: salaryData.deductions,
      zoomClasses: salaryData.zoomClasses,
    });

  } catch (error) {
    console.error("Error fetching teacher salary:", error);
    return NextResponse.json(
      { error: "Failed to fetch salary data" },
      { status: 500 }
    );
  }
}