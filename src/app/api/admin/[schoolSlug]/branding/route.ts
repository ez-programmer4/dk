
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user has access to this school
    if (session.schoolSlug !== params.schoolSlug) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    // Fetch school branding information
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({
      name: school.name,
      logoUrl: school.logoUrl,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor,
      theme: 'light', // Default theme since School model doesn't have defaultTheme field
    });
  } catch (error) {
    console.error("Admin branding API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}