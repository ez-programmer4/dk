/**
 * Utility functions for formatting numbers, currencies, and percentages
 */

export const formatNumber = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined) return "0";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "0" : num.toLocaleString();
};

export const formatPercentage = (value: number | string | null | undefined, decimals: number = 1): string => {
  if (value === null || value === undefined) return "0%";
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? "0%" : `${num.toFixed(decimals)}%`;
};

export const formatCurrency = (
  value?: number | string | null,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string => {
  const symbol = currency === "USD" ? "$" : currency === "ETB" ? "ETB" : currency || "ETB";
  if (value === null || value === undefined || value === "") {
    return `${symbol} 0.00`;
  }

  const numeric = typeof value === "string" ? Number.parseFloat(value) || 0 : value;

  const finalOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  return `${symbol} ${numeric.toLocaleString(undefined, finalOptions)}`;
};



