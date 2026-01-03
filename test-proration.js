/**
 * Proration Calculation Test Script
 * Run with: node test-proration.js
 * 
 * This script tests the proration calculation logic for mid-cycle upgrades/downgrades
 */

// Simulate the proration calculation from the codebase
function calculateProration(params) {
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
    creditAmount: Math.round(creditAmount * 100) / 100,
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

// Test Cases
console.log("=".repeat(80));
console.log("PRORATION CALCULATION TEST SUITE");
console.log("=".repeat(80));
console.log();

// Test Case 1: Upgrade mid-cycle (3 months -> 5 months) - User's Example
console.log("TEST CASE 1: Upgrade Mid-Cycle (3 months -> 5 months) - User's Example");
console.log("-".repeat(80));
const test1 = {
  currentPrice: 150,      // $150 for 3 months (90 days)
  currentDuration: 3,     // 3 months
  newPrice: 300,          // $300 for 5 months (150 days)
  newDuration: 5,         // 5 months
  originalStartDate: new Date("2025-01-01T00:00:00Z"),  // Jan 1
  currentEndDate: new Date("2025-03-31T00:00:00Z"),     // March 31 (90 days)
  upgradeDate: new Date("2025-02-01T00:00:00Z"),        // Feb 1 (31 days used)
};

const result1 = calculateProration(test1);
console.log("Input:");
console.log(`  Current Package: $${test1.currentPrice} for ${test1.currentDuration} months`);
console.log(`  New Package: $${test1.newPrice} for ${test1.newDuration} months`);
console.log(`  Original Start: ${test1.originalStartDate.toISOString().split('T')[0]}`);
console.log(`  Current End: ${test1.currentEndDate.toISOString().split('T')[0]}`);
console.log(`  Upgrade Date: ${test1.upgradeDate.toISOString().split('T')[0]}`);
console.log();
console.log("Calculation:");
console.log(`  Total Days in Period: ${result1.totalDays}`);
console.log(`  Days Used: ${result1.daysUsed}`);
console.log(`  Days Remaining: ${result1.daysRemaining}`);
console.log(`  Current Monthly Rate: $${result1.currentMonthlyRate}`);
console.log(`  New Monthly Rate: $${result1.newMonthlyRate}`);
console.log(`  Current Daily Rate: $${result1.currentDailyRate}`);
console.log(`  New Daily Rate: $${result1.newDailyRate}`);
console.log();
console.log("Result:");
console.log(`  Credit for Unused Time: $${result1.creditAmount.toFixed(2)}`);
console.log(`  New Package Price: $${test1.newPrice}`);
console.log(`  Net Amount to Charge: $${result1.netAmount.toFixed(2)}`);
console.log(`  Calculation: $${test1.newPrice} - $${result1.creditAmount.toFixed(2)} = $${result1.netAmount.toFixed(2)}`);
console.log();
console.log("=".repeat(80));
console.log();

// Test Case 2: Upgrade early in cycle (only 1 day used)
console.log("TEST CASE 2: Upgrade Early in Cycle (1 day used)");
console.log("-".repeat(80));
const test2 = {
  currentPrice: 150,
  currentDuration: 3,
  newPrice: 300,
  newDuration: 5,
  originalStartDate: new Date("2025-11-10T00:00:00Z"),
  currentEndDate: new Date("2026-02-10T00:00:00Z"),
  upgradeDate: new Date("2025-11-11T00:00:00Z"),  // Only 1 day used
};

const result2 = calculateProration(test2);
console.log("Input:");
console.log(`  Days Used: ${result2.daysUsed}`);
console.log(`  Days Remaining: ${result2.daysRemaining}`);
console.log();
console.log("Result:");
console.log(`  Credit: $${result2.creditAmount.toFixed(2)}`);
console.log(`  Net Charge: $${result2.netAmount.toFixed(2)}`);
console.log();
console.log("=".repeat(80));
console.log();

// Test Case 3: Upgrade late in cycle (most of period used)
console.log("TEST CASE 3: Upgrade Late in Cycle (most period used)");
console.log("-".repeat(80));
const test3 = {
  currentPrice: 150,
  currentDuration: 3,
  newPrice: 300,
  newDuration: 5,
  originalStartDate: new Date("2025-11-10T00:00:00Z"),
  currentEndDate: new Date("2026-02-10T00:00:00Z"),
  upgradeDate: new Date("2026-01-30T00:00:00Z"),  // 81 days used (most of 92 days)
};

const result3 = calculateProration(test3);
console.log("Input:");
console.log(`  Days Used: ${result3.daysUsed}`);
console.log(`  Days Remaining: ${result3.daysRemaining}`);
console.log();
console.log("Result:");
console.log(`  Credit: $${result3.creditAmount.toFixed(2)}`);
console.log(`  Net Charge: $${result3.netAmount.toFixed(2)}`);
console.log();
console.log("=".repeat(80));
console.log();

// Test Case 4: Downgrade mid-cycle
console.log("TEST CASE 4: Downgrade Mid-Cycle (5 months -> 3 months)");
console.log("-".repeat(80));
const test4 = {
  currentPrice: 300,      // $300 for 5 months
  currentDuration: 5,
  newPrice: 150,          // $150 for 3 months
  newDuration: 3,
  originalStartDate: new Date("2025-11-10T00:00:00Z"),
  currentEndDate: new Date("2026-04-10T00:00:00Z"),  // 5 months later
  upgradeDate: new Date("2025-11-24T00:00:00Z"),      // 14 days into subscription
};

const result4 = calculateProration(test4);
console.log("Input:");
console.log(`  Current Package: $${test4.currentPrice} for ${test4.currentDuration} months`);
console.log(`  New Package: $${test4.newPrice} for ${test4.newDuration} months`);
console.log(`  Days Used: ${result4.daysUsed}`);
console.log(`  Days Remaining: ${result4.daysRemaining}`);
console.log();
console.log("Result:");
console.log(`  Credit: $${result4.creditAmount.toFixed(2)}`);
console.log(`  Net Charge: $${result4.netAmount.toFixed(2)}`);
console.log(`  Note: Negative amount means customer gets credit`);
console.log();
console.log("=".repeat(80));
console.log();

// Test Case 5: Real scenario from your logs
console.log("TEST CASE 5: Real Scenario from Your Logs");
console.log("-".repeat(80));
const test5 = {
  currentPrice: 150,      // 3 month package
  currentDuration: 3,
  newPrice: 300,          // 5 month package
  newDuration: 5,
  originalStartDate: new Date("2025-11-10T18:18:16Z"),
  currentEndDate: new Date("2026-02-24T18:18:16Z"),  // Original end date
  upgradeDate: new Date("2025-11-24T18:22:39Z"),      // Upgrade date from logs
};

const result5 = calculateProration(test5);
console.log("Input (from your actual logs):");
console.log(`  Original Start: ${test5.originalStartDate.toISOString()}`);
console.log(`  Current End: ${test5.currentEndDate.toISOString()}`);
console.log(`  Upgrade Date: ${test5.upgradeDate.toISOString()}`);
console.log();
console.log("Calculation:");
console.log(`  Total Days: ${result5.totalDays}`);
console.log(`  Days Used: ${result5.daysUsed}`);
console.log(`  Days Remaining: ${result5.daysRemaining}`);
console.log();
console.log("Result:");
console.log(`  Credit: $${result5.creditAmount.toFixed(2)}`);
console.log(`  Net Charge: $${result5.netAmount.toFixed(2)}`);
console.log();
console.log("Expected from Stripe:");
console.log("  Stripe will calculate this automatically with proration_behavior: 'always_invoice'");
console.log("  The actual invoice amount from Stripe should match or be very close to this");
console.log();
console.log("=".repeat(80));

// Validation function
function validateCalculation(test, result, expectedNetAmount) {
  const tolerance = 0.01; // $0.01 tolerance
  const difference = Math.abs(result.netAmount - expectedNetAmount);
  
  if (difference <= tolerance) {
    console.log(`✅ PASS: Net amount matches expected (difference: $${difference.toFixed(2)})`);
  } else {
    console.log(`❌ FAIL: Net amount differs by $${difference.toFixed(2)}`);
    console.log(`   Expected: $${expectedNetAmount.toFixed(2)}`);
    console.log(`   Got: $${result.netAmount.toFixed(2)}`);
  }
}

console.log();
console.log("VALIDATION:");
console.log("-".repeat(80));
console.log("Compare the calculated net amount with Stripe's actual invoice amount");
console.log("They should match (within $0.01 tolerance)");
console.log();
console.log("To verify in production:");
console.log("1. Perform an upgrade in the UI");
console.log("2. Check Stripe dashboard for the invoice amount");
console.log("3. Compare with the calculated net amount above");
console.log("4. Check the database payment record to ensure it matches");

