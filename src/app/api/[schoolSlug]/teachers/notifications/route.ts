import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user as { id: string; role: string }).role !== "teacher"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user as { id: string; role: string };

    // Get school ID for validation
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

    // Verify teacher belongs to the school
    const teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: user.id },
      select: { schoolId: true },
    });

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher not found in this school" },
        { status: 404 }
      );
    }

    const url = new URL(req.url);
    const unread = url.searchParams.get("unread");
    // Always include userId, add read filter if needed
    const where: any = { userId: user.id, userRole: "teacher" };
    if (unread === "1") {
      where.isRead = false;
    }
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Teacher notifications API error:", error);
    // Return empty array if table doesn't exist
    return NextResponse.json([]);
  }
}

