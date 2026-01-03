"use client";

import { useState, useEffect } from "react";
import {
  FiDollarSign,
  FiTrendingUp,
  FiDownload,
  FiFilter,
  FiCalendar,
  FiMapPin,
  FiPackage,
  FiUser,
  FiRefreshCw,
} from "react-icons/fi";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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

interface TaxSummary {
  totalTax: number;
  totalBaseAmount: number;
  totalAmount: number;
  transactionCount: number;
  avgTaxAmount: number;
  currency: string;
}

interface TaxByJurisdiction {
  jurisdiction: string;
  country: string;
  state: string | null;
  totalTax: number;
  transactionCount: number;
}

interface TaxTransaction {
  id: string;
  invoiceId: string;
  subscriptionId: number;
  studentId: number;
  packageId: number;
  taxAmount: number;
  baseAmount: number;
  totalAmount: number;
  billingCountry: string | null;
  billingState: string | null;
  billingCity: string | null;
  currency: string;
  createdAt: string;
  taxBreakdown: any;
  student: { id: number; name: string } | null;
  package: { id: number; name: string } | null;
}

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function TaxReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState<
    | "summary"
    | "detailed"
    | "by-jurisdiction"
    | "by-subscription"
    | "by-student"
  >("summary");
  const [summary, setSummary] = useState<TaxSummary[]>([]);
  const [byJurisdiction, setByJurisdiction] = useState<TaxByJurisdiction[]>([]);
  const [transactions, setTransactions] = useState<TaxTransaction[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [currency, setCurrency] = useState<string>("");
  const [jurisdiction, setJurisdiction] = useState<string>("");

  const fetchTaxData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("type", reportType);

      if (date?.from) {
        params.append("startDate", date.from.toISOString());
      }
      if (date?.to) {
        params.append("endDate", date.to.toISOString());
      }
      if (currency) {
        params.append("currency", currency);
      }
      if (jurisdiction) {
        params.append("jurisdiction", jurisdiction);
      }
      if (reportType === "detailed") {
        params.append("page", pagination.page.toString());
        params.append("limit", pagination.limit.toString());
      }

      const response = await fetch(
        `/api/admin/tax/reports?${params.toString()}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (
          response.status === 503 &&
          errorData.message?.includes("migration")
        ) {
          throw new Error(
            "Tax table not found. Please run the database migration first."
          );
        }
        throw new Error(errorData.message || "Failed to fetch tax data");
      }

      const data = await response.json();
      console.log("📊 Tax data response:", data);
      console.log("📊 Summary count:", data.summary?.length || 0);
      console.log("📊 Jurisdiction count:", data.byJurisdiction?.length || 0);

      if (reportType === "summary") {
        console.log("✅ Setting summary data:", data.summary);
        console.log("✅ Setting jurisdiction data:", data.byJurisdiction);
        setSummary(data.summary || []);
        setByJurisdiction(data.byJurisdiction || []);

        // Log totals for verification
        if (data.summary && data.summary.length > 0) {
          const total = data.summary.reduce(
            (sum: number, s: any) => sum + (s.totalTax || 0),
            0
          );
          console.log("💰 Total tax across all currencies:", total);
        }
        if (data.byJurisdiction && data.byJurisdiction.length > 0) {
          console.log(
            "🌍 Jurisdictions found:",
            data.byJurisdiction.map((j: any) => j.jurisdiction)
          );
        }
      } else if (reportType === "detailed") {
        console.log("Setting detailed transactions:", data.transactions);
        setTransactions(data.transactions || []);
        setPagination(data.pagination || pagination);
      } else if (reportType === "by-jurisdiction") {
        console.log("Setting jurisdiction data:", data.jurisdictions);
        setByJurisdiction(data.jurisdictions || []);
      } else if (reportType === "by-subscription") {
        const mapped =
          data.subscriptions?.map((s: any) => ({
            ...s,
            taxAmount: s.totalTax,
            baseAmount: 0,
            totalAmount: s.totalTax,
          })) || [];
        console.log("Setting subscription data:", mapped);
        setTransactions(mapped);
      } else if (reportType === "by-student") {
        const mapped =
          data.students?.map((s: any) => ({
            ...s,
            taxAmount: s.totalTax,
            baseAmount: 0,
            totalAmount: s.totalTax,
          })) || [];
        console.log("Setting student data:", mapped);
        setTransactions(mapped);
      }
    } catch (error: any) {
      console.error("Error fetching tax data:", error);
      alert("Failed to load tax data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxData();
  }, [reportType, date, currency, jurisdiction, pagination.page]);

  const handleExport = async (exportFormat: "csv" | "json") => {
    try {
      const params = new URLSearchParams();
      params.append("type", "export");
      params.append("format", exportFormat);

      if (date?.from) {
        params.append("startDate", date.from.toISOString());
      }
      if (date?.to) {
        params.append("endDate", date.to.toISOString());
      }
      if (currency) {
        params.append("currency", currency);
      }
      if (jurisdiction) {
        params.append("jurisdiction", jurisdiction);
      }

      const response = await fetch(
        `/api/admin/tax/reports?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to export tax data");
      }

      if (exportFormat === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tax-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tax-report-${format(new Date(), "yyyy-MM-dd")}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error("Error exporting tax data:", error);
      alert("Failed to export tax data: " + error.message);
    }
  };

  const totalTax = summary.reduce((sum, s) => sum + s.totalTax, 0);
  const totalTransactions = summary.reduce(
    (sum, s) => sum + s.transactionCount,
    0
  );
  const avgTax = summary.length > 0 ? totalTax / summary.length : 0;

  // Debug logging
  useEffect(() => {
    console.log("Tax Reports State:", {
      reportType,
      summaryCount: summary.length,
      summary,
      byJurisdictionCount: byJurisdiction.length,
      byJurisdiction,
      transactionsCount: transactions.length,
      loading,
      totalTax,
      totalTransactions,
    });
  }, [
    reportType,
    summary,
    byJurisdiction,
    transactions,
    loading,
    totalTax,
    totalTransactions,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tax Reports</h1>
          <p className="text-gray-600 mt-1">
            View and analyze tax data absorbed by the business
          </p>
        </div>
        <div className="flex gap-2">
          {/* Always show test buttons in development - check client-side */}
          {typeof window !== "undefined" &&
            window.location.hostname === "localhost" && (
              <>
                <Button
                  onClick={async () => {
                    try {
                      setLoading(true);
                      console.log("Creating test tax data...");
                      const response = await fetch("/api/admin/tax/test-data", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ count: 5 }),
                      });
                      const data = await response.json();
                      console.log("Response:", data);
                      if (response.ok) {
                        alert(
                          `✅ Created ${
                            data.transactions?.length || 0
                          } test tax transactions!\n\nStudent: ${
                            data.subscription?.student || "N/A"
                          }\nPackage: ${data.subscription?.package || "N/A"}`
                        );
                        await fetchTaxData();
                      } else {
                        alert(
                          `❌ Error: ${
                            data.error || data.message || "Unknown error"
                          }\n\nDetails: ${data.details || ""}`
                        );
                      }
                    } catch (error: any) {
                      console.error("Error creating test data:", error);
                      alert(
                        `❌ Error creating test data: ${error.message}\n\nCheck console for details.`
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-300"
                  disabled={loading}
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Create Test Data
                </Button>
                <Button
                  onClick={async () => {
                    if (
                      confirm(
                        "⚠️ Delete all test tax transactions?\n\nThis will remove all test data from the database."
                      )
                    ) {
                      try {
                        setLoading(true);
                        console.log("Deleting test tax data...");
                        const response = await fetch(
                          "/api/admin/tax/test-data",
                          {
                            method: "DELETE",
                          }
                        );
                        const data = await response.json();
                        console.log("Response:", data);
                        if (response.ok) {
                          alert("✅ Test data deleted successfully!");
                          await fetchTaxData();
                        } else {
                          alert(
                            `❌ Error: ${
                              data.error || data.message || "Unknown error"
                            }`
                          );
                        }
                      } catch (error: any) {
                        console.error("Error deleting test data:", error);
                        alert(
                          `❌ Error deleting test data: ${error.message}\n\nCheck console for details.`
                        );
                      } finally {
                        setLoading(false);
                      }
                    }
                  }}
                  variant="outline"
                  className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border-red-300"
                  disabled={loading}
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Clear Test Data
                </Button>
              </>
            )}
          <Button
            onClick={() => handleExport("csv")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Export CSV
          </Button>
          <Button
            onClick={() => handleExport("json")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FiDownload className="h-4 w-4" />
            Export JSON
          </Button>
          <Button
            onClick={fetchTaxData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FiRefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as any);
              setPagination({ ...pagination, page: 1 });
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="summary">Summary</option>
            <option value="detailed">Detailed Transactions</option>
            <option value="by-jurisdiction">By Jurisdiction</option>
            <option value="by-subscription">By Subscription</option>
            <option value="by-student">By Student</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[280px] justify-start text-left font-normal"
              >
                <FiCalendar className="mr-2 h-4 w-4" />
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
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="min-w-[120px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Currency
          </label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
          </select>
        </div>

        <Button onClick={fetchTaxData} className="flex items-center gap-2">
          <FiFilter className="h-4 w-4" />
          Apply Filters
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <FiRefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {reportType === "summary" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Tax Absorbed
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ${totalTax.toFixed(2)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                      <FiDollarSign className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Transactions
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {totalTransactions}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiTrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Average Tax
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        ${avgTax.toFixed(2)}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FiTrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Jurisdictions
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {byJurisdiction.length}
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <FiMapPin className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tax by Jurisdiction Bar Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tax by Jurisdiction
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={byJurisdiction.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="jurisdiction"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis />
                      <RechartsTooltip
                        formatter={(value: any) =>
                          `$${Number(value).toFixed(2)}`
                        }
                      />
                      <Legend />
                      <Bar
                        dataKey="totalTax"
                        fill="#6366f1"
                        name="Tax Amount"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tax by Currency Pie Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tax by Currency
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={summary as any}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ currency, totalTax }: any) =>
                          `${currency}: $${totalTax.toFixed(2)}`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="totalTax"
                      >
                        {summary.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: any) =>
                          `$${Number(value).toFixed(2)}`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Jurisdiction Table */}
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Tax by Jurisdiction
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Jurisdiction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Country
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          State
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Tax
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {byJurisdiction.map((jur, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {jur.jurisdiction}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {jur.country}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {jur.state || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                            ${jur.totalTax.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {jur.transactionCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Detailed Transactions Table */}
          {reportType === "detailed" && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detailed Tax Transactions
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Package
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Base Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tax Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {tx.invoiceId.substring(0, 20)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {tx.student?.name || `Student #${tx.studentId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.package?.name || `Package #${tx.packageId}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${tx.baseAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          ${tx.taxAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${tx.totalAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {tx.billingCity && tx.billingState
                            ? `${tx.billingCity}, ${tx.billingState}`
                            : tx.billingCountry || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(tx.createdAt), "MMM dd, yyyy")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing page {pagination.page} of {pagination.totalPages} (
                    {pagination.total} total transactions)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page - 1,
                        })
                      }
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setPagination({
                          ...pagination,
                          page: pagination.page + 1,
                        })
                      }
                      disabled={pagination.page >= pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Other Report Types */}
          {(reportType === "by-subscription" ||
            reportType === "by-student" ||
            reportType === "by-jurisdiction") && (
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {reportType === "by-subscription"
                    ? "Tax by Subscription"
                    : reportType === "by-student"
                    ? "Tax by Student"
                    : "Tax by Jurisdiction"}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {reportType === "by-subscription" && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subscription ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Package
                          </th>
                        </>
                      )}
                      {reportType === "by-student" && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student Name
                          </th>
                        </>
                      )}
                      {reportType === "by-jurisdiction" && (
                        <>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Jurisdiction
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Country
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            State
                          </th>
                        </>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Tax
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transactions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((item, index) => (
                      <tr key={index}>
                        {reportType === "by-subscription" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{item.subscriptionId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.student?.name ||
                                `Student #${item.studentId}`}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.package?.name ||
                                `Package #${item.packageId}`}
                            </td>
                          </>
                        )}
                        {reportType === "by-student" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              #{item.studentId}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.student?.name || "Unknown"}
                            </td>
                          </>
                        )}
                        {reportType === "by-jurisdiction" && (
                          <>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.billingState
                                ? `${item.billingCountry}-${item.billingState}`
                                : item.billingCountry || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.billingCountry || "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.billingState || "-"}
                            </td>
                          </>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          ${item.taxAmount.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {pagination.total || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
