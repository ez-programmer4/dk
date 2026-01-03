/**
 * Proration calculation utilities for subscription upgrades and downgrades
 */

export interface ProrationResult {
  creditAmount: number;
  netAmount: number;
  daysUsed: number;
  daysRemaining: number;
  currentDailyRate: number;
  newDailyRate: number;
  currentMonthlyRate: number;
  newMonthlyRate: number;
  totalDays: number;
}

export interface ProrationParams {
  currentPrice: number;
  currentDuration: number; // in months
  newPrice: number;
  newDuration: number; // in months
  originalStartDate: Date;
  currentEndDate: Date;
  upgradeDate: Date;
}

/**
 * Calculate proration for subscription upgrade/downgrade
 * 
 * @param params - Proration parameters
 * @returns Proration calculation result
 */
export function calculateProration(params: ProrationParams): ProrationResult {
  const {
    currentPrice,
    currentDuration,
    newPrice,
    newDuration,
    originalStartDate,
    currentEndDate,
    upgradeDate,
  } = params;

  // Calculate total days using standardized 30 days per month
  // This matches the user's example: 3 months = 90 days, 5 months = 150 days
  // This ensures consistent proration calculations regardless of actual calendar days
  const totalDays = currentDuration * 30; // Standardized: months × 30 days

  // Calculate days used (from original start to upgrade date) using actual calendar days
  const daysUsedMs = upgradeDate.getTime() - originalStartDate.getTime();
  const daysUsed = Math.max(0, Math.floor(daysUsedMs / (1000 * 60 * 60 * 24)));

  // Calculate days remaining (using standardized total days)
  const daysRemaining = Math.max(0, totalDays - daysUsed);

  // Calculate monthly rates
  const currentMonthlyRate = currentPrice / currentDuration;
  const newMonthlyRate = newPrice / newDuration;

  // Calculate daily rates using standardized 30 days per month
  // This matches the user's example: $150 / 90 days = $1.67/day
  const currentDailyRate = currentPrice / totalDays; // $150 / 90 = $1.67/day
  const newDailyRate = newMonthlyRate / 30; // For new plan, use standard 30 days/month

  // Calculate credit for unused time at old package rate
  const creditAmount = currentDailyRate * daysRemaining;

  // Net amount: new package price minus credit
  const netAmount = newPrice - creditAmount;

  return {
    creditAmount: Math.round(creditAmount * 100) / 100, // Round to 2 decimal places
    netAmount: Math.round(netAmount * 100) / 100,
    daysUsed,
    daysRemaining,
    currentDailyRate: Math.round(currentDailyRate * 100) / 100,
    newDailyRate: Math.round(newDailyRate * 100) / 100,
    currentMonthlyRate: Math.round(currentMonthlyRate * 100) / 100,
    newMonthlyRate: Math.round(newMonthlyRate * 100) / 100,
    totalDays,
  };
}

/**
 * Calculate new subscription dates after upgrade/downgrade
 * 
 * @param upgradeDate - Date of upgrade/downgrade
 * @param newDuration - Duration of new package in months
 * @returns New start and end dates
 */
export function calculateNewSubscriptionDates(
  upgradeDate: Date,
  newDuration: number
): { startDate: Date; endDate: Date } {
  const startDate = new Date(upgradeDate);
  startDate.setHours(0, 0, 0, 0); // Start of day

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + newDuration);
  endDate.setHours(23, 59, 59, 999); // End of day

  return { startDate, endDate };
}

/**
 * Generate month strings for a date range
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of month strings in YYYY-MM format
 */
export function generateMonthStrings(
  startDate: Date,
  endDate: Date
): string[] {
  const months: string[] = [];
  const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  let currentMonth = new Date(startMonth);
  while (currentMonth <= endMonth) {
    const year = currentMonth.getFullYear();
    const month = String(currentMonth.getMonth() + 1).padStart(2, "0");
    months.push(`${year}-${month}`);
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return months;
}

