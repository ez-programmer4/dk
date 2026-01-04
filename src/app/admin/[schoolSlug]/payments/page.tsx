"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiFilter,
  FiSearch,
  FiEye,
  FiXCircle,
  FiCalendar,
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiChevronLeft,
  FiChevronRight,
  FiCopy,
  FiActivity,
  FiArrowUpRight,
} from "react-icons/fi";
import { useDebounce } from "use-debounce";
import Modal from "@/app/components/Modal";
import Tooltip from "@/components/Tooltip";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import {
  formatCurrency as formatCurrencyValue,
  getCurrencySymbol,
} from "@/lib/formatCurrency";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

interface Payment {
  id: number | string; // Can be checkout-{id} for pending checkouts
  studentid: number;
  studentname: string;
  paymentdate: string;
  paidamount: number;
  transactionid: string;
  reason: string;
  status: string;
  sendername: string;
  currency?: string;
  country?: string;
  source?: string;
  isPendingCheckout?: boolean; // True if this is a checkout waiting for gateway confirmation
  checkoutId?: number;
  intent?: string;
  providerReference?: string;
  providerStatus?: string;
  providerFee?: number;
  subscription?: {
    id: number;
    status: string;
    startDate: string;
    endDate: string;
    nextBillingDate?: string | null;
    package?: {
      name: string;
      duration: number;
      price: number;
      currency: string;
    } | null;
  };
}

const StatusBadge = ({
  status,
  isPendingCheckout,
}: {
  status: string;
  isPendingCheckout?: boolean;
}) => {
  const statusStyles: Record<
    string,
    { icon: React.ReactNode; className: string; label: string }
  > = {
    pending: {
      icon: <FiClock />,
      className: "bg-yellow-100 text-yellow-800",
      label: isPendingCheckout ? "Awaiting Gateway" : "Pending Approval",
    },
    approved: {
      icon: <FiCheckCircle />,
      className: "bg-green-100 text-green-800",
      label: "Approved",
    },
    rejected: {
      icon: <FiXCircle />,
      className: "bg-red-100 text-red-800",
      label: "Rejected",
    },
    completed: {
      icon: <FiCheckCircle />,
      className: "bg-emerald-100 text-emerald-800",
      label: "Completed",
    },
  };
  const style = statusStyles[status.toLowerCase()] || {
    icon: <FiAlertCircle />,
    className: "bg-gray-100 text-gray-800",
    label: status || "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-full ${style.className}`}
      title={
        isPendingCheckout ? "Payment gateway confirmation pending" : style.label
      }
    >
      {style.icon}
      {style.label}
    </span>
  );
};

