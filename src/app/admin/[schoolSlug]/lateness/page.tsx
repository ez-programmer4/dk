"use client";

import React, { useState, useEffect } from "react";
import { useBranding } from "../layout";
import { DateRange } from "react-day-picker";
import { subDays, format } from "date-fns";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { DatePickerWithRange } from "../attendance/components/DateRangePicker";
import Modal from "@/app/components/Modal";
import {
  FiBarChart2,
  FiRefreshCw,
  FiDownload,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiUsers,
  FiClock,
  FiAlertCircle,
  FiX,
  FiSearch,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiSettings,
  FiInfo,
  FiEye,
  FiActivity,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import LatenessDeductionConfigManager from "./LatenessDeductionConfigManager";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";

// Helper function to format dates in UTC (not local timezone)
const formatLocalDateTime = (value: unknown) => {
  if (!value) return "-";
  try {
    let d: Date;
    if (value instanceof Date) {
      d = value;
    } else if (typeof value === "string") {
      // Parse as UTC to avoid timezone conversion
      d = new Date(value);
    } else {
      d = new Date(value as any);
    }
    if (isNaN(d.getTime())) return "-";

    // Extract UTC components directly (not local timezone)
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mi = String(d.getUTCMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return "-";
  }
};

function getInitials(name: string | null | undefined) {
  if (!name) return "N/A";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function AdminLatenessAnalyticsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();


  // Use branding colors with fallbacks
  const primaryColor = branding?.primaryColor || "#4F46E5";
  const secondaryColor = branding?.secondaryColor || "#7C3AED";
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      from: startOfMonth,
      to: today,
    };
  });
  const [controllerId, setControllerId] = useState("");
  const [controllers, setControllers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTeacher, setExpandedTeacher] = useState<string | null>(null);
  const [teacherDaily, setTeacherDaily] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [dailyDate, setDailyDate] = useState(new Date());
  const [dailyControllerId, setDailyControllerId] = useState("");
  const [dailyTeacherId, setDailyTeacherId] = useState("");
  const [dailyRecords, setDailyRecords] = useState<any[]>([]);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<string>("Total Deduction");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [teacherModalLoading, setTeacherModalLoading] = useState(false);
  const [showDeductionDetail, setShowDeductionDetail] = useState(false);
  const [deductionDetailLoading, setDeductionDetailLoading] = useState(false);
  const [deductionDetail, setDeductionDetail] = useState<any[]>([]);
  const [deductionDetailTotal, setDeductionDetailTotal] = useState(0);
  const [expandedTeacherId, setExpandedTeacherId] = useState<string | null>(
    null
  );

  // Breakdown modal states
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [breakdownData, setBreakdownData] = useState<any>(null);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownType, setBreakdownType] = useState<
    "controller" | "teacher" | null
  >(null);
  const [breakdownName, setBreakdownName] = useState("");
  const [breakdownId, setBreakdownId] = useState("");
  const [breakdownTab, setBreakdownTab] = useState<
    "overview" | "teachers" | "students" | "daily" | "records"
  >("overview");

  // Pagination states
  const [controllerPage, setControllerPage] = useState(1);
  const [teacherPage, setTeacherPage] = useState(1);
  const [dailyPage, setDailyPage] = useState(1);
  const [controllerPageSize, setControllerPageSize] = useState(10);
  const [teacherPageSize, setTeacherPageSize] = useState(10);
  const [dailyPageSize, setDailyPageSize] = useState(10);
  const [dailyTotal, setDailyTotal] = useState(0);

  // Search states
  const [controllerSearch, setControllerSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");

  // Base deduction amount state
  const [baseDeductionAmount, setBaseDeductionAmount] = useState(30);
  const [savingBaseDeduction, setSavingBaseDeduction] = useState(false);

  // Fetch controllers and base deduction amount
  useEffect(() => {
    const fetchControllers = async () => {
      // Don't fetch if user is not authenticated
      if (status !== "authenticated" || !session?.user) {
        return;
      }

      try {
        const res = await fetch("/api/control-options", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch controllers");
        const data = await res.json();
        setControllers(data.controllers || []);
      } catch (err) {
        setControllers([]);
      }
    };

    const fetchBaseDeduction = async () => {
      try {
        const res = await fetch(
          `/api/admin/${schoolSlug}/lateness-deduction-config/base`
        );
        if (res.ok) {
          const data = await res.json();
          setBaseDeductionAmount(data.baseDeductionAmount || 30);
        }
      } catch (err) {
        setBaseDeductionAmount(30);
      }
    };

    fetchControllers();
    fetchBaseDeduction();
  }, [status, session, schoolSlug]);

  // Fetch analytics
  useEffect(() => {
    if (!date?.from || !date?.to) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      from: format(date.from, "yyyy-MM-dd"),
      to: format(date.to, "yyyy-MM-dd"),
    });
    if (controllerId) params.append("controllerId", controllerId);
    fetch(`/api/admin/${schoolSlug}/lateness/analytics?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch lateness analytics");
        return res.json();
      })
      .then((data) => setAnalytics(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [date, controllerId]);

  // Reset pagination when filters change
  useEffect(() => {
    setControllerPage(1);
    setTeacherPage(1);
    setDailyPage(1);
  }, [
    date,
    controllerId,
    controllerSearch,
    teacherSearch,
    dailyDate,
    dailyControllerId,
    dailyTeacherId,
  ]);

  // Fetch daily lateness records
  useEffect(() => {
    async function fetchDaily() {
      setDailyLoading(true);
      setDailyError(null);
      try {
        const params = new URLSearchParams({
          date: format(dailyDate, "yyyy-MM-dd"),
          page: dailyPage.toString(),
          limit: dailyPageSize.toString(),
        });
        if (dailyControllerId) params.append("controllerId", dailyControllerId);
        if (dailyTeacherId) params.append("teacherId", dailyTeacherId);
        const res = await fetch(
          `/api/admin/${schoolSlug}/lateness?${params.toString()}`
        );
        if (!res.ok) throw new Error("Failed to fetch daily lateness records");
        const data = await res.json();
        setDailyRecords(data.latenessData || []);
        setDailyTotal(data.total || 0);
      } catch (e: any) {
        setDailyError(e.message);
      } finally {
        setDailyLoading(false);
      }
    }
    fetchDaily();
  }, [dailyDate, dailyControllerId, dailyTeacherId, dailyPage, dailyPageSize]);

  // Sorting logic
  function sortData<T>(data: T[], key: string, dir: "asc" | "desc") {
    return [...data].sort((a: any, b: any) => {
      if (dir === "asc") return Number(a[key]) - Number(b[key]);
      return Number(b[key]) - Number(a[key]);
    });
  }

  // Filter data by search term
  const filterData = <T extends { name: string }>(
    data: T[],
    search: string
  ) => {
    if (!search) return data;
    return data.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  };

  // Export CSV utility with toast
  function exportToCSV(data: any[], filename: string) {
    if (!data || data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export.",
        variant: "destructive",
      });
      return;
    }
    const headers = Object.keys(data[0]);
    const rows = data.map((row) => headers.map((h) => row[h]));
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: `Exported ${filename} successfully.`,
    });
  }

  // Summary stats
  const totalEvents =
    analytics?.dailyTrend.reduce(
      (sum: number, d: any) => sum + (Number(d.Total) || 0),
      0
    ) || 0;
  const totalDeduction =
    analytics?.dailyTrend.reduce(
      (sum: number, d: any) => sum + (Number(d["Total Deduction"]) || 0),
      0
    ) || 0;
  const avgLateness = (() => {
    const arr = Array.isArray(analytics?.dailyTrend)
      ? analytics.dailyTrend
      : [];
    if (arr.length === 0) return "0.00";
    const total = arr.reduce(
      (sum: number, d: any) => sum + (Number(d["Average Lateness"]) || 0),
      0
    );
    const avg = total / arr.length;
    return Number.isFinite(avg) ? avg.toFixed(2) : "0.00";
  })();

  // Open teacher modal and fetch breakdown
  const openTeacherModal = async (teacherName: string, teacherId: string) => {
    setExpandedTeacher(teacherName);
    setExpandedTeacherId(teacherId);
    setShowModal(true);
    setTeacherModalLoading(true);
    setTeacherDaily([]);
    try {
      const params = new URLSearchParams({
        from: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        to: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        teacherId: teacherId,
      });
      const res = await fetch(
        `/api/admin/lateness/analytics?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch lateness analytics");
      const data = await res.json();
      if (data && data.dailyTrend) {
        const daily = data.dailyTrend.map((d: any) => ({
          ...d,
          teacher: teacherName,
        }));
        setTeacherDaily(daily);
      }
    } catch (err) {
      setTeacherDaily([]);
    } finally {
      setTeacherModalLoading(false);
    }
  };

  // Fetch detailed deduction for teacher and date range
  const fetchDeductionDetail = async (teacherId: string) => {
    setDeductionDetailLoading(true);
    setDeductionDetail([]);
    setDeductionDetailTotal(0);
    try {
      const params = new URLSearchParams({
        from: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        to: date?.to ? format(date.to, "yyyy-MM-dd") : "",
        teacherId: teacherId,
      });
      const res = await fetch(
        `/api/admin/teacher-payments?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch deduction detail");
      const data = await res.json();
      const records = data?.latenessRecords || [];
      if (Array.isArray(records)) {
        setDeductionDetail(records);
        setDeductionDetailTotal(
          records.reduce(
            (sum: number, r: any) => sum + (Number(r.deductionApplied) || 0),
            0
          )
        );
      }
    } catch (err) {
      setDeductionDetail([]);
      setDeductionDetailTotal(0);
    } finally {
      setDeductionDetailLoading(false);
    }
  };

  // Save base deduction amount
  const saveBaseDeduction = async () => {
    setSavingBaseDeduction(true);
    try {
      const res = await fetch(
        `/api/admin/${schoolSlug}/lateness-deduction-config/base`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseDeductionAmount,
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to save base deduction amount");
      toast({
        title: "Success",
        description: "Base deduction amount saved successfully.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to save base deduction amount.",
        variant: "destructive",
      });
    } finally {
      setSavingBaseDeduction(false);
    }
  };

  // Fetch detailed breakdown for controller or teacher
  const fetchBreakdown = async (
    type: "controller" | "teacher",
    id: string,
    name: string
  ) => {
    setBreakdownLoading(true);
    setBreakdownType(type);
    setBreakdownName(name);
    setBreakdownId(id);
    setShowBreakdownModal(true);
    setBreakdownData(null);
    setBreakdownTab("overview"); // Reset to overview tab

    try {
      const params = new URLSearchParams({
        from: date?.from ? format(date.from, "yyyy-MM-dd") : "",
        to: date?.to ? format(date.to, "yyyy-MM-dd") : "",
      });
      if (type === "controller") {
        params.append("controllerId", id);
      } else {
        params.append("teacherId", id);
      }

      const res = await fetch(
        `/api/admin/lateness/breakdown?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch breakdown");
      const data = await res.json();
      setBreakdownData(data);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to fetch breakdown data.",
        variant: "destructive",
      });
      setBreakdownData(null);
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Export deduction detail to CSV
  function exportDeductionDetailToCSV() {
    if (!deductionDetail || deductionDetail.length === 0) {
      toast({
        title: "No Data",
        description: "No detailed deduction data available to export.",
        variant: "destructive",
      });
      return;
    }
    const headers = [
      "Date",
      "Student",
      "Scheduled",
      "Actual Start",
      "Minutes Late",
      "Deduction",
      "Tier",
    ];
    const rows = deductionDetail.map((r) => [
      formatLocalDateTime(r.scheduledTime),
      r.studentName,
      formatLocalDateTime(r.scheduledTime),
      formatLocalDateTime(r.actualStartTime),
      r.latenessMinutes,
      r.deductionApplied,
      r.deductionTier,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "detailed_deduction.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: "Exported detailed_deduction.csv successfully.",
    });
  }

  // Skeleton Loader Component
  const SkeletonLoader = ({ rows = 5 }: { rows?: number }) => (
    <div className="animate-pulse space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-100 rounded-lg" />
      ))}
    </div>
  );

  // Filtered data
  const filteredControllerData = filterData(
    analytics?.controllerData || [],
    controllerSearch
  );
  const filteredTeacherData = filterData(
    analytics?.teacherData || [],
    teacherSearch
  );

  // UI
  return (
    <div
      className="min-h-screen"
      style={{
        background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}05 50%, #ffffff 100%)`,
      }}
    >
      {/* Header */}
      <div
        className="backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40"
        style={{
          background: `linear-gradient(135deg, #ffffff95 0%, ${primaryColor}02 100%)`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/admin/${schoolSlug}`)}
                className="mr-4 p-2 rounded-lg transition-all hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}10)`,
                }}
              >
                <FiChevronLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div>
                <h1
                  className="text-2xl font-bold bg-clip-text text-transparent "
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  Lateness Analytics
                </h1>
                <p className="text-sm text-gray-600">
                  Track and analyze teacher lateness patterns
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header + Stats */}
          <div
            className="rounded-2xl shadow-lg border border-gray-100/50 p-8 lg:p-10 backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
            }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-8">
              <div className="flex items-center gap-6">
                <div
                  className="p-4 rounded-2xl shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  <FiBarChart2 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1
                    className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent mb-2"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    Lateness Analytics
                  </h1>
                  <p className="text-gray-600 text-lg lg:text-xl font-medium">
                    Track and analyze teacher lateness patterns and deductions
                  </p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div
              className="rounded-2xl p-6 border border-gray-100/50 sticky top-4 z-10 backdrop-blur-sm"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}03 100%)`,
              }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
                <div className="lg:col-span-4">
                  <label className="block text-sm font-bold text-black mb-3">
                    <FiClock className="inline h-4 w-4 mr-2" />
                    Date Range
                  </label>
                  <DatePickerWithRange date={date} setDate={setDate} />
                </div>
                <div className="lg:col-span-4">
                  <label className="block text-sm font-bold text-black mb-3">
                    <FiUsers className="inline h-4 w-4 mr-2" />
                    Filter by Controller
                  </label>
                  <select
                    value={controllerId}
                    onChange={(e) => setControllerId(e.target.value)}
                    className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent bg-white text-gray-900 shadow-sm transition-all duration-200 text-base"
                    style={{
                      boxShadow: `0 0 0 2px ${primaryColor}40`,
                    }}
                  >
                    <option value="">All Controllers</option>
                    {controllers.map((c) => (
                      <option key={c.wdt_ID} value={c.wdt_ID}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="lg:col-span-4">
                  <div className="flex gap-3">
                    <button
                      onClick={() => window.location.reload()}
                      className="flex-1 px-4 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl text-white"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}90, ${secondaryColor}90)`,
                      }}
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      Refresh
                    </button>
                    <button
                      onClick={() =>
                        exportToCSV(
                          analytics?.dailyTrend || [],
                          "lateness_analytics.csv"
                        )
                      }
                      className="flex-1 text-white px-4 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                      }}
                    >
                      <FiDownload className="h-4 w-4" />
                      Export
                    </button>
                    <button
                      onClick={() =>
                        exportToCSV(
                          analytics?.dailyTrend || [],
                          "lateness_analytics.csv"
                        )
                      }
                      className="flex-1 bg-black hover:bg-gray-800 text-white px-4 py-4 rounded-xl font-bold transition-all hover:scale-105 flex items-center justify-center gap-2"
                    >
                      <FiDownload className="h-4 w-4" />
                      Export
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Lateness Configuration */}

          {/* Advanced Tier Configuration */}

          <LatenessDeductionConfigManager schoolSlug={schoolSlug} />

          {/* Main Analytics */}
          {loading ? (
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto mb-6"></div>
              <p className="text-black font-medium text-lg">
                Loading analytics...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please wait while we fetch the data
              </p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-12 text-center">
              <div className="p-8 bg-red-50 rounded-full w-fit mx-auto mb-8">
                <FiAlertCircle className="h-16 w-16 text-red-500" />
              </div>
              <h3 className="text-3xl font-bold text-black mb-4">
                Error Loading Analytics
              </h3>
              <p className="text-red-600 text-xl">{error}</p>
            </div>
          ) : analytics ? (
            <div className="space-y-8">
              {analytics.dailyTrend && analytics.dailyTrend.length > 0 && (
                <div
                  className="rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden backdrop-blur-sm"
                  style={{
                    background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
                  }}
                >
                  <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-100">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-xl shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      >
                        <FiBarChart2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Lateness & Deduction Trend
                        </h2>
                        <p className="text-gray-600">
                          Daily analytics overview
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="w-full h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={analytics.dailyTrend}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e5e7eb"
                          />
                          <XAxis dataKey="date" stroke="#4b5563" />
                          <YAxis
                            yAxisId="left"
                            label={{
                              value: "Lateness (min)",
                              angle: -90,
                              position: "insideLeft",
                              fill: "#4b5563",
                            }}
                            stroke="#4b5563"
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            label={{
                              value: "Deduction (ETB)",
                              angle: 90,
                              position: "insideRight",
                              fill: "#4b5563",
                            }}
                            stroke="#4b5563"
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#ffffff",
                              borderColor: "#e5e7eb",
                            }}
                            labelStyle={{ color: "#4b5563" }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="Average Lateness"
                            stroke="#000000"
                            name="Avg. Lateness (min)"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="Total Deduction"
                            stroke="#6b7280"
                            name="Total Deduction (ETB)"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
              {/* Per Controller Table */}
              <div
                className="rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden backdrop-blur-sm"
                style={{
                  background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
                }}
              >
                <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="p-3 rounded-xl shadow-lg"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      >
                        <FiUsers className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Per Controller
                        </h2>
                        <p className="text-gray-600">
                          Lateness analytics by controller
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:flex-none">
                        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search controllers..."
                          value={controllerSearch}
                          onChange={(e) => setControllerSearch(e.target.value)}
                          className="pl-10 w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-sm"
                        />
                      </div>
                      <select
                        value={controllerPageSize}
                        onChange={(e) =>
                          setControllerPageSize(Number(e.target.value))
                        }
                        className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                      >
                        {[5, 10, 20, 50].map((size) => (
                          <option key={size} value={size}>
                            {size} per page
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-100/50 backdrop-blur-md">
                  <table className="min-w-full text-sm divide-y divide-gray-100">
                    <thead
                      className="sticky top-0 z-10"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}05 100%)`,
                      }}
                    >
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-gray-900 uppercase tracking-wider">
                          Controller
                        </th>
                        <th
                          className="px-4 py-3 text-left font-bold text-gray-900 uppercase tracking-wider cursor-pointer"
                          onClick={() => {
                            setSortKey("Average Lateness");
                            setSortDir(sortDir === "asc" ? "desc" : "asc");
                          }}
                        >
                          Avg. Lateness (min){" "}
                          {sortKey === "Average Lateness" &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="px-4 py-3 text-left font-bold text-gray-900 uppercase tracking-wider cursor-pointer"
                          onClick={() => {
                            setSortKey("Total Deduction");
                            setSortDir(sortDir === "asc" ? "desc" : "asc");
                          }}
                        >
                          Total Deduction (ETB){" "}
                          {sortKey === "Total Deduction" &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                          Total Events
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-8">
                            <SkeletonLoader rows={controllerPageSize} />
                          </td>
                        </tr>
                      ) : filteredControllerData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-indigo-500 py-8"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-4xl">😕</span>
                              <span className="text-sm font-semibold">
                                No controllers found.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortData(filteredControllerData, sortKey, sortDir)
                          .slice(
                            (controllerPage - 1) * controllerPageSize,
                            controllerPage * controllerPageSize
                          )
                          .map((c: any, i: number) => (
                            <tr
                              key={c.name}
                              className={`hover:bg-indigo-50 transition-all ${
                                i % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="px-4 py-3 flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 font-bold">
                                  {getInitials(c.name)}
                                </span>
                                <span className="text-indigo-900 font-semibold">
                                  {c.name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-indigo-700 font-medium">
                                {c["Average Lateness"]} min
                              </td>
                              <td className="px-4 py-3 text-indigo-700 font-medium">
                                {c["Total Deduction"]} ETB
                              </td>
                              <td className="px-4 py-3 text-indigo-700 font-medium">
                                {c["Total Events"]}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    if (c.id) {
                                      fetchBreakdown(
                                        "controller",
                                        String(c.id),
                                        c.name
                                      );
                                    } else {
                                      toast({
                                        title: "Error",
                                        description: "Controller ID not found.",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
                                  title="Deep Review - View detailed breakdown"
                                >
                                  <FiEye className="w-4 h-4 mr-1" />
                                  Deep Review
                                </Button>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                  <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setControllerPage(1)}
                        disabled={controllerPage === 1}
                        className="border-indigo-200 text-indigo-800"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setControllerPage(Math.max(1, controllerPage - 1))
                        }
                        disabled={controllerPage === 1}
                        className="border-indigo-200 text-indigo-800"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-indigo-700">
                        Page {controllerPage} of{" "}
                        {Math.ceil(
                          filteredControllerData.length / controllerPageSize
                        )}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setControllerPage(controllerPage + 1)}
                        disabled={
                          controllerPage >=
                          Math.ceil(
                            filteredControllerData.length / controllerPageSize
                          )
                        }
                        className="border-indigo-200 text-indigo-800"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setControllerPage(
                            Math.ceil(
                              filteredControllerData.length / controllerPageSize
                            )
                          )
                        }
                        disabled={
                          controllerPage >=
                          Math.ceil(
                            filteredControllerData.length / controllerPageSize
                          )
                        }
                        className="border-indigo-200 text-indigo-800"
                      >
                        Last
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportToCSV(
                          filteredControllerData,
                          "lateness_per_controller.csv"
                        )
                      }
                      className="border-indigo-200 text-indigo-800"
                    >
                      <FiDownload className="mr-2 w-4 h-4" /> Export All
                    </Button>
                  </div>
                </div>
              </div>
              {/* Per Teacher Table */}
              <div className="mb-10">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-3">
                  <h2
                    className="text-lg font-semibold bg-clip-text text-transparent flex items-center gap-2"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <FiUser className="w-5 h-5" /> Per Teacher
                  </h2>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-none">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        type="text"
                        placeholder="Search teachers..."
                        value={teacherSearch}
                        onChange={(e) => setTeacherSearch(e.target.value)}
                        className="pl-10 w-full sm:w-64 border-indigo-200 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                    <select
                      value={teacherPageSize}
                      onChange={(e) =>
                        setTeacherPageSize(Number(e.target.value))
                      }
                      className="px-4 py-2 border-2 border-indigo-200 rounded-lg bg-white/95 text-indigo-900 focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      {[5, 10, 20, 50].map((size) => (
                        <option key={size} value={size}>
                          {size} per page
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-2xl shadow-lg border border-gray-100/50 backdrop-blur-md">
                  <table className="min-w-full text-sm divide-y divide-gray-100">
                    <thead
                      className="sticky top-0 z-10"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}05 100%)`,
                      }}
                    >
                      <tr>
                        <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                          Teacher
                        </th>
                        <th
                          className="px-4 py-3 text-left font-bold text-gray-900 uppercase tracking-wider cursor-pointer"
                          onClick={() => {
                            setSortKey("Average Lateness");
                            setSortDir(sortDir === "asc" ? "desc" : "asc");
                          }}
                        >
                          Avg. Lateness (min){" "}
                          {sortKey === "Average Lateness" &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                        <th
                          className="px-4 py-3 text-left font-bold text-gray-900 uppercase tracking-wider cursor-pointer"
                          onClick={() => {
                            setSortKey("Total Deduction");
                            setSortDir(sortDir === "asc" ? "desc" : "asc");
                          }}
                        >
                          Total Deduction (ETB){" "}
                          {sortKey === "Total Deduction" &&
                            (sortDir === "asc" ? "↑" : "↓")}
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                          Total Events
                        </th>
                        <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-100">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="py-8">
                            <SkeletonLoader rows={teacherPageSize} />
                          </td>
                        </tr>
                      ) : filteredTeacherData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-center text-indigo-500 py-8"
                          >
                            <div className="flex flex-col items-center gap-3">
                              <span className="text-4xl">😕</span>
                              <span className="text-sm font-semibold">
                                No teachers found.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortData(filteredTeacherData, sortKey, sortDir)
                          .slice(
                            (teacherPage - 1) * teacherPageSize,
                            teacherPage * teacherPageSize
                          )
                          .map((t: any, i: number) => (
                            <React.Fragment key={t.name}>
                              <tr
                                className={`hover:bg-indigo-50 transition-all ${
                                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                }`}
                              >
                                <td className="px-4 py-3 flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                                    {getInitials(t.name)}
                                  </span>
                                  <span className="text-indigo-900 font-semibold">
                                    {t.name}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-indigo-700 font-medium">
                                  {t["Average Lateness"]} min
                                </td>
                                <td className="px-4 py-3 text-indigo-700 font-medium">
                                  {t["Total Deduction"]} ETB
                                </td>
                                <td className="px-4 py-3 text-indigo-700 font-medium">
                                  {t["Total Events"]}
                                </td>
                                <td className="px-4 py-3 flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      openTeacherModal(t.name, t.id)
                                    }
                                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
                                    title="View daily breakdown"
                                  >
                                    <FiBarChart2 className="w-4 h-4 mr-1" />
                                    View
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      fetchBreakdown("teacher", t.id, t.name)
                                    }
                                    className="border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
                                    title="Deep Review - View detailed breakdown"
                                  >
                                    <FiEye className="w-4 h-4 mr-1" />
                                    Deep Review
                                  </Button>
                                </td>
                              </tr>
                              {/* Modal for teacher breakdown */}
                              {expandedTeacher === t.name && showModal && (
                                <Modal
                                  isOpen={showModal}
                                  onClose={() => {
                                    setShowModal(false);
                                    setExpandedTeacher(null);
                                    setExpandedTeacherId(null);
                                  }}
                                >
                                  <div className="w-full max-w-[90vw] sm:max-w-md md:max-w-lg lg:max-w-xl mx-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="absolute top-4 right-4 text-indigo-500 hover:text-indigo-700"
                                      onClick={() => {
                                        setShowModal(false);
                                        setExpandedTeacher(null);
                                        setExpandedTeacherId(null);
                                      }}
                                      aria-label="Close modal"
                                    >
                                      <FiX className="w-6 h-6" />
                                    </Button>
                                    <div className="font-extrabold text-lg sm:text-xl md:text-2xl text-indigo-900 mb-4 sm:mb-6 flex items-center gap-2">
                                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xl">
                                        {getInitials(t.name)}
                                      </span>
                                      Daily Breakdown for {t.name}
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto pr-2">
                                      {teacherModalLoading ? (
                                        <div className="h-48 flex items-center justify-center text-indigo-600">
                                          <FiAlertCircle className="w-8 h-8 animate-pulse mr-2" />
                                          <span className="text-lg font-semibold">
                                            Loading breakdown...
                                          </span>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="mb-4 h-48 flex items-center justify-center bg-indigo-50 rounded-lg">
                                            <ResponsiveContainer
                                              width="100%"
                                              height="100%"
                                            >
                                              <BarChart
                                                data={teacherDaily}
                                                margin={{
                                                  top: 10,
                                                  right: 30,
                                                  left: 0,
                                                  bottom: 0,
                                                }}
                                              >
                                                <CartesianGrid
                                                  strokeDasharray="3 3"
                                                  stroke="#e0e7ff"
                                                />
                                                <XAxis
                                                  dataKey="date"
                                                  stroke="#4b5563"
                                                />
                                                <YAxis
                                                  yAxisId="left"
                                                  label={{
                                                    value: "Lateness (min)",
                                                    angle: -90,
                                                    position: "insideLeft",
                                                    fill: "#4b5563",
                                                  }}
                                                  stroke="#4b5563"
                                                />
                                                <YAxis
                                                  yAxisId="right"
                                                  orientation="right"
                                                  label={{
                                                    value: "Deduction (ETB)",
                                                    angle: 90,
                                                    position: "insideRight",
                                                    fill: "#4b5563",
                                                  }}
                                                  stroke="#4b5563"
                                                />
                                                <Tooltip
                                                  contentStyle={{
                                                    backgroundColor: "#ffffff",
                                                    borderColor: "#e0e7ff",
                                                  }}
                                                  labelStyle={{
                                                    color: "#4b5563",
                                                  }}
                                                />
                                                <Legend />
                                                <Bar
                                                  yAxisId="left"
                                                  dataKey="Average Lateness"
                                                  fill="#4F46E5"
                                                  name="Avg. Lateness (min)"
                                                />
                                                <Bar
                                                  yAxisId="right"
                                                  dataKey="Total Deduction"
                                                  fill="#EF4444"
                                                  name="Total Deduction (ETB)"
                                                />
                                              </BarChart>
                                            </ResponsiveContainer>
                                          </div>
                                          <table className="min-w-full bg-white/95 border border-indigo-100 rounded-lg overflow-hidden text-xs sm:text-sm divide-y divide-indigo-100">
                                            <thead className="bg-indigo-50">
                                              <tr>
                                                <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                  Date
                                                </th>
                                                <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                  Avg. Lateness
                                                </th>
                                                <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                  Total Deduction
                                                </th>
                                                <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                  Present
                                                </th>
                                                <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                  Absent
                                                </th>
                                                <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                  Total
                                                </th>
                                              </tr>
                                            </thead>
                                            <tbody className="divide-y divide-indigo-100">
                                              {teacherDaily.map((d, j) => (
                                                <tr
                                                  key={d.date}
                                                  className={`hover:bg-indigo-50 transition-all ${
                                                    j % 2 === 0
                                                      ? "bg-white"
                                                      : "bg-gray-50"
                                                  }`}
                                                >
                                                  <td className="px-2 sm:px-4 py-2 text-indigo-900">
                                                    {d.date}
                                                  </td>
                                                  <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                    {d["Average Lateness"]}
                                                  </td>
                                                  <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                    {d["Total Deduction"]}
                                                  </td>
                                                  <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                    {d.Present}
                                                  </td>
                                                  <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                    {d.Absent}
                                                  </td>
                                                  <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                    {d.Total}
                                                  </td>
                                                </tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </>
                                      )}
                                    </div>
                                    <div className="flex justify-end mt-4 sm:mt-6 mb-2">
                                      <Button
                                        variant="outline"
                                        className="border-teal-200 text-teal-800 hover:bg-teal-100"
                                        onClick={() => {
                                          if (
                                            !showDeductionDetail &&
                                            expandedTeacherId
                                          )
                                            fetchDeductionDetail(
                                              expandedTeacherId
                                            );
                                          setShowDeductionDetail((v) => !v);
                                        }}
                                        aria-label={
                                          showDeductionDetail
                                            ? "Hide detailed deduction"
                                            : "Show detailed deduction"
                                        }
                                      >
                                        {showDeductionDetail
                                          ? "Hide Detailed Deduction"
                                          : "Show Detailed Deduction"}
                                      </Button>
                                    </div>
                                    {showDeductionDetail && (
                                      <div className="max-h-[40vh] overflow-y-auto border border-indigo-100 rounded-lg mb-4 bg-white/95">
                                        {deductionDetailLoading ? (
                                          <div className="py-8 text-center text-indigo-600 flex flex-col items-center gap-3">
                                            <FiAlertCircle className="w-8 h-8 animate-pulse" />
                                            <span className="text-lg font-semibold">
                                              Loading detailed deduction...
                                            </span>
                                          </div>
                                        ) : deductionDetail.length === 0 ? (
                                          <div className="py-8 text-center text-indigo-500 flex flex-col items-center gap-3">
                                            <span className="text-4xl">😕</span>
                                            <span className="text-sm font-semibold">
                                              No lateness events found for this
                                              period.
                                            </span>
                                          </div>
                                        ) : (
                                          <>
                                            <table className="min-w-full text-xs sm:text-sm divide-y divide-indigo-100">
                                              <thead className="bg-indigo-50">
                                                <tr>
                                                  <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                    Date
                                                  </th>
                                                  <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                    Student
                                                  </th>
                                                  <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                    Scheduled
                                                  </th>
                                                  <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                    Actual Start
                                                  </th>
                                                  <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                    Minutes Late
                                                  </th>
                                                  <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                    Deduction
                                                  </th>
                                                  <th className="px-2 sm:px-4 py-2 font-bold text-indigo-900 uppercase">
                                                    Tier
                                                  </th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-indigo-100">
                                                {deductionDetail.map((r, i) => (
                                                  <tr
                                                    key={
                                                      r.studentId +
                                                      "-" +
                                                      r.scheduledTime +
                                                      "-" +
                                                      i
                                                    }
                                                    className={`hover:bg-indigo-50 transition-all ${
                                                      i % 2 === 0
                                                        ? "bg-white"
                                                        : "bg-gray-50"
                                                    }`}
                                                  >
                                                    <td className="px-2 sm:px-4 py-2 text-indigo-900">
                                                      {formatLocalDateTime(
                                                        r.scheduledTime
                                                      )}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 text-indigo-900">
                                                      {r.studentName}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                      {formatLocalDateTime(
                                                        r.scheduledTime
                                                      )}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                      {formatLocalDateTime(
                                                        r.actualStartTime
                                                      )}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                      {r.latenessMinutes}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                      {r.deductionApplied}
                                                    </td>
                                                    <td className="px-2 sm:px-4 py-2 text-indigo-700">
                                                      {r.deductionTier}
                                                    </td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                            <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-indigo-100 bg-indigo-50">
                                              <span className="font-semibold text-indigo-700 text-sm sm:text-base">
                                                Total Deduction:
                                              </span>
                                              <span className="font-bold text-indigo-900 text-sm sm:text-base">
                                                {deductionDetailTotal} ETB
                                              </span>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={
                                                  exportDeductionDetailToCSV
                                                }
                                                className="mt-2 sm:mt-0 border-indigo-200 text-indigo-800"
                                              >
                                                Export CSV
                                              </Button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </Modal>
                              )}
                            </React.Fragment>
                          ))
                      )}
                    </tbody>
                  </table>
                  <div className="flex flex-col sm:flex-row justify-between items-center p-4 gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTeacherPage(1)}
                        disabled={teacherPage === 1}
                        className="border-indigo-200 text-indigo-800"
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTeacherPage(Math.max(1, teacherPage - 1))
                        }
                        disabled={teacherPage === 1}
                        className="border-indigo-200 text-indigo-800"
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-indigo-700">
                        Page {teacherPage} of{" "}
                        {Math.ceil(
                          filteredTeacherData.length / teacherPageSize
                        )}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTeacherPage(teacherPage + 1)}
                        disabled={
                          teacherPage >=
                          Math.ceil(
                            filteredTeacherData.length / teacherPageSize
                          )
                        }
                        className="border-indigo-200 text-indigo-800"
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setTeacherPage(
                            Math.ceil(
                              filteredTeacherData.length / teacherPageSize
                            )
                          )
                        }
                        disabled={
                          teacherPage >=
                          Math.ceil(
                            filteredTeacherData.length / teacherPageSize
                          )
                        }
                        className="border-indigo-200 text-indigo-800"
                      >
                        Last
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        exportToCSV(
                          filteredTeacherData,
                          "lateness_per_teacher.csv"
                        )
                      }
                      className="border-indigo-200 text-indigo-800"
                    >
                      <FiDownload className="mr-2 w-4 h-4" /> Export All
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-12 text-center">
              <div className="p-8 bg-gray-100 rounded-full w-fit mx-auto mb-8">
                <FiAlertCircle className="h-16 w-16 text-gray-500" />
              </div>
              <h3 className="text-3xl font-bold text-black mb-4">
                No Analytics Data
              </h3>
              <p className="text-gray-600 text-xl">
                No analytics data available for the selected period.
              </p>
            </div>
          )}

          {/* Daily Lateness Management */}
          <div
            className="rounded-2xl shadow-lg border border-gray-100/50 overflow-hidden backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}02 100%)`,
            }}
          >
            <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="p-3 rounded-xl shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    }}
                  >
                    <FiClock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Daily Lateness Management
                    </h2>
                    <p className="text-gray-600">
                      Track daily lateness records
                    </p>
                  </div>
                </div>
                <select
                  value={dailyPageSize}
                  onChange={(e) => setDailyPageSize(Number(e.target.value))}
                  className="px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-black text-sm"
                >
                  {[5, 10, 20, 50].map((size) => (
                    <option key={size} value={size}>
                      {size} per page
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
                <input
                  type="date"
                  value={format(dailyDate, "yyyy-MM-dd")}
                  onChange={(e) => setDailyDate(new Date(e.target.value))}
                  className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-base"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}40`,
                  }}
                />
                <select
                  value={dailyControllerId}
                  onChange={(e) => setDailyControllerId(e.target.value)}
                  className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-base"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}40`,
                  }}
                >
                  <option value="">All Controllers</option>
                  {controllers.map((c) => (
                    <option key={c.wdt_ID} value={c.wdt_ID}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={dailyTeacherId}
                  onChange={(e) => setDailyTeacherId(e.target.value)}
                  className="w-full sm:w-48 px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent text-base"
                  style={{
                    boxShadow: `0 0 0 2px ${primaryColor}40`,
                  }}
                >
                  <option value="">All Teachers</option>
                  {filteredTeacherData.map((t: any) => (
                    <option key={t.id ?? t.name} value={t.id ?? t.name}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              {dailyLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto mb-6"></div>
                  <p className="text-black font-medium text-lg">
                    Loading daily lateness...
                  </p>
                  <p className="text-gray-500 text-sm mt-2">
                    Please wait while we fetch the data
                  </p>
                </div>
              ) : dailyError ? (
                <div className="text-center py-12">
                  <div className="p-8 bg-red-50 rounded-full w-fit mx-auto mb-8">
                    <FiAlertCircle className="h-16 w-16 text-red-500" />
                  </div>
                  <h3 className="text-3xl font-bold text-black mb-4">
                    Error Loading Records
                  </h3>
                  <p className="text-red-600 text-xl">{dailyError}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Teacher
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Controller
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Scheduled
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Actual Start
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Minutes Late
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Deduction
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-black uppercase tracking-wider">
                          Tier
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {dailyRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="text-center py-20">
                            <div className="p-8 bg-gray-100 rounded-full w-fit mx-auto mb-8">
                              <FiClock className="h-16 w-16 text-gray-500" />
                            </div>
                            <h3 className="text-3xl font-bold text-black mb-4">
                              No Records Found
                            </h3>
                            <p className="text-gray-600 text-xl">
                              No lateness records found for the selected date.
                            </p>
                          </td>
                        </tr>
                      ) : (
                        dailyRecords.map((r: any, i: number) => (
                          <tr
                            key={r.studentId + "-" + r.scheduledTime}
                            className={`hover:bg-gray-50 transition-all duration-200 ${
                              i % 2 === 0 ? "bg-white" : "bg-gray-50"
                            }`}
                          >
                            <td className="px-6 py-4 text-black font-semibold">
                              {r.studentName}
                            </td>
                            <td className="px-6 py-4 text-black">
                              {r.teacherName}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {r.controllerName || "-"}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {formatLocalDateTime(r.scheduledTime)}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {formatLocalDateTime(r.actualStartTime)}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {r.latenessMinutes}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {r.deductionApplied}
                            </td>
                            <td className="px-6 py-4 text-gray-700">
                              {r.deductionTier}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center p-6 border-t border-gray-200">
                    <p className="text-lg font-semibold text-gray-700">
                      Page {dailyPage} of{" "}
                      {Math.ceil(dailyTotal / dailyPageSize)}
                    </p>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setDailyPage(Math.max(1, dailyPage - 1))}
                        disabled={dailyPage === 1}
                        className="p-3 border border-gray-300 rounded-xl bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all hover:scale-105"
                      >
                        <FiChevronLeft className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() => setDailyPage(dailyPage + 1)}
                        disabled={
                          dailyPage >= Math.ceil(dailyTotal / dailyPageSize)
                        }
                        className="p-3 border border-gray-300 rounded-xl bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-all hover:scale-105"
                      >
                        <FiChevronRight className="h-6 w-6" />
                      </button>
                      <button
                        onClick={() =>
                          exportToCSV(
                            dailyRecords,
                            "lateness_daily_management.csv"
                          )
                        }
                        className="text-white px-4 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg hover:shadow-xl"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                        }}
                      >
                        <FiDownload className="h-4 w-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer
            className="w-full text-center text-sm py-6 border-t border-gray-100 backdrop-blur-md mt-12"
            style={{
              background: `linear-gradient(135deg, #ffffff90 0%, ${primaryColor}02 100%)`,
              color: primaryColor,
            }}
          >
            © {new Date().getFullYear()} DarulKubra Admin Portal. All rights
            reserved.
          </footer>
        </div>

        {/* Deep Review Breakdown Modal */}
        {showBreakdownModal && (
          <Modal
            isOpen={showBreakdownModal}
            onClose={() => {
              setShowBreakdownModal(false);
              setBreakdownData(null);
            }}
          >
            <div className="w-full max-w-[95vw] lg:max-w-7xl mx-auto bg-white rounded-3xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 lg:p-8 flex items-center justify-between border-b border-indigo-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <FiActivity className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl lg:text-3xl font-bold">
                      Deep Review - {breakdownName}
                    </h2>
                    <p className="text-indigo-100 text-sm lg:text-base mt-1">
                      Detailed breakdown of average lateness calculation
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20"
                  onClick={() => {
                    setShowBreakdownModal(false);
                    setBreakdownData(null);
                  }}
                >
                  <FiX className="w-6 h-6" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
                {breakdownLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mb-6"></div>
                    <p className="text-gray-600 font-medium text-lg">
                      Loading detailed breakdown...
                    </p>
                  </div>
                ) : !breakdownData ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <FiAlertCircle className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-gray-600 font-medium text-lg">
                      No breakdown data available
                    </p>
                  </div>
                ) : breakdownData.summary ? (
                  <div className="space-y-6">
                    {/* Tabs for Controller */}
                    {breakdownType === "controller" &&
                      breakdownData.summary.uniqueTeachers !== undefined && (
                        <div className="bg-white rounded-xl shadow-lg p-2 border border-gray-200 flex flex-wrap gap-2">
                          {[
                            {
                              id: "overview",
                              label: "Overview",
                              icon: FiBarChart2,
                            },
                            {
                              id: "teachers",
                              label: `Teachers (${
                                breakdownData.summary.uniqueTeachers || 0
                              })`,
                              icon: FiUser,
                            },
                            {
                              id: "students",
                              label: `Students (${
                                breakdownData.summary.uniqueStudents || 0
                              })`,
                              icon: FiUsers,
                            },
                            {
                              id: "daily",
                              label: "Daily Trends",
                              icon: FiTrendingUp,
                            },
                            {
                              id: "records",
                              label: "All Records",
                              icon: FiInfo,
                            },
                          ].map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setBreakdownTab(tab.id as any)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                breakdownTab === tab.id
                                  ? "bg-indigo-600 text-white shadow-md"
                                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                              }`}
                            >
                              <tab.icon className="w-4 h-4" />
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      )}

                    {/* Summary Cards */}
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 ${
                        breakdownType === "controller" &&
                        breakdownData.summary.uniqueTeachers !== undefined
                          ? "lg:grid-cols-6"
                          : "lg:grid-cols-4"
                      } gap-4`}
                    >
                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">
                              Average Lateness
                            </p>
                            <p className="text-3xl font-bold text-indigo-600">
                              {breakdownData.summary.averageLateness}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              minutes
                            </p>
                          </div>
                          <div className="p-3 bg-indigo-100 rounded-lg">
                            <FiClock className="w-6 h-6 text-indigo-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">
                              Total Events
                            </p>
                            <p className="text-3xl font-bold text-green-600">
                              {breakdownData.summary.totalEvents}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              lateness occurrences
                            </p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <FiActivity className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">
                              Total Lateness
                            </p>
                            <p className="text-3xl font-bold text-purple-600">
                              {breakdownData.summary.totalLateness}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              total minutes
                            </p>
                          </div>
                          <div className="p-3 bg-purple-100 rounded-lg">
                            <FiTrendingUp className="w-6 h-6 text-purple-600" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">
                              Total Deduction
                            </p>
                            <p className="text-3xl font-bold text-red-600">
                              {breakdownData.summary.totalDeduction}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">ETB</p>
                          </div>
                          <div className="p-3 bg-red-100 rounded-lg">
                            <FiDollarSign className="w-6 h-6 text-red-600" />
                          </div>
                        </div>
                      </div>

                      {/* Additional cards for controllers */}
                      {breakdownType === "controller" &&
                        breakdownData.summary.uniqueTeachers !== undefined && (
                          <>
                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-teal-500">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-gray-500 text-sm font-medium mb-1">
                                    Unique Teachers
                                  </p>
                                  <p className="text-3xl font-bold text-teal-600">
                                    {breakdownData.summary.uniqueTeachers}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    teachers
                                  </p>
                                </div>
                                <div className="p-3 bg-teal-100 rounded-lg">
                                  <FiUser className="w-6 h-6 text-teal-600" />
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-gray-500 text-sm font-medium mb-1">
                                    Unique Students
                                  </p>
                                  <p className="text-3xl font-bold text-blue-600">
                                    {breakdownData.summary.uniqueStudents}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    students
                                  </p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-lg">
                                  <FiUsers className="w-6 h-6 text-blue-600" />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                    </div>

                    {/* Conditional Content Based on Tab */}
                    {(breakdownTab === "overview" ||
                      breakdownType === "teacher") && (
                      <>
                        {/* Calculation Formula */}
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-indigo-100 rounded-lg">
                              <FiInfo className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-indigo-900 mb-3">
                                How the Average is Calculated
                              </h3>
                              <div className="bg-white rounded-lg p-4 mb-4 border border-indigo-200">
                                <p className="text-gray-700 text-base font-mono">
                                  Average Lateness = Total Lateness Minutes ÷
                                  Total Events
                                </p>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/80 rounded-lg p-4">
                                  <p className="text-sm text-gray-500 mb-1">
                                    Total Lateness
                                  </p>
                                  <p className="text-2xl font-bold text-indigo-600">
                                    {breakdownData.summary.totalLateness}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    minutes
                                  </p>
                                </div>
                                <div className="bg-white/80 rounded-lg p-4 flex items-center justify-center">
                                  <p className="text-3xl font-bold text-gray-400">
                                    ÷
                                  </p>
                                </div>
                                <div className="bg-white/80 rounded-lg p-4">
                                  <p className="text-sm text-gray-500 mb-1">
                                    Total Events
                                  </p>
                                  <p className="text-2xl font-bold text-indigo-600">
                                    {breakdownData.summary.totalEvents}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    occurrences
                                  </p>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-indigo-200">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-700">
                                    Result:
                                  </p>
                                  <p className="text-2xl font-bold text-indigo-600">
                                    = {breakdownData.summary.averageLateness}{" "}
                                    minutes
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Teacher Statistics Tab (Controllers only) */}
                    {breakdownTab === "teachers" &&
                      breakdownType === "controller" &&
                      breakdownData.summary.teacherStatistics && (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-200">
                            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                              <FiUser className="w-5 h-5" />
                              Statistics by Teacher (
                              {
                                breakdownData.summary.teacherStatistics.length
                              }{" "}
                              teachers)
                            </h3>
                          </div>
                          <div className="overflow-x-auto max-h-[60vh]">
                            <table className="min-w-full text-sm divide-y divide-gray-200">
                              <thead className="bg-indigo-50 sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Teacher
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Students
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Total Events
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Avg. Lateness
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Total Lateness
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Total Deduction
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {breakdownData.summary.teacherStatistics.map(
                                  (t: any, i: number) => (
                                    <tr
                                      key={t.teacherId}
                                      className={`hover:bg-indigo-50 ${
                                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                      }`}
                                    >
                                      <td className="px-4 py-3 font-medium text-gray-900">
                                        {t.teacherName}
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {t.students}
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {t.totalEvents}
                                      </td>
                                      <td className="px-4 py-3 font-medium text-indigo-600">
                                        {t.averageLateness} min
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {t.totalLateness} min
                                      </td>
                                      <td className="px-4 py-3 font-medium text-red-600">
                                        {t.totalDeduction} ETB
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    {/* Student Statistics Tab (Controllers only) */}
                    {breakdownTab === "students" &&
                      breakdownType === "controller" &&
                      breakdownData.summary.studentStatistics && (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-200">
                            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                              <FiUsers className="w-5 h-5" />
                              Statistics by Student (
                              {
                                breakdownData.summary.studentStatistics.length
                              }{" "}
                              students)
                            </h3>
                          </div>
                          <div className="overflow-x-auto max-h-[60vh]">
                            <table className="min-w-full text-sm divide-y divide-gray-200">
                              <thead className="bg-indigo-50 sticky top-0 z-10">
                                <tr>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Student
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Teacher
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Total Events
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Avg. Lateness
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Total Lateness
                                  </th>
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                    Total Deduction
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100 bg-white">
                                {breakdownData.summary.studentStatistics.map(
                                  (s: any, i: number) => (
                                    <tr
                                      key={s.studentId}
                                      className={`hover:bg-indigo-50 ${
                                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                      }`}
                                    >
                                      <td className="px-4 py-3 font-medium text-gray-900">
                                        {s.studentName}
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {s.teacherName}
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {s.totalEvents}
                                      </td>
                                      <td className="px-4 py-3 font-medium text-indigo-600">
                                        {s.averageLateness} min
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {s.totalLateness} min
                                      </td>
                                      <td className="px-4 py-3 font-medium text-red-600">
                                        {s.totalDeduction} ETB
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                    {/* Daily Statistics Tab (Controllers only) */}
                    {breakdownTab === "daily" &&
                      breakdownType === "controller" &&
                      breakdownData.summary.dailyStatistics && (
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-200">
                            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                              <FiTrendingUp className="w-5 h-5" />
                              Daily Statistics Trend
                            </h3>
                          </div>
                          <div className="p-6">
                            <div className="h-80 mb-6">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                  data={breakdownData.summary.dailyStatistics}
                                >
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#e5e7eb"
                                  />
                                  <XAxis dataKey="date" stroke="#4b5563" />
                                  <YAxis
                                    yAxisId="left"
                                    label={{
                                      value: "Lateness (min)",
                                      angle: -90,
                                      position: "insideLeft",
                                      fill: "#4b5563",
                                    }}
                                    stroke="#4b5563"
                                  />
                                  <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    label={{
                                      value: "Events",
                                      angle: 90,
                                      position: "insideRight",
                                      fill: "#4b5563",
                                    }}
                                    stroke="#4b5563"
                                  />
                                  <Tooltip
                                    contentStyle={{
                                      backgroundColor: "#ffffff",
                                      borderColor: "#e5e7eb",
                                    }}
                                  />
                                  <Legend />
                                  <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="averageLateness"
                                    stroke="#4F46E5"
                                    name="Avg. Lateness (min)"
                                  />
                                  <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="totalEvents"
                                    stroke="#10B981"
                                    name="Total Events"
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto max-h-[40vh]">
                              <table className="min-w-full text-sm divide-y divide-gray-200">
                                <thead className="bg-indigo-50">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                      Date
                                    </th>
                                    <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                      Total Events
                                    </th>
                                    <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                      Avg. Lateness
                                    </th>
                                    <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                      Total Lateness
                                    </th>
                                    <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase">
                                      Total Deduction
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                  {breakdownData.summary.dailyStatistics.map(
                                    (d: any, i: number) => (
                                      <tr
                                        key={d.date}
                                        className={`hover:bg-indigo-50 ${
                                          i % 2 === 0
                                            ? "bg-white"
                                            : "bg-gray-50"
                                        }`}
                                      >
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                          {d.date}
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                          {d.totalEvents}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-indigo-600">
                                          {d.averageLateness} min
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">
                                          {d.totalLateness} min
                                        </td>
                                        <td className="px-4 py-3 font-medium text-red-600">
                                          {d.totalDeduction} ETB
                                        </td>
                                      </tr>
                                    )
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Detailed Records Table */}
                    {(breakdownTab === "records" ||
                      breakdownType === "teacher" ||
                      (breakdownType === "controller" &&
                        breakdownTab === "overview")) && (
                      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-200">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                              <FiInfo className="w-5 h-5" />
                              All Lateness Events Contributing to Average
                            </h3>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (breakdownData.records) {
                                  exportToCSV(
                                    breakdownData.records.map((r: any) => ({
                                      Date: r.date,
                                      Student: r.studentName,
                                      Teacher: r.teacherName,
                                      Controller: r.controllerName || "-",
                                      Scheduled: formatLocalDateTime(
                                        r.scheduledTime
                                      ),
                                      "Actual Start": formatLocalDateTime(
                                        r.actualStartTime
                                      ),
                                      "Lateness (min)": r.latenessMinutes,
                                      Deduction: r.deductionApplied,
                                      Tier: r.deductionTier,
                                    })),
                                    `lateness_breakdown_${breakdownName.replace(
                                      /\s+/g,
                                      "_"
                                    )}.csv`
                                  );
                                }
                              }}
                              className="border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            >
                              <FiDownload className="w-4 h-4 mr-2" />
                              Export CSV
                            </Button>
                          </div>
                        </div>
                        <div className="overflow-x-auto max-h-[60vh]">
                          <table className="min-w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-indigo-50 sticky top-0 z-10">
                              <tr>
                                <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                  Student
                                </th>
                                {breakdownType === "controller" && (
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                    Teacher
                                  </th>
                                )}
                                {breakdownType === "teacher" && (
                                  <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                    Controller
                                  </th>
                                )}
                                <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                  Scheduled
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                  Actual Start
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                  Lateness (min)
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                  Deduction
                                </th>
                                <th className="px-4 py-3 text-left font-bold text-indigo-900 uppercase tracking-wider">
                                  Tier
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                              {breakdownData.records &&
                              breakdownData.records.length > 0 ? (
                                breakdownData.records.map(
                                  (r: any, i: number) => (
                                    <tr
                                      key={`${r.studentId}-${r.date}-${i}`}
                                      className={`hover:bg-indigo-50 transition-all ${
                                        i % 2 === 0 ? "bg-white" : "bg-gray-50"
                                      }`}
                                    >
                                      <td className="px-4 py-3 text-gray-900 font-medium">
                                        {r.date}
                                      </td>
                                      <td className="px-4 py-3 text-gray-900">
                                        {r.studentName}
                                      </td>
                                      {breakdownType === "controller" && (
                                        <td className="px-4 py-3 text-gray-700">
                                          {r.teacherName}
                                        </td>
                                      )}
                                      {breakdownType === "teacher" && (
                                        <td className="px-4 py-3 text-gray-700">
                                          {r.controllerName || "-"}
                                        </td>
                                      )}
                                      <td className="px-4 py-3 text-gray-700">
                                        {formatLocalDateTime(r.scheduledTime)}
                                      </td>
                                      <td className="px-4 py-3 text-gray-700">
                                        {formatLocalDateTime(r.actualStartTime)}
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                                            r.latenessMinutes > 30
                                              ? "bg-red-100 text-red-700"
                                              : r.latenessMinutes > 15
                                              ? "bg-orange-100 text-orange-700"
                                              : "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {r.latenessMinutes} min
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-gray-700 font-medium">
                                        {r.deductionApplied} ETB
                                      </td>
                                      <td className="px-4 py-3">
                                        <span
                                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            r.deductionTier === "Excused"
                                              ? "bg-green-100 text-green-700"
                                              : "bg-purple-100 text-purple-700"
                                          }`}
                                        >
                                          {r.deductionTier}
                                        </span>
                                      </td>
                                    </tr>
                                  )
                                )
                              ) : (
                                <tr>
                                  <td
                                    colSpan={
                                      breakdownType === "controller" ? 9 : 9
                                    }
                                    className="px-4 py-8 text-center text-gray-500"
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <FiAlertCircle className="w-8 h-8 text-gray-400" />
                                      <p>
                                        No lateness records found for this
                                        period.
                                      </p>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
