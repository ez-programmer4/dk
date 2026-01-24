import { prisma } from "@/lib/prisma";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { format, toZonedTime, fromZonedTime } from "date-fns-tz";
import {
  getTeacherChangePeriods,
  TeacherChangePeriod,
} from "@/lib/teacher-change-utils";
import {
  parseDaypackage,
  formatDayPackage,
  getDayNamesFromDaypackage,
  countTeachingDaysInMonth,
} from "@/lib/daypackage-utils";

const TZ = "Asia/Riyadh";

export interface SalaryCalculationConfig {
  includeSundays: boolean;
  excusedThreshold: number;
  latenessTiers: Array<{
    start: number;
    end: number;
    percent: number;
  }>;
  packageDeductions: Record<
    string,
    {
      lateness: number;
      absence: number;
    }
  >;
}

export interface TeacherSalaryData {
  id: string;
  teacherId: string;
  name: string;
  teacherName: string;
  baseSalary: number;
  latenessDeduction: number;
  absenceDeduction: number;
  bonuses: number;
  totalSalary: number;
  status: "Paid" | "Unpaid";
  numStudents: number;
  teachingDays: number;
  hasTeacherChanges: boolean;
  breakdown: {
    dailyEarnings: Array<{ date: string; amount: number }>;
    studentBreakdown: Array<{
      studentName: string;
      package: string;
      monthlyRate: number;
      dailyRate: number;
      daysWorked: number;
      totalEarned: number;
      // 🆕 Daypackage information for salary calculation
      daypackage?: string;
      daypackageFormatted?: string; // Human-readable format (e.g., "Mon, Wed, Fri")
      daypackageDays?: string[]; // Array of day names (e.g., ["Monday", "Wednesday", "Friday"])
      teachingDaysInMonth?: number; // Number of teaching days in month based on daypackage
      periods?: Array<{
        period: string;
        daysWorked: number;
        dailyRate: number;
        periodEarnings: number;
        teachingDates: string[];
        teacherRole: "old_teacher" | "new_teacher";
        changeDate?: string;
        detailedDays?: {
          allZoomLinkDates: string[];
          expectedTeachingDays: string[];
          matchedDays: string[];
          excludedDays: Array<{ date: string; reason: string }>;
          daypackageUsed: string;
          totalZoomLinks: number;
          countedDays: number;
          permissionDays?: string[];
        };
      }>;
      teacherChanges: boolean;
      debugInfo?: any;
      studentInfo?: {
        studentId: number;
        studentStatus: string;
        package: string;
        daypackage: string;
        zoomLinksTotal: number;
        zoomLinkDates: string[];
        isNotSucceed: boolean;
        isCompleted: boolean;
        isLeave: boolean;
        isActive: boolean;
        isNotYet: boolean;
        statusReason: string;
      };
      workDayDetails?: {
        allZoomLinkDates: string[];
        expectedTeachingDays: string[];
        matchedDays: string[];
        excludedDays: Array<{ date: string; reason: string }>;
        daypackageUsed: string;
        totalZoomLinks: number;
        countedDays: number;
        discrepancy: boolean;
        discrepancyDetails: string;
        permissionDays?: string[];
      };
    }>;
    latenessBreakdown: Array<{
      date: string;
      studentName: string;
      scheduledTime: string;
      actualTime: string;
      latenessMinutes: number;
      tier: string;
      deduction: number;
    }>;
    absenceBreakdown: Array<{
      date: string;
      studentId: number;
      studentName: string;
      studentPackage: string;
      reason: string;
      deduction: number;
      permitted: boolean;
      waived: boolean;
    }>;
    summary: {
      workingDaysInMonth: number;
      actualTeachingDays: number;
      averageDailyEarning: number;
      totalDeductions: number;
      netSalary: number;
    };
  };
}

/**
 * SALARY CALCULATION NOTE:
 *
 * This calculator is based on DAYS WORKED, not actual meeting hours/duration.
 *
 * While we track actual meeting duration via Zoom webhooks (zoom_actual_duration),
 * the salary system calculates based on:
 * - Number of days the teacher had classes (teachingDays)
 * - Daily rate per student package
 * - Deductions for lateness and absences
 *
 * Actual duration tracking is used for:
 * - Transparency and reporting (teachers can see their actual hours)
 * - Future analytics and quality control
 * - Verification of attendance claims
 *
 * To view actual durations: GET /api/teachers/meeting-durations
 */
export class SalaryCalculator {
  protected config: SalaryCalculationConfig;
  private cache: Map<string, any> = new Map();
  private static globalCache: Map<string, any> = new Map();

  constructor(config: SalaryCalculationConfig) {
    this.config = config;
  }

