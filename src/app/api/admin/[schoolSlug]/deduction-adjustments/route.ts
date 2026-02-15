import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Timezone: UTC+3 (Africa/Addis_Ababa or Asia/Riyadh)
const TZ = "Africa/Addis_Ababa";

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
    const {
      adjustmentType,
      dateRange,
      teacherIds,
      timeSlots,
      studentIds,
      reason,
    } = await req.json();

    // Ensure teacherIds is always an array of strings
    const teacherIdsArray = Array.isArray(teacherIds)
      ? teacherIds.map((id) => String(id))
      : [String(teacherIds)];

    if (
      !dateRange?.startDate ||
      !dateRange?.endDate ||
      !teacherIdsArray?.length ||
      !reason?.trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: date range, teachers, and reason are required",
        },
        { status: 400 }
      );
    }

    // Convert dates to UTC+3 timezone boundaries
    // When user selects a date like "2025-12-08", they mean that date in UTC+3
    // So we need to convert to UTC boundaries: 2025-12-07T21:00:00.000Z to 2025-12-08T20:59:59.999Z

    // Parse the input date string (assumed to be YYYY-MM-DD format or ISO string)
    // Extract just the date part (YYYY-MM-DD)
    const startDateStr = dateRange.startDate.split("T")[0];
    const endDateStr = dateRange.endDate.split("T")[0];

    // Create date objects representing start and end of day in UTC+3
    // Then convert to UTC for database queries
    // Start: 00:00:00 in UTC+3
    const startDateLocal = new Date(`${startDateStr}T00:00:00`);
    // End: 23:59:59.999 in UTC+3
    const endDateLocal = new Date(`${endDateStr}T23:59:59.999`);

    // Convert from UTC+3 to UTC for database queries
    // fromZonedTime treats the input as if it's in the specified timezone and converts to UTC
    const startDate = fromZonedTime(startDateLocal, TZ);
    const endDate = fromZonedTime(endDateLocal, TZ);

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

    // Reason validation - no minimum length required (any length is acceptable)

    const adminId = (session.user as { id: string }).id;

    let recordsAffected = 0;
    let totalAmountWaived = 0;
    // Track newly created waiver dates across all teachers to avoid duplicates
    const newlyCreatedWaiverDatesMap = new Map<string, Set<string>>(); // teacherId -> Set of date strings

    // DEBUG: Collect debug information to return to frontend
    const debugLogs: string[] = [];
    const addDebugLog = (message: string, data?: any) => {
      const logEntry = data
        ? `${message} ${JSON.stringify(data, null, 2)}`
        : message;
      debugLogs.push(logEntry);
      console.log(`[DEBUG] ${message}`, data || "");
    };

    // DEBUG: Log initial parameters - ALWAYS log this to verify system is working
    addDebugLog("=== DEDUCTION ADJUSTMENT REQUEST START ===");
    addDebugLog("Deduction Adjustment Request:", {
      adjustmentType,
      teacherIds: teacherIdsArray,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason: reason?.substring(0, 50),
      adminId,
    });

    const result = await prisma.$transaction(async (tx) => {
      if (adjustmentType === "waive_absence") {
        // Get absence records to waive
        const absenceRecords = await tx.absencerecord.findMany({
          where: {
            teacherId: { in: teacherIdsArray },
            classDate: { gte: startDate, lte: endDate },
          },
        });

        addDebugLog(`Found ${absenceRecords.length} database absence records`);

        if (absenceRecords.length > 0) {
          // Check for existing waivers first
          const existingWaivers = await tx.deduction_waivers.findMany({
            where: {
              teacherId: { in: teacherIdsArray },
              deductionType: "absence",
              deductionDate: { gte: startDate, lte: endDate },
              schoolId: school.id,
            },
          });

          // Filter out records that already have waivers
          // Use UTC format for consistent comparison
          const recordsToWaive = absenceRecords.filter((record) => {
            const recordDate = new Date(record.classDate);
            const recordDateStr = recordDate.toISOString().split("T")[0];

            return !existingWaivers.some((waiver) => {
              if (waiver.teacherId !== record.teacherId) return false;
              // Convert to UTC+3 date string for comparison
              const waiverDate = new Date(waiver.deductionDate);
              const waiverDateStr = format(
                toZonedTime(waiverDate, TZ),
                "yyyy-MM-dd"
              );
              return waiverDateStr === recordDateStr;
            });
          });

          // Don't return early - we still need to process computed absences
          // Only skip database record waivers if there are no records to waive

          // Create waiver records only for new records
          const waiverData = recordsToWaive.map((record) => ({
            teacherId: record.teacherId,
            deductionType: "absence" as const,
            deductionDate: record.classDate,
            originalAmount: record.deductionApplied,
            reason,
            adminId,
            schoolId: school.id,
          }));

          // Create waivers one by one to ensure they're created and track them
          let createdDbWaivers = 0;
          let skippedDbWaivers = 0;
          let errorDbWaivers = 0;

          addDebugLog(
            `Processing ${waiverData.length} database record waivers`
          );

          for (const waiver of waiverData) {
            try {
              // Convert to UTC+3 date string for comparison
              const normalizedDate = new Date(waiver.deductionDate);
              const waiverDateStr = format(
                toZonedTime(normalizedDate, TZ),
                "yyyy-MM-dd"
              );

              addDebugLog(
                `Creating waiver for teacher ${waiver.teacherId} on ${waiverDateStr}, amount: ${waiver.originalAmount}`
              );

              await tx.deduction_waivers.create({
                data: {
                  ...waiver,
                  deductionDate: normalizedDate,
                },
              });
              createdDbWaivers++;

              // Track newly created waiver dates for this teacher
              if (!newlyCreatedWaiverDatesMap.has(waiver.teacherId)) {
                newlyCreatedWaiverDatesMap.set(
                  waiver.teacherId,
                  new Set<string>()
                );
              }
              newlyCreatedWaiverDatesMap
                .get(waiver.teacherId)!
                .add(waiverDateStr);

              addDebugLog(
                `✓ Successfully created waiver for ${waiver.teacherId} on ${waiverDateStr}`
              );
            } catch (error: any) {
              // If it's a duplicate error, the waiver already exists
              if (error.code === "P2002") {
                skippedDbWaivers++;
                // Convert to UTC+3 date string for comparison
                const waiverDate = new Date(waiver.deductionDate);
                const waiverDateStr = format(
                  toZonedTime(waiverDate, TZ),
                  "yyyy-MM-dd"
                );
                addDebugLog(
                  `⚠ Waiver already exists for ${waiver.teacherId} on ${waiverDateStr} - skipping`
                );

                // Waiver already exists, add to set anyway to prevent duplicate creation attempts
                if (!newlyCreatedWaiverDatesMap.has(waiver.teacherId)) {
                  newlyCreatedWaiverDatesMap.set(
                    waiver.teacherId,
                    new Set<string>()
                  );
                }
                newlyCreatedWaiverDatesMap
                  .get(waiver.teacherId)!
                  .add(waiverDateStr);
              } else {
                errorDbWaivers++;
                console.error(
                  `[DEBUG] ✗ Error creating database record waiver for ${waiver.teacherId} on ${waiver.deductionDate}:`,
                  error.message || error
                );
              }
            }
          }

          addDebugLog(
            `Database record waivers: Created ${createdDbWaivers}, Skipped ${skippedDbWaivers}, Errors ${errorDbWaivers}`
          );

          recordsAffected += createdDbWaivers;
          totalAmountWaived += recordsToWaive.reduce(
            (sum, r) => sum + r.deductionApplied,
            0
          );
        }

        // Also handle computed absences (same logic as preview API)
        // Process computed absences for ALL teachers, even if they had database records
        addDebugLog(
          `Processing computed absences for ${teacherIdsArray.length} teachers`
        );

        for (const teacherId of teacherIdsArray) {
          addDebugLog(`Processing teacher ${teacherId}`);

          const teacher = await tx.wpos_wpdatatable_24.findUnique({
            where: { ustazid: teacherId },
            select: { ustazname: true },
          });

          if (!teacher) {
            addDebugLog(`Teacher ${teacherId} not found, skipping`);
            continue;
          }

          addDebugLog(`Teacher: ${teacher.ustazname} (${teacherId})`);

          // Get package deduction rates
          const packageDeductions = await tx.packageDeduction.findMany();
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
          const currentStudents = await tx.wpos_wpdatatable_23.findMany({
            where: {
              OR: [
                // Current assignments (any status)
                {
                  ustaz: teacherId,
                  // No status filter - include all students
                  occupiedTimes: {
                    some: {
                      ustaz_id: teacherId,
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
                  // CRITICAL: Don't filter by date range here (same as preview API)
                  // This ensures we find "after-midnight students" and other edge cases
                  // Date filtering happens during the absence calculation loop
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

          addDebugLog(
            `Found ${currentStudents.length} students for teacher ${teacherId}`
          );
          if (currentStudents.length > 0) {
            addDebugLog(
              `First student: ${currentStudents[0].name} (ID: ${
                currentStudents[0].wdt_ID
              }), zoom_links: ${
                currentStudents[0].zoom_links?.length || 0
              }, occupiedTimes: ${
                currentStudents[0].occupiedTimes?.length || 0
              }`
            );
          }

          // Get existing waivers (including any newly created in this transaction)
          const existingWaivers = await tx.deduction_waivers.findMany({
            where: {
              teacherId,
              deductionType: "absence",
              deductionDate: { gte: startDate, lte: endDate },
              schoolId: school.id,
            },
          });

          addDebugLog(
            `Found ${existingWaivers.length} existing waivers for teacher ${teacherId}`
          );

          // Convert waiver dates to UTC+3 date strings for consistent comparison
          const waivedDates = new Set(
            existingWaivers.map((w) => {
              // Convert to UTC+3 date string for comparison
              const waiverDate = new Date(w.deductionDate);
              const waiverDateStr = format(
                toZonedTime(waiverDate, TZ),
                "yyyy-MM-dd"
              );
              addDebugLog(
                `Existing waiver date: ${w.deductionDate.toISOString()} -> UTC+3: ${waiverDateStr}`
              );
              return waiverDateStr;
            })
          );

          // CRITICAL FIX: Also include newly created waiver dates from database records
          // This prevents trying to create duplicate waivers for the same date
          // Add any waivers that were just created for this teacher in the database records section
          const teacherNewWaivers = newlyCreatedWaiverDatesMap.get(teacherId);
          if (teacherNewWaivers) {
            addDebugLog(
              `Adding ${teacherNewWaivers.size} newly created waiver dates from database records`
            );
            teacherNewWaivers.forEach((dateStr) => {
              waivedDates.add(dateStr);
            });
          }

          addDebugLog(
            `Total waived dates for teacher ${teacherId}: ${waivedDates.size}`,
            Array.from(waivedDates).slice(0, 5)
          );

          // Get existing absence records
          const existingAbsenceRecords = await tx.absencerecord.findMany({
            where: {
              teacherId,
              classDate: { gte: startDate, lte: endDate },
            },
          });

          // Use UTC format for consistent date comparison (same as preview)
          const existingAbsenceDates = new Set(
            existingAbsenceRecords.map((record) => {
              // Convert to UTC+3 date string for comparison
              const recordDate = new Date(record.classDate);
              return format(toZonedTime(recordDate, TZ), "yyyy-MM-dd");
            })
          );

          // Check for computed absences
          // Don't process future dates
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          const effectiveToDate = endDate > today ? today : endDate;

          const workingDaysConfig = await tx.setting.findUnique({
            where: { key: "include_sundays_in_salary" },
          });
          const includeSundays = workingDaysConfig?.value === "true" || false;

          const computedAbsenceWaivers: Array<{
            teacherId: string;
            deductionType: "absence";
            deductionDate: Date;
            originalAmount: number;
            reason: string;
            adminId: string;
          }> = [];

          // Get teacher change history for proper assignment validation
          // Get ALL changes up to endDate to properly track who was assigned when
          const teacherChanges = await tx.teacher_change_history.findMany({
            where: {
              OR: [
                { old_teacher_id: teacherId },
                { new_teacher_id: teacherId },
              ],
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
              .sort(
                (a, b) => a.change_date.getTime() - b.change_date.getTime()
              );

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

          // Helper to parse daypackage (same as salary calculator and preview)
          const parseDaypackage = (dp: string): number[] => {
            if (!dp || dp.trim() === "") return [];

            const dpTrimmed = dp.trim().toUpperCase();

            if (dpTrimmed === "ALL DAYS" || dpTrimmed === "ALLDAYS") {
              return [0, 1, 2, 3, 4, 5, 6];
            }
            if (dpTrimmed === "MWF") {
              return [1, 3, 5];
            }
            if (dpTrimmed === "TTS" || dpTrimmed === "TTH") {
              return [2, 4, 6];
            }

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

            if (dayMap[dpTrimmed] !== undefined) {
              return [dayMap[dpTrimmed]];
            }

            return [];
          };

          // Safe date iteration to avoid invalid dates like Sept 31st
          // Fixed to handle UTC+3 timezone correctly
          const safeDateIterator = (startDate: Date, endDate: Date) => {
            const dates: Date[] = [];

            // Convert to UTC+3 timezone for date iteration
            const startZoned = toZonedTime(startDate, TZ);
            const endZoned = toZonedTime(endDate, TZ);

            // Start from beginning of start date in UTC+3
            const currentZoned = new Date(startZoned);
            currentZoned.setHours(0, 0, 0, 0);

            // End at end of end date in UTC+3
            const endZonedFinal = new Date(endZoned);
            endZonedFinal.setHours(23, 59, 59, 999);

            while (currentZoned <= endZonedFinal) {
              // Validate the date to avoid invalid dates like Sept 31st
              const year = currentZoned.getFullYear();
              const month = currentZoned.getMonth();
              const day = currentZoned.getDate();

              // Check if this is a valid date
              const testDate = new Date(year, month, day);
              if (
                testDate.getFullYear() === year &&
                testDate.getMonth() === month &&
                testDate.getDate() === day
              ) {
                // Convert back to UTC Date object for storage
                // This represents the start of this day in UTC+3
                const utcDate = fromZonedTime(currentZoned, TZ);
                dates.push(utcDate);
              }

              // Move to next day in UTC+3
              currentZoned.setDate(currentZoned.getDate() + 1);
            }

            return dates;
          };

          const datesToProcess = safeDateIterator(startDate, effectiveToDate);

          addDebugLog(`Dates to process: ${datesToProcess.length} dates`);
          addDebugLog(
            `Date range: ${startDate.toISOString()} to ${effectiveToDate.toISOString()}`
          );
          datesToProcess.forEach((d, idx) => {
            const zonedD = toZonedTime(d, TZ);
            addDebugLog(
              `Date ${idx + 1}: UTC=${d.toISOString()}, UTC+3=${format(
                zonedD,
                "yyyy-MM-dd"
              )}`
            );
          });

          for (const d of datesToProcess) {
            if (d > today) {
              addDebugLog(`Skipping future date: ${d.toISOString()}`);
              continue;
            }

            // Convert to UTC+3 date string for consistency
            const zonedDate = toZonedTime(d, TZ);
            const dateStr = format(zonedDate, "yyyy-MM-dd");
            const dayOfWeek = zonedDate.getDay();
            const dayOfMonth = zonedDate.getDate();

            addDebugLog(
              `--- Processing date: ${dateStr} (UTC: ${d.toISOString()}) ---`
            );
            addDebugLog(
              `Day of week: ${dayOfWeek} (0=Sunday), Day of month: ${dayOfMonth}`
            );

            // CRITICAL FIX: Skip 31st day from absence deductions
            // Timezone mismatch between UTC storage and Riyadh business hours
            if (dayOfMonth === 31) {
              addDebugLog(`Skipping ${dateStr} - 31st day (no deductions)`);
              continue; // No absence deductions for 31st day
            }

            // Skip Sunday unless configured to include
            if (dayOfWeek === 0 && !includeSundays) {
              addDebugLog(
                `Skipping ${dateStr} - Sunday (includeSundays=${includeSundays})`
              );
              continue;
            }

            // CRITICAL FIX: Only skip if there's already a WAIVER for this date
            // Don't skip just because there's a database record - database records and computed absences
            // can both exist and should both be waived. The unique constraint will prevent duplicates.
            // If there's already a waiver, we skip to avoid duplicate key errors.
            addDebugLog(
              `Checking if ${dateStr} is waived. Waived dates: [${Array.from(
                waivedDates
              ).join(", ")}]`
            );
            const isAlreadyWaived = waivedDates.has(dateStr);
            if (isAlreadyWaived) {
              // Already has a waiver for this date, but we'll still process to update it
              // This allows updating existing waivers with new amounts/reasons/students
              addDebugLog(
                `⚠ Date ${dateStr} already has waiver, but will process to update it`
              );
            } else {
              addDebugLog(
                `✓ Date ${dateStr} is NOT waived, proceeding with computation`
              );
            }

            // Note: We don't skip for existingAbsenceDates.has(dateStr) because:
            // - Database records get converted to waivers in the section above
            // - Computed absences should also be processed and converted to waivers
            // - If a database record waiver was just created for this date, waivedDates will include it
            // - The unique constraint ensures only one waiver per teacher+date+type

            // Check EACH student individually (per-student logic like salary calculator)
            let dailyDeduction = 0;
            const affectedStudents = [];

            // Filter by selected students if provided (for absence adjustments)
            const studentsToProcess =
              studentIds && Array.isArray(studentIds) && studentIds.length > 0
                ? currentStudents.filter((s) => {
                    // Match by student ID or name
                    // Handle both prefixed format (id:123, name:John) and plain format
                    return studentIds.some((id: string) => {
                      // Check if it's a prefixed format
                      if (id.startsWith("id:")) {
                        const studentId = id.replace("id:", "");
                        return String(s.wdt_ID) === studentId;
                      } else if (id.startsWith("name:")) {
                        const studentName = id.replace("name:", "");
                        return s.name === studentName;
                      } else {
                        // Plain format - check both ID and name
                        return (
                          String(s.wdt_ID) === id ||
                          s.name === id ||
                          String(s.wdt_ID).includes(id) ||
                          s.name?.includes(id)
                        );
                      }
                    });
                  })
                : currentStudents;

            if (
              studentIds &&
              Array.isArray(studentIds) &&
              studentIds.length > 0
            ) {
              addDebugLog(
                `Filtering to ${studentsToProcess.length} selected students out of ${currentStudents.length} total`
              );
            }

            addDebugLog(
              `Checking ${studentsToProcess.length} students for absences on ${dateStr}`
            );

            for (const student of studentsToProcess) {
              // Check if teacher was actually assigned to this student on this date (considering teacher changes)
              const isAssigned = isTeacherAssignedOnDate(
                student.wdt_ID,
                d,
                student.occupiedTimes || []
              );

              if (!isAssigned) {
                addDebugLog(
                  `  Student ${student.name} (${student.wdt_ID}): Not assigned on ${dateStr}`
                );
                continue; // Teacher not assigned on this date due to teacher change
              }

              addDebugLog(
                `  Student ${student.name} (${student.wdt_ID}): Checking for absence...`
              );

              // Get relevant occupied times for this date
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
              // This handles cases where occupied times might be missing or don't match date filter
              // (e.g., after-midnight students where occupied_time date doesn't match zoom link date)
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

              // Check if student is scheduled on this day of week
              // Use UTC day of week to match zoom link date format
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
                addDebugLog(
                  `  Student ${student.name}: Not scheduled on day ${dayOfWeek}, skipping`
                );
                continue;
              }

              // Check if student has zoom link for this date
              // Convert to UTC+3 date string for comparison
              const studentHasZoomLink = student.zoom_links.some(
                (link: any) => {
                  if (!link.sent_time) return false;
                  const linkDate = new Date(link.sent_time);
                  const linkDateStr = format(
                    toZonedTime(linkDate, TZ),
                    "yyyy-MM-dd"
                  );
                  return linkDateStr === dateStr;
                }
              );

              if (studentHasZoomLink) {
                addDebugLog(
                  `  Student ${student.name}: Has zoom link, skipping absence`
                );
                continue;
              }

              // Check if student has attendance permission for this date
              // Convert to UTC+3 date string for comparison
              const attendanceRecord = student.attendance_progress?.find(
                (att: any) => {
                  if (!att.date) return false;
                  const attDate = new Date(att.date);
                  const attDateStr = format(
                    toZonedTime(attDate, TZ),
                    "yyyy-MM-dd"
                  );
                  return attDateStr === dateStr;
                }
              );

              if (attendanceRecord?.attendance_status === "Permission") {
                addDebugLog(
                  `  Student ${student.name}: Has permission, skipping absence`
                );
                continue; // Skip deduction if student has permission
              }

              // If scheduled but no zoom link and no permission = absence
              const packageRate = student.package
                ? packageDeductionMap[student.package]?.absence || 25
                : 25;
              dailyDeduction += packageRate;
              affectedStudents.push({
                studentId: student.wdt_ID,
                name: student.name,
                package: student.package || "Unknown",
                rate: packageRate,
              });
              addDebugLog(
                `  ✗ Student ${student.name}: ABSENCE detected (${packageRate} ETB)`
              );
            }

            addDebugLog(
              `Date ${dateStr} summary: ${affectedStudents.length} absences, ${dailyDeduction} ETB total`
            );

            if (dailyDeduction > 0) {
              addDebugLog(
                `✓ Creating waiver for ${dateStr}: ${dailyDeduction} ETB, ${affectedStudents.length} students`
              );
              // CRITICAL FIX: Create a single waiver per date (not per student)
              // The unique constraint is on (teacherId, deductionType, deductionDate)
              // So we aggregate all students for the same date into one waiver
              // Include student details in the reason for tracking
              const studentDetails = affectedStudents
                .map((s) => `${s.name} (${s.package}): ${s.rate} ETB`)
                .join("; ");

              addDebugLog(
                `Found computed absence for ${dateStr}: ${affectedStudents.length} students, total: ${dailyDeduction} ETB`
              );
              addDebugLog(
                `Students: ${affectedStudents.map((s) => s.name).join(", ")}`
              );

              // Store the date as the UTC+3 date (the actual date the user selected)
              // For MySQL DATE fields, we need to create a Date object that represents the UTC+3 date
              // The date should be stored as the UTC+3 date, not the UTC date
              // Create a Date object for the UTC+3 date at midnight, which will be stored correctly
              // Parse the date string (YYYY-MM-DD) and create a Date in UTC that represents that date
              const [year, month, day] = dateStr.split("-").map(Number);
              // Create date at midnight UTC for the UTC+3 date
              // This ensures MySQL DATE field stores the correct date (2025-12-08, not 2025-12-07)
              const dateForDatabase = new Date(
                Date.UTC(year, month - 1, day, 0, 0, 0, 0)
              );

              addDebugLog(
                `  Storing waiver date: UTC+3=${dateStr}, Database date=${
                  dateForDatabase.toISOString().split("T")[0]
                }`
              );

              computedAbsenceWaivers.push({
                teacherId,
                deductionType: "absence" as const,
                deductionDate: dateForDatabase, // Date representing the UTC+3 date at midnight UTC
                originalAmount: dailyDeduction, // Total for all students on this date
                reason: `${reason} | ${affectedStudents.length} student(s): ${studentDetails}`,
                adminId,
                schoolId: school.id,
              });
              totalAmountWaived += dailyDeduction;
            }
          }

          if (computedAbsenceWaivers.length > 0) {
            addDebugLog(
              `Creating ${computedAbsenceWaivers.length} computed absence waivers for teacher ${teacherId}`
            );

            // Create waivers one by one to avoid skipDuplicates issues
            // This ensures all waivers are created even if there are slight date format differences
            let createdCount = 0;
            let skippedCount = 0;
            let errorCount = 0;

            for (const waiver of computedAbsenceWaivers) {
              try {
                // The waiver.deductionDate is already the correct UTC date representing the UTC+3 date
                // Convert it to UTC+3 to get the date string for logging and comparison
                const waiverDateStr = format(
                  toZonedTime(waiver.deductionDate, TZ),
                  "yyyy-MM-dd"
                );

                // Use the waiver.deductionDate as-is - it's already the correct UTC representation
                // of the UTC+3 date (start of day in UTC+3, converted to UTC)
                const normalizedWaiverDate = new Date(waiver.deductionDate);

                addDebugLog(
                  `Attempting to upsert waiver for teacher ${
                    waiver.teacherId
                  } on ${waiverDateStr} (UTC+3), UTC: ${normalizedWaiverDate.toISOString()}, amount: ${
                    waiver.originalAmount
                  }`
                );

                // Check if waiver already exists - need to check by UTC+3 date string
                // Get all waivers for this teacher/type in a date range that might include our date
                const searchStart = new Date(normalizedWaiverDate);
                searchStart.setUTCDate(searchStart.getUTCDate() - 1); // Day before
                const searchEnd = new Date(normalizedWaiverDate);
                searchEnd.setUTCDate(searchEnd.getUTCDate() + 1); // Day after

                const existingWaivers = await tx.deduction_waivers.findMany({
                  where: {
                    teacherId: waiver.teacherId,
                    deductionType: waiver.deductionType,
                    deductionDate: {
                      gte: searchStart,
                      lte: searchEnd,
                    },
                    schoolId: school.id,
                  },
                });

                // Find the waiver that matches the UTC+3 date
                const existingWaiver = existingWaivers.find((w) => {
                  const wDateStr = format(
                    toZonedTime(w.deductionDate, TZ),
                    "yyyy-MM-dd"
                  );
                  return wDateStr === waiverDateStr;
                });

                if (existingWaiver) {
                  // Update existing waiver
                  await tx.deduction_waivers.update({
                    where: { id: existingWaiver.id },
                    data: {
                      originalAmount: waiver.originalAmount,
                      reason: waiver.reason,
                      adminId: waiver.adminId,
                    },
                  });
                  addDebugLog(
                    `  ✓ Updated existing waiver for ${waiverDateStr} (ID: ${existingWaiver.id})`
                  );
                } else {
                  // Create new waiver
                  const newWaiver = await tx.deduction_waivers.create({
                    data: {
                      ...waiver,
                      deductionDate: normalizedWaiverDate,
                    },
                  });
                  addDebugLog(
                    `  ✓ Created new waiver for ${waiverDateStr} (ID: ${newWaiver.id})`
                  );
                }
                createdCount++;

                // Track this newly created waiver to prevent duplicates in same transaction
                if (!newlyCreatedWaiverDatesMap.has(teacherId)) {
                  newlyCreatedWaiverDatesMap.set(teacherId, new Set<string>());
                }
                newlyCreatedWaiverDatesMap.get(teacherId)!.add(waiverDateStr);

                addDebugLog(
                  `✓ Successfully created computed absence waiver for ${waiver.teacherId} on ${waiverDateStr}`
                );
              } catch (error: any) {
                // If it's a duplicate error, skip it (already exists)
                if (error.code === "P2002") {
                  // P2002 is unique constraint violation - waiver already exists
                  skippedCount++;
                  const waiverDateStr = new Date(waiver.deductionDate)
                    .toISOString()
                    .split("T")[0];
                  addDebugLog(
                    `⚠ Waiver already exists for teacher ${waiver.teacherId} on ${waiverDateStr} - skipping`
                  );

                  // Add to tracking set anyway
                  if (!newlyCreatedWaiverDatesMap.has(teacherId)) {
                    newlyCreatedWaiverDatesMap.set(
                      teacherId,
                      new Set<string>()
                    );
                  }
                  newlyCreatedWaiverDatesMap.get(teacherId)!.add(waiverDateStr);
                } else {
                  // Other error - log it
                  errorCount++;
                  const waiverDateStr = new Date(waiver.deductionDate)
                    .toISOString()
                    .split("T")[0];
                  addDebugLog(
                    `✗ Error creating computed absence waiver for teacher ${
                      waiver.teacherId
                    } on ${waiverDateStr}: ${error.message || error}`,
                    { code: error.code || "NO_CODE" }
                  );
                }
              }
            }

            recordsAffected += createdCount;

            // Log summary for debugging
            addDebugLog(
              `Computed absence waivers for teacher ${teacherId} (${teacher.ustazname}): Created ${createdCount}, Skipped ${skippedCount}, Errors ${errorCount} out of ${computedAbsenceWaivers.length} total`
            );

            // VERIFICATION: Query back to confirm waivers were actually created
            if (createdCount > 0) {
              const verificationWaivers = await tx.deduction_waivers.findMany({
                where: {
                  teacherId,
                  deductionType: "absence",
                  deductionDate: { gte: startDate, lte: endDate },
                  schoolId: school.id,
                  createdAt: {
                    gte: new Date(Date.now() - 60000), // Created in last minute
                  },
                },
              });
              addDebugLog(
                `Verification: Found ${verificationWaivers.length} waivers created in this transaction for teacher ${teacherId}`
              );
              if (verificationWaivers.length !== createdCount) {
                addDebugLog(
                  `WARNING: Expected ${createdCount} waivers but found ${verificationWaivers.length} in database`
                );
                // Log the dates that were created
                const createdDates = verificationWaivers.map((w) => {
                  const d = new Date(w.deductionDate);
                  return d.toISOString().split("T")[0];
                });
                addDebugLog(`Created waiver dates:`, createdDates);
              }
            }
          } else {
            addDebugLog(
              `No computed absence waivers to create for teacher ${teacherId}`
            );
            addDebugLog(
              `Reason: Processed ${datesToProcess.length} dates, but all were either waived, skipped (Sunday/31st), or had no absences`
            );
          }
        }
      }

      if (adjustmentType === "waive_lateness") {
        // Create detailed lateness waivers matching preview records
        const waiverData = [];

        for (const teacherId of teacherIdsArray) {
          // Get package deduction rates
          const packageDeductions = await tx.packageDeduction.findMany();
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

          const latenessConfigs = await tx.latenessdeductionconfig.findMany({
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
            const allStudents = await tx.wpos_wpdatatable_23.findMany({
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

            // Group zoom links by date
            const dailyZoomLinks = new Map();
            for (const student of allStudents) {
              student.zoom_links.forEach((link) => {
                if (link.sent_time) {
                  const dateStr = new Date(link.sent_time)
                    .toISOString()
                    .split("T")[0];
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

            // Process each day and create waivers for actual lateness records
            for (const [dateStr, links] of dailyZoomLinks.entries()) {
              const date = new Date(dateStr);
              if (date < startDate || date > endDate) continue;

              // Check if waiver already exists for this date
              const existingWaiver = await tx.deduction_waivers.findFirst({
                where: {
                  teacherId,
                  deductionType: "lateness",
                  deductionDate: date,
                  schoolId: school.id,
                },
              });

              if (existingWaiver) continue;

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

              let dailyTotalDeduction = 0;
              const dailyDetails = [];

              // Calculate lateness for each student on this date
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

                // Parse time and calculate lateness
                const parseTime = (timeStr: string) => {
                  if (timeStr.includes("AM") || timeStr.includes("PM")) {
                    const [time, period] = timeStr.split(" ");
                    let [hours, minutes] = time.split(":").map(Number);
                    if (period === "PM" && hours !== 12) hours += 12;
                    if (period === "AM" && hours === 12) hours = 0;
                    return { hours, minutes };
                  }
                  const [hours, minutes] = timeStr.split(":").map(Number);
                  return { hours, minutes };
                };

                const scheduled = parseTime(link.timeSlot);
                // Create scheduled time on the same day as sent_time (preserves timezone)
                const scheduledTime = new Date(link.sent_time);
                scheduledTime.setHours(
                  scheduled.hours,
                  scheduled.minutes,
                  0,
                  0
                );

                // Calculate lateness in minutes
                const latenessMinutes = Math.round(
                  (link.sent_time.getTime() - scheduledTime.getTime()) / 60000
                );

                // Skip if early (negative lateness)
                if (latenessMinutes < 0) continue;

                if (latenessMinutes > excusedThreshold) {
                  const student = allStudents.find(
                    (s) => s.wdt_ID === link.studentId
                  );
                  const studentPackage = student?.package || "";
                  const baseDeductionAmount =
                    packageDeductionMap[studentPackage]?.lateness || 30;

                  let deduction = 0;
                  for (const [i, t] of tiers.entries()) {
                    if (
                      latenessMinutes >= t.start &&
                      latenessMinutes <= t.end
                    ) {
                      deduction = Math.round(
                        baseDeductionAmount * (t.percent / 100)
                      );
                      break;
                    }
                  }

                  if (deduction > 0) {
                    dailyTotalDeduction += deduction;
                    dailyDetails.push(
                      `${link.studentName}: ${latenessMinutes}min late, ${deduction} ETB`
                    );
                  }
                }
              }

              // Create waiver record for this date if there were deductions
              if (dailyTotalDeduction > 0) {
                waiverData.push({
                  teacherId,
                  deductionType: "lateness",
                  deductionDate: date,
                  originalAmount: dailyTotalDeduction,
                  reason: `${reason} | ${dailyDetails.join("; ")}`.substring(
                    0,
                    500
                  ),
                  adminId,
                  schoolId: school.id,
                });
                totalAmountWaived += dailyTotalDeduction;
              }
            }
          }
        }

        if (waiverData.length > 0) {
          const createdWaivers = await tx.deduction_waivers.createMany({
            data: waiverData,
            skipDuplicates: true,
          });

          recordsAffected = createdWaivers.count;

          // Verify creation
          const verifyCount = await tx.deduction_waivers.count({
            where: {
              teacherId: { in: teacherIdsArray },
              deductionType: "lateness",
              deductionDate: { gte: startDate, lte: endDate },
            },
          });
        }
      }

      // Log the adjustment (truncate details to prevent overflow)
      const auditDetails = {
        adjustmentType,
        teacherCount: teacherIdsArray.length,
        dateRange,
        recordsAffected,
        totalAmountWaived,
        reason: reason.substring(0, 100), // Truncate reason
      };

      await tx.auditlog.create({
        data: {
          actionType: "deduction_adjustment",
          adminId,
          targetId: null,
          details: JSON.stringify(auditDetails).substring(0, 500), // Truncate entire JSON
        },
      });

      const finalResult = { recordsAffected, totalAmountWaived };

      addDebugLog(`Transaction final result:`, finalResult);

      return finalResult;
    });

    addDebugLog(`Transaction completed. Result:`, result);
    addDebugLog(
      `Returning response with recordsAffected: ${result.recordsAffected}, totalAmountWaived: ${result.totalAmountWaived}`
    );
    addDebugLog(`=== DEBUG LOGS COUNT: ${debugLogs.length} ===`);

    // Verify debug logs are populated
    console.log(`[API] Total debug logs collected: ${debugLogs.length}`);
    if (debugLogs.length > 0) {
      console.log(`[API] First log: ${debugLogs[0]}`);
      console.log(`[API] Last log: ${debugLogs[debugLogs.length - 1]}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${result.recordsAffected} deduction adjustments`,
      recordsAffected: result.recordsAffected,
      financialImpact: {
        totalAmountWaived: result.totalAmountWaived,
        affectedTeachers: teacherIdsArray.length,
      },
      debugLogs, // Include debug logs in response
      _debugInfo: {
        logCount: debugLogs.length,
        hasLogs: debugLogs.length > 0,
      },
    });
  } catch (error) {
    console.error("Adjustment error:", error);
    return NextResponse.json(
      { error: "Failed to process adjustments" },
      { status: 500 }
    );
  }
}

// Helper function to calculate lateness deduction for a specific date
async function calculateLatenessDeduction(
  tx: any,
  teacherId: string,
  date: Date
): Promise<number> {
  try {
    const dateStr = format(date, "yyyy-MM-dd");
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    // Get zoom links for this specific date
    const zoomLinks = await tx.wpos_zoom_links.findMany({
      where: {
        ustazid: teacherId,
        sent_time: { gte: date, lt: nextDay },
      },
      include: {
        wpos_wpdatatable_23: {
          select: {
            package: true,
            occupiedTimes: { select: { time_slot: true } },
          },
        },
      },
      orderBy: { sent_time: "asc" },
    });

    if (zoomLinks.length === 0) return 0;

    // Get package deduction rates
    const packageDeductions = await tx.packageDeduction.findMany();
    const packageMap = Object.fromEntries(
      packageDeductions.map((p: any) => [
        p.packageName,
        Number(p.latenessBaseAmount),
      ])
    );

    // Get lateness config
    const latenessConfigs = await tx.latenessdeductionconfig.findMany({
      orderBy: [{ tier: "asc" }, { startMinute: "asc" }],
    });

    if (latenessConfigs.length === 0) return 0;

    const excusedThreshold = Math.min(
      ...latenessConfigs.map((c: any) => c.excusedThreshold ?? 0)
    );
    const tiers = latenessConfigs.map((c: any) => ({
      start: c.startMinute,
      end: c.endMinute,
      percent: c.deductionPercent,
    }));

    const firstLink = zoomLinks[0];
    const timeSlot =
      firstLink.wpos_wpdatatable_23?.occupiedTimes?.[0]?.time_slot;

    if (!timeSlot || !firstLink.sent_time) return 0;

    // Calculate lateness
    const parseTime = (timeStr: string) => {
      if (timeStr.includes("AM") || timeStr.includes("PM")) {
        const [time, period] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;
        return { hours, minutes };
      }
      const [hours, minutes] = timeStr.split(":").map(Number);
      return { hours, minutes };
    };

    const scheduled = parseTime(timeSlot);
    // Create scheduled time on the same day as sent_time (preserves timezone)
    const scheduledTime = new Date(firstLink.sent_time);
    scheduledTime.setHours(scheduled.hours, scheduled.minutes, 0, 0);

    // Calculate lateness in minutes
    const latenessMinutes = Math.round(
      (firstLink.sent_time.getTime() - scheduledTime.getTime()) / 60000
    );

    // Skip if early (negative lateness)
    if (latenessMinutes < 0) return 0;

    if (latenessMinutes <= excusedThreshold) return 0;

    const studentPackage = firstLink.wpos_wpdatatable_23?.package || "";
    const baseAmount = packageMap[studentPackage] || 30;

    for (const tier of tiers) {
      if (latenessMinutes >= tier.start && latenessMinutes <= tier.end) {
        return Math.round(baseAmount * (tier.percent / 100));
      }
    }

    return 0;
  } catch (error) {
    console.error("Error calculating lateness deduction:", error);
    return 0;
  }
}
