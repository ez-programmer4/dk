import { PrismaClient } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma as globalPrisma } from "@/lib/prisma";
import { SalaryCalculator } from "@/lib/salary-calculator";
import { clearCalculatorCache } from "@/lib/calculator-cache";
import {
  to24Hour,
  to12Hour,
  validateTime,
  isTimeConflict,
  toDbFormat,
  fromDbFormat,
  timesMatch,
} from "@/utils/timeUtils";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const prismaClient = globalPrisma;

// Student slot limits per day package
const MAX_SLOTS_PER_STUDENT = 2;

const checkTeacherAvailability = async (
  selectedTime: string,
  selectedDayPackage: string,
  teacherId: string,
  excludeStudentId?: number,
  schoolId?: string | null
) => {
  // Validate time format
  if (!validateTime(selectedTime)) {
    return {
      isAvailable: false,
      message: `Invalid time format: ${selectedTime}`,
    };
  }

  const timeToMatch = to24Hour(selectedTime);
  const timeSlot = to12Hour(timeToMatch);

  const teacher = await prismaClient.wpos_wpdatatable_24.findUnique({
    where: { ustazid: teacherId },
    select: { ustazid: true, ustazname: true, schedule: true },
  });

  if (!teacher) {
    return {
      isAvailable: false,
      message: `Teacher with ID ${teacherId} does not exist`,
    };
  }

  const scheduleTimes = teacher.schedule
    ? teacher.schedule.split(",").map((t) => t.trim())
    : [];

  // Normalize time formats for comparison
  const normalizedScheduleTimes = scheduleTimes.map((time) => {
    try {
      return to24Hour(time);
    } catch {
      return time;
    }
  });

  // Check if teacher is available at this time
  if (!normalizedScheduleTimes.includes(timeToMatch)) {
    return {
      isAvailable: false,
      message: `Teacher ${teacher.ustazname} is not available at ${selectedTime}`,
    };
  }

  // Check for conflicts with active assignments
  const allBookings = await prismaClient.wpos_ustaz_occupied_times.findMany({
    where: {
      ...(schoolId ? { schoolId } : { schoolId: null }),
    },
    select: { ustaz_id: true, daypackage: true, student_id: true },
  });

  const teacherBookings = allBookings.filter(
    (booking) =>
      booking.ustaz_id === teacherId &&
      (!excludeStudentId || booking.student_id !== excludeStudentId)
  );

  const hasConflict = (
    teacherBookings: { daypackage: string }[],
    selectedPackage: string
  ) => {
    const normalize = (pkg: string) => pkg.trim().toLowerCase();
    const sel = normalize(selectedPackage);

    for (const booking of teacherBookings) {
      const booked = normalize(booking.daypackage);
      if (booked === sel) {
        return true;
      }
    }
    return false;
  };

  if (hasConflict(teacherBookings, selectedDayPackage)) {
    return {
      isAvailable: false,
      message: `Teacher ${teacher.ustazname} is already booked for ${selectedDayPackage} at ${selectedTime}`,
    };
  }

  return { isAvailable: true };
};

