import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { daypackageIncludesDay } from "@/lib/daypackage-utils";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })) as any;
    const role = session?.role || session?.user?.role;
    if (!session || role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const teacherId = String(session?.user?.id || session?.id || "");
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    const dayIndex = today.getDay();

    const records = await prisma.wpos_ustaz_occupied_times.findMany({
      where: { ustaz_id: teacherId },
      select: {
        time_slot: true,
        daypackage: true,
        student_id: true,
        student: {
          select: {
            wdt_ID: true,
            name: true,
            daypackages: true,
            subject: true,
          },
        },
      },
    });

    const classes = records
      .filter((r) => daypackageIncludesDay(r.daypackage, dayIndex, true))
      .map((r) => ({
        time: r.time_slot,
        daypackage: r.daypackage,
        studentId: r.student_id,
        studentName: r.student?.name || "-",
        subject: r.student?.subject || "-",
      }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return NextResponse.json({ date: today.toISOString(), classes });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
