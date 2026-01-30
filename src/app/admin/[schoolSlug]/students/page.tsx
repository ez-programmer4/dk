"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { FeatureGate, GenericFeatureGate } from "@/components/features";
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

const CHART_COLORS = [
  "#3B82F6", // Blue - Primary
  "#10B981", // Green - Success
  "#F59E0B", // Amber - Warning
  "#EF4444", // Red - Danger
  "#8B5CF6", // Purple - Info
  "#EC4899", // Pink - Accent
  "#06B6D4", // Cyan - Secondary
  "#F97316", // Orange - Alert
  "#14B8A6", // Teal - Cool
  "#6366F1", // Indigo - Deep
];

// Attendance History Tab Component
function AttendanceHistoryTab({
  attendanceHistory,
  loading,
  studentId,
  onRefresh,
}: {
  attendanceHistory: any;
  loading: boolean;
  studentId?: number;
  onRefresh: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-800 border-green-300";
      case "Absent":
        return "bg-red-100 text-red-800 border-red-300";
      case "Permission":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "Not Taken":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-green-600"></div>
      </div>
    );
  }

  if (!attendanceHistory || !attendanceHistory.records) {
    return (
      <div className="text-center py-12">
        <FiCalendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">
          No attendance records found
        </p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all"
        >
          <FiRefreshCw className="inline mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      {attendanceHistory.statistics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="group bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 rounded-2xl p-5 border-2 border-gray-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-300/30 to-transparent rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                  <FiActivity className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-black text-gray-600 uppercase tracking-wider">
                  Total Sessions
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {attendanceHistory.statistics.total}
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-green-50 via-green-100 to-emerald-200 rounded-2xl p-5 border-2 border-green-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-300/30 to-transparent rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <FiCheckCircle className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-black text-green-600 uppercase tracking-wider">
                  Present
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {attendanceHistory.statistics.present}
              </p>
              <p className="text-xs font-semibold text-green-600 mt-1">
                {attendanceHistory.statistics.total > 0
                  ? Math.round(
                      (attendanceHistory.statistics.present /
                        attendanceHistory.statistics.total) *
                        100
                    )
                  : 0}
                % of total
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-red-50 via-red-100 to-red-200 rounded-2xl p-5 border-2 border-red-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-300/30 to-transparent rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <FiUserMinus className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-black text-red-600 uppercase tracking-wider">
                  Absent
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {attendanceHistory.statistics.absent}
              </p>
              <p className="text-xs font-semibold text-red-600 mt-1">
                {attendanceHistory.statistics.total > 0
                  ? Math.round(
                      (attendanceHistory.statistics.absent /
                        attendanceHistory.statistics.total) *
                        100
                    )
                  : 0}
                % of total
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 rounded-2xl p-5 border-2 border-amber-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-300/30 to-transparent rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                  <FiClock className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-black text-amber-600 uppercase tracking-wider">
                  Permission
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {attendanceHistory.statistics.permission}
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl p-5 border-2 border-blue-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-300/30 to-transparent rounded-full -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FiPercent className="h-5 w-5 text-white" />
                </div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider">
                  Attendance Rate
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {attendanceHistory.statistics.attendanceRate}%
              </p>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${attendanceHistory.statistics.attendanceRate}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Attendance Records Table */}
      <div className="bg-white border-2 border-green-300 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
        <div className="px-6 py-5 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 border-b-2 border-green-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                <FiCalendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-black text-white flex items-center gap-2">
                  Attendance Records
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                    {attendanceHistory.records.length} records
                  </span>
                </h4>
                <p className="text-green-100 text-sm font-semibold mt-1">
                  Complete attendance history and session details
                </p>
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="px-5 py-2.5 bg-white/20 backdrop-blur-sm text-white rounded-xl font-bold hover:bg-white/30 transition-all flex items-center gap-2 border border-white/30"
            >
              <FiRefreshCw className="h-5 w-5" />
              Refresh
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px] custom-scrollbar">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                  Progress Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                  Pages Read
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                  Lesson
                </th>
                <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceHistory.records.length > 0 ? (
                attendanceHistory.records.map((record: any) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all cursor-pointer group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900">
                          {format(parseISO(record.date), "MMM dd, yyyy")}
                        </span>
                        <span className="text-xs text-gray-500 font-semibold">
                          {format(parseISO(record.date), "EEEE")}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl border-2 shadow-md ${getStatusColor(
                          record.status
                        )}`}
                      >
                        {record.status === "Present" && (
                          <FiCheckCircle className="h-4 w-4" />
                        )}
                        {record.status === "Absent" && (
                          <FiUserMinus className="h-4 w-4" />
                        )}
                        {record.status === "Permission" && (
                          <FiClock className="h-4 w-4" />
                        )}
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.surah ? (
                        <div className="flex items-center gap-2">
                          <FiBook className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-bold text-gray-900">
                            {record.surah}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.pages_read ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold">
                          <FiFileText className="h-3 w-3" />
                          {record.pages_read} pages
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.level ? (
                        <span className="text-sm font-semibold text-gray-900">
                          {record.level}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.lesson ? (
                        <span className="text-sm font-semibold text-gray-900">
                          {record.lesson}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record.notes ? (
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-700 font-medium line-clamp-2 group-hover:line-clamp-none">
                            {record.notes}
                          </p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-sm">
                          No notes
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <FiCalendar className="h-16 w-16 text-gray-300 mb-4" />
                      <p className="text-gray-500 font-semibold text-lg mb-2">
                        No attendance records found
                      </p>
                      <p className="text-gray-400 text-sm">
                        Attendance records will appear here once sessions are
                        recorded
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Payment History Tab Component
function PaymentHistoryTab({
  paymentHistory,
  loading,
  studentId,
  onRefresh,
}: {
  paymentHistory: any;
  loading: boolean;
  studentId?: number;
  onRefresh: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-amber-600"></div>
      </div>
    );
  }

  if (!paymentHistory) {
    return (
      <div className="text-center py-12">
        <FiDollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 font-semibold">No payment records found</p>
        <button
          onClick={onRefresh}
          className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-all"
        >
          <FiRefreshCw className="inline mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-300";
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Statistics Cards */}
      {paymentHistory.statistics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="group bg-gradient-to-br from-green-50 via-green-100 to-emerald-200 rounded-2xl p-5 border-2 border-green-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-green-300/30 to-transparent rounded-full -mr-12 -mt-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiDollarSign className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-black text-green-600 uppercase tracking-wider">
                  Total Paid
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900 mb-1">
                ETB {paymentHistory.statistics.totalPaid?.toLocaleString() || 0}
              </p>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-600 font-semibold">
                  Monthly: ETB{" "}
                  {paymentHistory.statistics.totalMonthlyPaid?.toLocaleString() ||
                    0}
                </span>
              </div>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl p-5 border-2 border-blue-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-300/30 to-transparent rounded-full -mr-12 -mt-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiCheckCircle className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-black text-blue-600 uppercase tracking-wider">
                  Paid Months
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {paymentHistory.statistics.paidMonths}
              </p>
              <p className="text-xs font-semibold text-blue-600 mt-1">
                {paymentHistory.statistics.totalMonths > 0
                  ? Math.round(
                      (paymentHistory.statistics.paidMonths /
                        paymentHistory.statistics.totalMonths) *
                        100
                    )
                  : 0}
                % completion
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 rounded-2xl p-5 border-2 border-amber-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-300/30 to-transparent rounded-full -mr-12 -mt-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiClock className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-black text-amber-600 uppercase tracking-wider">
                  Pending
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {paymentHistory.statistics.pendingMonths}
              </p>
              <p className="text-xs font-semibold text-amber-600 mt-1">
                Awaiting payment
              </p>
            </div>
          </div>

          <div className="group bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 rounded-2xl p-5 border-2 border-purple-400 hover:shadow-xl transition-all hover:scale-105 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-300/30 to-transparent rounded-full -mr-12 -mt-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FiCalendar className="h-6 w-6 text-white" />
                </div>
                <p className="text-xs font-black text-purple-600 uppercase tracking-wider">
                  Total Months
                </p>
              </div>
              <p className="text-3xl font-black text-gray-900">
                {paymentHistory.statistics.totalMonths}
              </p>
              <p className="text-xs font-semibold text-purple-600 mt-1">
                All time records
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Summary Chart */}
      {paymentHistory.statistics && (
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 rounded-2xl p-6 border-2 border-amber-400">
          <h4 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-2">
            <FiBarChart className="h-5 w-5 text-amber-600" />
            Payment Overview
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border-2 border-amber-300">
              <p className="text-xs font-bold text-gray-600 mb-2">
                Payment Rate
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-amber-600">
                  {paymentHistory.statistics.totalMonths > 0
                    ? Math.round(
                        (paymentHistory.statistics.paidMonths /
                          paymentHistory.statistics.totalMonths) *
                          100
                      )
                    : 0}
                  %
                </p>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all"
                    style={{
                      width: `${
                        paymentHistory.statistics.totalMonths > 0
                          ? (paymentHistory.statistics.paidMonths /
                              paymentHistory.statistics.totalMonths) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-green-300">
              <p className="text-xs font-bold text-gray-600 mb-2">
                Average Monthly
              </p>
              <p className="text-2xl font-black text-green-600">
                ETB{" "}
                {paymentHistory.statistics.paidMonths > 0
                  ? Math.round(
                      (paymentHistory.statistics.totalMonthlyPaid || 0) /
                        paymentHistory.statistics.paidMonths
                    ).toLocaleString()
                  : 0}
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border-2 border-blue-300">
              <p className="text-xs font-bold text-gray-600 mb-2">
                Direct Payments
              </p>
              <p className="text-2xl font-black text-blue-600">
                ETB{" "}
                {paymentHistory.statistics.totalDirectPaid?.toLocaleString() ||
                  0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Monthly Payments */}
      {paymentHistory.monthlyPayments &&
        paymentHistory.monthlyPayments.length > 0 && (
          <div className="bg-white border-2 border-blue-300 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
            <div className="px-6 py-5 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 border-b-2 border-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                    <FiCalendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white flex items-center gap-2">
                      Monthly Payments
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                        {paymentHistory.monthlyPayments.length} records
                      </span>
                    </h4>
                    <p className="text-blue-100 text-sm font-semibold mt-1">
                      Recurring monthly subscription payments
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Payment Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Source
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.monthlyPayments.map((payment: any) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900">
                            {payment.month}
                          </span>
                          <span className="text-xs text-gray-500 font-semibold">
                            {payment.start_date && payment.end_date
                              ? format(parseISO(payment.start_date), "MMM yyyy")
                              : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiDollarSign className="h-4 w-4 text-green-600" />
                          <span className="text-lg font-black text-green-700">
                            ETB {payment.paid_amount?.toLocaleString() || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl border-2 shadow-md ${getPaymentStatusColor(
                            payment.payment_status
                          )}`}
                        >
                          {payment.payment_status?.toLowerCase() === "paid" && (
                            <FiCheckCircle className="h-4 w-4" />
                          )}
                          {payment.payment_status?.toLowerCase() ===
                            "pending" && <FiClock className="h-4 w-4" />}
                          {payment.payment_status?.toLowerCase() ===
                            "rejected" && <FiAlertCircle className="h-4 w-4" />}
                          {payment.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.payment_type ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-sm font-bold">
                            <FiPackage className="h-3 w-3" />
                            {payment.payment_type}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.start_date && payment.end_date ? (
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">
                              {format(parseISO(payment.start_date), "MMM dd")} -{" "}
                              {format(parseISO(payment.end_date), "MMM dd")}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(parseISO(payment.end_date), "yyyy")}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.source ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">
                            {payment.source === "stripe"
                              ? "💳 Stripe"
                              : payment.source}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            Manual
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {/* Enhanced Direct Payments */}
      {paymentHistory.directPayments &&
        paymentHistory.directPayments.length > 0 && (
          <div className="bg-white border-2 border-purple-300 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all">
            <div className="px-6 py-5 bg-gradient-to-br from-purple-500 via-pink-500 to-purple-600 border-b-2 border-purple-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                    <FiDollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-white flex items-center gap-2">
                      Direct Payments
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                        {paymentHistory.directPayments.length} transactions
                      </span>
                    </h4>
                    <p className="text-purple-100 text-sm font-semibold mt-1">
                      One-time payments and deposits
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Payment Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Payment Method
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Transaction ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paymentHistory.directPayments.map((payment: any) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-gray-900">
                            {format(
                              parseISO(payment.paymentdate),
                              "MMM dd, yyyy"
                            )}
                          </span>
                          <span className="text-xs text-gray-500 font-semibold">
                            {format(parseISO(payment.paymentdate), "h:mm a")}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FiDollarSign className="h-5 w-5 text-green-600" />
                          <span className="text-lg font-black text-green-700">
                            ETB {payment.paidamount?.toLocaleString() || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-black rounded-xl border-2 shadow-md ${getPaymentStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status?.toLowerCase() === "completed" && (
                            <FiCheckCircle className="h-4 w-4" />
                          )}
                          {payment.status?.toLowerCase() === "pending" && (
                            <FiClock className="h-4 w-4" />
                          )}
                          {payment.status?.toLowerCase() === "rejected" && (
                            <FiAlertCircle className="h-4 w-4" />
                          )}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.paymentmethod ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-bold">
                            {payment.paymentmethod === "stripe" && "💳"}
                            {payment.paymentmethod === "chapa" && "🏦"}
                            {payment.paymentmethod}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.transactionid ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                              {payment.transactionid.substring(0, 12)}...
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  payment.transactionid
                                );
                                toast.success("Transaction ID copied!");
                              }}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Copy full ID"
                            >
                              <FiFileText className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {payment.notes ? (
                          <p className="text-sm text-gray-700 font-medium max-w-xs truncate group-hover:max-w-none group-hover:whitespace-normal">
                            {payment.notes}
                          </p>
                        ) : (
                          <span className="text-gray-400 italic text-sm">
                            No notes
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      {(!paymentHistory.monthlyPayments ||
        paymentHistory.monthlyPayments.length === 0) &&
        (!paymentHistory.directPayments ||
          paymentHistory.directPayments.length === 0) && (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-300">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiDollarSign className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-black text-gray-600 mb-2">
              No Payment Records
            </h3>
            <p className="text-gray-500 font-semibold mb-6">
              Payment history will appear here once payments are recorded
            </p>
            <button
              onClick={onRefresh}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl"
            >
              <FiRefreshCw className="inline mr-2" />
              Refresh Payments
            </button>
          </div>
        )}

      {/* Enhanced Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
        >
          <FiRefreshCw className="h-5 w-5" />
          Refresh All Payments
        </button>
        {paymentHistory && (
          <button
            onClick={() => {
              // Export payment history
              const csvContent = [
                [
                  "Type",
                  "Date",
                  "Amount",
                  "Status",
                  "Method",
                  "Transaction ID",
                ],
                ...(paymentHistory.monthlyPayments || []).map((p: any) => [
                  "Monthly",
                  p.month,
                  p.paid_amount || 0,
                  p.payment_status,
                  p.payment_type || "N/A",
                  "N/A",
                ]),
                ...(paymentHistory.directPayments || []).map((p: any) => [
                  "Direct",
                  format(parseISO(p.paymentdate), "yyyy-MM-dd"),
                  p.paidamount || 0,
                  p.status,
                  p.paymentmethod || "N/A",
                  p.transactionid || "N/A",
                ]),
              ]
                .map((row) => row.join(","))
                .join("\n");
              const blob = new Blob([csvContent], { type: "text/csv" });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `student_${studentId}_payments_${format(
                new Date(),
                "yyyyMMdd"
              )}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
              toast.success("Payment history exported!");
            }}
            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl transition-all flex items-center gap-2"
          >
            <FiDownload className="h-5 w-5" />
            Export CSV
          </button>
        )}
      </div>
    </div>
  );
}

export default function StudentsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const { data: session } = useSession();
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
  const [expandedChart, setExpandedChart] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<any>(null);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [alertSearch, setAlertSearch] = useState<{ [key: string]: string }>({
    notSucceed: "",
    notYet: "",
    absent: "",
  });
  const [alertPage, setAlertPage] = useState<{ [key: string]: number }>({
    notSucceed: 1,
    notYet: 1,
    absent: 1,
  });
  const [alertLimit] = useState(10);
  const [notSucceedMonths, setNotSucceedMonths] = useState(1); // Default: 1 month
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [showStudentEdit, setShowStudentEdit] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<
    "info" | "attendance" | "payments"
  >("info");

  // Helper function to filter and paginate students
  const getPaginatedStudents = (
    students: any[],
    searchTerm: string,
    page: number,
    limit: number
  ) => {
    const filtered = students.filter((student) =>
      searchTerm
        ? student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.id?.toString().includes(searchTerm) ||
          student.phone?.includes(searchTerm) ||
          student.ustazName?.toLowerCase().includes(searchTerm.toLowerCase())
        : true
    );

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginated = filtered.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filtered.length / limit);

    return {
      students: paginated,
      total: filtered.length,
      totalPages,
      currentPage: page,
    };
  };

  // Format number with proper locale
  const formatNumber = (num: number | string | null | undefined): string => {
    if (num === null || num === undefined) return "0";
    const numValue = typeof num === "string" ? parseFloat(num) : num;
    if (isNaN(numValue)) return "0";
    return numValue.toLocaleString();
  };

  // Format percentage
  const formatPercentage = (
    value: string | number | null | undefined
  ): string => {
    if (value === null || value === undefined) return "0%";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) return "0%";
    return `${numValue.toFixed(1)}%`;
  };

  // Format currency
  const formatCurrency = (
    amount: number | string | null | undefined,
    currency: string = "ETB"
  ): string => {
    if (amount === null || amount === undefined) return `${currency} 0`;
    const numValue = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(numValue)) return `${currency} 0`;
    return `${currency} ${numValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  const fetchStudents = async (resetPage: boolean = false) => {
    setLoading(true);
    try {
      const currentPage = resetPage ? 1 : page;
      if (resetPage) setPage(1);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        search: searchQuery,
        status: statusFilter,
        package: packageFilter,
        subject: subjectFilter,
        country: countryFilter,
        ustaz: ustazFilter,
        progress: progressFilter,
        regDateFrom: regDateFrom,
        regDateTo: regDateTo,
        startDateFrom: startDateFrom,
        startDateTo: startDateTo,
        feeMin: feeMin,
        feeMax: feeMax,
      });

      const response = await fetch(`/api/admin/${schoolSlug}/students?${params.toString()}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to fetch students");

      const result = await response.json();
      setStudents(result.students || []);
      setTotal(result.total || 0);
      setTotalPages(
        result.totalPages || Math.ceil((result.total || 0) / limit)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
    setPackageFilter("");
    setSubjectFilter("");
    setCountryFilter("");
    setUstazFilter("");
    setProgressFilter("");
    setRegDateFrom("");
    setRegDateTo("");
    setStartDateFrom("");
    setStartDateTo("");
    setFeeMin("");
    setFeeMax("");
    setPage(1);
    setTimeout(() => fetchStudents(true), 100);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    setTimeout(() => fetchStudents(true), 100);
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchStudents(true);
  };

  const fetchStudentDetails = async (studentId: number) => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/${schoolSlug}/students/${studentId}`, {
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to fetch student details");

      const data = await response.json();
      setStudentDetails(data);
      setSelectedStudent(data);
      setShowStudentDetail(true);
      setActiveDetailTab("info");

      // Fetch attendance and payment history
      fetchAttendanceHistory(studentId);
      fetchPaymentHistory(studentId);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load student details"
      );
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchAttendanceHistory = async (studentId: number) => {
    setLoadingAttendance(true);
    try {
      const response = await fetch(
        `/api/admin/${schoolSlug}/students/${studentId}/attendance`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch attendance history");

      const data = await response.json();
      setAttendanceHistory(data);
    } catch (err) {
      console.error("Error fetching attendance:", err);
      setAttendanceHistory(null);
    } finally {
      setLoadingAttendance(false);
    }
  };

  const fetchPaymentHistory = async (studentId: number) => {
    setLoadingPayments(true);
    try {
      const response = await fetch(
        `/api/admin/${schoolSlug}/students/${studentId}/payments`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch payment history");

      const data = await response.json();
      setPaymentHistory(data);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setPaymentHistory(null);
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleEditStudent = (student: Student) => {
    // Redirect to registration page for editing
    window.location.href = `/registration?id=${student.id}`;
  };

  const handleUpdateStudent = async (updatedData: Partial<Student>) => {
    if (!editingStudent) return;

    try {
      const response = await fetch(`/api/admin/students/${editingStudent.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update student");
      }

      toast.success("Student updated successfully!");
      setShowStudentEdit(false);
      setEditingStudent(null);
      fetchStudents(); // Refresh the list
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update student"
      );
    }
  };

  // Student Edit Form Component (defined before use)
  const StudentEditForm = React.memo(
    ({
      student,
      onSave,
      onCancel,
    }: {
      student: Student;
      onSave: (data: Partial<Student>) => void;
      onCancel: () => void;
    }) => {
      const [formData, setFormData] = useState({
        name: student.name || "",
        status: student.status || "",
        phoneno: student.phone || "",
        classfee: student.classfee?.toString() || "",
        classfeeCurrency: student.classfeeCurrency || "ETB",
        package: student.package || "",
        subject: student.subject || "",
        daypackages: student.daypackages || "",
        country: student.country || "",
        progress: student.progress || "",
      });
      const [saving, setSaving] = useState(false);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
          await onSave({
            ...formData,
            classfee: formData.classfee
              ? parseFloat(formData.classfee)
              : undefined,
          });
        } finally {
          setSaving(false);
        }
      };

      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                required
              >
                <option value="Active">Active</option>
                <option value="Not yet">Not Yet</option>
                <option value="Leave">Leave</option>
                <option value="Completed">Completed</option>
                <option value="Not succeed">Not Succeed</option>
                <option value="Ramadan Leave">Ramadan Leave</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="text"
                value={formData.phoneno}
                onChange={(e) =>
                  setFormData({ ...formData, phoneno: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Package
              </label>
              <input
                type="text"
                value={formData.package}
                onChange={(e) =>
                  setFormData({ ...formData, package: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) =>
                  setFormData({ ...formData, subject: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Day Packages
              </label>
              <input
                type="text"
                value={formData.daypackages}
                onChange={(e) =>
                  setFormData({ ...formData, daypackages: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Class Fee
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  value={formData.classfee}
                  onChange={(e) =>
                    setFormData({ ...formData, classfee: e.target.value })
                  }
                  className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                />
                <select
                  value={formData.classfeeCurrency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      classfeeCurrency: e.target.value,
                    })
                  }
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
                >
                  <option value="ETB">ETB</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Progress
              </label>
              <textarea
                value={formData.progress}
                onChange={(e) =>
                  setFormData({ ...formData, progress: e.target.value })
                }
                rows={3}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      );
    }
  );

  const fetchGlobalStats = async () => {
    setStatsLoading(true);
    try {
      const response = await fetch("/api/admin/students/stats", {
        credentials: "include",
        cache: "no-store",
      });
      if (response.ok) {
        const statsData = await response.json();
        console.log("📊 Stats Data Received:", statsData);
        console.log("💰 Payment Data:", statsData.payments);
        console.log("📋 Attendance Data:", statsData.attendance);
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
    fetchStudents();
  }, [page, limit, searchQuery, statusFilter]);

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const fetchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/students/alerts?months=${notSucceedMonths}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );
      if (response.ok) {
        const alertsData = await response.json();
        setAlerts(alertsData);
      }
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
      toast.error("Failed to load alerts");
    } finally {
      setAlertsLoading(false);
    }
  };

  useEffect(() => {
    if (activeSection === "alerts") {
      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, notSucceedMonths]);

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Status",
      "Start Date",
      "Ustaz",
      "Phone",
      "Registration Date",
    ];
    const rows = students.map((student) => [
      student.name,
      student.status,
      student.startDate
        ? format(parseISO(student.startDate), "yyyy-MM-dd")
        : "N/A",
      student.ustazName || "N/A",
      student.phone || "N/A",
      student.registrationDate
        ? format(parseISO(student.registrationDate), "yyyy-MM-dd")
        : "N/A",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students_analytics_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("📊 Data exported successfully!");
  };

  const generatePDFReport = () => {
    toast.success("📄 Generating comprehensive PDF report...");
    // PDF generation would be implemented here
  };

  const calculatedTotalPages = Math.ceil(total / limit);

  // Skeleton Loader Component
  const SkeletonCard = () => (
    <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
          <div className="h-10 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
      </div>
    </div>
  );

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <div className="text-center bg-white border-2 border-red-500 rounded-2xl shadow-2xl p-10 max-w-lg relative overflow-hidden">
          {/* Background decoration */}
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

  const MetricCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    subtitle,
    color = "blue",
    description,
  }: any) => {
    const colorClasses: any = {
      blue: {
        border: "border-blue-500",
        bg: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
        text: "text-blue-600",
        lightBg: "bg-blue-50",
        glow: "shadow-blue-500/20",
      },
      green: {
        border: "border-green-500",
        bg: "bg-gradient-to-br from-green-500 via-green-600 to-green-700",
        text: "text-green-600",
        lightBg: "bg-green-50",
        glow: "shadow-green-500/20",
      },
      amber: {
        border: "border-amber-500",
        bg: "bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700",
        text: "text-amber-600",
        lightBg: "bg-amber-50",
        glow: "shadow-amber-500/20",
      },
      red: {
        border: "border-red-500",
        bg: "bg-gradient-to-br from-red-500 via-red-600 to-red-700",
        text: "text-red-600",
        lightBg: "bg-red-50",
        glow: "shadow-red-500/20",
      },
      purple: {
        border: "border-purple-500",
        bg: "bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700",
        text: "text-purple-600",
        lightBg: "bg-purple-50",
        glow: "shadow-purple-500/20",
      },
      pink: {
        border: "border-pink-500",
        bg: "bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700",
        text: "text-pink-600",
        lightBg: "bg-pink-50",
        glow: "shadow-pink-500/20",
      },
      cyan: {
        border: "border-cyan-500",
        bg: "bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700",
        text: "text-cyan-600",
        lightBg: "bg-cyan-50",
        glow: "shadow-cyan-500/20",
      },
      indigo: {
        border: "border-indigo-500",
        bg: "bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700",
        text: "text-indigo-600",
        lightBg: "bg-indigo-50",
        glow: "shadow-indigo-500/20",
      },
    };

    const colors = colorClasses[color] || colorClasses.blue;

    return (
      <div
        className={`bg-gradient-to-br from-white via-white to-${color}-50/20 border-2 ${colors.border} rounded-2xl p-5 sm:p-7 hover:shadow-2xl hover:${colors.glow} transition-all duration-500 hover:-translate-y-3 hover:scale-[1.02] relative overflow-hidden group cursor-pointer`}
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 40px)",
            }}
          ></div>
        </div>

        {/* Decorative Gradient Orbs */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-transparent via-gray-100/30 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-transparent via-gray-100/20 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform duration-700"></div>

        <div className="flex items-start justify-between mb-4 relative z-10">
          <div className="flex-1">
            <p
              className={`text-xs font-black ${colors.text} uppercase tracking-widest mb-3 flex items-center gap-2`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              {title}
            </p>
            <div className="flex items-baseline gap-3 flex-wrap mb-2">
              <p className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 group-hover:scale-105 transition-transform">
                {value}
              </p>
            </div>
            {subtitle && (
              <p className="text-sm text-gray-700 font-bold mt-2 flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                {subtitle}
              </p>
            )}
            {description && (
              <p className="text-xs text-gray-600 mt-3 leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-300 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <Icon className="h-7 w-7 sm:h-8 sm:w-8 text-white relative z-10 group-hover:rotate-12 transition-transform" />
          </div>
        </div>
        {trendValue && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t-2 border-gray-200 relative z-10">
            {trend === "up" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                <FiTrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-black text-green-700">
                  {trendValue}
                </span>
                <span className="text-xs text-green-600 font-semibold">
                  growth
                </span>
              </div>
            )}
            {trend === "down" && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                <FiTrendingDown className="h-4 w-4 text-red-600" />
                <span className="text-sm font-black text-red-700">
                  {trendValue}
                </span>
                <span className="text-xs text-red-600 font-semibold">
                  decline
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-blue-500 rounded-xl p-4 shadow-2xl backdrop-blur-sm">
          <p className="font-black mb-3 text-gray-900 text-base border-b-2 border-gray-200 pb-2">
            {label}
          </p>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4 p-2 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: entry.color }}
                  ></span>
                  <span className="text-sm font-semibold text-gray-700">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-black text-gray-900">
                  {typeof entry.value === "number"
                    ? entry.value.toLocaleString()
                    : entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Data validation helper
  const safeGet = (obj: any, path: string, defaultValue: any = 0) => {
    try {
      return path.split(".").reduce((o, p) => o?.[p], obj) ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const ChartContainer = ({
    title,
    children,
    onExpand,
    isExpanded,
    color = "purple",
  }: any) => {
    const colorMap: any = {
      purple:
        "border-purple-500 from-purple-600 to-pink-600 text-purple-600 hover:bg-purple-50",
      blue: "border-blue-500 from-blue-600 to-cyan-600 text-blue-600 hover:bg-blue-50",
      green:
        "border-green-500 from-green-600 to-emerald-600 text-green-600 hover:bg-green-50",
      amber:
        "border-amber-500 from-amber-600 to-orange-600 text-amber-600 hover:bg-amber-50",
      red: "border-red-500 from-red-600 to-pink-600 text-red-600 hover:bg-red-50",
      cyan: "border-cyan-500 from-cyan-600 to-blue-600 text-cyan-600 hover:bg-cyan-50",
      indigo:
        "border-indigo-500 from-indigo-600 to-purple-600 text-indigo-600 hover:bg-indigo-50",
    };
    const colors = colorMap[color] || colorMap.purple;

    return (
      <div
        className={`bg-white border-2 ${
          colors.split(" ")[0]
        } rounded-2xl shadow-xl p-5 sm:p-7 hover:shadow-2xl transition-all duration-300 group ${
          isExpanded
            ? "fixed inset-4 z-50 overflow-auto backdrop-blur-sm bg-white/95"
            : ""
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 bg-gradient-to-br ${colors
                .split(" ")
                .slice(1, 3)
                .join(
                  " "
                )} rounded-xl flex items-center justify-center shadow-lg`}
            >
              <FiBarChart2 className="h-5 w-5 text-white" />
            </div>
            <h3
              className={`text-lg sm:text-xl font-black bg-gradient-to-r ${colors
                .split(" ")
                .slice(1, 3)
                .join(" ")} bg-clip-text text-transparent`}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onExpand}
            className={`p-2 ${colors.split(" ")[4]} rounded-xl transition-all ${
              colors.split(" ")[3]
            } hover:scale-110`}
          >
            {isExpanded ? (
              <FiMinimize2 className="h-5 w-5" />
            ) : (
              <FiMaximize2 className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="relative">{children}</div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-pink-50 via-purple-50 relative overflow-x-hidden">
      <Toaster position="top-center" />

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Floating Action Menu - Enhanced */}
      <div className="fixed bottom-8 right-8 z-50 flex flex-col gap-3">
        {/* Quick Actions Menu */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              fetchGlobalStats();
              fetchAlerts();
              toast.success("🔄 Refreshing all data...");
            }}
            className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center group backdrop-blur-sm border-2 border-white/20"
            title="Refresh All Data"
          >
            <FiRefreshCw className="h-6 w-6 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button
            onClick={() => {
              setActiveSection("alerts");
              fetchAlerts();
            }}
            className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center group backdrop-blur-sm border-2 border-white/20 relative"
            title="View Alerts"
          >
            <FiAlertCircle className="h-6 w-6" />
            {alerts &&
              alerts.notSucceed.count +
                alerts.notYetMoreThan5Days.count +
                alerts.absent5ConsecutiveDays.count >
                0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 rounded-full text-xs font-black flex items-center justify-center border-2 border-red-500">
                  {alerts.notSucceed.count +
                    alerts.notYetMoreThan5Days.count +
                    alerts.absent5ConsecutiveDays.count}
                </span>
              )}
          </button>
          <button
            onClick={exportToCSV}
            className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-110 flex items-center justify-center group backdrop-blur-sm border-2 border-white/20"
            title="Export Data"
          >
            <FiDownload className="h-6 w-6 group-hover:translate-y-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Loading indicator when refreshing - Enhanced */}
      {(statsLoading || alertsLoading) && (
        <div className="fixed top-20 right-8 z-50 bg-white/95 backdrop-blur-md border-2 border-blue-500 rounded-2xl shadow-2xl p-5 animate-slide-in-right">
          <div className="flex items-center gap-4">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 border-3 border-blue-200 rounded-full"></div>
              <div className="absolute inset-0 border-3 border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm">
                {statsLoading && alertsLoading
                  ? "Loading all data..."
                  : statsLoading
                  ? "Loading analytics..."
                  : "Loading alerts..."}
              </p>
              <p className="text-xs text-gray-600 font-semibold">
                Please wait...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Header - ULTRA ENHANCED */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,.1) 10px, rgba(255,255,255,.1) 20px)",
            }}
          ></div>
        </div>

        {/* Floating Particles Effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${i * 0.5}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 relative z-10">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/30">
                  <span className="text-2xl sm:text-3xl">📊</span>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-white mb-1 flex items-center gap-3">
                    Student Analytics Dashboard
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-400/90 backdrop-blur-sm rounded-full text-xs font-bold text-white shadow-lg">
                      <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                      Live
                    </span>
                  </h1>
                  <p className="text-sm sm:text-base text-white/90 font-semibold flex items-center gap-2">
                    <FiActivity className="h-4 w-4" />
                    Comprehensive insights, attendance tracking, and data-driven
                    reports
                  </p>
                </div>
              </div>

              {/* Quick Stats Bar */}
              {stats && (
                <div className="flex flex-wrap items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                    <FiUsers className="h-4 w-4 text-white" />
                    <span className="text-white font-bold text-sm">
                      {stats.overview.totalStudents.toLocaleString()} Total
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                    <FiCheckCircle className="h-4 w-4 text-green-300" />
                    <span className="text-white font-bold text-sm">
                      {stats.overview.totalActive.toLocaleString()} Active
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={fetchGlobalStats}
                className="group px-5 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 flex items-center gap-2 font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 border border-white/30"
              >
                <FiRefreshCw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button
                onClick={generatePDFReport}
                className="group px-5 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 flex items-center gap-2 font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105 border border-white/30"
              >
                <FiPrinter className="h-5 w-5" />
                <span className="hidden sm:inline">Report</span>
              </button>
              <button
                onClick={exportToCSV}
                className="group px-5 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-xl hover:from-green-500 hover:to-emerald-600 flex items-center gap-2 font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <FiDownload className="h-5 w-5 group-hover:translate-y-1 transition-transform" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
        {/* Navigation Tabs - ULTRA ENHANCED */}
        <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-2xl p-4 hover:shadow-3xl transition-all">
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {[
              {
                id: "dashboard",
                label: "Overview",
                color: "blue",
                icon: FiPieChart,
              },
              {
                id: "alerts",
                label: "Alerts",
                color: "red",
                icon: FiAlertCircle,
                badge:
                  alerts?.notSucceed?.count +
                  alerts?.notYetMoreThan5Days?.count +
                  alerts?.absent5ConsecutiveDays?.count,
              },
              {
                id: "attendance",
                label: "Attendance",
                color: "green",
                icon: FiCalendar,
              },
              {
                id: "trends",
                label: "Trends",
                color: "purple",
                icon: FiTrendingUp,
              },
              {
                id: "distribution",
                label: "Distribution",
                color: "pink",
                icon: FiLayers,
              },
              {
                id: "performance",
                label: "Performance",
                color: "cyan",
                icon: FiTarget,
              },
              {
                id: "students",
                label: "Students",
                color: "indigo",
                icon: FiUsers,
              },
            ].map((section) => {
              const isActive = activeSection === section.id;
              const Icon = section.icon;
              const colorMap: any = {
                blue: {
                  active:
                    "bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white shadow-blue-500/50",
                  inactive:
                    "text-blue-600 hover:bg-blue-50 border-2 border-blue-200",
                },
                green: {
                  active:
                    "bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white shadow-green-500/50",
                  inactive:
                    "text-green-600 hover:bg-green-50 border-2 border-green-200",
                },
                purple: {
                  active:
                    "bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white shadow-purple-500/50",
                  inactive:
                    "text-purple-600 hover:bg-purple-50 border-2 border-purple-200",
                },
                amber: {
                  active:
                    "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-amber-500/50",
                  inactive:
                    "text-amber-600 hover:bg-amber-50 border-2 border-amber-200",
                },
                pink: {
                  active:
                    "bg-gradient-to-r from-pink-500 via-pink-600 to-pink-700 text-white shadow-pink-500/50",
                  inactive:
                    "text-pink-600 hover:bg-pink-50 border-2 border-pink-200",
                },
                cyan: {
                  active:
                    "bg-gradient-to-r from-cyan-500 via-cyan-600 to-cyan-700 text-white shadow-cyan-500/50",
                  inactive:
                    "text-cyan-600 hover:bg-cyan-50 border-2 border-cyan-200",
                },
                indigo: {
                  active:
                    "bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-indigo-500/50",
                  inactive:
                    "text-indigo-600 hover:bg-indigo-50 border-2 border-indigo-200",
                },
                red: {
                  active:
                    "bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white shadow-red-500/50",
                  inactive:
                    "text-red-600 hover:bg-red-50 border-2 border-red-200",
                },
              };

              const colors = colorMap[section.color] || colorMap.blue;

              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`group px-4 py-3 sm:px-6 sm:py-3.5 rounded-xl font-black transition-all text-sm sm:text-base relative overflow-hidden flex items-center gap-2 ${
                    isActive
                      ? `${colors.active} shadow-2xl transform scale-105`
                      : `${colors.inactive} hover:scale-105 hover:shadow-lg`
                  }`}
                >
                  {isActive && (
                    <>
                      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></span>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    </>
                  )}
                  <Icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      isActive ? "text-white" : ""
                    } group-hover:scale-110 transition-transform`}
                  />
                  <span className="relative z-10">{section.label}</span>
                  {section.badge && section.badge > 0 && (
                    <span
                      className={`relative z-10 px-2 py-0.5 rounded-full text-xs font-black ${
                        isActive
                          ? "bg-white/30 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {section.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Section */}
        {activeSection === "dashboard" && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Executive Summary - ULTRA ENHANCED */}
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-6 sm:p-10 shadow-2xl text-white relative overflow-hidden">
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-white/20 rounded-full animate-float"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${i * 0.3}s`,
                      animationDuration: `${4 + Math.random() * 2}s`,
                    }}
                  />
                ))}
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl">
                      <FiPieChart className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl sm:text-4xl font-black mb-1">
                        📊 Executive Summary
                      </h2>
                      <p className="text-white/80 text-sm font-semibold">
                        Real-time overview of key metrics
                      </p>
                    </div>
                  </div>
                  <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm font-bold">Live Data</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="group text-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <p className="text-5xl sm:text-6xl font-black mb-2 group-hover:scale-110 transition-transform">
                        {formatNumber(stats?.overview?.totalStudents)}
                      </p>
                      <p className="text-sm font-bold text-white/90 mb-1">
                        Total Students
                      </p>
                      <p className="text-xs text-white/70">
                        All enrolled students
                      </p>
                    </div>
                  </div>
                  <div className="group text-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <p className="text-5xl sm:text-6xl font-black mb-2 text-green-300 group-hover:scale-110 transition-transform">
                        {stats?.overview?.activeRate || "0"}%
                      </p>
                      <p className="text-sm font-bold text-white/90 mb-1">
                        Active Rate
                      </p>
                      <p className="text-xs text-white/70">Learning actively</p>
                    </div>
                  </div>
                  <div className="group text-center p-5 bg-white/10 backdrop-blur-md rounded-2xl border-2 border-white/20 hover:bg-white/20 hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="relative z-10">
                      <p className="text-5xl sm:text-6xl font-black mb-2 text-blue-300 group-hover:scale-110 transition-transform">
                        {stats?.attendance?.monthly?.attendanceRate || "0"}%
                      </p>
                      <p className="text-sm font-bold text-white/90 mb-1">
                        Attendance Rate
                      </p>
                      <p className="text-xs text-white/70">This month's rate</p>
                    </div>
                  </div>
                </div>

                {/* Quick Insights - Enhanced */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="group flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <FiTrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm mb-1">
                        Growth This Month
                      </p>
                      <p className="text-xs text-white/80 font-semibold">
                        +{stats?.monthly?.netGrowth || 0} net student growth
                      </p>
                    </div>
                    <FiArrowLeft className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                  <div className="group flex items-center gap-4 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 hover:bg-white/20 hover:scale-105 transition-all cursor-pointer">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <FiAward className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-sm mb-1">Retention Rate</p>
                      <p className="text-xs text-white/80 font-semibold">
                        {stats?.monthly?.retentionRate || "0"}% staying enrolled
                      </p>
                    </div>
                    <FiArrowLeft className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                📈 Key Performance Indicators
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCard
                  title="Total Students"
                  value={stats.overview.totalStudents.toLocaleString()}
                  icon={FiUsers}
                  color="blue"
                  trend={
                    parseFloat(stats.growth.registrationGrowthRate) > 0
                      ? "up"
                      : "down"
                  }
                  trendValue={`${stats.growth.registrationGrowthRate}% MoM`}
                  subtitle="All enrolled students"
                  description="Total number of students registered in the system across all statuses and programs."
                />
                <MetricCard
                  title="Active Students"
                  value={stats.overview.totalActive.toLocaleString()}
                  icon={FiCheckCircle}
                  color="green"
                  subtitle={`${stats.overview.activeRate}% of total`}
                  description="Students currently active and participating in learning programs."
                />
                <MetricCard
                  title="Prospects"
                  value={stats.overview.totalNotYet.toLocaleString()}
                  icon={FiClock}
                  color="amber"
                  subtitle="Awaiting activation"
                  description="Registered students who haven't started their learning journey yet."
                />
                <MetricCard
                  title="Retention Rate"
                  value={`${stats.monthly.retentionRate}%`}
                  icon={FiAward}
                  color="purple"
                  subtitle="Monthly retention"
                  description="Percentage of students who continue their enrollment month over month."
                />
              </div>
            </div>

            {/* Monthly Performance */}
            <div>
              <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
                📅 This Month's Performance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
                <MetricCard
                  title="New Registrations"
                  value={stats.monthly.registered}
                  icon={FiUserPlus}
                  color="green"
                  trend={
                    parseFloat(stats.growth.registrationGrowthRate) > 0
                      ? "up"
                      : "down"
                  }
                  trendValue={`${stats.growth.registrationGrowthRate}%`}
                  description="New students who registered this month"
                />
                <MetricCard
                  title="Started Learning"
                  value={stats.monthly.started}
                  icon={FiUserCheck}
                  color="blue"
                  trend={
                    parseFloat(stats.growth.activationGrowthRate) > 0
                      ? "up"
                      : "down"
                  }
                  trendValue={`${stats.growth.activationGrowthRate}%`}
                  description="Students who began their classes this month"
                />
                <MetricCard
                  title="Students Left"
                  value={stats.monthly.left}
                  icon={FiUserMinus}
                  color="red"
                  subtitle="Exited this month"
                  description="Students who discontinued their enrollment"
                />
                <MetricCard
                  title="Net Growth"
                  value={
                    stats.monthly.netGrowth > 0
                      ? `+${stats.monthly.netGrowth}`
                      : stats.monthly.netGrowth
                  }
                  icon={FiActivity}
                  color={stats.monthly.netGrowth > 0 ? "green" : "red"}
                  trend={
                    stats.monthly.netGrowth > 0
                      ? "up"
                      : stats.monthly.netGrowth < 0
                      ? "down"
                      : "neutral"
                  }
                  description="Overall student population change"
                />
                <MetricCard
                  title="Conversion Rate"
                  value={`${stats.monthly.conversionRate}%`}
                  icon={FiTarget}
                  color="purple"
                  subtitle="Prospect → Active"
                  description="Rate of converting prospects to active students"
                />
                <MetricCard
                  title="Churn Rate"
                  value={`${stats.monthly.churnRate}%`}
                  icon={FiChurn}
                  color="amber"
                  subtitle="Monthly attrition"
                  description="Percentage of students leaving the program"
                />
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Engagement */}
              <div className="bg-white border-2 border-cyan-500 rounded-xl shadow-xl p-4 sm:p-6 hover:shadow-2xl transition-all">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <FiZap className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Engagement Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiPhone className="h-5 w-5 text-cyan-600" />
                      <span className="font-semibold text-sm sm:text-base">
                        Phone Contact
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg sm:text-xl text-cyan-600">
                        {stats.engagement.withPhone}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.engagement.contactRate}%
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiMessageCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-sm sm:text-base">
                        Telegram
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg sm:text-xl text-blue-600">
                        {stats.engagement.withTelegram}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.engagement.telegramRate}%
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FiGift className="h-5 w-5 text-purple-600" />
                      <span className="font-semibold text-sm sm:text-base">
                        Referrals
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-lg sm:text-xl text-purple-600">
                        {stats.engagement.withReferral}
                      </p>
                      <p className="text-xs text-gray-500">
                        {stats.engagement.referralRate}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assignment Status */}
              <div className="bg-white border-2 border-indigo-500 rounded-xl shadow-xl p-4 sm:p-6 hover:shadow-2xl transition-all">
                <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <FiAward className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  Teacher Assignment
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold text-sm">
                        Assignment Rate
                      </span>
                      <span className="font-bold text-indigo-600">
                        {stats.assignments.assignmentRate}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-4 rounded-full transition-all duration-1000"
                        style={{
                          width: `${stats.assignments.assignmentRate}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 border-2 border-indigo-500 bg-indigo-50 rounded-lg">
                      <p className="text-2xl font-black text-indigo-600">
                        {stats.assignments.assigned}
                      </p>
                      <p className="text-xs text-gray-600">With Ustaz</p>
                    </div>
                    <div className="text-center p-3 border-2 border-gray-300 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-black text-gray-600">
                        {stats.assignments.unassigned}
                      </p>
                      <p className="text-xs text-gray-500">Unassigned</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Lifecycle Funnel - COMPLETELY REDESIGNED */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-300 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-2">
                    🎯 Student Lifecycle Funnel Analysis
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">
                    Track the complete student journey from prospects to active
                    learners
                  </p>
                </div>
                <button
                  onClick={() =>
                    setExpandedChart(
                      expandedChart === "lifecycle" ? null : "lifecycle"
                    )
                  }
                  className="p-2 hover:bg-purple-100 rounded-lg transition-colors text-purple-600"
                >
                  {expandedChart === "lifecycle" ? (
                    <FiMinimize2 className="h-5 w-5" />
                  ) : (
                    <FiMaximize2 className="h-5 w-5" />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Funnel Progress */}
                <div className="space-y-6">
                  {/* Stage 1: Total Prospects */}
                  <div className="relative">
                    <div className="flex justify-between mb-3">
                      <span className="font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                          1
                        </div>
                        Total Prospects
                      </span>
                      <span className="font-black text-2xl text-blue-600">
                        {stats.lifecycle.prospects.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-xl h-14 shadow-2xl overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-14 flex items-center justify-between px-5 text-white font-bold text-lg shadow-2xl transition-all duration-1000 relative"
                        style={{ width: "100%" }}
                      >
                        <span className="flex items-center gap-2">
                          <FiUsers className="h-5 w-5" />
                          BASE PROSPECTS
                        </span>
                        <span className="text-xl font-black">100%</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 italic">
                      All students who have shown interest or registered
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <FiTrendingDown className="h-6 w-6 text-gray-400 animate-bounce" />
                  </div>

                  {/* Stage 2: Active Students */}
                  <div className="relative">
                    <div className="flex justify-between mb-3">
                      <span className="font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                          2
                        </div>
                        Active Students
                      </span>
                      <span className="font-black text-2xl text-green-600">
                        {stats.lifecycle.active.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-xl h-14 shadow-2xl overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 via-green-600 to-green-700 h-14 flex items-center justify-between px-5 text-white font-bold text-lg shadow-2xl transition-all duration-1000 relative"
                        style={{
                          width: `${
                            (stats.lifecycle.active /
                              stats.lifecycle.prospects) *
                            100
                          }%`,
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <FiCheckCircle className="h-5 w-5" />
                          ACTIVE STUDENTS
                        </span>
                        <span className="text-xl font-black">
                          {stats.lifecycle.conversionRate}%
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <p className="text-xs text-green-600 mt-2 font-semibold">
                      ✅ Conversion Rate: {stats.lifecycle.conversionRate}% |
                      Successfully converted to active learners
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-center">
                    <FiTrendingDown className="h-6 w-6 text-gray-400 animate-bounce" />
                  </div>

                  {/* Stage 3: Churned Students */}
                  <div className="relative">
                    <div className="flex justify-between mb-3">
                      <span className="font-bold text-gray-800 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center text-white font-black text-sm">
                          ⚠
                        </div>
                        Churned Students
                      </span>
                      <span className="font-black text-2xl text-red-600">
                        {stats.lifecycle.churned.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-xl h-14 shadow-2xl overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 h-14 flex items-center justify-between px-5 text-white font-bold text-lg shadow-2xl transition-all duration-1000 relative"
                        style={{
                          width: `${
                            (stats.lifecycle.churned /
                              stats.lifecycle.prospects) *
                            100
                          }%`,
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <FiAlertCircle className="h-5 w-5" />
                          CHURNED
                        </span>
                        <span className="text-xl font-black">
                          {stats.lifecycle.churnRate}%
                        </span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                    <p className="text-xs text-red-600 mt-2 font-semibold">
                      ⚠️ Churn Rate: {stats.lifecycle.churnRate}% | Students who
                      left the program
                    </p>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t-2 border-purple-200">
                    <div className="text-center p-3 bg-blue-50 border-2 border-blue-500 rounded-xl">
                      <p className="text-xs font-bold text-blue-600 uppercase mb-1">
                        Prospects
                      </p>
                      <p className="text-2xl font-black text-blue-600">
                        {stats.lifecycle.prospects}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-green-50 border-2 border-green-500 rounded-xl">
                      <p className="text-xs font-bold text-green-600 uppercase mb-1">
                        Active
                      </p>
                      <p className="text-2xl font-black text-green-600">
                        {stats.lifecycle.active}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-amber-50 border-2 border-amber-500 rounded-xl">
                      <p className="text-xs font-bold text-amber-600 uppercase mb-1">
                        Lifetime
                      </p>
                      <p className="text-2xl font-black text-amber-600">
                        {stats.lifecycle.avgLifetimeMonths}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Visual Charts & Analytics */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Funnel Bar Chart */}
                  <div className="bg-white rounded-xl p-6 shadow-xl border-2 border-indigo-400">
                    <h4 className="font-black text-indigo-700 mb-4 text-lg">
                      📊 Funnel Conversion Visualization
                    </h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart
                        data={[
                          {
                            stage: "Prospects",
                            count: stats.lifecycle.prospects,
                            percentage: 100,
                          },
                          {
                            stage: "Active",
                            count: stats.lifecycle.active,
                            percentage: parseFloat(
                              stats.lifecycle.conversionRate
                            ),
                          },
                          {
                            stage: "Churned",
                            count: stats.lifecycle.churned,
                            percentage: parseFloat(stats.lifecycle.churnRate),
                          },
                        ]}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6366F1" />
                        <YAxis
                          dataKey="stage"
                          type="category"
                          stroke="#6366F1"
                          width={100}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                          <Cell fill="#3B82F6" />
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Donut Chart */}
                  <div className="bg-white rounded-xl p-4 shadow-lg border-2 border-purple-200">
                    <h4 className="font-black text-purple-700 mb-4">
                      🎯 Distribution Overview
                    </h4>
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={[
                            {
                              name: "Active",
                              value: stats.lifecycle.active,
                              label: `Active: ${stats.lifecycle.active}`,
                            },
                            {
                              name: "Prospects",
                              value:
                                stats.lifecycle.prospects -
                                stats.lifecycle.active -
                                stats.lifecycle.churned,
                              label: `Prospects: ${
                                stats.lifecycle.prospects -
                                stats.lifecycle.active -
                                stats.lifecycle.churned
                              }`,
                            },
                            {
                              name: "Churned",
                              value: stats.lifecycle.churned,
                              label: `Churned: ${stats.lifecycle.churned}`,
                            },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          labelLine={false}
                          label={({ label }: any) => label}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill="#10B981" />
                          <Cell fill="#F59E0B" />
                          <Cell fill="#EF4444" />
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Insights Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-4 shadow-lg">
                      <FiCheckCircle className="h-8 w-8 mb-2" />
                      <p className="text-xs font-bold mb-1 text-green-100">
                        Conversion Success
                      </p>
                      <p className="text-2xl font-black">
                        {stats.lifecycle.conversionRate}%
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-xl p-4 shadow-lg">
                      <FiAlertCircle className="h-8 w-8 mb-2" />
                      <p className="text-xs font-bold mb-1 text-red-100">
                        Churn Risk
                      </p>
                      <p className="text-2xl font-black">
                        {stats.lifecycle.churnRate}%
                      </p>
                    </div>
                  </div>

                  {/* Actionable Insights */}
                  <div className="bg-purple-100 border-2 border-purple-400 rounded-xl p-4">
                    <p className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                      <FiZap className="h-5 w-5" />
                      Key Insights
                    </p>
                    <ul className="space-y-2 text-sm text-purple-800">
                      <li className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span>
                          <strong>{stats.lifecycle.conversionRate}%</strong> of
                          prospects convert to active students
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 mt-1">⚡</span>
                        <span>
                          Average student lifetime:{" "}
                          <strong>{stats.lifecycle.avgLifetimeMonths}</strong>{" "}
                          months
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">⚠</span>
                        <span>
                          <strong>{stats.lifecycle.churned}</strong> students
                          have churned - consider retention strategies
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alerts Section */}
        {activeSection === "alerts" && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            {/* Enhanced Header */}
            <div className="bg-gradient-to-br from-red-500 via-orange-500 to-pink-500 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <FiAlertCircle className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black mb-2">
                      ⚠️ Student Alerts & Monitoring
                    </h2>
                    <p className="text-white/90 text-lg">
                      Monitor students requiring immediate attention
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <button
                    onClick={fetchAlerts}
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-bold flex items-center gap-2"
                  >
                    <FiRefreshCw className="h-5 w-5" />
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>

            {alertsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-red-500"></div>
              </div>
            ) : alerts ? (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MetricCard
                    title="Not Succeed Students"
                    value={alerts.notSucceed.count}
                    icon={FiAlertCircle}
                    color="red"
                    subtitle="Requires attention"
                    description={`Students marked as 'Not Succeed' status (last ${
                      alerts?.notSucceed?.months || notSucceedMonths
                    } ${
                      (alerts?.notSucceed?.months || notSucceedMonths) === 1
                        ? "month"
                        : "months"
                    })`}
                  />
                  <MetricCard
                    title="Not Yet > 5 Days"
                    value={alerts.notYetMoreThan5Days.count}
                    icon={FiClock}
                    color="amber"
                    subtitle="Awaiting activation"
                    description="Students in 'Not Yet' status for more than 5 days"
                  />
                  <MetricCard
                    title="Absent 5+ Days"
                    value={alerts.absent5ConsecutiveDays.count}
                    icon={FiUserMinus}
                    color="red"
                    subtitle="Consecutive absences"
                    description="Active students absent for 5 consecutive days"
                  />
                </div>

                {/* Not Succeed Students List - Enhanced */}
                {(() => {
                  const notSucceedData = getPaginatedStudents(
                    alerts.notSucceed.students,
                    alertSearch.notSucceed,
                    alertPage.notSucceed,
                    alertLimit
                  );
                  const isExpanded = expandedAlert === "notSucceed";

                  return (
                    <div className="bg-white border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all">
                      <div className="px-6 py-5 bg-gradient-to-br from-red-600 via-red-700 to-red-800 border-b-2 border-red-900">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              <FiAlertCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white flex items-center gap-2">
                                Not Succeed Students
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                                  {alerts.notSucceed.count}
                                </span>
                              </h3>
                              <p className="text-red-100 text-sm mt-1">
                                {notSucceedData.total}{" "}
                                {alertSearch.notSucceed ? "found" : "total"}{" "}
                                students from last{" "}
                                {alerts?.notSucceed?.months || notSucceedMonths}{" "}
                                {(alerts?.notSucceed?.months ||
                                  notSucceedMonths) === 1
                                  ? "month"
                                  : "months"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-red-100 text-sm font-bold whitespace-nowrap">
                                Period:
                              </label>
                              <select
                                value={notSucceedMonths}
                                onChange={(e) => {
                                  setNotSucceedMonths(Number(e.target.value));
                                  setAlertPage({ ...alertPage, notSucceed: 1 });
                                }}
                                className="px-3 py-2 bg-white/20 backdrop-blur-sm border-2 border-white/30 rounded-lg text-white font-bold text-sm focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all cursor-pointer hover:bg-white/30"
                                style={{ color: "white" }}
                              >
                                <option value={1} style={{ color: "black" }}>
                                  1 Month
                                </option>
                                <option value={2} style={{ color: "black" }}>
                                  2 Months
                                </option>
                                <option value={3} style={{ color: "black" }}>
                                  3 Months
                                </option>
                                <option value={6} style={{ color: "black" }}>
                                  6 Months
                                </option>
                                <option value={12} style={{ color: "black" }}>
                                  12 Months
                                </option>
                              </select>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedAlert(
                                  isExpanded ? null : "notSucceed"
                                )
                              }
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                            >
                              {isExpanded ? (
                                <FiMinimize2 className="h-5 w-5" />
                              ) : (
                                <FiMaximize2 className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="relative">
                          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Search by name, ID, phone, or ustaz..."
                            value={alertSearch.notSucceed}
                            onChange={(e) => {
                              setAlertSearch({
                                ...alertSearch,
                                notSucceed: e.target.value,
                              });
                              setAlertPage({ ...alertPage, notSucceed: 1 });
                            }}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-[600px]">
                        {notSucceedData.students.length > 0 ? (
                          <>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Student
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Status
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Ustaz
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Controller
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Contact
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Registered
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {notSucceedData.students.map((student: any) => (
                                  <tr
                                    key={student.id}
                                    className="hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all cursor-pointer group"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                          <FiUser className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-black text-gray-900">
                                            {student.name}
                                          </div>
                                          <div className="text-xs text-gray-500 font-semibold">
                                            ID: {student.id}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex px-3 py-1.5 text-xs font-black rounded-xl bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-2 border-red-300">
                                        {student.status}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.ustazName || (
                                        <span className="text-gray-400 italic">
                                          Unassigned
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.controller ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-lg text-xs font-bold">
                                          <FiUser className="h-3 w-3" />
                                          {student.controller}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic text-xs">
                                          Unassigned
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {student.phone ? (
                                        <div className="flex items-center gap-2">
                                          <FiPhone className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm font-semibold text-gray-700">
                                            {student.phone}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.registrationDate ? (
                                        <div className="flex items-center gap-2">
                                          <FiCalendar className="h-4 w-4 text-gray-400" />
                                          {format(
                                            parseISO(student.registrationDate),
                                            "MMM dd, yyyy"
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Pagination */}
                            {notSucceedData.totalPages > 1 && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm font-semibold text-gray-700">
                                  Showing{" "}
                                  {(alertPage.notSucceed - 1) * alertLimit + 1}{" "}
                                  to{" "}
                                  {Math.min(
                                    alertPage.notSucceed * alertLimit,
                                    notSucceedData.total
                                  )}{" "}
                                  of {notSucceedData.total} students
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      setAlertPage({
                                        ...alertPage,
                                        notSucceed: Math.max(
                                          1,
                                          alertPage.notSucceed - 1
                                        ),
                                      })
                                    }
                                    disabled={alertPage.notSucceed === 1}
                                    className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-50 font-bold transition-all"
                                  >
                                    Previous
                                  </button>
                                  <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-black shadow-lg">
                                    Page {alertPage.notSucceed} of{" "}
                                    {notSucceedData.totalPages}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setAlertPage({
                                        ...alertPage,
                                        notSucceed: Math.min(
                                          notSucceedData.totalPages,
                                          alertPage.notSucceed + 1
                                        ),
                                      })
                                    }
                                    disabled={
                                      alertPage.notSucceed ===
                                      notSucceedData.totalPages
                                    }
                                    className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-50 font-bold transition-all"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-16">
                            <FiCheckCircle className="h-20 w-20 text-green-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-gray-600 mb-2">
                              {alertSearch.notSucceed
                                ? "No Results Found"
                                : "No Not Succeed Students"}
                            </h3>
                            <p className="text-gray-500">
                              {alertSearch.notSucceed
                                ? "Try adjusting your search criteria"
                                : "All students are in good standing."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Not Yet Students > 5 Days List - Enhanced */}
                {(() => {
                  const notYetData = getPaginatedStudents(
                    alerts.notYetMoreThan5Days.students,
                    alertSearch.notYet,
                    alertPage.notYet,
                    alertLimit
                  );
                  const isExpanded = expandedAlert === "notYet";

                  return (
                    <div className="bg-white border-2 border-amber-500 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all">
                      <div className="px-6 py-5 bg-gradient-to-br from-amber-600 via-amber-700 to-orange-700 border-b-2 border-amber-900">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              <FiClock className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white flex items-center gap-2">
                                Not Yet Students &gt; 5 Days
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                                  {alerts.notYetMoreThan5Days.count}
                                </span>
                              </h3>
                              <p className="text-amber-100 text-sm mt-1">
                                {notYetData.total}{" "}
                                {alertSearch.notYet ? "found" : "total"}{" "}
                                students waiting
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setExpandedAlert(isExpanded ? null : "notYet")
                            }
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                          >
                            {isExpanded ? (
                              <FiMinimize2 className="h-5 w-5" />
                            ) : (
                              <FiMaximize2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="relative">
                          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Search by name, ID, phone, or ustaz..."
                            value={alertSearch.notYet}
                            onChange={(e) => {
                              setAlertSearch({
                                ...alertSearch,
                                notYet: e.target.value,
                              });
                              setAlertPage({ ...alertPage, notYet: 1 });
                            }}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-[600px]">
                        {notYetData.students.length > 0 ? (
                          <>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Student
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Days Waiting
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Ustaz
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Controller
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Contact
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Registered
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {notYetData.students.map((student: any) => (
                                  <tr
                                    key={student.id}
                                    className="hover:bg-gradient-to-r hover:from-amber-50 hover:to-orange-50 transition-all cursor-pointer group"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                          <FiUser className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-black text-gray-900">
                                            {student.name}
                                          </div>
                                          <div className="text-xs text-gray-500 font-semibold">
                                            ID: {student.id}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex px-4 py-2 text-sm font-black rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-2 border-amber-300">
                                        {student.daysSinceRegistration} days
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.ustazName || (
                                        <span className="text-gray-400 italic">
                                          Unassigned
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.controller ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-lg text-xs font-bold">
                                          <FiUser className="h-3 w-3" />
                                          {student.controller}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic text-xs">
                                          Unassigned
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {student.phone ? (
                                        <div className="flex items-center gap-2">
                                          <FiPhone className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm font-semibold text-gray-700">
                                            {student.phone}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.registrationDate ? (
                                        <div className="flex items-center gap-2">
                                          <FiCalendar className="h-4 w-4 text-gray-400" />
                                          {format(
                                            parseISO(student.registrationDate),
                                            "MMM dd, yyyy"
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Pagination */}
                            {notYetData.totalPages > 1 && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm font-semibold text-gray-700">
                                  Showing{" "}
                                  {(alertPage.notYet - 1) * alertLimit + 1} to{" "}
                                  {Math.min(
                                    alertPage.notYet * alertLimit,
                                    notYetData.total
                                  )}{" "}
                                  of {notYetData.total} students
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      setAlertPage({
                                        ...alertPage,
                                        notYet: Math.max(
                                          1,
                                          alertPage.notYet - 1
                                        ),
                                      })
                                    }
                                    disabled={alertPage.notYet === 1}
                                    className="px-4 py-2 border-2 border-amber-500 text-amber-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-50 font-bold transition-all"
                                  >
                                    Previous
                                  </button>
                                  <span className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-black shadow-lg">
                                    Page {alertPage.notYet} of{" "}
                                    {notYetData.totalPages}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setAlertPage({
                                        ...alertPage,
                                        notYet: Math.min(
                                          notYetData.totalPages,
                                          alertPage.notYet + 1
                                        ),
                                      })
                                    }
                                    disabled={
                                      alertPage.notYet === notYetData.totalPages
                                    }
                                    className="px-4 py-2 border-2 border-amber-500 text-amber-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-amber-50 font-bold transition-all"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-16">
                            <FiCheckCircle className="h-20 w-20 text-green-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-gray-600 mb-2">
                              {alertSearch.notYet
                                ? "No Results Found"
                                : "No Students Waiting"}
                            </h3>
                            <p className="text-gray-500">
                              {alertSearch.notYet
                                ? "Try adjusting your search criteria"
                                : "All 'Not Yet' students have been registered recently."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Absent 5 Consecutive Days List - Enhanced */}
                {(() => {
                  const absentData = getPaginatedStudents(
                    alerts.absent5ConsecutiveDays.students,
                    alertSearch.absent,
                    alertPage.absent,
                    alertLimit
                  );
                  const isExpanded = expandedAlert === "absent";

                  return (
                    <div className="bg-white border-2 border-red-500 rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all">
                      <div className="px-6 py-5 bg-gradient-to-br from-red-600 via-red-700 to-pink-700 border-b-2 border-red-900">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                              <FiUserMinus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-black text-white flex items-center gap-2">
                                Absent 5+ Consecutive Days
                                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-lg text-sm">
                                  {alerts.absent5ConsecutiveDays.count}
                                </span>
                              </h3>
                              <p className="text-red-100 text-sm mt-1">
                                {absentData.total}{" "}
                                {alertSearch.absent ? "found" : "total"}{" "}
                                students with consecutive absences
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              setExpandedAlert(isExpanded ? null : "absent")
                            }
                            className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                          >
                            {isExpanded ? (
                              <FiMinimize2 className="h-5 w-5" />
                            ) : (
                              <FiMaximize2 className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-gray-50 border-b border-gray-200">
                        <div className="relative">
                          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <input
                            type="text"
                            placeholder="Search by name, ID, phone, or ustaz..."
                            value={alertSearch.absent}
                            onChange={(e) => {
                              setAlertSearch({
                                ...alertSearch,
                                absent: e.target.value,
                              });
                              setAlertPage({ ...alertPage, absent: 1 });
                            }}
                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto max-h-[600px]">
                        {absentData.students.length > 0 ? (
                          <>
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
                                <tr>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Student
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Consecutive Days
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Ustaz
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Controller
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Contact
                                  </th>
                                  <th className="px-6 py-4 text-left text-xs font-black text-gray-900 uppercase tracking-wider">
                                    Start Date
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {absentData.students.map((student: any) => (
                                  <tr
                                    key={student.id}
                                    className="hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all cursor-pointer group"
                                  >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="w-12 h-12 bg-gradient-to-br from-red-400 to-red-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                          <FiUser className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-black text-gray-900">
                                            {student.name}
                                          </div>
                                          <div className="text-xs text-gray-500 font-semibold">
                                            ID: {student.id}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="inline-flex px-4 py-2 text-sm font-black rounded-xl bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border-2 border-red-300">
                                        {student.consecutiveAbsentDays} days
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.ustazName || (
                                        <span className="text-gray-400 italic">
                                          Unassigned
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.controller ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-lg text-xs font-bold">
                                          <FiUser className="h-3 w-3" />
                                          {student.controller}
                                        </span>
                                      ) : (
                                        <span className="text-gray-400 italic text-xs">
                                          Unassigned
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      {student.phone ? (
                                        <div className="flex items-center gap-2">
                                          <FiPhone className="h-4 w-4 text-gray-400" />
                                          <span className="text-sm font-semibold text-gray-700">
                                            {student.phone}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                                      {student.startDate ? (
                                        <div className="flex items-center gap-2">
                                          <FiCalendar className="h-4 w-4 text-gray-400" />
                                          {format(
                                            parseISO(student.startDate),
                                            "MMM dd, yyyy"
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-gray-400 italic">
                                          N/A
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Pagination */}
                            {absentData.totalPages > 1 && (
                              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm font-semibold text-gray-700">
                                  Showing{" "}
                                  {(alertPage.absent - 1) * alertLimit + 1} to{" "}
                                  {Math.min(
                                    alertPage.absent * alertLimit,
                                    absentData.total
                                  )}{" "}
                                  of {absentData.total} students
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      setAlertPage({
                                        ...alertPage,
                                        absent: Math.max(
                                          1,
                                          alertPage.absent - 1
                                        ),
                                      })
                                    }
                                    disabled={alertPage.absent === 1}
                                    className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-50 font-bold transition-all"
                                  >
                                    Previous
                                  </button>
                                  <span className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-black shadow-lg">
                                    Page {alertPage.absent} of{" "}
                                    {absentData.totalPages}
                                  </span>
                                  <button
                                    onClick={() =>
                                      setAlertPage({
                                        ...alertPage,
                                        absent: Math.min(
                                          absentData.totalPages,
                                          alertPage.absent + 1
                                        ),
                                      })
                                    }
                                    disabled={
                                      alertPage.absent === absentData.totalPages
                                    }
                                    className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-50 font-bold transition-all"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-center py-16">
                            <FiCheckCircle className="h-20 w-20 text-green-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-gray-600 mb-2">
                              {alertSearch.absent
                                ? "No Results Found"
                                : "No Absence Issues"}
                            </h3>
                            <p className="text-gray-500">
                              {alertSearch.absent
                                ? "Try adjusting your search criteria"
                                : "No students have been absent for 5 consecutive days."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-12">
                <FiAlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  Failed to Load Alerts
                </h3>
                <button
                  onClick={fetchAlerts}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold mt-4"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Attendance Section */}
        {activeSection === "attendance" && (
          <FeatureGate
            feature="basic_reporting"
            fallback={
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border-2 border-blue-200">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FiBarChart className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 mb-2">
                    📊 Advanced Reporting Required
                  </h3>
                  <p className="text-blue-700 mb-4">
                    Attendance & Absence Analytics is a premium feature that provides detailed insights into student attendance patterns and trends.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-blue-200 max-w-md mx-auto">
                    <h4 className="font-semibold text-blue-800 mb-2">Premium Features Include:</h4>
                    <ul className="text-sm text-blue-700 space-y-1 text-left">
                      <li>• 📈 Monthly attendance trends</li>
                      <li>• 📊 Absence pattern analysis</li>
                      <li>• 🎯 Attendance rate calculations</li>
                      <li>• 📋 Detailed reporting dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            }
          >
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <h2 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
              📋 Student Attendance & Absence Analytics
            </h2>

            {/* Data Status Alert */}
            {stats.attendance.monthly.total === 0 && (
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 border-2 border-amber-400 rounded-2xl p-6 shadow-xl animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiAlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-amber-900 mb-2">
                      ⚠️ No Attendance Data Available
                    </h4>
                    <p className="text-amber-800 font-semibold">
                      The attendance tracking system is ready, but no records
                      have been created yet. Once teachers start recording
                      attendance, the data will automatically appear here.
                    </p>
                    <p className="text-sm text-amber-700 mt-2">
                      <strong>Note:</strong> Attendance data should be recorded
                      in the `student_attendance_progress` table.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Data Status */}
            {stats.payments.currentMonth.totalStudents === 0 && (
              <div className="bg-gradient-to-r from-red-100 to-pink-100 border-2 border-red-400 rounded-2xl p-6 shadow-xl animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiDollarSign className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-black text-red-900 mb-2">
                      ⚠️ No Payment Data for Current Month
                    </h4>
                    <p className="text-red-800 font-semibold">
                      No payment records found for{" "}
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                      . Payment data is pulled from the `months_table` with the
                      current month format.
                    </p>
                    <p className="text-sm text-red-700 mt-2">
                      <strong>Current Month Format:</strong>{" "}
                      {`${new Date().getFullYear()}-${String(
                        new Date().getMonth() + 1
                      ).padStart(2, "0")}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Attendance Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <MetricCard
                title="Present This Month"
                value={
                  stats.attendance.monthly.present > 0
                    ? stats.attendance.monthly.present.toLocaleString()
                    : "No Data"
                }
                icon={FiCheckCircle}
                color="green"
                subtitle={
                  stats.attendance.monthly.present > 0
                    ? `${stats.attendance.monthly.attendanceRate}% attendance rate`
                    : "No attendance records found"
                }
                description={
                  stats.attendance.monthly.present > 0
                    ? "Total number of students marked present in classes this month"
                    : "⚠️ No attendance data available. Please ensure attendance records are being created."
                }
              />
              <MetricCard
                title="Absent This Month"
                value={stats.attendance.monthly.absent.toLocaleString()}
                icon={FiAlertCircle}
                color="red"
                subtitle={`${stats.attendance.monthly.absenceRate}% absence rate`}
                description="Students who missed classes without prior notice"
              />
              <MetricCard
                title="Excused Absences"
                value={stats.attendance.monthly.excused.toLocaleString()}
                icon={FiFileText}
                color="amber"
                subtitle="With permission"
                description="Students absent with valid excuses or permissions"
              />
              <MetricCard
                title="Active Attendees"
                value={stats.attendance.monthly.uniqueStudents.toLocaleString()}
                icon={FiUsers}
                color="blue"
                subtitle="Unique students"
                description="Number of distinct students who attended classes"
              />
            </div>

            {/* Attendance Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Attendance Breakdown */}
              <div className="bg-white border-2 border-green-500 rounded-xl p-6 shadow-xl">
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <FiCalendar className="h-6 w-6 text-green-600" />
                  This Month's Attendance
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        {
                          name: "Present",
                          value: stats.attendance.monthly.present,
                          label: `Present: ${stats.attendance.monthly.present} (${stats.attendance.monthly.attendanceRate}%)`,
                        },
                        {
                          name: "Absent",
                          value: stats.attendance.monthly.absent,
                          label: `Absent: ${stats.attendance.monthly.absent} (${stats.attendance.monthly.absenceRate}%)`,
                        },
                        {
                          name: "Excused",
                          value: stats.attendance.monthly.excused,
                          label: `Excused: ${stats.attendance.monthly.excused}`,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label }: any) => label}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill="#10B981" />
                      <Cell fill="#EF4444" />
                      <Cell fill="#F59E0B" />
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 border-2 border-green-500 rounded-lg">
                    <p className="text-2xl font-black text-green-600">
                      {stats.attendance.monthly.attendanceRate}%
                    </p>
                    <p className="text-xs text-gray-600 font-bold">
                      Attendance
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 border-2 border-red-500 rounded-lg">
                    <p className="text-2xl font-black text-red-600">
                      {stats.attendance.monthly.absenceRate}%
                    </p>
                    <p className="text-xs text-gray-600 font-bold">Absence</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 border-2 border-blue-500 rounded-lg">
                    <p className="text-2xl font-black text-blue-600">
                      {stats.attendance.monthly.total}
                    </p>
                    <p className="text-xs text-gray-600 font-bold">Total</p>
                  </div>
                </div>
              </div>

              {/* Overall Attendance Stats */}
              <div className="bg-white border-2 border-blue-500 rounded-xl p-6 shadow-xl">
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                  <FiBarChart2 className="h-6 w-6 text-blue-600" />
                  All-Time Attendance Statistics
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="font-bold text-gray-700 flex items-center gap-2">
                        <FiCheckCircle className="h-5 w-5 text-green-600" />
                        Present Records
                      </span>
                      <span className="font-black text-2xl text-green-600">
                        {stats.attendance.overall.present.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-1000"
                        style={{
                          width: `${stats.attendance.overall.attendanceRate}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.attendance.overall.attendanceRate}% overall
                      attendance rate
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="font-bold text-gray-700 flex items-center gap-2">
                        <FiAlertCircle className="h-5 w-5 text-red-600" />
                        Absent Records
                      </span>
                      <span className="font-black text-2xl text-red-600">
                        {stats.attendance.overall.absent.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-red-500 to-red-600 h-4 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            (stats.attendance.overall.absent /
                              stats.attendance.overall.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(
                        (stats.attendance.overall.absent /
                          stats.attendance.overall.total) *
                        100
                      ).toFixed(1)}
                      % absence rate
                    </p>
                  </div>

                  <div>
                    <div className="flex justify-between mb-3">
                      <span className="font-bold text-gray-700 flex items-center gap-2">
                        <FiFileText className="h-5 w-5 text-amber-600" />
                        Excused Absences
                      </span>
                      <span className="font-black text-2xl text-amber-600">
                        {stats.attendance.overall.excused.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-600 h-4 rounded-full transition-all duration-1000"
                        style={{
                          width: `${
                            (stats.attendance.overall.excused /
                              stats.attendance.overall.total) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {(
                        (stats.attendance.overall.excused /
                          stats.attendance.overall.total) *
                        100
                      ).toFixed(1)}
                      % excused rate
                    </p>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">
                        Total Records
                      </span>
                      <span className="font-black text-3xl text-blue-600">
                        {stats.attendance.overall.total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Absence Analysis */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-300 shadow-xl">
              <h3 className="text-2xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <FiAlertCircle className="h-7 w-7 text-red-600" />
                Detailed Absence Analysis & Tracking
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Absence Breakdown */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-5 border-2 border-red-400 shadow-lg">
                    <h4 className="font-black text-red-700 mb-3 flex items-center gap-2">
                      <FiActivity className="h-5 w-5" />
                      Absence Statistics This Month
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Unexcused Absences
                          </span>
                          <span className="font-black text-red-600 text-lg">
                            {stats.attendance.monthly.absent.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-700"
                            style={{
                              width: `${stats.attendance.monthly.absenceRate}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-red-600 mt-1 font-semibold">
                          {stats.attendance.monthly.absenceRate}% absence rate -
                          Requires immediate attention
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Excused Absences
                          </span>
                          <span className="font-black text-amber-600 text-lg">
                            {stats.attendance.monthly.excused.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-3 rounded-full transition-all duration-700"
                            style={{
                              width: `${
                                (stats.attendance.monthly.excused /
                                  stats.attendance.monthly.total) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-amber-600 mt-1 font-semibold">
                          {(
                            (stats.attendance.monthly.excused /
                              stats.attendance.monthly.total) *
                            100
                          ).toFixed(1)}
                          % excused - With valid permissions
                        </p>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-semibold text-gray-700">
                            Present Records
                          </span>
                          <span className="font-black text-green-600 text-lg">
                            {stats.attendance.monthly.present.toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-700"
                            style={{
                              width: `${stats.attendance.monthly.attendanceRate}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-green-600 mt-1 font-semibold">
                          {stats.attendance.monthly.attendanceRate}% attendance
                          rate - Excellent!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="bg-white rounded-xl p-5 border-2 border-amber-400 shadow-lg">
                    <h4 className="font-black text-amber-700 mb-3 flex items-center gap-2">
                      <FiTarget className="h-5 w-5" />
                      Recommended Actions
                    </h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                        <span className="text-red-600 font-black">1.</span>
                        <span className="text-gray-700">
                          <strong className="text-red-600">
                            {stats.attendance.monthly.absent} students
                          </strong>{" "}
                          with unexcused absences need immediate follow-up calls
                        </span>
                      </li>
                      <li className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg">
                        <span className="text-amber-600 font-black">2.</span>
                        <span className="text-gray-700">
                          Review and validate{" "}
                          <strong className="text-amber-600">
                            {stats.attendance.monthly.excused} excused absences
                          </strong>{" "}
                          documentation
                        </span>
                      </li>
                      <li className="flex items-start gap-2 p-2 bg-green-50 rounded-lg">
                        <span className="text-green-600 font-black">3.</span>
                        <span className="text-gray-700">
                          Recognize{" "}
                          <strong className="text-green-600">
                            {stats.attendance.monthly.present} present records
                          </strong>{" "}
                          - maintain engagement strategies
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Visual Charts */}
                <div className="space-y-4">
                  {/* Bar Chart Comparison */}
                  <div className="bg-white rounded-xl p-5 border-2 border-blue-400 shadow-lg">
                    <h4 className="font-black text-blue-700 mb-3">
                      Attendance vs Absence Comparison
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[
                          {
                            name: "Present",
                            count: stats.attendance.monthly.present,
                          },
                          {
                            name: "Absent",
                            count: stats.attendance.monthly.absent,
                          },
                          {
                            name: "Excused",
                            count: stats.attendance.monthly.excused,
                          },
                        ]}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#3B82F6" />
                        <YAxis
                          dataKey="name"
                          type="category"
                          stroke="#3B82F6"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                          <Cell fill="#10B981" />
                          <Cell fill="#EF4444" />
                          <Cell fill="#F59E0B" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Attendance Rate Gauge */}
                  <div className="bg-white rounded-xl p-5 border-2 border-purple-400 shadow-lg">
                    <h4 className="font-black text-purple-700 mb-3">
                      Overall Attendance Health Score
                    </h4>
                    <div className="text-center py-6">
                      <div className="relative inline-block">
                        <svg
                          className="transform -rotate-90"
                          width="180"
                          height="180"
                        >
                          <circle
                            cx="90"
                            cy="90"
                            r="70"
                            stroke="#E5E7EB"
                            strokeWidth="20"
                            fill="none"
                          />
                          <circle
                            cx="90"
                            cy="90"
                            r="70"
                            stroke="#10B981"
                            strokeWidth="20"
                            fill="none"
                            strokeDasharray={`${
                              (parseFloat(
                                stats.attendance.monthly.attendanceRate
                              ) /
                                100) *
                              440
                            } 440`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <p className="text-4xl font-black text-green-600">
                            {stats.attendance.monthly.attendanceRate}%
                          </p>
                          <p className="text-xs font-bold text-gray-600">
                            Health Score
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-4">
                        {parseFloat(stats.attendance.monthly.attendanceRate) >=
                        90
                          ? "🌟 Excellent attendance rate!"
                          : parseFloat(
                              stats.attendance.monthly.attendanceRate
                            ) >= 75
                          ? "✅ Good attendance - room for improvement"
                          : "⚠️ Attention needed - low attendance rate"}
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl shadow-lg">
                      <FiCheckCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-2xl font-black">
                        {stats.attendance.monthly.attendanceRate}%
                      </p>
                      <p className="text-xs font-bold text-green-100">
                        Attendance
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-red-500 to-pink-500 text-white rounded-xl shadow-lg">
                      <FiAlertCircle className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-2xl font-black">
                        {stats.attendance.monthly.absenceRate}%
                      </p>
                      <p className="text-xs font-bold text-red-100">Absence</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <FiCheckCircle className="h-12 w-12 mb-4" />
                <h4 className="text-xl font-black mb-2">Strong Attendance</h4>
                <p className="text-green-100 text-sm">
                  {stats.attendance.monthly.attendanceRate}% of students are
                  attending classes regularly this month, showing strong
                  engagement.
                </p>
                <div className="mt-4 pt-4 border-t border-green-400">
                  <p className="text-2xl font-black">
                    {stats.attendance.monthly.present}
                  </p>
                  <p className="text-xs text-green-100">Present records</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <FiAlertCircle className="h-12 w-12 mb-4" />
                <h4 className="text-xl font-black mb-2">Absence Alert</h4>
                <p className="text-red-100 text-sm">
                  {stats.attendance.monthly.absent} absences recorded this
                  month. Consider reaching out to students with high absence
                  rates.
                </p>
                <div className="mt-4 pt-4 border-t border-red-400">
                  <p className="text-2xl font-black">
                    {stats.attendance.monthly.absent}
                  </p>
                  <p className="text-xs text-red-100">Absent records</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1">
                <FiUsers className="h-12 w-12 mb-4" />
                <h4 className="text-xl font-black mb-2">
                  Active Participation
                </h4>
                <p className="text-blue-100 text-sm">
                  {stats.attendance.monthly.uniqueStudents} unique students
                  participated in classes, showing diverse engagement across the
                  student body.
                </p>
                <div className="mt-4 pt-4 border-t border-blue-400">
                  <p className="text-2xl font-black">
                    {stats.attendance.monthly.uniqueStudents}
                  </p>
                  <p className="text-xs text-blue-100">Unique students</p>
                </div>
              </div>
            </div>
          </div>
          </FeatureGate>
        )}

        {/* Trends Section */}
        {activeSection === "trends" && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-6 border-2 border-purple-300">
              <h2 className="text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                📊 Trends & Historical Analysis
              </h2>
              <p className="text-gray-700">
                Track student registration, activation, and exit patterns over
                the past 12 months. Identify seasonal trends and growth patterns
                to make data-driven decisions.
              </p>
            </div>

            <ChartContainer
              title="12-Month Comprehensive Trend Analysis"
              onExpand={() =>
                setExpandedChart(expandedChart === "trends" ? null : "trends")
              }
              isExpanded={expandedChart === "trends"}
            >
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={stats.trends.registrations.map((r, idx) => ({
                    name: r.monthName,
                    Registrations: r.count,
                    Activations: stats.trends.activations[idx]?.count || 0,
                    Exits: stats.trends.exits[idx]?.count || 0,
                    "Net Growth": stats.trends.netGrowth[idx]?.count || 0,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#000" />
                  <YAxis stroke="#000" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="Registrations"
                    fill="#3B82F6"
                    stroke="#3B82F6"
                    fillOpacity={0.3}
                  />
                  <Area
                    type="monotone"
                    dataKey="Activations"
                    fill="#10B981"
                    stroke="#10B981"
                    fillOpacity={0.3}
                  />
                  <Line
                    type="monotone"
                    dataKey="Net Growth"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ r: 5, fill: "#8B5CF6" }}
                  />
                  <Bar dataKey="Exits" fill="#EF4444" opacity={0.6} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Growth Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <MetricCard
                title="Avg. Registrations/Month"
                value={stats.growth.avgRegistrationsPerMonth}
                icon={FiTrendingUp}
                color="blue"
                subtitle="12-month average"
                description="Average number of new student registrations per month over the past year"
              />
              <MetricCard
                title="Avg. Activations/Month"
                value={stats.growth.avgActivationsPerMonth}
                icon={FiTarget}
                color="green"
                subtitle="12-month average"
                description="Average students who become active learners each month"
              />
              <MetricCard
                title="Monthly Churn Rate"
                value={`${stats.monthly.churnRate}%`}
                icon={FiChurn}
                color="red"
                subtitle="Current period"
                description="Percentage of students leaving the program this month"
              />
            </div>

            {/* Advanced Trend Analysis */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-300 shadow-xl">
              <h3 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <FiActivity className="h-7 w-7 text-indigo-600" />
                Advanced Growth Pattern Analysis
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Registration Momentum */}
                <div className="bg-white rounded-xl p-5 border-2 border-blue-400 shadow-lg">
                  <h4 className="font-black text-blue-700 mb-4 flex items-center gap-2">
                    <FiTrendingUp className="h-5 w-5" />
                    Registration Momentum
                  </h4>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="font-semibold text-gray-700">
                        This Month
                      </span>
                      <span className="font-black text-2xl text-blue-600">
                        {stats.monthly.registered}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-700">
                        Last Month
                      </span>
                      <span className="font-black text-2xl text-gray-600">
                        {stats.growth.lastMonthRegistered}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg">
                      <span className="font-semibold">Growth Rate</span>
                      <span className="font-black text-2xl flex items-center gap-2">
                        {parseFloat(stats.growth.registrationGrowthRate) > 0 ? (
                          <FiTrendingUp className="h-6 w-6 text-green-300" />
                        ) : (
                          <FiTrendingDown className="h-6 w-6 text-red-300" />
                        )}
                        {stats.growth.registrationGrowthRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Activation Success Rate */}
                <div className="bg-white rounded-xl p-5 border-2 border-green-400 shadow-lg">
                  <h4 className="font-black text-green-700 mb-4 flex items-center gap-2">
                    <FiCheckCircle className="h-5 w-5" />
                    Activation Success
                  </h4>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart
                      data={stats.trends.activations.slice(-6).map((item) => ({
                        month: item.monthName.substring(0, 3),
                        activations: item.count,
                      }))}
                    >
                      <defs>
                        <linearGradient
                          id="colorActivations"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#10B981"
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10B981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#10B981" />
                      <YAxis stroke="#10B981" />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="activations"
                        stroke="#10B981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorActivations)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Predictive Insights */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-xl p-5 shadow-lg">
                  <FiTrendingUp className="h-10 w-10 mb-3" />
                  <p className="text-xs font-bold text-blue-100 uppercase mb-2">
                    Growth Forecast
                  </p>
                  <p className="text-2xl font-black mb-2">
                    +
                    {Math.round(
                      parseFloat(stats.growth.avgRegistrationsPerMonth) * 1.1
                    )}
                  </p>
                  <p className="text-sm text-blue-100">
                    Expected registrations next month based on trends
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-xl p-5 shadow-lg">
                  <FiTarget className="h-10 w-10 mb-3" />
                  <p className="text-xs font-bold text-green-100 uppercase mb-2">
                    Conversion Opportunity
                  </p>
                  <p className="text-2xl font-black mb-2">
                    {stats.overview.totalNotYet}
                  </p>
                  <p className="text-sm text-green-100">
                    Prospects ready for conversion to active status
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl p-5 shadow-lg">
                  <FiAward className="h-10 w-10 mb-3" />
                  <p className="text-xs font-bold text-purple-100 uppercase mb-2">
                    Retention Target
                  </p>
                  <p className="text-2xl font-black mb-2">
                    {stats.monthly.retentionRate}%
                  </p>
                  <p className="text-sm text-purple-100">
                    Current retention rate - aiming for 95%
                  </p>
                </div>
              </div>
            </div>

            {/* Individual Trend Lines */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer title="📈 Registration Trend">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={stats.trends.registrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="monthName" stroke="#3B82F6" />
                    <YAxis stroke="#3B82F6" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      dot={{ r: 5, fill: "#3B82F6" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="⚖️ Activation vs Exit Comparison">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={stats.trends.activations.map((a, idx) => ({
                      month: a.monthName,
                      Activations: a.count,
                      Exits: stats.trends.exits[idx]?.count || 0,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#10B981" />
                    <YAxis stroke="#10B981" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="Activations"
                      fill="#10B981"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar dataKey="Exits" fill="#EF4444" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
        )}

        {/* Distribution Section */}
        {activeSection === "distribution" && (
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-xl p-6 border-2 border-pink-300">
              <h2 className="text-2xl font-black bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
                🎯 Student Distribution Analysis
              </h2>
              <p className="text-gray-700">
                Understand how students are distributed across packages,
                subjects, countries, and currencies. Analyze demographic
                patterns to tailor your programs and improve resource
                allocation.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Package Distribution - Enhanced */}
              <div className="bg-white border-2 border-blue-500 rounded-xl shadow-xl p-4 sm:p-6 hover:shadow-2xl transition-all">
                <h3 className="text-lg sm:text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FiLayers className="h-6 w-6 text-blue-600" />
                  📦 Package Distribution
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={stats.breakdowns.packages.slice(0, 5).map((p) => ({
                        ...p,
                        label: `${p.name}: ${p.percentage}%`,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label }: any) => label}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.breakdowns.packages.slice(0, 5).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Package List */}
                <div className="mt-4 space-y-2">
                  {stats.breakdowns.packages.slice(0, 5).map((pkg, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-blue-50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor:
                              CHART_COLORS[idx % CHART_COLORS.length],
                          }}
                        ></div>
                        <span className="text-sm font-semibold text-gray-700">
                          {pkg.name}
                        </span>
                      </div>
                      <span className="font-black text-blue-600">
                        {pkg.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <ChartContainer title="📚 Subject Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.breakdowns.subjects.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="name"
                      stroke="#8B5CF6"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis stroke="#8B5CF6" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="🌍 Country Distribution">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats.breakdowns.countries.slice(0, 5)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#06B6D4" />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke="#06B6D4"
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#06B6D4" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white border-2 border-green-500 rounded-xl shadow-xl p-6">
                <h3 className="text-xl font-black bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FiDollarSign className="h-6 w-6 text-green-600" />
                  Currency Breakdown
                </h3>
                <div className="space-y-3">
                  {stats.breakdowns.currencies.map((curr, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-gray-800">
                          {curr.name}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-green-600">
                            {curr.count}
                          </span>
                          <span className="text-xs font-semibold text-gray-600">
                            {curr.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-700"
                          style={{ width: `${curr.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white border-2 border-blue-500 rounded-xl shadow-xl p-6">
                <h3 className="text-xl font-black bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                  <FiActivity className="h-6 w-6 text-blue-600" />
                  Status Distribution
                </h3>
                <div className="space-y-3">
                  {stats.breakdowns.statuses.map((status, idx) => {
                    const statusColors = [
                      "from-blue-500 to-blue-600",
                      "from-green-500 to-green-600",
                      "from-amber-500 to-amber-600",
                      "from-red-500 to-red-600",
                    ];
                    const textColors = [
                      "text-blue-600",
                      "text-green-600",
                      "text-amber-600",
                      "text-red-600",
                    ];
                    return (
                      <div key={idx} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-gray-800">
                            {status.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <span
                              className={`font-black ${
                                textColors[idx % textColors.length]
                              }`}
                            >
                              {status.count}
                            </span>
                            <span className="text-xs font-semibold text-gray-600">
                              {status.percentage}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`bg-gradient-to-r ${
                              statusColors[idx % statusColors.length]
                            } h-3 rounded-full transition-all duration-700`}
                            style={{ width: `${status.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Section - Student Analytics */}
        {activeSection === "performance" && (
          <GenericFeatureGate feature="student_analytics">
            <FeatureGate
              feature="advanced_analytics"
            fallback={
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 border-2 border-yellow-200">
                <div className="text-center">
                  <div className="bg-yellow-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <FiTrendingUp className="h-8 w-8 text-yellow-600" />
                  </div>
                  <h3 className="text-xl font-bold text-yellow-800 mb-2">
                    🚀 Advanced Analytics Required
                  </h3>
                  <p className="text-yellow-700 mb-4">
                    Performance Analytics & Insights is a premium feature that provides comprehensive multi-dimensional analysis of your school's performance.
                  </p>
                  <div className="bg-white rounded-lg p-4 border border-yellow-200 max-w-md mx-auto">
                    <h4 className="font-semibold text-yellow-800 mb-2">Premium Features Include:</h4>
                    <ul className="text-sm text-yellow-700 space-y-1 text-left">
                      <li>• 📊 Multi-dimensional performance radar</li>
                      <li>• 📈 Advanced trend analysis</li>
                      <li>• 🎯 Performance scoring system</li>
                      <li>• 📋 Comprehensive insights dashboard</li>
                    </ul>
                  </div>
                </div>
              </div>
            }
          >
          <div className="space-y-6 sm:space-y-8 animate-fadeIn">
            <div className="bg-gradient-to-r from-cyan-100 to-blue-100 rounded-xl p-6 border-2 border-cyan-300">
              <h2 className="text-2xl font-black bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
                🚀 Performance Analytics & Insights
              </h2>
              <p className="text-gray-700">
                Evaluate overall performance across multiple dimensions
                including enrollment, assignment, retention, and engagement
                metrics. Use radar analysis for comprehensive performance
                visualization.
              </p>
            </div>

            {/* Performance Radar */}
            <ChartContainer
              title="Multi-Dimensional Performance Radar"
              onExpand={() =>
                setExpandedChart(expandedChart === "radar" ? null : "radar")
              }
              isExpanded={expandedChart === "radar"}
            >
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart
                  data={[
                    {
                      metric: "Enrollment",
                      value: parseFloat(stats.overview.activeRate),
                      fullMark: 100,
                    },
                    {
                      metric: "Assignment",
                      value: parseFloat(stats.assignments.assignmentRate),
                      fullMark: 100,
                    },
                    {
                      metric: "Retention",
                      value: parseFloat(stats.monthly.retentionRate),
                      fullMark: 100,
                    },
                    {
                      metric: "Contact",
                      value: parseFloat(stats.engagement.contactRate),
                      fullMark: 100,
                    },
                    {
                      metric: "Conversion",
                      value: parseFloat(stats.monthly.conversionRate),
                      fullMark: 100,
                    },
                  ]}
                >
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="metric" stroke="#000" />
                  <PolarRadiusAxis stroke="#666" />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#000000"
                    fill="#000000"
                    fillOpacity={0.3}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>

            {/* Performance Benchmarking */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 shadow-xl">
              <h3 className="text-2xl font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
                <FiTarget className="h-7 w-7 text-amber-600" />
                Performance Benchmarking & Goals
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Goal Progress */}
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-5 border-2 border-green-400 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-green-700">
                        Active Rate Goal
                      </h4>
                      <span className="text-sm font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">
                        Target: 90%
                      </span>
                    </div>
                    <div className="relative">
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="font-semibold">Current Progress</span>
                        <span className="font-black text-green-600">
                          {stats.overview.activeRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-6 rounded-full flex items-center justify-end pr-3 text-white font-bold text-sm shadow-lg transition-all duration-1000"
                          style={{
                            width: `${
                              (parseFloat(stats.overview.activeRate) / 90) * 100
                            }%`,
                          }}
                        >
                          {stats.overview.activeRate}%
                        </div>
                      </div>
                      {parseFloat(stats.overview.activeRate) >= 90 ? (
                        <p className="text-xs text-green-600 font-semibold mt-2">
                          🎉 Goal achieved! Excellent work!
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 mt-2">
                          {(90 - parseFloat(stats.overview.activeRate)).toFixed(
                            1
                          )}
                          % more to reach goal
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-5 border-2 border-blue-400 shadow-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-black text-blue-700">
                        Attendance Goal
                      </h4>
                      <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                        Target: 95%
                      </span>
                    </div>
                    <div className="relative">
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="font-semibold">Current Progress</span>
                        <span className="font-black text-blue-600">
                          {stats.attendance.monthly.attendanceRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-6">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-6 rounded-full flex items-center justify-end pr-3 text-white font-bold text-sm shadow-lg transition-all duration-1000"
                          style={{
                            width: `${
                              (parseFloat(
                                stats.attendance.monthly.attendanceRate
                              ) /
                                95) *
                              100
                            }%`,
                          }}
                        >
                          {stats.attendance.monthly.attendanceRate}%
                        </div>
                      </div>
                      {parseFloat(stats.attendance.monthly.attendanceRate) >=
                      95 ? (
                        <p className="text-xs text-blue-600 font-semibold mt-2">
                          🎉 Outstanding attendance rate!
                        </p>
                      ) : (
                        <p className="text-xs text-gray-600 mt-2">
                          {(
                            95 -
                            parseFloat(stats.attendance.monthly.attendanceRate)
                          ).toFixed(1)}
                          % more to reach goal
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Performance Score Card */}
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl p-6 shadow-2xl">
                    <h4 className="text-xl font-black mb-4 flex items-center gap-2">
                      <FiAward className="h-6 w-6" />
                      Overall Performance Score
                    </h4>
                    <div className="text-center py-6">
                      <p className="text-7xl font-black mb-4">
                        {(
                          (parseFloat(stats.overview.activeRate) * 0.3 +
                            parseFloat(
                              stats.attendance.monthly.attendanceRate
                            ) *
                              0.25 +
                            parseFloat(stats.payments.paymentRate) * 0.25 +
                            parseFloat(stats.monthly.retentionRate) * 0.2) /
                          1
                        ).toFixed(0)}
                      </p>
                      <p className="text-xl font-bold text-indigo-100 mb-2">
                        Out of 100
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <FiAward
                            key={i}
                            className={`h-6 w-6 ${
                              i <
                              Math.floor(
                                (parseFloat(stats.overview.activeRate) * 0.4 +
                                  parseFloat(
                                    stats.attendance.monthly.attendanceRate
                                  ) *
                                    0.3 +
                                  parseFloat(stats.monthly.retentionRate) *
                                    0.3) /
                                  20
                              )
                                ? "text-yellow-300"
                                : "text-indigo-300"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="bg-white rounded-xl p-5 border-2 border-indigo-400 shadow-lg">
                    <h4 className="font-black text-indigo-700 mb-4">
                      Score Components
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">
                          Active Rate (40%)
                        </span>
                        <span className="font-black text-indigo-600">
                          {(
                            parseFloat(stats.overview.activeRate) * 0.4
                          ).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">
                          Attendance (30%)
                        </span>
                        <span className="font-black text-blue-600">
                          {(
                            parseFloat(
                              stats.attendance.monthly.attendanceRate
                            ) * 0.3
                          ).toFixed(1)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-700">
                          Retention (30%)
                        </span>
                        <span className="font-black text-green-600">
                          {(
                            parseFloat(stats.monthly.retentionRate) * 0.3
                          ).toFixed(1)}
                        </span>
                      </div>
                      <div className="pt-3 border-t-2 border-gray-200 flex items-center justify-between">
                        <span className="font-black text-gray-800">
                          Total Score
                        </span>
                        <span className="font-black text-2xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {(
                            (parseFloat(stats.overview.activeRate) * 0.4 +
                              parseFloat(
                                stats.attendance.monthly.attendanceRate
                              ) *
                                0.3 +
                              parseFloat(stats.monthly.retentionRate) * 0.3) /
                            1
                          ).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                {
                  label: "Active Rate",
                  value: `${stats.overview.activeRate}%`,
                },
                {
                  label: "Payment Rate",
                  value: `${stats.payments.paymentRate}%`,
                },
                {
                  label: "Assignment Rate",
                  value: `${stats.assignments.assignmentRate}%`,
                },
                {
                  label: "Retention Rate",
                  value: `${stats.monthly.retentionRate}%`,
                },
                {
                  label: "Contact Rate",
                  value: `${stats.engagement.contactRate}%`,
                },
                {
                  label: "Conversion Rate",
                  value: `${stats.monthly.conversionRate}%`,
                },
              ].map((kpi, idx) => {
                const colors = [
                  "border-blue-500 bg-blue-50 text-blue-600",
                  "border-green-500 bg-green-50 text-green-600",
                  "border-purple-500 bg-purple-50 text-purple-600",
                  "border-pink-500 bg-pink-50 text-pink-600",
                  "border-cyan-500 bg-cyan-50 text-cyan-600",
                  "border-amber-500 bg-amber-50 text-amber-600",
                ];
                return (
                  <div
                    key={idx}
                    className={`bg-white border-2 ${colors[idx]} rounded-xl shadow-lg p-4 text-center hover:shadow-xl transition-all`}
                  >
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">
                      {kpi.label}
                    </p>
                    <p
                      className={`text-2xl font-black ${
                        colors[idx].split(" ")[2]
                      }`}
                    >
                      {kpi.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Comparative Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartContainer title="📊 Month-over-Month Comparison">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        metric: "Registrations",
                        "This Month": stats.monthly.registered,
                        "Last Month": stats.growth.lastMonthRegistered,
                      },
                      {
                        metric: "Activations",
                        "This Month": stats.monthly.started,
                        "Last Month": stats.growth.lastMonthActive,
                      },
                      {
                        metric: "Exits",
                        "This Month": stats.monthly.left,
                        "Last Month": 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="metric" stroke="#3B82F6" />
                    <YAxis stroke="#3B82F6" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="This Month"
                      fill="#3B82F6"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="Last Month"
                      fill="#94A3B8"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>

              <ChartContainer title="🎯 Engagement Funnel">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        stage: "Total",
                        count: stats.overview.totalStudents,
                      },
                      {
                        stage: "With Phone",
                        count: stats.engagement.withPhone,
                      },
                      {
                        stage: "With Telegram",
                        count: stats.engagement.withTelegram,
                      },
                      {
                        stage: "With Referral",
                        count: stats.engagement.withReferral,
                      },
                    ]}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#10B981" />
                    <YAxis dataKey="stage" type="category" stroke="#10B981" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#10B981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </div>
            </FeatureGate>
          </GenericFeatureGate>
        )}

        {/* Students Table Section */}
        {activeSection === "students" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-xl p-6 border-2 border-indigo-300">
              <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                👥 Complete Student Directory
              </h2>
              <p className="text-gray-700">
                Browse, search, and filter through all registered students.
                Access detailed student information including status,
                assignments, contact details, and registration dates for
                comprehensive management.
              </p>
            </div>

            {/* Filters */}
            <div className="bg-white border-2 border-purple-500 rounded-xl shadow-xl p-4 sm:p-6">
              {/* Active Filters Indicator */}
              {(searchQuery ||
                statusFilter ||
                packageFilter ||
                subjectFilter ||
                countryFilter ||
                ustazFilter ||
                progressFilter ||
                regDateFrom ||
                regDateTo ||
                startDateFrom ||
                startDateTo ||
                feeMin ||
                feeMax) && (
                <div className="mb-4 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <FiFilter className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-bold text-purple-600">
                        Active Filters:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {searchQuery && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                            Search: {searchQuery}
                          </span>
                        )}
                        {statusFilter && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                            Status: {statusFilter}
                          </span>
                        )}
                        {packageFilter && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                            Package: {packageFilter}
                          </span>
                        )}
                        {subjectFilter && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                            Subject: {subjectFilter}
                          </span>
                        )}
                        {countryFilter && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                            Country: {countryFilter}
                          </span>
                        )}
                        {(ustazFilter ||
                          progressFilter ||
                          regDateFrom ||
                          regDateTo ||
                          startDateFrom ||
                          startDateTo ||
                          feeMin ||
                          feeMax) && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-bold">
                            + More filters
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
                    <FiSearch className="h-4 w-4" />
                    Search Students
                  </label>
                  <div className="relative">
                    <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-purple-400 h-5 w-5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleApplyFilters();
                        }
                      }}
                      placeholder="Search by name, ID, phone... (Press Enter to search)"
                      className="w-full pl-12 pr-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-purple-50"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-bold text-purple-600 mb-2 flex items-center gap-2">
                    <FiFilter className="h-4 w-4" />
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setTimeout(() => handleApplyFilters(), 100);
                    }}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-purple-50"
                  >
                    <option value="">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Not yet">Not Yet</option>
                    <option value="Leave">Leave</option>
                    <option value="Not succeed">Not Succeed</option>
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <button
                    onClick={handleApplyFilters}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:shadow-xl flex items-center justify-center gap-2 font-bold transition-all"
                  >
                    <FiRefreshCw className="h-5 w-5" />
                    Apply Filters
                  </button>
                  <button
                    onClick={() => {
                      clearFilters();
                      setTimeout(() => fetchStudents(true), 100);
                    }}
                    className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                    title="Clear All Filters"
                  >
                    <FiX className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Advanced Filters Toggle */}
              <div className="border-t-2 border-purple-200 pt-4">
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-all"
                >
                  <span className="font-bold text-purple-600 flex items-center gap-2">
                    <FiFilter className="h-4 w-4" />
                    Advanced Filters
                  </span>
                  <span className="text-purple-600 font-bold">
                    {showAdvancedFilters ? "▲" : "▼"}
                  </span>
                </button>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border-2 border-purple-200">
                    {/* Package Filter */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiPackage className="h-4 w-4" />
                        Package
                      </label>
                      <select
                        value={packageFilter}
                        onChange={(e) => {
                          setPackageFilter(e.target.value);
                          // Auto-apply on change
                          setTimeout(() => handleApplyFilters(), 100);
                        }}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      >
                        <option value="">All Packages</option>
                        {stats?.breakdowns.packages.map((pkg) => (
                          <option key={pkg.name} value={pkg.name}>
                            {pkg.name} ({pkg.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Subject Filter */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiBook className="h-4 w-4" />
                        Subject
                      </label>
                      <select
                        value={subjectFilter}
                        onChange={(e) => {
                          setSubjectFilter(e.target.value);
                          setTimeout(() => handleApplyFilters(), 100);
                        }}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      >
                        <option value="">All Subjects</option>
                        {stats?.breakdowns.subjects.map((subj) => (
                          <option key={subj.name} value={subj.name}>
                            {subj.name} ({subj.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Country Filter */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiMapPin className="h-4 w-4" />
                        Country
                      </label>
                      <select
                        value={countryFilter}
                        onChange={(e) => {
                          setCountryFilter(e.target.value);
                          setTimeout(() => handleApplyFilters(), 100);
                        }}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      >
                        <option value="">All Countries</option>
                        {stats?.breakdowns.countries.map((country) => (
                          <option key={country.name} value={country.name}>
                            {country.name} ({country.count})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher/Ustaz Filter */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiUser className="h-4 w-4" />
                        Teacher
                      </label>
                      <input
                        type="text"
                        value={ustazFilter}
                        onChange={(e) => setUstazFilter(e.target.value)}
                        placeholder="Teacher ID or name..."
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>

                    {/* Progress Filter */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiTarget className="h-4 w-4" />
                        Progress
                      </label>
                      <input
                        type="text"
                        value={progressFilter}
                        onChange={(e) => setProgressFilter(e.target.value)}
                        placeholder="Progress level..."
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>

                    {/* Registration Date Range */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiCalendar className="h-4 w-4" />
                        Reg. Date From
                      </label>
                      <input
                        type="date"
                        value={regDateFrom}
                        onChange={(e) => setRegDateFrom(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiCalendar className="h-4 w-4" />
                        Reg. Date To
                      </label>
                      <input
                        type="date"
                        value={regDateTo}
                        onChange={(e) => setRegDateTo(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>

                    {/* Start Date Range */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiCalendar className="h-4 w-4" />
                        Start Date From
                      </label>
                      <input
                        type="date"
                        value={startDateFrom}
                        onChange={(e) => setStartDateFrom(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiCalendar className="h-4 w-4" />
                        Start Date To
                      </label>
                      <input
                        type="date"
                        value={startDateTo}
                        onChange={(e) => setStartDateTo(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>

                    {/* Fee Range */}
                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiDollarSign className="h-4 w-4" />
                        Min Fee
                      </label>
                      <input
                        type="number"
                        value={feeMin}
                        onChange={(e) => setFeeMin(e.target.value)}
                        placeholder="Minimum fee..."
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                        <FiDollarSign className="h-4 w-4" />
                        Max Fee
                      </label>
                      <input
                        type="number"
                        value={feeMax}
                        onChange={(e) => setFeeMax(e.target.value)}
                        placeholder="Maximum fee..."
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Table - Enhanced */}
            <div className="bg-white border-2 border-indigo-500 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all">
              <div className="px-4 sm:px-6 py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-b-2 border-indigo-700">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border-2 border-white/30">
                      <FiUsers className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-black text-white">
                        Student Directory
                      </h3>
                      <p className="text-white/80 text-sm font-semibold mt-1">
                        Complete student management and information
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-xl text-sm font-black border border-white/30">
                      {total.toLocaleString()} students
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="overflow-x-auto custom-scrollbar relative"
                style={{ maxHeight: "calc(100vh - 400px)" }}
              >
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0 z-30 shadow-sm">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider sticky left-0 bg-gray-50 z-30 border-r-2 border-gray-300">
                        Student
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden sm:table-cell">
                        Start Date
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden lg:table-cell">
                        Registered
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden lg:table-cell">
                        Ustaz
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden lg:table-cell">
                        Controller
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden xl:table-cell">
                        Contact
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden lg:table-cell">
                        Package
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden lg:table-cell">
                        Subject
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden xl:table-cell">
                        Day Packages
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden xl:table-cell">
                        Country
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden xl:table-cell">
                        Progress
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden xl:table-cell">
                        Fee
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider hidden xl:table-cell">
                        Chat ID
                      </th>
                      <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-black text-black uppercase tracking-wider sticky right-0 bg-gray-50 z-30 border-l-2 border-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr
                        key={student.id}
                        className="group hover:bg-gray-50 transition-colors border-b border-gray-100"
                      >
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap sticky left-0 bg-white z-10 border-r-2 border-gray-200 group-hover:bg-gray-50">
                          <div className="flex items-center">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                              <FiUser className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div className="ml-3 sm:ml-4">
                              <div className="text-sm font-black text-black">
                                {student.name}
                              </div>
                              <div className="text-xs text-gray-500 font-semibold">
                                ID: {student.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex px-3 py-1.5 text-xs font-black rounded-lg ${
                              student.status === "Active"
                                ? "bg-green-500 text-white"
                                : student.status === "Not Yet"
                                ? "bg-amber-500 text-white"
                                : "bg-gray-400 text-white"
                            }`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden sm:table-cell">
                          {student.startDate ? (
                            <div className="flex items-center gap-2">
                              <FiCalendar className="h-4 w-4 text-gray-400" />
                              <span className="font-bold text-black">
                                {format(
                                  parseISO(student.startDate),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Not set
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          {student.registrationDate ? (
                            <div className="flex items-center gap-2">
                              <FiCalendar className="h-4 w-4 text-gray-400" />
                              <span className="font-bold text-black">
                                {format(
                                  parseISO(student.registrationDate),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Unknown
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          {student.ustazName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg text-xs font-bold">
                              <FiUser className="h-3 w-3" />
                              {student.ustazName}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          {student.controller ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-pink-100 text-pink-800 rounded-lg text-xs font-bold">
                              <FiUser className="h-3 w-3" />
                              {student.controller}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden xl:table-cell">
                          <div className="space-y-1">
                            {student.phone && (
                              <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                                <FiPhone className="h-3 w-3" />
                                {student.phone}
                              </div>
                            )}
                            {student.email && (
                              <div className="flex items-center gap-1 text-sm font-semibold text-gray-700">
                                <FiMessageCircle className="h-3 w-3" />
                                {student.email}
                              </div>
                            )}
                            {!student.phone && !student.email && (
                              <span className="text-gray-400 italic text-xs">
                                No contact
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          {student.package ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
                              <FiPackage className="h-3 w-3" />
                              {student.package}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden lg:table-cell">
                          {student.subject ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-bold">
                              <FiBook className="h-3 w-3" />
                              {student.subject}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden xl:table-cell">
                          {student.daypackages ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-800 rounded-lg text-xs font-bold">
                              <FiClock className="h-3 w-3" />
                              {student.daypackages}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden xl:table-cell">
                          {student.country ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold">
                              <FiMapPin className="h-3 w-3" />
                              {student.country}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden xl:table-cell">
                          {student.progress ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 rounded-lg text-xs font-bold">
                              <FiTarget className="h-3 w-3" />
                              {student.progress}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden xl:table-cell">
                          {student.classfee ? (
                            <span className="font-bold text-green-700">
                              {student.classfeeCurrency || "ETB"}{" "}
                              {formatNumber(student.classfee)}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden xl:table-cell">
                          {student.chatId ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-800 rounded-lg text-xs font-mono font-bold">
                              <FiMessageCircle className="h-3 w-3" />
                              {student.chatId}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              N/A
                            </span>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-3 whitespace-nowrap text-sm sticky right-0 bg-white z-10 border-l-2 border-gray-200 group-hover:bg-gray-50">
                          <div className="flex items-center gap-0.5 flex-nowrap">
                            <button
                              onClick={() => {
                                fetchStudentDetails(student.id);
                                setActiveDetailTab("info");
                              }}
                              className="p-1.5 hover:bg-blue-50 text-blue-600 rounded transition-all hover:scale-110 flex-shrink-0"
                              title="View Details"
                            >
                              <FiEye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="p-1.5 hover:bg-purple-50 text-purple-600 rounded transition-all hover:scale-110 flex-shrink-0"
                              title="Edit Student"
                            >
                              <FiEdit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                fetchStudentDetails(student.id);
                                fetchAttendanceHistory(student.id);
                                setActiveDetailTab("attendance");
                              }}
                              className="p-1.5 hover:bg-green-50 text-green-600 rounded transition-all hover:scale-110 flex-shrink-0"
                              title="View Attendance"
                            >
                              <FiCheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                fetchStudentDetails(student.id);
                                fetchPaymentHistory(student.id);
                                setActiveDetailTab("payments");
                              }}
                              className="p-1.5 hover:bg-amber-50 text-amber-600 rounded transition-all hover:scale-110 flex-shrink-0"
                              title="View Payments"
                            >
                              <FiDollarSign className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (student.chatId) {
                                  window.open(
                                    `/student/mini-app/${student.chatId}`,
                                    "_blank"
                                  );
                                } else {
                                  toast.error("No chat ID available");
                                }
                              }}
                              className="p-1.5 hover:bg-teal-50 text-teal-600 rounded transition-all hover:scale-110 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Open Chat"
                              disabled={!student.chatId}
                            >
                              <FiMessageCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Student Detail Modal */}
            {showStudentDetail && selectedStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between border-b-2 border-indigo-700">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <FiUser className="h-6 w-6" />
                      Student Details
                    </h3>
                    <button
                      onClick={() => {
                        setShowStudentDetail(false);
                        setSelectedStudent(null);
                        setStudentDetails(null);
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg text-white transition-all"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Enhanced Tabs */}
                  <div className="border-b-2 border-gray-200 px-6 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveDetailTab("info")}
                        className={`px-6 py-4 font-black transition-all border-b-3 rounded-t-xl relative ${
                          activeDetailTab === "info"
                            ? "border-indigo-600 text-indigo-600 bg-gradient-to-b from-indigo-50 to-white"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activeDetailTab === "info"
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            <FiUser className="h-4 w-4" />
                          </div>
                          <span>Information</span>
                        </div>
                        {activeDetailTab === "info" && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-full"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveDetailTab("attendance")}
                        className={`px-6 py-4 font-black transition-all border-b-3 rounded-t-xl relative ${
                          activeDetailTab === "attendance"
                            ? "border-green-600 text-green-600 bg-gradient-to-b from-green-50 to-white"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activeDetailTab === "attendance"
                                ? "bg-green-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            <FiCalendar className="h-4 w-4" />
                          </div>
                          <span>Attendance</span>
                          {attendanceHistory?.statistics && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                activeDetailTab === "attendance"
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {attendanceHistory.statistics.total}
                            </span>
                          )}
                        </div>
                        {activeDetailTab === "attendance" && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-full"></div>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveDetailTab("payments")}
                        className={`px-6 py-4 font-black transition-all border-b-3 rounded-t-xl relative ${
                          activeDetailTab === "payments"
                            ? "border-amber-600 text-amber-600 bg-gradient-to-b from-amber-50 to-white"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              activeDetailTab === "payments"
                                ? "bg-amber-600 text-white"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            <FiDollarSign className="h-4 w-4" />
                          </div>
                          <span>Payments</span>
                          {paymentHistory?.statistics && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-black ${
                                activeDetailTab === "payments"
                                  ? "bg-amber-600 text-white"
                                  : "bg-gray-300 text-gray-700"
                              }`}
                            >
                              {paymentHistory.statistics.totalMonths}
                            </span>
                          )}
                        </div>
                        {activeDetailTab === "payments" && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 to-orange-600 rounded-t-full"></div>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {loadingDetails && activeDetailTab === "info" ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-indigo-600"></div>
                      </div>
                    ) : activeDetailTab === "info" && studentDetails ? (
                      <>
                        {/* Enhanced Header Section */}
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
                          <div className="absolute inset-0 bg-black/10"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30">
                                  <FiUser className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-3xl font-black mb-1">
                                    {studentDetails.name}
                                  </h3>
                                  <p className="text-white/80 font-semibold">
                                    Student ID: {selectedStudent?.id}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span
                                  className={`inline-flex px-4 py-2 rounded-xl font-black text-sm ${
                                    studentDetails.status === "Active"
                                      ? "bg-green-500 text-white"
                                      : studentDetails.status === "Not yet"
                                      ? "bg-amber-500 text-white"
                                      : "bg-gray-500 text-white"
                                  }`}
                                >
                                  {studentDetails.status || "Unknown"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Basic Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl p-5 border-2 border-blue-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiUser className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-blue-600 uppercase tracking-wider">
                                Full Name
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-900">
                              {studentDetails.name}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-green-50 via-green-100 to-green-200 rounded-2xl p-5 border-2 border-green-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiPhone className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-green-600 uppercase tracking-wider">
                                Contact
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-900 flex items-center gap-2">
                              {studentDetails.phoneno || (
                                <span className="text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                              {studentDetails.chatId && (
                                <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                                  <FiMessageCircle className="inline mr-1" />
                                  Telegram
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 rounded-2xl p-5 border-2 border-amber-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiDollarSign className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-amber-600 uppercase tracking-wider">
                                Class Fee
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-900">
                              {studentDetails.classfeeCurrency || "ETB"}{" "}
                              {formatNumber(studentDetails.classfee)}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-pink-50 via-pink-100 to-pink-200 rounded-2xl p-5 border-2 border-pink-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiPackage className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-pink-600 uppercase tracking-wider">
                                Package
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-900">
                              {studentDetails.package || (
                                <span className="text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-cyan-50 via-cyan-100 to-cyan-200 rounded-2xl p-5 border-2 border-cyan-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiBook className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-cyan-600 uppercase tracking-wider">
                                Subject
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-900">
                              {studentDetails.subject || (
                                <span className="text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-indigo-50 via-indigo-100 to-indigo-200 rounded-2xl p-5 border-2 border-indigo-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiCalendar className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-indigo-600 uppercase tracking-wider">
                                Day Packages
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-900">
                              {studentDetails.daypackages || (
                                <span className="text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-red-50 via-red-100 to-red-200 rounded-2xl p-5 border-2 border-red-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiGlobe className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-red-600 uppercase tracking-wider">
                                Country
                              </p>
                            </div>
                            <p className="text-xl font-black text-gray-900">
                              {studentDetails.country || (
                                <span className="text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-purple-50 via-purple-100 to-purple-200 rounded-2xl p-5 border-2 border-purple-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiCalendar className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-purple-600 uppercase tracking-wider">
                                Registration Date
                              </p>
                            </div>
                            <p className="text-lg font-black text-gray-900">
                              {studentDetails.registrationdate ? (
                                format(
                                  parseISO(
                                    studentDetails.registrationdate.toString()
                                  ),
                                  "MMM dd, yyyy"
                                )
                              ) : (
                                <span className="text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                            </p>
                          </div>

                          <div className="group bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 rounded-2xl p-5 border-2 border-blue-400 hover:shadow-xl transition-all hover:scale-105">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                                <FiClock className="h-6 w-6 text-white" />
                              </div>
                              <p className="text-xs font-black text-blue-600 uppercase tracking-wider">
                                Start Date
                              </p>
                            </div>
                            <p className="text-lg font-black text-gray-900">
                              {studentDetails.startdate ? (
                                format(
                                  parseISO(studentDetails.startdate.toString()),
                                  "MMM dd, yyyy"
                                )
                              ) : (
                                <span className="text-gray-400 italic">
                                  N/A
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {/* Enhanced Teacher Info */}
                        {studentDetails.teacher && (
                          <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-purple-200 rounded-2xl p-6 border-2 border-purple-400 shadow-xl">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <FiUser className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-purple-600 uppercase tracking-wider mb-1">
                                  Assigned Teacher
                                </p>
                                <p className="text-2xl font-black text-gray-900">
                                  {studentDetails.teacher.ustazname ||
                                    "Unassigned"}
                                </p>
                              </div>
                            </div>
                            {studentDetails.teacher.phone && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <FiPhone className="h-5 w-5 text-purple-600" />
                                <span className="font-semibold">
                                  {studentDetails.teacher.phone}
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Enhanced Progress Section */}
                        {studentDetails.progress && (
                          <div className="bg-gradient-to-br from-green-100 via-emerald-100 to-green-200 rounded-2xl p-6 border-2 border-green-400 shadow-xl">
                            <div className="flex items-center gap-4 mb-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                                <FiBarChart className="h-8 w-8 text-white" />
                              </div>
                              <div>
                                <p className="text-xs font-black text-green-600 uppercase tracking-wider mb-1">
                                  Learning Progress
                                </p>
                                <p className="text-lg font-semibold text-gray-900">
                                  {studentDetails.progress}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : activeDetailTab === "attendance" ? (
                      <AttendanceHistoryTab
                        attendanceHistory={attendanceHistory}
                        loading={loadingAttendance}
                        studentId={selectedStudent?.id}
                        onRefresh={() =>
                          selectedStudent &&
                          fetchAttendanceHistory(selectedStudent.id)
                        }
                      />
                    ) : activeDetailTab === "payments" ? (
                      <PaymentHistoryTab
                        paymentHistory={paymentHistory}
                        loading={loadingPayments}
                        studentId={selectedStudent?.id}
                        onRefresh={() =>
                          selectedStudent &&
                          fetchPaymentHistory(selectedStudent.id)
                        }
                      />
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No details available</p>
                      </div>
                    )}
                  </div>
                  <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t-2 border-gray-200 flex justify-end gap-3">
                    <button
                      onClick={() => {
                        setShowStudentDetail(false);
                        setSelectedStudent(null);
                        setStudentDetails(null);
                      }}
                      className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-all"
                    >
                      Close
                    </button>
                    {selectedStudent && (
                      <button
                        onClick={() => {
                          setShowStudentDetail(false);
                          handleEditStudent(selectedStudent);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-xl transition-all"
                      >
                        <FiEdit className="inline mr-2" />
                        Edit Student
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Student Edit Modal */}
            {showStudentEdit && editingStudent && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between border-b-2 border-purple-700">
                    <h3 className="text-2xl font-black text-white flex items-center gap-3">
                      <FiEdit className="h-6 w-6" />
                      Edit Student: {editingStudent.name}
                    </h3>
                    <button
                      onClick={() => {
                        setShowStudentEdit(false);
                        setEditingStudent(null);
                      }}
                      className="p-2 hover:bg-white/20 rounded-lg text-white transition-all"
                    >
                      <FiX className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <StudentEditForm
                      student={editingStudent}
                      onSave={handleUpdateStudent}
                      onCancel={() => {
                        setShowStudentEdit(false);
                        setEditingStudent(null);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {total > 0 && (
              <div className="bg-white border-2 border-indigo-500 rounded-xl shadow-xl p-4 sm:p-6">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
                  {/* Left side - Info and Items per page */}
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="text-sm font-bold text-gray-700 text-center sm:text-left">
                      Showing{" "}
                      <span className="text-indigo-600 font-black">
                        {total > 0 ? (page - 1) * limit + 1 : 0}
                      </span>{" "}
                      to{" "}
                      <span className="text-indigo-600 font-black">
                        {Math.min(page * limit, total)}
                      </span>{" "}
                      of{" "}
                      <span className="text-indigo-600 font-black">
                        {total}
                      </span>{" "}
                      students
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-gray-700 whitespace-nowrap">
                        Items per page:
                      </label>
                      <select
                        value={limit}
                        onChange={(e) =>
                          handleLimitChange(Number(e.target.value))
                        }
                        className="px-3 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-bold text-sm bg-white text-indigo-600 cursor-pointer hover:bg-indigo-50"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  {/* Right side - Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={() => {
                          const newPage = Math.max(1, page - 1);
                          setPage(newPage);
                          setTimeout(() => fetchStudents(false), 100);
                        }}
                        disabled={page === 1}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-indigo-500 text-indigo-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-50 font-bold transition-all text-sm sm:text-base flex items-center gap-2"
                      >
                        <FiArrowLeft className="h-4 w-4" />
                        Previous
                      </button>

                      {/* Page numbers */}
                      <div className="flex items-center gap-1 sm:gap-2">
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (page <= 3) {
                              pageNum = i + 1;
                            } else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = page - 2 + i;
                            }

                            return (
                              <button
                                key={pageNum}
                                onClick={() => {
                                  setPage(pageNum);
                                  setTimeout(() => fetchStudents(false), 100);
                                }}
                                className={`px-3 sm:px-4 py-2 rounded-lg font-bold text-sm sm:text-base transition-all ${
                                  page === pageNum
                                    ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
                                    : "border-2 border-indigo-300 text-indigo-600 hover:bg-indigo-50"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>

                      <button
                        onClick={() => {
                          const newPage = Math.min(totalPages, page + 1);
                          setPage(newPage);
                          setTimeout(() => fetchStudents(false), 100);
                        }}
                        disabled={page === totalPages}
                        className="px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-indigo-500 text-indigo-600 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-indigo-50 font-bold transition-all text-sm sm:text-base flex items-center gap-2"
                      >
                        Next
                        <FiArrowLeft className="h-4 w-4 rotate-180" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes blob {
          0%,
          100% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-10px) translateX(5px);
          }
          50% {
            transform: translateY(-20px) translateX(0px);
          }
          75% {
            transform: translateY(-10px) translateX(-5px);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .animate-slide-in-right {
          animation: slideInRight 0.5s ease-out;
        }

        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out;
        }

        .animate-pulse-slow {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }

        /* Hover effects */
        .hover-lift {
          transition: all 0.3s ease;
        }

        .hover-lift:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25);
        }

        .hover-glow:hover {
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }

        ::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #f1f5f9, #e2e8f0);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed, #db2777);
        }

        /* Loading shimmer effect */
        .shimmer {
          background: linear-gradient(
            90deg,
            #f0f0f0 0px,
            #f8f8f8 40px,
            #f0f0f0 80px
          );
          background-size: 1000px;
          animation: shimmer 2s infinite;
        }

        /* Glassmorphism */
        .glass {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        /* 3D Card Effect */
        .card-3d {
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }

        .card-3d:hover {
          transform: rotateY(5deg) rotateX(5deg) scale(1.05);
        }

        /* Neon glow */
        .neon-blue {
          text-shadow: 0 0 10px #3b82f6, 0 0 20px #3b82f6, 0 0 30px #3b82f6;
        }

        .neon-purple {
          text-shadow: 0 0 10px #8b5cf6, 0 0 20px #8b5cf6, 0 0 30px #8b5cf6;
        }

        .neon-pink {
          text-shadow: 0 0 10px #ec4899, 0 0 20px #ec4899, 0 0 30px #ec4899;
        }

        /* Enhanced animations */
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          background-size: 1000px 100%;
          animation: shimmer 2s infinite;
        }

        /* Smooth transitions */
        * {
          transition-property: color, background-color, border-color,
            text-decoration-color, fill, stroke, opacity, box-shadow, transform,
            filter, backdrop-filter;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Custom scrollbar for better UX */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed, #db2777);
        }

        /* Glassmorphism effect */
        .glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        /* Pulse animation for live indicators */
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 0 0 currentColor;
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 0 8px transparent;
          }
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* Hover lift effect */
        .hover-lift {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Responsive text sizing */
        @media (max-width: 640px) {
          .responsive-text {
            font-size: 0.875rem;
          }
        }

        /* Focus states */
        button:focus-visible,
        input:focus-visible,
        select:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }

        /* Print styles */
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