  /**
   * Calculate salary for a single teacher
   */
  async calculateTeacherSalary(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<TeacherSalaryData> {
    const cacheKey = `salary_${teacherId}_${fromDate.toISOString()}_${toDate.toISOString()}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      // Debug configuration disabled for production

      // Get teacher info
      const teacher = await this.getTeacherInfo(teacherId);
      if (!teacher) {
        throw new Error(`Teacher not found: ${teacherId}`);
      }

      // Get current students with their packages first
      const students = await this.getTeacherStudents(
        teacherId,
        fromDate,
        toDate
      );

      // Get teacher change periods from the new history system
      const teacherChangePeriods = await getTeacherChangePeriods(
        teacherId,
        fromDate,
        toDate
      );

      // Get assignments (active + historical)
      const assignments = await this.getTeacherAssignments(
        teacherId,
        fromDate,
        toDate,
        students
      );

      // Calculate deductions
      // Enable debug mode for lateness calculations
      const latenessDebugMode = process.env.DEBUG_LATENESS === "true";

      let latenessData = await this.calculateLatenessDeductions(
        teacherId,
        assignments,
        fromDate,
        toDate,
        latenessDebugMode
      );

      let absenceData = await this.calculateAbsenceDeductions(
        teacherId,
        assignments,
        fromDate,
        toDate
      );

      // Ensure lateness and absence data have proper structure
      if (!latenessData) {
        latenessData = { totalDeduction: 0, breakdown: [] };
      }
      if (!latenessData.breakdown) {
        latenessData.breakdown = [];
      }
      if (!absenceData) {
        absenceData = { totalDeduction: 0, breakdown: [] };
      }
      if (!absenceData.breakdown) {
        absenceData.breakdown = [];
      }

      // Calculate bonuses
      const bonuses = await this.calculateBonuses(teacherId, fromDate, toDate);

      // Get payment status
      const period = `${fromDate.getFullYear()}-${String(
        fromDate.getMonth() + 1
      ).padStart(2, "0")}`;
      const payment = await prisma.teachersalarypayment.findUnique({
        where: { teacherId_period: { teacherId, period } },
        select: { status: true },
      });

      // Calculate base salary with assignment periods and teacher change data
      const baseSalaryData = await this.calculateBaseSalary(
        students,
        fromDate,
        toDate,
        assignments,
        teacherChangePeriods,
        teacherId
      );

      if (!baseSalaryData) {
        throw new Error("Failed to calculate base salary");
      }

      // Ensure all required arrays are initialized
      if (!baseSalaryData.dailyEarnings) {
        baseSalaryData.dailyEarnings = [];
      }
      if (!baseSalaryData.studentBreakdown) {
        baseSalaryData.studentBreakdown = [];
      }
      if (!baseSalaryData.workingDays) {
        baseSalaryData.workingDays = 0;
      }
      if (!baseSalaryData.teachingDays) {
        baseSalaryData.teachingDays = 0;
      }
      if (!baseSalaryData.averageDailyEarning) {
        baseSalaryData.averageDailyEarning = 0;
      }

      const result: TeacherSalaryData = {
        id: teacherId,
        teacherId,
        name: teacher.ustazname || "Unknown Teacher",
        teacherName: teacher.ustazname || "Unknown Teacher",
        baseSalary: Number(baseSalaryData.totalSalary.toFixed(2)),
        latenessDeduction: Number(latenessData.totalDeduction.toFixed(2)),
        absenceDeduction: Number(absenceData.totalDeduction.toFixed(2)),
        bonuses: Number(bonuses.toFixed(2)),
        totalSalary: Number(
          (
            baseSalaryData.totalSalary -
            latenessData.totalDeduction -
            absenceData.totalDeduction +
            bonuses
          ).toFixed(2)
        ),
        status: (payment?.status as "Paid" | "Unpaid") || "Unpaid",
        numStudents: baseSalaryData.numStudents, // Use count of students with earnings
        teachingDays: baseSalaryData.teachingDays,
        hasTeacherChanges: baseSalaryData.studentBreakdown.some(
          (s) => s.teacherChanges
        ),
        breakdown: {
          dailyEarnings: baseSalaryData.dailyEarnings || [],
          studentBreakdown: baseSalaryData.studentBreakdown || [],
          latenessBreakdown: latenessData.breakdown || [],
          absenceBreakdown: absenceData.breakdown || [],
          summary: {
            workingDaysInMonth: baseSalaryData.workingDays || 0,
            actualTeachingDays: baseSalaryData.teachingDays || 0,
            averageDailyEarning: baseSalaryData.averageDailyEarning || 0,
            totalDeductions:
              latenessData.totalDeduction + absenceData.totalDeduction,
            netSalary: Number(
              (
                baseSalaryData.totalSalary -
                latenessData.totalDeduction -
                absenceData.totalDeduction +
                bonuses
              ).toFixed(2)
            ),
          },
        },
      };

      this.cache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error(
        `Error calculating salary for teacher ${teacherId}:`,
        error
      );

      // Return a safe fallback structure to prevent map errors
      const fallbackResult: TeacherSalaryData = {
        id: teacherId,
        teacherId,
        name: "Unknown Teacher",
        teacherName: "Unknown Teacher",
        baseSalary: 0,
        latenessDeduction: 0,
        absenceDeduction: 0,
        bonuses: 0,
        totalSalary: 0,
        status: "Unpaid",
        numStudents: 0,
        teachingDays: 0,
        hasTeacherChanges: false,
        breakdown: {
          dailyEarnings: [],
          studentBreakdown: [],
          latenessBreakdown: [],
          absenceBreakdown: [],
          summary: {
            workingDaysInMonth: 0,
            actualTeachingDays: 0,
            averageDailyEarning: 0,
            totalDeductions: 0,
            netSalary: 0,
          },
        },
      };

      return fallbackResult;
    }
  }

  /**
   * Calculate salaries for all teachers
   */
  async calculateAllTeacherSalaries(
    fromDate: Date,
    toDate: Date
  ): Promise<TeacherSalaryData[]> {
    // Get all teachers from main table
    const mainTableTeachers = await prisma.wpos_wpdatatable_24.findMany({
      select: { ustazid: true, ustazname: true },
    });

    // Also get teachers who might be found through zoom links but not in main table
    const zoomLinkTeachers = await prisma.wpos_zoom_links.findMany({
      where: {
        sent_time: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        ustazid: true,
      },
      distinct: ["ustazid"],
    });

    // Create a comprehensive list of all unique teachers
    const allTeacherIds = new Set<string>();

    // Add teachers from main table
    mainTableTeachers.forEach((teacher) => {
      if (teacher.ustazid && teacher.ustazid.trim() !== "") {
        allTeacherIds.add(teacher.ustazid);
      }
    });

    // Add teachers from zoom links
    zoomLinkTeachers.forEach((zoomTeacher) => {
      if (zoomTeacher.ustazid && zoomTeacher.ustazid.trim() !== "") {
        allTeacherIds.add(zoomTeacher.ustazid);
      }
    });

    // Create final teacher list with names
    const finalTeachers = Array.from(allTeacherIds).map((teacherId) => {
      const mainTeacher = mainTableTeachers.find(
        (t) => t.ustazid === teacherId
      );
      return {
        ustazid: teacherId,
        ustazname: mainTeacher?.ustazname || `Teacher ${teacherId}`,
      };
    });

    const results = await Promise.all(
      finalTeachers.map(async (teacher) => {
        try {
          return await this.calculateTeacherSalary(
            teacher.ustazid,
            fromDate,
            toDate
          );
        } catch (error) {
          console.error(
            `Failed to calculate salary for ${teacher.ustazname} (${teacher.ustazid}):`,
            error
          );
          return null;
        }
      })
    );

    const validResults = results.filter(Boolean) as TeacherSalaryData[];
    return validResults;
  }

  /**
   * Get detailed breakdown for a specific teacher
   */
  async getTeacherSalaryDetails(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ): Promise<{
    latenessRecords: any[];
    absenceRecords: any[];
    bonusRecords: any[];
    unmatchedZoomLinks?: any[];
    salaryData: TeacherSalaryData;
  }> {
    // Get current students with their packages first
    const students = await this.getTeacherStudents(teacherId, fromDate, toDate);

    const assignments = await this.getTeacherAssignments(
      teacherId,
      fromDate,
      toDate,
      students
    );

    // Calculate lateness records
    const latenessRecords = await this.calculateDetailedLatenessRecords(
      teacherId,
      assignments,
      fromDate,
      toDate
    );

    // Calculate absence records
    const absenceRecords = await this.calculateDetailedAbsenceRecords(
      teacherId,
      assignments,
      fromDate,
      toDate
    );

    // Get bonus records
    const bonusRecords = await prisma.bonusrecord.findMany({
      where: {
        teacherId,
        createdAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { createdAt: "asc" },
    });

    // Get unmatched zoom links
    const unmatchedZoomLinks = await this.getUnmatchedZoomLinks(
      teacherId,
      fromDate,
      toDate
    );

    // Get the complete salary data for this teacher
    const salaryData = await this.calculateTeacherSalary(
      teacherId,
      fromDate,
      toDate
    );

    return {
      latenessRecords,
      absenceRecords,
      bonusRecords,
      unmatchedZoomLinks:
        unmatchedZoomLinks.length > 0 ? unmatchedZoomLinks : undefined,
      salaryData,
    };
  }

  private async getTeacherInfo(teacherId: string) {
    // First try to find teacher in main table
    let teacher = await prisma.wpos_wpdatatable_24.findUnique({
      where: { ustazid: teacherId },
      select: { ustazid: true, ustazname: true },
    });

    // If not found in main table, check if teacher exists in zoom links
    if (!teacher) {
      // Check if this teacher has any zoom links
      const zoomLinkCount = await prisma.wpos_zoom_links.count({
        where: { ustazid: teacherId },
      });

      if (zoomLinkCount > 0) {
        teacher = {
          ustazid: teacherId,
          ustazname: `Teacher ${teacherId}`,
        };
      }
    }

    return teacher;
  }

  /**
   * Helper method to check if a teacher was assigned to a student on a specific date
   * considering teacher changes
   */
  private isTeacherAssignedOnDate(
    teacherId: string,
    studentId: number,
    date: Date,
    teacherChanges: Array<{
      student_id: number;
      old_teacher_id: string | null;
      new_teacher_id: string;
      change_date: Date;
    }>,
    occupiedTimes: Array<{
      occupied_at: Date | null;
      end_at: Date | null;
    }>
  ): boolean {
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
      const assignmentStart = ot.occupied_at ? new Date(ot.occupied_at) : null;
      const assignmentEnd = ot.end_at ? new Date(ot.end_at) : null;

      if (assignmentStart && date < assignmentStart) continue;
      if (assignmentEnd && date > assignmentEnd) continue;

      return true;
    }

    return false;
  }

  private async getStudentForClassDate(teacherId: string, classDate: Date) {
    // This is a simplified implementation - in reality you'd need to match
    // the specific student based on the class schedule and time
    // IMPORTANT: Include students with ANY status - teacher should be paid for days taught
    const students = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        ustaz: teacherId,
        // No status filter - include all students with zoom links on this date
      },
      select: {
        wdt_ID: true,
        name: true,
        package: true,
      },
      take: 1, // For now, just get the first student
    });

    return students[0] || null;
  }

  private async getPackageSalary(packageName: string | null): Promise<number> {
    if (!packageName) return 0;

    const packageSalary = await prisma.packageSalary.findFirst({
      where: { packageName },
      select: { salaryPerStudent: true },
    });

    return Number(packageSalary?.salaryPerStudent || 0);
  }

  private async getTeacherAssignments(
    teacherId: string,
    fromDate: Date,
    toDate: Date,
    students: any[]
  ) {
    // Get active assignments
    const activeAssignments = await prisma.wpos_ustaz_occupied_times.findMany({
      where: {
        ustaz_id: teacherId,
        occupied_at: { lte: toDate },
        OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
      },
      include: {
        student: {
          select: {
            wdt_ID: true,
            name: true,
            package: true,
            daypackages: true, // ✅ ADDED: Include daypackages field
          },
        },
      },
    });

    // Get teacher change periods from the new history system
    const teacherChangePeriods = await getTeacherChangePeriods(
      teacherId,
      fromDate,
      toDate
    );

    // Combine active assignments with historical periods
    const allAssignments = [
      ...activeAssignments.map((assignment) => ({
        student_id: assignment.student_id,
        ustaz_id: assignment.ustaz_id,
        time_slot: assignment.time_slot,
        daypackage: assignment.daypackage,
        occupied_at: assignment.occupied_at,
        end_at: assignment.end_at,
        student: assignment.student,
        assignment_type: "active" as const,
      })),
      ...teacherChangePeriods.map((period) => ({
        student_id: period.studentId,
        ustaz_id: period.teacherId,
        time_slot: period.timeSlot,
        daypackage: period.dayPackage,
        occupied_at: period.startDate,
        end_at: period.endDate,
        student: {
          wdt_ID: period.studentId,
          name: period.studentName,
          package: period.package,
        },
        assignment_type: "historical" as const,
        monthlyRate: period.monthlyRate,
        dailyRate: period.dailyRate,
      })),
    ];

    return allAssignments;
  }

  public async getTeacherStudentsPublic(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ) {
    return this.getTeacherStudents(teacherId, fromDate, toDate);
  }

  private async getTeacherStudents(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ) {
    // 🔧 CRITICAL FIX: Get teacher change periods FIRST to ensure we include
    // students who were taught by this teacher during their period, even if
    // they're no longer assigned (due to mid-month teacher changes)
    const teacherChangePeriods = await getTeacherChangePeriods(
      teacherId,
      fromDate,
      toDate
    );

    // Get students who were assigned to this teacher during the period
    // This includes both current assignments and historical assignments
    // IMPORTANT: Include students with ANY status if they have zoom links during the period
    // This ensures teachers get paid even if student status changed mid-month
    // (Leave, Completed, Not Succeed, etc.) - zoom links are evidence of teaching

    // First, get current students assigned to this teacher
    // Include ALL students (any status) who were taught during the period
    // Use OR to catch both current assignments AND historical assignments (teacher changes)
    const currentStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        OR: [
          // Current assignment (any status, will filter by zoom links later)
          {
            ustaz: teacherId,
            occupiedTimes: {
              some: {
                ustaz_id: teacherId,
                occupied_at: { lte: toDate },
                OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
              },
            },
          },
          // Historical assignment via occupiedTimes (any status)
          {
            occupiedTimes: {
              some: {
                ustaz_id: teacherId,
                occupied_at: { lte: toDate },
                OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
              },
            },
          },
        ],
      },
      select: {
        wdt_ID: true,
        name: true,
        package: true,
        daypackages: true, // ✅ ADDED: Include daypackages field
        status: true,
        occupiedTimes: {
          where: {
            ustaz_id: teacherId,
            occupied_at: { lte: toDate },
            OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
          },
          select: {
            time_slot: true,
            daypackage: true, // ✅ ADDED: Include daypackage field
            occupied_at: true,
            end_at: true,
          },
        },
        zoom_links: {
          where: {
            ustazid: teacherId, // Only zoom links sent by this teacher
            sent_time: { gte: fromDate, lte: toDate },
          },
          select: { sent_time: true },
        },
        attendance_progress: {
          where: {
            date: { gte: fromDate, lte: toDate },
          },
          select: { date: true, attendance_status: true },
        },
      },
    });

    // Get historical assignments from audit logs for this teacher
    const auditLogs = await prisma.auditlog.findMany({
      where: {
        actionType: "assignment_update",
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: {
        targetId: true,
        details: true,
        createdAt: true,
      },
    });

    // Find students who were assigned to this teacher during the period
    const historicalStudentIds = new Set<number>();

    auditLogs.forEach((log) => {
      try {
        const details = JSON.parse(log.details);
        if (details.newTeacher === teacherId && log.targetId) {
          // Teacher was assigned to this student
          historicalStudentIds.add(log.targetId);
        }
      } catch (e) {
        console.warn(`Failed to parse audit log details:`, e);
      }
    });

    // Get historical students who were assigned to this teacher
    // Include students with ANY status - teacher should be paid if they taught during the period
    const historicalStudents =
      historicalStudentIds.size > 0
        ? await prisma.wpos_wpdatatable_23.findMany({
            where: {
              wdt_ID: { in: Array.from(historicalStudentIds) },
              // No status filter - include all students with zoom links during period
            },
            select: {
              wdt_ID: true,
              name: true,
              package: true,
              daypackages: true, // ✅ ADDED: Include daypackages field
              status: true,
              occupiedTimes: {
                where: {
                  ustaz_id: teacherId,
                  occupied_at: { lte: toDate },
                  OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
                },
                select: {
                  time_slot: true,
                  daypackage: true, // ✅ ADDED: Include daypackage field
                  occupied_at: true,
                  end_at: true,
                },
              },
              zoom_links: {
                where: {
                  ustazid: teacherId, // Only zoom links sent by this teacher
                  sent_time: { gte: fromDate, lte: toDate }, // CRITICAL: Filter by date to prevent other months' data
                },
                select: { sent_time: true },
              },
              attendance_progress: {
                where: {
                  date: { gte: fromDate, lte: toDate },
                },
                select: { date: true, attendance_status: true },
              },
            },
          })
        : [];

    // Combine current and historical students, removing duplicates
    const allStudents = [...currentStudents];
    const currentStudentIds = new Set(currentStudents.map((s) => s.wdt_ID));

    historicalStudents.forEach((student) => {
      if (!currentStudentIds.has(student.wdt_ID)) {
        allStudents.push(student);
      }
    });

    // Fallback: Find students based on zoom links sent by this teacher
    // This catches cases where assignment data might be missing but zoom links exist
    // CRITICAL: Include students with ANY status if zoom links exist
    // Rationale: If teacher sent zoom links and taught the student, they deserve payment
    // Even if student left mid-month, teacher should be paid for days taught

    // First get zoom links without the relation to avoid null reference errors
    // CRITICAL: Filter by date range to only get students for this period
    const zoomLinkIds = await prisma.wpos_zoom_links.findMany({
      where: {
        ustazid: teacherId,
        sent_time: { gte: fromDate, lte: toDate }, // Only this period
      },
      select: {
        studentid: true,
      },
      distinct: ["studentid"],
    });

    // Then get student data for those IDs
    const studentIds = zoomLinkIds
      .map((link) => link.studentid)
      .filter((id) => id !== null);

    const zoomLinkStudents =
      studentIds.length > 0
        ? await prisma.wpos_wpdatatable_23.findMany({
            where: {
              wdt_ID: { in: studentIds },
            },
            select: {
              wdt_ID: true,
              name: true,
              package: true,
              daypackages: true,
              status: true,
              occupiedTimes: {
                where: {
                  ustaz_id: teacherId,
                  occupied_at: { lte: toDate },
                  OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
                },
                select: {
                  time_slot: true,
                  daypackage: true,
                  occupied_at: true,
                  end_at: true,
                },
              },
              // 🔧 CRITICAL FIX: Include attendance_progress even when no zoom links exist
              // This ensures permission days are tracked for all students
              attendance_progress: {
                where: {
                  date: { gte: fromDate, lte: toDate },
                },
                select: { date: true, attendance_status: true },
              },
            },
          })
        : [];

    // Get zoom links for each student in the period
    const zoomLinkStudentsWithLinks = await Promise.all(
      zoomLinkStudents.map(async (student) => {
        const studentZoomLinks = await prisma.wpos_zoom_links.findMany({
          where: {
            ustazid: teacherId,
            studentid: student.wdt_ID,
            sent_time: { gte: fromDate, lte: toDate },
          },
          select: { sent_time: true },
        });

        return {
          studentid: student.wdt_ID,
          wpos_wpdatatable_23: student,
          zoom_links: studentZoomLinks,
        };
      })
    );

    // Add students found through zoom links
    // Include ALL students regardless of status (Active, Leave, Completed, Not Succeed, etc.)
    // If teacher sent zoom links, they should be paid - zoom links are evidence of teaching
    const existingStudentIds = new Set(allStudents.map((s) => s.wdt_ID));

    for (const zoomLink of zoomLinkStudentsWithLinks) {
      const student = zoomLink.wpos_wpdatatable_23;
      if (student && !existingStudentIds.has(student.wdt_ID)) {
        allStudents.push({
          wdt_ID: student.wdt_ID,
          name: student.name,
          package: student.package,
          daypackages: student.daypackages, // ✅ ADDED: Include daypackages field
          status: student.status,
          occupiedTimes: student.occupiedTimes || [], // ✅ ADDED: Include occupied_times
          zoom_links: zoomLink.zoom_links,
          // 🔧 CRITICAL FIX: Use attendance_progress from query (already loaded)
          // This ensures permission days are tracked even when no zoom links exist
          attendance_progress: student.attendance_progress || [],
        });
      }
    }

    // 🔧 CRITICAL FIX: Add students from teacher change periods
    // This ensures old teachers get paid for students they taught before mid-month changes
    if (teacherChangePeriods.length > 0) {
      for (const period of teacherChangePeriods) {
        // Skip if student is already included
        if (existingStudentIds.has(period.studentId)) {
          continue;
        }

        // Get the student data
        const student = await prisma.wpos_wpdatatable_23.findUnique({
          where: { wdt_ID: period.studentId },
          select: {
            wdt_ID: true,
            name: true,
            package: true,
            daypackages: true,
            status: true,
            occupiedTimes: {
              where: {
                ustaz_id: teacherId,
                occupied_at: { lte: toDate },
                OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
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
                sent_time: { gte: fromDate, lte: toDate },
              },
              select: { sent_time: true },
            },
            attendance_progress: {
              where: {
                date: { gte: fromDate, lte: toDate },
              },
              select: { date: true, attendance_status: true },
            },
          },
        });

        if (student) {
          // Override package and daily rate from teacher change period
          const studentWithPeriodData = {
            ...student,
            package: period.package,
            // Add period-specific data for salary calculation
            teacherChangePeriod: {
              startDate: period.startDate,
              endDate: period.endDate,
              monthlyRate: period.monthlyRate,
              dailyRate: period.dailyRate,
              timeSlot: period.timeSlot,
              dayPackage: period.dayPackage,
            },
          };

          allStudents.push(studentWithPeriodData);
          existingStudentIds.add(period.studentId);
        }
      }
    }

    // 🔧 CRITICAL FIX: Additional fallback for "Not Succeed" students
    // This ensures teachers get paid for students they taught before they were marked as "Not Succeed"
    // Find all "Not Succeed" students who have zoom links from this teacher
    const notSucceedStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        status: {
          contains: "Not succeed",
        },
        zoom_links: {
          some: {
            ustazid: teacherId,
            sent_time: { gte: fromDate, lte: toDate },
          },
        },
      },
      select: {
        wdt_ID: true,
        name: true,
        package: true,
        daypackages: true,
        status: true,
        occupiedTimes: {
          where: {
            ustaz_id: teacherId,
            occupied_at: { lte: toDate },
            OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
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
            sent_time: { gte: fromDate, lte: toDate },
          },
          select: { sent_time: true },
        },
        attendance_progress: {
          where: {
            date: { gte: fromDate, lte: toDate },
          },
          select: { date: true, attendance_status: true },
        },
      },
    });

    // Add "Not Succeed" students to the list if not already included
    for (const student of notSucceedStudents) {
      if (!existingStudentIds.has(student.wdt_ID)) {
        // Ensure the student has the required structure
        const studentWithRequiredFields = {
          wdt_ID: student.wdt_ID,
          name: student.name,
          package: student.package,
          daypackages: student.daypackages,
          status: student.status,
          occupiedTimes: student.occupiedTimes || [],
          zoom_links: student.zoom_links || [],
          attendance_progress: student.attendance_progress || [],
        };

        allStudents.push(studentWithRequiredFields);
        existingStudentIds.add(student.wdt_ID);
      }
    }

    // 🔧 CRITICAL FIX: Add specific query for "Completed" students
    // This ensures teachers get paid for students who completed mid-month but have zoom links

    // Find all "Completed" students who have zoom links from this teacher
    const completedStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        status: {
          contains: "Completed",
        },
        zoom_links: {
          some: {
            ustazid: teacherId,
            sent_time: { gte: fromDate, lte: toDate },
          },
        },
      },
      select: {
        wdt_ID: true,
        name: true,
        package: true,
        daypackages: true,
        status: true,
        occupiedTimes: {
          where: {
            ustaz_id: teacherId,
            occupied_at: { lte: toDate },
            OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
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
            sent_time: { gte: fromDate, lte: toDate },
          },
          select: { sent_time: true },
        },
        attendance_progress: {
          where: {
            date: { gte: fromDate, lte: toDate },
          },
          select: { date: true, attendance_status: true },
        },
      },
    });

    // Add "Completed" students to the list if not already included
    for (const student of completedStudents) {
      if (!existingStudentIds.has(student.wdt_ID)) {
        // Ensure the student has the required structure
        const studentWithRequiredFields = {
          wdt_ID: student.wdt_ID,
          name: student.name,
          package: student.package,
          daypackages: student.daypackages,
          status: student.status,
          occupiedTimes: student.occupiedTimes || [],
          zoom_links: student.zoom_links || [],
          attendance_progress: student.attendance_progress || [],
        };

        allStudents.push(studentWithRequiredFields);
        existingStudentIds.add(student.wdt_ID);
      }
    }

    // Debug: Log all zoom links for this teacher
    const allTeacherZoomLinks = await prisma.wpos_zoom_links.findMany({
      where: {
        ustazid: teacherId,
        sent_time: { gte: fromDate, lte: toDate },
      },
      select: {
        studentid: true,
        sent_time: true,
        wpos_wpdatatable_23: {
          select: {
            wdt_ID: true,
            name: true,
            package: true,
            daypackages: true, // ✅ ADDED: Include daypackages field
            ustaz: true,
            status: true, // ✅ ADDED: Include status field
          },
        },
      },
      orderBy: { sent_time: "desc" },
    });

    return allStudents;
  }

  /**
   * Calculate expected teaching days based on student's daypackage
   * Sunday inclusion logic:
   * - For empty daypackages: Use global includeSundays setting (fallback to all days)
   * - For "All Days" packages: Respect includeSundays setting
   * - For specific day packages (MWF, TTS, etc.): Only include Sunday if explicitly in daypackage
   */
  private calculateExpectedTeachingDays(
    fromDate: Date,
    toDate: Date,
    daypackage: string
  ): string[] {
    const expectedDays: string[] = [];

    if (!daypackage || daypackage.trim() === "") {
      // If no daypackage, use all days but respect global includeSundays setting
      const current = new Date(fromDate);
      while (current <= toDate) {
        const isSunday = current.getUTCDay() === 0;
        const shouldInclude = this.config.includeSundays || !isSunday;

        if (shouldInclude) {
          const dateStr = current.toISOString().split("T")[0];
          expectedDays.push(dateStr);
        }

        current.setUTCDate(current.getUTCDate() + 1);
      }
      return expectedDays;
    }

    // Parse daypackage to get expected days of week
    const expectedDaysOfWeek = this.parseDaypackage(daypackage);

    // Check if this is "All Days" package (all 7 days including Sunday)
    const isAllDaysPackage =
      expectedDaysOfWeek.length === 7 &&
      expectedDaysOfWeek.every((day, index) => day === index);

    // For all packages, only include days that are explicitly in the daypackage
    const current = new Date(fromDate);
    while (current <= toDate) {
      const dayOfWeek = current.getUTCDay();

      // Check if this day is in the parsed daypackage
      if (expectedDaysOfWeek.includes(dayOfWeek)) {
        // Special handling for Sunday in "All Days" package
        if (isAllDaysPackage && dayOfWeek === 0) {
          // For "All Days" package, respect the global includeSundays setting
          if (this.config.includeSundays) {
            const dateStr = current.toISOString().split("T")[0];
            expectedDays.push(dateStr);
          }
          // If includeSundays is false, skip Sunday even for "All Days" package
        } else {
          // For all other cases (specific packages or non-Sunday days in "All Days"):
          // Include the day since it's explicitly in the daypackage
          const dateStr = current.toISOString().split("T")[0];
          expectedDays.push(dateStr);
        }
      }

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return expectedDays;
  }

  /**
   * 🆕 Use shared daypackage utility for consistency across the system
   * Delegates to the centralized parseDaypackage function
   */
  private parseDaypackage(daypackage: string): number[] {
    return parseDaypackage(daypackage);
  }

  /**
   * Calculate working days in a period based on Sunday inclusion setting
   * Fixed: Properly handles month boundaries and avoids extra days
   */
  private calculateWorkingDays(fromDate: Date, toDate: Date): number {
    let workingDays = 0;

    // Use UTC methods for consistency with zoom link date handling
    const current = new Date(fromDate);
    const end = new Date(toDate);

    // Reset to start of day in UTC to avoid time issues
    current.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);

    while (current <= end) {
      // Get day of week in UTC (0 = Sunday, 1 = Monday, etc.)
      const dayOfWeek = current.getUTCDay();
      const isSunday = dayOfWeek === 0;
      const shouldInclude = this.config.includeSundays || !isSunday;

      if (shouldInclude) {
        workingDays++;
      }

      // Move to next day safely in UTC
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return workingDays;
  }

  private async calculateBaseSalary(
    students: any[],
    fromDate: Date,
    toDate: Date,
    assignments: any[] = [],
    teacherChangePeriods: any[] = [],
    teacherId: string
  ) {
    const packageSalaries = await prisma.packageSalary.findMany();
    const salaryMap: Record<string, number> = {};
    packageSalaries.forEach((pkg) => {
      salaryMap[pkg.packageName] = Number(pkg.salaryPerStudent);
    });

    // 🔧 CRITICAL FIX: Calculate working days for the FULL MONTH, not just the query period
    // This ensures consistent daily rates regardless of which days in the month are queried
    // Daily rate should be based on the full month's working days, not partial month ranges
    const monthStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const monthEnd = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth() + 1,
      0
    );
    monthEnd.setUTCHours(23, 59, 59, 999);
    const workingDays = this.calculateWorkingDays(monthStart, monthEnd);

    const dailyEarnings = new Map<string, number>();
    const studentBreakdown: Array<{
      studentName: string;
      package: string;
      monthlyRate: number;
      dailyRate: number;
      daysWorked: number;
      totalEarned: number;
      // 🆕 Daypackage information for salary calculation
      daypackage?: string;
      daypackageFormatted?: string; // Human-readable format (e.g., "Mon, Wed, Fri")
      daypackageDays?: string[]; // Array of day names (e.g., ["Monday", "Wednesday", "Friday"])
      teachingDaysInMonth?: number; // Number of teaching days in month based on daypackage
      periods?: Array<any>;
      teacherChanges: boolean;
      debugInfo?: any;
      studentInfo?: {
        studentId: number;
        studentStatus: string;
        package: string;
        daypackage: string;
        zoomLinksTotal: number;
        zoomLinkDates: string[];
        isNotSucceed: boolean;
        isCompleted: boolean;
        isLeave: boolean;
        isActive: boolean;
        isNotYet: boolean;
        statusReason: string;
      };
      workDayDetails?: {
        allZoomLinkDates: string[];
        expectedTeachingDays: string[];
        matchedDays: string[];
        excludedDays: Array<{ date: string; reason: string }>;
        daypackageUsed: string;
        totalZoomLinks: number;
        countedDays: number;
        discrepancy: boolean;
        discrepancyDetails: string;
      };
    }> = [];
    const teacherPeriods = new Map<
      string,
      Array<{ start: Date; end: Date | null; student: any }>
    >();

    // Group assignments by student to track teacher periods
    for (const assignment of assignments) {
      const studentId = assignment.student_id || assignment.student?.wdt_ID;
      if (!studentId) continue;

      const student =
        assignment.student || students.find((s) => s.wdt_ID === studentId);
      if (!student) continue;

      if (!teacherPeriods.has(studentId.toString())) {
        teacherPeriods.set(studentId.toString(), []);
      }

      const periods = teacherPeriods.get(studentId.toString())!;
      const startDate = assignment.occupied_at || fromDate;
      const endDate = assignment.end_at || toDate;

      periods.push({
        start: startDate,
        end: endDate,
        student: student,
      });
    }

    // Process each student with their teacher periods
    for (const student of students) {
      // Debug flag for specific teacher and student
      const isDebugStudent = false; // Disabled to prevent duplication

      // 🔧 CRITICAL FIX: Use teacher change period data if available
      // This ensures old teachers get paid with the correct package rates from their teaching period
      let monthlyPackageSalary = 0;
      let dailyRate = 0;

      // 🆕 NEW: Get student's daypackage for accurate daily rate calculation
      // Priority: teacher change period > occupied_times.daypackage > student.daypackages
      let studentDaypackage = "";

      if (
        student.teacherChangePeriod &&
        student.teacherChangePeriod.dayPackage
      ) {
        studentDaypackage = student.teacherChangePeriod.dayPackage;
      } else if (student.occupiedTimes && student.occupiedTimes.length > 0) {
        studentDaypackage = student.occupiedTimes[0].daypackage || "";
      } else if (student.daypackages) {
        studentDaypackage = student.daypackages;
      }

      // 🆕 NEW: Calculate teaching days for this specific student's daypackage
      const studentTeachingDaysInMonth =
        studentDaypackage && studentDaypackage.trim() !== ""
          ? countTeachingDaysInMonth(
              monthStart,
              monthEnd,
              studentDaypackage,
              this.config.includeSundays
            )
          : workingDays; // Fallback to workingDays if no daypackage

      if (student.teacherChangePeriod) {
        // Use data from teacher change period (for old teachers)
        monthlyPackageSalary = student.teacherChangePeriod.monthlyRate;
        // 🆕 Calculate daily rate based on student's daypackage teaching days
        dailyRate = Number(
          (monthlyPackageSalary / studentTeachingDaysInMonth).toFixed(2)
        );
      } else {
        // Use current package salary (for current teachers)
        monthlyPackageSalary =
          student.package && salaryMap[student.package]
            ? Number(salaryMap[student.package])
            : 0;
        // 🆕 Calculate daily rate based on student's daypackage teaching days
        dailyRate = Number(
          (monthlyPackageSalary / studentTeachingDaysInMonth).toFixed(2)
        );
      }

      // Note: We still process students even without a package configured
      // because daypackage determines expected teaching days, not package

      // Get teacher periods for this student
      let periods = teacherPeriods.get(student.wdt_ID.toString()) || [];

      // 🔧 CRITICAL FIX: Use teacher change period data if available
      // This ensures old teachers get paid for the correct teaching period
      if (student.teacherChangePeriod) {
        // Override periods with teacher change period data
        periods = [
          {
            start: student.teacherChangePeriod.startDate,
            end: student.teacherChangePeriod.endDate,
            student: student,
          },
        ];
      }

      // 🔧 CRITICAL FIX: For teacher change students, use zoom links as source of truth
      // This is the same logic as for "Leave" students - occupied_times are deleted but zoom links exist
      const isTeacherChangeStudent = student.teacherChangePeriod;
      const hasZoomLinksForTeacherChange =
        student.zoom_links && student.zoom_links.length > 0;

      if (isTeacherChangeStudent && hasZoomLinksForTeacherChange) {
        // CRITICAL FIX: Filter zoom links to ONLY those within the query period
        // Don't include zoom links from other months
        const zoomDates = student.zoom_links
          .filter((link: any) => {
            if (!link.sent_time) return false;
            const linkDate = new Date(link.sent_time);
            // Only include links within the query period
            return linkDate >= fromDate && linkDate <= toDate;
          })
          .map((link: any) => new Date(link.sent_time!))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        if (zoomDates.length > 0) {
          const firstZoom = zoomDates[0];
          const lastZoom = zoomDates[zoomDates.length - 1];

          // Override periods with zoom link dates (already clamped to query period)
          periods = [
            {
              start: firstZoom,
              end: lastZoom,
              student: student,
            },
          ];
        }
      }

      // NEW: For active students as well, widen periods to cover actual zoom-link range
      // so that assignment date glitches don't cut earlier valid teaching days.
      if (!student.teacherChangePeriod) {
        // CRITICAL FIX: Filter zoom links to ONLY those within the query period
        // Don't include zoom links from other months
        const zoomDates = (student.zoom_links || [])
          .filter((link: any) => {
            if (!link?.sent_time) return false;
            const linkDate = new Date(link.sent_time);
            // Only include links within the query period
            return linkDate >= fromDate && linkDate <= toDate;
          })
          .map((link: any) => new Date(link.sent_time))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        if (zoomDates.length > 0) {
          const firstZoom = zoomDates[0];
          const lastZoom = zoomDates[zoomDates.length - 1];

          // If no periods or if the zoom range extends beyond the current period(s),
          // collapse to a single, zoom-bounded period
          const hasNoPeriods = periods.length === 0;
          const currentStart = periods[0]?.start as Date | undefined;
          const currentEnd = (periods[0]?.end as Date | undefined) || undefined;
          const zoomExtendsBefore = currentStart
            ? firstZoom < currentStart
            : true;
          const zoomExtendsAfter = currentEnd ? lastZoom > currentEnd : true;

          if (hasNoPeriods || zoomExtendsBefore || zoomExtendsAfter) {
            // Periods are already clamped because we filtered zoom links by fromDate/toDate
            periods = [
              {
                start: firstZoom,
                end: lastZoom,
                student: student,
              },
            ];
          }
        }
      }

      // CRITICAL FIX: For "Leave", "Completed", and "Not Succeed" status students,
      // occupied_times records may be deleted or student status changed mid-month
      // So we MUST use zoom links as the source of truth for teaching period
      // Matches: "Leave", "Ramadan Leave", "Is Leave", "Completed", "Not Succeed", etc.
      const isLeaveStudent = student.status?.toLowerCase().includes("leave");
      const isCompletedStudent = student.status
        ?.toLowerCase()
        .includes("completed");
      const isNotSucceedStudent =
        student.status?.toLowerCase().includes("not succeed") ||
        student.status?.toLowerCase().includes("notsucceed");

      const isSpecialStatusStudent =
        isLeaveStudent || isCompletedStudent || isNotSucceedStudent;

      // Check if we have zoom links to work with
      const hasZoomLinks = student.zoom_links && student.zoom_links.length > 0;

      if (isSpecialStatusStudent && hasZoomLinks) {
        // CRITICAL FIX: Filter zoom links to ONLY those within the query period
        // Don't include zoom links from other months
        const zoomDates = student.zoom_links
          .filter((link: any) => {
            if (!link.sent_time) return false;
            const linkDate = new Date(link.sent_time);
            // Only include links within the query period
            return linkDate >= fromDate && linkDate <= toDate;
          })
          .map((link: any) => new Date(link.sent_time!))
          .sort((a: Date, b: Date) => a.getTime() - b.getTime());

        if (zoomDates.length > 0) {
          const firstZoom = zoomDates[0];
          const lastZoom = zoomDates[zoomDates.length - 1];

          // Check if existing period is bad (same start/end day or doesn't match zoom links)
          let needsOverride = false;
          let overrideReason = "";

          if (!periods || periods.length === 0) {
            needsOverride = true;
            overrideReason = "No periods found (occupied_times deleted)";
          } else {
            const firstPeriod = periods[0];

            // Use UTC format for date comparison (database stores in UTC)
            const periodStartDate = firstPeriod.start
              ?.toISOString()
              .split("T")[0];
            const periodEndDate = firstPeriod.end?.toISOString().split("T")[0];
            const firstZoomDate = firstZoom.toISOString().split("T")[0];
            const lastZoomDate = lastZoom.toISOString().split("T")[0];

            // Check if period is a single day (bad data)
            if (periodStartDate === periodEndDate) {
              needsOverride = true;
              overrideReason = `Period is only 1 day (${periodStartDate}) but zoom links span ${firstZoomDate} to ${lastZoomDate}`;
            }
            // Check if period doesn't cover the zoom link range
            else if (
              periodStartDate !== firstZoomDate ||
              periodEndDate !== lastZoomDate
            ) {
              needsOverride = true;
              overrideReason = `Period (${periodStartDate} to ${periodEndDate}) doesn't match zoom links (${firstZoomDate} to ${lastZoomDate})`;
            }
          }

