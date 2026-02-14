import { prisma } from "@/lib/prisma";
import { SalaryCalculator } from "./salary-calculator";
import { clearCalculatorCache } from "./calculator-cache";
import { getEthiopianTime } from "./ethiopian-time";

/**
 * Create zoom link with package rate tracking
 */
export async function createZoomLinkWithPackage(
  teacherId: string,
  studentId: number,
  zoomLink: string
) {
  // Get student's current package
  const student = await prisma.wpos_wpdatatable_23.findUnique({
    where: { wdt_ID: studentId },
    select: { package: true },
  });

  // Default values for when package is not found
  let packageId: string | null = null;
  let packageRate: number = 0;

  // Try to get package information if available
  if (student?.package) {
    const packageSalary = await prisma.packageSalary.findFirst({
      where: { packageName: student.package },
    });

    if (packageSalary) {
      packageId = student.package;
      packageRate = packageSalary.salaryPerStudent;
    } else {
      console.warn(`Package salary not found for ${student.package}, using default values`);
    }
  } else {
    console.warn(`Student ${studentId} has no package assigned, using default values`);
  }

  // Get student info (notifications are sent to students only)
  const studentInfo = await prisma.wpos_wpdatatable_23.findUnique({
    where: { wdt_ID: studentId },
    select: { name: true },
  });

  // Create zoom link with package info (or default values)
  // Use Ethiopian local time (UTC+3)
  const result = await prisma.wpos_zoom_links.create({
    data: {
      ustazid: teacherId,
      studentid: parseInt(studentId),
      link: zoomLink,
      tracking_token: `${teacherId}_${studentId}_${Date.now()}`,
      sent_time: getEthiopianTime(),
      packageId: packageId,
      packageRate: packageRate,
    },
  });

  // Note: Zoom link notifications are sent to students via the API route
  // Teachers receive zoom links through the web interface, not Telegram notifications

  // Clear salary cache for this teacher to ensure dynamic updates
  SalaryCalculator.clearGlobalTeacherCache(teacherId);

  // Clear the calculator cache to force fresh data
  clearCalculatorCache();

  return result;
}

/**
 * Get zoom links for teacher in date range
 */
export async function getTeacherZoomLinks(
  teacherId: string,
  startDate: Date,
  endDate: Date
) {
  return await prisma.wpos_zoom_links.findMany({
    where: {
      ustazid: teacherId,
      sent_time: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      sent_time: "asc",
    },
  });
}
