import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || (session.role !== "admin" && session.role !== "controller")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    if (session.role === "admin") {
      const admin = await prisma.admin.findUnique({
        where: { id: session.id as string },
        select: { schoolId: true },
      });
      hasAccess = admin?.schoolId === school.id;
    } else if (session.role === "controller") {
      const controller = await prisma.wpos_wpdatatable_28.findUnique({
        where: { code: session.username },
        select: { schoolId: true },
      });
      hasAccess = controller?.schoolId === school.id;
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    // Get unique packages from students table
    const packages = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        package: { not: null },
        schoolId: school.id,
        status: { in: ["active", "Active"] }
      },
      select: { package: true },
      distinct: ["package"]
    });

    const uniquePackages = packages
      .map(p => p.package)
      .filter(Boolean)
      .sort();

    return NextResponse.json(uniquePackages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch packages" }, { status: 500 });
  }
}
