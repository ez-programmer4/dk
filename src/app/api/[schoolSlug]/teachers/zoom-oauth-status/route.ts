import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Check if teacher has connected their Zoom account via OAuth
 */
export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token || token.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      where: { ustazid: token.id },
      select: { schoolId: true },
    });

    if (!teacher || teacher.schoolId !== schoolId) {
      return NextResponse.json(
        { error: "Teacher not found in this school" },
        { status: 404 }
      );
    }

    const teacherId = token.id as string;

    // Check if teacher has OAuth tokens in wpos_wpdatatable_24 (teacher table)
    const teacherInfo = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: {
        zoom_access_token: true,
        zoom_refresh_token: true,
      },
    });

    const isConnected = !!(
      teacherInfo?.zoom_access_token && teacherInfo?.zoom_refresh_token
    );

    return NextResponse.json({
      isConnected,
      message: isConnected
        ? "Zoom account connected"
        : "Zoom account not connected. Please connect your Zoom account to use auto-create features.",
    });
  } catch (error) {
    console.error("Error checking Zoom OAuth status:", error);
    return NextResponse.json(
      { error: "Failed to check Zoom status" },
      { status: 500 }
    );
  }
}








