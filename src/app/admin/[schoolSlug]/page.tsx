"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  FiUsers,
  FiBookOpen,
  FiDollarSign,
  FiClipboard,
  FiSettings,
  FiActivity,
  FiUser,
  FiBarChart,
  FiPieChart,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiMenu,
  FiX,
  FiBell,
  FiSearch,
  FiAward,
  FiZap,
  FiEye,
  FiShield,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiMaximize2,
  FiMinimize2,
  FiSun,
  FiMoon,
  FiInfo,
  FiAlertTriangle,
  FiTrendingUp,
  FiTarget,
  FiCalendar,
  FiClock,
} from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import { Button } from "@/components/ui/button";
import React from "react";

// Temporary Card components for testing
const Card = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`rounded-lg border bg-white shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

const CardContent = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSkeleton } from "./components/DashboardSkeleton";
import { format } from "date-fns";

// Navigation items for the admin dashboard
const navigationItems = [
  { name: "Dashboard", icon: FiBarChart, href: "", active: true },
  { name: "Students", icon: FiBookOpen, href: "students" },
  { name: "Teachers", icon: FiUsers, href: "teachers" },
  { name: "Payments", icon: FiDollarSign, href: "payments" },
  { name: "Quality", icon: FiTrendingUp, href: "quality" },
  { name: "Attendance", icon: FiCalendar, href: "attendance" },
  { name: "Settings", icon: FiSettings, href: "settings" },
];

export default function AdminDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.schoolSlug as string;
  const { data: session, status } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTimeRange, setSelectedTimeRange] = useState("30d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expandedCharts, setExpandedCharts] = useState<string[]>([]);

  // Key metrics state
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    pendingPayments: 0,
    pendingPermissions: 0,
    attendanceRate: 85,
    monthlyRevenue: 25000,
    totalRevenue: 285000,
    activeCourses: 45,
    avgGrade: 87,
  });

  // Chart data
  const [chartData, setChartData] = useState({
    revenueData: [
      { month: 'Jan', revenue: 18500, students: 145 },
      { month: 'Feb', revenue: 21000, students: 152 },
      { month: 'Mar', revenue: 19800, students: 148 },
      { month: 'Apr', revenue: 22500, students: 158 },
      { month: 'May', revenue: 24200, students: 165 },
      { month: 'Jun', revenue: 25600, students: 172 },
    ],
    attendanceData: [
      { day: 'Mon', attendance: 92 },
      { day: 'Tue', attendance: 88 },
      { day: 'Wed', attendance: 95 },
      { day: 'Thu', attendance: 90 },
      { day: 'Fri', attendance: 87 },
      { day: 'Sat', attendance: 78 },
    ],
    paymentStatusData: [
      { name: 'Completed', value: 68, color: '#10b981' },
      { name: 'Pending', value: 22, color: '#f59e0b' },
      { name: 'Overdue', value: 10, color: '#ef4444' },
    ],
    gradeDistribution: [
      { grade: 'A', count: 45, percentage: 32 },
      { grade: 'B', count: 58, percentage: 41 },
      { grade: 'C', count: 28, percentage: 20 },
      { grade: 'D', count: 9, percentage: 6 },
      { grade: 'F', count: 1, percentage: 1 },
    ],
    teacherPerformance: [
      { name: 'Mathematics', score: 92, students: 45 },
      { name: 'English', score: 89, students: 42 },
      { name: 'Science', score: 94, students: 38 },
      { name: 'History', score: 87, students: 35 },
      { name: 'Arts', score: 91, students: 28 },
    ],
    studentGrowth: [
      { month: 'Aug', newStudents: 12, totalStudents: 245 },
      { month: 'Sep', newStudents: 8, totalStudents: 253 },
      { month: 'Oct', newStudents: 15, totalStudents: 268 },
      { month: 'Nov', newStudents: 6, totalStudents: 274 },
      { month: 'Dec', newStudents: 3, totalStudents: 277 },
      { month: 'Jan', newStudents: 9, totalStudents: 286 },
    ],
    financialOverview: {
      monthlyBudget: 45000,
      monthlyExpenses: 38500,
      monthlyRevenue: metrics.monthlyRevenue,
      profitMargin: 14.4,
      outstandingPayments: 12500,
      paidInvoices: 87500,
    },
  });

  const [loading, setLoading] = useState(true);
  const [schoolBranding, setSchoolBranding] = useState<{
    name: string;
    logoUrl?: string;
    primaryColor: string;
    secondaryColor: string;
  }>({
    name: "School Dashboard",
    primaryColor: "#3b82f6",
    secondaryColor: "#8b5cf6"
  });

  // Recent activities with more detailed data
  const [recentActivities] = useState([
    {
      id: 1,
      type: "payment",
      message: "Payment received from John Doe",
      time: "2 mins ago",
      status: "success",
      amount: "$150.00",
      details: "Monthly tuition fee"
    },
    {
      id: 2,
      type: "permission",
      message: "Permission request from Teacher Smith",
      time: "15 mins ago",
      status: "pending",
      details: "Sick leave for 2 days",
      priority: "medium"
    },
    {
      id: 3,
      type: "attendance",
      message: "Low attendance alert for Grade 5A",
      time: "1 hour ago",
      status: "warning",
      details: "Only 18 out of 25 students present",
      class: "Mathematics"
    },
    {
      id: 4,
      type: "student",
      message: "New student registration: Jane Wilson",
      time: "2 hours ago",
      status: "success",
      details: "Grade 3A, transferred from Lincoln High",
      grade: "3A"
    },
    {
      id: 5,
      type: "quality",
      message: "Quality review completed for Science class",
      time: "3 hours ago",
      status: "success",
      details: "Score: 94/100 - Excellent teaching methods",
      teacher: "Dr. Johnson"
    },
  ]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboard = async () => {
      // Don't load data if user is not authenticated
      if (status !== "authenticated" || !session?.user) {
        return;
      }

      setLoading(true);
      try {
        // Fetch school branding
        const brandingRes = await fetch(`/api/admin/${schoolSlug}/branding`);
        if (brandingRes.ok) {
          const brandingData = await brandingRes.json();
          setSchoolBranding({
            name: brandingData.name || "School Dashboard",
            logoUrl: brandingData.logoUrl,
            primaryColor: brandingData.primaryColor || "#3b82f6",
            secondaryColor: brandingData.secondaryColor || "#8b5cf6"
          });
        }

        // Fetch key metrics
        const [statsRes, permissionsRes] = await Promise.all([
          fetch(`/api/admin/${schoolSlug}/stats`),
          fetch(`/api/admin/${schoolSlug}/permissions?status=Pending&limit=1`)
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setMetrics({
            totalStudents: statsData.students || 0,
            totalTeachers: statsData.teachers || 0,
            pendingPayments: statsData.pendingPayments || 0,
            pendingPermissions: permissionsRes.ok ? (await permissionsRes.json()).length || 0 : 0,
            attendanceRate: 85, // Mock data - would come from attendance API
            monthlyRevenue: 25000, // Mock data - would come from analytics API
            totalRevenue: 285000, // Mock data - would come from analytics API
            activeCourses: 45, // Mock data - would come from courses API
            avgGrade: 87, // Mock data - would come from grades API
          });
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [schoolSlug, status, session]);

  // Apply dynamic branding styles
  useEffect(() => {
    const styleId = 'dashboard-branding-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      /* Modern Scrollbar */
      ::-webkit-scrollbar {
        width: 8px;
      }
      ::-webkit-scrollbar-track {
        background: rgba(241, 245, 249, 0.8);
        border-radius: 12px;
        margin: 4px;
      }
      ::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, ${schoolBranding.primaryColor}, ${schoolBranding.secondaryColor});
        border-radius: 12px;
        box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.1);
        transition: all 0.3s ease;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, ${schoolBranding.primaryColor}dd, ${schoolBranding.secondaryColor}dd);
        box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.2);
        transform: scale(1.1);
      }

      /* Modern Animations */
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes glow {
        0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
        50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6); }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-10px); }
      }

      .animate-shimmer {
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.4),
          transparent
        );
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }

      .animate-glow {
        animation: glow 3s ease-in-out infinite;
      }

      .animate-float {
        animation: float 4s ease-in-out infinite;
      }

      /* Glass morphism effects */
      .glass-effect {
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      /* Enhanced hover effects */
      .hover-lift:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      }

      /* Modern button effects */
      .btn-modern {
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, ${schoolBranding.primaryColor}, ${schoolBranding.secondaryColor});
        transition: all 0.3s ease;
      }

      .btn-modern::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s;
      }

      .btn-modern:hover::before {
        left: 100%;
      }

      /* Enhanced card animations */
      .card-modern {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        transform-style: preserve-3d;
      }

      .card-modern:hover {
        transform: translateY(-8px) rotateX(5deg) rotateY(5deg);
        box-shadow:
          0 25px 50px -12px rgba(0, 0, 0, 0.25),
          0 0 0 1px rgba(255, 255, 255, 0.1);
      }

      /* Modern gradient text */
      .gradient-text {
        background: linear-gradient(135deg, ${schoolBranding.primaryColor}, ${schoolBranding.secondaryColor});
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      /* Pulse animation for live indicators */
      .pulse-live {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      /* Modern loading skeleton */
      .skeleton-modern {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }

      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* Shimmer animation for skeleton */
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      .animate-shimmer {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
        background-size: 200% 100%;
        animation: shimmer 2s infinite;
      }
    `;

    return () => {
      const element = document.getElementById(styleId);
      if (element) {
        document.head.removeChild(element);
      }
    };
  }, [schoolBranding.primaryColor, schoolBranding.secondaryColor]);

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 flex">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="fixed inset-y-0 left-0 z-50 w-70 bg-white shadow-xl lg:relative lg:translate-x-0"
          >
            <div className="flex flex-col h-full">
              {/* Logo/Brand */}
              <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
                {schoolBranding.logoUrl && (
                  <img
                    src={schoolBranding.logoUrl}
                    alt={schoolBranding.name}
                    className="w-8 h-8 rounded mr-3"
                  />
                )}
                <h2
                  className="text-lg font-bold truncate"
                  style={{ color: schoolBranding.primaryColor }}
                >
                  {schoolBranding.name}
                </h2>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.name.toLowerCase();

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        setActiveTab(item.name.toLowerCase());
                        setSidebarOpen(false);
                        if (item.href) {
                          router.push(`/admin/${schoolSlug}/${item.href}`);
                        }
                      }}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-opacity-10 shadow-sm'
                          : 'hover:bg-gray-100'
                      }`}
                      style={isActive ? { backgroundColor: `${schoolBranding.primaryColor}10`, color: schoolBranding.primaryColor } : {}}
                    >
                      <Icon className="w-5 h-5 mr-3" />
                      <span className="font-medium">{item.name}</span>
                      {isActive && <FiArrowRight className="w-4 h-4 ml-auto" />}
                    </button>
                  );
                })}
              </nav>

              {/* User Info */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback style={{ backgroundColor: schoolBranding.primaryColor }}>
                      A
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Admin</p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Modern Top Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-white/20 px-6 py-5 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden hover:bg-white/10 transition-all duration-200"
              >
                <FiMenu className="w-5 h-5" />
              </Button>

              <div className="flex items-center space-x-4">
                {schoolBranding.logoUrl && (
                  <motion.img
                    src={schoolBranding.logoUrl}
                    alt={schoolBranding.name}
                    className="w-10 h-10 rounded-xl shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {schoolBranding.name}
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center">
                    <FiTarget className="w-4 h-4 mr-1" />
                    Advanced Analytics Dashboard
                  </p>
                </div>
              </div>
            </div>

            {/* Modern Control Panel */}
            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Input
                  placeholder="Search analytics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 bg-white/50 border-white/30 backdrop-blur-sm focus:bg-white/80 transition-all duration-200"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>

              {/* Time Range Selector */}
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32 bg-white/50 border-white/30 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="hover:bg-white/10 transition-all duration-200"
              >
                {isDarkMode ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
              </Button>

              {/* Refresh Data */}
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-white/10 transition-all duration-200"
                onClick={() => window.location.reload()}
              >
                <FiRefreshCw className="w-5 h-5" />
              </Button>

              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative hover:bg-white/10 transition-all duration-200">
                <FiBell className="w-5 h-5" />
                {recentActivities.filter(a => a.status === 'pending' || a.status === 'warning').length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg"
                  />
                )}
              </Button>

              {/* Export Data */}
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-white/10 transition-all duration-200"
              >
                <FiDownload className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters Bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-white/50 backdrop-blur-sm border border-white/30">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-white/80">Overview</TabsTrigger>
                  <TabsTrigger value="analytics" className="data-[state=active]:bg-white/80">Analytics</TabsTrigger>
                  <TabsTrigger value="reports" className="data-[state=active]:bg-white/80">Reports</TabsTrigger>
                  <TabsTrigger value="insights" className="data-[state=active]:bg-white/80">Insights</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live Data</span>
              </div>
              <div className="w-px h-4 bg-gray-300"></div>
              <span>Last updated: {format(new Date(), "HH:mm:ss")}</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Modern Welcome Section with Glass Morphism */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl p-8 bg-gradient-to-br from-white/90 via-white/70 to-white/90 backdrop-blur-xl border border-white/20 shadow-2xl"
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))`,
                boxShadow: `0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.05)`
              }}
            >
              {/* Animated Background Elements */}
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute -top-10 -right-10 w-40 h-40 rounded-full opacity-10"
                  style={{ backgroundColor: schoolBranding.primaryColor }}
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <motion.div
                  className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10"
                  style={{ backgroundColor: schoolBranding.secondaryColor }}
                  animate={{
                    scale: [1.2, 1, 1.2],
                    rotate: [360, 180, 0],
                  }}
                  transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex-1">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent mb-3">
                      Welcome back, Admin! 🚀
                    </h2>
                    <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                      Your school's performance at a glance. Everything is running smoothly.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap items-center gap-6"
                  >
                    <div className="flex items-center bg-green-50 px-4 py-2 rounded-full border border-green-100">
                      <FiCheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <span className="text-sm font-medium text-green-700">All systems operational</span>
                    </div>
                    <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                      <FiClock className="w-5 h-5 text-blue-600 mr-3" />
                      <span className="text-sm font-medium text-blue-700">
                        Updated {format(new Date(), "MMM dd, HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center bg-purple-50 px-4 py-2 rounded-full border border-purple-100">
                      <FiTrendingUp className="w-5 h-5 text-purple-600 mr-3" />
                      <span className="text-sm font-medium text-purple-700">+12% growth this month</span>
                    </div>
                  </motion.div>
                </div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
                  className="hidden lg:block ml-8"
                >
                  <div className="relative">
                    <div
                      className="w-32 h-32 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${schoolBranding.primaryColor}, ${schoolBranding.secondaryColor})`
                      }}
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      />
                      <FiBarChart className="w-16 h-16 text-white relative z-10" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <FiZap className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Real-time Stats Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${schoolBranding.primaryColor}, ${schoolBranding.secondaryColor})`
              }}
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold mb-1">Live</div>
                  <div className="text-sm opacity-90">Real-time Data</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">{metrics.totalStudents}</div>
                  <div className="text-sm opacity-90">Active Students</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">{metrics.totalTeachers}</div>
                  <div className="text-sm opacity-90">Teaching Staff</div>
                </div>
                <div>
                  <div className="text-2xl font-bold mb-1">98.5%</div>
                  <div className="text-sm opacity-90">System Health</div>
                </div>
              </div>
            </motion.div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/80 via-blue-50/50 to-white/80 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3 shadow-lg">
                            <FiBookOpen className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide">Total Students</p>
                          </div>
                        </div>
                        <motion.p
                          className="text-4xl font-bold bg-gradient-to-r from-blue-900 to-blue-700 bg-clip-text text-transparent mb-3"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        >
                          {metrics.totalStudents}
                        </motion.p>
                        <div className="flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-100 w-fit">
                          <FiTrendingUp className="w-3 h-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-700 font-medium">+12% from last month</span>
                        </div>
                      </div>
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${schoolBranding.primaryColor}, ${schoolBranding.secondaryColor})`
                        }}
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                        <FiBookOpen className="w-8 h-8 text-white relative z-10" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/80 via-purple-50/50 to-white/80 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mr-3 shadow-lg">
                            <FiUsers className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Active Teachers</p>
                          </div>
                        </div>
                        <motion.p
                          className="text-4xl font-bold bg-gradient-to-r from-purple-900 to-purple-700 bg-clip-text text-transparent mb-3"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                        >
                          {metrics.totalTeachers}
                        </motion.p>
                        <div className="flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-100 w-fit">
                          <FiTrendingUp className="w-3 h-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-700 font-medium">+5% from last month</span>
                        </div>
                      </div>
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${schoolBranding.secondaryColor}, ${schoolBranding.primaryColor})`
                        }}
                        whileHover={{ rotate: -5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                        <FiUsers className="w-8 h-8 text-white relative z-10" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/80 via-green-50/50 to-white/80 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mr-3 shadow-lg">
                            <FiDollarSign className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">Monthly Revenue</p>
                          </div>
                        </div>
                        <motion.p
                          className="text-4xl font-bold bg-gradient-to-r from-green-900 to-green-700 bg-clip-text text-transparent mb-3"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                        >
                          ${(metrics.monthlyRevenue || 0).toLocaleString()}
                        </motion.p>
                        <div className="flex items-center bg-green-50 px-3 py-1 rounded-full border border-green-100 w-fit">
                          <FiTrendingUp className="w-3 h-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-700 font-medium">+8% from last month</span>
                        </div>
                      </div>
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden bg-gradient-to-br from-green-500 to-emerald-600"
                        whileHover={{ rotate: 5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                        <FiDollarSign className="w-8 h-8 text-white relative z-10" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/80 via-orange-50/50 to-white/80 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardContent className="p-8 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-600 flex items-center justify-center mr-3 shadow-lg">
                            <FiActivity className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-orange-700 uppercase tracking-wide">Attendance Rate</p>
                          </div>
                        </div>
                        <motion.p
                          className="text-4xl font-bold bg-gradient-to-r from-orange-900 to-yellow-700 bg-clip-text text-transparent mb-4"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                        >
                          {metrics.attendanceRate}%
                        </motion.p>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>Target: 90%</span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-orange-100 rounded-full h-3 overflow-hidden">
                              <motion.div
                                className="h-full bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full relative"
                                initial={{ width: 0 }}
                                animate={{ width: `${metrics.attendanceRate}%` }}
                                transition={{ delay: 0.6, duration: 1.5, ease: "easeOut" }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                              </motion.div>
                            </div>
                            <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                              <span className="text-xs font-semibold text-orange-800">
                                {metrics.attendanceRate >= 90 ? '🎯 Target Achieved!' : '📈 On Track'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <motion.div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl relative overflow-hidden bg-gradient-to-br from-orange-500 to-yellow-600 ml-4"
                        whileHover={{ rotate: -5, scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        />
                        <FiActivity className="w-8 h-8 text-white relative z-10" />
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-green-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-700 mb-1">Total Revenue</p>
                        <p className="text-2xl font-bold text-emerald-900">${(metrics.totalRevenue || 0).toLocaleString()}</p>
                        <div className="flex items-center mt-1">
                          <FiTrendingUp className="w-3 h-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-700">+12% YoY</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-emerald-200">
                        <FiDollarSign className="w-6 h-6 text-emerald-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-700 mb-1">Profit Margin</p>
                        <p className="text-2xl font-bold text-blue-900">{chartData.financialOverview?.profitMargin || 0}%</p>
                        <div className="flex items-center mt-1">
                          <FiTrendingUp className="w-3 h-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-700">+2.1% this month</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-blue-200">
                        <FiBarChart className="w-6 h-6 text-blue-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-orange-700 mb-1">Outstanding</p>
                        <p className="text-2xl font-bold text-orange-900">${(chartData.financialOverview?.outstandingPayments || 0).toLocaleString()}</p>
                        <div className="flex items-center mt-1">
                          <FiTrendingUp className="w-3 h-3 text-red-600 mr-1" />
                          <span className="text-xs text-red-700">Due this week</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-orange-200">
                        <FiClock className="w-6 h-6 text-orange-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-purple-700 mb-1">Active Courses</p>
                        <p className="text-2xl font-bold text-purple-900">{metrics.activeCourses}</p>
                        <div className="flex items-center mt-1">
                          <FiTrendingUp className="w-3 h-3 text-green-600 mr-1" />
                          <span className="text-xs text-green-700">+3 this semester</span>
                        </div>
                      </div>
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-purple-200">
                        <FiBookOpen className="w-6 h-6 text-purple-700" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Revenue Trend Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="group"
              >
                <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-white/90 via-white/80 to-white/90 backdrop-blur-xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/3 to-purple-500/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="pb-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                          <FiBarChart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            Revenue & Enrollment Trends
                          </CardTitle>
                          <p className="text-sm text-gray-600 mt-1">Monthly performance analysis</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-white/50"
                          onClick={() => setExpandedCharts(prev => prev.includes('revenue') ? prev.filter(id => id !== 'revenue') : [...prev, 'revenue'])}
                        >
                          <FiMaximize2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-white/50">
                          <FiDownload className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.revenueData}>
                          <defs>
                            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={schoolBranding.primaryColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={schoolBranding.primaryColor} stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="studentsGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={schoolBranding.secondaryColor} stopOpacity={0.3}/>
                              <stop offset="95%" stopColor={schoolBranding.secondaryColor} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                          <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                          <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="revenue"
                            stroke={schoolBranding.primaryColor}
                            fillOpacity={1}
                            fill="url(#revenueGradient)"
                            strokeWidth={3}
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="students"
                            stroke={schoolBranding.secondaryColor}
                            strokeWidth={3}
                            dot={{ fill: schoolBranding.secondaryColor, strokeWidth: 2, r: 6 }}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center space-x-6 mt-4">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: schoolBranding.primaryColor }}></div>
                        <span className="text-sm text-gray-600">Revenue ($)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: schoolBranding.secondaryColor }}></div>
                        <span className="text-sm text-gray-600">Students</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Weekly Attendance Chart */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-gray-900">Weekly Attendance</CardTitle>
                      <FiActivity className="w-6 h-6 text-gray-400" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.attendanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                          <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                            }}
                            formatter={(value) => [`${value}%`, 'Attendance']}
                          />
                          <Bar
                            dataKey="attendance"
                            fill={schoolBranding.primaryColor}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-center mt-4">
                      <p className="text-sm text-gray-600">
                        Average attendance this week: <span className="font-semibold text-gray-900">88.3%</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Student Growth Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="mb-8"
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">Student Enrollment Growth</CardTitle>
                    <FiTrendingUp className="w-6 h-6 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData.studentGrowth}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                        <YAxis yAxisId="left" stroke="#6b7280" fontSize={12} />
                        <YAxis yAxisId="right" orientation="right" stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="newStudents"
                          fill={schoolBranding.secondaryColor}
                          radius={[4, 4, 0, 0]}
                          name="New Students"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="totalStudents"
                          stroke={schoolBranding.primaryColor}
                          strokeWidth={3}
                          dot={{ fill: schoolBranding.primaryColor, strokeWidth: 2, r: 6 }}
                          name="Total Students"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <div className="text-2xl font-bold text-blue-900">53</div>
                      <div className="text-sm text-blue-700">New This Year</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                      <div className="text-2xl font-bold text-green-900">{metrics.totalStudents}</div>
                      <div className="text-sm text-green-700">Total Students</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                      <div className="text-2xl font-bold text-purple-900">+15%</div>
                      <div className="text-sm text-purple-700">Growth Rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Second Row - Performance & Payments */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Payment Status Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Payment Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData.paymentStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {chartData.paymentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                      {chartData.paymentStatusData.map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                            <span className="text-sm text-gray-600">{item.name}</span>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Grade Distribution */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Grade Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chartData.gradeDistribution.map((grade, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Grade {grade.grade}</span>
                            <span className="text-sm text-gray-500">{grade.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${grade.percentage}%`,
                                backgroundColor: grade.grade === 'A' ? '#10b981' :
                                               grade.grade === 'B' ? '#3b82f6' :
                                               grade.grade === 'C' ? '#f59e0b' :
                                               grade.grade === 'D' ? '#f97316' : '#ef4444'
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{metrics.avgGrade}%</p>
                        <p className="text-sm text-gray-600">Average Grade</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Teacher Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold text-gray-900">Top Performing Subjects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {chartData.teacherPerformance.map((subject, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm">
                              <FiAward className="w-4 h-4" style={{ color: schoolBranding.primaryColor }} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                              <p className="text-xs text-gray-500">{subject.students} students</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{subject.score}%</p>
                            <div className="w-16 bg-gray-200 rounded-full h-1 mt-1">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-500"
                                style={{ width: `${subject.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Third Row - Quick Actions & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
              >
                <Card className="border-0 shadow-lg bg-gradient-to-br from-gray-50 to-gray-100">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <FiZap className="w-6 h-6 mr-2" style={{ color: schoolBranding.primaryColor }} />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      className="w-full justify-start h-14 text-left"
                      variant="outline"
                      onClick={() => router.push(`/admin/${schoolSlug}/students`)}
                      style={{ borderColor: schoolBranding.primaryColor, color: schoolBranding.primaryColor }}
                    >
                      <FiUser className="w-6 h-6 mr-4" />
                      <div>
                        <div className="font-semibold">Add New Student</div>
                        <div className="text-xs opacity-75">Register student account</div>
                      </div>
                    </Button>
                    <Button
                      className="w-full justify-start h-14 text-left"
                      variant="outline"
                      onClick={() => router.push(`/admin/${schoolSlug}/payments`)}
                      style={{ borderColor: schoolBranding.primaryColor, color: schoolBranding.primaryColor }}
                    >
                      <FiDollarSign className="w-6 h-6 mr-4" />
                      <div>
                        <div className="font-semibold">Process Payment</div>
                        <div className="text-xs opacity-75">Handle fee collection</div>
                      </div>
                    </Button>
                    <Button
                      className="w-full justify-start h-14 text-left"
                      variant="outline"
                      onClick={() => router.push(`/admin/${schoolSlug}/permissions`)}
                      style={{ borderColor: schoolBranding.primaryColor, color: schoolBranding.primaryColor }}
                    >
                      <FiClipboard className="w-6 h-6 mr-4" />
                      <div>
                        <div className="font-semibold">Review Permissions</div>
                        <div className="text-xs opacity-75">Approve pending requests</div>
                        {metrics.pendingPermissions > 0 && (
                          <Badge variant="destructive" className="ml-auto">
                            {metrics.pendingPermissions}
                          </Badge>
                        )}
                      </div>
                    </Button>
                    <Button
                      className="w-full justify-start h-14 text-left"
                      variant="outline"
                      onClick={() => router.push(`/admin/${schoolSlug}/quality`)}
                      style={{ borderColor: schoolBranding.primaryColor, color: schoolBranding.primaryColor }}
                    >
                      <FiEye className="w-6 h-6 mr-4" />
                      <div>
                        <div className="font-semibold">Quality Review</div>
                        <div className="text-xs opacity-75">Monitor teaching quality</div>
                      </div>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="lg:col-span-2"
              >
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <FiActivity className="w-6 h-6 mr-2" style={{ color: schoolBranding.primaryColor }} />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm ${
                            activity.status === 'success' ? 'bg-green-100' :
                            activity.status === 'warning' ? 'bg-yellow-100' :
                            activity.status === 'pending' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {activity.type === 'payment' && <FiDollarSign className={`w-6 h-6 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                            {activity.type === 'permission' && <FiClipboard className={`w-6 h-6 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                            {activity.type === 'attendance' && <FiActivity className={`w-6 h-6 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                            {activity.type === 'student' && <FiUser className={`w-6 h-6 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                            {activity.type === 'quality' && <FiAward className={`w-6 h-6 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="text-base font-medium text-gray-900">{activity.message}</p>
                                <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                                <div className="flex items-center mt-2 space-x-2">
                                  <p className="text-xs text-gray-500">{activity.time}</p>
                                  {activity.amount && (
                                    <Badge variant="outline" className="text-xs">{activity.amount}</Badge>
                                  )}
                                  {activity.grade && (
                                    <Badge variant="outline" className="text-xs">{activity.grade}</Badge>
                                  )}
                                  {activity.teacher && (
                                    <Badge variant="outline" className="text-xs">{activity.teacher}</Badge>
                                  )}
                                  {activity.status === 'pending' && (
                                    <Badge variant="secondary" className="text-xs">Pending Review</Badge>
                                  )}
                                  {activity.status === 'warning' && (
                                    <Badge variant="destructive" className="text-xs">Attention Needed</Badge>
                                  )}
                                </div>
                              </div>
                              {activity.priority && (
                                <Badge
                                  variant={activity.priority === 'high' ? 'destructive' : 'secondary'}
                                  className="text-xs ml-2"
                                >
                                  {activity.priority}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* System Health & Analytics Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-50 to-gray-50">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-green-100">
                        <FiCheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Database</h3>
                      <p className="text-sm text-gray-600">Healthy • 99.9% uptime</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100">
                        <FiTrendingUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">API Response</h3>
                      <p className="text-sm text-gray-600">Fast • 45ms avg</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-yellow-100">
                        <FiActivity className="w-8 h-8 text-yellow-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Storage</h3>
                      <p className="text-sm text-gray-600">75% used • 25GB free</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-purple-100">
                        <FiShield className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Security</h3>
                      <p className="text-sm text-gray-600">Protected • Last scan: 2h ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full justify-start h-12"
                      variant="outline"
                      onClick={() => router.push(`/admin/${schoolSlug}/students`)}
                    >
                      <FiUser className="w-5 h-5 mr-3" />
                      Add New Student
                    </Button>
                    <Button
                      className="w-full justify-start h-12"
                      variant="outline"
                      onClick={() => router.push(`/admin/${schoolSlug}/payments`)}
                    >
                      <FiDollarSign className="w-5 h-5 mr-3" />
                      Process Payment
                    </Button>
                    <Button
                      className="w-full justify-start h-12"
                      variant="outline"
                      onClick={() => router.push(`/admin/${schoolSlug}/permissions`)}
                    >
                      <FiClipboard className="w-5 h-5 mr-3" />
                      Review Permissions
                      {metrics.pendingPermissions > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {metrics.pendingPermissions}
                        </Badge>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="lg:col-span-2"
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.status === 'success' ? 'bg-green-100' :
                            activity.status === 'warning' ? 'bg-yellow-100' :
                            activity.status === 'pending' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {activity.type === 'payment' && <FiDollarSign className={`w-4 h-4 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                            {activity.type === 'permission' && <FiClipboard className={`w-4 h-4 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                            {activity.type === 'attendance' && <FiActivity className={`w-4 h-4 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                            {activity.type === 'student' && <FiUser className={`w-4 h-4 ${
                              activity.status === 'success' ? 'text-green-600' :
                              activity.status === 'warning' ? 'text-yellow-600' :
                              activity.status === 'pending' ? 'text-blue-600' : 'text-gray-600'
                            }`} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 truncate">{activity.message}</p>
                            <p className="text-xs text-gray-500">{activity.time}</p>
                          </div>
                          {activity.status === 'pending' && (
                            <Badge variant="secondary" className="text-xs">Pending</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* System Health & Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">System Health</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database</span>
                      <div className="flex items-center">
                        <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Healthy</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Response</span>
                      <div className="flex items-center">
                        <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Fast</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Storage</span>
                      <div className="flex items-center">
                        <FiCheckCircle className="w-4 h-4 text-yellow-500 mr-2" />
                        <span className="text-sm text-yellow-600">75% Used</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Backup</span>
                      <div className="flex items-center">
                        <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        <span className="text-sm text-green-600">Up to date</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Today's Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <FiCheckCircle className="w-5 h-5 text-green-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Payments Processed</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">12</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <FiClock className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Pending Reviews</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{metrics.pendingPermissions}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center">
                        <FiAlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">Alerts</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-600">3</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>

      {/* Modern Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
      >
        <div className="relative">
          <motion.button
            className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-2xl hover:shadow-3xl flex items-center justify-center text-white font-bold text-xl"
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push(`/admin/${schoolSlug}/students`)}
          >
            <FiUser className="w-7 h-7" />
          </motion.button>

          {/* Floating tooltip */}
          <motion.div
            className="absolute bottom-full right-0 mb-3 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 pointer-events-none whitespace-nowrap"
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
          >
            Quick Add Student
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </motion.div>

          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 animate-ping opacity-20"></div>
        </div>
      </motion.div>

      {/* Advanced Analytics Modal (for expanded charts) */}
      <AnimatePresence>
        {expandedCharts.length > 0 && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="p-8 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setExpandedCharts([])}
                    className="hover:bg-gray-100"
                  >
                    <FiX className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              <div className="p-8">
                <Tabs defaultValue="revenue" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                  </TabsList>
                  <TabsContent value="revenue" className="mt-6">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.revenueData}>
                          <defs>
                            <linearGradient id="expandedRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={schoolBranding.primaryColor} stopOpacity={0.4}/>
                              <stop offset="95%" stopColor={schoolBranding.primaryColor} stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="month" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="revenue"
                            stroke={schoolBranding.primaryColor}
                            fillOpacity={1}
                            fill="url(#expandedRevenueGradient)"
                            strokeWidth={4}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="attendance" className="mt-6">
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.attendanceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="day" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
                            }}
                          />
                          <Bar
                            dataKey="attendance"
                            fill={schoolBranding.primaryColor}
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </TabsContent>
                  <TabsContent value="performance" className="mt-6">
                    <div className="space-y-6">
                      {chartData.teacherPerformance.map((subject, index) => (
                        <div key={index} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <FiAward className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                              <p className="text-sm text-gray-600">{subject.students} students enrolled</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">{subject.score}%</div>
                            <div className="w-32 bg-gray-200 rounded-full h-3 mt-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                                style={{ width: `${subject.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}