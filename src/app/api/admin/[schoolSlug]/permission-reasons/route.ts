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

    // Get school information and verify access
    const school = await prisma.school.findUnique({
      where: { slug: params.schoolSlug },
      select: { id: true, name: true },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

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
      return NextResponse.json({ error: "Unauthorized access to school" }, { status: 403 });
    }

    const reasons = await prisma.permissionreason.findMany({
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(reasons);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch reasons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || (session.role !== "admin" && session.role !== "controller")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reason } = await req.json();
    
    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    const newReason = await prisma.permissionreason.create({
      data: { reason }
    });
    
    return NextResponse.json(newReason);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create reason" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || (session.role !== "admin" && session.role !== "controller")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await prisma.permissionreason.delete({
      where: { id: parseInt(id) }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete reason" }, { status: 500 });
  }
}
