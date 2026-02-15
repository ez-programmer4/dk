import React from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import TeacherPaymentsClient from "./TeacherPaymentsClient";
import {
  createSalaryCalculator,
  TeacherSalaryData,
} from "@/lib/salary-calculator";
import { parseISO } from "date-fns";
 import { HybridFeatureGate } from "@/lib/features/hybrid-feature-gate";
import { UpgradePrompt } from "@/components/features";

interface TeacherPaymentsPageProps {
  searchParams: Promise<{
    month?: string;
    year?: string;
    clearCache?: string;
  }>;
}

interface PaymentStatistics {
  totalTeachers: number;
  totalSalary: number;
  totalDeductions: number;
  paidTeachers: number;
  unpaidTeachers: number;
  averageSalary: number;
  paymentRate: number;
}

export default async function TeacherPaymentsPage({
  searchParams,
  params,
}: TeacherPaymentsPageProps & { params: { schoolSlug: string } }) {
  const schoolSlug = params.schoolSlug;
  // Check authentication
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "admin") {
    redirect("/login");
  }

  // Check feature access
  const userId = (session.user as any).id;
  const featureAccess = await HybridFeatureGate.evaluateFeatureAccess("teacher_payment", {
    schoolId: schoolSlug,
    userId,
    userRole: "admin"
  });

  if (!featureAccess.access) {
    return (
      <div className="container mx-auto px-4 py-8">
        <UpgradePrompt feature="teacher_payment" />
      </div>
    );
  }

  // Await searchParams in Next.js 15
  const searchParamsData = await searchParams;

  // Get current month/year or from search params
  const currentDate = new Date();
  const selectedMonth = searchParamsData.month
    ? parseInt(searchParamsData.month)
    : currentDate.getMonth() + 1;
  const selectedYear = searchParamsData.year
    ? parseInt(searchParamsData.year)
    : currentDate.getFullYear();

  // Calculate date range
  const startDate = `${selectedYear}-${String(selectedMonth).padStart(
    2,
    "0"
  )}-01`;
  const lastDayOfMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const endDate = `${selectedYear}-${String(selectedMonth).padStart(
    2,
    "0"
  )}-${String(lastDayOfMonth).padStart(2, "0")}`;

  // Parse dates
  const fromDate = parseISO(startDate);
  const toDate = parseISO(endDate);

  // Fetch data server-side
  let teachers: TeacherSalaryData[] = [];
  let statistics: PaymentStatistics | null = null;
  let error: string | null = null;

  try {
    // Get school information first
    const { prisma } = await import("@/lib/prisma");
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true },
    });

    if (!school) {
      throw new Error("School not found");
    }

    const calculator = await createSalaryCalculator(school.id);

    // Clear cache if requested
    if (searchParamsData.clearCache === "true") {
      calculator.clearCache();
    }

    // Calculate all teacher salaries
    const teachersData = await calculator.calculateAllTeacherSalaries(
      fromDate,
      toDate,
      school.id
    );
    teachers = teachersData || [];

    // Calculate statistics
    if (teachers.length > 0) {
      const totalDeductions = teachers.reduce(
        (sum, t) => sum + t.latenessDeduction + t.absenceDeduction,
        0
      );

      statistics = {
        totalTeachers: teachers.length,
        totalSalary: teachers.reduce((sum, t) => sum + t.totalSalary, 0),
        totalDeductions,
        paidTeachers: teachers.filter((t) => t.status === "Paid").length,
        unpaidTeachers: teachers.filter((t) => t.status === "Unpaid").length,
        averageSalary:
          teachers.reduce((sum, t) => sum + t.totalSalary, 0) / teachers.length,
        paymentRate:
          (teachers.filter((t) => t.status === "Paid").length /
            teachers.length) *
          100,
      };
    }
  } catch (err) {
    console.error("Error fetching teacher payment data:", err);
    error =
      err instanceof Error
        ? err.message
        : "Failed to fetch teacher payment data";
  }

  // Load settings server-side using centralized configuration
  let includeSundays = false;
  let showTeacherSalary = true;
  let customMessage = "";
  let adminContact = "";

  try {
    const { getSalaryConfig } = await import("@/lib/salary-config");
    const config = await getSalaryConfig();

    includeSundays = config.includeSundays;
    showTeacherSalary = config.showTeacherSalary;
    customMessage = config.customMessage;
    adminContact = config.adminContact;
  } catch (err) {
    console.error("Error loading settings:", err);
  }

  return (
    <TeacherPaymentsClient
      initialTeachers={teachers}
      initialStatistics={statistics}
      initialError={error}
      initialIncludeSundays={includeSundays}
      initialShowTeacherSalary={showTeacherSalary}
      initialCustomMessage={customMessage}
      initialAdminContact={adminContact}
      selectedMonth={selectedMonth}
      selectedYear={selectedYear}
      startDate={startDate}
      endDate={endDate}
      schoolSlug={schoolSlug}
    />
  );
}
