import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "controller") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }

    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    // Get teachers assigned to this controller for the specific school
    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      select: {
        ustazid: true,
        ustazname: true,
        phone: true,
        schedule: true,
        password: true,
        created_at: true,
      },
      orderBy: {
        ustazname: "asc",
      },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Controller teachers API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
