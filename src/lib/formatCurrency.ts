const DEFAULT_CURRENCY = "ETB";

const currencySymbolMap: Record<string, string> = {
  ETB: "ETB",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED",
  SAR: "SAR",
  CAD: "$",
  AUD: "$",
  KES: "KES",
};

export const getCurrencySymbol = (currency?: string): string => {
  if (!currency) return currencySymbolMap[DEFAULT_CURRENCY];
  const upper = currency.toUpperCase();
  return currencySymbolMap[upper] || upper;
};

export const formatCurrency = (
  value?: number | string | null,
  currency?: string,
  options?: Intl.NumberFormatOptions
): string => {
  const symbol = getCurrencySymbol(currency);
  if (value === null || value === undefined || value === "") {
    return `${symbol} 0.00`;
  }

  const numeric =
    typeof value === "string" ? Number.parseFloat(value) || 0 : value;

  const finalOptions: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  };

  if (
    finalOptions.maximumFractionDigits !== undefined &&
    finalOptions.minimumFractionDigits !== undefined &&
    finalOptions.maximumFractionDigits < finalOptions.minimumFractionDigits
  ) {
    finalOptions.minimumFractionDigits = finalOptions.maximumFractionDigits;
  }

  return `${symbol} ${numeric.toLocaleString(undefined, finalOptions)}`;
};

export const coerceToNumber = (value?: number | string | null): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

export const withCurrency = <T extends object>(
  data: T,
  currency?: string
): T & { currency: string } => ({
  ...data,
  currency: currency?.toUpperCase?.() || DEFAULT_CURRENCY,
});

/**
 * Check if a currency is ETB (Ethiopian Birr)
 * Used to determine which payment gateway to use (Chapa for ETB, Stripe for others)
 */
export const isETBCurrency = (currency?: string | null): boolean => {
  if (!currency) return true; // Default to ETB if not specified
  return currency.toUpperCase().trim() === "ETB";
};

/**
 * Get the appropriate payment provider for a currency
 * @returns "chapa" for ETB, "stripe" for other currencies
 */
export const getPaymentProvider = (currency?: string | null): "chapa" | "stripe" => {
  return isETBCurrency(currency) ? "chapa" : "stripe";
};

