import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Get only active schools for login selection (not trial schools)
    const schools = await prisma.school.findMany({
      where: {
        status: "active",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        address: true,
        email: true,
        phone: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      schools
    });

  } catch (error) {
    console.error("Schools fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
