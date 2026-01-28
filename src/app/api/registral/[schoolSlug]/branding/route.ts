import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const { schoolSlug } = params;

    // Try to find the school by slug first
    let school = await prisma.school.findFirst({
      where: { slug: schoolSlug },
      select: {
        name: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
      },
    });

    // If not found by slug, try to find by id (for backward compatibility)
    if (!school && schoolSlug !== "darulkubra") {
      school = await prisma.school.findUnique({
        where: { id: schoolSlug },
        select: {
          name: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      });
    }

    // If we have a school record, use its data
    if (school) {
      return NextResponse.json({
        name: school.name,
        logo: school.logoUrl,
        primaryColor: school.primaryColor || "#0f766e",
        secondaryColor: school.secondaryColor || "#06b6d4",
        theme: "light",
        supportEmail: `support@${schoolSlug}.com`,
      });
    }

    // For schools without database records, use defaults
    const schoolName = schoolSlug === "darulkubra" ? "Darulkubra Quran Academy" : `${schoolSlug.charAt(0).toUpperCase() + schoolSlug.slice(1)} Academy`;

    return NextResponse.json({
      name: schoolName,
      logo: "/logo.svg",
      primaryColor: "#0f766e",
      secondaryColor: "#06b6d4",
      theme: "light",
      supportEmail: `support@${schoolSlug}.com`,
    });
  } catch (error) {
    console.error("Registral branding API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
