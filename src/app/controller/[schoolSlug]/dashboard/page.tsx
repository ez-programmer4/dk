"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiUsers,
  FiClock,
  FiDollarSign,
  FiTrendingUp,
  FiAward,
  FiBarChart,
  FiActivity,
  FiTarget,
  FiCalendar,
  FiEye,
  FiZap,
  FiCheckCircle,
  FiAlertTriangle,
  FiTrendingDown,
  FiBookOpen,
  FiStar,
  FiMessageSquare,
  FiArrowRight,
  FiArrowUp,
  FiArrowDown,
  FiRefreshCw,
  FiPlus,
  FiFilter,
  FiDownload,
  FiShare,
  FiSettings,
  FiBell,
  FiX,
  FiUser,
  FiShield,
} from "react-icons/fi";
import { useBranding } from "../layout";

export default function ControllerDashboard() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();

  const [teachers, setTeachers] = useState<any[]>([]);
  const [pendingPermissions, setPendingPermissions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<any[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  useEffect(() => {
    if (schoolSlug) {
      fetchDashboard();
    }
  }, [schoolSlug]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const [teachersRes, permissionsRes, earningsRes, analyticsRes] =
        await Promise.all([
          fetch(`/api/controller/${schoolSlug}/teachers`),
          fetch(`/api/controller/${schoolSlug}/permissions?status=Pending`),
          fetch(
            `/api/controller/${schoolSlug}/earnings?month=${new Date()
              .toISOString()
              .slice(0, 7)}`
          ),
          fetch(`/api/controller/${schoolSlug}/student-analytics`),
        ]);

      const teachersData = teachersRes.ok ? await teachersRes.json() : [];
      const permissionsData = permissionsRes.ok
        ? await permissionsRes.json()
        : [];
      const earningsData = earningsRes.ok ? await earningsRes.json() : null;
      const analyticsData = analyticsRes.ok ? await analyticsRes.json() : null;

      setTeachers(teachersData);
      setPendingPermissions(permissionsData);
      setEarnings(earningsData);
      setAnalytics(analyticsData);

      // Generate mock data for new features
      generateMockData(
        teachersData,
        permissionsData,
        earningsData,
        analyticsData
      );
    } finally {
      setLoading(false);
    }
  }

  function generateMockData(
    teachers: any[],
    permissions: any[],
    earnings: any,
    analytics: any
  ) {
    // Mock recent activities
    const activities = [
      {
        id: 1,
        type: "registration",
        title: "New Student Registration",
        description: "Ahmed Al-Rashid registered for Arabic Level 1",
        time: "2 hours ago",
        icon: FiUser,
        color: "blue",
      },
      {
        id: 2,
        type: "payment",
        title: "Payment Received",
        description: "Payment of $150 received from Fatima Khan",
        time: "4 hours ago",
        icon: FiDollarSign,
        color: "green",
      },
      {
        id: 3,
        type: "permission",
        title: "Permission Request",
        description: "Teacher Sarah Ahmed requested leave for tomorrow",
        time: "6 hours ago",
        icon: FiClock,
        color: "yellow",
      },
      {
        id: 4,
        type: "attendance",
        title: "Attendance Marked",
        description: "All students marked present for Quran class",
        time: "8 hours ago",
        icon: FiCheckCircle,
        color: "green",
      },
    ];
    setRecentActivities(activities);

    // Mock system alerts
    const alerts = [
      {
        id: 1,
        type: "warning",
        title: "Teacher Absent Today",
        message: "Ustaz Muhammad is absent today. Class has been reassigned.",
        priority: "high",
        icon: FiAlertTriangle,
      },
      {
        id: 2,
        type: "info",
        title: "Monthly Report Due",
        message: "Monthly performance report is due in 3 days.",
        priority: "medium",
        icon: FiCalendar,
      },
    ];
    setSystemAlerts(alerts);

    // Mock today's schedule
    const schedule = [
      {
        time: "09:00 AM",
        subject: "Quran Reading",
        teacher: "Ustaz Ahmed",
        students: 12,
      },
      {
        time: "10:30 AM",
        subject: "Arabic Grammar",
        teacher: "Ustadha Fatima",
        students: 8,
      },
      {
        time: "02:00 PM",
        subject: "Islamic Studies",
        teacher: "Ustaz Omar",
        students: 15,
      },
      {
        time: "04:00 PM",
        subject: "Quran Memorization",
        teacher: "Ustadha Aisha",
        students: 6,
      },
    ];
    setTodaySchedule(schedule);

    // Mock performance metrics
    setPerformanceMetrics({
      attendanceRate: 94,
      studentSatisfaction: 4.8,
      teacherPerformance: 4.6,
      revenueGrowth: 12.5,
      newRegistrations: 8,
      completionRate: 87,
    });
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-8 font-sans"
      style={
        {
          "--primary-color": primaryColor,
          "--secondary-color": secondaryColor,
        } as React.CSSProperties
      }
    >
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Modern Hero Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative min-h-[400px] overflow-hidden rounded-3xl"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}15 0%, ${secondaryColor}10 50%, rgba(255,255,255,0.9) 100%)`,
          }}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-20 left-20 w-32 h-32 rounded-full opacity-20"
              style={{
                background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
              }}
            />
            <motion.div
              animate={{
                scale: [1.1, 1, 1.1],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute bottom-20 right-20 w-24 h-24 rounded-full opacity-15"
              style={{
                background: `linear-gradient(45deg, ${secondaryColor}, ${primaryColor})`,
              }}
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 p-8 md:p-12 flex flex-col justify-center min-h-[400px]">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="max-w-4xl"
            >
              {/* Welcome Header */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-8">
                <div>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center space-x-4 mb-4"
                  >
                    <div className="relative">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                          boxShadow: `0 20px 40px -12px ${primaryColor}40`,
                        }}
                      >
                        <FiZap className="w-8 h-8 text-white" />
                      </div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"
                      />
                    </div>
                    <div>
                      <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
                        Good{" "}
                        {new Date().getHours() < 12
                          ? "morning"
                          : new Date().getHours() < 18
                          ? "afternoon"
                          : "evening"}
                        !
                      </h1>
                      <p className="text-xl text-gray-600 font-medium">
                        {schoolName} Control Center
                      </p>
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-lg text-gray-700 max-w-2xl leading-relaxed"
                  >
                    Your command center for monitoring teachers, tracking
                    student progress, and managing operations. Everything you
                    need in one beautiful dashboard.
                  </motion.p>
                </div>

                {/* Floating Stats */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: "spring", stiffness: 100 }}
                  className="flex gap-4"
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 min-w-[140px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <FiUsers className="w-6 h-6 text-blue-500" />
                      <div className="flex items-center text-green-500">
                        <FiArrowUp className="w-3 h-3" />
                        <span className="text-xs font-medium ml-1">+12%</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {teachers.length}
                    </div>
                    <div className="text-sm text-gray-600">Teachers</div>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 min-w-[140px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <FiDollarSign className="w-6 h-6 text-green-500" />
                      <div className="flex items-center text-green-500">
                        <FiTrendingUp className="w-3 h-3" />
                        <span className="text-xs font-medium ml-1">+15%</span>
                      </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {earnings?.reward ? `$${earnings.reward}` : "$0"}
                    </div>
                    <div className="text-sm text-gray-600">Revenue</div>
                  </motion.div>
                </motion.div>
              </div>

              {/* Quick Actions Bar */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="flex flex-wrap gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    router.push(`/registral/${schoolSlug}/registration`)
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-200"
                >
                  <FiPlus className="w-5 h-5" style={{ color: primaryColor }} />
                  <span className="font-medium text-gray-900">New Student</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    router.push(`/controller/${schoolSlug}/attendance-list`)
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-200"
                >
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900">
                    Mark Attendance
                  </span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    router.push(`/controller/${schoolSlug}/teachers`)
                  }
                  className="flex items-center space-x-2 px-6 py-3 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-200"
                >
                  <FiUsers className="w-5 h-5 text-purple-500" />
                  <span className="font-medium text-gray-900">
                    View Teachers
                  </span>
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Fluid Metrics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="relative"
        >
          {/* Background Elements */}
          <div className="absolute inset-0 -z-10">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
              className="absolute top-10 left-10 w-20 h-20 rounded-full opacity-5"
              style={{
                background: `linear-gradient(45deg, ${primaryColor}, ${secondaryColor})`,
              }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-10 right-10 w-16 h-16 rounded-full opacity-5"
              style={{
                background: `linear-gradient(45deg, ${secondaryColor}, ${primaryColor})`,
              }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Metrics */}
            <div className="lg:col-span-2 space-y-6">
              {/* Primary Metrics Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 animate-pulse"
                    >
                      <div className="h-12 bg-gray-200 rounded mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </motion.div>
                  ))
                ) : (
                  <>
                    {/* Revenue Metric */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <FiDollarSign className="w-8 h-8 text-green-200" />
                          <motion.div
                            animate={{ rotate: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="flex items-center text-green-200"
                          >
                            <FiTrendingUp className="w-4 h-4" />
                          </motion.div>
                        </div>
                        <div className="text-3xl font-bold mb-2">
                          {earnings?.reward ? `$${earnings.reward}` : "$0"}
                        </div>
                        <div className="text-green-100 text-sm mb-1">
                          Monthly Revenue
                        </div>
                        <div className="flex items-center text-green-200 text-xs">
                          <FiArrowUp className="w-3 h-3 mr-1" />
                          +15.2% from last month
                        </div>
                      </div>
                    </motion.div>

                    {/* Students Metric */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-2xl p-6 text-white shadow-xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <FiBookOpen className="w-8 h-8 text-blue-200" />
                          <div className="flex items-center text-blue-200">
                            <FiUsers className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="text-3xl font-bold mb-2">
                          {analytics?.activeStudents || 0}
                        </div>
                        <div className="text-blue-100 text-sm mb-1">
                          Active Students
                        </div>
                        <div className="flex items-center text-blue-200 text-xs">
                          <FiArrowUp className="w-3 h-3 mr-1" />
                          +8.1% enrollment growth
                        </div>
                      </div>
                    </motion.div>

                    {/* Teachers Metric */}
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-2xl p-6 text-white shadow-xl overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <FiUsers className="w-8 h-8 text-purple-200" />
                          <div className="flex items-center text-purple-200">
                            <FiStar className="w-4 h-4 fill-current" />
                          </div>
                        </div>
                        <div className="text-3xl font-bold mb-2">
                          {teachers.length}
                        </div>
                        <div className="text-purple-100 text-sm mb-1">
                          Active Teachers
                        </div>
                        <div className="flex items-center text-purple-200 text-xs">
                          <FiArrowUp className="w-3 h-3 mr-1" />
                          +12% team growth
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Performance Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/50"
              >
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      Performance Overview
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Key metrics and trends
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live Data</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <svg
                        className="w-24 h-24 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth="2"
                          strokeDasharray={`${
                            performanceMetrics?.attendanceRate || 94
                          }, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">
                          {performanceMetrics?.attendanceRate || 94}%
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Attendance Rate
                    </h4>
                    <p className="text-sm text-gray-600">Above target</p>
                  </div>

                  <div className="text-center">
                    <div className="flex justify-center mb-4">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.div
                          key={star}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: star * 0.1 }}
                          className="mx-0.5"
                        >
                          <FiStar
                            className={`w-6 h-6 ${
                              star <=
                              Math.round(
                                performanceMetrics?.studentSatisfaction || 4.8
                              )
                                ? "text-yellow-400 fill-current"
                                : "text-gray-300"
                            }`}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Student Satisfaction
                    </h4>
                    <p className="text-sm text-gray-600">
                      {performanceMetrics?.studentSatisfaction || 4.8}/5.0
                      average
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="relative inline-block mb-4">
                      <svg
                        className="w-24 h-24 transform -rotate-90"
                        viewBox="0 0 36 36"
                      >
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="2"
                        />
                        <path
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke={secondaryColor}
                          strokeWidth="2"
                          strokeDasharray={`${
                            performanceMetrics?.completionRate || 87
                          }, 100`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-900">
                          {performanceMetrics?.completionRate || 87}%
                        </span>
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Completion Rate
                    </h4>
                    <p className="text-sm text-gray-600">Course completion</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column - Quick Actions & Schedule */}
            <div className="space-y-6">
              {/* Today's Schedule */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Today's Schedule
                  </h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleDateString()}
                    </span>
                    <FiCalendar className="w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <div className="space-y-4">
                  {todaySchedule.slice(0, 4).map((session, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="w-2 h-2 bg-indigo-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {session.subject}
                        </p>
                        <p className="text-xs text-gray-600">
                          {session.teacher}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {session.time}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.students} students
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-4 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
                >
                  View Full Schedule
                </motion.button>
              </motion.div>

              {/* Quick Actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.0 }}
                className="bg-white/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50"
              >
                <h3 className="text-lg font-bold text-gray-900 mb-6">
                  Quick Actions
                </h3>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      router.push(`/registral/${schoolSlug}/registration`)
                    }
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <FiPlus className="w-5 h-5" />
                      <span className="font-medium">New Registration</span>
                    </div>
                    <FiArrowRight className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      router.push(`/controller/${schoolSlug}/attendance-list`)
                    }
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <FiCheckCircle className="w-5 h-5" />
                      <span className="font-medium">Mark Attendance</span>
                    </div>
                    <FiArrowRight className="w-4 h-4" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() =>
                      router.push(`/controller/${schoolSlug}/teachers`)
                    }
                    className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all duration-200"
                  >
                    <div className="flex items-center space-x-3">
                      <FiUsers className="w-5 h-5" />
                      <span className="font-medium">Manage Teachers</span>
                    </div>
                    <FiArrowRight className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Activity Feed & Insights */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-5 gap-8"
        >
          {/* Activity Timeline */}
          <div className="lg:col-span-3 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Activity Feed
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Real-time updates from your operations
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 opacity-20"></div>

              <div className="space-y-6">
                {recentActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.15 }}
                    className="relative flex items-start space-x-6 group cursor-pointer"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                        activity.color === "blue"
                          ? "bg-blue-500"
                          : activity.color === "green"
                          ? "bg-green-500"
                          : activity.color === "yellow"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                      }`}
                    >
                      <activity.icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-8 group-last:pb-0">
                      <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-white/50 hover:shadow-md transition-all duration-200">
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-gray-800">
                          {activity.title}
                        </h4>
                        <p className="text-gray-700 mb-3 leading-relaxed">
                          {activity.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 flex items-center">
                            <FiClock className="w-4 h-4 mr-1" />
                            {activity.time}
                          </span>
                          <FiArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* System Insights */}
          <div className="lg:col-span-2 space-y-6">
            {/* System Health */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  System Health
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">
                    All Systems Online
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center space-x-3">
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Server Status
                    </span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    Operational
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <FiTrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Response Time
                    </span>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">
                    120ms
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-3">
                    <FiShield className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium text-gray-900">
                      Security
                    </span>
                  </div>
                  <span className="text-xs text-purple-600 font-medium">
                    Protected
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-6">Today's Summary</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100">New Registrations</span>
                  <span className="text-2xl font-bold">3</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-purple-100">Attendance Marked</span>
                  <span className="text-2xl font-bold">47</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-pink-100">Pending Reviews</span>
                  <span className="text-2xl font-bold">
                    {pendingPermissions.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Teachers Overview & System Status */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="grid grid-cols-1 lg:grid-cols-7 gap-8"
        >
          {/* Teachers Overview */}
          <div className="lg:col-span-4 bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Teachers Overview
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  Your teaching team's performance
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  router.push(`/controller/${schoolSlug}/teachers`)
                }
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
              >
                Manage All
              </motion.button>
            </div>

            {loading ? (
              <div className="animate-pulse space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
                ))}
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-12">
                <FiUsers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Teachers Assigned
                </h3>
                <p className="text-gray-600 mb-4">
                  You don't have any teachers assigned yet.
                </p>
                <p className="text-sm text-gray-500">
                  Contact your administrator for assignments.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {teachers.slice(0, 4).map((teacher, index) => (
                  <motion.div
                    key={teacher.ustazid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center justify-between p-5 bg-gradient-to-r from-white to-gray-50 rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-200 group cursor-pointer"
                    onClick={() =>
                      router.push(
                        `/controller/${schoolSlug}/teachers/${teacher.ustazid}`
                      )
                    }
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {teacher.ustazname?.charAt(0)?.toUpperCase() || "?"}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">
                          {teacher.ustazname}
                        </p>
                        <p className="text-sm text-gray-600">
                          {teacher.schedule || "No schedule set"}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className="flex items-center space-x-1">
                            <FiStar className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">4.7</span>
                          </div>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-600">
                            12 students
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-green-600">
                          94% attendance
                        </p>
                        <p className="text-xs text-gray-500">This month</p>
                      </div>
                      <FiArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* System Status & Alerts */}
          <div className="lg:col-span-3 space-y-6">
            {/* System Status Cards */}
            <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  System Status
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-600 font-medium">
                    All Systems Online
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <FiCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Database
                      </p>
                      <p className="text-xs text-gray-600">
                        All connections healthy
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-green-700">
                      99.9%
                    </span>
                    <p className="text-xs text-gray-500">Uptime</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FiTrendingUp className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        API Response
                      </p>
                      <p className="text-xs text-gray-600">
                        Average response time
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-blue-700">
                      120ms
                    </span>
                    <p className="text-xs text-gray-500">Fast</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <FiShield className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Security
                      </p>
                      <p className="text-xs text-gray-600">
                        System protection status
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-purple-700">
                      Protected
                    </span>
                    <p className="text-xs text-gray-500">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-bold mb-6">Quick Actions</h3>

              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    router.push(`/controller/${schoolSlug}/attendance-list`)
                  }
                  className="w-full flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <FiCheckCircle className="w-5 h-5" />
                    <span className="font-medium">Mark Attendance</span>
                  </div>
                  <FiArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    router.push(`/registral/${schoolSlug}/registration`)
                  }
                  className="w-full flex items-center justify-between p-4 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <FiPlus className="w-5 h-5" />
                    <span className="font-medium">New Registration</span>
                  </div>
                  <FiArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Permissions & Quick Tasks */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Pending Tasks</h3>
              <p className="text-gray-600 text-sm mt-1">
                Items requiring your attention
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">
                  {pendingPermissions.length} pending reviews
                </span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  router.push(`/controller/${schoolSlug}/permissions`)
                }
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200"
              >
                Review All
              </motion.button>
            </div>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          ) : pendingPermissions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FiCheckCircle className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                All Caught Up!
              </h3>
              <p className="text-gray-600 text-lg">
                No pending tasks or permissions to review.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Great job staying on top of everything!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPermissions.slice(0, 4).map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-5 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <FiClock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        Permission Request #{req.id}
                      </p>
                      <p className="text-xs text-gray-600">
                        Teacher: {req.teacherId}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {req.reasonCategory}:{" "}
                        {req.reasonDetails?.substring(0, 50)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {req.requestedDates}
                      </p>
                      <p className="text-xs text-gray-500">Requested dates</p>
                    </div>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Deny
                      </motion.button>
                    </div>
                    <FiArrowRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
