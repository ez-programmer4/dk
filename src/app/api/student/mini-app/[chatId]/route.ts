import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { chatId } = resolvedParams;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const listOnly = searchParams.get("list") === "true";

    // Helper function to get currency (defined early for use in list endpoint)
    const getCurrency = (curr: string | null | undefined): string => {
      // If value is explicitly null or undefined, use ETB
      if (curr === null || curr === undefined) {
        return "ETB";
      }
      // If not a string, use ETB
      if (typeof curr !== "string") {
        return "ETB";
      }
      // Trim and check if empty
      const trimmed = curr.trim();
      if (trimmed === "" || trimmed.toLowerCase() === "null") {
        return "ETB";
      }
      // Return uppercase version
      return trimmed.toUpperCase();
    };

    // If listOnly is true, return just the list of students for this chatId
    if (listOnly) {
      const students = await prisma.wpos_wpdatatable_23.findMany({
        where: { chatId: chatId },
        select: {
          wdt_ID: true,
          name: true,
          package: true,
          subject: true,
          classfee: true,
          classfeeCurrency: true,
          daypackages: true,
          status: true,
          startdate: true,
          teacher: {
            select: {
              ustazname: true,
            },
          },
        },
        orderBy: { name: "asc" },
      });

      return NextResponse.json({
        success: true,
        students: students.map((s) => {
          // Calculate inclusion/exclusion for each student
          const dayPackages = s.daypackages ? s.daypackages.split(',').map(d => d.trim()) : [];
          const totalDaysInWeek = 7;
          const includedDays = dayPackages.length;
          const excludedDays = totalDaysInWeek - includedDays;
          
          return {
            id: s.wdt_ID,
            name: s.name,
            package: s.package,
            subject: s.subject,
            teacher: s.teacher?.ustazname || "Not assigned",
            currency: getCurrency(s.classfeeCurrency),
            dayPackages: dayPackages,
            inclusion: `${includedDays} days`,
            exclusion: `${excludedDays} days excluded`,
          };
        }),
      });
    }

    // Find student by chatId and optionally studentId
    // IMPORTANT: If studentId is provided, it MUST match - this prevents wrong student data
    const whereClause: any = { chatId: chatId };
    if (studentId) {
      const parsedStudentId = Number(studentId);
      if (isNaN(parsedStudentId)) {
        return NextResponse.json(
          { error: "Invalid studentId parameter" },
          { status: 400 }
        );
      }
      whereClause.wdt_ID = parsedStudentId;
    }

    const student = await prisma.wpos_wpdatatable_23.findFirst({
      where: whereClause,
      select: {
        wdt_ID: true,
        name: true,
        package: true,
        subject: true,
        classfee: true,
        classfeeCurrency: true,
        daypackages: true,
        status: true,
        startdate: true,
        registrationdate: true,
        phoneno: true,
        country: true,
        subscriptionPackageConfigId: true,
        teacher: {
          select: {
            ustazname: true,
          },
        },
      },
    });

    if (!student) {
      // If studentId was provided but not found, give a more specific error
      if (studentId) {
        return NextResponse.json(
          {
            error: `Student with ID ${studentId} not found for this chatId`,
            hint: "Make sure the studentId matches a student associated with this chatId",
          },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "No student found for this chatId" },
        { status: 404 }
      );
    }

    // Additional validation: If studentId was provided, verify it matches
    if (studentId && Number(studentId) !== student.wdt_ID) {
      return NextResponse.json(
        {
          error: "Student ID mismatch",
          provided: studentId,
          found: student.wdt_ID,
        },
        { status: 400 }
      );
    }

    // Status check removed - allow all students to access data

    // Get attendance data from student_attendance_progress (this month)
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Also keep thirtyDaysAgo for zoom sessions and tests
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await prisma.student_attendance_progress.findMany(
      {
        where: {
          student_id: student.wdt_ID,
          date: {
            gte: firstDayOfMonth,
            lte: lastDayOfMonth,
          },
        },
        select: {
          date: true,
          attendance_status: true,
          surah: true,
          lesson: true,
          pages_read: true,
          level: true,
          notes: true,
        },
        orderBy: { date: "desc" },
      }
    );

    const presentDays = attendanceRecords.filter(
      (record) => record.attendance_status === "Present"
    ).length;
    const permissionDays = attendanceRecords.filter(
      (record) => record.attendance_status === "Permission"
    ).length;
    const absentDays = attendanceRecords.filter(
      (record) => record.attendance_status === "Absent"
    ).length;
    const totalDays = presentDays + permissionDays + absentDays;
    const effectivePresentDays = presentDays + permissionDays;
    // Calculate attendance percent based on actual days in month, not just records
    const daysInMonth = lastDayOfMonth.getDate();
    const attendancePercent = daysInMonth > 0 ? Math.round((effectivePresentDays / daysInMonth) * 100) : 0;

    // Get zoom sessions (last 30 days)
    const zoomSessions = await prisma.wpos_zoom_links.findMany({
      where: {
        studentid: student.wdt_ID,
        sent_time: { gte: thirtyDaysAgo },
      },
      select: {
        sent_time: true,
        ustazid: true,
        wpos_wpdatatable_24: {
          select: {
            ustazname: true,
          },
        },
      },
      orderBy: { sent_time: "desc" },
    });

    // Get test results (last 30 days)
    const testAppointments = await prisma.testappointment.findMany({
      where: {
        studentId: student.wdt_ID,
        date: { gte: thirtyDaysAgo },
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            passingResult: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });

    // Get test results for these appointments - filter out null testquestion
    // Use raw query or filter to handle cases where testquestion might be null
    const allTestResults = await prisma.testresult.findMany({
      where: {
        studentId: student.wdt_ID,
      },
      select: {
        result: true,
        questionId: true,
        testquestion: {
          select: {
            testId: true,
          },
        },
      },
    });

    // Filter out results where testquestion is null (handles orphaned records)
    const testResults = allTestResults.filter((tr) => tr.testquestion !== null);

    // Calculate test performance
    const testPerformance = testAppointments.map((appointment) => {
      const results = testResults.filter(
        (result) => result.testquestion.testId === appointment.test.id
      );

      const correctAnswers = results.filter((r) => r.result > 0).length;
      const totalQuestions = results.length;
      const score =
        totalQuestions > 0
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;
      const passed = score >= appointment.test.passingResult;

      return {
        testName: appointment.test.name,
        date: appointment.date,
        score,
        passed,
        passingResult: appointment.test.passingResult,
      };
    });

    const passedTests = testPerformance.filter((test) => test.passed).length;
    const averageScore =
      testPerformance.length > 0
        ? Math.round(
            testPerformance.reduce((sum, test) => sum + test.score, 0) /
              testPerformance.length
          )
        : 0;

    // Get occupied times/scheduled times
    const occupiedTimes = await prisma.wpos_ustaz_occupied_times.findMany({
      where: {
        student_id: student.wdt_ID,
        end_at: null, // Only get active assignments
      },
      select: {
        time_slot: true,
        daypackage: true,
        occupied_at: true,
        end_at: true,
        teacher: {
          select: {
            ustazname: true,
          },
        },
      },
      orderBy: { occupied_at: "desc" },
    });

    // Get payment data - include ALL payments (deposits, subscriptions, etc.)
    const deposits = await prisma.payment.findMany({
      where: {
        studentid: student.wdt_ID,
      },
      select: {
        id: true,
        paidamount: true,
        reason: true,
        paymentdate: true,
        status: true,
        transactionid: true,
        source: true,
        intent: true,
        currency: true,
        subscriptionId: true,
      },
      orderBy: { paymentdate: "desc" },
    });

    // Get monthly payments from months_table - include ALL entries
    const monthlyPayments = await prisma.months_table.findMany({
      where: {
        studentid: student.wdt_ID,
      },
      select: {
        id: true,
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
      },
      orderBy: { month: "desc" },
    });

    // Debug: Log payment counts and details
    console.log(
      `[StudentMiniApp] Student ${student.wdt_ID} - Payment counts:`,
      {
        totalDeposits: deposits.length,
        subscriptionPayments: deposits.filter(
          (d) => d.intent === "subscription"
        ).length,
        approvedDeposits: deposits.filter((d) => d.status === "Approved")
          .length,
        totalMonthlyPayments: monthlyPayments.length,
        paidMonthlyPayments: monthlyPayments.filter(
          (p) => p.payment_status === "Paid"
        ).length,
        subscriptionMonthlyPayments: monthlyPayments.filter(
          (p) => p.source === "stripe" && p.payment_type === "auto"
        ).length,
        depositDetails: deposits.map((d) => ({
          id: d.id,
          amount: d.paidamount,
          reason: d.reason,
          date: d.paymentdate,
          transactionId: d.transactionid,
        })),
      }
    );

    // Calculate payment summary
    // Include ALL approved payments (deposits, subscriptions, etc.)
    const totalDeposits = deposits
      .filter((d) => d.status === "Approved")
      .reduce((sum, d) => sum + Number(d.paidamount), 0);

    // Include ALL paid monthly payments (including subscription months)
    const totalMonthlyPayments = monthlyPayments
      .filter((p) => p.payment_status === "Paid" && p.payment_type !== "free")
      .reduce((sum, p) => sum + Number(p.paid_amount), 0);

    const remainingBalance = totalDeposits - totalMonthlyPayments;

    // Get paid and unpaid months
    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const paidMonths = monthlyPayments.filter(
      (p) => p.payment_status === "Paid" || p.is_free_month
    );

    // Generate all months from student start date to current month
    const allExpectedMonths: string[] = [];
    if (student.startdate) {
      const startDate = new Date(student.startdate);
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const currentMonthNum = currentDate.getMonth();

      for (let year = startYear; year <= currentYear; year++) {
        const monthStart = year === startYear ? startMonth : 0;
        const monthEnd = year === currentYear ? currentMonthNum : 11;

        for (let month = monthStart; month <= monthEnd; month++) {
          const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
          allExpectedMonths.push(monthStr);
        }
      }
    }

    // Create a map of existing monthly payments by month
    const existingPaymentsByMonth = new Map(
      monthlyPayments.map((p) => [p.month, p])
    );

    // Build unpaid months list
    const unpaidMonthsList: Array<{
      month: string;
      paidAmount: number;
      expectedAmount: number;
      status: string;
      paymentId: number | null;
    }> = [];

    for (const month of allExpectedMonths) {
      const existingPayment = existingPaymentsByMonth.get(month);
      const expectedAmount = Number(student.classfee || 0);

      if (!existingPayment) {
        // Month doesn't exist in months_table - it's unpaid
        unpaidMonthsList.push({
          month,
          paidAmount: 0,
          expectedAmount,
          status: "Unpaid",
          paymentId: null,
        });
      } else if (
        existingPayment.payment_status !== "Paid" &&
        !existingPayment.is_free_month
      ) {
        // Month exists but is not paid and not free
        const paidAmount = Number(existingPayment.paid_amount || 0);
        unpaidMonthsList.push({
          month,
          paidAmount,
          expectedAmount,
          status: existingPayment.payment_status,
          paymentId: existingPayment.paymentId,
        });
      }
    }

    // Also include any months from months_table that are unpaid but not in the expected range
    const existingUnpaidMonths = monthlyPayments.filter(
      (p) => p.payment_status !== "Paid" && !p.is_free_month
    );
    for (const payment of existingUnpaidMonths) {
      if (payment.month && !allExpectedMonths.includes(payment.month)) {
        unpaidMonthsList.push({
          month: payment.month as string,
          paidAmount: Number(payment.paid_amount || 0),
          expectedAmount: Number(student.classfee || 0),
          status: payment.payment_status,
          paymentId: payment.paymentId,
        });
      }
    }

    // Sort unpaid months by month (earliest first)
    unpaidMonthsList.sort((a, b) => a.month.localeCompare(b.month));

    const unpaidMonths = unpaidMonthsList;

    // Get Terbia progress
    const subjectPackages = await prisma.subjectPackage.findMany({
      select: {
        subject: true,
        kidpackage: true,
        packageType: true,
        packageId: true,
      },
      distinct: ["subject", "kidpackage", "packageType"],
    });

    const matchedSubjectPackage = subjectPackages.find(
      (sp) =>
        sp.subject === student.package &&
        sp.packageType === student.package &&
        sp.kidpackage === false // Assuming not kid package for now
    );

    let terbiaProgress = null;
    if (matchedSubjectPackage) {
      // Get student progress for this package
      const chapters = await prisma.chapter.findMany({
        where: { course: { packageId: matchedSubjectPackage.packageId } },
        select: { id: true },
      });

      const progress = await prisma.studentProgress.findMany({
        where: {
          studentId: student.wdt_ID,
          chapterId: { in: chapters.map((ch) => ch.id) },
        },
        select: { isCompleted: true },
      });

      const completedChapters = progress.filter((p) => p.isCompleted).length;
      const totalChapters = chapters.length;
      const progressPercent =
        totalChapters > 0
          ? Math.round((completedChapters / totalChapters) * 100)
          : 0;

      terbiaProgress = {
        courseName: matchedSubjectPackage.packageType,
        progressPercent,
        completedChapters,
        totalChapters,
      };
    }

    const studentCurrency = getCurrency(student.classfeeCurrency);

    // Prepare response
    const studentData = {
      student: {
        wdt_ID: student.wdt_ID,
        name: student.name,
        package: student.package,
        subject: student.subject,
        classfee: student.classfee,
        classfeeCurrency: studentCurrency,
        daypackages: student.daypackages,
        startdate: student.startdate,
        registrationdate: student.registrationdate,
        status: student.status,
        phoneno: student.phoneno,
        country: student.country,
        teacher: student.teacher?.ustazname || "Not assigned",
      },
      stats: {
        attendancePercent,
        totalZoomSessions: zoomSessions.length,
        testsThisMonth: testPerformance.length,
        terbiaProgress: terbiaProgress?.progressPercent || 0,
      },
      attendance: {
        presentDays,
        permissionDays,
        absentDays,
        totalDays,
        thisMonth: attendanceRecords.map((record) => ({
          date: record.date.toISOString().split("T")[0],
          status: record.attendance_status.toLowerCase() as
            | "present"
            | "absent"
            | "permission",
          surah: record.surah,
          lesson: record.lesson,
          pagesRead: record.pages_read,
          level: record.level,
          notes: record.notes,
        })),
      },
      recentTests: testPerformance.slice(0, 5),
      terbia: terbiaProgress,
      recentZoomSessions: zoomSessions.slice(0, 5).map((session) => ({
        date: session.sent_time?.toISOString().split("T")[0] || "Unknown",
        teacher: session.wpos_wpdatatable_24?.ustazname || "Unknown",
      })),
      occupiedTimes: occupiedTimes.slice(0, 10).map((time) => {
        // Convert 24-hour format to 12-hour format
        const convertTo12Hour = (timeStr: string) => {
          if (!timeStr) return "Unknown";

          // Handle different time formats
          let time = timeStr;

          // If it's just time (HH:MM), add a date for parsing
          if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
            time = `2000-01-01 ${timeStr}`;
          }

          try {
            const date = new Date(time);
            if (isNaN(date.getTime())) return timeStr;

            return date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            });
          } catch {
            return timeStr;
          }
        };

        return {
          timeSlot: convertTo12Hour(time.time_slot),
          dayPackage: time.daypackage,
          occupiedAt:
            time.occupied_at?.toISOString().split("T")[0] || "Unknown",
          endAt: time.end_at?.toISOString().split("T")[0] || null,
          teacher: time.teacher?.ustazname || "Unknown",
        };
      }),
      payments: {
        summary: {
          totalDeposits,
          totalMonthlyPayments,
          remainingBalance,
          paidMonths: paidMonths.length,
          unpaidMonths: unpaidMonths.length,
          currency: studentCurrency,
        },
        deposits: deposits.slice(0, 10).map((deposit) => ({
          id: deposit.id,
          amount: Number(deposit.paidamount),
          reason: deposit.reason,
          date: deposit.paymentdate.toISOString().split("T")[0],
          status: deposit.status,
          transactionId: deposit.transactionid,
          source: deposit.source || "manual",
          intent: deposit.intent || "tuition",
          currency: deposit.currency || studentCurrency,
          subscriptionId: deposit.subscriptionId || null,
        })),
        monthlyPayments: monthlyPayments.slice(0, 12).map((payment) => ({
          id: payment.id,
          month: payment.month,
          amount: Number(payment.paid_amount),
          status: payment.payment_status,
          type: payment.payment_type,
          startDate: payment.start_date?.toISOString().split("T")[0] || null,
          endDate: payment.end_date?.toISOString().split("T")[0] || null,
          isFreeMonth: payment.is_free_month,
          freeReason: payment.free_month_reason,
          paymentId: payment.paymentId,
          currency: studentCurrency,
        })),
        paidMonths: paidMonths.map((payment) => ({
          month: payment.month,
          amount: Number(payment.paid_amount),
          type: payment.payment_type,
          isFreeMonth: payment.is_free_month,
          freeReason: payment.free_month_reason,
          paymentId: payment.paymentId,
          currency: studentCurrency,
        })),
        unpaidMonths: unpaidMonths.map((payment) => ({
          month: payment.month,
          amount: Number(payment.paidAmount),
          expectedAmount: Number(payment.expectedAmount),
          paidAmount: Number(payment.paidAmount),
          status: payment.status,
          paymentId: payment.paymentId,
          currency: studentCurrency,
        })),
      },
    };

    return NextResponse.json({
      success: true,
      data: studentData,
    });
  } catch (error) {
    console.error("Student mini app API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
