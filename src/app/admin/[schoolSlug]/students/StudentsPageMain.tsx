"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Toaster, toast } from "react-hot-toast";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
  ScatterChart,
  ZAxis,
} from "recharts";
import {
  FiArrowLeft,
  FiUser,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiUsers,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiUserPlus,
  FiUserMinus,
  FiUserCheck,
  FiDollarSign,
  FiGift,
  FiAward,
  FiPieChart,
  FiBarChart2,
  FiActivity,
  FiPhone,
  FiMessageCircle,
  FiTarget,
  FiPercent,
  FiGlobe,
  FiAlertCircle,
  FiZap,
  FiLayers,
  FiPrinter,
  FiShare2,
  FiMaximize2,
  FiMinimize2,
  FiBookOpen,
  FiTrendingDown as FiChurn,
  FiEdit,
  FiEye,
  FiMoreVertical,
  FiX,
  FiSave,
  FiPackage,
  FiBook,
  FiMapPin,
  FiBarChart,
  FiFileText,
} from "react-icons/fi";
import { FeatureGate } from "@/components/features";
import { format, parseISO } from "date-fns";

interface Student {
  id: number;
  name: string;
  status: string;
  startDate: string | null;
  ustazName?: string;
  phone?: string;
  email?: string;
  registrationDate?: string;
  package?: string | null;
  subject?: string | null;
  daypackages?: string | null;
  classfee?: number | null;
  classfeeCurrency?: string | null;
  country?: string | null;
  progress?: string | null;
  chatId?: string | null;
  ustaz?: string | null;
  controller?: string | null;
  controllerCode?: string | null;
}

interface StatsAPI {
  overview: {
    totalStudents: number;
    totalActive: number;
    totalNotYet: number;
    totalInactive: number;
    activeRate: string;
  };
  monthly: {
    registered: number;
    started: number;
    left: number;
    netGrowth: number;
    conversionRate: string;
    retentionRate: string;
    churnRate: string;
  };
  growth: {
    registrationGrowthRate: string;
    activationGrowthRate: string;
    lastMonthRegistered: number;
    lastMonthActive: number;
    avgRegistrationsPerMonth: string;
    avgActivationsPerMonth: string;
  };
  payments: {
    currentMonth: {
      paidStudents: number;
      unpaidStudents: number;
      paymentRate: string;
      totalStudents: number;
      revenue: number;
    };
    lastMonth: {
      paidStudents: number;
      unpaidStudents: number;
      paymentRate: string;
      totalStudents: number;
    };
    paidStudents: number;
    unpaidStudents: number;
    paymentRate: string;
    totalRevenue: number;
    monthlyRevenue: number;
    avgRevenuePerStudent: string;
    growthRate: string;
    currentMonthDetails: Array<{
      studentid: number;
      payment_status: string;
      paid_amount: number;
    }>;
  };
  assignments: {
    assigned: number;
    unassigned: number;
    assignmentRate: string;
  };
  engagement: {
    withPhone: number;
    withTelegram: number;
    withReferral: number;
    contactRate: string;
    telegramRate: string;
    referralRate: string;
  };
  lifecycle: {
    prospects: number;
    active: number;
    churned: number;
    conversionRate: string;
    churnRate: string;
    avgLifetimeMonths: string;
  };
  attendance: {
    monthly: {
      present: number;
      absent: number;
      excused: number;
      total: number;
      attendanceRate: string;
      absenceRate: string;
      uniqueStudents: number;
    };
    overall: {
      present: number;
      absent: number;
      excused: number;
      total: number;
      attendanceRate: string;
    };
  };
  breakdowns: {
    packages: Array<{ name: string; count: number; percentage: string }>;
    subjects: Array<{ name: string; count: number; percentage: string }>;
    schedules: Array<{ name: string; count: number; percentage: string }>;
    countries: Array<{ name: string; count: number; percentage: string }>;
    statuses: Array<{ name: string; count: number; percentage: string }>;
    currencies: Array<{ name: string; count: number; percentage: string }>;
  };
  trends: {
    registrations: Array<{ month: string; monthName: string; count: number }>;
    activations: Array<{ month: string; monthName: string; count: number }>;
    exits: Array<{ month: string; monthName: string; count: number }>;
    netGrowth: Array<{ month: string; monthName: string; count: number }>;
  };
}

