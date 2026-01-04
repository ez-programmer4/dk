import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    let school = null;
    if (schoolId) {
      school = await prisma.school.findUnique({
        where: { id: schoolId },
        select: {
          name: true,
          logoUrl: true,
          primaryColor: true,
          secondaryColor: true,
        },
      });
    }

    const defaultSchoolName =
      schoolSlug === "darulkubra"
        ? "Darulkubra Quran Academy"
        : `${
            schoolSlug.charAt(0).toUpperCase() + schoolSlug.slice(1)
          } Academy`;

    return NextResponse.json({
      name: school?.name || defaultSchoolName,
      logo: school?.logoUrl || "/logo.svg",
      primaryColor: school?.primaryColor || "#0f766e",
      secondaryColor: school?.secondaryColor || "#06b6d4",
      theme: "light",
      supportEmail: `support@${schoolSlug}.com`,
    });
  } catch (error) {
    console.error("Controller branding API error:", error);
    const schoolSlug = params.schoolSlug;
    const defaultSchoolName =
      schoolSlug === "darulkubra"
        ? "Darulkubra Quran Academy"
        : `${
            schoolSlug.charAt(0).toUpperCase() + schoolSlug.slice(1)
          } Academy`;
    return NextResponse.json(
      {
        name: defaultSchoolName,
        logo: "/logo.svg",
        primaryColor: "#0f766e",
        secondaryColor: "#06b6d4",
        theme: "light",
        supportEmail: `support@${schoolSlug}.com`,
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