// Main registration API supporting all user roles with multi-tenancy
export async function POST(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      phoneNumber,
      parentPhone,
      classfee,
      classfeeCurrency,
      startdate,
      status,
      ustaz,
      package: regionPackage,
      subject,
      country,
      daypackages: selectedDayPackage,
      refer,
      selectedTime,
      registrationdate,
      email,
      usStudentId,
      chatId,
      reason,
      subscriptionPackageConfigId,
      schoolSlug,
    } = body;

    // Derive schoolId for multi-tenancy based on user's school association
    const userSchoolSlug = session.schoolSlug || "darulkubra";

    // Determine schoolId - create school if it doesn't exist for non-darulkubra
    let schoolId = userSchoolSlug === "darulkubra" ? null : userSchoolSlug;

    if (schoolId && userSchoolSlug !== "darulkubra") {
      // Check if school exists, create if not
      const existingSchool = await prismaClient.school.findUnique({
        where: { slug: userSchoolSlug },
        select: { id: true, name: true },
      });

      if (!existingSchool) {
        // Create the school automatically
        const newSchool = await prismaClient.school.create({
          data: {
            slug: userSchoolSlug,
            name: `${
              userSchoolSlug.charAt(0).toUpperCase() + userSchoolSlug.slice(1)
            } School`,
            email: `admin@${userSchoolSlug}.com`,
          },
        });
        schoolId = newSchool.id;
      } else {
        schoolId = existingSchool.id;
      }
    }

    // Basic validation (required for all roles)
    if (!fullName || fullName.trim() === "") {
      return NextResponse.json(
        { message: "Full name is required" },
        { status: 400 }
      );
    }
    if (!phoneNumber || phoneNumber.trim() === "") {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Role-based validation
    if (session.role === "controller" && !selectedDayPackage) {
      return NextResponse.json(
        { message: "Day package is required" },
        { status: 400 }
      );
    }

    // For registral users - simplified validation
    // Only require teacher and time if status is not "On Progress"
    if (session.role === "registral") {
      if (status !== "On Progress" && status !== "on progress") {
        if (!ustaz || ustaz.trim() === "") {
          return NextResponse.json(
            { message: "Teacher is required" },
            { status: 400 }
          );
        }
        if (!selectedTime || selectedTime.trim() === "") {
          return NextResponse.json(
            { message: "Selected time is required" },
            { status: 400 }
          );
        }
      }
    } else {
      // For admin/controller - require teacher and time for non-"On Progress" statuses
      if (status !== "On Progress" && status !== "on progress") {
        if (!ustaz || ustaz.trim() === "") {
          return NextResponse.json(
            { message: "Teacher is required" },
            { status: 400 }
          );
        }
        if (!selectedTime || selectedTime.trim() === "") {
          return NextResponse.json(
            { message: "Selected time is required" },
            { status: 400 }
          );
        }
      }
    }

    // If ustaz is provided, validate it exists
    if (ustaz && ustaz.trim() !== "") {
      const teacherExists = await prismaClient.wpos_wpdatatable_24.findUnique({
        where: { ustazid: ustaz },
        select: { ustazid: true },
      });

      if (!teacherExists) {
        return NextResponse.json(
          { message: `Teacher with ID ${ustaz} does not exist` },
          { status: 400 }
        );
      }
    }

    let timeToMatch: string = "",
      timeSlot: string = "";

    // Only validate time and check availability if not "On Progress"
    if (
      status !== "On Progress" &&
      status !== "on progress" &&
      selectedTime &&
      ustaz
    ) {
      // Validate time format
      if (!validateTime(selectedTime)) {
        return NextResponse.json(
          { message: `Invalid time format: ${selectedTime}` },
          { status: 400 }
        );
      }

      timeToMatch = to24Hour(selectedTime);
      timeSlot = to12Hour(timeToMatch);

      // Check teacher availability
      const availability = await checkTeacherAvailability(
        timeToMatch,
        selectedDayPackage || "",
        ustaz,
        undefined,
        schoolId
      );

      if (!availability.isAvailable) {
        return NextResponse.json(
          { message: availability.message },
          { status: 400 }
        );
      }
    }

    // Only check time slot availability if we have both teacher and time
    if (ustaz && selectedTime && timeSlot) {
      // Check if the selected time slot is available for the teacher
      const isTimeSlotAvailable =
        await prismaClient.wpos_ustaz_occupied_times.findFirst({
          where: {
            ustaz_id: ustaz,
            OR: [
              { time_slot: timeSlot },
              { time_slot: toDbFormat(selectedTime) },
              { time_slot: timeToMatch },
            ],
            daypackage: selectedDayPackage || "",
            end_at: null, // Only active assignments
            ...(schoolId ? { schoolId } : { schoolId: null }),
          },
        });

      if (isTimeSlotAvailable) {
        return NextResponse.json(
          { error: "This time slot is already occupied by another student" },
          { status: 400 }
        );
      }

      // Check for conflicts with active assignments
      const existingBookings =
        await prismaClient.wpos_ustaz_occupied_times.findMany({
          where: {
            ustaz_id: ustaz,
            OR: [
              { time_slot: timeSlot },
              { time_slot: toDbFormat(selectedTime) },
              { time_slot: timeToMatch },
            ],
            end_at: null, // Only active assignments
            ...(schoolId ? { schoolId } : { schoolId: null }),
          },
        });

      // Check for day package conflicts
      const hasConflict = existingBookings.some((booking) => {
        const normalize = (pkg: string) => pkg.trim().toLowerCase();
        const sel = (selectedDayPackage || "").toLowerCase();
        const booked = booking.daypackage.toLowerCase();

        // If either the existing booking or the new booking is "All days", there's a conflict
        if (booked === "all days" || sel === "all days") {
          return true;
        }

        // Check for exact package matches
        if (booked === sel) {
          return true;
        }

        // MWF and TTS are mutually exclusive, so no conflict between them
        return false;
      });

      if (hasConflict) {
        return NextResponse.json(
          {
            error:
              "This time slot is already booked for a conflicting day package.",
          },
          { status: 400 }
        );
      }
    }

    // Determine the u_control value (controller assignment)
    let u_control = null;

    if (session.role === "controller") {
      u_control = session.code;
    } else if (ustaz && ustaz.trim() !== "") {
      // For registral/admin, auto-assign based on teacher
      const teacher = await prismaClient.wpos_wpdatatable_24.findUnique({
        where: { ustazid: ustaz },
        select: { control: true },
      });
      u_control = teacher?.control || null;
    }

    const newRegistration = await prismaClient.$transaction(async (tx) => {
      const createData: any = {
        name: fullName,
        phoneno: phoneNumber,
        parent_phone: parentPhone || null,
        classfee:
          classfee !== undefined && classfee !== null
            ? parseFloat(classfee)
            : null,
        classfeeCurrency: classfeeCurrency || "ETB",
        startdate: startdate ? new Date(startdate) : null,
        u_control,
        status: status
          ? status.toLowerCase() === "not yet"
            ? "Not yet"
            : status?.charAt(0)?.toUpperCase() +
                status?.slice(1).toLowerCase() || "Not yet"
          : "Not yet",
        package: regionPackage || null,
        subject: subject || null,
        country: country || null,
        rigistral: session.role === "registral" ? session.username : null,
        daypackages: selectedDayPackage || null,
        refer: refer || null,
        registrationdate: registrationdate
          ? new Date(registrationdate)
          : new Date(),
        userId: usStudentId ? usStudentId.toString() : null,
        chatId: chatId || null,
        reason: reason || null,
        schoolId: schoolId,
      };

      // Only set ustaz if it's provided and not empty
      if (ustaz && ustaz.trim() !== "") {
        createData.ustaz = ustaz;
      }

      const registration = await tx.wpos_wpdatatable_23.create({
        data: createData,
      });

      // Assign subscription package config if provided
      if (subscriptionPackageConfigId) {
        const configId = parseInt(String(subscriptionPackageConfigId));
        if (!isNaN(configId)) {
          // Check if config exists and is active
          const config = await tx.subscription_package_config.findUnique({
            where: { id: configId },
            select: { id: true, isActive: true },
          });

          if (config && config.isActive) {
            // Update student record with configId
            await tx.wpos_wpdatatable_23.update({
              where: { wdt_ID: registration.wdt_ID },
              data: { subscriptionPackageConfigId: configId },
            });
          }
        }
      }

      // Create occupied time record if teacher and time are assigned
      if (ustaz && selectedTime && timeSlot) {
        await tx.wpos_ustaz_occupied_times.create({
          data: {
            ustaz_id: ustaz,
            student_id: registration.wdt_ID,
            time_slot: timeSlot,
            daypackage: selectedDayPackage || "",
            occupied_at: new Date(),
            end_at: null,
            schoolId: schoolId,
          },
        });
      }

      return registration;
    });

    return NextResponse.json(
      { message: "Registration successful", registration: newRegistration },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating registration:", error);
    return NextResponse.json(
      { message: error.message || "Failed to create registration" },
      { status: 400 }
    );
  }
}

