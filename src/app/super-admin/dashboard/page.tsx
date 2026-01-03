"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Shield,
  Settings,
  BarChart3,
  Plus,
  Eye,
  UserCheck,
  School,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  overview: {
    totalSchools: number;
    activeSchools: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
  };
  charts: {
    revenueByMonth: any[];
    schoolGrowth: any[];
  };
  recentActivity: {
    recentSchools: any[];
    topRevenueSchools: any[];
  };
}

export default function SuperAdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch("/api/super-admin/analytics");
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Platform-wide management and analytics</p>
            </div>
            <div className="flex space-x-3">
              <Button asChild>
                <Link href="/super-admin/schools">
                  <Plus className="w-4 h-4 mr-2" />
                  Add School
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/super-admin/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Schools</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.overview.totalSchools || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.overview.activeSchools || 0} active
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(analytics?.overview.totalRevenue || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +${(analytics?.overview.monthlyRevenue || 0).toLocaleString()} this month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(analytics?.overview.totalStudents || 0) +
                   (analytics?.overview.totalTeachers || 0) +
                   (analytics?.overview.totalAdmins || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics?.overview.totalStudents || 0} students, {analytics?.overview.totalTeachers || 0} teachers
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Health</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <School className="w-5 h-5 mr-2" />
                School Management
              </CardTitle>
              <CardDescription>Create and manage schools</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/super-admin/schools">Manage Schools</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Analytics
              </CardTitle>
              <CardDescription>View platform analytics</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/super-admin/analytics">View Analytics</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Usage Tracking
              </CardTitle>
              <CardDescription>Monitor school usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/super-admin/usage">View Usage</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="w-5 h-5 mr-2" />
                User Management
              </CardTitle>
              <CardDescription>Manage users across schools</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/super-admin/users">Manage Users</Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Schools</CardTitle>
                <CardDescription>Newly created schools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.recentActivity.recentSchools.slice(0, 3).map((school: any) => (
                    <div key={school.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-gray-500">{school.slug}</p>
                      </div>
                      <Badge variant="outline">
                        {new Date(school.createdAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">No recent schools</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Top Revenue Schools</CardTitle>
                <CardDescription>Highest revenue generating schools</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.recentActivity.topRevenueSchools.slice(0, 3).map((school: any, index: number) => (
                    <div key={school.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{school.name}</p>
                        <p className="text-sm text-gray-500">{school.slug}</p>
                      </div>
                      <Badge variant="secondary">
                        ${Number(school.revenue).toLocaleString()}
                      </Badge>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-sm">No revenue data</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}






