import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (
    !session ||
    !["registral", "controller", "admin"].includes(session.role)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolSlug = params.schoolSlug;
  const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

  try {
    const controllers = await prisma.wpos_wpdatatable_28.findMany({
      where: schoolId ? { schoolId } : { schoolId: null },
      select: { username: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ controllers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch controllers" },
      { status: 500 }
    );
  }
}
