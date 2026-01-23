import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow admin roles to access this endpoint
    if (!["admin", "registral"].includes(token.role as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Verify user has access to this school
    let hasAccess = false;
    if (token.role === "admin") {
      const admin = await prisma.admin.findUnique({
        where: { id: token.id as string },
        select: { schoolId: true },
      });
      hasAccess = admin?.schoolId === school.id;
    } else if (token.role === "registral") {
      const registral = await prisma.wpos_wpdatatable_33.findUnique({
        where: { username: token.username },
        select: { schoolId: true },
      });
      hasAccess = registral?.schoolId === school.id;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const onProgressStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        status: "On Progress",
        schoolId: school.id,
      },
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        country: true,
        registrationdate: true,
        rigistral: true,
        isTrained: true,
        package: true,
        subject: true,
        daypackages: true,
      },
      orderBy: {
        registrationdate: "desc",
      },
    });

    return NextResponse.json(onProgressStudents);
  } catch (error) {
    console.error("Error fetching on progress students:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
