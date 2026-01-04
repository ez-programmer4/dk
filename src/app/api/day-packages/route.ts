import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * 🆕 DYNAMIC: Fetch daypackages from studentdaypackage table
 * Returns all active daypackages from the database
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolSlug = searchParams.get("schoolSlug");
    const schoolId = schoolSlug === "darulkubra" ? null : schoolSlug;

    // Fetch active daypackages from database
    const dayPackages = await prisma.studentdaypackage.findMany({
      where: {
        isActive: true,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        isActive: true,
      },
    });

    // Extract just the names for backward compatibility
    const dayPackageNames = dayPackages.map((dp) => dp.name);

    // If no daypackages found, return default static ones (backward compatibility)
    if (dayPackageNames.length === 0) {
      return NextResponse.json(
        { 
          dayPackages: ["All days", "MWF", "TTS"],
          message: "No daypackages found in database, using defaults"
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { 
        dayPackages: dayPackageNames,
        fullData: dayPackages // Include full data for future use
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching day packages:", error);
    // Fallback to static daypackages on error
    return NextResponse.json(
      { 
        dayPackages: ["All days", "MWF", "TTS"],
        error: "Error fetching day packages, using defaults"
      },
      { status: 200 } // Return 200 with fallback data
    );
  }
}
