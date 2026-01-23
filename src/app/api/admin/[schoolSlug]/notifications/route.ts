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
      (session.user as { id: string; role: string }).role !== "admin"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    const user = session.user as { id: string; role: string };

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

    // Verify admin has access to this school
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const unread = url.searchParams.get("unread");
    const where: any = { userId: user.id };
    if (unread === "1") where.isRead = false;
    
    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(notifications);
  } catch (error) {
    console.error("Notifications API error:", error);
    // Return empty array if table doesn't exist
    return NextResponse.json([]);
  }
}
