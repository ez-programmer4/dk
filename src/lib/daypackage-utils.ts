/**
 * 🆕 SHARED UTILITY: Dynamic Daypackage Parser and Helpers
 * 
 * This utility provides consistent daypackage parsing across the entire system.
 * Supports both static shortcuts (MWF, TTS, All Days) and dynamic day names.
 * 
 * Used by:
 * - Salary Calculator
 * - Teacher Dashboard
 * - Registration
 * - Student Management
 * - All other components that work with daypackages
 */

/**
 * Parse daypackage string to get array of day numbers (0=Sunday, 1=Monday, etc.)
 * 
 * Supports:
 * 1. Static shortcuts (backward compatibility): "All days", "MWF", "TTS"
 * 2. Dynamic day names: "Monday", "Tuesday", "Mon", "Tue"
 * 3. Comma-separated combinations: "Monday, Wednesday, Friday"
 * 4. Numeric day codes: "1,3,5" (Monday, Wednesday, Friday)
 * 
 * @param daypackage - Daypackage string (e.g., "MWF", "Monday, Tuesday", "1,3,5")
 * @returns Array of day numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export function parseDaypackage(daypackage: string | null | undefined): number[] {
  if (!daypackage || daypackage.trim() === "") {
    return [];
  }

  const dpTrimmed = daypackage.trim();

  // ============================================
  // STATIC SHORTCUTS (Backward Compatibility)
  // ============================================
  const dpUpper = dpTrimmed.toUpperCase();

  if (dpUpper === "ALL DAYS" || dpUpper === "ALLDAYS") {
    return [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
  }
  if (dpUpper === "MWF") {
    return [1, 3, 5]; // Monday, Wednesday, Friday
  }
  if (dpUpper === "TTS" || dpUpper === "TTH") {
    return [2, 4, 6]; // Tuesday, Thursday, Saturday
  }

  // ============================================
  // DYNAMIC DAY NAME PARSING
  // ============================================

  // Day name mapping (case-insensitive)
  const dayNameMap: Record<string, number> = {
    // Full names
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    // Abbreviations
    sun: 0,
    mon: 1,
    tue: 2,
    tues: 2,
    wed: 3,
    wednes: 3,
    thu: 4,
    thur: 4,
    thurs: 4,
    fri: 5,
    sat: 6,
  };

  // Check if it contains commas (multiple days)
  if (dpTrimmed.includes(",")) {
    const dayParts = dpTrimmed.split(",").map((part) => part.trim());
    const days: number[] = [];

    for (const part of dayParts) {
      const partLower = part.toLowerCase();

      // Try day name mapping first
      if (dayNameMap[partLower] !== undefined) {
        days.push(dayNameMap[partLower]);
      }
      // Try numeric day code (0-6)
      else {
        const dayNum = parseInt(part, 10);
        if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
          days.push(dayNum);
        }
      }
    }

    // Remove duplicates and sort
    return [...new Set(days)].sort((a, b) => a - b);
  }

  // Single day (no comma)
  const dpLower = dpTrimmed.toLowerCase();

  // Try day name mapping
  if (dayNameMap[dpLower] !== undefined) {
    return [dayNameMap[dpLower]];
  }

  // Try numeric day code (0-6)
  const dayNum = parseInt(dpTrimmed, 10);
  if (!isNaN(dayNum) && dayNum >= 0 && dayNum <= 6) {
    return [dayNum];
  }

  // If no match found, return empty array
  // This allows the system to fall back to default behavior
  return [];
}

/**
 * Check if a daypackage includes a specific day of the week
 * 
 * @param daypackage - Daypackage string
 * @param dayIndex - Day index (0=Sunday, 1=Monday, ..., 6=Saturday)
 * @param includeSundays - Whether to include Sundays for "All Days" packages
 * @returns True if the daypackage includes the specified day
 */
