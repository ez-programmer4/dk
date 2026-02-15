import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TZ = "Asia/Riyadh";

export async function POST(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role: string }).role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
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
  const user = session.user as { id: string };
  const admin = await prisma.admin.findUnique({
    where: { id: user.id },
    select: { schoolId: true },
  });

  if (!admin || admin.schoolId !== school.id) {
    return NextResponse.json(
      { error: "Unauthorized access to school" },
      { status: 403 }
    );
  }

  try {
    const { adjustmentType, dateRange, teacherIds, timeSlots } =
      await req.json();

    if (!dateRange?.startDate || !dateRange?.endDate || !teacherIds?.length) {
      return NextResponse.json(
        { error: "Missing required fields: date range and at least one teacher are required" },
        { status: 400 }
      );
    }

    // Ensure teacherIds are strings to match database schema
    const teacherIdsArray = Array.isArray(teacherIds)
      ? teacherIds.map((id) => String(id))
      : [String(teacherIds)];

    // Normalize dates to start of day (UTC) for consistent comparison
    const startDate = new Date(dateRange.startDate);
    startDate.setUTCHours(0, 0, 0, 0);
    
    const endDate = new Date(dateRange.endDate);
    endDate.setUTCHours(23, 59, 59, 999); // Set to end of day to include the full day

    // Validate date range
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date range format" },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { error: "Start date must be before or equal to end date" },
        { status: 400 }
      );
    }
    const records: any[] = [];
    let totalAmount = 0;

    if (adjustmentType === "waive_absence") {
      // Use EXACT same logic as teacher payments API
      for (const teacherId of teacherIdsArray) {
        const teacher = await prisma.wpos_wpdatatable_24.findUnique({
          where: { ustazid: teacherId, schoolId: school.id },
          select: { ustazname: true },
        });

        if (!teacher) continue;

        // Get package deduction rates (same as teacher payments)
        const packageDeductions = await prisma.packageDeduction.findMany({
          where: { schoolId: school.id }
        });
        const packageDeductionMap: Record<
          string,
          { lateness: number; absence: number }
        > = {};
        packageDeductions.forEach((pkg) => {
          packageDeductionMap[pkg.packageName] = {
            lateness: Number(pkg.latenessBaseAmount),
            absence: Number(pkg.absenceBaseAmount),
          };
        });

        // Get ALL students assigned to this teacher (same as salary calculator)
        // IMPORTANT: Include students with ANY status - teacher should be evaluated for all students taught
        // even if student left mid-month (they should still get deductions for missed days before leaving)
        const currentStudents = await prisma.wpos_wpdatatable_23.findMany({
          where: {
            OR: [
              // Current assignments (any status)
              {
                ustaz: teacherId,
                // No status filter - include all students
                occupiedTimes: {
                  some: {
                    ustaz_id: teacherId,
                    schoolId: school.id,
                    occupied_at: { lte: endDate },
                    OR: [{ end_at: null }, { end_at: { gte: startDate } }],
                  },
                },
              },
              // Historical assignments from audit logs (any status)
              {
                // No status filter - include all students
                occupiedTimes: {
                  some: {
                    ustaz_id: teacherId,
                    schoolId: school.id,
                    occupied_at: { lte: endDate },
                    OR: [{ end_at: null }, { end_at: { gte: startDate } }],
                  },
                },
              },
            ],
          },
          include: {
            occupiedTimes: {
              where: {
                ustaz_id: teacherId,
                schoolId: school.id,
                occupied_at: { lte: endDate },
                OR: [{ end_at: null }, { end_at: { gte: startDate } }],
              },
              select: {
                time_slot: true,
                daypackage: true,
                occupied_at: true,
                end_at: true,
              },
            },
            zoom_links: {
              where: {
                ustazid: teacherId,
                // CRITICAL FIX: Don't filter by date range here
                // This was causing inconsistent results when different date ranges were used
                // The date filtering should only happen during the absence calculation loop
              },
              select: { sent_time: true },
            },
            attendance_progress: {
              where: {
                date: { gte: startDate, lte: endDate },
              },
              select: {
                date: true,
                attendance_status: true,
              },
            },
          },
        });

        // Get teacher change history for proper assignment validation
        const teacherChanges = await prisma.teacher_change_history.findMany({
          where: {
            schoolId: school.id,
            OR: [{ old_teacher_id: teacherId }, { new_teacher_id: teacherId }],
            change_date: {
              lte: endDate,
            },
          },
          select: {
            student_id: true,
            old_teacher_id: true,
            new_teacher_id: true,
            change_date: true,
          },
        });

        // Get existing absence records from database
        const teacherAbsenceRecords = await prisma.absencerecord.findMany({
          where: {
            teacherId,
            schoolId: school.id,
            classDate: { gte: startDate, lte: endDate },
          },
          orderBy: { classDate: "asc" },
        });

        // Get absence waivers
        const absenceWaivers = await prisma.deduction_waivers.findMany({
          where: {
            teacherId,
            schoolId: school.id,
            deductionType: "absence",
            deductionDate: { gte: startDate, lte: endDate },
          },
        });

        // Create a map of waived dates with their student details
        // Format: dateStr -> { waiver, studentNames: Set<string> }
        const waivedDatesMap = new Map<
          string,
          { waiver: any; studentNames: Set<string> }
        >();
        for (const waiver of absenceWaivers) {
          const dateStr = format(waiver.deductionDate, "yyyy-MM-dd");
          const studentDetails = waiver.reason.split("|")[1]?.trim() || "";
          const studentNames = new Set(
            studentDetails
              .replace(/^\d+\sstudent\(s\):\s*/, "") // Remove "N student(s): " prefix
              .split(";")
              .map((s) => s.trim().split("(")[0].trim())
              .filter(Boolean)
          );
          waivedDatesMap.set(dateStr, { waiver, studentNames });
        }
        const waivedDates = new Set(waivedDatesMap.keys());

        // Create a set of dates that already have absence records
        const existingAbsenceDates = new Set(
          teacherAbsenceRecords.map((record) =>
            format(record.classDate, "yyyy-MM-dd")
          )
        );

        // Add deductions from existing database records (not waived)
        for (const record of teacherAbsenceRecords) {
          const dateStr = format(record.classDate, "yyyy-MM-dd");
          if (!waivedDates.has(dateStr)) {
            records.push({
              id: `absence_db_${record.id}`,
              teacherId: record.teacherId,
              teacherName: teacher.ustazname,
              date: record.classDate,
              type: "Absence",
              deduction: record.deductionApplied,
              permitted: record.permitted,
              source: "database",
              details: record.permitted
                ? "Permitted absence (DB)"
                : "Unpermitted absence (DB)",
            });
            totalAmount += record.deductionApplied;
          }
        }

        // Check for additional computed absences (per-student logic like salary calculator)
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        // Get working days configuration
        const workingDaysConfig = await prisma.setting.findUnique({
          where: { key: "include_sundays_in_salary", schoolId: school.id },
        });
        const includeSundays = workingDaysConfig?.value === "true" || false;

        // Helper function to check if teacher is assigned to student on specific date
        const isTeacherAssignedOnDate = (
          studentId: number,
          date: Date,
          occupiedTimes: Array<{
            occupied_at: Date | null;
            end_at: Date | null;
          }>
        ): boolean => {
          // Get all teacher changes for this student, sorted by date
          const studentChanges = teacherChanges
            .filter((tc) => tc.student_id === studentId)
            .sort((a, b) => a.change_date.getTime() - b.change_date.getTime());

          if (studentChanges.length > 0) {
            // Find the most recent change before or on this date
            let currentTeacherOnDate: string | null = null;

            for (const change of studentChanges) {
              const changeDate = new Date(change.change_date);
              changeDate.setHours(0, 0, 0, 0);
              const checkDate = new Date(date);
              checkDate.setHours(0, 0, 0, 0);

              if (checkDate < changeDate) {
                // This change hasn't happened yet on checkDate
                // Use the old teacher if this is the first change
                if (studentChanges[0] === change && change.old_teacher_id) {
                  currentTeacherOnDate = change.old_teacher_id;
                }
                break;
              } else {
                // This change has happened by checkDate
                currentTeacherOnDate = change.new_teacher_id;
              }
            }

            return currentTeacherOnDate === teacherId;
          }

          // No teacher changes, check regular assignment period
          for (const ot of occupiedTimes) {
            const assignmentStart = ot.occupied_at
              ? new Date(ot.occupied_at)
              : null;
            const assignmentEnd = ot.end_at ? new Date(ot.end_at) : null;

            if (assignmentStart && date < assignmentStart) continue;
            if (assignmentEnd && date > assignmentEnd) continue;

            return true;
          }

          return false;
        };

        // Helper function to parse daypackage (EXACT same as salary calculator)
        const parseDaypackage = (dp: string): number[] => {
          if (!dp || dp.trim() === "") {
            return [];
          }

          const dpTrimmed = dp.trim().toUpperCase();

          // Common patterns
          if (dpTrimmed === "ALL DAYS" || dpTrimmed === "ALLDAYS") {
            return [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
          }
          if (dpTrimmed === "MWF") {
            return [1, 3, 5]; // Monday, Wednesday, Friday
          }
          if (dpTrimmed === "TTS" || dpTrimmed === "TTH") {
            return [2, 4, 6]; // Tuesday, Thursday, Saturday
          }

          // Day mapping
          const dayMap: Record<string, number> = {
            MONDAY: 1,
            MON: 1,
            TUESDAY: 2,
            TUE: 2,
            WEDNESDAY: 3,
            WED: 3,
            THURSDAY: 4,
            THU: 4,
            FRIDAY: 5,
            FRI: 5,
            SATURDAY: 6,
            SAT: 6,
            SUNDAY: 0,
            SUN: 0,
          };

          // Check for exact day match
          if (dayMap[dpTrimmed] !== undefined) {
            return [dayMap[dpTrimmed]];
          }

          // Check for numeric patterns
          const numericMatch = dpTrimmed.match(/\d+/g);
          if (numericMatch) {
            const days = numericMatch
              .map(Number)
              .filter((d) => d >= 0 && d <= 6);
            return days;
          }

          // Check for comma-separated days
          if (dpTrimmed.includes(",")) {
            const parts = dpTrimmed.split(",").map((p) => p.trim());
            const days: number[] = [];
            for (const part of parts) {
              const day = dayMap[part] ?? parseInt(part);
              if (!isNaN(day) && day >= 0 && day <= 6) {
                days.push(day);
              }
            }
            return days;
          }

          return [];
        };

        // Safe date iteration to avoid invalid dates like Sept 31st (EXACT same as salary calculator)
        // Fixed to handle single-date ranges correctly
        const safeDateIterator = (startDate: Date, endDate: Date) => {
          const dates: Date[] = [];
          const current = new Date(startDate);
          current.setUTCHours(0, 0, 0, 0); // Normalize to start of day
          
          const end = new Date(endDate);
          end.setUTCHours(0, 0, 0, 0); // Normalize to start of day for comparison

          while (current <= end) {
            // Validate the date to avoid invalid dates like Sept 31st
            const year = current.getUTCFullYear();
            const month = current.getUTCMonth();
            const day = current.getUTCDate();

            // Check if this is a valid date
            const testDate = new Date(Date.UTC(year, month, day));
            if (
              testDate.getUTCFullYear() === year &&
              testDate.getUTCMonth() === month &&
              testDate.getUTCDate() === day
            ) {
              dates.push(new Date(testDate));
            }

            // Move to next day safely in UTC
            current.setUTCDate(current.getUTCDate() + 1);
          }

          return dates;
        };

        const datesToProcess = safeDateIterator(startDate, endDate);

        for (const d of datesToProcess) {
          // Use UTC format for consistency with zoom link dates (EXACT same as salary calculator)
          const dateStr = d.toISOString().split("T")[0];
          const dayOfWeek = d.getUTCDay();
          const dayOfMonth = d.getUTCDate();

          // CRITICAL FIX: Skip 31st day from absence deductions
          // Timezone mismatch between UTC storage and Riyadh business hours
          if (dayOfMonth === 31) {
            continue; // No absence deductions for 31st day
          }

          // Skip Sunday unless configured to include
          if (dayOfWeek === 0 && !includeSundays) {
            continue;
          }

          // Skip if we already have a database record for this date
          if (existingAbsenceDates.has(dateStr)) continue;

          // Note: We don't skip the entire date if waived - we check per-student below
          // This allows some students to be waived while others on the same date are not

          // Check EACH student individually (per-student logic)
          let dailyDeduction = 0;
          const affectedStudents = [];

          // Check each student (EXACT same logic as salary calculator)
          for (const student of currentStudents) {
            // Check if teacher was actually assigned to this student on this date
            // considering teacher changes
            const isAssigned = isTeacherAssignedOnDate(
              student.wdt_ID,
              d,
              student.occupiedTimes || []
            );

            if (!isAssigned) {
              continue;
            }

            // Get relevant occupied times for daypackage checking
            const relevantOccupiedTimes = student.occupiedTimes.filter(
              (ot: any) => {
                const assignmentStart = ot.occupied_at
                  ? new Date(ot.occupied_at)
                  : null;
                const assignmentEnd = ot.end_at ? new Date(ot.end_at) : null;

                if (assignmentStart && d < assignmentStart) return false;
                if (assignmentEnd && d > assignmentEnd) return false;
                return true;
              }
            );

            // If no occupied times, check if student has zoom links during the period
            // If yes, assume they should be taught and check their daypackage
            if (relevantOccupiedTimes.length === 0) {
              // Check if student has any zoom links at all (not filtered by date range)
              // This ensures consistent student inclusion regardless of date range
              const hasZoomLinksInPeriod = student.zoom_links?.some(
                (link: any) => {
                  if (!link.sent_time) return false;
                  // Don't filter by date range here - this was causing inconsistent results
                  return true;
                }
              );

              if (!hasZoomLinksInPeriod) {
                continue;
              }

              // Student has zoom links but no occupied times - use all occupied times
              // This handles cases where occupied times might be missing
              if (student.occupiedTimes.length > 0) {
                relevantOccupiedTimes.push(...student.occupiedTimes);
              } else {
                continue;
              }
            }

            // Check if student is scheduled on this day
            let isScheduled = false;
            let scheduledDays: number[] = [];
            for (const ot of relevantOccupiedTimes) {
              const parsedDays = parseDaypackage(ot.daypackage || "");
              scheduledDays = [...new Set([...scheduledDays, ...parsedDays])];

              if (parsedDays.includes(dayOfWeek)) {
                isScheduled = true;
              }
            }

            // Fallback: if no daypackage at all but has zoom links, assume weekdays
            // Only apply fallback if scheduledDays is empty (no daypackage defined)
            if (
              !isScheduled &&
              scheduledDays.length === 0 &&
              student.zoom_links?.length > 0
            ) {
              isScheduled = dayOfWeek >= 1 && dayOfWeek <= 5;
            }

            if (!isScheduled) {
              continue;
            }

            // Check if student has zoom link for this date
            // Use UTC format for consistency (database stores in UTC)
            const hasZoomLink = student.zoom_links?.some((link: any) => {
              if (!link.sent_time) return false;
              const linkDate = new Date(link.sent_time);
              const linkDateStr = linkDate.toISOString().split("T")[0];
              return linkDateStr === dateStr;
            });

            if (hasZoomLink) continue;

            // Check if student has attendance permission for this date
            // Use UTC format for consistency
            const attendanceRecord = student.attendance_progress?.find(
              (att: any) => {
                if (!att.date) return false;
                const attDate = new Date(att.date);
                const attDateStr = attDate.toISOString().split("T")[0];
                return attDateStr === dateStr;
              }
            );

            if (attendanceRecord?.attendance_status === "Permission") {
              continue; // Skip deduction if student has permission
            }

            // Check if this specific student is covered by a waiver
            const waiverInfo = waivedDatesMap.get(dateStr);
            if (waiverInfo) {
              // Handle old-format waivers (no student details in reason)
              // If waiver exists but has no student names, it means it's an old format waiver
              // that covers all students on that date - skip this student
              if (waiverInfo.studentNames.size === 0) {
                // Old format waiver - skip this student
                continue;
              }
              
              // New format waiver with student details - check per-student
              const studentName = student.name || "";
              if (waiverInfo.studentNames.has(studentName)) {
                // This specific student is already covered by the waiver - skip
                continue;
              }
              // This student is not covered by the waiver - continue processing
            }

            // If scheduled but no zoom link and no permission = absence
            const packageRate = student.package
              ? packageDeductionMap[student.package]?.absence || 25
              : 25;
            dailyDeduction += packageRate;
            affectedStudents.push({
              name: student.name,
              package: student.package || "Unknown",
              rate: packageRate,
            });
          }

          if (dailyDeduction > 0) {
            // Add individual records for each affected student for better detail
            affectedStudents.forEach((affStudent) => {
              records.push({
                id: `absence_computed_${teacherId}_${dateStr}_${affStudent.name}`,
                teacherId,
                teacherName: teacher.ustazname,
                studentName: affStudent.name,
                studentPackage: affStudent.package,
                date: new Date(d),
                type: "Absence",
                deduction: affStudent.rate,
                permitted: false,
                source: "computed",
                affectedStudents: [affStudent], // Single student for this record
                details: `${affStudent.name} (${affStudent.package}): No zoom link sent - ${affStudent.rate} ETB`,
              });
            });
            totalAmount += dailyDeduction;
          }
        }
      }
    }

    if (adjustmentType === "waive_lateness") {
      // Use EXACT same logic as teacher payments API
      for (const teacherId of teacherIdsArray) {
        const teacher = await prisma.wpos_wpdatatable_24.findUnique({
          where: { ustazid: teacherId },
          select: { ustazname: true },
        });

        if (!teacher) continue;

        // Get package deduction rates
        const packageDeductions = await prisma.packageDeduction.findMany();
        const packageDeductionMap: Record<
          string,
          { lateness: number; absence: number }
        > = {};
        packageDeductions.forEach((pkg) => {
          packageDeductionMap[pkg.packageName] = {
            lateness: Number(pkg.latenessBaseAmount),
            absence: Number(pkg.absenceBaseAmount),
          };
        });

        // Get existing waivers
        const latenessWaivers = await prisma.deduction_waivers.findMany({
          where: {
            teacherId,
            deductionType: "lateness",
            deductionDate: { gte: startDate, lte: endDate },
            schoolId: school.id,
          },
        });

        const waivedLatenessDates = new Set(
          latenessWaivers.map((w) => format(w.deductionDate, "yyyy-MM-dd"))
        );

        const defaultBaseDeductionAmount = 30;

        const latenessConfigs = await prisma.latenessdeductionconfig.findMany({
          orderBy: [{ tier: "asc" }, { startMinute: "asc" }],
        });

        if (latenessConfigs.length > 0) {
          const excusedThreshold = Math.min(
            ...latenessConfigs.map((c) => c.excusedThreshold ?? 0)
          );
          const tiers = latenessConfigs.map((c) => ({
            start: c.startMinute,
            end: c.endMinute,
            percent: c.deductionPercent,
          }));

          // Get ALL students for this teacher (EXACT same filter as salary calculator)
          const allStudents = await prisma.wpos_wpdatatable_23.findMany({
            where: {
              OR: [
                // Current assignment (active or not yet)
                {
                  ustaz: teacherId,
                  status: { in: ["active", "Active", "Not yet", "not yet"] },
                },
                // Historical assignment via occupiedTimes (catches teacher changes)
                {
                  status: { in: ["active", "Active", "Not yet", "not yet"] },
                  occupiedTimes: {
                    some: {
                      ustaz_id: teacherId,
                    },
                  },
                },
              ],
            },
            select: {
              wdt_ID: true,
              name: true,
              package: true,
              zoom_links: true,
              occupiedTimes: { select: { time_slot: true } },
            },
          });

          // Group zoom links by date (same logic as teacher payments)
          const dailyZoomLinks = new Map();

          for (const student of allStudents) {
            student.zoom_links.forEach((link) => {
              if (link.sent_time) {
                const dateStr = format(link.sent_time, "yyyy-MM-dd");
                if (!dailyZoomLinks.has(dateStr)) {
                  dailyZoomLinks.set(dateStr, []);
                }
                dailyZoomLinks.get(dateStr).push({
                  ...link,
                  studentId: student.wdt_ID,
                  studentName: student.name,
                  timeSlot: student.occupiedTimes?.[0]?.time_slot,
                });
              }
            });
          }

          // Calculate lateness for each day (same logic as teacher payments)
          for (const [dateStr, links] of dailyZoomLinks.entries()) {
            const date = new Date(dateStr);
            if (date < startDate || date > endDate) continue;

            // Skip if already waived
            if (waivedLatenessDates.has(dateStr)) continue;

            // Group by student and take earliest link per student per day
            const studentLinks = new Map<number, any>();
            links.forEach((link: any) => {
              const key = link.studentId;
              if (
                !studentLinks.has(key) ||
                link.sent_time < studentLinks.get(key).sent_time
              ) {
                studentLinks.set(key, link);
              }
            });

            // Calculate lateness for each student's earliest link
            for (const link of studentLinks.values()) {
              if (!link.timeSlot) continue;

              // Filter by time slots if specified
              if (
                timeSlots &&
                timeSlots.length > 0 &&
                !timeSlots.includes(link.timeSlot)
              ) {
                continue;
              }

              // Convert time to 24-hour format
              function convertTo24Hour(timeStr: string): string {
                if (!timeStr) return "00:00";

                if (timeStr.includes("AM") || timeStr.includes("PM")) {
                  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);
                  if (match) {
                    let hour = parseInt(match[1]);
                    const minute = match[2];
                    const period = match[3].toUpperCase();

                    if (period === "PM" && hour !== 12) hour += 12;
                    if (period === "AM" && hour === 12) hour = 0;

                    return `${hour.toString().padStart(2, "0")}:${minute}`;
                  }
                }

                return timeStr.includes(":")
                  ? timeStr.split(":").slice(0, 2).join(":")
                  : "00:00";
              }

              const time24 = convertTo24Hour(link.timeSlot);
              const [schedHours, schedMinutes] = time24.split(":").map(Number);

              // Create scheduled time on the same day as sent_time
              // sent_time is stored as Ethiopia local time, so use same timezone
              const scheduledTime = new Date(link.sent_time);
              scheduledTime.setHours(schedHours, schedMinutes, 0, 0);

              // Calculate lateness in minutes
              const latenessMinutes = Math.round(
                (link.sent_time.getTime() - scheduledTime.getTime()) / 60000
              );

              // Skip if early (negative lateness)
              if (latenessMinutes < 0) continue;

              if (latenessMinutes > excusedThreshold) {
                let deduction = 0;
                let tier = "No Tier";

                // Get student's package for package-specific deduction
                const student = allStudents.find(
                  (s) => s.wdt_ID === link.studentId
                );
                const studentPackage = student?.package || "";
                const baseDeductionAmount =
                  packageDeductionMap[studentPackage]?.lateness ||
                  defaultBaseDeductionAmount;

                // Find appropriate tier
                for (const [i, t] of tiers.entries()) {
                  if (latenessMinutes >= t.start && latenessMinutes <= t.end) {
                    deduction = Math.round(
                      baseDeductionAmount * (t.percent / 100)
                    );
                    tier = `Tier ${i + 1} (${t.percent}%) - ${studentPackage}`;
                    break;
                  }
                }

                if (deduction > 0) {
                  records.push({
                    id: `lateness_${teacherId}_${dateStr}_${link.studentId}`,
                    teacherId,
                    teacherName: teacher.ustazname,
                    studentName: link.studentName,
                    studentId: link.studentId,
                    date: new Date(dateStr),
                    type: "Lateness",
                    deduction,
                    latenessMinutes,
                    timeSlot: link.timeSlot,
                    studentPackage,
                    tier,
                    details: `${latenessMinutes} min late, ${link.timeSlot}, ${studentPackage}`,
                  });
                  totalAmount += deduction;
                }
              }
            }
          }
        }
      }
    }

    // Calculate summary
    const teacherBreakdown = teacherIdsArray
      .map((teacherId: string) => {
        const teacherRecords = records.filter((r) => r.teacherId === teacherId);
        return {
          teacherId,
          teacherName: teacherRecords[0]?.teacherName || "Unknown",
          recordCount: teacherRecords.length,
          totalDeduction: teacherRecords.reduce(
            (sum, r) => sum + r.deduction,
            0
          ),
        };
      })
      .filter((t: any) => t.recordCount > 0);

    const summary = {
      totalRecords: records.length,
      totalTeachers: teacherBreakdown.length,
      totalAmount,
      totalLatenessAmount: records
        .filter((r) => r.type === "Lateness")
        .reduce((sum, r) => sum + r.deduction, 0),
      totalAbsenceAmount: records
        .filter((r) => r.type === "Absence")
        .reduce((sum, r) => sum + r.deduction, 0),
      teacherBreakdown,
    };

    return NextResponse.json({ records, summary });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview adjustments" },
      { status: 500 }
    );
  }
}