          if (needsOverride) {
            // Override with correct period from zoom links
            periods = [
              {
                start: firstZoom,
                end: lastZoom,
                student: student,
              },
            ];
          }
        }
      }

      // If no specific periods found, check if teacher has zoom links for this student
      // This handles the case where teacher was transferred, or student status changed mid-month
      // (Leave, Completed, Not Succeed) but teacher still has zoom links as evidence of teaching
      if (periods.length === 0) {
        // Check if teacher has any zoom links for this student during the period
        const hasZoomLinks =
          student.zoom_links && student.zoom_links.length > 0;

        if (hasZoomLinks) {
          // CRITICAL FIX: Filter zoom links to ONLY those within the query period
          // Don't include zoom links from other months
          const zoomDates = student.zoom_links
            .filter((link: any) => {
              if (!link.sent_time) return false;
              const linkDate = new Date(link.sent_time);
              // Only include links within the query period
              return linkDate >= fromDate && linkDate <= toDate;
            })
            .map((link: any) => new Date(link.sent_time!))
            .sort((a: Date, b: Date) => a.getTime() - b.getTime());

          if (zoomDates.length > 0) {
            const firstZoomDate = zoomDates[0];
            const lastZoomDate = zoomDates[zoomDates.length - 1];

            // Periods are already within month boundaries because we filtered zoom links
            periods.push({
              start: firstZoomDate,
              end: lastZoomDate,
              student: student,
            });
          }
        } else {
          // Don't create any period - this will result in 0 earnings
          continue;
        }
      }

      // Calculate earnings for each period
      let totalEarned = 0;
      const periodBreakdown = [];

      // 🆕 Reuse studentDaypackage from earlier in the function (already set above)
      // If it wasn't set earlier, set it now before the period loop
      if (!studentDaypackage || studentDaypackage.trim() === "") {
        if (
          student.teacherChangePeriod &&
          student.teacherChangePeriod.dayPackage
        ) {
          studentDaypackage = student.teacherChangePeriod.dayPackage;
        } else if (student.occupiedTimes && student.occupiedTimes.length > 0) {
          studentDaypackage = student.occupiedTimes[0].daypackage || "";
        } else if (student.daypackages) {
          studentDaypackage = student.daypackages;
        }
      }

      // 🔧 CRITICAL FIX: Track dates already processed for this student to prevent double-counting
      // across multiple periods
      const studentProcessedDates = new Set<string>();

      // Debug info for specific student - enhanced for "Not Succeed" students
      const debugInfo: any = {
        studentName: student.name,
        status: student.status,
        isNotSucceed:
          student.status?.toLowerCase().includes("not succeed") ||
          student.status?.toLowerCase().includes("notsucceed"),
        isCompleted: student.status?.toLowerCase().includes("completed"),
        isLeave: student.status?.toLowerCase().includes("leave"),
        zoomLinksCount: student.zoom_links?.length || 0,
        periodsCount: periods.length,
        hasTeacherChangePeriod: !!student.teacherChangePeriod,
        debugMessage: "",
      };

      // Add specific debug message for "Not Succeed" students
      if (debugInfo.isNotSucceed) {
        debugInfo.debugMessage = `🔍 NOT SUCCEED STUDENT DEBUG:
Status: ${student.status}
Zoom Links: ${student.zoom_links?.length || 0}
Periods: ${periods.length}
Teacher Change Period: ${student.teacherChangePeriod ? "Yes" : "No"}
Expected to be paid based on zoom links: ${
          student.zoom_links?.length > 0 ? "Yes" : "No"
        }`;
      } else if (debugInfo.isCompleted) {
        debugInfo.debugMessage = `🔍 COMPLETED STUDENT DEBUG:
Status: ${student.status}
Zoom Links: ${student.zoom_links?.length || 0}
Periods: ${periods.length}
Teacher Change Period: ${student.teacherChangePeriod ? "Yes" : "No"}`;
      } else if (debugInfo.isLeave) {
        debugInfo.debugMessage = `🔍 LEAVE STUDENT DEBUG:
Status: ${student.status}
Zoom Links: ${student.zoom_links?.length || 0}
Periods: ${periods.length}
Teacher Change Period: ${student.teacherChangePeriod ? "Yes" : "No"}`;
      }

      for (const period of periods) {
        const periodStart = new Date(
          Math.max(period.start.getTime(), fromDate.getTime())
        );
        const periodEnd = new Date(
          Math.min((period.end || toDate).getTime(), toDate.getTime())
        );

        // Normalize period start/end to full UTC day boundaries to avoid cutting off valid days
        const periodStartDay = new Date(periodStart);
        periodStartDay.setUTCHours(0, 0, 0, 0);
        const periodEndDay = new Date(periodEnd);
        periodEndDay.setUTCHours(23, 59, 59, 999);

        if (periodStart > periodEnd) continue;

        // Count teaching days in this period
        const teachingDates = new Set<string>();
        const dailyLinks = new Map<string, Date>();

        // CRITICAL FIX: Get zoom links for the full query period, not just the assignment period
        // This ensures we capture all teaching activity even if occupied_times boundaries are wrong
        const periodZoomLinks =
          student.zoom_links?.filter((link: any) => {
            if (!link.sent_time) return false;
            const linkDate = new Date(link.sent_time);
            // Use the full month range (fromDate to toDate) not the assignment period
            return linkDate >= fromDate && linkDate <= toDate;
          }) || [];

        periodZoomLinks.forEach((link: any) => {
          if (link.sent_time) {
            // Ensure sent_time is a Date object
            const sentTime =
              link.sent_time instanceof Date
                ? link.sent_time
                : new Date(link.sent_time);

            // CRITICAL FIX: Use UTC date format (database stores in UTC)
            // Extract date in UTC to match how dates are compared
            const dateStr = sentTime.toISOString().split("T")[0];

            // Don't filter by global Sunday setting here - let daypackage logic handle it
            if (
              !dailyLinks.has(dateStr) ||
              sentTime < dailyLinks.get(dateStr)!
            ) {
              dailyLinks.set(dateStr, sentTime);
            }
          }
        });

        // 🔧 CRITICAL FIX: Use the daypackage we already determined before the loop
        // If we need period-specific daypackage, we can override here, but typically
        // the daypackage is consistent across periods for a student
        // (studentDaypackage is already set before the loop)

        // CRITICAL FIX: For "All days" daypackage, count ALL zoom link dates directly
        // No need to filter through expected teaching days since any day is valid
        const normalizedDaypackage = (studentDaypackage || "").toLowerCase();
        const isAllDaysPackage =
          normalizedDaypackage.includes("all days") ||
          normalizedDaypackage.includes("alldays");

        // Detailed debugging: track all zoom link dates
        const allZoomLinkDates = Array.from(dailyLinks.keys());
        const excludedDays: Array<{ date: string; reason: string }> = [];
        const matchedDaysSet = new Set<string>();
        const permissionDaysSet = new Set<string>();

        const addMatchedDay = (dateStr: string) => {
          matchedDaysSet.add(dateStr);
        };

        const addPermissionDay = (dateStr: string) => {
          permissionDaysSet.add(dateStr);
          matchedDaysSet.add(dateStr);
        };

        // Collect permission days within this period
        const permissionDates = new Set<string>();
        student.attendance_progress?.forEach((att: any) => {
          if (!att?.date || !att.attendance_status) return;
          const status = String(att.attendance_status).toLowerCase();
          if (status !== "permission") return;
          const attDate =
            att.date instanceof Date ? new Date(att.date) : new Date(att.date);
          const attDateUTC = new Date(attDate);
          attDateUTC.setUTCHours(0, 0, 0, 0);
          if (attDateUTC < periodStartDay || attDateUTC > periodEndDay) return;
          permissionDates.add(attDateUTC.toISOString().split("T")[0]);
        });

        if (isAllDaysPackage) {
          // For "All days" package: Count ALL zoom link dates directly
          dailyLinks.forEach((sentTime, dateStr) => {
            // 🔧 CRITICAL FIX: Only count dates that haven't been processed in a previous period
            if (!studentProcessedDates.has(dateStr)) {
              teachingDates.add(dateStr);
              addMatchedDay(dateStr);
              studentProcessedDates.add(dateStr);
            }
          });

          // 🔧 CRITICAL FIX: Treat permission days as paid days for "All days" package
          // Permission days should ALWAYS be counted regardless of whether they match expected days
          permissionDates.forEach((dateStr) => {
            // Only count dates that haven't been processed in a previous period
            // AND are within the query period (fromDate to toDate)
            const permDate = new Date(dateStr);
            permDate.setUTCHours(0, 0, 0, 0);
            if (
              !studentProcessedDates.has(dateStr) &&
              permDate >= fromDate &&
              permDate <= toDate
            ) {
              teachingDates.add(dateStr);
              addPermissionDay(dateStr);
              studentProcessedDates.add(dateStr);
            }
          });
        } else {
          // For specific daypackages (MWF, TTS): Filter by expected teaching days
          const expectedTeachingDays = this.calculateExpectedTeachingDays(
            periodStartDay,
            periodEndDay,
            studentDaypackage
          );

          // Use expected teaching days based on daypackage, but only count days with zoom links OR "Permission" status
          expectedTeachingDays.forEach((dateStr) => {
            const hasZoomLink = dailyLinks.has(dateStr);

            // Check if this date has "Permission" in attendance_progress
            const hasPermission = permissionDates.has(dateStr);

            // Count day if zoom link exists OR has permission
            // 🔧 CRITICAL FIX: Only count dates that haven't been processed in a previous period
            if (
              (hasZoomLink || hasPermission) &&
              !studentProcessedDates.has(dateStr)
            ) {
              teachingDates.add(dateStr);
              studentProcessedDates.add(dateStr);
              if (hasPermission) {
                addPermissionDay(dateStr);
              } else {
                addMatchedDay(dateStr);
              }
            }
          });

          // Track zoom link dates that were NOT in expected teaching days
          allZoomLinkDates.forEach((zoomDate) => {
            if (!expectedTeachingDays.includes(zoomDate)) {
              excludedDays.push({
                date: zoomDate,
                reason: `Not in expected teaching days for daypackage "${studentDaypackage}"`,
              });
            }
          });
        }

        const periodEarnings = Number(
          (dailyRate * teachingDates.size).toFixed(2)
        );
        totalEarned += periodEarnings;

        // Add to daily earnings - only add once per date per student
        teachingDates.forEach((dateStr) => {
          if (!dailyEarnings.has(dateStr)) {
            dailyEarnings.set(dateStr, 0);
          }
          // 🔧 CRITICAL FIX: Only add dailyRate once per date, even if processed in multiple periods
          // The check above ensures we only process each date once across all periods
          dailyEarnings.set(
            dateStr,
            Number((dailyEarnings.get(dateStr)! + dailyRate).toFixed(2))
          );
        });

        if (teachingDates.size > 0) {
          // Determine teacher role based on the period
          let teacherRole: "old_teacher" | "new_teacher" = "new_teacher";
          let changeDate: string | undefined;

          // Check if this period corresponds to a teacher change
          const teacherChangePeriod = teacherChangePeriods.find(
            (tcp) =>
              tcp.studentId === student.wdt_ID &&
              tcp.startDate <= periodStart &&
              tcp.endDate >= periodEnd
          );

          if (teacherChangePeriod) {
            // Check if this teacher was the old teacher (before change) or new teacher (after change)
            const changeHistory = await prisma.teacher_change_history.findFirst(
              {
                where: {
                  student_id: student.wdt_ID,
                  change_date: {
                    gte: periodStart,
                    lte: periodEnd,
                  },
                },
                orderBy: { change_date: "asc" },
              }
            );

            if (changeHistory) {
              teacherRole =
                changeHistory.old_teacher_id === teacherId
                  ? "old_teacher"
                  : "new_teacher";
              // Use UTC format (database stores in UTC)
              changeDate = changeHistory.change_date
                .toISOString()
                .split("T")[0];
            }
          }

          // Use UTC format for consistency
          // Calculate expected teaching days for display (even if not used for All days)
          const expectedTeachingDaysForDisplay = isAllDaysPackage
            ? Array.from(
                new Set([...allZoomLinkDates, ...Array.from(permissionDates)])
              ).sort() // For "All days", expected = zoom links + permission days
            : this.calculateExpectedTeachingDays(
                periodStartDay,
                periodEndDay,
                studentDaypackage
              );

          periodBreakdown.push({
            period: `${periodStart.toISOString().split("T")[0]} to ${
              periodEnd.toISOString().split("T")[0]
            }`,
            daysWorked: teachingDates.size,
            dailyRate: dailyRate,
            periodEarnings: periodEarnings,
            teachingDates: Array.from(teachingDates),
            teacherRole: teacherRole,
            changeDate: changeDate,
            // Detailed work day tracking for debugging
            detailedDays: {
              allZoomLinkDates: allZoomLinkDates,
              expectedTeachingDays: expectedTeachingDaysForDisplay,
              matchedDays: Array.from(matchedDaysSet).sort(),
              excludedDays: excludedDays,
              daypackageUsed: studentDaypackage,
              totalZoomLinks: periodZoomLinks.length,
              countedDays: teachingDates.size,
              ...(permissionDaysSet.size > 0 && {
                permissionDays: Array.from(permissionDaysSet).sort(),
              }),
            },
          });
        }
      }

      // Calculate actual days worked for this student
      const studentTeachingDates = new Set<string>();
      periodBreakdown.forEach((period: any) => {
        period.teachingDates.forEach((date: string) => {
          studentTeachingDates.add(date);
        });
      });

      if (totalEarned > 0) {
        // Aggregate detailed day information from all periods
        const allZoomLinkDates = new Set<string>();
        const allExpectedDays = new Set<string>();
        const allMatchedDays = new Set<string>();
        const allExcludedDays: Array<{ date: string; reason: string }> = [];
        const allPermissionDays = new Set<string>();
        let daypackageUsed = "";
        let totalZoomLinksCount = 0;

        periodBreakdown.forEach((period: any) => {
          if (period.detailedDays) {
            period.detailedDays.allZoomLinkDates?.forEach((d: string) =>
              allZoomLinkDates.add(d)
            );
            period.detailedDays.expectedTeachingDays?.forEach((d: string) =>
              allExpectedDays.add(d)
            );
            period.detailedDays.matchedDays?.forEach((d: string) =>
              allMatchedDays.add(d)
            );
            period.detailedDays.excludedDays?.forEach((e: any) => {
              if (!allExcludedDays.find((ex) => ex.date === e.date)) {
                allExcludedDays.push(e);
              }
            });
            period.detailedDays.permissionDays?.forEach((d: string) =>
              allPermissionDays.add(d)
            );
            daypackageUsed =
              period.detailedDays.daypackageUsed || daypackageUsed;
            totalZoomLinksCount += period.detailedDays.totalZoomLinks || 0;
          }
        });

        const evidenceDaysCount = new Set([
          ...Array.from(allZoomLinkDates),
          ...Array.from(allPermissionDays),
        ]).size;

        // 🆕 Calculate daypackage information for salary breakdown
        // Ensure we use student.daypackages as fallback if studentDaypackage is empty
        const studentDaypackageValue =
          studentDaypackage && studentDaypackage.trim() !== ""
            ? studentDaypackage
            : student.daypackages && student.daypackages.trim() !== ""
            ? student.daypackages
            : "";
        const daypackageFormatted = formatDayPackage(studentDaypackageValue);
        const daypackageDays = getDayNamesFromDaypackage(
          studentDaypackageValue
        );
        const teachingDaysInMonth = countTeachingDaysInMonth(
          monthStart,
          monthEnd,
          studentDaypackageValue,
          this.config.includeSundays
        );

        studentBreakdown.push({
          studentName: student.name || "Unknown",
          package: student.package || "Unknown",
          monthlyRate: monthlyPackageSalary,
          dailyRate: dailyRate,
          daysWorked: studentTeachingDates.size,
          totalEarned: totalEarned,
          // 🆕 Daypackage information for salary calculation display
          daypackage: studentDaypackageValue,
          daypackageFormatted: daypackageFormatted,
          daypackageDays: daypackageDays,
          teachingDaysInMonth: teachingDaysInMonth,
          periods: periodBreakdown,
          teacherChanges: periods.length > 1,
          // Enhanced student information for all students
          studentInfo: {
            studentId: student.wdt_ID,
            studentStatus: student.status,
            package: student.package,
            daypackage: student.daypackages,
            zoomLinksTotal: student.zoom_links?.length || 0,
            // 🔧 CRITICAL FIX: Include permission days in zoomLinkDates for display
            // Permission days should appear in the listing even though no zoom link was sent
            zoomLinkDates: (() => {
              const actualZoomLinkDates =
                student.zoom_links?.map((link: any) => {
                  // Use UTC format (database stores in UTC)
                  return new Date(link.sent_time).toISOString().split("T")[0];
                }) || [];

              // Merge permission days with zoom link dates for display
              const allDisplayDates = new Set([
                ...actualZoomLinkDates,
                ...Array.from(allPermissionDays),
              ]);

              return Array.from(allDisplayDates).sort();
            })(),
            isNotSucceed: debugInfo.isNotSucceed,
            isCompleted: debugInfo.isCompleted,
            isLeave: debugInfo.isLeave,
            isActive: debugInfo.isActive,
            isNotYet: debugInfo.isNotYet,
            statusReason: debugInfo.isNotSucceed
              ? "Not succeed student with zoom links - teacher should be paid"
              : debugInfo.isCompleted
              ? "Completed student with zoom links - teacher should be paid"
              : debugInfo.isLeave
              ? "Leave student with zoom links - teacher should be paid"
              : "Active student - normal calculation",
          },
          // Detailed work day breakdown for debugging
          workDayDetails: {
            allZoomLinkDates: Array.from(allZoomLinkDates).sort(),
            expectedTeachingDays: Array.from(allExpectedDays).sort(),
            matchedDays: Array.from(allMatchedDays).sort(),
            excludedDays: allExcludedDays,
            daypackageUsed: daypackageUsed,
            totalZoomLinks: totalZoomLinksCount,
            countedDays: studentTeachingDates.size,
            ...(allPermissionDays.size > 0 && {
              permissionDays: Array.from(allPermissionDays).sort(),
            }),
            discrepancy: evidenceDaysCount !== studentTeachingDates.size,
            discrepancyDetails:
              evidenceDaysCount !== studentTeachingDates.size
                ? `${evidenceDaysCount} qualifying days (zoom links + permissions) but only ${studentTeachingDates.size} days counted`
                : "No discrepancy",
          },
        });
      }
    }

    const totalSalary = Number(
      Array.from(dailyEarnings.values())
        .reduce((sum, amount) => sum + amount, 0)
        .toFixed(2)
    );

    // Calculate actual teaching days (unique dates with earnings)
    const actualTeachingDays = dailyEarnings.size;

    const averageDailyEarning =
      actualTeachingDays > 0
        ? Number((totalSalary / actualTeachingDays).toFixed(2))
        : 0;

    // Count only students who actually earned something for this teacher
    // Exclude students who were transferred away and have no earnings
    const activeStudentCount = studentBreakdown.filter(
      (student) => student.totalEarned > 0
    ).length;

    return {
      totalSalary,
      teachingDays: actualTeachingDays,
      workingDays,
      averageDailyEarning,
      dailyEarnings: Array.from(dailyEarnings.entries()).map(
        ([date, amount]) => ({
          date,
          amount,
        })
      ),
      studentBreakdown,
      numStudents: activeStudentCount, // Return the count of students with earnings
    };
  }

  private async calculateLatenessDeductions(
    teacherId: string,
    assignments: any[],
    fromDate: Date,
    toDate: Date,
    isDebugMode: boolean = false
  ) {
    // Get teacher change history for this teacher
    const teacherChanges = await prisma.teacher_change_history.findMany({
      where: {
        OR: [{ old_teacher_id: teacherId }, { new_teacher_id: teacherId }],
        change_date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        student_id: true,
        old_teacher_id: true,
        new_teacher_id: true,
        change_date: true,
      },
    });

    // Get ALL students for this teacher (EXACT same as preview API)
    // Use OR to catch both current assignments AND historical assignments (teacher changes)
    // IMPORTANT: Include students with ANY status - teacher should be paid for days taught
    // even if student left mid-month
    const allStudents = await prisma.wpos_wpdatatable_23.findMany({
      where: {
        OR: [
          // Current assignment (any status)
          {
            ustaz: teacherId,
            // No status filter - include all students with zoom links
          },
          // Historical assignment via occupiedTimes (any status)
          {
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
        daypackages: true, // ✅ ADDED: Include daypackages field
        zoom_links: true, // Get ALL zoom links (filter later)
        occupiedTimes: {
          select: {
            time_slot: true,
            daypackage: true, // ✅ ADDED: Include daypackage field
          },
        },
      },
    });

    // 🆕 Get package salaries to calculate daily rates (instead of using packageDeduction table)
    const packageSalaries = await prisma.packageSalary.findMany();
    const salaryMap: Record<string, number> = {};
    packageSalaries.forEach((pkg) => {
      salaryMap[pkg.packageName] = Number(pkg.salaryPerStudent);
    });

    // 🆕 Calculate month boundaries for teaching days calculation
    const monthStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
    const monthEnd = new Date(
      fromDate.getFullYear(),
      fromDate.getMonth() + 1,
      0
    );
    monthEnd.setUTCHours(23, 59, 59, 999);
    const workingDays = this.calculateWorkingDays(monthStart, monthEnd);

    // Get lateness config with tiers
    const latenessConfigs = await prisma.latenessdeductionconfig.findMany({
      where: {
        OR: [{ teacherId }, { isGlobal: true }],
      },
      orderBy: [{ tier: "asc" }, { startMinute: "asc" }],
    });

    // Get lateness deduction waivers for the period
    const latenessWaivers = await prisma.deduction_waivers.findMany({
      where: {
        teacherId,
        deductionType: "lateness",
        deductionDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: { deductionDate: true, reason: true },
    });

    if (latenessConfigs.length === 0) {
      return { totalDeduction: 0, breakdown: [] };
    }

    const excusedThreshold = Math.min(
      ...latenessConfigs.map((c: any) => c.excusedThreshold ?? 0)
    );

    let totalDeduction = 0;
    const breakdown: any[] = [];

    // Group zoom links by date with teacher change period filtering
    const dailyZoomLinks = new Map<string, any[]>();

    for (const student of allStudents) {
      student.zoom_links?.forEach((link: any) => {
        if (link.sent_time) {
          const linkDate = new Date(link.sent_time);
          const dateStr = format(link.sent_time, "yyyy-MM-dd");

          // 🔧 CRITICAL FIX: Filter zoom links based on teacher change periods
          let shouldIncludeLink = true;

          // Check if this student had a teacher change during the period
          const studentChange = teacherChanges.find(
            (change) => change.student_id === student.wdt_ID
          );

          if (studentChange) {
            if (teacherId === studentChange.old_teacher_id) {
              // For old teacher: only include links BEFORE the change date
              shouldIncludeLink =
                linkDate < new Date(studentChange.change_date);
            } else if (teacherId === studentChange.new_teacher_id) {
              // For new teacher: only include links AFTER the change date
              shouldIncludeLink =
                linkDate >= new Date(studentChange.change_date);
            }
          }

          if (shouldIncludeLink) {
            if (!dailyZoomLinks.has(dateStr)) {
              dailyZoomLinks.set(dateStr, []);
            }
            dailyZoomLinks.get(dateStr)!.push({
              ...link,
              studentId: student.wdt_ID,
              studentName: student.name,
              studentPackage: student.package,
              timeSlot: student.occupiedTimes?.[0]?.time_slot,
            });
          }
        }
      });
    }

    // Calculate lateness for each day (EXACT same logic as preview API)
    for (const [dateStr, links] of dailyZoomLinks.entries()) {
      const date = new Date(dateStr);
      if (date < fromDate || date > toDate) continue;

      // Check if there's a lateness waiver for this date
      const hasLatenessWaiver = latenessWaivers.some(
        (waiver) => format(waiver.deductionDate, "yyyy-MM-dd") === dateStr
      );

      if (hasLatenessWaiver) {
        continue;
      }

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
        if (!link.timeSlot) {
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
        // Both should be in the same timezone for accurate comparison
        const scheduledTime = new Date(link.sent_time);
        scheduledTime.setHours(schedHours, schedMinutes, 0, 0);

        // Calculate lateness in minutes
        const latenessMinutes = Math.round(
          (link.sent_time.getTime() - scheduledTime.getTime()) / 60000
        );

        // Skip if early (negative lateness)
        if (latenessMinutes < 0) {
          continue;
        }

        if (latenessMinutes > excusedThreshold) {
          let deduction = 0;
          let tier = "No Tier";

          // 🆕 Get student's daily rate instead of package deduction amount
          const student = allStudents.find((s) => s.wdt_ID === link.studentId);
          const studentPackage = student?.package || "";
          const monthlySalary = salaryMap[studentPackage] || 0;

          // Calculate daily rate based on student's daypackage
          let dailyRate = 0;
          if (monthlySalary > 0) {
            const studentDaypackage = student?.daypackages || "";
            const studentTeachingDaysInMonth =
              studentDaypackage && studentDaypackage.trim() !== ""
                ? countTeachingDaysInMonth(
                    monthStart,
                    monthEnd,
                    studentDaypackage,
                    this.config.includeSundays
                  )
                : workingDays;
            dailyRate = Number(
              (monthlySalary / studentTeachingDaysInMonth).toFixed(2)
            );
          }

          // Use daily rate as base deduction amount
          const baseDeductionAmount = dailyRate || 0;

          // Find appropriate tier
          for (const [i, t] of latenessConfigs.entries()) {
            if (
              latenessMinutes >= t.startMinute &&
              latenessMinutes <= t.endMinute
            ) {
              deduction = Math.round(
                baseDeductionAmount * ((t.deductionPercent || 0) / 100)
              );
              tier = `Tier ${i + 1} (${t.deductionPercent}%)`;
              break;
            }
          }

          if (deduction > 0) {
            totalDeduction += deduction;

            breakdown.push({
              date: dateStr,
              studentName: link.studentName || "Unknown Student",
              scheduledTime: link.timeSlot,
              actualTime: link.sent_time.toTimeString().split(" ")[0],
              latenessMinutes,
              tier,
              deduction: Number(deduction.toFixed(2)),
            });
          }
        }
      }
    }

    return {
      totalDeduction: Number(totalDeduction.toFixed(2)),
      breakdown,
    };
  }

  private async calculateAbsenceDeductions(
    teacherId: string,
    assignments: any[],
    fromDate: Date,
    toDate: Date
  ) {
    try {
      // Don't process future dates
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const effectiveToDate = toDate > today ? today : toDate;

      // Get teacher change history for this teacher
      const teacherChanges = await prisma.teacher_change_history.findMany({
        where: {
          OR: [{ old_teacher_id: teacherId }, { new_teacher_id: teacherId }],
          change_date: {
            gte: fromDate,
            lte: effectiveToDate,
          },
        },
        select: {
          student_id: true,
          old_teacher_id: true,
          new_teacher_id: true,
          change_date: true,
        },
      });

      // 🆕 Get package salaries to calculate daily rates (instead of using packageDeduction table)
      const packageSalaries = await prisma.packageSalary.findMany();
      const salaryMap: Record<string, number> = {};
      packageSalaries.forEach((pkg) => {
        salaryMap[pkg.packageName] = Number(pkg.salaryPerStudent);
      });

      // 🆕 Calculate month boundaries for teaching days calculation
      const monthStart = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth(),
        1
      );
      const monthEnd = new Date(
        fromDate.getFullYear(),
        fromDate.getMonth() + 1,
        0
      );
      monthEnd.setUTCHours(23, 59, 59, 999);
      const workingDays = this.calculateWorkingDays(monthStart, monthEnd);

      // Get permission requests and waivers
      const [permissionRequests, deductionWaivers] = await Promise.all([
        prisma.permissionrequest.findMany({
          where: {
            teacherId,
            requestedDate: {
              gte: format(fromDate, "yyyy-MM-dd"),
              lte: format(effectiveToDate, "yyyy-MM-dd"),
            },
            status: "Approved",
          },
          select: { requestedDate: true },
        }),
        prisma.deduction_waivers.findMany({
          where: {
            teacherId,
            deductionType: "absence",
            deductionDate: {
              gte: fromDate,
              lte: effectiveToDate,
            },
          },
          select: { deductionDate: true, reason: true },
        }),
      ]);

      // Create a map of waived dates with their student details
      // Format: dateStr -> Set of student names covered by waiver
      const waivedDatesMap = new Map<string, Set<string>>();
      for (const waiver of deductionWaivers) {
        const dateStr = format(waiver.deductionDate, "yyyy-MM-dd");
        // Extract student names from waiver reason
        // Format: "reason | N student(s): Student Name (Package): Rate ETB; Student Name 2 (Package2): Rate2 ETB"
        const reasonPart = waiver.reason.split("|")[1]?.trim() || "";
        // Remove the "N student(s): " prefix if present
        const studentDetails = reasonPart
          .replace(/^\d+\s+student\(s\):\s*/i, "")
          .trim();
        const studentNames = new Set(
          studentDetails
            .split(";")
            .map((s) => {
              // Extract name before the first "("
              const namePart = s.trim().split("(")[0].trim();
              return namePart;
            })
            .filter(Boolean)
        );
        waivedDatesMap.set(dateStr, studentNames);
      }
      const waivedDates = new Set(waivedDatesMap.keys());
      const permittedDates = new Set(
        permissionRequests.map((p) => p.requestedDate)
      );

      // Get all students assigned to this teacher during the period
      // IMPORTANT: Include students with ANY status - teacher should be evaluated for all students taught
      // even if student left mid-month (they should still get deductions for missed days before leaving)
      const students = await prisma.wpos_wpdatatable_23.findMany({
        where: {
          OR: [
            // Current assignments (any status)
            {
              ustaz: teacherId,
              // No status filter - include all students
              occupiedTimes: {
                some: {
                  ustaz_id: teacherId,
                  occupied_at: { lte: effectiveToDate },
                  OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
                },
              },
            },
            // Historical assignments from audit logs (any status)
            {
              // No status filter - include all students
              occupiedTimes: {
                some: {
                  ustaz_id: teacherId,
                  occupied_at: { lte: effectiveToDate },
                  OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
                },
              },
            },
          ],
        },
        include: {
          occupiedTimes: {
            where: {
              ustaz_id: teacherId,
              occupied_at: { lte: effectiveToDate },
              OR: [{ end_at: null }, { end_at: { gte: fromDate } }],
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
              sent_time: {
                gte: fromDate,
                lte: effectiveToDate,
              },
            },
            select: { sent_time: true },
          },
          attendance_progress: {
            where: {
              date: {
                gte: fromDate,
                lte: effectiveToDate,
              },
            },
            select: { date: true, attendance_status: true },
          },
        },
      });

      let totalDeduction = 0;
      const breakdown: any[] = [];

      // Helper function to parse daypackage
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
          const days = numericMatch.map(Number).filter((d) => d >= 0 && d <= 6);
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

      // Calculate working days for this period (for absence calculation)
      const absenceWorkingDays = this.calculateWorkingDays(
        fromDate,
        effectiveToDate
      );

      // Safe date iteration to avoid invalid dates like Sept 31st
      const safeDateIterator = (startDate: Date, endDate: Date) => {
        const dates: Date[] = [];
        const current = new Date(startDate);

        while (current <= endDate) {
          // Validate the date to avoid invalid dates like Sept 31st
          const year = current.getFullYear();
          const month = current.getMonth();
          const day = current.getDate();

          // Check if this is a valid date
          const testDate = new Date(year, month, day);
          if (
            testDate.getFullYear() === year &&
            testDate.getMonth() === month &&
            testDate.getDate() === day
          ) {
            dates.push(new Date(testDate));
          }

          // Move to next day safely
          current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
        }

        return dates;
      };

      const datesToProcess = safeDateIterator(fromDate, effectiveToDate);

      for (const d of datesToProcess) {
        // Use UTC format for consistency with zoom link dates
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getUTCDay();
        const dayOfMonth = d.getUTCDate();

        // CRITICAL FIX: Skip 31st day from absence deductions
        // Timezone mismatch between UTC storage and Riyadh business hours
        if (dayOfMonth === 31) {
          continue; // No absence deductions for 31st day
        }

        // Skip Sunday unless configured to include
        if (dayOfWeek === 0 && !this.config.includeSundays) {
          continue;
        }

        // Skip if permitted (date-level permission)
        if (permittedDates.has(dateStr)) {
          continue;
        }

        // Note: We don't skip the entire date if waived - we check per-student below
        // This allows some students to be waived while others on the same date are not

        let dailyDeduction = 0;
        const affectedStudents: any[] = [];

        // Check each student
        for (const student of students) {
          // Check if teacher was actually assigned to this student on this date
          // considering teacher changes
          const isAssigned = this.isTeacherAssignedOnDate(
            teacherId,
            student.wdt_ID,
            d,
            teacherChanges,
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
            // Check if student has any zoom links during the period
            const hasZoomLinksInPeriod = student.zoom_links?.some(
              (link: any) => {
                if (!link.sent_time) return false;
                const linkDate = new Date(link.sent_time);
                return linkDate >= fromDate && linkDate <= effectiveToDate;
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
          const hasZoomLink = student.zoom_links?.some((link: any) => {
            if (!link.sent_time) return false;
            const linkDate = format(new Date(link.sent_time), "yyyy-MM-dd");
            return linkDate === dateStr;
          });

          if (hasZoomLink) {
            continue;
          }

          // Check attendance permission
          const attendanceRecord = student.attendance_progress?.find(
            (att: any) => {
              const attDate = format(new Date(att.date), "yyyy-MM-dd");
              return attDate === dateStr;
            }
          );

          if (attendanceRecord?.attendance_status === "Permission") {
            continue;
          }

          // Check if this specific student is covered by a waiver
          const waiverInfo = waivedDatesMap.get(dateStr);
          const studentName = student.name || "";
          const isWaived =
            waiverInfo && waiverInfo.size > 0 && waiverInfo.has(studentName);

          // Handle old-format waivers (no student details in reason)
          // If waiver exists but has no student names, it means it's an old format waiver
          // that covers all students on that date - skip this student
          if (waiverInfo && waiverInfo.size === 0) {
            // Old format waiver - skip this student
            continue;
          }

          // 🆕 Calculate daily rate instead of using package deduction rate
          const studentPackage = student.package || "";
          const monthlySalary = salaryMap[studentPackage] || 0;

          let dailyRate = 0;
          if (monthlySalary > 0) {
            const studentDaypackage = student.daypackages || "";
            const studentTeachingDaysInMonth =
              studentDaypackage && studentDaypackage.trim() !== ""
                ? countTeachingDaysInMonth(
                    monthStart,
                    monthEnd,
                    studentDaypackage,
                    this.config.includeSundays
                  )
                : absenceWorkingDays;
            dailyRate = Number(
              (monthlySalary / studentTeachingDaysInMonth).toFixed(2)
            );
          }

          if (!isWaived) {
            // Only add to daily deduction if not waived
            dailyDeduction += dailyRate;
          }

          // Always add to affectedStudents (even if waived) so it shows in breakdown
          affectedStudents.push({
            studentId: student.wdt_ID,
            studentName: student.name || "Unknown Student",
            studentPackage: student.package || "Unknown Package",
            rate: dailyRate,
            daypackage: relevantOccupiedTimes[0]?.daypackage || "Unknown",
            waived: isWaived, // Mark if waived
          });
        }

        // Add dailyDeduction to total (only includes non-waived students)
        if (dailyDeduction > 0) {
          totalDeduction += dailyDeduction;
        }

        // Add individual student entries to breakdown for detailed view
        // Include both waived and non-waived students so they're visible
        affectedStudents.forEach((student) => {
          const isWaived = (student as any).waived || false;
          // Always show the original deduction amount, even if waived
          // The UI will handle displaying it correctly (strikethrough + positive amount)
          const deductionAmount = Number(student.rate.toFixed(2));

          breakdown.push({
            date: dateStr,
            studentId: student.studentId,
            studentName: student.studentName,
            studentPackage: student.studentPackage,
            reason: isWaived
              ? "Waived (deduction adjustment)"
              : "No zoom link sent",
            deduction: deductionAmount, // Show original amount, not 0
            permitted: false,
            waived: isWaived, // Mark as waived so UI can display it correctly
          });
        });
      }

      return {
        totalDeduction: Number(totalDeduction.toFixed(2)),
        breakdown,
      };
    } catch (error) {
      console.error(
        `Error calculating absence deductions for teacher ${teacherId}:`,
        error
      );
      return {
        totalDeduction: 0,
        breakdown: [],
      };
    }
  }

  private async calculateBonuses(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ) {
    // Get quality assessment bonuses
    const qualityBonuses = await prisma.qualityassessment.aggregate({
      where: {
        teacherId,
        weekStart: { gte: fromDate, lte: toDate },
        managerApproved: true,
      },
      _sum: { bonusAwarded: true },
    });

    // Get bonus records
    const bonusRecords = await prisma.bonusrecord.findMany({
      where: {
        teacherId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const totalQualityBonus = qualityBonuses._sum.bonusAwarded || 0;
    const totalRecordBonus = bonusRecords.reduce(
      (sum, record) => sum + (record.amount || 0),
      0
    );

    return Number((totalQualityBonus + totalRecordBonus).toFixed(2));
  }

  private async calculateDetailedLatenessRecords(
    teacherId: string,
    assignments: any[],
    fromDate: Date,
    toDate: Date
  ) {
    // Implementation for detailed lateness records
    return [];
  }

  private async calculateDetailedAbsenceRecords(
    teacherId: string,
    assignments: any[],
    fromDate: Date,
    toDate: Date
  ) {
    // Implementation for detailed absence records
    return [];
  }

  private async getUnmatchedZoomLinks(
    teacherId: string,
    fromDate: Date,
    toDate: Date
  ) {
    // Implementation for unmatched zoom links
    return [];
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Clear cache for specific teacher
   */
  clearTeacherCache(teacherId: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(`salary_${teacherId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Clear cache for specific date range
   */
  clearDateRangeCache(fromDate: Date, toDate: Date): void {
    const keysToDelete: string[] = [];
    const fromDateStr = fromDate.toISOString();
    const toDateStr = toDate.toISOString();

    for (const key of this.cache.keys()) {
      if (key.includes(fromDateStr) || key.includes(toDateStr)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Static method to clear global cache
   */
  static clearGlobalCache(): void {
    SalaryCalculator.globalCache.clear();
  }

  /**
   * Static method to clear cache for specific teacher across all instances
   */
  static clearGlobalTeacherCache(teacherId: string): void {
    const keysToDelete: string[] = [];
    for (const key of SalaryCalculator.globalCache.keys()) {
      if (key.includes(`salary_${teacherId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => SalaryCalculator.globalCache.delete(key));
  }
}

/**
 * Factory function to create a configured salary calculator
 * Uses centralized configuration for consistency
 */
export async function createSalaryCalculator(): Promise<SalaryCalculator> {
  // Import centralized config loader
  const { getSalaryConfig } = await import("./salary-config");

  // Load configuration from centralized config
  const salaryConfig = await getSalaryConfig();

  const config: SalaryCalculationConfig = {
    includeSundays: salaryConfig.includeSundays,
    excusedThreshold: salaryConfig.latenessConfig.excusedThreshold,
    latenessTiers: salaryConfig.latenessConfig.tiers,
    packageDeductions: salaryConfig.packageDeductions,
  };

  return new SalaryCalculator(config);
}
