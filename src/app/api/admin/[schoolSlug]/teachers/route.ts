import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "admin") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get school information
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return Response.json(
        { error: "School not found" },
        { status: 404 }
      );
    }

    // Verify admin has access to this school
    const user = session.user as { id: string };
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return Response.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const teachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        schoolId: school.id,
      },
      select: {
        ustazid: true,
        ustazname: true,
      },
      orderBy: {
        ustazname: "asc",
      },
    });

    // Return array directly for deduction-adjustments page
    return Response.json(
      teachers.map((teacher) => ({
        id: teacher.ustazid,
        name: teacher.ustazname,
      }))
    );
  } catch (error) {
    console.error("Teachers API error:", error);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
