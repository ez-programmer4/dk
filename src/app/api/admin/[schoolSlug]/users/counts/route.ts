import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolId = session.user.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    // Get counts by role
    const adminCount = await prisma.admin.count({
      where: { schoolId, role: "admin" },
    });

    const controllerCount = await prisma.admin.count({
      where: { schoolId, role: "controller" },
    });

    const registralCount = await prisma.admin.count({
      where: { schoolId, role: "registral" },
    });

    const teacherCount = await prisma.admin.count({
      where: { schoolId, role: "teacher" },
    });

    const totalCount = adminCount + controllerCount + registralCount + teacherCount;

    return NextResponse.json({
      counts: {
        total: totalCount,
        admin: adminCount,
        controller: controllerCount,
        registral: registralCount,
        teacher: teacherCount,
      },
    });
  } catch (error) {
    console.error("Admin users counts API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

































