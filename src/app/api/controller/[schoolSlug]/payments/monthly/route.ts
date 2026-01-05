import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET monthly payments for a specific student
export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;
    let schoolId: string | null = schoolSlug === 'darulkubra' ? null : null; // Default to null for darulkubra

    // For non-darulkubra schools, look up the actual school ID
    if (schoolSlug !== 'darulkubra') {
      try {
        const school = await prisma.school.findUnique({
          where: { slug: schoolSlug },
          select: { id: true, name: true, slug: true }
        });
        schoolId = school?.id || null;
      } catch (error) {
        console.error("Error looking up school:", error);
        schoolId = null;
      }
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Get monthly payments for this student, but only if the student belongs to teachers assigned to this controller
    const monthlyPayments = await prisma.months_table.findMany({
      where: {
        studentid: parseInt(studentId),
        wpos_wpdatatable_23: {
          ustaz: {
            in: await prisma.wpos_wpdatatable_24.findMany({
              where: {
                control: session.code,
                ...(schoolId ? { schoolId } : { schoolId: null }),
              },
              select: { ustazid: true },
            }).then(teachers => teachers.map(t => t.ustazid))
          },
          ...(schoolId ? { schoolId } : { schoolId: null }),
        },
      },
      select: {
        id: true,
        studentid: true,
        month: true,
        paid_amount: true,
        payment_status: true,
        payment_type: true,
        start_date: true,
        end_date: true,
        free_month_reason: true,
        is_free_month: true,
        paymentId: true,
        source: true,
        providerReference: true,
        providerStatus: true,
      },
      orderBy: {
        month: "desc",
      },
    });

    // Transform the data to match the component's expected format
    const transformedPayments = monthlyPayments.map((payment: any) => ({
      id: payment.id,
      studentid: payment.studentid,
      month: payment.month,
      paid_amount: payment.paid_amount,
      payment_status: payment.payment_status,
      payment_type: payment.payment_type,
      start_date: payment.start_date?.toISOString().split('T')[0] || null,
      end_date: payment.end_date?.toISOString().split('T')[0] || null,
      free_month_reason: payment.free_month_reason,
      is_free_month: payment.is_free_month,
      paymentId: payment.paymentId,
      source: payment.source,
      providerReference: payment.providerReference,
      providerStatus: payment.providerStatus,
    }));

    return NextResponse.json(transformedPayments);
  } catch (error) {
    console.error("Controller monthly payments API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create a new monthly payment
export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    const {
      studentId,
      month,
      paidAmount,
      paymentStatus,
      paymentType,
      startDate,
      endDate,
      freeMonthReason,
      isFreeMonth,
    } = await req.json();

    // Verify the student belongs to teachers assigned to this controller
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parseInt(studentId) },
      select: {
        ustaz: true,
        schoolId: true,
        name: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Check if student's teacher is assigned to this controller
    const teacherAssigned = await prisma.wpos_wpdatatable_24.findFirst({
      where: {
        ustazid: student.ustaz,
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
    });

    if (!teacherAssigned) {
      return NextResponse.json({ error: "Unauthorized - student not assigned to your teachers" }, { status: 403 });
    }

    // Check if student belongs to the same school
    if ((schoolId === null && student.schoolId !== null) ||
        (schoolId !== null && student.schoolId !== schoolId)) {
      return NextResponse.json({ error: "Unauthorized - student belongs to different school" }, { status: 403 });
    }

    // Create the monthly payment
    const monthlyPayment = await prisma.months_table.create({
      data: {
        studentid: parseInt(studentId),
        month: month,
        paid_amount: parseInt(paidAmount),
        payment_status: paymentStatus || "Paid",
        payment_type: paymentType || "full",
        start_date: startDate ? new Date(startDate) : null,
        end_date: endDate ? new Date(endDate) : null,
        free_month_reason: freeMonthReason || null,
        is_free_month: isFreeMonth || false,
        source: "manual",
      },
    });

    return NextResponse.json(monthlyPayment);
  } catch (error) {
    console.error("Controller create monthly payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT update a monthly payment
export async function PUT(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    const {
      paymentId,
      paidAmount,
      paymentStatus,
      paymentType,
      freeMonthReason,
    } = await req.json();

    // Verify the monthly payment belongs to a student of this controller's teachers
    const monthlyPayment = await prisma.months_table.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        wpos_wpdatatable_23: true,
      },
    });

    if (!monthlyPayment) {
      return NextResponse.json({ error: "Monthly payment not found" }, { status: 404 });
    }

    // Check if student's teacher is assigned to this controller
    const teacherAssigned = await prisma.wpos_wpdatatable_24.findFirst({
      where: {
        ustazid: monthlyPayment.wpos_wpdatatable_23?.ustaz,
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
    });

    if (!teacherAssigned) {
      return NextResponse.json({ error: "Unauthorized - payment not accessible" }, { status: 403 });
    }

    // Update the monthly payment
    const updatedPayment = await prisma.months_table.update({
      where: { id: parseInt(paymentId) },
      data: {
        paid_amount: parseInt(paidAmount),
        payment_status: paymentStatus,
        payment_type: paymentType,
        free_month_reason: freeMonthReason || null,
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Controller update monthly payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a monthly payment
export async function DELETE(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  try {
    const session = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!session || session.role !== "controller") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schoolSlug = params.schoolSlug;
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json({ error: "Payment ID required" }, { status: 400 });
    }

    // Verify the monthly payment belongs to a student of this controller's teachers
    const monthlyPayment = await prisma.months_table.findUnique({
      where: { id: parseInt(paymentId) },
      include: {
        wpos_wpdatatable_23: true,
      },
    });

    if (!monthlyPayment) {
      return NextResponse.json({ error: "Monthly payment not found" }, { status: 404 });
    }

    // Check if student's teacher is assigned to this controller
    const teacherAssigned = await prisma.wpos_wpdatatable_24.findFirst({
      where: {
        ustazid: monthlyPayment.wpos_wpdatatable_23?.ustaz,
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
    });

    if (!teacherAssigned) {
      return NextResponse.json({ error: "Unauthorized - payment not accessible" }, { status: 403 });
    }

    // Delete the monthly payment
    await prisma.months_table.delete({
      where: { id: parseInt(paymentId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Controller delete monthly payment API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

