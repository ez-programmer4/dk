import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    // Branding is publicly accessible, but authenticated users get more detailed info

    const { schoolSlug } = params;

    // For darulkubra school slug, use null schoolId
    // For other schools, use the schoolSlug as schoolId
    const schoolId = schoolSlug === "darulkubra" ? null : schoolSlug;

    // Verify the user has access to this school
    // For registral users, we allow access if they can authenticate
    // The schoolSlug in the URL determines which school's branding to show

    // Fetch school branding information
    const school = schoolId
      ? await prisma.school.findUnique({
          where: { id: schoolId },
          select: {
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        })
      : null; // For darulkubra, we might not have a school record

    // If we have a school record, use its data
    if (school) {
      return NextResponse.json({
        name: school.name,
        logo: school.logoUrl,
        primaryColor: school.primaryColor || "#0f766e",
        secondaryColor: school.secondaryColor || "#06b6d4",
        theme: "light",
        supportEmail: `support@${schoolSlug}.com`, // Dynamic support email
      });
    }

    // For darulkubra or schools without database records, use defaults
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