export default function PaymentManagementPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPaymentsForStats, setAllPaymentsForStats] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Search
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uniqueCurrencies = useMemo(
    () =>
      Array.from(new Set(payments.map((payment) => payment.currency || "ETB"))),
    [payments]
  );
  const primaryCurrency = uniqueCurrencies[0] || "ETB";
  const hasMixedCurrencies = uniqueCurrencies.length > 1;

  const formatPrimaryAmount = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      formatCurrencyValue(value, primaryCurrency, options),
    [primaryCurrency]
  );

  const getCurrencyDisplay = useCallback(
    (value: number, currency?: string): { primary: string; full: string } => {
      const currencyToUse = currency || primaryCurrency;
      const absoluteValue = Math.abs(value);

      const full = formatCurrencyValue(value, currencyToUse);

      if (absoluteValue < 1_000_000) {
        return { primary: full, full };
      }

      const compact = formatCurrencyValue(value, currencyToUse, {
        notation: "compact",
        minimumFractionDigits: 0,
        maximumFractionDigits: absoluteValue >= 1_000_000_000 ? 1 : 2,
      });

      return {
        primary: compact,
        full,
      };
    },
    [primaryCurrency]
  );

  const handleCopyAmount = useCallback((key: string, value: string) => {
    if (typeof navigator === "undefined" || !navigator?.clipboard?.writeText) {
      return;
    }

    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopiedKey(key);
        if (copyTimeoutRef.current) {
          clearTimeout(copyTimeoutRef.current);
        }
        copyTimeoutRef.current = setTimeout(() => setCopiedKey(null), 2000);
      })
      .catch(() => {
        setCopiedKey(null);
      });
  }, []);

  const statusMetrics = useMemo(() => {
    // Use ALL payments from database for statistics (not filtered)
    const paymentsForStats =
      allPaymentsForStats.length > 0 ? allPaymentsForStats : payments;

    console.log(
      `[Status Metrics] allPaymentsForStats: ${allPaymentsForStats.length}, payments: ${payments.length}, using: ${paymentsForStats.length}`
    );
    // Remove duplicates by ID
    const uniquePayments = Array.from(
      new Map(paymentsForStats.map((p) => [p.id, p])).values()
    );
    console.log(
      `[Status Metrics] After deduplication: ${uniquePayments.length} unique payments`
    );

    const metrics = {
      approved: { count: 0, amount: 0 },
      pending: { count: 0, amount: 0 },
      rejected: { count: 0, amount: 0 },
    };

    uniquePayments.forEach((payment) => {
      // Use exact status from database (case-sensitive: "Approved", "pending", "rejected")
      const status = payment.status?.trim() || "";
      const amount = Number(payment.paidamount) || 0;

      if (status === "Approved") {
        metrics.approved.count += 1;
        metrics.approved.amount += amount;
      } else if (status === "pending") {
        metrics.pending.count += 1;
        metrics.pending.amount += amount;
      } else if (status === "rejected") {
        metrics.rejected.count += 1;
        metrics.rejected.amount += amount;
      }
    });

    console.log(`[Status Metrics] Calculated metrics:`);
    console.log(
      `[Status Metrics]   Approved: ${
        metrics.approved.count
      } payments, ${metrics.approved.amount.toFixed(2)} total`
    );
    console.log(
      `[Status Metrics]   Pending: ${
        metrics.pending.count
      } payments, ${metrics.pending.amount.toFixed(2)} total`
    );
    console.log(
      `[Status Metrics]   Rejected: ${
        metrics.rejected.count
      } payments, ${metrics.rejected.amount.toFixed(2)} total`
    );
    console.log(
      `[Status Metrics] ========== End Status Metrics Calculation ==========`
    );

    return metrics;
  }, [payments, allPaymentsForStats]);

  const currencyStats = useMemo(() => {
    // Use ALL payments from database for statistics (not filtered)
    const paymentsForStats =
      allPaymentsForStats.length > 0 ? allPaymentsForStats : payments;

    console.log(
      `[Currency Stats] ========== Starting Currency Stats Calculation ==========`
    );
    console.log(
      `[Currency Stats] Total payments available: ${paymentsForStats.length}`
    );
    console.log(
      `[Currency Stats] Using: ${
        allPaymentsForStats.length > 0
          ? "allPaymentsForStats (unfiltered)"
          : "payments (filtered)"
      }`
    );

    // Remove duplicates by ID
    const uniquePayments = Array.from(
      new Map(paymentsForStats.map((p) => [p.id, p])).values()
    );
    console.log(
      `[Currency Stats] After deduplication: ${uniquePayments.length} unique payments`
    );

    const map: Record<
      string,
      { approved: number; pending: number; rejected: number; total: number }
    > = {};

    uniquePayments.forEach((payment) => {
      const currency = payment.currency || "ETB";
      const amount = Number(payment.paidamount) || 0;

      // Only count payments with valid amounts
      if (amount <= 0) return;

      if (!map[currency]) {
        map[currency] = {
          approved: 0,
          pending: 0,
          rejected: 0,
          total: 0,
        };
      }
      map[currency].total += amount;

      // Use exact status from database (case-sensitive: "Approved", "pending", "rejected")
      const status = payment.status?.trim() || "";
      if (status === "Approved") {
        map[currency].approved += amount;
      } else if (status === "pending") {
        map[currency].pending += amount;
      } else if (status === "rejected") {
        map[currency].rejected += amount;
      }
    });

    const result = Object.entries(map).map(([currency, data]) => ({
      currency,
      symbol: getCurrencySymbol(currency),
      ...data,
    }));

    console.log(
      `[Currency Stats] Calculated stats for ${result.length} currency/currencies:`
    );
    result.forEach((stat) => {
      console.log(
        `[Currency Stats]   ${stat.currency}: ${stat.total.toFixed(
          2
        )} total (Approved: ${stat.approved.toFixed(
          2
        )}, Pending: ${stat.pending.toFixed(
          2
        )}, Rejected: ${stat.rejected.toFixed(2)})`
      );
    });
    console.log(
      `[Currency Stats] ========== End Currency Stats Calculation ==========`
    );

    return result;
  }, [payments, allPaymentsForStats]);

  const primaryTotals = useMemo(() => {
    const primaryStat =
      currencyStats.find((stat) => stat.currency === primaryCurrency) ||
      currencyStats[0];

    if (!primaryStat) return null;

    return {
      currency: primaryStat.currency,
      total: getCurrencyDisplay(primaryStat.total, primaryStat.currency),
      approved: getCurrencyDisplay(primaryStat.approved, primaryStat.currency),
    };
  }, [currencyStats, primaryCurrency, getCurrencyDisplay]);

  const totalPayments = payments.length;
  const approvedCount = statusMetrics.approved.count;
  const pendingCount = statusMetrics.pending.count;
  const rejectedCount = statusMetrics.rejected.count;
  const approvalRate = totalPayments
    ? Math.round((approvedCount / totalPayments) * 100)
    : 0;

  const totalAmountValue =
    statusMetrics.approved.amount +
    statusMetrics.pending.amount +
    statusMetrics.rejected.amount;

  const paymentInsights = useMemo(
    () => [
      {
        label: "Total Amount",
        value: formatPrimaryAmount(totalAmountValue),
        helper: `Combined across ${totalPayments.toLocaleString()} records`,
      },
      {
        label: "Average Ticket",
        value: formatPrimaryAmount(
          totalPayments ? totalAmountValue / totalPayments : 0,
          { maximumFractionDigits: 0 }
        ),
        helper: "Mean payment value this period",
      },
      {
        label: "Pending Value",
        value: formatPrimaryAmount(statusMetrics.pending.amount),
        helper: `${pendingCount.toLocaleString()} transactions awaiting review`,
      },
      {
        label: "Rejected Share",
        value: `${
          totalAmountValue
            ? (
                (statusMetrics.rejected.amount / totalAmountValue) *
                100
              ).toFixed(1)
            : "0.0"
        }%`,
        helper: "Percentage of amount declined",
      },
    ],
    [
      formatPrimaryAmount,
      pendingCount,
      statusMetrics.pending.amount,
      statusMetrics.rejected.amount,
      totalAmountValue,
      totalPayments,
    ]
  );

  const recentPayments = useMemo(() => {
    return [...payments]
      .filter((payment) => payment.paymentdate)
      .sort(
        (a, b) =>
          new Date(b.paymentdate).getTime() - new Date(a.paymentdate).getTime()
      )
      .slice(0, 6);
  }, [payments]);

  const topStudents = useMemo(() => {
    const map = new Map<
      string,
      { student: string; currency: string; total: number; count: number }
    >();

    payments.forEach((payment) => {
      const currency = payment.currency || "ETB";
      const key = `${payment.studentname}-${currency}`;
      const amount = Number(payment.paidamount) || 0;
      if (!map.has(key)) {
        map.set(key, {
          student: payment.studentname,
          currency,
          total: 0,
          count: 0,
        });
      }
      const entry = map.get(key)!;
      entry.total += amount;
      entry.count += 1;
    });

    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [payments]);

  // USD Statistics by Country (United States vs USA-huzeyfa)
  // Only count payments that actually exist in the database with their actual status
  const usdCountryStats = useMemo(() => {
    // Use filtered payments (respects date interval filter)
    const paymentsForStats = payments;

    console.log(
      `[USD Stats] ========== Starting USD Statistics Calculation ==========`
    );
    console.log(
      `[USD Stats] Total payments available: ${paymentsForStats.length}`
    );
    console.log(`[USD Stats] Using filtered payments (respects date interval)`);

    // Filter by date interval if date filter is set
    let dateFilteredPayments = paymentsForStats;
    if (date?.from || date?.to) {
      dateFilteredPayments = paymentsForStats.filter((p) => {
        if (!p.paymentdate) return false;
        const paymentDate = new Date(p.paymentdate);
        if (date.from && paymentDate < date.from) return false;
        if (date.to) {
          const endDate = new Date(date.to);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          if (paymentDate > endDate) return false;
        }
        return true;
      });
      console.log(
        `[USD Stats] After date filtering: ${dateFilteredPayments.length} payments in date range`
      );
    }

    // Remove duplicates by ID (in case API returns duplicates)
    const uniqueAllPayments = Array.from(
      new Map(dateFilteredPayments.map((p) => [p.id, p])).values()
    );
    console.log(
      `[USD Stats] After deduplication: ${uniqueAllPayments.length} unique payments`
    );

    // Filter only USD payments that exist in database
    const usdPayments = uniqueAllPayments.filter((p) => {
      // Only include payments with USD currency
      if (p.currency !== "USD") return false;
      // Only include payments that have a valid status from database
      const status = p.status?.trim();
      if (!status) return false;
      // Include all valid statuses: "Approved", "pending", "rejected" (case-sensitive from DB)
      return (
        status === "Approved" || status === "pending" || status === "rejected"
      );
    });

    // Debug: Log USD payments to verify what we're counting
    console.log(
      `[USD Stats] Found ${usdPayments.length} USD payments after filtering:`
    );
    if (usdPayments.length > 0) {
      usdPayments.forEach((p, idx) => {
        console.log(
          `[USD Stats] [${idx + 1}] ID: ${p.id}, Status: "${
            p.status
          }", Country: "${p.country || "N/A"}", Amount: ${
            p.paidamount
          }, Currency: "${p.currency}"`
        );
      });
    } else {
      console.log(`[USD Stats] ⚠️ No USD payments found in database`);
      // Debug: Check what currencies we have
      const currencies = Array.from(
        new Set(uniqueAllPayments.map((p) => p.currency || "N/A"))
      );
      console.log(
        `[USD Stats] Available currencies in database: ${currencies.join(", ")}`
      );
    }

    const stats = {
      usa: { total: 0, count: 0, approved: 0, pending: 0, rejected: 0 },
      "usa-huzeyfa": {
        total: 0,
        count: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
      },
      other: { total: 0, count: 0, approved: 0, pending: 0, rejected: 0 },
    };

    usdPayments.forEach((payment) => {
      const country = payment.country || "";
      const amount = Number(payment.paidamount) || 0;
      // Use exact status from database (case-sensitive)
      const status = payment.status?.trim() || "";

      let key: "usa" | "usa-huzeyfa" | "other" = "other";
      if (country === "United States") {
        key = "usa";
      } else if (country === "USA-huzeyfa") {
        key = "usa-huzeyfa";
      }

      // Only count if amount is valid
      if (amount > 0) {
        stats[key].total += amount;
        stats[key].count += 1;

        // Match exact database status values (case-sensitive)
        if (status === "Approved") {
          stats[key].approved += amount;
        } else if (status === "pending") {
          stats[key].pending += amount;
        } else if (status === "rejected") {
          stats[key].rejected += amount;
        }
      }
    });

    // Debug: Log calculated stats
    console.log(`[USD Stats] Calculated statistics:`);
    console.log(
      `[USD Stats]   USA: ${
        stats.usa.count
      } payments, $${stats.usa.total.toFixed(
        2
      )} total (Approved: $${stats.usa.approved.toFixed(
        2
      )}, Pending: $${stats.usa.pending.toFixed(
        2
      )}, Rejected: $${stats.usa.rejected.toFixed(2)})`
    );
    console.log(
      `[USD Stats]   USA-huzeyfa: ${
        stats["usa-huzeyfa"].count
      } payments, $${stats["usa-huzeyfa"].total.toFixed(
        2
      )} total (Approved: $${stats["usa-huzeyfa"].approved.toFixed(
        2
      )}, Pending: $${stats["usa-huzeyfa"].pending.toFixed(
        2
      )}, Rejected: $${stats["usa-huzeyfa"].rejected.toFixed(2)})`
    );
    console.log(
      `[USD Stats]   Other: ${
        stats.other.count
      } payments, $${stats.other.total.toFixed(2)} total`
    );
    console.log(
      `[USD Stats]   Combined Total: ${
        stats.usa.count + stats["usa-huzeyfa"].count
      } payments, $${(stats.usa.total + stats["usa-huzeyfa"].total).toFixed(2)}`
    );
    console.log(
      `[USD Stats] ========== End USD Statistics Calculation ==========`
    );

    return {
      usa: {
        label: "United States",
        ...stats.usa,
        display: getCurrencyDisplay(stats.usa.total, "USD"),
      },
      "usa-huzeyfa": {
        label: "USA-huzeyfa",
        ...stats["usa-huzeyfa"],
        display: getCurrencyDisplay(stats["usa-huzeyfa"].total, "USD"),
      },
      total: {
        total: stats.usa.total + stats["usa-huzeyfa"].total, // Only USA + USA-huzeyfa, exclude other
        count: stats.usa.count + stats["usa-huzeyfa"].count,
        approved: stats.usa.approved + stats["usa-huzeyfa"].approved,
        pending: stats.usa.pending + stats["usa-huzeyfa"].pending,
        rejected: stats.usa.rejected + stats["usa-huzeyfa"].rejected,
      },
    };
  }, [payments, date, getCurrencyDisplay]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        search: debouncedSearchQuery,
      });
      if (countryFilter) params.append("country", countryFilter);
      if (date?.from) params.append("startDate", date.from.toISOString());
      if (date?.to) params.append("endDate", date.to.toISOString());
      const res = await fetch(`/api/admin/${schoolSlug}/payments?${params.toString()}`, {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch payments");
      const data = await res.json();
      const normalized = Array.isArray(data)
        ? data.map((payment: any) => ({
            ...payment,
            paidamount: Number(payment.paidamount) || 0,
            currency:
              payment.currency ||
              payment.classfeeCurrency ||
              payment?.wpos_wpdatatable_23?.classfeeCurrency ||
              "ETB",
          }))
        : [];
      setPayments(normalized);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, countryFilter, debouncedSearchQuery, date]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Fetch all payments for statistics (no filters) on mount - Simple direct fetch
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`/api/admin/${schoolSlug}/payments?statsOnly=true`, {
          cache: "no-store",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });
        if (!res.ok) {
          console.error(`[Stats] Failed to fetch: ${res.status}`);
          return;
        }
        const data = await res.json();
        // Simple normalization
        const normalized = Array.isArray(data)
          ? data.map((p: any) => ({
              ...p,
              paidamount: Number(p.paidamount) || 0,
              currency: p.currency || "ETB",
              country: p.country || undefined,
            }))
          : [];
        console.log(`[Stats] Setting ${normalized.length} payments to state`);
        setAllPaymentsForStats(normalized);
      } catch (err) {
        console.error("[Stats] Error:", err);
        setAllPaymentsForStats([]);
      }
    };
    fetchStats();
  }, []); // Run once on mount

  const dateRangeLabel = useMemo(() => {
    if (date?.from && date?.to) {
      return `${format(date.from, "LLL dd, y")} - ${format(
        date.to,
        "LLL dd, y"
      )}`;
    }
    if (date?.from) {
      return format(date.from, "LLL dd, y");
    }
    return "Last 30 days";
  }, [date]);

  const handleClearFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("");
    setCountryFilter("");
    setDate(undefined);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Pagination logic
  const totalPages = Math.ceil(payments.length / itemsPerPage);
  const paginatedPayments = payments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics for charts
  const statusCounts = [
    {
      name: "Approved",
      value: payments.filter((p) => p.status === "Approved").length,
    },
    {
      name: "Pending",
      value: payments.filter((p) => p.status === "pending").length,
    },
    {
      name: "Rejected",
      value: payments.filter((p) => p.status === "rejected").length,
    },
  ];
  const statusAmounts = [
    {
      name: "Approved",
      value: payments
        .filter((p) => p.status === "Approved")
        .reduce((sum, p) => sum + Number(p.paidamount), 0),
    },
    {
      name: "Pending",
      value: payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + Number(p.paidamount), 0),
    },
    {
      name: "Rejected",
      value: payments
        .filter((p) => p.status === "rejected")
        .reduce((sum, p) => sum + Number(p.paidamount), 0),
    },
  ];
  const PIE_COLORS = ["#000000", "#6b7280", "#9ca3af"];

  const updatePaymentStatus = async (
    id: number | string,
    status: "Approved" | "rejected" | "pending"
  ) => {
    // Can't update pending checkouts - they're waiting for gateway confirmation
    if (typeof id === "string" && id.startsWith("checkout-")) {
      setError(
        "Cannot update pending checkout. It will be processed automatically when payment gateway confirms."
      );
      return;
    }

    try {
      const res = await fetch(`/api/admin/${schoolSlug}/payments`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
        body: JSON.stringify({ id: Number(id), status }),
        cache: "no-store",
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Failed to ${status} payment`);
      }
      fetchPayments(); // Refresh list
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openDetailsModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-md">
                    <FiDollarSign className="h-7 w-7" />
                  </span>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                      Payment Management
                    </h1>
                    <p className="mt-1 max-w-xl text-sm text-gray-600 sm:text-base">
                      Monitor student transactions, review approvals, and keep
                      records aligned across every currency.
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                  {dateRangeLabel}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="group rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 shadow-md transition-all hover:border-gray-300 hover:shadow-xl">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-gray-600">
                      <FiUsers className="h-4 w-4" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-600">
                      Total Records
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">
                    {totalPayments.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs font-medium text-gray-500">
                    Across {uniqueCurrencies.length} currency
                    {uniqueCurrencies.length === 1 ? "" : "ies"}
                  </p>
                </div>

                <div className="group rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-5 shadow-md transition-all hover:border-emerald-300 hover:shadow-xl">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-200 text-emerald-700">
                      <FiCheckCircle className="h-4 w-4" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">
                      Approved
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-emerald-700">
                    {approvedCount.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs font-medium text-emerald-600">
                    {approvalRate}% approval rate
                  </p>
                </div>

                <div className="group rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100 p-5 shadow-md transition-all hover:border-amber-300 hover:shadow-xl">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200 text-amber-700">
                      <FiClock className="h-4 w-4" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
                      Pending
                    </p>
                  </div>
                  <p className="mt-3 text-3xl font-bold text-amber-700">
                    {pendingCount.toLocaleString()}
                  </p>
                  <p className="mt-2 text-xs font-medium text-amber-600">
                    {totalPayments
                      ? ((pendingCount / totalPayments) * 100).toFixed(1)
                      : 0}
                    % awaiting review
                  </p>
                </div>

                <div className="group rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-5 shadow-md transition-all hover:border-blue-300 hover:shadow-xl">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-200 text-blue-700">
                      <FiDollarSign className="h-4 w-4" />
                    </span>
                    <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-700">
                      {primaryTotals
                        ? `Volume (${primaryTotals.currency})`
                        : "Volume"}
                    </p>
                  </div>
                  {primaryTotals ? (
                    <>
                      <Tooltip content={primaryTotals.total.full}>
                        <p className="mt-3 text-2xl font-bold text-gray-900">
                          {primaryTotals.total.primary}
                        </p>
                      </Tooltip>
                      <Tooltip content={primaryTotals.approved.full}>
                        <p className="mt-2 text-xs font-medium text-gray-600">
                          Approved: {primaryTotals.approved.primary}
                        </p>
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <p className="mt-3 text-2xl font-bold text-gray-400">—</p>
                      <p className="mt-2 text-xs font-medium text-gray-400">
                        No data available
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
              <p className="text-sm text-gray-500">
                Narrow down transactions by student, status, or time period.
              </p>
            </div>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                <FiSearch className="mr-2 inline h-4 w-4" />
                Search Payments
              </label>
              <input
                type="text"
                placeholder="Search by student or transaction..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                <FiFilter className="mr-2 inline h-4 w-4" />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All (Approved gateway + All manual)</option>
                <option value="pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                <FiFilter className="mr-2 inline h-4 w-4" />
                Country
              </label>
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm transition focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">All countries</option>
                <option value="United States">United States</option>
                <option value="USA-huzeyfa">USA-huzeyfa</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                <FiCalendar className="mr-2 inline h-4 w-4" />
                Date Range
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-left text-gray-900 shadow-sm transition focus:border-black focus:outline-none focus:ring-2 focus:ring-black">
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Last 30 days</span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={(newRange) => {
                      setDate(newRange);
                      setCurrentPage(1);
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700">
                Quick Actions
              </label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => fetchPayments()}
                  className="flex-1 rounded-xl border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Currency & USD Country Statistics */}
        <section className="space-y-6">
          <div className="rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-xl lg:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <FiDollarSign className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Currency Breakdown
                  </h2>
                  <p className="text-sm text-gray-600">
                    Track payment volume by settlement currency and status
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border-2 border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700 shadow-sm">
                {currencyStats.length} currency
                {currencyStats.length === 1 ? "" : "ies"}
              </span>
            </div>

            {hasMixedCurrencies && (
              <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <span className="font-semibold text-gray-700">
                  Multiple currencies detected:
                </span>{" "}
                {uniqueCurrencies.join(", ")}. Values below reflect the original
                payment currency.
              </div>
            )}

            {currencyStats.length === 0 ? (
              <div className="mt-10 rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                No payments recorded in the selected range.
              </div>
            ) : (
              <div className="mt-6 grid gap-6 grid-cols-[repeat(auto-fit,minmax(20rem,1fr))]">
                {currencyStats.map((stat) => {
                  const totalDisplay = getCurrencyDisplay(
                    stat.total,
                    stat.currency
                  );
                  const totalKey = `total-${stat.currency}`;
                  const breakdownItems = [
                    {
                      label: "Approved",
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                      bar: "bg-emerald-400",
                      value: stat.approved,
                    },
                    {
                      label: "Pending",
                      color: "text-amber-600",
                      bg: "bg-amber-50",
                      bar: "bg-amber-400",
                      value: stat.pending,
                    },
                    {
                      label: "Rejected",
                      color: "text-rose-600",
                      bg: "bg-rose-50",
                      bar: "bg-rose-400",
                      value: stat.rejected,
                    },
                  ] as const;

                  return (
                    <div
                      key={stat.currency}
                      className="flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl"
                    >
                      <div className="relative flex flex-col gap-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 px-5 py-6 text-white">
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                            {stat.currency}
                          </span>
                          <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                            {stat.symbol}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/60">
                              Total Volume
                            </span>
                            <Tooltip content={totalDisplay.full}>
                              <span
                                className="block text-3xl font-semibold leading-tight tracking-tight tabular-nums sm:text-[2.4rem]"
                                aria-label={`Total amount ${totalDisplay.full}`}
                                title={totalDisplay.full}
                              >
                                {totalDisplay.primary}
                              </span>
                            </Tooltip>
                          </div>
                          <Tooltip
                            content={
                              copiedKey === totalKey
                                ? "Copied!"
                                : "Copy full value"
                            }
                          >
                            <button
                              type="button"
                              onClick={() =>
                                handleCopyAmount(totalKey, totalDisplay.full)
                              }
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/30 bg-white/20 text-white transition hover:bg-white/30"
                              aria-label={`Copy total amount for ${stat.currency}`}
                            >
                              {copiedKey === totalKey ? (
                                <FiCheckCircle className="h-5 w-5 text-emerald-200" />
                              ) : (
                                <FiCopy className="h-5 w-5" />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col gap-4 px-5 py-6">
                        <div className="grid grid-cols-1 gap-3">
                          {breakdownItems.map((item) => {
                            const breakdownDisplay = getCurrencyDisplay(
                              item.value,
                              stat.currency
                            );
                            const percentage =
                              stat.total > 0
                                ? Math.min(
                                    100,
                                    Math.max(
                                      0,
                                      Number(
                                        (
                                          (item.value / stat.total) *
                                          100
                                        ).toFixed(1)
                                      )
                                    )
                                  )
                                : 0;
                            const itemKey = `${stat.currency}-${item.label}`;

                            return (
                              <div
                                key={item.label}
                                className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                              >
                                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
                                  <div className="space-y-1">
                                    <span
                                      className={`text-sm font-semibold ${item.color}`}
                                    >
                                      {item.label}
                                    </span>
                                    <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-500">
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-end gap-3 min-w-0">
                                    <Tooltip content={breakdownDisplay.full}>
                                      <span
                                        className="text-right text-sm font-semibold text-gray-900 tabular-nums"
                                        aria-label={`${item.label} total ${breakdownDisplay.full}`}
                                        title={breakdownDisplay.full}
                                      >
                                        {breakdownDisplay.primary}
                                      </span>
                                    </Tooltip>
                                    <Tooltip
                                      content={
                                        copiedKey === itemKey
                                          ? "Copied!"
                                          : "Copy full value"
                                      }
                                    >
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleCopyAmount(
                                            itemKey,
                                            breakdownDisplay.full
                                          )
                                        }
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-gray-300 hover:text-gray-900"
                                        aria-label={`Copy ${item.label} amount for ${stat.currency}`}
                                      >
                                        {copiedKey === itemKey ? (
                                          <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                          <FiCopy className="h-4 w-4" />
                                        )}
                                      </button>
                                    </Tooltip>
                                  </div>
                                </div>
                                <div className="h-2 rounded-full bg-gray-200">
                                  <div
                                    className={`${item.bar} h-full rounded-full transition-[width] duration-500 ease-out`}
                                    style={{
                                      width: `${percentage}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* USD Country Breakdown - Enhanced & Beautiful */}
            {usdCountryStats.total.count > 0 && (
              <div className="mb-8 overflow-hidden rounded-3xl border-2 border-gray-300 bg-white shadow-2xl">
                {/* Enhanced Header with Stats */}
                <div className="border-b-2 border-gray-200 bg-black px-6 py-6">
                  <div className="flex flex-wrap items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-black shadow-xl">
                        <FiDollarSign className="h-8 w-8" />
                      </span>
                      <div>
                        <h3 className="text-3xl font-bold text-white">
                          USD Payments by Country
                        </h3>
                        <p className="mt-2 text-sm font-medium text-gray-300">
                          Comprehensive breakdown: United States 🇺🇸 vs
                          USA-huzeyfa 🌍
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="rounded-xl bg-white px-5 py-3 shadow-lg border border-gray-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                          Total Countries
                        </p>
                        <p className="text-3xl font-bold text-black">2</p>
                      </div>
                      <div className="rounded-xl bg-white px-5 py-3 shadow-lg border border-gray-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                          Combined Total
                        </p>
                        <p className="text-2xl font-bold text-black">
                          {formatCurrencyValue(
                            usdCountryStats.total.total,
                            "USD"
                          )}
                        </p>
                      </div>
                      <div className="rounded-xl bg-white px-5 py-3 shadow-lg border border-gray-200">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">
                          Total Payments
                        </p>
                        <p className="text-2xl font-bold text-black">
                          {usdCountryStats.total.count}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* United States - Enhanced */}
                    <div className="group relative overflow-hidden rounded-2xl border-[3px] border-gray-300 bg-white p-6 shadow-xl transition-all hover:border-black hover:shadow-2xl">
                      <div className="relative">
                        <div className="mb-5 flex items-center justify-between border-b-2 border-gray-200 pb-4">
                          <div className="flex items-center gap-4">
                            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-lg">
                              🇺🇸
                            </span>
                            <div>
                              <h4 className="text-xl font-bold text-gray-900">
                                United States
                              </h4>
                            </div>
                          </div>
                        </div>

                        {/* Main Stats Card */}
                        <div className="mb-6 rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-xl">
                          <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-bold uppercase tracking-wider text-black">
                              Total Revenue
                            </span>
                            <Tooltip content={usdCountryStats.usa.display.full}>
                              <button
                                onClick={() =>
                                  handleCopyAmount(
                                    `usa-total`,
                                    usdCountryStats.usa.display.full
                                  )
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg transition"
                              >
                                {copiedKey === `usa-total` ? (
                                  <FiCheckCircle className="h-4 w-4 text-black" />
                                ) : (
                                  <FiCopy className="h-4 w-4 text-gray-600" />
                                )}
                              </button>
                            </Tooltip>
                          </div>
                          <p className="text-4xl font-bold text-black mb-2">
                            {usdCountryStats.usa.display.primary}
                          </p>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Transactions
                              </p>
                              <p className="text-xl font-bold text-gray-900">
                                {usdCountryStats.usa.count}
                              </p>
                            </div>
                            <div className="h-12 w-px bg-gray-200"></div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Average
                              </p>
                              <p className="text-xl font-bold text-black">
                                {usdCountryStats.usa.count > 0
                                  ? formatCurrencyValue(
                                      usdCountryStats.usa.total /
                                        usdCountryStats.usa.count,
                                      "USD"
                                    )
                                  : "$0.00"}
                              </p>
                            </div>
                            <div className="h-12 w-px bg-orange-200"></div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Approval Rate
                              </p>
                              <p className="text-xl font-bold text-emerald-700">
                                {usdCountryStats.usa.total > 0
                                  ? (
                                      (usdCountryStats.usa.approved /
                                        usdCountryStats.usa.total) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Breakdown with Progress Bars */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
                            Payment Status Breakdown
                          </h5>

                          {/* Approved */}
                          <div className="rounded-xl border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 p-4 shadow-lg">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FiCheckCircle className="h-5 w-5 text-emerald-600" />
                                <span className="text-sm font-bold text-emerald-800">
                                  Approved Payments
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-emerald-900">
                                  {formatCurrencyValue(
                                    usdCountryStats.usa.approved,
                                    "USD"
                                  )}
                                </p>
                                <p className="text-xs text-emerald-700">
                                  {usdCountryStats.usa.total > 0
                                    ? (
                                        (usdCountryStats.usa.approved /
                                          usdCountryStats.usa.total) *
                                        100
                                      ).toFixed(1)
                                    : 0}
                                  % of total
                                </p>
                              </div>
                            </div>
                            <div className="h-3 rounded-full bg-emerald-200 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
                                style={{
                                  width: `${
                                    usdCountryStats.usa.total > 0
                                      ? (usdCountryStats.usa.approved /
                                          usdCountryStats.usa.total) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Pending */}
                          {usdCountryStats.usa.pending > 0 && (
                            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 p-4 shadow-lg">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FiClock className="h-5 w-5 text-amber-600" />
                                  <span className="text-sm font-bold text-amber-800">
                                    Pending Payments
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-amber-900">
                                    {formatCurrencyValue(
                                      usdCountryStats.usa.pending,
                                      "USD"
                                    )}
                                  </p>
                                  <p className="text-xs text-amber-700">
                                    {usdCountryStats.usa.total > 0
                                      ? (
                                          (usdCountryStats.usa.pending /
                                            usdCountryStats.usa.total) *
                                          100
                                        ).toFixed(1)
                                      : 0}
                                    % of total
                                  </p>
                                </div>
                              </div>
                              <div className="h-3 rounded-full bg-amber-200 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${
                                      usdCountryStats.usa.total > 0
                                        ? (usdCountryStats.usa.pending /
                                            usdCountryStats.usa.total) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Rejected */}
                          {usdCountryStats.usa.rejected > 0 && (
                            <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-r from-rose-50 to-rose-100 p-4 shadow-lg">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FiXCircle className="h-5 w-5 text-rose-600" />
                                  <span className="text-sm font-bold text-rose-800">
                                    Rejected Payments
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-rose-900">
                                    {formatCurrencyValue(
                                      usdCountryStats.usa.rejected,
                                      "USD"
                                    )}
                                  </p>
                                  <p className="text-xs text-rose-700">
                                    {usdCountryStats.usa.total > 0
                                      ? (
                                          (usdCountryStats.usa.rejected /
                                            usdCountryStats.usa.total) *
                                          100
                                        ).toFixed(1)
                                      : 0}
                                    % of total
                                  </p>
                                </div>
                              </div>
                              <div className="h-3 rounded-full bg-rose-200 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-rose-500 to-rose-600 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${
                                      usdCountryStats.usa.total > 0
                                        ? (usdCountryStats.usa.rejected /
                                            usdCountryStats.usa.total) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Metrics */}
                        <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-orange-200">
                          <div className="bg-white/80 rounded-xl p-3 border border-orange-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Min Payment
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              {usdCountryStats.usa.count > 0
                                ? "Calculating..."
                                : "N/A"}
                            </p>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 border border-orange-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Max Payment
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              {usdCountryStats.usa.count > 0
                                ? "Calculating..."
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* USA-huzeyfa - Ultra Enhanced */}
                    <div className="group relative overflow-hidden rounded-3xl border-[3px] border-green-300 bg-gradient-to-br from-white via-green-50/40 to-green-100/60 p-8 shadow-2xl transition-all hover:border-green-400 hover:shadow-3xl hover:scale-[1.02]">
                      {/* Decorative Background Elements */}
                      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-green-200/30 blur-3xl"></div>
                      <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-green-100/40 blur-2xl"></div>

                      <div className="relative">
                        {/* Header Section */}
                        <div className="mb-6 flex items-center justify-between border-b-2 border-green-200 pb-4">
                          <div className="flex items-center gap-4">
                            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 via-green-500 to-green-600 text-white shadow-xl text-3xl">
                              🌍
                            </span>
                            <div>
                              <h4 className="text-2xl font-bold text-gray-900">
                                USA-huzeyfa
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Huzeyfa-managed US students
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="rounded-xl bg-green-100 px-3 py-2 border border-green-200">
                              <p className="text-xs font-semibold text-green-700 mb-1">
                                Market Share
                              </p>
                              <p className="text-xl font-bold text-green-900">
                                {usdCountryStats.total.total > 0
                                  ? (
                                      (usdCountryStats["usa-huzeyfa"].total /
                                        usdCountryStats.total.total) *
                                      100
                                    ).toFixed(1)
                                  : 0}
                                %
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Main Stats Card */}
                        <div className="mb-6 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-xl">
                          <div className="mb-4 flex items-center justify-between">
                            <span className="text-sm font-bold uppercase tracking-wider text-green-700">
                              Total Revenue
                            </span>
                            <Tooltip
                              content={
                                usdCountryStats["usa-huzeyfa"].display.full
                              }
                            >
                              <button
                                onClick={() =>
                                  handleCopyAmount(
                                    `usa-huzeyfa-total`,
                                    usdCountryStats["usa-huzeyfa"].display.full
                                  )
                                }
                                className="p-2 hover:bg-green-100 rounded-lg transition"
                              >
                                {copiedKey === `usa-huzeyfa-total` ? (
                                  <FiCheckCircle className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <FiCopy className="h-4 w-4 text-green-600" />
                                )}
                              </button>
                            </Tooltip>
                          </div>
                          <p className="text-4xl font-bold text-green-900 mb-2">
                            {usdCountryStats["usa-huzeyfa"].display.primary}
                          </p>
                          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-green-200">
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Transactions
                              </p>
                              <p className="text-xl font-bold text-gray-900">
                                {usdCountryStats["usa-huzeyfa"].count}
                              </p>
                            </div>
                            <div className="h-12 w-px bg-gray-200"></div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Average
                              </p>
                              <p className="text-xl font-bold text-black">
                                {usdCountryStats["usa-huzeyfa"].count > 0
                                  ? formatCurrencyValue(
                                      usdCountryStats["usa-huzeyfa"].total /
                                        usdCountryStats["usa-huzeyfa"].count,
                                      "USD"
                                    )
                                  : "$0.00"}
                              </p>
                            </div>
                            <div className="h-12 w-px bg-green-200"></div>
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                Approval Rate
                              </p>
                              <p className="text-xl font-bold text-emerald-700">
                                {usdCountryStats["usa-huzeyfa"].total > 0
                                  ? (
                                      (usdCountryStats["usa-huzeyfa"].approved /
                                        usdCountryStats["usa-huzeyfa"].total) *
                                      100
                                    ).toFixed(0)
                                  : 0}
                                %
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Status Breakdown with Progress Bars */}
                        <div className="space-y-4">
                          <h5 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3">
                            Payment Status Breakdown
                          </h5>

                          {/* Approved */}
                          <div className="rounded-xl border-2 border-gray-300 bg-white p-4 shadow-lg">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FiCheckCircle className="h-5 w-5 text-black" />
                                <span className="text-sm font-bold text-black">
                                  Approved Payments
                                </span>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-black">
                                  {formatCurrencyValue(
                                    usdCountryStats["usa-huzeyfa"].approved,
                                    "USD"
                                  )}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {usdCountryStats["usa-huzeyfa"].total > 0
                                    ? (
                                        (usdCountryStats["usa-huzeyfa"]
                                          .approved /
                                          usdCountryStats["usa-huzeyfa"]
                                            .total) *
                                        100
                                      ).toFixed(1)
                                    : 0}
                                  % of total
                                </p>
                              </div>
                            </div>
                            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full bg-black rounded-full transition-all duration-1000"
                                style={{
                                  width: `${
                                    usdCountryStats["usa-huzeyfa"].total > 0
                                      ? (usdCountryStats["usa-huzeyfa"]
                                          .approved /
                                          usdCountryStats["usa-huzeyfa"]
                                            .total) *
                                        100
                                      : 0
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>

                          {/* Pending */}
                          {usdCountryStats["usa-huzeyfa"].pending > 0 && (
                            <div className="rounded-xl border-2 border-gray-300 bg-white p-4 shadow-lg">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FiClock className="h-5 w-5 text-black" />
                                  <span className="text-sm font-bold text-black">
                                    Pending Payments
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-black">
                                    {formatCurrencyValue(
                                      usdCountryStats["usa-huzeyfa"].pending,
                                      "USD"
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {usdCountryStats["usa-huzeyfa"].total > 0
                                      ? (
                                          (usdCountryStats["usa-huzeyfa"]
                                            .pending /
                                            usdCountryStats["usa-huzeyfa"]
                                              .total) *
                                          100
                                        ).toFixed(1)
                                      : 0}
                                    % of total
                                  </p>
                                </div>
                              </div>
                              <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full bg-gray-600 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${
                                      usdCountryStats["usa-huzeyfa"].total > 0
                                        ? (usdCountryStats["usa-huzeyfa"]
                                            .pending /
                                            usdCountryStats["usa-huzeyfa"]
                                              .total) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Rejected */}
                          {usdCountryStats["usa-huzeyfa"].rejected > 0 && (
                            <div className="rounded-xl border-2 border-gray-300 bg-white p-4 shadow-lg">
                              <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <FiXCircle className="h-5 w-5 text-black" />
                                  <span className="text-sm font-bold text-black">
                                    Rejected Payments
                                  </span>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-black">
                                    {formatCurrencyValue(
                                      usdCountryStats["usa-huzeyfa"].rejected,
                                      "USD"
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {usdCountryStats["usa-huzeyfa"].total > 0
                                      ? (
                                          (usdCountryStats["usa-huzeyfa"]
                                            .rejected /
                                            usdCountryStats["usa-huzeyfa"]
                                              .total) *
                                          100
                                        ).toFixed(1)
                                      : 0}
                                    % of total
                                  </p>
                                </div>
                              </div>
                              <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
                                <div
                                  className="h-full bg-gray-800 rounded-full transition-all duration-1000"
                                  style={{
                                    width: `${
                                      usdCountryStats["usa-huzeyfa"].total > 0
                                        ? (usdCountryStats["usa-huzeyfa"]
                                            .rejected /
                                            usdCountryStats["usa-huzeyfa"]
                                              .total) *
                                          100
                                        : 0
                                    }%`,
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Additional Metrics */}
                        <div className="mt-6 grid grid-cols-2 gap-3 pt-6 border-t border-green-200">
                          <div className="bg-white/80 rounded-xl p-3 border border-green-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Min Payment
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              {usdCountryStats["usa-huzeyfa"].count > 0
                                ? "Calculating..."
                                : "N/A"}
                            </p>
                          </div>
                          <div className="bg-white/80 rounded-xl p-3 border border-green-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">
                              Max Payment
                            </p>
                            <p className="text-sm font-bold text-gray-900">
                              {usdCountryStats["usa-huzeyfa"].count > 0
                                ? "Calculating..."
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Comparison Chart Section */}
                  <div className="mt-8 rounded-2xl border-2 border-gray-300 bg-white p-6 shadow-xl">
                    <div className="mb-6 flex items-center gap-3">
                      <FiTrendingUp className="h-6 w-6 text-black" />
                      <h5 className="text-lg font-bold text-gray-900">
                        Side-by-Side Comparison
                      </h5>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* United States Comparison */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🇺🇸</span>
                          <span className="font-bold text-gray-900">
                            United States
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total Revenue
                            </span>
                            <span className="font-bold text-black">
                              {usdCountryStats.usa.display.primary}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Transactions
                            </span>
                            <span className="font-bold text-gray-900">
                              {usdCountryStats.usa.count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Average
                            </span>
                            <span className="font-bold text-gray-900">
                              {usdCountryStats.usa.count > 0
                                ? formatCurrencyValue(
                                    usdCountryStats.usa.total /
                                      usdCountryStats.usa.count,
                                    "USD"
                                  )
                                : "$0.00"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Approval Rate
                            </span>
                            <span className="font-bold text-black">
                              {usdCountryStats.usa.total > 0
                                ? (
                                    (usdCountryStats.usa.approved /
                                      usdCountryStats.usa.total) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* USA-huzeyfa Comparison */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">🌍</span>
                          <span className="font-bold text-gray-900">
                            USA-huzeyfa
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Total Revenue
                            </span>
                            <span className="font-bold text-black">
                              {usdCountryStats["usa-huzeyfa"].display.primary}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Transactions
                            </span>
                            <span className="font-bold text-gray-900">
                              {usdCountryStats["usa-huzeyfa"].count}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Average
                            </span>
                            <span className="font-bold text-gray-900">
                              {usdCountryStats["usa-huzeyfa"].count > 0
                                ? formatCurrencyValue(
                                    usdCountryStats["usa-huzeyfa"].total /
                                      usdCountryStats["usa-huzeyfa"].count,
                                    "USD"
                                  )
                                : "$0.00"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              Approval Rate
                            </span>
                            <span className="font-bold text-emerald-700">
                              {usdCountryStats["usa-huzeyfa"].total > 0
                                ? (
                                    (usdCountryStats["usa-huzeyfa"].approved /
                                      usdCountryStats["usa-huzeyfa"].total) *
                                    100
                                  ).toFixed(1)
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Total Summary - Ultra Enhanced */}
                  <div className="mt-8 rounded-3xl border-[3px] border-gray-300 bg-white p-8 shadow-2xl">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black text-white shadow-xl">
                          <FiDollarSign className="h-8 w-8" />
                        </span>
                        <div>
                          <p className="text-xl font-bold text-gray-900">
                            Combined Total USD Payments
                          </p>
                          <p className="text-sm text-gray-700 mt-1">
                            United States 🇺🇸 + USA-huzeyfa 🌍 Combined
                            Statistics
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-white px-5 py-3 shadow-lg border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            Total Amount
                          </p>
                          <p className="text-3xl font-bold text-black">
                            {formatCurrencyValue(
                              usdCountryStats.total.total,
                              "USD"
                            )}
                          </p>
                        </div>
                        <div className="rounded-xl bg-white px-5 py-3 shadow-lg border border-gray-200">
                          <p className="text-xs font-semibold text-gray-600 mb-1">
                            Total Payments
                          </p>
                          <p className="text-3xl font-bold text-black">
                            {usdCountryStats.total.count}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="rounded-xl border-2 border-gray-300 bg-white p-5 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <FiCheckCircle className="h-5 w-5 text-black" />
                          <p className="text-sm font-bold text-black">
                            Approved
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-black mb-1">
                          {formatCurrencyValue(
                            usdCountryStats.total.approved,
                            "USD"
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {usdCountryStats.total.total > 0
                            ? (
                                (usdCountryStats.total.approved /
                                  usdCountryStats.total.total) *
                                100
                              ).toFixed(1)
                            : 0}
                          % of combined total
                        </p>
                        <div className="mt-3 h-2 rounded-full bg-gray-200">
                          <div
                            className="h-full bg-black rounded-full transition-all duration-1000"
                            style={{
                              width: `${
                                usdCountryStats.total.total > 0
                                  ? (usdCountryStats.total.approved /
                                      usdCountryStats.total.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-gray-300 bg-white p-5 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <FiClock className="h-5 w-5 text-black" />
                          <p className="text-sm font-bold text-black">
                            Pending
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-black mb-1">
                          {formatCurrencyValue(
                            usdCountryStats.total.pending,
                            "USD"
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {usdCountryStats.total.total > 0
                            ? (
                                (usdCountryStats.total.pending /
                                  usdCountryStats.total.total) *
                                100
                              ).toFixed(1)
                            : 0}
                          % of combined total
                        </p>
                        <div className="mt-3 h-2 rounded-full bg-gray-200">
                          <div
                            className="h-full bg-gray-600 rounded-full transition-all duration-1000"
                            style={{
                              width: `${
                                usdCountryStats.total.total > 0
                                  ? (usdCountryStats.total.pending /
                                      usdCountryStats.total.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      <div className="rounded-xl border-2 border-gray-300 bg-white p-5 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <FiXCircle className="h-5 w-5 text-black" />
                          <p className="text-sm font-bold text-black">
                            Rejected
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-black mb-1">
                          {formatCurrencyValue(
                            usdCountryStats.total.rejected,
                            "USD"
                          )}
                        </p>
                        <p className="text-xs text-gray-600">
                          {usdCountryStats.total.total > 0
                            ? (
                                (usdCountryStats.total.rejected /
                                  usdCountryStats.total.total) *
                                100
                              ).toFixed(1)
                            : 0}
                          % of combined total
                        </p>
                        <div className="mt-3 h-2 rounded-full bg-gray-200">
                          <div
                            className="h-full bg-gray-800 rounded-full transition-all duration-1000"
                            style={{
                              width: `${
                                usdCountryStats.total.total > 0
                                  ? (usdCountryStats.total.rejected /
                                      usdCountryStats.total.total) *
                                    100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Combined Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pt-6 border-t-2 border-gray-200">
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          USA Share
                        </p>
                        <p className="text-xl font-bold text-black">
                          {usdCountryStats.total.total > 0
                            ? (
                                (usdCountryStats.usa.total /
                                  usdCountryStats.total.total) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-600 mb-2">
                          Huzeyfa Share
                        </p>
                        <p className="text-xl font-bold text-black">
                          {usdCountryStats.total.total > 0
                            ? (
                                (usdCountryStats["usa-huzeyfa"].total /
                                  usdCountryStats.total.total) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-xl">
              <div className="flex items-center gap-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <FiTrendingUp className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Payments by Status
                  </h2>
                  <p className="text-sm text-gray-600">
                    Distribution of transactions by decision state
                  </p>
                </div>
              </div>
              <div className="px-6 py-6">
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={statusCounts}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#4b5563" />
                    <YAxis allowDecimals={false} stroke="#4b5563" />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#000000" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-3xl border-2 border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-xl">
              <div className="flex items-center gap-4 border-b-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                  <FiDollarSign className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Amount by Status
                  </h2>
                  <p className="text-sm text-gray-600">
                    Financial distribution across statuses
                  </p>
                </div>
              </div>
              <div className="px-6 py-6">
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={statusAmounts}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      fill="#000000"
                    >
                      {statusAmounts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <RechartsTooltip
                      formatter={(value) =>
                        formatPrimaryAmount(Number(value as number))
                      }
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white shadow-xl">
          <div className="flex flex-wrap items-center gap-4 border-b border-gray-200 px-6 py-6">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black text-white">
              <FiUsers className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Payment Transactions
              </h2>
              <p className="text-sm text-gray-500">
                Approve, reject, or review payment details at a glance.
              </p>
            </div>
          </div>

          <div className="px-6 py-8">
            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-black"></div>
                <p className="text-lg font-medium text-black">
                  Loading payments...
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Please wait while we fetch the latest data.
                </p>
              </div>
            ) : error ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-8 w-fit rounded-full bg-red-50 p-8">
                  <FiAlertCircle className="h-16 w-16 text-red-500" />
                </div>
                <h3 className="mb-4 text-3xl font-bold text-black">
                  Error Loading Payments
                </h3>
                <p className="text-xl text-red-600">{error}</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-8 w-fit rounded-full bg-gray-100 p-8">
                  <FiDollarSign className="h-16 w-16 text-gray-500" />
                </div>
                <h3 className="mb-4 text-3xl font-bold text-black">
                  No Payments Found
                </h3>
                <p className="text-xl text-gray-600">
                  No payment transactions match your current filters.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider text-black">
                          Transaction ID
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-bold uppercase tracking-wider text-black">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {paginatedPayments.map((payment, index) => (
                        <tr
                          key={payment.id}
                          className={`transition-all duration-200 hover:bg-gray-50 ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-black">
                            <div className="flex flex-col gap-1">
                              <span>{payment.studentname}</span>
                              {payment.country && (
                                <span
                                  className={`text-xs font-medium px-2 py-0.5 rounded-full inline-block w-fit ${
                                    payment.country === "United States"
                                      ? "text-orange-600 bg-orange-50"
                                      : payment.country === "USA-huzeyfa"
                                      ? "text-green-600 bg-green-50"
                                      : "text-blue-600 bg-blue-50"
                                  }`}
                                >
                                  🌍 {payment.country}
                                </span>
                              )}
                              {payment.intent === "subscription" &&
                                payment.subscription && (
                                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full inline-block w-fit">
                                    📦{" "}
                                    {payment.subscription.package?.name ||
                                      "Subscription"}
                                  </span>
                                )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {formatCurrencyValue(
                              Number(payment.paidamount),
                              payment.currency || primaryCurrency
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <div className="flex flex-col gap-1">
                              <span>
                                {new Date(
                                  payment.paymentdate
                                ).toLocaleDateString()}
                              </span>
                              {payment.country && (
                                <span className="text-xs text-gray-500">
                                  {payment.country === "United States"
                                    ? new Date(
                                        payment.paymentdate
                                      ).toLocaleString("en-US", {
                                        timeZone: "America/New_York",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }) + " EST"
                                    : payment.country === "USA-huzeyfa"
                                    ? new Date(
                                        payment.paymentdate
                                      ).toLocaleString("en-US", {
                                        timeZone: "Africa/Nairobi",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      }) + " EAT"
                                    : null}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge
                              status={payment.status}
                              isPendingCheckout={payment.isPendingCheckout}
                            />
                          </td>
                          <td className="px-6 py-4 max-w-xs break-all whitespace-pre-wrap font-mono text-xs text-gray-700">
                            {payment.transactionid}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Only show approve/reject buttons for manual payments (not gateway payments) */}
                              {payment.source !== "stripe" &&
                                payment.source !== "chapa" && (
                                  <>
                                    {payment.status !== "Approved" && (
                                      <button
                                        onClick={() =>
                                          updatePaymentStatus(
                                            payment.id,
                                            "Approved"
                                          )
                                        }
                                        className="rounded-xl bg-emerald-100 p-2 text-emerald-700 transition hover:bg-emerald-200 hover:scale-105"
                                        title="Approve"
                                      >
                                        <FiCheckCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                    {payment.status !== "rejected" && (
                                      <button
                                        onClick={() =>
                                          updatePaymentStatus(
                                            payment.id,
                                            "rejected"
                                          )
                                        }
                                        className="rounded-xl bg-rose-100 p-2 text-rose-700 transition hover:bg-rose-200 hover:scale-105"
                                        title="Reject"
                                      >
                                        <FiXCircle className="h-4 w-4" />
                                      </button>
                                    )}
                                    {payment.status !== "pending" && (
                                      <button
                                        onClick={() =>
                                          updatePaymentStatus(
                                            payment.id,
                                            "pending" as any
                                          )
                                        }
                                        className="rounded-xl bg-amber-100 p-2 text-amber-700 transition hover:bg-amber-200 hover:scale-105"
                                        title="Set to Pending"
                                      >
                                        <FiClock className="h-4 w-4" />
                                      </button>
                                    )}
                                  </>
                                )}
                              <button
                                onClick={() => openDetailsModal(payment)}
                                className="rounded-xl bg-gray-100 p-2 text-gray-700 transition hover:bg-gray-200 hover:scale-105"
                                title="View Details"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                  <p className="text-lg font-semibold text-gray-700">
                    Page {currentPage} of {totalPages || 1}
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-xl border border-gray-300 bg-white p-3 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="rounded-xl border border-gray-300 bg-white p-3 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <FiChevronRight className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Payment Details Modal - Enhanced */}
        <Modal
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
        >
          {selectedPayment && (
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl mx-auto overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header with Gradient */}
              <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-8 py-6 flex-shrink-0">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                      <FiDollarSign className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-white">
                        Payment Details
                      </h2>
                      <p className="text-sm text-white/80 mt-1">
                        Complete transaction information
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 text-white text-sm font-semibold">
                      ID: {selectedPayment.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto flex-1 min-h-0">
                {/* Payment Overview Section */}
                <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <FiActivity className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Payment Overview
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Amount
                      </label>
                      <div className="flex items-center justify-between">
                        <p className="text-2xl font-bold text-gray-900">
                          {formatCurrencyValue(
                            Number(selectedPayment.paidamount),
                            selectedPayment.currency || primaryCurrency
                          )}
                        </p>
                        <Tooltip content="Copy amount">
                          <button
                            onClick={() =>
                              handleCopyAmount(
                                `amount-${selectedPayment.id}`,
                                formatCurrencyValue(
                                  Number(selectedPayment.paidamount),
                                  selectedPayment.currency || primaryCurrency
                                )
                              )
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            {copiedKey === `amount-${selectedPayment.id}` ? (
                              <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <FiCopy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Status
                      </label>
                      <StatusBadge
                        status={selectedPayment.status}
                        isPendingCheckout={selectedPayment.isPendingCheckout}
                      />
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Currency
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedPayment.currency || primaryCurrency} (
                        {getCurrencySymbol(
                          selectedPayment.currency || primaryCurrency
                        )}
                        )
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Payment Date
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {new Date(
                          selectedPayment.paymentdate
                        ).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(
                          selectedPayment.paymentdate
                        ).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Payment Source
                      </label>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          selectedPayment.source === "stripe"
                            ? "bg-indigo-100 text-indigo-800"
                            : selectedPayment.source === "chapa"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedPayment.source === "stripe"
                          ? "💳 Stripe"
                          : selectedPayment.source === "chapa"
                          ? "🌐 Chapa"
                          : "✋ Manual"}
                      </span>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Payment Intent
                      </label>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          selectedPayment.intent === "subscription"
                            ? "bg-purple-100 text-purple-800"
                            : selectedPayment.intent === "deposit"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {selectedPayment.intent === "subscription"
                          ? "📦 Subscription"
                          : selectedPayment.intent === "deposit"
                          ? "💰 Deposit"
                          : "📚 Tuition"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Student Information Section */}
                <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <FiUsers className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Student Information
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-blue-200 p-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Student Name
                      </label>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedPayment.studentname}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-blue-200 p-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Student ID
                      </label>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-mono font-semibold text-gray-900">
                          {selectedPayment.studentid}
                        </p>
                        <Tooltip content="Copy Student ID">
                          <button
                            onClick={() =>
                              handleCopyAmount(
                                `student-id-${selectedPayment.id}`,
                                String(selectedPayment.studentid)
                              )
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                          >
                            {copiedKey ===
                            `student-id-${selectedPayment.id}` ? (
                              <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <FiCopy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    {selectedPayment.country && (
                      <div className="md:col-span-2 bg-white rounded-xl border border-blue-200 p-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Country & Timezone
                        </label>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                              selectedPayment.country === "United States"
                                ? "bg-orange-100 text-orange-700"
                                : selectedPayment.country === "USA-huzeyfa"
                                ? "bg-green-100 text-green-700"
                                : "bg-blue-100 text-blue-700"
                            }`}
                          >
                            🌍 {selectedPayment.country}
                          </span>
                          {selectedPayment.country === "United States" && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-200">
                              🕐 EST/PST (UTC-5 to UTC-8)
                            </span>
                          )}
                          {selectedPayment.country === "USA-huzeyfa" && (
                            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-600 border border-green-200">
                              🕐 EAT (UTC+3) - East Africa Time
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transaction Details Section */}
                <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gray-100 rounded-xl">
                      <FiActivity className="h-5 w-5 text-gray-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Transaction Details
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Transaction ID
                      </label>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-mono text-gray-900 break-all flex-1">
                          {selectedPayment.transactionid}
                        </p>
                        <Tooltip content="Copy Transaction ID">
                          <button
                            onClick={() =>
                              handleCopyAmount(
                                `tx-id-${selectedPayment.id}`,
                                selectedPayment.transactionid
                              )
                            }
                            className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                          >
                            {copiedKey === `tx-id-${selectedPayment.id}` ? (
                              <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <FiCopy className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Sender Name
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {selectedPayment.sendername}
                      </p>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Payment Reason
                      </label>
                      <p className="text-base font-semibold text-gray-900">
                        {selectedPayment.reason || "N/A"}
                      </p>
                    </div>
                    {selectedPayment.providerReference && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Provider Reference
                        </label>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-mono text-gray-900 break-all flex-1">
                            {selectedPayment.providerReference}
                          </p>
                          <Tooltip content="Copy Provider Reference">
                            <button
                              onClick={() =>
                                handleCopyAmount(
                                  `provider-ref-${selectedPayment.id}`,
                                  selectedPayment.providerReference || ""
                                )
                              }
                              className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
                            >
                              {copiedKey ===
                              `provider-ref-${selectedPayment.id}` ? (
                                <FiCheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <FiCopy className="h-4 w-4 text-gray-400" />
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      </div>
                    )}
                    {selectedPayment.providerStatus && (
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                          Provider Status
                        </label>
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            selectedPayment.providerStatus
                              .toLowerCase()
                              .includes("success") ||
                            selectedPayment.providerStatus
                              .toLowerCase()
                              .includes("paid")
                              ? "bg-emerald-100 text-emerald-800"
                              : selectedPayment.providerStatus
                                  .toLowerCase()
                                  .includes("pending")
                              ? "bg-amber-100 text-amber-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {selectedPayment.providerStatus}
                        </span>
                      </div>
                    )}
                    {selectedPayment.providerFee !== undefined &&
                      selectedPayment.providerFee !== null && (
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            Provider Fee
                          </label>
                          <p className="text-base font-bold text-gray-900">
                            {formatCurrencyValue(
                              Number(selectedPayment.providerFee),
                              selectedPayment.currency || primaryCurrency
                            )}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Subscription Details Section */}
                {selectedPayment.intent === "subscription" &&
                  selectedPayment.subscription && (
                    <div className="space-y-6">
                      {/* Main Subscription Details */}
                      <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-purple-100 rounded-xl">
                            <span className="text-2xl">📦</span>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">
                            Subscription Package Details
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-white rounded-xl border border-purple-200 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Package Name
                            </label>
                            <p className="text-base font-bold text-purple-900">
                              {selectedPayment.subscription.package?.name ||
                                "N/A"}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl border border-purple-200 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Duration
                            </label>
                            <p className="text-base font-bold text-purple-900">
                              {selectedPayment.subscription.package?.duration ||
                                0}{" "}
                              months
                            </p>
                          </div>
                          <div className="bg-white rounded-xl border border-purple-200 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Package Price
                            </label>
                            <p className="text-base font-bold text-purple-900">
                              {formatCurrencyValue(
                                selectedPayment.subscription.package?.price || 0,
                                selectedPayment.subscription.package?.currency ||
                                  selectedPayment.currency ||
                                  "USD"
                              )}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl border border-purple-200 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Subscription Status
                            </label>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                selectedPayment.subscription.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : selectedPayment.subscription.status ===
                                    "trialing"
                                  ? "bg-blue-100 text-blue-800"
                                  : selectedPayment.subscription.status ===
                                    "cancelled"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {selectedPayment.subscription.status}
                            </span>
                          </div>
                          <div className="bg-white rounded-xl border border-purple-200 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              Start Date
                            </label>
                            <p className="text-base font-semibold text-purple-900">
                              {new Date(
                                selectedPayment.subscription.startDate
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          <div className="bg-white rounded-xl border border-purple-200 p-4">
                            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                              End Date
                            </label>
                            <p className="text-base font-semibold text-purple-900">
                              {new Date(
                                selectedPayment.subscription.endDate
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                          {selectedPayment.subscription.nextBillingDate && (
                            <div className="bg-white rounded-xl border border-purple-200 p-4">
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Next Billing Date
                              </label>
                              <p className="text-base font-semibold text-purple-900">
                                {new Date(
                                  selectedPayment.subscription.nextBillingDate
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Upgrade Details */}
                      {selectedPayment.reason &&
                        selectedPayment.reason.toLowerCase().includes(
                          "upgrade"
                        ) && (
                          <div className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="p-2 bg-blue-100 rounded-xl">
                                <span className="text-2xl">⬆️</span>
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">
                                Upgrade Information
                              </h3>
                            </div>
                            <div className="bg-white rounded-xl border border-blue-200 p-4 mb-4">
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Upgrade Reason
                              </label>
                              <p className="text-base font-semibold text-blue-900">
                                {selectedPayment.reason}
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl border border-blue-200 p-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Upgrade Amount
                                </label>
                                <p className="text-lg font-bold text-blue-900">
                                  {formatCurrencyValue(
                                    selectedPayment.paidamount,
                                    selectedPayment.currency || "USD"
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Prorated difference charged immediately
                                </p>
                              </div>
                              <div className="bg-white rounded-xl border border-blue-200 p-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Upgrade Date
                                </label>
                                <p className="text-base font-semibold text-blue-900">
                                  {new Date(
                                    selectedPayment.paymentdate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            {selectedPayment.providerReference && (
                              <div className="mt-4 bg-white rounded-xl border border-blue-200 p-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Stripe Subscription ID
                                </label>
                                <p className="text-sm font-mono text-blue-900 break-all">
                                  {selectedPayment.providerReference}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Cancellation Details */}
                      {selectedPayment.subscription.status === "cancelled" && (
                        <div className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-white p-6 shadow-lg">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-xl">
                              <span className="text-2xl">❌</span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">
                              Cancellation Information
                            </h3>
                          </div>
                          <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-red-200 p-4">
                              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Cancellation Status
                              </label>
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                                Cancelled - End of Period
                              </span>
                              <p className="text-xs text-gray-600 mt-2">
                                Subscription will remain active until the end of
                                the current billing period. No refunds will be
                                issued.
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="bg-white rounded-xl border border-red-200 p-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Access Until
                                </label>
                                <p className="text-base font-semibold text-red-900">
                                  {new Date(
                                    selectedPayment.subscription.endDate
                                  ).toLocaleDateString("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Student retains access until this date
                                </p>
                              </div>
                              <div className="bg-white rounded-xl border border-red-200 p-4">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                  Next Billing
                                </label>
                                <p className="text-base font-semibold text-red-900">
                                  {selectedPayment.subscription.nextBillingDate
                                    ? "No further charges"
                                    : "N/A"}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Subscription will not renew
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payment History Link */}
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Note:</span> This
                          payment is linked to subscription ID{" "}
                          <span className="font-mono text-purple-600">
                            {selectedPayment.subscription.id}
                          </span>
                          . All subscription-related payments are automatically
                          recorded in the payment table (wpos_wpdatatable_29)
                          for admin tracking.
                        </p>
                      </div>
                    </div>
                  )}
              </div>

              {/* Footer with Cancel and Close Buttons - Always Visible */}
              <div className="border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white px-8 py-6 flex-shrink-0">
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-700 font-bold transition-all hover:bg-gray-50 hover:border-gray-400 hover:scale-105 shadow-sm"
                  >
                    <FiXCircle className="h-5 w-5" />
                    Cancel
                  </button>
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 text-white font-bold transition-all hover:from-gray-800 hover:to-gray-700 hover:scale-105 shadow-lg"
                  >
                    <FiCheckCircle className="h-5 w-5" />
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
