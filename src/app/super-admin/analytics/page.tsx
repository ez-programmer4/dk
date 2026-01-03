"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  DollarSign,
  Calendar,
  Activity,
  Globe,
  PieChart,
  Zap,
  Target,
  Award,
  MapPin,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { PageLoading } from "@/components/ui/LoadingSpinner";

interface AnalyticsData {
  overview: {
    totalSchools: number;
    activeSchools: number;
    totalRevenue: number;
    monthlyRevenue: number;
    totalStudents: number;
    totalTeachers: number;
    totalAdmins: number;
    averageStudentsPerSchool: number;
    averageRevenuePerSchool: number;
    churnRate: number;
    growthRate: number;
  };
  plans: {
    planDistribution: { name: string; count: number; percentage: number; revenue: number }[];
    popularPlans: any[];
  };
  geography: {
    schoolsByCountry: { country: string; count: number; revenue: number }[];
    topCountries: any[];
  };
  trends: {
    revenueByMonth: { month: string; revenue: number; schools: number; students: number }[];
    schoolGrowth: { month: string; newSchools: number; cumulative: number }[];
    userGrowth: { month: string; newStudents: number; newTeachers: number; cumulative: number }[];
  };
  performance: {
    averageSessionDuration: number;
    activeUsersToday: number;
    activeUsersThisWeek: number;
    activeUsersThisMonth: number;
    featureUsage: { feature: string; usage: number; percentage: number }[];
  };
  recentActivity: {
    recentSchools: any[];
    topRevenueSchools: any[];
    recentPayments: any[];
    systemAlerts: any[];
  };
}

export default function SuperAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/super-admin/analytics?period=${period}`);
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
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive platform insights and performance metrics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                {["7d", "30d", "90d", "1y"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      period === p
                        ? "bg-indigo-600 text-white shadow-lg"
                        : "bg-white text-gray-700 hover:bg-gray-50 border"
                    }`}
                  >
                    {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "1 Year"}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Custom Range
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="schools" className="flex items-center">
              <Building2 className="w-4 h-4 mr-2" />
              Schools
            </TabsTrigger>
            <TabsTrigger value="geography" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Geography
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">Total Schools</CardTitle>
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">{analytics?.overview.totalSchools || 0}</div>
                    <p className="text-sm text-blue-700 mt-1">
                      {analytics?.overview.activeSchools || 0} active schools
                    </p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-blue-600 mb-1">
                        <span>Growth Rate</span>
                        <span>+{analytics?.overview.growthRate || 0}%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">Total Revenue</CardTitle>
                    <DollarSign className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-900">
                      ${(analytics?.overview.totalRevenue || 0).toLocaleString()}
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      +${(analytics?.overview.monthlyRevenue || 0).toLocaleString()} this month
                    </p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-green-600 mb-1">
                        <span>Avg per School</span>
                        <span>${analytics?.overview.averageRevenuePerSchool || 0}</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">Total Users</CardTitle>
                    <Users className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900">
                      {((analytics?.overview.totalStudents || 0) +
                        (analytics?.overview.totalTeachers || 0) +
                        (analytics?.overview.totalAdmins || 0)).toLocaleString()}
                    </div>
                    <p className="text-sm text-purple-700 mt-1">
                      {analytics?.overview.averageStudentsPerSchool || 0} avg students per school
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-purple-900">{analytics?.overview.totalStudents || 0}</div>
                        <div className="text-purple-600">Students</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-900">{analytics?.overview.totalTeachers || 0}</div>
                        <div className="text-purple-600">Teachers</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-purple-900">{analytics?.overview.totalAdmins || 0}</div>
                        <div className="text-purple-600">Admins</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-800">Platform Health</CardTitle>
                    <Activity className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-900">
                      {analytics?.performance.activeUsersToday || 0}
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      Active users today
                    </p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-orange-600 mb-1">
                        <span>Churn Rate</span>
                        <span>{analytics?.overview.churnRate || 0}%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts and Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Revenue Trends
                    </CardTitle>
                    <CardDescription>Monthly revenue growth over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Revenue Analytics</p>
                        <p className="text-sm">Interactive charts coming soon</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      User Growth
                    </CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      <div className="text-center">
                        <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg font-medium">Growth Analytics</p>
                        <p className="text-sm">User acquisition metrics</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Recent Schools
                    </CardTitle>
                    <CardDescription>Newly registered schools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.recentActivity.recentSchools.slice(0, 5).map((school: any, index: number) => (
                        <motion.div
                          key={school.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                        >
                          <div>
                            <p className="font-semibold text-blue-900">{school.name}</p>
                            <p className="text-sm text-blue-600">{school.slug}</p>
                          </div>
                          <Badge variant="outline" className="bg-white">
                            {new Date(school.createdAt).toLocaleDateString()}
                          </Badge>
                        </motion.div>
                      )) || (
                        <div className="text-center py-8">
                          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                          <p className="text-gray-500">No recent schools</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.7 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Top Performers
                    </CardTitle>
                    <CardDescription>Highest revenue generating schools</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.recentActivity.topRevenueSchools.slice(0, 5).map((school: any, index: number) => (
                        <motion.div
                          key={school.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50"
                        >
                          <div>
                            <p className="font-semibold text-green-900">{school.name}</p>
                            <p className="text-sm text-green-600">{school.slug}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            ${Number(school.revenue || 0).toLocaleString()}
                          </Badge>
                        </motion.div>
                      )) || (
                        <div className="text-center py-8">
                          <Award className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                          <p className="text-gray-500">No revenue data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.8 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Target className="w-5 h-5 mr-2" />
                      Plan Distribution
                    </CardTitle>
                    <CardDescription>Subscription plan adoption</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analytics?.plans.planDistribution.slice(0, 5).map((plan: any, index: number) => (
                        <motion.div
                          key={plan.name}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.1 }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{plan.name}</span>
                            <span className="text-sm text-gray-600">
                              {plan.count} schools ({plan.percentage}%)
                            </span>
                          </div>
                          <Progress value={plan.percentage} className="h-2" />
                        </motion.div>
                      )) || (
                        <div className="text-center py-8">
                          <PieChart className="w-12 h-12 mx-auto mb-4 opacity-50 text-gray-400" />
                          <p className="text-gray-500">No plan data available</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
                <CardDescription>Detailed revenue insights and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <DollarSign className="w-20 h-20 mx-auto mb-6 opacity-50 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Revenue Analytics Coming Soon</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Advanced revenue charts, forecasting, and financial insights will be implemented here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schools" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>School Analytics</CardTitle>
                <CardDescription>School performance and growth metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <Building2 className="w-20 h-20 mx-auto mb-6 opacity-50 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">School Analytics Coming Soon</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    School growth trends, performance metrics, and engagement analytics.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="geography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Geographic Analytics</CardTitle>
                <CardDescription>School distribution and regional insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <Globe className="w-20 h-20 mx-auto mb-6 opacity-50 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Geographic Analytics Coming Soon</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    Map-based school distribution, regional performance, and geographic insights.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Performance</CardTitle>
                <CardDescription>User engagement and system performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16">
                  <Zap className="w-20 h-20 mx-auto mb-6 opacity-50 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Performance Analytics Coming Soon</h3>
                  <p className="text-gray-600 max-w-md mx-auto">
                    User activity, feature usage, and platform performance monitoring.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}






