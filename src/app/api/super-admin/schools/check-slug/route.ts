import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/schools/check-slug - Check if slug is available
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json({ error: "Slug parameter is required" }, { status: 400 });
    }

    const existingSchool = await prisma.school.findUnique({
      where: { slug },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      available: !existingSchool,
      slug,
    });
  } catch (error) {
    console.error("Check slug API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

