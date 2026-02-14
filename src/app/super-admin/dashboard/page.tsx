"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Crown,
  Shield,
  Settings,
  Bot,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Calendar,
  RefreshCw,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Database,
  Server,
  Wifi,
  Globe,
  Award,
  MessageSquare,
  FileText,
  Bell,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/components/ui/use-toast";

interface DashboardStats {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  totalStudents: number;
  totalTeachers: number;
  pendingRegistrations: number;
  totalRevenue: number;
  monthlyRevenue: number;
  currency: string;
  systemHealth: {
    database: boolean;
    api: boolean;
    services: boolean;
  };
}

interface RecentActivity {
  id: string;
  type: 'school_created' | 'school_approved' | 'school_deactivated' | 'payment_received' | 'feature_enabled';
  title: string;
  description: string;
  timestamp: string;
  schoolName?: string;
  amount?: number;
  currency?: string;
}

interface PendingRegistration {
  id: string;
  schoolName: string;
  email: string;
  phone?: string;
  requestedAt: string;
  status: string;
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/super-admin/dashboard');
      const data = await response.json();

      console.log('Dashboard data received:', data);
      if (data.recentActivities) {
        data.recentActivities.forEach((activity: any, index: number) => {
          console.log(`Activity ${index}:`, activity.title, 'Description type:', typeof activity.description, 'Description:', activity.description);
        });
      }

