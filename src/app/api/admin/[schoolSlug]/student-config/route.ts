import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      where: { id: token.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    if (type === "statuses") {
      const statuses = await prisma.studentStatus.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(statuses);
    }

    if (type === "packages") {
      const packages = await prisma.studentPackage.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(packages);
    }

    if (type === "subjects") {
      const subjects = await prisma.studentSubject.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(subjects);
    }

    if (type === "daypackages") {
      const daypackages = await prisma.studentdaypackage.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      });
      return NextResponse.json(daypackages);
    }

    // Return all configurations
    const [statuses, packages, subjects, daypackages] = await Promise.all([
      prisma.studentStatus.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      }),
      prisma.studentPackage.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      }),
      prisma.studentSubject.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      }),
      prisma.studentdaypackage.findMany({
        where: {
          isActive: true,
          schoolId: school.id
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return NextResponse.json({ statuses, packages, subjects, daypackages });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      where: { id: token.id as string },
      select: { schoolId: true },
    });

    if (!admin || admin.schoolId !== school.id) {
      return NextResponse.json(
        { error: "Unauthorized access to school" },
        { status: 403 }
      );
    }

    const { type, name, action = "add", id } = await req.json();

    // Initialize default data if action is 'init'
    if (action === "init") {
      const defaultStatuses = [
        "Active",
        "Not yet",
        "Leave",
        "Completed",
        "Not succeed",
        "Ramadan Leave",
      ];
      const defaultPackages = ["0 Fee", "3 days", "5 days", "Europe"];
      const defaultSubjects = ["Qaidah", "Nethor", "Hifz", "Kitab"];
      const defaultDayPackages = ["All days", "MWF", "TTS"];

      // Clear existing data and recreate
      await Promise.all([
        prisma.studentStatus.deleteMany({}),
        prisma.studentPackage.deleteMany({}),
        prisma.studentSubject.deleteMany({}),
        prisma.studentdaypackage.deleteMany({}),
      ]);

      await Promise.all([
        ...defaultStatuses.map((status) =>
          prisma.studentStatus.create({ data: { name: status, schoolId: school.id, updatedAt: new Date() } })
        ),
        ...defaultPackages.map((pkg) =>
          prisma.studentPackage.create({ data: { name: pkg, schoolId: school.id, updatedAt: new Date() } })
        ),
        ...defaultSubjects.map((subject) =>
          prisma.studentSubject.create({ data: { name: subject, schoolId: school.id, updatedAt: new Date() } })
        ),
        ...defaultDayPackages.map((daypackage) =>
          prisma.studentdaypackage.create({ data: { name: daypackage, schoolId: school.id, updatedAt: new Date() } })
        ),
      ]);

      return NextResponse.json({
        success: true,
        message: "Default data initialized",
      });
    }

    if (action === "add") {
      // Check for duplicates within the same school
      let exists = false;
      if (type === "status") {
        exists = !!(await prisma.studentStatus.findFirst({
          where: { name, schoolId: school.id, isActive: true }
        }));
      } else if (type === "package") {
        exists = !!(await prisma.studentPackage.findFirst({
          where: { name, schoolId: school.id, isActive: true },
        }));
      } else if (type === "subject") {
        exists = !!(await prisma.studentSubject.findFirst({
          where: { name, schoolId: school.id, isActive: true },
        }));
      } else if (type === "daypackage") {
        exists = !!(await prisma.studentdaypackage.findFirst({
          where: { name, schoolId: school.id, isActive: true },
        }));
      }

      if (exists) {
        return NextResponse.json(
          { error: `${name} already exists` },
          { status: 400 }
        );
      }

      let result;
      if (type === "status") {
        result = await prisma.studentStatus.create({ data: { name, schoolId: school.id, updatedAt: new Date() } });
      } else if (type === "package") {
        result = await prisma.studentPackage.create({ data: { name, schoolId: school.id, updatedAt: new Date() } });
      } else if (type === "subject") {
        result = await prisma.studentSubject.create({ data: { name, schoolId: school.id, updatedAt: new Date() } });
      } else if (type === "daypackage") {
        result = await prisma.studentdaypackage.create({ data: { name, schoolId: school.id, updatedAt: new Date() } });
      }
      return NextResponse.json({ success: true, id: result?.id });
    }

    if (action === "update" && id && name) {
      if (type === "status") {
        await prisma.studentStatus.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { name, updatedAt: new Date() },
        });
      } else if (type === "package") {
        await prisma.studentPackage.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { name, updatedAt: new Date() },
        });
      } else if (type === "subject") {
        await prisma.studentSubject.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { name, updatedAt: new Date() },
        });
      } else if (type === "daypackage") {
        await prisma.studentdaypackage.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { name, updatedAt: new Date() },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "delete" && id) {
      if (type === "status") {
        await prisma.studentStatus.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { isActive: false, updatedAt: new Date() },
        });
      } else if (type === "package") {
        await prisma.studentPackage.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { isActive: false, updatedAt: new Date() },
        });
      } else if (type === "subject") {
        await prisma.studentSubject.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { isActive: false, updatedAt: new Date() },
        });
      } else if (type === "daypackage") {
        await prisma.studentdaypackage.update({
          where: { id: parseInt(id), schoolId: school.id },
          data: { isActive: false, updatedAt: new Date() },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
