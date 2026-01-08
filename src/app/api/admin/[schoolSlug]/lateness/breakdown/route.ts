import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { format, addDays, isBefore } from "date-fns";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

function isValidAttendanceDay(dayPackage: string, date: Date): boolean {
  const day = date.getDay();
  if (!dayPackage) return true;
  if (dayPackage.toLowerCase().includes("all")) return true;
  if (dayPackage.includes("Monday") && day === 1) return true;
  if (dayPackage.includes("Tuesday") && day === 2) return true;
  if (dayPackage.includes("Wednesday") && day === 3) return true;
  if (dayPackage.includes("Thursday") && day === 4) return true;
  if (dayPackage.includes("Friday") && day === 5) return true;
  if (dayPackage.includes("Saturday") && day === 6) return true;
  if (dayPackage.includes("Sunday") && day === 0) return true;
  return false;
}

export async function GET(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const { searchParams } = url;
  const from = searchParams.get("from") || format(new Date(), "yyyy-MM-dd");
  const to = searchParams.get("to") || format(new Date(), "yyyy-MM-dd");
  const controllerId = searchParams.get("controllerId") || "";
  const teacherId = searchParams.get("teacherId") || "";

  if (!controllerId && !teacherId) {
    return NextResponse.json(
      { error: "controllerId or teacherId is required" },
      { status: 400 }
    );
  }

  const startDate = new Date(from);
  const endDate = new Date(to);
  endDate.setHours(23, 59, 59, 999);

  // Get package-specific deduction configurations
  const packageDeductions = await prisma.packageDeduction.findMany();
  const packageDeductionMap: Record<string, number> = {};
  packageDeductions.forEach((pkg) => {
    packageDeductionMap[pkg.packageName] = Number(pkg.latenessBaseAmount);
  });
  const defaultBaseDeductionAmount = 30;

  // Fetch lateness deduction config from DB
  const latenessConfigs = await prisma.latenessdeductionconfig.findMany({
    orderBy: [{ tier: "asc" }, { startMinute: "asc" }],
  });

  if (latenessConfigs.length === 0) {
    return NextResponse.json({ records: [], summary: null });
  }

  const excusedThreshold = Math.min(
    ...latenessConfigs.map((c) => c.excusedThreshold ?? 0)
  );
  const tiers = latenessConfigs.map((c) => ({
    start: c.startMinute,
    end: c.endMinute,
    percent: c.deductionPercent,
  }));
  const maxTierEnd = Math.max(...latenessConfigs.map((c) => c.endMinute));

  // Get all students
  const students = await prisma.wpos_wpdatatable_23.findMany({
    where: {
      status: { in: ["active", "not yet"] },
    },
    include: {
      teacher: true,
      controller: true,
      zoom_links: true,
      occupiedTimes: {
        select: {
          time_slot: true,
        },
      },
    },
  });

  const records: any[] = [];
  let totalLateness = 0;
  let totalDeduction = 0;
  let totalEvents = 0;

  // Enhanced statistics for controllers
  const teacherStats: Record<string, any> = {};
  const studentStats: Record<string, any> = {};
  const dailyStats: Record<string, any> = {};
  const uniqueTeachers = new Set<string>();
  const uniqueStudents = new Set<string>();

  function to24Hour(time12h: string) {
    if (!time12h) return "00:00";
    if (time12h.includes("AM") || time12h.includes("PM")) {
      const [time, modifier] = time12h.split(" ");
      let [hours, minutes] = time.split(":");
      if (hours === "12") hours = modifier === "AM" ? "00" : "12";
      else if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
      return `${hours.padStart(2, "0")}:${minutes}`;
    }
    if (time12h.includes(":")) {
      const parts = time12h.split(":");
      const hours = parts[0].padStart(2, "0");
      const minutes = (parts[1] || "00").padStart(2, "0");
      return `${hours}:${minutes}`;
    }
    return "00:00";
  }

  // Process each day - group by scheduled date
  for (let d = new Date(startDate); !isBefore(endDate, d); d = addDays(d, 1)) {
    const dateStr = format(d, "yyyy-MM-dd");
    for (const student of students) {
      const timeSlot = student.occupiedTimes?.[0]?.time_slot;
      if (!timeSlot || !student.ustaz) continue;

      // Apply filters
      if (controllerId && String(student.controller?.wdt_ID) !== controllerId)
        continue;
      if (teacherId && String(student.teacher?.ustazid) !== String(teacherId))
        continue;
      if (!isValidAttendanceDay(student.daypackages ?? "", d)) continue;

      const time24 = to24Hour(timeSlot);
      const scheduledTime = new Date(`${dateStr}T${time24}:00.000Z`);
      
      // Find the corresponding zoom link for this scheduled time
      // First, try to match zoom links on the exact same date (like analytics route)
      let sentTimes = (student.zoom_links || [])
        .filter(
          (zl) =>
            zl.sent_time &&
            format(zl.sent_time as Date, "yyyy-MM-dd") === dateStr
        )
        .map((zl) => zl.sent_time as Date)
        .sort((a, b) => a.getTime() - b.getTime());
      
      let actualStartTime: Date | null = sentTimes.length > 0 ? sentTimes[0] : null;
      
      // If no match on same date, check for late-night classes that might span to next day
      // Only look within 12 hours after scheduled time (for classes scheduled late at night)
      if (!actualStartTime) {
        const nextDayEnd = new Date(scheduledTime);
        nextDayEnd.setHours(nextDayEnd.getHours() + 12); // Only 12 hours after
        
        const lateNightLinks = (student.zoom_links || [])
          .filter(
            (zl) =>
              zl.sent_time &&
              zl.sent_time > scheduledTime &&
              zl.sent_time <= nextDayEnd
          )
          .map((zl) => ({
            sentTime: zl.sent_time as Date,
            timeDiff: (zl.sent_time as Date).getTime() - scheduledTime.getTime(),
          }))
          .sort((a, b) => a.timeDiff - b.timeDiff);
        
        // Only use if within 12 hours (720 minutes)
        if (lateNightLinks.length > 0 && lateNightLinks[0].timeDiff <= 12 * 60 * 60 * 1000) {
          actualStartTime = lateNightLinks[0].sentTime;
        }
      }
      
      if (!actualStartTime) continue;

      const latenessMinutes = Math.max(
        0,
        Math.round(
          (actualStartTime.getTime() - scheduledTime.getTime()) / 60000
        )
      );

      // Deduction logic
      let deductionApplied = 0;
      let deductionTier = "Excused";
      if (latenessMinutes > excusedThreshold) {
        const studentPackage = student.package || "";
        const baseDeductionAmount =
          packageDeductionMap[studentPackage] || defaultBaseDeductionAmount;

        let foundTier = false;
        for (const [i, tier] of tiers.entries()) {
          if (latenessMinutes >= tier.start && latenessMinutes <= tier.end) {
            deductionApplied = baseDeductionAmount * (tier.percent / 100);
            deductionTier = `Tier ${i + 1}`;
            foundTier = true;
            break;
          }
        }
        if (!foundTier && latenessMinutes > maxTierEnd) {
          deductionApplied = baseDeductionAmount;
          deductionTier = "> Max Tier";
        }
      }

      // Accumulate totals
      totalLateness += latenessMinutes;
      totalDeduction += deductionApplied;
      totalEvents++;

      // Track unique teachers and students
      if (student.teacher?.ustazid) {
        uniqueTeachers.add(String(student.teacher.ustazid));
      }
      uniqueStudents.add(String(student.wdt_ID));

      // Enhanced stats for controllers
      if (controllerId) {
        // Teacher statistics
        const tid = student.teacher?.ustazid;
        if (tid) {
          const teacherKey = String(tid);
          if (!teacherStats[teacherKey]) {
            teacherStats[teacherKey] = {
              teacherId: teacherKey,
              teacherName: student.teacher?.ustazname || "Unknown",
              totalLateness: 0,
              totalDeduction: 0,
              totalEvents: 0,
              students: new Set<string>(),
            };
          }
          teacherStats[teacherKey].totalLateness += latenessMinutes;
          teacherStats[teacherKey].totalDeduction += deductionApplied;
          teacherStats[teacherKey].totalEvents++;
          teacherStats[teacherKey].students.add(String(student.wdt_ID));
        }

        // Student statistics
        const studentKey = String(student.wdt_ID);
        if (!studentStats[studentKey]) {
          studentStats[studentKey] = {
            studentId: studentKey,
            studentName: student.name,
            teacherName: student.teacher?.ustazname || "Unknown",
            totalLateness: 0,
            totalDeduction: 0,
            totalEvents: 0,
          };
        }
        studentStats[studentKey].totalLateness += latenessMinutes;
        studentStats[studentKey].totalDeduction += deductionApplied;
        studentStats[studentKey].totalEvents++;

        // Daily statistics
        if (!dailyStats[dateStr]) {
          dailyStats[dateStr] = {
            date: dateStr,
            totalLateness: 0,
            totalDeduction: 0,
            totalEvents: 0,
          };
        }
        dailyStats[dateStr].totalLateness += latenessMinutes;
        dailyStats[dateStr].totalDeduction += deductionApplied;
        dailyStats[dateStr].totalEvents++;
      }

      // Add to records
      records.push({
        studentId: student.wdt_ID,
        studentName: student.name,
        teacherId: student.ustaz,
        teacherName: student.teacher?.ustazname || student.ustaz,
        controllerId: student.controller?.wdt_ID ?? null,
        controllerName: student.controller?.name ?? null,
        scheduledTime: scheduledTime.toISOString(),
        actualStartTime: actualStartTime.toISOString(),
        latenessMinutes,
        deductionApplied,
        deductionTier,
        date: dateStr,
        studentPackage: student.package || "",
      });
    }
  }

  // Sort records by date (newest first), then by lateness (highest first)
  records.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.latenessMinutes - a.latenessMinutes;
  });

  const averageLateness = totalEvents > 0 ? totalLateness / totalEvents : 0;

  const summary = {
    totalEvents,
    totalLateness,
    totalDeduction,
    averageLateness: Number.isFinite(averageLateness)
      ? Number(averageLateness.toFixed(2))
      : 0,
    controllerId: controllerId || null,
    teacherId: teacherId || null,
    // Enhanced stats for controllers
    ...(controllerId
      ? {
          uniqueTeachers: uniqueTeachers.size,
          uniqueStudents: uniqueStudents.size,
          teacherStatistics: Object.values(teacherStats).map((t: any) => ({
            ...t,
            students: Array.from(t.students).length,
            averageLateness:
              t.totalEvents > 0
                ? Number((t.totalLateness / t.totalEvents).toFixed(2))
                : 0,
          })),
          studentStatistics: Object.values(studentStats).map((s: any) => ({
            ...s,
            averageLateness:
              s.totalEvents > 0
                ? Number((s.totalLateness / s.totalEvents).toFixed(2))
                : 0,
          })),
          dailyStatistics: Object.values(dailyStats)
            .map((d: any) => ({
              ...d,
              averageLateness:
                d.totalEvents > 0
                  ? Number((d.totalLateness / d.totalEvents).toFixed(2))
                  : 0,
            }))
            .sort((a: any, b: any) => b.date.localeCompare(a.date)),
        }
      : {}),
  };

  return NextResponse.json({ records, summary });
}
