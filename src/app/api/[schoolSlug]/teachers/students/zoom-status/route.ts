import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { schoolSlug: string } }
) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teacherId = session.id;
    if (!teacherId) {
      return NextResponse.json(
        { error: "Teacher ID not found" },
        { status: 400 }
      );
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

    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Find zoom links sent today for this teacher's students
    // We need to join through the student table to filter by school
    const zoomLinks = await prisma.wpos_zoom_links.findMany({
      where: {
        ustazid: teacherId,
        sent_time: {
          gte: new Date(todayStr + "T00:00:00.000Z"),
          lt: new Date(todayStr + "T23:59:59.999Z"),
        },
        // Only include zoom links for students in the specified school
        ...(schoolId && {
          wpos_wpdatatable_23: {
            schoolId: schoolId,
          },
        }),
      },
      select: {
        studentid: true,
        sent_time: true,
      },
    });

    const sentToday = zoomLinks.map((link) => link.studentid);

    return NextResponse.json({
      connected: true, // Server-to-server OAuth is always available
      sentToday,
      date: todayStr,
    });
  } catch (error) {
    console.error("Zoom status check error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
