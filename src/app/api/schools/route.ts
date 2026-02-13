import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // First, let's try a simple query to see if schools exist at all
    const allSchoolsCount = await prisma.school.count();
    console.log("Total schools in database:", allSchoolsCount);

    if (allSchoolsCount === 0) {
      console.log("No schools found in database, returning fallback data");
      // Return fallback data when no schools exist
      const fallbackSchools = [
        {
          id: "demo-1",
          name: "Darulkubra Academy",
          slug: "darulkubra",
          description: "Leading Islamic education institution with 500+ students",
          logoUrl: "https://darelkubra.com/wp-content/uploads/2024/06/cropped-ዳሩል-ሎጎ-150x150.png",
          primaryColor: "#0f766e",
          secondaryColor: "#06b6d4",
          status: "active",
          timezone: "Africa/Addis_Ababa",
          currency: "ETB",
          stats: {
            students: 487,
            teachers: 23,
            admins: 5,
          },
          subscription: {
            status: "active",
            currentStudents: 487,
            maxStudents: 1000,
            tier: "Premium",
          },
          contact: {
            email: "info@darulkubra.com",
            phone: "+251911123456",
          },
          createdAt: new Date("2023-01-15"),
        },
        {
          id: "demo-2",
          name: "Zubeyr Ibn Awwam Primary",
          slug: "zubeyr-ibnu-awam",
          description: "Primary school for young learners in Addis Ababa",
          logoUrl: null,
          primaryColor: "#1e40af",
          secondaryColor: "#3b82f6",
          status: "active",
          timezone: "Africa/Addis_Ababa",
          currency: "ETB",
          stats: {
            students: 234,
            teachers: 12,
            admins: 3,
          },
          subscription: {
            status: "active",
            currentStudents: 234,
            maxStudents: 500,
            tier: "Standard",
          },
          contact: {
            email: "admin@zubeyr-primary.edu",
            phone: "+251922334455",
          },
          createdAt: new Date("2023-03-20"),
        },
      ];

      return NextResponse.json(
        {
          schools: fallbackSchools,
          total: fallbackSchools.length,
          meta: {
            activeSchools: fallbackSchools.filter(s => s.status === 'active').length,
            trialSchools: fallbackSchools.filter(s => s.status === 'trial').length,
            isFallback: true,
            message: "No schools found in database, using demo data",
          },
        },
        { status: 200 }
      );
    }

    // Fetch all active schools with enhanced data
    const schools = await prisma.school.findMany({
      where: {
        status: {
          in: ["active", "trial"], // Only show active and trial schools
        },
        registrationStatus: "approved", // Only approved registrations
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        address: true,
        logoUrl: true,
        primaryColor: true,
        secondaryColor: true,
        status: true,
        timezone: true,
        defaultCurrency: true,
        createdAt: true,
        // Add description based on available data
        _count: {
          select: {
            students: true,
            teachers: true,
            admins: true,
          },
        },
        // Include subscription info
        subscription: {
          select: {
            status: true,
            currentStudents: true,
          },
        },
        // Include pricing tier info
        pricingTier: {
          select: {
            name: true,
            maxStudents: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    console.log("Found schools from database:", schools.length);

    // Transform the data to include computed fields
    const transformedSchools = schools.map((school) => {
      // Generate a better description
      let description = '';
      if (school.address) {
        description = school.address;
        if (school._count.students > 0) {
          description += ` • ${school._count.students} students`;
        }
      } else {
        const parts = [];
        if (school._count.students > 0) {
          parts.push(`${school._count.students} students`);
        }
        if (school._count.teachers > 0) {
          parts.push(`${school._count.teachers} teachers`);
        }
        description = parts.length > 0 ? parts.join(', ') : 'Islamic education institution';
      }

      return {
        id: school.id,
        name: school.name,
        slug: school.slug || school.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        description,
        logoUrl: school.logoUrl || "https://darelkubra.com/wp-content/uploads/2024/06/cropped-ዳሩል-ሎጎ-150x150.png",
        primaryColor: school.primaryColor || "#0f766e",
        secondaryColor: school.secondaryColor || "#06b6d4",
        status: school.status,
        timezone: school.timezone,
        currency: school.defaultCurrency,
        stats: {
          students: school._count.students,
          teachers: school._count.teachers,
          admins: school._count.admins,
        },
        subscription: school.subscription ? {
          status: school.subscription.status,
          currentStudents: school.subscription.currentStudents,
          maxStudents: school.pricingTier?.maxStudents || 0,
          tier: school.pricingTier?.name || "Basic",
        } : {
          status: "trial",
          currentStudents: school._count.students,
          maxStudents: 50, // Default trial limit
          tier: "Trial",
        },
        contact: {
          email: school.email,
          phone: school.phone,
        },
        createdAt: school.createdAt,
      };
    });

    return NextResponse.json(
      {
        schools: transformedSchools,
        total: transformedSchools.length,
        meta: {
          activeSchools: transformedSchools.filter(s => s.status === 'active').length,
          trialSchools: transformedSchools.filter(s => s.status === 'trial').length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching schools:", error);

    // Fallback schools for demo/development
    const fallbackSchools = [
      {
        id: "demo-1",
        name: "Darulkubra Academy",
        slug: "darulkubra",
        description: "Leading Islamic education institution with 500+ students",
        logoUrl: "https://darelkubra.com/wp-content/uploads/2024/06/cropped-ዳሩል-ሎጎ-150x150.png",
        primaryColor: "#0f766e",
        secondaryColor: "#06b6d4",
        status: "active",
        timezone: "Africa/Addis_Ababa",
        currency: "ETB",
        stats: {
          students: 487,
          teachers: 23,
          admins: 5,
        },
        subscription: {
          status: "active",
          currentStudents: 487,
          maxStudents: 1000,
          tier: "Premium",
        },
        contact: {
          email: "info@darulkubra.com",
          phone: "+251911123456",
        },
        createdAt: new Date("2023-01-15"),
      },
      {
        id: "demo-2",
        name: "Zubeyr Ibn Awwam Primary",
        slug: "zubeyr-ibnu-awam",
        description: "Primary school for young learners in Addis Ababa",
        logoUrl: null,
        primaryColor: "#1e40af",
        secondaryColor: "#3b82f6",
        status: "active",
        timezone: "Africa/Addis_Ababa",
        currency: "ETB",
        stats: {
          students: 234,
          teachers: 12,
          admins: 3,
        },
        subscription: {
          status: "active",
          currentStudents: 234,
          maxStudents: 500,
          tier: "Standard",
        },
        contact: {
          email: "admin@zubeyr-primary.edu",
          phone: "+251922334455",
        },
        createdAt: new Date("2023-03-20"),
      },
      {
        id: "demo-3",
        name: "Al-Noor Islamic School",
        slug: "al-noor-islamic",
        description: "Comprehensive Islamic education center",
        logoUrl: null,
        primaryColor: "#7c3aed",
        secondaryColor: "#a855f7",
        status: "trial",
        timezone: "Africa/Addis_Ababa",
        currency: "ETB",
        stats: {
          students: 89,
          teachers: 8,
          admins: 2,
        },
        subscription: {
          status: "trial",
          currentStudents: 89,
          maxStudents: 200,
          tier: "Trial",
        },
        contact: {
          email: "contact@alnoor.edu.et",
          phone: "+251933445566",
        },
        createdAt: new Date("2024-01-10"),
      },
    ];

    return NextResponse.json(
      {
        schools: fallbackSchools,
        total: fallbackSchools.length,
        meta: {
          activeSchools: fallbackSchools.filter(s => s.status === 'active').length,
          trialSchools: fallbackSchools.filter(s => s.status === 'trial').length,
          isFallback: true,
        },
        message: "Using fallback school data due to database error",
      },
      { status: 200 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
