import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { startOfWeek, parseISO } from "date-fns";
import { getTeacherExamPassFail } from "@/lib/examStats";


// Force dynamic rendering
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Helper to map category IDs to names
async function enrichFeedbackWithDescriptions(feedback: any) {
  const allIds = [
    ...(feedback.positive?.map((f: any) => f.id) || []),
    ...(feedback.negative?.map((f: any) => f.id) || []),
  ];
  if (allIds.length === 0) return feedback;
  const categories = await prisma.qualitydescription.findMany({
    where: { id: { in: allIds } },
  });
  const catMap = Object.fromEntries(
    categories.map((c) => [c.id, c.description])
  );

  function enrich(arr: any[]) {
    return arr.map((item) => ({
      ...item,
      description: item.description || catMap[item.id] || "",
    }));
  }

  return {
    positive: enrich(feedback.positive || []),
    negative: enrich(feedback.negative || []),
  };
}

function aggregateControllerFeedback(supervisorFeedback: string) {
  try {
    const parsed = JSON.parse(supervisorFeedback || "{}");
    return {
      positive: parsed.positive || [],
      negative: parsed.negative || [],
    };
  } catch {
    return { positive: [], negative: [] };
  }
}

// Helper: calculate control rate (average of all ratings)
function calculateControlRate(feedback: { positive: any[]; negative: any[] }) {
  // Transform negative ratings: 11 - original_rating (where 10 is 'strongly present/bad')
  const positiveRatings =
    feedback.positive?.map((c: any) => Number(c.rating)) || [];
  const negativeRatings =
    feedback.negative?.map((c: any) => 11 - Number(c.rating)) || [];

  // Filter out invalid ratings
  const validPositiveRatings = positiveRatings.filter((n) => !isNaN(n));
  const validNegativeRatings = negativeRatings.filter((n) => !isNaN(n));

  // Sum all ratings (positive + transformed negative)
  const totalRawScore =
    validPositiveRatings.reduce((sum, n) => sum + n, 0) +
    validNegativeRatings.reduce((sum, n) => sum + n, 0);

  // Count total items
  const totalNumberOfItems =
    validPositiveRatings.length + validNegativeRatings.length;

  // Calculate final score out of 10
  if (totalNumberOfItems === 0) return null;

  const finalScoreOutOf10 = totalRawScore / totalNumberOfItems;

  return finalScoreOutOf10;
}

export async function GET(req: NextRequest, { params }: { params: { schoolSlug: string } }) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!session || session.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const schoolSlug = params.schoolSlug;
  const teacherId = session.id;

  // Get school ID
  let schoolId = null;
  try {
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true }
    });
    schoolId = school?.id || null;
  } catch (error) {
    console.error("Error looking up school:", error);
    schoolId = null;
  }

  const url = new URL(req.url);
  const weekStartStr = url.searchParams.get("weekStart");
  // Always use UTC midnight for weekStart
  const weekStart = weekStartStr
    ? new Date(weekStartStr)
    : new Date(
        startOfWeek(new Date(), { weekStartsOn: 1 })
          .toISOString()
          .split("T")[0] + "T00:00:00.000Z"
      );
  const nextWeek = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Filter assessments by school if schoolId is available
  const whereClause: any = {
    teacherId: teacherId,
    weekStart: {
      gte: weekStart,
      lt: nextWeek,
    },
    status: "approved", // Only return manager-approved assessments
  };

  if (schoolId) {
    whereClause.schoolId = schoolId;
  }

  // Only return manager-approved assessments for this teacher and week
  const assessments = await prisma.qualityassessment.findMany({
    where: whereClause,
    include: {
      teacher: {
        select: {
          ustazname: true,
          ustazid: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const teacherStats = await getTeacherExamPassFail(teacherId, weekStart, nextWeek);

  const teachers = await Promise.all(
    assessments.map(async (assessment) => {
      const controllerFeedback = await enrichFeedbackWithDescriptions(
        aggregateControllerFeedback(assessment.supervisorFeedback || "")
      );

      const controlRate = calculateControlRate(controllerFeedback);

      return {
        teacherId: assessment.teacherId,
        overallQuality: assessment.overallQuality,
        examPassRate: teacherStats.passRate,
        studentsTotal: teacherStats.totalStudents,
        examinerRating: controlRate,
        controllerFeedback,
        bonusAwarded: assessment.bonusAwarded,
        overrideNotes: assessment.overrideNotes,
        examinerNotes: assessment.examinerNotes,
      };
    })
  );

  return NextResponse.json({ teachers });
}
