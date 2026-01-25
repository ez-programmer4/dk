import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/super-admin/schools/[id]/users - Get all users for a school
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify that the SuperAdmin exists in the database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
    }

    const schoolId = params.id;

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Fetch all users for the school
    const [admins, teachers, students, controllers, registrals] = await Promise.all([
      prisma.admin.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          username: true,
          phoneno: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.wpos_wpdatatable_24.findMany({
        where: { schoolId: { not: null } },
        select: {
          ustazid: true,
          ustazname: true,
          phone: true,
          created_at: true,
        },
      }),
      prisma.wpos_wpdatatable_23.findMany({
        where: { schoolId: { not: null } },
        select: {
          wdt_ID: true,
          name: true,
          phoneno: true,
          registrationdate: true,
        },
      }),
      prisma.wpos_wpdatatable_28.findMany({
        where: { schoolId },
        select: {
          wdt_ID: true,
          name: true,
          username: true,
          code: true,
        },
      }),
      prisma.wpos_wpdatatable_33.findMany({
        where: { schoolId },
        select: {
          wdt_ID: true,
          name: true,
          username: true,
        },
      }),
    ]);

    // Combine all users with normalized field names
    const allUsers = [
      ...admins.map(user => ({
        id: user.id,
        name: user.name,
        username: user.username || null,
        email: null, // Admin table doesn't have email
        phone: user.phoneno,
        role: 'admin',
        createdAt: user.createdAt,
      })),
      ...teachers.map(user => ({
        id: user.ustazid,
        name: user.ustazname,
        username: null,
        email: null,
        phone: user.phone,
        role: 'teacher',
        createdAt: user.created_at,
      })),
      ...students.map(user => ({
        id: user.wdt_ID.toString(),
        name: user.name,
        username: null,
        email: null,
        phone: user.phoneno,
        role: 'student',
        createdAt: user.registrationdate,
      })),
      ...controllers.map(user => ({
        id: user.wdt_ID.toString(),
        name: user.name,
        username: user.username,
        email: null,
        phone: null, // Controller table doesn't have phone
        role: 'controller',
        createdAt: null, // Controller table doesn't have createdAt
      })),
      ...registrals.map(user => ({
        id: user.wdt_ID.toString(),
        name: user.name,
        username: user.username,
        email: null,
        phone: null, // Registral table doesn't have phone
        role: 'registral',
        createdAt: null, // Registral table doesn't have createdAt
      })),
    ].sort((a, b) => {
      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bDate - aDate;
    });

    return NextResponse.json({
      success: true,
      users: allUsers,
      counts: {
        admins: admins.length,
        teachers: teachers.length,
        students: students.length,
        controllers: controllers.length,
        registrals: registrals.length,
      },
    });
  } catch (error) {
    console.error("Get school users API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/schools/[id]/users - Add a new user to the school
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "superAdmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify that the SuperAdmin exists in the database
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: session.user.id }
    });

    if (!superAdmin) {
      return NextResponse.json({ error: "SuperAdmin not found" }, { status: 404 });
    }

    const schoolId = params.id;
    const body = await req.json();
    const { name, username, email, phone, role, password } = body;

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Validate required fields based on role
    if (!name || !role) {
      return NextResponse.json({ error: "Name and role are required" }, { status: 400 });
    }

    // Username is required for admin, controller, registral but optional for others
    if ((role === 'admin' || role === 'controller' || role === 'registral') && !username) {
      return NextResponse.json({ error: "Username is required for this role" }, { status: 400 });
    }

    // Hash password if provided
    let hashedPassword = null;
    if (password) {
      const bcrypt = await import("bcryptjs");
      hashedPassword = await bcrypt.hash(password, 12);
    }

    let newUser;

    // Create user based on role
    switch (role) {
      case 'admin':
        // Check for duplicate name (unique constraint)
        const existingAdminByName = await prisma.admin.findFirst({
          where: { name },
        });
        if (existingAdminByName) {
          return NextResponse.json({ error: "Admin with this name already exists" }, { status: 400 });
        }

        // Generate unique chat_id
        const adminChatId = `admin_${username}_${Date.now()}`;

        newUser = await prisma.admin.create({
          data: {
            name,
            username,
            passcode: hashedPassword || 'defaultpassword123',
            phoneno: phone || '',
            role: 'admin',
            schoolId,
            chat_id: adminChatId,
          },
        });
        break;

      case 'teacher':
        // Teachers table has limited fields
        newUser = await prisma.wpos_wpdatatable_24.create({
          data: {
            ustazname: name,
            phone,
            password: hashedPassword || 'defaultpassword123',
            schoolId,
          },
        });
        break;

      case 'student':
        // Students table has limited fields
        newUser = await prisma.wpos_wpdatatable_23.create({
          data: {
            name,
            phoneno: phone,
            schoolId,
          },
        });
        break;

      case 'controller':
        newUser = await prisma.wpos_wpdatatable_28.create({
          data: {
            name,
            username,
            password: hashedPassword || 'defaultpassword123',
            schoolId,
          },
        });
        break;

      case 'registral':
        newUser = await prisma.wpos_wpdatatable_33.create({
          data: {
            name,
            username,
            password: hashedPassword || 'defaultpassword123',
            schoolId,
          },
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create audit log
    try {
      await prisma.superAdminAuditLog.create({
        data: {
          superAdminId: session.user.id,
          action: "create_user",
          resourceType: "user",
          resourceId: newUser.id,
          details: {
            role,
            schoolId,
            schoolName: school.name,
            userData: {
              name,
              username,
              email,
            },
          },
          ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
          userAgent: req.headers.get("user-agent"),
        },
      });
    } catch (auditError) {
      console.error("Failed to create audit log:", auditError);
    }

    return NextResponse.json({
      success: true,
      user: { ...newUser, role },
      message: `${role} created successfully`,
    });
  } catch (error) {
    console.error("Create school user API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
