import { prisma } from "@/lib/prisma";

// Types for usage tracking
export interface UsageRecord {
  id: string;
  schoolId: string;
  metric: string;
  value: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UsageMetrics {
  students: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  storage: {
    used: number;
    limit: number;
    percentage: number;
  };
  api: {
    calls: number;
    limit: number;
    percentage: number;
  };
  features: {
    used: string[];
    available: string[];
  };
}

/**
 * Track usage metric for a school
 * @param schoolId - The school ID
 * @param metric - The metric name (e.g., 'student_count', 'storage_used', 'api_calls')
 * @param value - The metric value
 * @param metadata - Additional metadata
 */
export async function trackUsage(
  schoolId: string,
  metric: string,
  value: number,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    // TODO: Implement usage tracking when UsageRecord model is added to schema
    console.log(`Usage tracked: ${metric} = ${value} for school ${schoolId}`);
    // For now, just log the usage - database tracking will be implemented later
  } catch (error) {
    console.error("Failed to track usage:", error);
    // Don't throw error to avoid breaking user flows
  }
}

/**
 * Get usage metrics for a school
 * @param schoolId - The school ID
 * @param period - Optional time period
 * @returns Usage metrics
 */
export async function getUsageMetrics(
  schoolId: string,
  period?: { start: Date; end: Date }
): Promise<UsageMetrics> {
  try {
    const whereClause: any = { schoolId };
    if (period) {
      whereClause.timestamp = {
        gte: period.start,
        lte: period.end,
      };
    }

    // Get current student counts
    const [totalStudents, activeStudents] = await Promise.all([
      prisma.student.count({ where: { schoolId } }),
      prisma.student.count({
        where: {
          schoolId,
          // Add active status filter if available
        },
      }),
    ]);

    // Get new students this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newStudentsThisMonth = await prisma.student.count({
      where: {
        schoolId,
        createdAt: {
          gte: startOfMonth,
        },
      },
    });

    // Get school's plan limits
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      include: { plan: true },
    });

    const maxStudents = school?.plan?.maxStudents || 100;
    const maxStorage = school?.plan?.maxStorage || 1000000000; // 1GB default
    const maxApiCalls = 10000; // Default API limit

    // TODO: Implement usage records querying when UsageRecord model is added
    // For now, return placeholder values
    const storageUsed = 0; // Placeholder
    const apiCalls = 0; // Placeholder

    // Get features used (from plan features)
    const featuresUsed: string[] = []; // Placeholder

    const availableFeatures = school?.plan?.features
      ? Object.keys(school.plan.features)
      : [];

    return {
      students: {
        total: totalStudents,
        active: activeStudents,
        newThisMonth: newStudentsThisMonth,
      },
      storage: {
        used: storageUsed,
        limit: maxStorage,
        percentage: (storageUsed / maxStorage) * 100,
      },
      api: {
        calls: apiCalls,
        limit: maxApiCalls,
        percentage: (apiCalls / maxApiCalls) * 100,
      },
      features: {
        used: featuresUsed,
        available: availableFeatures,
      },
    };
  } catch (error) {
    console.error("Failed to get usage metrics:", error);
    throw new Error("Failed to get usage metrics");
  }
}

/**
 * Check if school has exceeded usage limits
 * @param schoolId - The school ID
 * @returns Object with limit exceeded status
 */
export async function checkUsageLimits(schoolId: string) {
  try {
    const metrics = await getUsageMetrics(schoolId);

    const limitsExceeded = {
      students: metrics.students.total >= metrics.students.total * 1.1, // 10% buffer
      storage: metrics.storage.percentage >= 100,
      api: metrics.api.percentage >= 100,
    };

    const anyLimitExceeded = Object.values(limitsExceeded).some(
      (exceeded) => exceeded
    );

    return {
      limitsExceeded,
      anyLimitExceeded,
      metrics,
    };
  } catch (error) {
    console.error("Failed to check usage limits:", error);
    return {
      limitsExceeded: { students: false, storage: false, api: false },
      anyLimitExceeded: false,
      metrics: null,
    };
  }
}

/**
 * Track feature usage
 * @param schoolId - The school ID
 * @param feature - The feature name
 */
export async function trackFeatureUsage(
  schoolId: string,
  feature: string
): Promise<void> {
  await trackUsage(schoolId, `feature_${feature}`, 1, { feature });
}

/**
 * Get usage history for a specific metric
 * @param schoolId - The school ID
 * @param metric - The metric name
 * @param period - Time period
 * @returns Array of usage records
 */
export async function getUsageHistory(
  schoolId: string,
  metric: string,
  period: { start: Date; end: Date }
): Promise<UsageRecord[]> {
  try {
    // TODO: Implement usage history when UsageRecord model is added to schema
    // For now, return empty array
    return [];
  } catch (error) {
    console.error("Failed to get usage history:", error);
    throw new Error("Failed to get usage history");
  }
}

/**
 * Clean up old usage records
 * @param daysOld - Remove records older than this many days
 */
export async function cleanupOldUsageRecords(
  daysOld: number = 365
): Promise<void> {
  try {
    // TODO: Implement cleanup when UsageRecord model is added to schema
    console.log(`Would cleanup usage records older than ${daysOld} days`);
  } catch (error) {
    console.error("Failed to cleanup old usage records:", error);
    throw new Error("Failed to cleanup old usage records");
  }
}

/**
 * Auto track current period usage
 * @param schoolId - The school ID
 */
export async function autoTrackCurrentPeriod(schoolId: string): Promise<void> {
  try {
    // TODO: Implement auto tracking when usage tracking is fully implemented
    console.log(`Auto tracking usage for school ${schoolId}`);
  } catch (error) {
    console.error("Failed to auto track current period:", error);
    throw new Error("Failed to auto track current period");
  }
}

/**
 * Get usage for a specific period
 * @param schoolId - The school ID
 * @param period - Time period
 * @returns Usage data for the period
 */
export async function getUsageForPeriod(
  schoolId: string,
  period: { start: Date; end: Date }
) {
  try {
    const metrics = await getUsageMetrics(schoolId, period);
    return {
      schoolId,
      period,
      metrics,
    };
  } catch (error) {
    console.error("Failed to get usage for period:", error);
    throw new Error("Failed to get usage for period");
  }
}

/**
 * Get current usage for a school
 * @param schoolId - The school ID
 * @returns Current usage metrics
 */
export async function getCurrentUsage(schoolId: string) {
  try {
    const metrics = await getUsageMetrics(schoolId);
    return {
      schoolId,
      metrics,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error("Failed to get current usage:", error);
    throw new Error("Failed to get current usage");
  }
}
