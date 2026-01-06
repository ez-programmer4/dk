import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "controller") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const schoolSlug = params.schoolSlug;
    let schoolId = null;

    // Look up the school ID for all schools
    try {
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug },
        select: { id: true, name: true, slug: true }
      });
      schoolId = school?.id || null;
    } catch (error) {
      console.error("Error looking up school:", error);
      schoolId = null;
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam) : undefined;

    // Get teachers assigned to this controller
    const controllerTeachers = await prisma.wpos_wpdatatable_24.findMany({
      where: {
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      select: {
        ustazid: true,
      },
    });

    const teacherIds = controllerTeachers.map(t => t.ustazid);

    const whereClause: any = {
      teacherId: {
        in: teacherIds,
      },
    };

    if (status) {
      whereClause.status = status;
    }

    const queryOptions: any = {
      where: whereClause,
      include: {
        wpos_wpdatatable_24: {
          select: {
            ustazname: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    };

    if (limit !== undefined) {
      queryOptions.take = limit;
    }

    const permissions = await prisma.permissionrequest.findMany(queryOptions);

    // Transform the data to match the dashboard expectations
    const transformedPermissions = permissions.map((permission: any) => ({
      id: permission.id,
      teacherId: permission.teacherId,
      teacherName: permission.wpos_wpdatatable_24?.ustazname || permission.teacherId,
      requestedDates: permission.requestedDates,
      reasonCategory: permission.reasonCategory,
      reasonDetails: permission.reasonDetails,
      status: permission.status,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    }));

    return NextResponse.json(transformedPermissions);
  } catch (error) {
    console.error("Controller permissions API error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

