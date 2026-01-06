"use client";

import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import {
  FiCalendar,
  FiDollarSign,
  FiAward,
  FiAlertTriangle,
  FiDownload,
  FiCheckCircle,
  FiCheck,
  FiXCircle,
  FiRefreshCw,
  FiTrendingUp,
  FiTrendingDown,
  FiUsers,
  FiClock,
  FiFileText,
  FiInfo,
} from "react-icons/fi";
import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/lib/formatters";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { useParams } from "next/navigation";

interface SalaryData {
  teacher: {
    id: string;
    name: string;
  };
  period: {
    from: string;
    to: string;
  };
  totalSalary: number;
  totalWorkingDays: number;
  totalClasses: number;
  averageDailySalary: number;
  bonus: {
    total: number;
    breakdown: any[];
  };
  deductions: {
    total: number;
    breakdown: any[];
  };
  attendance: {
    total: number;
    present: number;
    absent: number;
    late: number;
    rate: number;
  };
  meetings: {
    total: number;
    completed: number;
    missed: number;
    rate: number;
  };
  quality: {
    rating: number;
    feedback: any[];
  };
  monthlyBreakdown: any[];
  weeklyBreakdown: any[];
  dailyBreakdown: any[];
  zoomUsage: any[];
}

export default function TeacherSalaryPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [salaryData, setSalaryData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>(
    dayjs().startOf("month").format("YYYY-MM-DD")
  );
  const [toDate, setToDate] = useState<string>(
    dayjs().endOf("month").format("YYYY-MM-DD")
  );
  const [includeDetails, setIncludeDetails] = useState(false);

  const fetchSalaryData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        from: fromDate,
        to: toDate,
        ...(includeDetails && { details: "true" }),
      });

      const response = await fetch(`/api/${schoolSlug}/teachers/salary?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch salary data");
      }

      const data = await response.json();
      setSalaryData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load salary data");
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, includeDetails, schoolSlug]);

  useEffect(() => {
    fetchSalaryData();
  }, [fetchSalaryData]);

  const exportSalaryReport = () => {
    if (!salaryData) return;

    const reportData = {
      teacher: salaryData.teacher,
      period: salaryData.period,
      summary: {
        totalSalary: salaryData.totalSalary,
        workingDays: salaryData.totalWorkingDays,
        totalClasses: salaryData.totalClasses,
        averageDailySalary: salaryData.averageDailySalary,
      },
      breakdown: salaryData.monthlyBreakdown,
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `salary-report-${salaryData.teacher.name}-${salaryData.period.from}-to-${salaryData.period.to}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  if (loading && !salaryData) {
    return <PageLoading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Salary Overview</h1>
          <p className="text-gray-600">View your salary details and earnings breakdown</p>
        </div>
        {salaryData && (
          <Button onClick={exportSalaryReport} variant="outline">
            <FiDownload className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        )}
      </div>

      {/* Date Range Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FiCalendar className="w-5 h-5" />
            Select Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                From Date
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                To Date
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={includeDetails}
                  onChange={(e) => setIncludeDetails(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Include Details</span>
              </label>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchSalaryData} disabled={loading}>
                {loading ? (
                  <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <FiRefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <FiAlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Salary Data */}
      {salaryData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Salary</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(salaryData.totalSalary)}
                    </p>
                  </div>
                  <FiDollarSign className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Working Days</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {salaryData.totalWorkingDays}
                    </p>
                  </div>
                  <FiCalendar className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Classes</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {salaryData.totalClasses}
                    </p>
                  </div>
                  <FiUsers className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Average</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatCurrency(salaryData.averageDailySalary)}
                    </p>
                  </div>
                  <FiTrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown */}
          <Tabs defaultValue="monthly" className="space-y-4">
            <TabsList>
              <TabsTrigger value="monthly">Monthly Breakdown</TabsTrigger>
              <TabsTrigger value="weekly">Weekly Breakdown</TabsTrigger>
              <TabsTrigger value="daily">Daily Breakdown</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              {salaryData.monthlyBreakdown?.map((month: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{dayjs(month.date).format("MMMM YYYY")}</CardTitle>
                    <CardDescription>
                      {month.workingDays} working days • {month.classes} classes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Base Salary</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(month.baseSalary)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Bonus</p>
                        <p className="text-lg font-semibold text-green-600">
                          {formatCurrency(month.bonus)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Deductions</p>
                        <p className="text-lg font-semibold text-red-600">
                          -{formatCurrency(month.deductions)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Net Salary</p>
                        <p className="text-lg font-bold">
                          {formatCurrency(month.netSalary)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              {salaryData.weeklyBreakdown?.map((week: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>Week {index + 1}</CardTitle>
                    <CardDescription>
                      {dayjs(week.startDate).format("MMM D")} - {dayjs(week.endDate).format("MMM D, YYYY")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Classes</p>
                        <p className="text-lg font-semibold">{week.classes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Salary</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(week.salary)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Quality Rating</p>
                        <p className="text-lg font-semibold">{week.qualityRating || "N/A"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="daily" className="space-y-4">
              {salaryData.dailyBreakdown?.map((day: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{dayjs(day.date).format("MMM D, YYYY")}</CardTitle>
                    <CardDescription>{day.dayOfWeek}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Classes</p>
                        <p className="text-lg font-semibold">{day.classes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Salary</p>
                        <p className="text-lg font-semibold">
                          {formatCurrency(day.salary)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Attendance</p>
                        <p className="text-lg font-semibold">{day.attendance}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Zoom Usage</p>
                        <p className="text-lg font-semibold">{day.zoomMinutes || 0} min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

          {/* Attendance & Quality Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5" />
                  Attendance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Classes</span>
                    <span className="font-semibold">{salaryData.attendance.total}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Present</span>
                    <span className="font-semibold text-green-600">{salaryData.attendance.present}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Absent</span>
                    <span className="font-semibold text-red-600">{salaryData.attendance.absent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Attendance Rate</span>
                    <span className="font-semibold">{formatPercentage(salaryData.attendance.rate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FiAward className="w-5 h-5" />
                  Quality Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {salaryData.quality.rating}/10
                  </div>
                  <p className="text-gray-600">Overall Quality Score</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!loading && !salaryData && !error && (
        <Card>
          <CardContent className="pt-6 text-center">
            <FiInfo className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
            <p className="text-gray-600">Select a date range to view your salary information.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
