import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const session = (await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })) as any;
    const role = session?.role || session?.user?.role;
    if (!session || role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const teacherId = String(session?.user?.id || session?.id || "");
    if (!teacherId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;

    // Get school ID
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

    // Filter students by teacher and school
    const whereClause: any = {
      ustaz: teacherId,
      status: { in: ["active", "not yet", "On progress"] },
      OR: schoolId ? [{ schoolId: schoolId }, { schoolId: null }] : undefined,
    };

    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: whereClause,
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        subject: true,
        package: true,
        daypackages: true,
        occupiedTimes: {
          select: {
            time_slot: true,
            daypackage: true,
          },
        },
        zoom_links: {
          select: { sent_time: true, clicked_at: true },
          orderBy: { sent_time: "desc" },
          take: 1,
        },
      },
      orderBy: [{ daypackages: "asc" }, { name: "asc" }],
    });

    // Transform students to the expected format
    const transformedStudents = students.map((s) => {
      const last = (s.zoom_links && s.zoom_links[0]) || undefined;
      return {
        wdt_ID: s.wdt_ID,
        name: s.name,
        phone: s.phoneno,
        subject: s.subject,
        package: s.package,
        daypackages: s.daypackages,
        occupiedTimes: s.occupiedTimes,
        lastZoomSentAt: last?.sent_time ?? null,
        lastZoomClickedAt: last?.clicked_at ?? null,
      };
    });

    return NextResponse.json({ students: transformedStudents });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
