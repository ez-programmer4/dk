import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// Force dynamic rendering
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user has access to this school
    if (session.schoolSlug !== params.schoolSlug) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "";

    const offset = (page - 1) * limit;

    let allUsers: any[] = [];
    let total = 0;

    // Build search conditions
    const searchCondition = search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" } },
        { username: { contains: search, mode: "insensitive" } },
      ]
    } : {};

    const schoolCondition = { schoolId };

    // Query appropriate tables based on role filter
    if (roleFilter === "admin" || !roleFilter) {
      const adminWhere = { AND: [schoolCondition, searchCondition].filter(Boolean) };
      const adminUsers = await prisma.admin.findMany({
        where: adminWhere,
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          phoneno: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: roleFilter === "admin" ? offset : 0,
        take: roleFilter === "admin" ? limit : undefined,
      });
      const adminCount = roleFilter === "admin" ? await prisma.admin.count({ where: adminWhere }) : adminUsers.length;

      const formattedAdmins = adminUsers.map(user => ({
        id: user.id.toString(),
        name: user.name || "",
        username: user.username || "",
        role: (user.role || "admin") as "admin" | "controller" | "registral" | "teacher",
        phone: user.phoneno || undefined,
        createdAt: user.createdAt.toISOString(),
      }));

      allUsers = [...allUsers, ...formattedAdmins];
      if (roleFilter === "admin") total += adminCount;
    }

    if (roleFilter === "controller" || !roleFilter) {
      const controllerWhere = { AND: [schoolCondition, searchCondition].filter(Boolean) };
      const controllers = await prisma.wpos_wpdatatable_28.findMany({
        where: controllerWhere,
        select: {
          wdt_ID: true,
          name: true,
          username: true,
          code: true,
        },
        orderBy: { wdt_ID: "desc" },
        skip: roleFilter === "controller" ? offset : 0,
        take: roleFilter === "controller" ? limit : undefined,
      });
      const controllerCount = roleFilter === "controller" ? await prisma.wpos_wpdatatable_28.count({ where: controllerWhere }) : controllers.length;

      const formattedControllers = controllers.map(ctrl => ({
        id: ctrl.wdt_ID.toString(),
        name: ctrl.name || "",
        username: ctrl.username || "",
        role: "controller" as const,
        code: ctrl.code,
        createdAt: new Date().toISOString(),
      }));

      allUsers = [...allUsers, ...formattedControllers];
      if (roleFilter === "controller") total += controllerCount;
    }

    if (roleFilter === "registral" || !roleFilter) {
      const registralWhere = { AND: [schoolCondition, searchCondition].filter(Boolean) };
      const registrals = await prisma.wpos_wpdatatable_33.findMany({
        where: registralWhere,
        select: {
          wdt_ID: true,
          name: true,
          username: true,
        },
        orderBy: { wdt_ID: "desc" },
        skip: roleFilter === "registral" ? offset : 0,
        take: roleFilter === "registral" ? limit : undefined,
      });
      const registralCount = roleFilter === "registral" ? await prisma.wpos_wpdatatable_33.count({ where: registralWhere }) : registrals.length;

      const formattedRegistrals = registrals.map(reg => ({
        id: reg.wdt_ID.toString(),
        name: reg.name || "",
        username: reg.username || "",
        role: "registral" as const,
        createdAt: new Date().toISOString(),
      }));

      allUsers = [...allUsers, ...formattedRegistrals];
      if (roleFilter === "registral") total += registralCount;
    }

    if (roleFilter === "teacher" || !roleFilter) {
      const teacherWhere = { AND: [schoolCondition, searchCondition].filter(Boolean) };
      const teachers = await prisma.wpos_wpdatatable_24.findMany({
        where: teacherWhere,
        select: {
          ustazid: true,
          ustazname: true,
          phone: true,
          schedule: true,
          control: true,
        },
        orderBy: { ustazid: "desc" },
        skip: roleFilter === "teacher" ? offset : 0,
        take: roleFilter === "teacher" ? limit : undefined,
      });
      const teacherCount = roleFilter === "teacher" ? await prisma.wpos_wpdatatable_24.count({ where: teacherWhere }) : teachers.length;

      const formattedTeachers = teachers.map(teacher => ({
        id: teacher.ustazid,
        name: teacher.ustazname || "",
        username: teacher.ustazid,
        role: "teacher" as const,
        phone: teacher.phone,
        schedule: teacher.schedule,
        controlId: teacher.control,
        createdAt: new Date().toISOString(),
      }));

      allUsers = [...allUsers, ...formattedTeachers];
      if (roleFilter === "teacher") total += teacherCount;
    }

    // Sort and paginate combined results if no role filter
    if (!roleFilter) {
      allUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      total = allUsers.length;
      allUsers = allUsers.slice(offset, offset + limit);
    }

    return NextResponse.json({
      users: allUsers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Admin users API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user has access to this school
    if (session.schoolSlug !== params.schoolSlug) {
      return NextResponse.json({ error: "Access denied to this school" }, { status: 403 });
    }

    const schoolId = session.schoolId;
    if (!schoolId) {
      return NextResponse.json({ error: "No school access" }, { status: 403 });
    }

    const body = await req.json();
    const { name, username, password, role, phone, code, controlId } = body;

    // Validation
    if (!name || !username || !password) {
      return NextResponse.json(
        { error: "Name, username, and password are required" },
        { status: 400 }
      );
    }

    let newUser: any;

    // Create user based on role
    if (role === "admin") {
      // Check if username already exists in admin table
      const existingAdmin = await prisma.admin.findFirst({
        where: { username, schoolId },
      });
      if (existingAdmin) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }

      const hashedPassword = await hash(password, 10);
      const chatId = `admin_${schoolId}_${username}_${Date.now()}`;

      newUser = await prisma.admin.create({
        data: {
          name,
          username,
          passcode: hashedPassword,
          role: "admin",
          phoneno: phone || null,
          chat_id: chatId,
          schoolId,
        },
        select: {
          id: true,
          name: true,
          username: true,
          role: true,
          phoneno: true,
          createdAt: true,
        },
      });

      // Format response for admin
      newUser = {
        id: newUser.id.toString(),
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        phone: newUser.phoneno,
        createdAt: newUser.createdAt.toISOString(),
      };

    } else if (role === "controller") {
      // Check if username already exists in controllers table
      const existingController = await prisma.wpos_wpdatatable_28.findFirst({
        where: { username, schoolId },
      });
      if (existingController) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }

      const hashedPassword = await hash(password, 10);

      newUser = await prisma.wpos_wpdatatable_28.create({
        data: {
          name,
          username,
          password: hashedPassword,
          code: code || null,
          schoolId,
        },
        select: {
          wdt_ID: true,
          name: true,
          username: true,
          code: true,
        },
      });

      // Format response for controller
      newUser = {
        id: newUser.wdt_ID.toString(),
        name: newUser.name,
        username: newUser.username,
        role: "controller",
        code: newUser.code,
        createdAt: new Date().toISOString(),
      };

    } else if (role === "registral") {
      // Check if username already exists in registrals table
      const existingRegistral = await prisma.wpos_wpdatatable_33.findFirst({
        where: { username, schoolId },
      });
      if (existingRegistral) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }

      const hashedPassword = await hash(password, 10);

      newUser = await prisma.wpos_wpdatatable_33.create({
        data: {
          name,
          username,
          password: hashedPassword,
          schoolId,
        },
        select: {
          wdt_ID: true,
          name: true,
          username: true,
        },
      });

      // Format response for registral
      newUser = {
        id: newUser.wdt_ID.toString(),
        name: newUser.name,
        username: newUser.username,
        role: "registral",
        createdAt: new Date().toISOString(),
      };

    } else if (role === "teacher") {
      // Validate controlId for teachers
      if (!controlId || controlId === "" || controlId === "0") {
        return NextResponse.json(
          { error: "Controller assignment is required for teachers" },
          { status: 400 }
        );
      }

      // Verify the controller exists
      const controller = await prisma.wpos_wpdatatable_28.findFirst({
        where: {
          code: controlId,
          schoolId: schoolId,
        },
      });

      if (!controller) {
        return NextResponse.json(
          { error: "Invalid controller assignment" },
          { status: 400 }
        );
      }

      // Check if username already exists in teachers table
      const existingTeacher = await prisma.wpos_wpdatatable_24.findFirst({
        where: { ustazid: username, schoolId },
      });
      if (existingTeacher) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }

      const hashedPassword = await hash(password, 10);

      newUser = await prisma.wpos_wpdatatable_24.create({
        data: {
          ustazname: name,
          ustazid: username,
          password: hashedPassword,
          phone: phone || null,
          schedule: body.schedule || null,
          control: controlId,
          schoolId,
        },
        select: {
          ustazid: true,
          ustazname: true,
          phone: true,
          schedule: true,
          control: true,
        },
      });

      // Format response for teacher
      newUser = {
        id: newUser.ustazid,
        name: newUser.ustazname,
        username: newUser.ustazid,
        role: "teacher",
        controlId: newUser.control,
        createdAt: new Date().toISOString(),
      };

    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Log the action (using admin ID for audit log)
    await prisma.auditlog.create({
      data: {
        actionType: "CREATE_USER",
        adminId: session.id,
        targetId: parseInt(newUser.id),
        details: `Created user ${newUser.name} (${newUser.username}) with role ${role}`,
      },
    });

    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error("Create user API error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