// GET method for fetching registrations
export async function GET(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const student = searchParams.get("student");
    const daypackage = searchParams.get("daypackage");
    const schoolSlug = searchParams.get("schoolSlug");

    // Derive schoolId for multi-tenancy based on user's school association
    const userSchoolSlug = session.schoolSlug || "darulkubra";

    // Determine schoolId - create school if it doesn't exist for non-darulkubra
    let schoolId = userSchoolSlug === "darulkubra" ? null : userSchoolSlug;

    if (schoolId && userSchoolSlug !== "darulkubra") {
      // Check if school exists, create if not
      const existingSchool = await prismaClient.school.findUnique({
        where: { slug: userSchoolSlug },
        select: { id: true, name: true },
      });

      if (!existingSchool) {
        // Create the school automatically
        const newSchool = await prismaClient.school.create({
          data: {
            slug: userSchoolSlug,
            name: `${
              userSchoolSlug.charAt(0).toUpperCase() + userSchoolSlug.slice(1)
            } School`,
            email: `admin@${userSchoolSlug}.com`,
          },
        });
        schoolId = newSchool.id;
      } else {
        schoolId = existingSchool.id;
      }
    }

    // Handle student slot count request
    if (student && daypackage) {
      try {
        const studentId = student === "new" ? undefined : parseInt(student);
        const slotCount = await prismaClient.wpos_ustaz_occupied_times.count({
          where: {
            student_id: studentId,
            daypackage: daypackage,
            ...(schoolId ? { schoolId } : { schoolId: null }),
          },
        });

        return NextResponse.json({ slotCount: 0 });
      } catch (error) {
        return NextResponse.json({ slotCount: 0 });
      }
    }

    if (id) {
      const registration = (await prismaClient.wpos_wpdatatable_23.findUnique({
        where: {
          wdt_ID: parseInt(id),
          ...(schoolId ? { schoolId } : { schoolId: null }),
        },
        select: {
          wdt_ID: true,
          name: true,
          phoneno: true,
          classfee: true,
          classfeeCurrency: true,
          startdate: true,
          u_control: true,
          ustaz: true,
          package: true,
          subject: true,
          country: true,
          daypackages: true,
          refer: true,
          registrationdate: true,
          status: true,
          chatId: true,
          reason: true,
          occupiedTimes: {
            where: { end_at: null },
            select: { time_slot: true, daypackage: true },
          },
        },
      })) as any;

      if (!registration) {
        return NextResponse.json(
          { message: "Registration not found" },
          { status: 404 }
        );
      }

      // Get teacher name if ustaz exists
      if (registration.ustaz) {
        try {
          const teacher = await prismaClient.wpos_wpdatatable_24.findUnique({
            where: { ustazid: registration.ustaz },
            select: { ustazname: true },
          });
          registration.ustazname =
            teacher?.ustazname || registration.ustaz || "Not assigned";
        } catch (error) {
          registration.ustazname = registration.ustaz || "Not assigned";
        }
      } else {
        registration.ustazname = "Not assigned";
      }

      // Get the time slot from occupied times and convert to display format
      const dbTimeSlot = registration.occupiedTimes?.[0]?.time_slot;
      const displayTime = dbTimeSlot
        ? fromDbFormat(dbTimeSlot) || dbTimeSlot
        : null;

      return NextResponse.json({
        ...registration,
        selectedTime: displayTime, // Convert from database format
      });
    }

    // Get all registrations based on user role
    let whereClause: any = { name: { not: "" } };

    if (session.role === "controller") {
      whereClause = { ...whereClause, u_control: session.code };
    } else if (session.role === "registral") {
      // For registral users, show all students (they manage all registrations)
      // Optionally filter by rigistral field if needed
      // whereClause = { ...whereClause, rigistral: session.username };
    }

    // Add school filtering
    const finalWhereClause = {
      ...whereClause,
      ...(schoolId ? { schoolId } : { schoolId: null }),
    };

    const registrations = await prismaClient.wpos_wpdatatable_23.findMany({
      where: finalWhereClause,
      select: {
        wdt_ID: true,
        name: true,
        phoneno: true,
        classfee: true,
        startdate: true,
        ustaz: true,
        package: true,
        subject: true,
        daypackages: true,
        status: true,
        registrationdate: true,
      },
      orderBy: {
        registrationdate: "desc",
      },
    });

    return NextResponse.json(registrations);
  } catch (error) {
    console.error("Error fetching registrations:", error);
    return NextResponse.json(
      { error: "Failed to fetch registrations" },
      { status: 500 }
    );
  }
}