export function daypackageIncludesDay(
  daypackage: string | null | undefined,
  dayIndex: number,
  includeSundays: boolean = true
): boolean {
  if (!daypackage || daypackage.trim() === "") {
    return true; // No daypackage means all days
  }

  const days = parseDaypackage(daypackage);

  // If parsing returned empty array, default to true (backward compatibility)
  if (days.length === 0) {
    return true;
  }

  // Check if dayIndex is in the parsed days
  if (days.includes(dayIndex)) {
    // For "All Days" (all 7 days), respect Sunday inclusion setting
    if (days.length === 7 && dayIndex === 0) {
      return includeSundays;
    }
    return true;
  }

  return false;
}

/**
 * Check if a daypackage includes today
 * 
 * @param daypackage - Daypackage string
 * @param includeSundays - Whether to include Sundays for "All Days" packages
 * @returns True if the daypackage includes today
 */
export function daypackageIncludesToday(
  daypackage: string | null | undefined,
  includeSundays: boolean = true
): boolean {
  const today = new Date();
  const dayIndex = today.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  return daypackageIncludesDay(daypackage, dayIndex, includeSundays);
}

/**
 * Format daypackage for display
 * 
 * @param daypackage - Daypackage string
 * @returns Formatted string for display
 */
export function formatDayPackage(daypackage: string | null | undefined): string {
  if (!daypackage || daypackage.trim() === "") {
    return "Not set";
  }

  const dpTrimmed = daypackage.trim();
  const dpUpper = dpTrimmed.toUpperCase();

  // Handle static shortcuts
  if (dpUpper === "ALL DAYS" || dpUpper === "ALLDAYS") {
    return "All Days";
  }
  if (dpUpper === "MWF") {
    return "Mon, Wed, Fri";
  }
  if (dpUpper === "TTS" || dpUpper === "TTH") {
    return "Tue, Thu, Sat";
  }

  // For dynamic daypackages, return as-is (or format if needed)
  // You can enhance this to format "Monday, Tuesday" -> "Mon, Tue" if desired
  return dpTrimmed;
}

/**
 * Get human-readable day names from daypackage
 * 
 * @param daypackage - Daypackage string
 * @returns Array of day names (e.g., ["Monday", "Wednesday", "Friday"])
 */
export function getDayNamesFromDaypackage(
  daypackage: string | null | undefined
): string[] {
  const days = parseDaypackage(daypackage);
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return days.map((day) => dayNames[day]);
}

/**
 * Count teaching days in a month for a specific daypackage
 * 
 * @param monthStart - First day of the month
 * @param monthEnd - Last day of the month
 * @param daypackage - Daypackage string
 * @param includeSundays - Whether to include Sundays for "All Days" packages
 * @returns Number of teaching days in the month
 */
export function countTeachingDaysInMonth(
  monthStart: Date,
  monthEnd: Date,
  daypackage: string | null | undefined,
  includeSundays: boolean = true
): number {
  if (!daypackage || daypackage.trim() === "") {
    // No daypackage means count all days
    let count = 0;
    const current = new Date(monthStart);
    while (current <= monthEnd) {
      const dayOfWeek = current.getDay();
      if (includeSundays || dayOfWeek !== 0) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  const expectedDays = parseDaypackage(daypackage);
  if (expectedDays.length === 0) {
    return 0;
  }

  // Check if this is "All Days" package (all 7 days)
  const isAllDaysPackage = expectedDays.length === 7 && 
    expectedDays.every((day, index) => day === index);

  let count = 0;
  const current = new Date(monthStart);
  const end = new Date(monthEnd);

  while (current <= end) {
    const dayOfWeek = current.getDay();

    if (expectedDays.includes(dayOfWeek)) {
      // For "All Days" package: respect includeSundays setting
      if (isAllDaysPackage && dayOfWeek === 0) {
        if (includeSundays) {
          count++;
        }
        // If includeSundays is false, skip Sunday for "All Days" package
      } else {
        // For explicit Sunday listing (not "All Days"): always include Sunday
        // For all other days: always count them
        count++;
      }
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
}

