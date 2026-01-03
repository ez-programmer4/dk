"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  BookOpen,
  Calendar,
  TrendingUp,
  Search,
  Filter,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageLoading } from "@/components/ui/LoadingSpinner";

interface UsageData {
  schoolId: string;
  schoolName: string;
  schoolSlug: string;
  period: string;
  studentCount: number;
  teacherCount: number;
  adminCount: number;
  sessionCount: number;
  totalHours: number;
  storageUsed: number;
  revenue: number;
  planName: string;
  maxStudents: number;
  maxTeachers: number;
  lastUpdated: string;
  status: "active" | "over_limit" | "inactive";
}

interface UsageSummary {
  totalSchools: number;
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  averageUtilization: number;
  schoolsOverLimit: number;
}

export default function SuperAdminUsage() {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [periodFilter, setPeriodFilter] = useState("current");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("");

  useEffect(() => {
    fetchUsageData();
    fetchSummary();
  }, [periodFilter]);

  const fetchUsageData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (periodFilter !== "all") {
        params.append("period", periodFilter);
      }
      if (selectedPeriod) {
        params.append("specificPeriod", selectedPeriod);
      }

      const response = await fetch(`/api/super-admin/usage?${params}`);
      const data = await response.json();

      if (data.success) {
        setUsageData(data.usage);
      }
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch("/api/super-admin/usage/summary");
      const data = await response.json();

      if (data.success) {
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch usage summary:", error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchUsageData(), fetchSummary()]);
    setRefreshing(false);
  };

  const getStatusBadge = (status: string, usage: UsageData) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case "over_limit":
        return <Badge className="bg-red-100 text-red-800">Over Limit</Badge>;
      case "inactive":
        return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getUtilizationColor = (current: number, max: number) => {
    const utilization = (current / max) * 100;
    if (utilization >= 90) return "text-red-600";
    if (utilization >= 75) return "text-yellow-600";
    return "text-green-600";
  };

  const filteredData = usageData.filter((usage) => {
    const matchesSearch =
      usage.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.schoolSlug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usage.planName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || usage.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const exportData = () => {
    const csvContent = [
      [
        "School Name",
        "Plan",
        "Period",
        "Students",
        "Max Students",
        "Teachers",
        "Max Teachers",
        "Sessions",
        "Hours",
        "Revenue",
        "Status",
        "Last Updated",
      ].join(","),
      ...filteredData.map((usage) =>
        [
          `"${usage.schoolName}"`,
          `"${usage.planName}"`,
          usage.period,
          usage.studentCount,
          usage.maxStudents,
          usage.teacherCount,
          usage.maxTeachers,
          usage.sessionCount,
          (Number(usage.totalHours) || 0).toFixed(1),
          (Number(usage.revenue) || 0).toFixed(2),
          usage.status,
          usage.lastUpdated,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `usage-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Usage Tracking</h1>
              <p className="text-gray-600 mt-1">
                Monitor school usage, limits, and billing metrics
              </p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={exportData}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalSchools}</div>
                  <p className="text-xs text-muted-foreground">
                    {summary.schoolsOverLimit} over limit
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalStudents.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    {(Number(summary.averageUtilization) || 0).toFixed(1)}% avg utilization
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary.totalTeachers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all schools
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${summary.totalRevenue.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    From active subscriptions
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Period</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="last_6_months">Last 6 Months</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="over_limit">Over Limit</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Usage Table */}
        <Card>
          <CardHeader>
            <CardTitle>School Usage Details</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PageLoading />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Teachers</TableHead>
                    <TableHead>Sessions</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((usage) => (
                    <TableRow key={`${usage.schoolId}-${usage.period}`}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{usage.schoolName}</div>
                          <div className="text-sm text-gray-500">{usage.schoolSlug}</div>
                          <div className="text-xs text-gray-400">{usage.period}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{usage.planName}</div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getUtilizationColor(usage.studentCount, usage.maxStudents)}`}>
                          {usage.studentCount}
                        </div>
                        <div className="text-xs text-gray-500">
                          of {usage.maxStudents || 'Unlimited'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getUtilizationColor(usage.teacherCount, usage.maxTeachers || 999)}`}>
                          {usage.teacherCount}
                        </div>
                        <div className="text-xs text-gray-500">
                          of {usage.maxTeachers || 'Unlimited'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{usage.sessionCount.toLocaleString()}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{(Number(usage.totalHours) || 0).toFixed(1)}h</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">${(Number(usage.revenue) || 0).toFixed(2)}</div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(usage.status, usage)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(usage.lastUpdated).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {filteredData.length === 0 && !loading && (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No usage data found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Usage data will appear here once schools become active"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts for schools over limit */}
        {summary && summary.schoolsOverLimit > 0 && (
          <Card className="mt-6 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center text-red-800">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Schools Over Usage Limits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-700 mb-4">
                {summary.schoolsOverLimit} school{summary.schoolsOverLimit > 1 ? 's' : ''} have exceeded their plan limits.
                Consider upgrading their plans or reducing usage.
              </p>
              <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
                View Over-Limit Schools
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