// PUT method for updating registrations
export async function PUT(request: NextRequest) {
  try {
    const session = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { message: "Registration ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      phoneNumber,
      parentPhone,
      classfee,
      classfeeCurrency,
      startdate,
      status,
      ustaz,
      package: regionPackage,
      subject,
      country,
      daypackages: selectedDayPackage,
      refer,
      selectedTime,
      registrationdate,
      chatId,
      reason,
      subscriptionPackageConfigId,
      schoolSlug,
    } = body;

    // Derive schoolId for multi-tenancy based on user's school association
    const userSchoolSlug = session.schoolSlug || "darulkubra";

    // Determine schoolId - create school if it doesn't exist for non-darulkubra
    let schoolId = userSchoolSlug === "darulkubra" ? null : userSchoolSlug;

    if (schoolId && userSchoolSlug !== "darulkubra") {
      // Check if school exists, create if not
      const existingSchool = await prismaClient.school.findUnique({
        where: { slug: userSchoolSlug },
        select: { id: true, name: true },
      });

      if (!existingSchool) {
        // Create the school automatically
        const newSchool = await prismaClient.school.create({
          data: {
            slug: userSchoolSlug,
            name: `${
              userSchoolSlug.charAt(0).toUpperCase() + userSchoolSlug.slice(1)
            } School`,
            email: `admin@${userSchoolSlug}.com`,
          },
        });
        schoolId = newSchool.id;
      } else {
        schoolId = existingSchool.id;
      }
    }

    const existingRegistration =
      (await prismaClient.wpos_wpdatatable_23.findUnique({
        where: {
          wdt_ID: parseInt(id),
          ...(schoolId ? { schoolId } : { schoolId: null }),
        },
        select: {
          u_control: true,
          userId: true,
          ustaz: true,
          daypackages: true,
          rigistral: true,
          classfeeCurrency: true,
          status: true,
          subscriptionPackageConfigId: true,
        },
      })) as any;

    if (!existingRegistration) {
      return NextResponse.json(
        { message: "Registration not found" },
        { status: 404 }
      );
    }

    // Role-based authorization
    if (session.role === "controller") {
      if (existingRegistration.u_control !== session.code) {
        return NextResponse.json(
          { message: "Unauthorized to update this registration" },
          { status: 403 }
        );
      }
    } else if (session.role === "registral") {
      if (existingRegistration.rigistral !== session.username) {
        return NextResponse.json(
          { message: "Unauthorized to update this registration" },
          { status: 403 }
        );
      }
    }

    // Basic validation
    if (!fullName || fullName.trim() === "") {
      return NextResponse.json(
        { message: "Full name is required" },
        { status: 400 }
      );
    }
    if (!phoneNumber || phoneNumber.trim() === "") {
      return NextResponse.json(
        { message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Role-based validation
    if (session.role === "registral") {
      // For registral users - simplified validation
      // Only require teacher and time if status is not "On Progress"
      if (status !== "On Progress" && status !== "on progress") {
        if (!ustaz || ustaz.trim() === "") {
          return NextResponse.json(
            { message: "Teacher is required" },
            { status: 400 }
          );
        }
        if (!selectedTime || selectedTime.trim() === "") {
          return NextResponse.json(
            { message: "Selected time is required" },
            { status: 400 }
          );
        }
      }
    } else {
      // For admin/controller - require teacher and time for non-"On Progress" statuses
      if (status !== "On Progress" && status !== "on progress") {
        if (!ustaz || ustaz.trim() === "") {
          return NextResponse.json(
            { message: "Teacher is required" },
            { status: 400 }
          );
        }
        if (!selectedTime || selectedTime.trim() === "") {
          return NextResponse.json(
            { message: "Selected time is required" },
            { status: 400 }
          );
        }
      }
    }

    // If ustaz is provided, validate it exists
    if (ustaz && ustaz.trim() !== "") {
      const teacherExists = await prismaClient.wpos_wpdatatable_24.findUnique({
        where: { ustazid: ustaz },
        select: { ustazid: true },
      });

      if (!teacherExists) {
        return NextResponse.json(
          { message: `Teacher with ID ${ustaz} does not exist` },
          { status: 400 }
        );
      }
    }

    let timeToMatch: string = "",
      timeSlot: string = "";
    let newStatus = status
      ? status.toLowerCase() === "not yet"
        ? "Not yet"
        : status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
      : existingRegistration.status || "Not yet";

    // Only validate time and check availability if not "On Progress"
    if (
      status !== "On Progress" &&
      status !== "on progress" &&
      selectedTime &&
      ustaz
    ) {
      // Validate time format
      if (!validateTime(selectedTime)) {
        return NextResponse.json(
          { message: `Invalid time format: ${selectedTime}` },
          { status: 400 }
        );
      }

      timeToMatch = to24Hour(selectedTime);
      timeSlot = to12Hour(timeToMatch);

      // Check teacher availability (exclude current student)
      const availability = await checkTeacherAvailability(
        timeToMatch,
        selectedDayPackage || "",
        ustaz,
        parseInt(id),
        schoolId
      );

      if (!availability.isAvailable) {
        return NextResponse.json(
          { message: availability.message },
          { status: 400 }
        );
      }
    }

    // Only check time slot availability if we have both teacher and time
    if (ustaz && selectedTime && timeSlot) {
      // Check if the selected time slot is available for the teacher
      const isTimeSlotAvailable =
        await prismaClient.wpos_ustaz_occupied_times.findFirst({
          where: {
            ustaz_id: ustaz,
            OR: [
              { time_slot: timeSlot },
              { time_slot: toDbFormat(selectedTime) },
              { time_slot: timeToMatch },
            ],
            daypackage: selectedDayPackage || "",
            end_at: null, // Only active assignments
            student_id: { not: parseInt(id) }, // Exclude current student
            ...(schoolId ? { schoolId } : { schoolId: null }),
          },
        });

      if (isTimeSlotAvailable) {
        return NextResponse.json(
          { error: "This time slot is already occupied by another student" },
          { status: 400 }
        );
      }
    }

    const updatedRegistration = await prismaClient.$transaction(async (tx) => {
      // Determine the u_control value (controller assignment)
      let u_control = existingRegistration.u_control;

      if (session.role === "controller") {
        u_control = session.code;
      } else if (
        ustaz &&
        ustaz.trim() !== "" &&
        ustaz !== existingRegistration.ustaz
      ) {
        // Update controller assignment if teacher changed
        const teacher = await tx.wpos_wpdatatable_24.findUnique({
          where: { ustazid: ustaz },
          select: { control: true },
        });
        u_control = teacher?.control || null;
      }

      const updateData: any = {
        name: fullName,
        phoneno: phoneNumber,
        parent_phone: parentPhone || null,
        classfee:
          classfee !== undefined && classfee !== null
            ? parseFloat(classfee)
            : null,
        classfeeCurrency:
          classfeeCurrency || existingRegistration.classfeeCurrency || "ETB",
        startdate: startdate ? new Date(startdate) : null,
        u_control,
        status: newStatus,
        package: regionPackage || null,
        subject: subject || null,
        country: country || null,
        daypackages: selectedDayPackage || null,
        refer: refer || null,
        registrationdate: registrationdate
          ? new Date(registrationdate)
          : existingRegistration.registrationdate,
        userId: existingRegistration.userId,
        chatId: chatId || existingRegistration.chatId,
        reason: reason || existingRegistration.reason,
      };

      // Only update ustaz if it's provided and not empty
      if (ustaz && ustaz.trim() !== "") {
        updateData.ustaz = ustaz;
      }

      const registration = await tx.wpos_wpdatatable_23.update({
        where: { wdt_ID: parseInt(id) },
        data: updateData,
      });

      // Handle teacher assignment changes
      if (ustaz && selectedTime && timeSlot) {
        // Remove old assignments if teacher changed
        if (ustaz !== existingRegistration.ustaz) {
          await tx.wpos_ustaz_occupied_times.deleteMany({
            where: {
              student_id: parseInt(id),
              end_at: null,
              ...(schoolId ? { schoolId } : { schoolId: null }),
            },
          });
        }

        // Create or update occupied time record
        // First try to find existing record
        const existingOccupiedTime =
          await tx.wpos_ustaz_occupied_times.findFirst({
            where: {
              ustaz_id: ustaz,
              student_id: parseInt(id),
              end_at: null,
              ...(schoolId ? { schoolId } : { schoolId: null }),
            },
          });

        if (existingOccupiedTime) {
          // Update existing record
          await tx.wpos_ustaz_occupied_times.update({
            where: { id: existingOccupiedTime.id },
            data: {
              time_slot: timeSlot,
              daypackage: selectedDayPackage || "",
            },
          });
        } else {
          // Create new record
          await tx.wpos_ustaz_occupied_times.create({
            data: {
              ustaz_id: ustaz,
              student_id: parseInt(id),
              time_slot: timeSlot,
              daypackage: selectedDayPackage || "",
              occupied_at: new Date(),
              end_at: null,
              schoolId: schoolId,
            },
          });
        }
      } else if (!ustaz || !selectedTime) {
        // Remove occupied times if teacher/time removed
        await tx.wpos_ustaz_occupied_times.deleteMany({
          where: {
            student_id: parseInt(id),
            end_at: null,
            ...(schoolId ? { schoolId } : { schoolId: null }),
          },
        });
      }

      // Assign subscription package config if provided
      if (subscriptionPackageConfigId !== undefined) {
        if (subscriptionPackageConfigId) {
          const configId = parseInt(String(subscriptionPackageConfigId));
          if (!isNaN(configId)) {
            // Check if config exists and is active
            const config = await tx.subscription_package_config.findUnique({
              where: { id: configId },
              select: { id: true, isActive: true },
            });

            if (config && config.isActive) {
              // Update student record with configId
              await tx.wpos_wpdatatable_23.update({
                where: { wdt_ID: parseInt(id) },
                data: { subscriptionPackageConfigId: configId },
              });
            } else {
              // Config doesn't exist or is inactive, set to null
              await tx.wpos_wpdatatable_23.update({
                where: { wdt_ID: parseInt(id) },
                data: { subscriptionPackageConfigId: null },
              });
            }
          } else {
            // Invalid configId, set to null
            await tx.wpos_wpdatatable_23.update({
              where: { wdt_ID: parseInt(id) },
              data: { subscriptionPackageConfigId: null },
            });
          }
        } else {
          // If subscriptionPackageConfigId is explicitly null/empty, remove the config
          await tx.wpos_wpdatatable_23.update({
            where: { wdt_ID: parseInt(id) },
            data: { subscriptionPackageConfigId: null },
          });
        }
      }

      return registration;
    });

    return NextResponse.json(
      {
        message: "Registration updated successfully",
        id: updatedRegistration.wdt_ID,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating registration:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update registration" },
      { status: 400 }
    );
  }
}