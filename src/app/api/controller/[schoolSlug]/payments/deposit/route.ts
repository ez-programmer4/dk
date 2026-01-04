import { NextResponse, NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET deposits for a specific student
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
    const schoolId = schoolSlug === 'darulkubra' ? null : schoolSlug;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    // Get deposits for this student, but only if the student belongs to teachers assigned to this controller
    const deposits = await prisma.payment.findMany({
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
        studentname: true,
        amount: true,
        paidamount: true,
        reason: true,
        transactionid: true,
        sendername: true,
        paymentdate: true,
        status: true,
        month: true,
        payment_type: true,
        payment_status: true,
        paymentmethod: true,
        source: true,
        providerReference: true,
        providerStatus: true,
        providerFee: true,
        currency: true,
        wpos_wpdatatable_23: {
          select: {
            classfeeCurrency: true,
          },
        },
      },
      orderBy: {
        paymentdate: "desc",
      },
    });

    // Transform the data to match the component's expected format
    const transformedDeposits = deposits.map((deposit: any) => ({
      id: deposit.id,
      studentid: deposit.studentid,
      studentname: deposit.studentname,
      amount: deposit.amount,
      paidamount: deposit.paidamount,
      reason: deposit.reason,
      transactionid: deposit.transactionid,
      sendername: deposit.sendername,
      paymentdate: deposit.paymentdate?.toISOString().split('T')[0] || '',
      status: deposit.status,
      month: deposit.month,
      payment_type: deposit.payment_type,
      payment_status: deposit.payment_status,
      paymentmethod: deposit.paymentmethod,
      source: deposit.source,
      providerReference: deposit.providerReference,
      providerStatus: deposit.providerStatus,
      providerFee: deposit.providerFee,
      currency: deposit.currency || deposit.wpos_wpdatatable_23?.classfeeCurrency || 'ETB',
    }));

    return NextResponse.json(transformedDeposits);
  } catch (error) {
    console.error("Controller deposits API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST create a new deposit
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
      amount,
      reason,
      transactionId,
      senderName,
      paymentDate,
      paymentMethod,
    } = await req.json();

    // Verify the student belongs to teachers assigned to this controller
    const student = await prisma.wpos_wpdatatable_23.findUnique({
      where: { wdt_ID: parseInt(studentId) },
      select: {
        ustaz: true,
        schoolId: true,
        name: true,
        classfeeCurrency: true,
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

    // Create the deposit
    const deposit = await prisma.payment.create({
      data: {
        studentid: parseInt(studentId),
        studentname: student.name,
        amount: parseFloat(amount),
        paidamount: parseFloat(amount),
        reason: reason || "deposit",
        transactionid: transactionId,
        sendername: senderName,
        paymentdate: paymentDate ? new Date(paymentDate) : new Date(),
        status: "Paid",
        paymentmethod: paymentMethod,
        source: "manual",
        currency: student.classfeeCurrency || "ETB",
      },
    });

    return NextResponse.json(deposit);
  } catch (error) {
    console.error("Controller create deposit API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE a deposit
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
    const depositId = searchParams.get("depositId");

    if (!depositId) {
      return NextResponse.json({ error: "Deposit ID required" }, { status: 400 });
    }

    // Verify the deposit belongs to a student of this controller's teachers
    const deposit = await prisma.payment.findUnique({
      where: { id: parseInt(depositId) },
      include: {
        wpos_wpdatatable_23: {
          include: {
            teacher: true,
          },
        },
      },
    });

    if (!deposit) {
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    }

    // Check if student's teacher is assigned to this controller
    const teacherAssigned = await prisma.wpos_wpdatatable_24.findFirst({
      where: {
        ustazid: deposit.wpos_wpdatatable_23?.ustaz,
        control: session.code,
        ...(schoolId ? { schoolId } : { schoolId: null }),
      },
    });

    if (!teacherAssigned) {
      return NextResponse.json({ error: "Unauthorized - deposit not accessible" }, { status: 403 });
    }

    // Delete the deposit
    await prisma.payment.delete({
      where: { id: parseInt(depositId) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Controller delete deposit API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