interface StudentsPageMainProps {
  schoolSlug: string;
}

export default function StudentsPageMain({ schoolSlug }: StudentsPageMainProps) {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [packageFilter, setPackageFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [ustazFilter, setUstazFilter] = useState("");
  const [progressFilter, setProgressFilter] = useState("");
  const [regDateFrom, setRegDateFrom] = useState("");
  const [regDateTo, setRegDateTo] = useState("");
  const [startDateFrom, setStartDateFrom] = useState("");
  const [startDateTo, setStartDateTo] = useState("");
  const [feeMin, setFeeMin] = useState("");
  const [feeMax, setFeeMax] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [stats, setStats] = useState<StatsAPI | null>(null);
  const [activeSection, setActiveSection] = useState<string>("dashboard");

  // Data validation helper
  const safeGet = (obj: any, path: string, defaultValue: any = 0) => {
    try {
      return path.split(".").reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const fetchGlobalStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch(`/api/admin/${schoolSlug}/students/stats`, {
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error("Failed to fetch global stats:", err);
      toast.error("Failed to load analytics");
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  if (loading && statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="sticky top-0 z-40 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl">
          <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
            <div className="h-16 bg-white/20 rounded-2xl animate-pulse"></div>
          </div>
        </div>
        <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 animate-pulse">
            <div className="flex gap-3">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 bg-gray-200 rounded-xl flex-1"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center bg-white border-2 border-red-500 rounded-2xl shadow-2xl p-10 max-w-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-pink-50 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
              <FiAlertCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-gray-900 font-black text-2xl mb-3">
              Failed to Load Analytics
            </h2>
            <p className="text-gray-600 text-base mb-8 leading-relaxed">
              We couldn't fetch the dashboard data. This might be due to a
              network issue or server problem.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={fetchGlobalStats}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-black hover:shadow-2xl transition-all flex items-center justify-center gap-2 hover:scale-105"
              >
                <FiRefreshCw className="h-5 w-5" />
                Retry Loading
              </button>
              <button
                onClick={() => router.push("/admin")}
                className="px-8 py-4 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2 border-2 border-gray-300"
              >
                <FiArrowLeft className="h-5 w-5" />
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 via-purple-50 relative overflow-x-hidden">
      <Toaster position="top-center" />
      
      {/* Simple dashboard content */}
      <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-2xl p-4">
          <h1 className="text-2xl font-black text-gray-900">Student Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Overview of student data and analytics</p>
        </div>
        
        {/* Basic stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border-2 border-blue-500 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-gray-900 mb-2">Total Students</h3>
            <p className="text-3xl font-black text-blue-600">{safeGet(stats, 'overview.totalStudents', 0)}</p>
          </div>
          <div className="bg-white border-2 border-green-500 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-gray-900 mb-2">Active Students</h3>
            <p className="text-3xl font-black text-green-600">{safeGet(stats, 'overview.totalActive', 0)}</p>
          </div>
          <div className="bg-white border-2 border-amber-500 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-gray-900 mb-2">Prospects</h3>
            <p className="text-3xl font-black text-amber-600">{safeGet(stats, 'overview.totalNotYet', 0)}</p>
          </div>
          <div className="bg-white border-2 border-purple-500 rounded-xl p-6 shadow-xl">
            <h3 className="text-lg font-black text-gray-900 mb-2">Active Rate</h3>
            <p className="text-3xl font-black text-purple-600">{safeGet(stats, 'overview.activeRate', '0')}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}