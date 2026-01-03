import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const limitParam = searchParams.get("limit");
    // Only apply limit if explicitly provided, otherwise return all results
    const limit = limitParam ? parseInt(limitParam) : undefined;

    const whereClause: any = {};
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

    // Only add take if limit is specified
    if (limit !== undefined) {
      queryOptions.take = limit;
    }

    const permissions = await prisma.permissionrequest.findMany(queryOptions);

    // Transform the data to match the dashboard expectations
    const transformedPermissions = permissions.map((permission: any) => ({
      id: permission.id,
      teacher: {
        ustazname: permission.wpos_wpdatatable_24?.ustazname || "Unknown"
      },
      teacherId: permission.teacherId,
      status: permission.status,
      reasonCategory: permission.reasonCategory,
      reasonDetails: permission.reasonDetails,
      requestedDate: permission.requestedDate,
      timeSlots: permission.timeSlots,
      date: permission.createdAt?.toISOString().split("T")[0],
      createdAt: permission.createdAt?.toISOString(),
    }));

    return NextResponse.json(transformedPermissions);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