      if (data.success) {
        setStats(data.stats);
        setRecentActivities(data.recentActivities || []);
        setPendingRegistrations(data.pendingRegistrations || []);
      } else {
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'school_created': return <Building2 className="w-4 h-4" />;
      case 'school_approved': return <CheckCircle className="w-4 h-4" />;
      case 'school_deactivated': return <AlertCircle className="w-4 h-4" />;
      case 'payment_received': return <DollarSign className="w-4 h-4" />;
      case 'feature_enabled': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'school_created': return 'text-blue-600';
      case 'school_approved': return 'text-green-600';
      case 'school_deactivated': return 'text-red-600';
      case 'payment_received': return 'text-emerald-600';
      case 'feature_enabled': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Super Admin Dashboard
                </h1>
                <p className="text-gray-600 mt-1">Platform control center & analytics overview</p>
              </motion.div>
            </div>
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchDashboardData}
                  disabled={refreshing}
                  className="backdrop-blur-sm bg-white/50 hover:bg-white/70"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Link href="/super-admin/settings">
                  <Button className="backdrop-blur-sm bg-white/50 hover:bg-white/70">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome & System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2"
          >
            <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-200/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-indigo-900">
                  <Crown className="w-6 h-6 mr-3 text-indigo-600" />
                  Super Administrator Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700">
                    You have full access to manage the platform. Monitor system health, manage schools, and oversee revenue streams.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2 text-green-600" />
                      <span>Full Platform Access</span>
                    </div>
                    <div className="flex items-center">
                      <Crown className="w-4 h-4 mr-2 text-purple-600" />
                      <span>Super Admin Privileges</span>
                    </div>
                    <div className="flex items-center">
                      <Zap className="w-4 h-4 mr-2 text-blue-600" />
                      <span>Real-time Analytics</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* System Health */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="backdrop-blur-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-green-600" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading ? (
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-2 text-blue-600" />
                          <span className="text-sm">Database</span>
                        </div>
                        <Badge variant={stats?.systemHealth.database ? "default" : "destructive"} className="text-xs">
                          {stats?.systemHealth.database ? "Operational" : "Issues"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Server className="w-4 h-4 mr-2 text-purple-600" />
                          <span className="text-sm">API Services</span>
                        </div>
                        <Badge variant={stats?.systemHealth.api ? "default" : "destructive"} className="text-xs">
                          {stats?.systemHealth.api ? "Healthy" : "Issues"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Wifi className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-sm">Services</span>
                        </div>
                        <Badge variant={stats?.systemHealth.services ? "default" : "destructive"} className="text-xs">
                          {stats?.systemHealth.services ? "Running" : "Issues"}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Statistics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Schools */}
            <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Schools</p>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse mt-2 w-16"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalSchools || 0}</p>
                    )}
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-green-600 flex items-center">
                        <ArrowUpRight className="w-3 h-3 mr-1" />
                        {stats?.activeSchools || 0} active
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Students */}
            <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse mt-2 w-20"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents?.toLocaleString() || 0}</p>
                    )}
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-blue-600 flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Across all schools
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Revenue */}
            <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse mt-2 w-24"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(stats?.monthlyRevenue || 0, stats?.currency)}
                      </p>
                    )}
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-emerald-600 flex items-center">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        This month
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pending Approvals */}
            <Card className="backdrop-blur-sm bg-white/50 hover:bg-white/70 transition-all duration-300 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    {loading ? (
                      <div className="h-8 bg-gray-200 rounded animate-pulse mt-2 w-12"></div>
                    ) : (
                      <p className="text-3xl font-bold text-gray-900">{stats?.pendingRegistrations || 0}</p>
                    )}
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-orange-600 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Requires attention
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-1"
          >
            <Card className="backdrop-blur-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-purple-600" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/super-admin/schools">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-150 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Building2 className="w-6 h-6 text-blue-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Manage Schools</h3>
                          <p className="text-sm text-gray-600">School administration</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <Link href="/super-admin/school-registrations">
                  <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-150 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-6 h-6 text-green-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">School Approvals</h3>
                          <p className="text-sm text-gray-600">
                            {loading ? '...' : `${stats?.pendingRegistrations || 0} pending`}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <Link href="/super-admin/payments">
                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg hover:from-emerald-100 hover:to-emerald-150 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="w-6 h-6 text-emerald-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Revenue Management</h3>
                          <p className="text-sm text-gray-600">
                            {loading ? '...' : formatCurrency(stats?.monthlyRevenue || 0, stats?.currency)}
                          </p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <Link href="/super-admin/premium-features">
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-150 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Award className="w-6 h-6 text-purple-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Premium Features</h3>
                          <p className="text-sm text-gray-600">Manage add-ons</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>

                <Link href="/super-admin/settings">
                  <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:from-gray-100 hover:to-gray-150 transition-all duration-300 cursor-pointer group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Bot className="w-6 h-6 text-gray-600" />
                        <div>
                          <h3 className="font-medium text-gray-900">Bot Settings</h3>
                          <p className="text-sm text-gray-600">Configure Telegram</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity & Pending Registrations */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Recent Activity */}
            <Card className="backdrop-blur-sm bg-white/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-16 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : recentActivities.length > 0 ? (
                    recentActivities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50/50 transition-colors">
                        <div className={`p-2 rounded-full ${getActivityColor(activity.type).replace('text-', 'bg-').replace('-600', '-100')}`}>
                          <div className={getActivityColor(activity.type)}>
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.title}
                            </p>
                            <span className="text-xs text-gray-500">
                              {formatDate(activity.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {typeof activity.description === 'string'
                              ? activity.description
                              : 'Activity details unavailable'
                            }
                          </p>
                          {activity.schoolName && (
                            <p className="text-xs text-gray-500 mt-1">
                              School: {activity.schoolName}
                            </p>
                          )}
                          {activity.amount && (
                            <p className="text-xs font-medium text-emerald-600 mt-1">
                              {formatCurrency(activity.amount, activity.currency)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No recent activity</p>
                    </div>
                  )}
                </div>
                {recentActivities.length > 5 && (
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="ghost" className="w-full">
                      View All Activity
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Registrations */}
            {pendingRegistrations.length > 0 && (
              <Card className="backdrop-blur-sm bg-white/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-orange-600" />
                    Pending Registrations
                    <Badge variant="secondary" className="ml-auto">
                      {pendingRegistrations.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingRegistrations.slice(0, 3).map((registration) => (
                      <div key={registration.id} className="flex items-center justify-between p-3 bg-orange-50/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-orange-100 text-orange-600 text-xs">
                              {registration.schoolName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {registration.schoolName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {registration.email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {formatDate(registration.requestedAt)}
                          </p>
                          <Link href="/super-admin/school-registrations">
                            <Button size="sm" variant="outline" className="mt-1">
                              Review
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pendingRegistrations.length > 3 && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href="/super-admin/school-registrations">
                        <Button variant="outline" className="w-full">
                          View All Pending ({pendingRegistrations.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}






