import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: { schoolSlug: string; id: string } }
) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school ID for filtering
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

    const studentId = parseInt(params.id);
    if (isNaN(studentId)) {
      return NextResponse.json({ error: "Invalid student ID" }, { status: 400 });
    }

    // Get monthly payments
    const monthlyPayments = await prisma.months_table.findMany({
      where: {
        studentid: studentId,
        ...(schoolId && { schoolId }),
      },
      orderBy: { start_date: "desc" },
      include: {
        student: {
          select: {
            name: true,
            subject: true,
          },
        },
      },
    });

    // Get deposit payments - handle gracefully if table doesn't exist
    let depositPayments = [];
    try {
      depositPayments = await prisma.deposit.findMany({
        where: {
          student_id: studentId,
          ...(schoolId && { schoolId }),
        },
        orderBy: { date: "desc" },
      include: {
        student: {
          select: {
            name: true,
            subject: true,
          },
        },
      },
    });
    } catch (error) {
      console.warn("Deposit table not available or query failed:", error);
      depositPayments = [];
    }

    return NextResponse.json({
      monthlyPayments,
      depositPayments,
      totalMonthly: monthlyPayments.length,
      totalDeposits: depositPayments.length,
    });
  } catch (error) {
    console.error("Error fetching student payments:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
