"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  LogOut,
  BookOpen,
  ChevronRight,
  Star,
  Award,
  Target,
  BarChart3,
  Eye,
  Settings,
  Home,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  Zap,
  Heart,
  Sparkles,
  FileText,
  Trophy,
  Brain,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sun,
  Moon,
  Activity,
  BookMarked,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency as formatCurrencyValue } from "@/lib/formatCurrency";

interface Child {
  wdt_ID: number;
  name: string;
  package: string;
  status: string;
  ustaz: string;
  daypackages: string;
  registrationdate: string;
  teacher: {
    ustazname: string;
    phone: string;
  };
}

interface TerbiaProgress {
  hasProgress: boolean;
  message?: string;
  studentName?: string;
  activePackage?: string;
  activePackageId?: string;
  progress?: string;
  overallProgress?: {
    totalCourses: number;
    completedCourses: number;
    inProgressCourses: number;
    notStartedCourses: number;
    overallPercent: number;
  };
  packageDetails?: Array<{
    id: string;
    title: string;
    totalChapters: number;
    completedChapters: number;
    inProgressChapters: number;
    notStartedChapters: number;
    progressPercent: number;
    status: string;
  }>;
}

interface StudentData {
  student: {
    wdt_ID: number;
    name: string;
    package: string;
    status: string;
    ustaz: string;
    daypackages: string;
    registrationdate: string;
    classfee: number;
    classfeeCurrency?: string;
    teacher: {
      ustazname: string;
      phone: string;
    };
    attendance: {
      totalDays: number;
      presentDays: number;
      absentDays: number;
      percentage: number;
      recentRecords: Array<{
        id: number;
        date: string;
        status: string;
        surah: string | null;
        pages_read: number | null;
        level: string | null;
        lesson: string | null;
        notes: string | null;
      }>;
    };
    zoomSessions: Array<{
      sent_time: string;
      link: string;
      ustazid: string;
      wpos_wpdatatable_24: {
        ustazname: string;
      };
    }>;
    testResults: Array<{
      testId: string;
      testName: string;
      appointmentDate: string | null;
      totalQuestions: number;
      correctAnswers: number;
      score: number;
      passed: boolean;
      passingResult: number;
      lastSubject: string;
    }>;
    summary: {
      totalZoomSessions: number;
      lastSession: string | null;
      totalTests: number;
      passedTests: number;
      averageScore: number;
    };
    occupiedTimes: Array<{
      timeSlot: string;
      dayPackage: string;
      occupiedAt: string;
      endAt: string | null;
      teacher: string;
    }>;
    payments: {
      summary: {
        totalDeposits: number;
        totalMonthlyPayments: number;
        remainingBalance: number;
        paidMonths: number;
        unpaidMonths: number;
        currency?: string;
      };
      deposits: Array<{
        id: number;
        amount: number;
        reason: string;
        date: string;
        status: string;
        transactionId: string;
        currency?: string;
      }>;
      monthlyPayments: Array<{
        id: number;
        month: string;
        amount: number;
        status: string;
        type: string;
        startDate: string | null;
        endDate: string | null;
        isFreeMonth: boolean;
        freeReason: string | null;
        currency?: string;
      }>;
      paidMonths: Array<{
        month: string;
        amount: number;
        type: string;
        isFreeMonth: boolean;
        freeReason: string | null;
        currency?: string;
      }>;
      unpaidMonths: Array<{
        month: string;
        amount: number;
        status: string;
        currency?: string;
      }>;
    };
  };
  terbiaProgress?: TerbiaProgress;
}

export default function ParentDashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>("");
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"children" | "details">("children");
  const [currentTab, setCurrentTab] = useState("overview");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    attendance: true,
    tests: true,
    terbia: true,
    payments: true,
  });
  const router = useRouter();

  useEffect(() => {
    // Load children from localStorage
    const parentPhone = localStorage.getItem("parentPhone");
    const parentChildren = localStorage.getItem("parentChildren");

    if (!parentPhone || !parentChildren) {
      router.push("/parent/login");
      return;
    }

    const childrenData = JSON.parse(parentChildren);
    setChildren(childrenData);

    if (childrenData.length > 0) {
      setSelectedChildId(childrenData[0].wdt_ID.toString());
    }
  }, [router]);

  useEffect(() => {
    if (selectedChildId) {
      loadStudentData(selectedChildId);
    }
  }, [selectedChildId]);

  const loadStudentData = async (studentId: string) => {
    setLoading(true);
    setError("");

    try {
      const parentPhone = localStorage.getItem("parentPhone");

      // Fetch both student data and Terbia progress in parallel
      const [studentResponse, terbiaResponse] = await Promise.all([
        fetch(`/api/parent/child/${studentId}?parentPhone=${parentPhone}`),
        fetch(
          `/api/parent/terbia-progress/${studentId}?parentPhone=${parentPhone}`
        ),
      ]);

      const studentData = await studentResponse.json();
      const terbiaData = await terbiaResponse.json();

      if (studentData.success) {
        // Combine student data with Terbia progress
        const combinedData = {
          ...studentData,
          terbiaProgress: terbiaData.success ? terbiaData.terbiaProgress : null,
        };
        setStudentData(combinedData);
      } else {
        setError(studentData.message || "Failed to load student data");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChildSelect = (childId: string) => {
    setSelectedChildId(childId);
    setView("details");
  };

  const handleBackToChildren = () => {
    setView("children");
  };

  const handleLogout = () => {
    localStorage.removeItem("parentPhone");
    localStorage.removeItem("parentChildren");
    router.push("/parent/login");
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const currency =
    studentData?.student?.classfeeCurrency ||
    studentData?.student?.payments?.summary?.currency ||
    "ETB";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Convert day package abbreviations to readable format
  const formatDayPackage = (dayPackage: string) => {
    const packageMap: { [key: string]: string } = {
      MWF: "Monday, Wednesday, Friday",
      TTS: "Tuesday, Thursday, Saturday",
      "All days": "Every Day",
      "All Days": "Every Day",
      Sunday: "Sunday Only",
    };
    return packageMap[dayPackage] || dayPackage;
  };

  // Get current month payment status
  const getCurrentMonthStatus = () => {
    if (!studentData?.student?.payments?.monthlyPayments) return null;

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const currentMonthPayment =
      studentData.student.payments.monthlyPayments.find(
        (p: any) => p.month === currentMonth
      );

    return currentMonthPayment;
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "not yet":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "leave":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "not yet":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <Award className="w-4 h-4" />;
      case "leave":
        return <XCircle className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  if (loading && !studentData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <p className="text-gray-600 font-medium">
            Loading your children's data...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-20">
        {/* Top Right Gradient Orb */}
        <div
          className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(59, 130, 246, 0.25) 0%, transparent 70%)",
          }}
        />
        {/* Bottom Left Gradient Orb */}
        <div
          className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)",
          }}
        />
        {/* Center Pattern */}
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full"
          style={{
            backgroundImage: isDarkMode
              ? "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.03) 1px, transparent 0)"
              : "radial-gradient(circle at 2px 2px, rgba(0,0,0,0.02) 1px, transparent 0)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`shadow-lg border-b sticky top-0 z-40 backdrop-blur-xl ${
          isDarkMode
            ? "bg-gray-800/95 border-gray-700"
            : "bg-white/95 border-gray-200"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {view === "details" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToChildren}
                  className="text-gray-600 hover:text-gray-900 p-2"
                >
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h1
                    className={`text-lg sm:text-xl font-bold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Parent Portal
                  </h1>
                  <p
                    className={`text-xs sm:text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {view === "children"
                      ? "Select your child"
                      : "Academic Progress"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-3">
              {view === "details" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className={`p-2 ${
                    isDarkMode
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className={`p-2 ${
                  isDarkMode
                    ? "text-gray-300 hover:text-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                className={`hidden sm:flex ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : ""
                }`}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                size="sm"
                className={`sm:hidden p-2 ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : ""
                }`}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <AnimatePresence mode="wait">
          {view === "children" ? (
            <motion.div
              key="children"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Children Selection */}
              <div className="text-center mb-6 sm:mb-8">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full shadow-sm backdrop-blur-sm mb-4"
                  style={{
                    backgroundColor: isDarkMode
                      ? "rgba(255, 255, 255, 0.05)"
                      : "rgba(0, 0, 0, 0.03)",
                    border: `1px solid ${
                      isDarkMode
                        ? "rgba(255, 255, 255, 0.1)"
                        : "rgba(0, 0, 0, 0.05)"
                    }`,
                  }}
                >
                  <Users className="w-5 h-5 text-blue-600" />
                  <span
                    className={`text-sm font-semibold ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Parent Dashboard
                  </span>
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <h2
                  className={`text-2xl sm:text-3xl font-bold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Your Children
                </h2>
                <p
                  className={`text-sm sm:text-base ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Select a child to view their academic progress
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {children.map((child, index) => {
                  const avatarColors = [
                    { bg: "rgba(59, 130, 246, 0.2)", border: "#2563eb" },
                    { bg: "rgba(236, 72, 153, 0.2)", border: "#ec4899" },
                    { bg: "rgba(34, 197, 94, 0.2)", border: "#22c55e" },
                    { bg: "rgba(249, 115, 22, 0.2)", border: "#f97316" },
                    { bg: "rgba(168, 85, 247, 0.2)", border: "#a855f7" },
                  ];
                  const avatarColor = avatarColors[index % avatarColors.length];

                  return (
                    <motion.div
                      key={child.wdt_ID}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleChildSelect(child.wdt_ID.toString())}
                      className="group cursor-pointer"
                    >
                      <div
                        className={`relative rounded-2xl shadow-xl border-2 p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 overflow-hidden ${
                          isDarkMode
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        {/* Decorative corner accent */}
                        <div
                          className="absolute top-0 right-0 w-32 h-32 opacity-10"
                          style={{
                            background: `radial-gradient(circle at top right, ${avatarColor.border} 0%, transparent 70%)`,
                          }}
                        />

                        {/* Avatar */}
                        <div className="flex items-center mb-3 sm:mb-4 relative z-10">
                          <div
                            className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-lg sm:text-xl font-bold mr-3 sm:mr-4 shadow-lg border-3 relative overflow-hidden"
                            style={{
                              backgroundColor: avatarColor.bg,
                              borderColor: avatarColor.border,
                              borderWidth: "3px",
                              color: avatarColor.border,
                            }}
                          >
                            <span className="relative z-10 font-extrabold">
                              {child.name.charAt(0).toUpperCase()}
                            </span>
                            {/* Gradient shimmer */}
                            <div
                              className="absolute inset-0 opacity-10"
                              style={{
                                background: `radial-gradient(circle at 30% 30%, ${avatarColor.border} 0%, transparent 70%)`,
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3
                              className={`text-base sm:text-lg font-semibold group-hover:text-blue-600 transition-colors truncate ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {child.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge
                                className={`${getStatusColor(
                                  child.status
                                )} text-xs`}
                              >
                                {getStatusIcon(child.status)}
                                <span className="ml-1">{child.status}</span>
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 sm:w-5 sm:h-5 group-hover:text-blue-600 transition-colors flex-shrink-0 ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          />
                        </div>

                        {/* Details */}
                        <div className="space-y-2 sm:space-y-3 relative z-10">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Package:
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-medium truncate ml-2 ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {child.package}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Teacher:
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-medium truncate ml-2 ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {child.teacher.ustazname}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Schedule:
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-medium truncate ml-2 ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {formatDayPackage(child.daypackages)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs sm:text-sm ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Registered:
                            </span>
                            <span
                              className={`text-xs sm:text-sm font-medium ${
                                isDarkMode ? "text-gray-200" : "text-gray-900"
                              }`}
                            >
                              {formatDate(child.registrationdate)}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4 sm:mt-6 relative z-10">
                          <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-3 px-4 rounded-xl text-center font-semibold group-hover:from-blue-700 group-hover:to-indigo-800 transition-all duration-300 text-sm shadow-lg flex items-center justify-center gap-2">
                            <Eye className="w-4 h-4" />
                            View Progress
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl"
                >
                  {error}
                </motion.div>
              )}

              {studentData && (
                <div className="space-y-6 relative z-10">
                  {/* Student Profile Header */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative rounded-3xl shadow-xl border-2 p-5 sm:p-6 overflow-hidden"
                    style={{
                      background: isDarkMode
                        ? "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.08) 100%)"
                        : "linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(59, 130, 246, 0.05) 100%)",
                      borderColor: isDarkMode
                        ? "rgba(59, 130, 246, 0.4)"
                        : "rgba(59, 130, 246, 0.25)",
                    }}
                  >
                    {/* Decorative corner accent */}
                    <div
                      className="absolute top-0 right-0 w-48 h-48 opacity-20"
                      style={{
                        background:
                          "radial-gradient(circle at top right, #3b82f6 0%, transparent 70%)",
                      }}
                    />

                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                        <div className="relative flex-shrink-0">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl">
                            {studentData.student.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center shadow-lg animate-pulse">
                            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2
                            className={`text-xl sm:text-2xl font-bold mb-2 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {studentData.student.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 mb-3">
                            <Badge
                              className={`${getStatusColor(
                                studentData.student.status
                              )} px-2.5 py-1 text-xs font-semibold`}
                            >
                              {getStatusIcon(studentData.student.status)}
                              <span className="ml-1">
                                {studentData.student.status}
                              </span>
                            </Badge>
                            <div
                              className={`flex items-center space-x-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${
                                isDarkMode
                                  ? "bg-gray-700 text-gray-300"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              <span className="font-medium">ID:</span>
                              <span className="font-bold">
                                {studentData.student.wdt_ID}
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div
                              className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg ${
                                isDarkMode ? "bg-gray-800/50" : "bg-white/70"
                              }`}
                            >
                              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                              <span
                                className={`truncate ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {studentData.student.package}
                              </span>
                            </div>
                            <div
                              className={`flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 rounded-lg ${
                                isDarkMode ? "bg-gray-800/50" : "bg-white/70"
                              }`}
                            >
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span
                                className={`truncate ${
                                  isDarkMode ? "text-gray-300" : "text-gray-700"
                                }`}
                              >
                                {formatDayPackage(
                                  studentData.student.daypackages
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex-shrink-0">
                        <GraduationCap className="w-8 h-8 sm:w-9 sm:h-9" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Tab Navigation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className={`rounded-2xl p-1 ${
                      isDarkMode ? "bg-gray-800" : "bg-gray-100"
                    }`}
                  >
                    <div className="flex space-x-1 overflow-x-auto scrollbar-thin">
                      {[
                        { id: "overview", label: "Overview", icon: BarChart3 },
                        {
                          id: "attendance",
                          label: "Attendance",
                          icon: Calendar,
                        },
                        { id: "tests", label: "Tests", icon: Trophy },
                        { id: "terbia", label: "Terbia", icon: Brain },
                        { id: "payments", label: "Payments", icon: CreditCard },
                        { id: "schedule", label: "Schedule", icon: Clock },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setCurrentTab(tab.id)}
                          className={`flex-shrink-0 flex items-center justify-center space-x-1 py-2 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 min-w-fit ${
                            currentTab === tab.id
                              ? isDarkMode
                                ? "bg-gray-700 text-white shadow-lg"
                                : "bg-white text-gray-900 shadow-sm"
                              : isDarkMode
                              ? "text-gray-400 hover:text-white hover:bg-gray-700/50"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                          }`}
                        >
                          <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="whitespace-nowrap">{tab.label}</span>
                        </button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Tab Content */}
                  <div className="space-y-4">
                    {/* Overview Tab */}
                    {currentTab === "overview" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-5"
                      >
                        {/* Quick Stats Cards */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                          {/* Attendance Card */}
                          <button
                            onClick={() => setCurrentTab("attendance")}
                            className={`relative p-4 rounded-2xl shadow-lg border-2 text-left transition-all active:scale-95 hover:shadow-xl overflow-hidden group ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}
                            style={{
                              borderColor: isDarkMode
                                ? "rgba(34, 197, 94, 0.3)"
                                : "rgba(34, 197, 94, 0.2)",
                            }}
                          >
                            <div
                              className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                              style={{
                                background:
                                  "radial-gradient(circle, #22c55e 0%, transparent 70%)",
                              }}
                            />
                            <CheckCircle
                              className="w-8 h-8 mb-2 relative z-10"
                              style={{
                                color: isDarkMode ? "#22c55e" : "#16a34a",
                              }}
                            />
                            <div
                              className={`text-2xl font-bold mb-1 relative z-10 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {studentData.student.attendance.percentage}%
                            </div>
                            <div
                              className={`text-xs font-medium mb-2 relative z-10 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Attendance Rate
                            </div>
                            <div className="flex items-center justify-between text-[10px] relative z-10">
                              <span
                                style={{
                                  color: isDarkMode ? "#22c55e" : "#16a34a",
                                }}
                              >
                                {studentData.student.attendance.presentDays}{" "}
                                Present
                              </span>
                              <span
                                style={{
                                  color: isDarkMode ? "#ef4444" : "#dc2626",
                                }}
                              >
                                {studentData.student.attendance.absentDays}{" "}
                                Absent
                              </span>
                            </div>
                          </button>

                          {/* Zoom Sessions Card */}
                          <button
                            onClick={() => setCurrentTab("schedule")}
                            className={`relative p-4 rounded-2xl shadow-lg border-2 text-left transition-all active:scale-95 hover:shadow-xl overflow-hidden group ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}
                            style={{
                              borderColor: isDarkMode
                                ? "rgba(59, 130, 246, 0.3)"
                                : "rgba(59, 130, 246, 0.2)",
                            }}
                          >
                            <div
                              className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                              style={{
                                background:
                                  "radial-gradient(circle, #3b82f6 0%, transparent 70%)",
                              }}
                            />
                            <BarChart3
                              className="w-8 h-8 mb-2 relative z-10"
                              style={{
                                color: isDarkMode ? "#3b82f6" : "#2563eb",
                              }}
                            />
                            <div
                              className={`text-2xl font-bold mb-1 relative z-10 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {studentData.student.summary.totalZoomSessions}
                            </div>
                            <div
                              className={`text-xs font-medium mb-2 relative z-10 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Zoom Sessions
                            </div>
                            <div className="text-[10px] relative z-10">
                              <span
                                style={{
                                  color: isDarkMode ? "#3b82f6" : "#2563eb",
                                }}
                              >
                                Last 30 days
                              </span>
                            </div>
                          </button>

                          {/* Tests Card */}
                          <button
                            onClick={() => setCurrentTab("tests")}
                            className={`relative p-4 rounded-2xl shadow-lg border-2 text-left transition-all active:scale-95 hover:shadow-xl overflow-hidden group ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}
                            style={{
                              borderColor: isDarkMode
                                ? "rgba(168, 85, 247, 0.3)"
                                : "rgba(168, 85, 247, 0.2)",
                            }}
                          >
                            <div
                              className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                              style={{
                                background:
                                  "radial-gradient(circle, #a855f7 0%, transparent 70%)",
                              }}
                            />
                            <Trophy
                              className="w-8 h-8 mb-2 relative z-10"
                              style={{
                                color: isDarkMode ? "#a855f7" : "#9333ea",
                              }}
                            />
                            <div
                              className={`text-2xl font-bold mb-1 relative z-10 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {studentData.student.summary.totalTests}
                            </div>
                            <div
                              className={`text-xs font-medium mb-2 relative z-10 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Total Tests
                            </div>
                            <div className="text-[10px] relative z-10">
                              <span
                                style={{
                                  color: isDarkMode ? "#a855f7" : "#9333ea",
                                }}
                              >
                                {studentData.student.summary.passedTests} Passed
                              </span>
                            </div>
                          </button>

                          {/* Terbia Card */}
                          <button
                            onClick={() => setCurrentTab("terbia")}
                            className={`relative p-4 rounded-2xl shadow-lg border-2 text-left transition-all active:scale-95 hover:shadow-xl overflow-hidden group ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-700"
                                : "bg-white border-gray-200"
                            }`}
                            style={{
                              borderColor: isDarkMode
                                ? "rgba(249, 115, 22, 0.3)"
                                : "rgba(249, 115, 22, 0.2)",
                            }}
                          >
                            <div
                              className="absolute -top-8 -right-8 w-20 h-20 rounded-full opacity-10 group-hover:opacity-20 transition-opacity"
                              style={{
                                background:
                                  "radial-gradient(circle, #f97316 0%, transparent 70%)",
                              }}
                            />
                            <Brain
                              className="w-8 h-8 mb-2 relative z-10"
                              style={{
                                color: isDarkMode ? "#fb923c" : "#ea580c",
                              }}
                            />
                            <div
                              className={`text-2xl font-bold mb-1 relative z-10 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {studentData.terbiaProgress?.overallProgress
                                ?.overallPercent || 0}
                              %
                            </div>
                            <div
                              className={`text-xs font-medium mb-2 relative z-10 ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              Terbia Progress
                            </div>
                            <div className="text-[10px] relative z-10">
                              <span
                                style={{
                                  color: isDarkMode ? "#fb923c" : "#ea580c",
                                }}
                              >
                                {studentData.terbiaProgress?.overallProgress
                                  ?.completedCourses || 0}{" "}
                                Courses
                              </span>
                            </div>
                          </button>
                        </div>

                        {/* Recent Activity Section */}
                        <div
                          className={`relative p-5 rounded-2xl shadow-xl border-2 overflow-hidden ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {/* Decorative corner accent */}
                          <div
                            className="absolute bottom-0 left-0 w-32 h-32 opacity-10"
                            style={{
                              background:
                                "radial-gradient(circle at bottom left, #3b82f6 0%, transparent 70%)",
                            }}
                          />

                          <div className="flex items-center justify-between mb-4 relative z-10">
                            <h3
                              className={`text-base font-bold flex items-center gap-2 ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              <Activity className="w-5 h-5" />
                              Recent Activity
                            </h3>
                          </div>

                          <div className="space-y-3 relative z-10">
                            {/* Recent Test */}
                            {studentData.student.testResults[0] && (
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: studentData.student
                                      .testResults[0].passed
                                      ? isDarkMode
                                        ? "rgba(34, 197, 94, 0.2)"
                                        : "rgba(34, 197, 94, 0.15)"
                                      : isDarkMode
                                      ? "rgba(239, 68, 68, 0.2)"
                                      : "rgba(239, 68, 68, 0.15)",
                                  }}
                                >
                                  {studentData.student.testResults[0].passed ? (
                                    <CheckCircle
                                      className="w-5 h-5"
                                      style={{
                                        color: isDarkMode
                                          ? "#22c55e"
                                          : "#16a34a",
                                      }}
                                    />
                                  ) : (
                                    <XCircle
                                      className="w-5 h-5"
                                      style={{
                                        color: isDarkMode
                                          ? "#ef4444"
                                          : "#dc2626",
                                      }}
                                    />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-semibold truncate ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    {
                                      studentData.student.testResults[0]
                                        .testName
                                    }
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    Score:{" "}
                                    {studentData.student.testResults[0].score}%
                                    •{" "}
                                    {formatDateShort(
                                      studentData.student.testResults[0]
                                        .appointmentDate || ""
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Recent Zoom Session */}
                            {studentData.student.zoomSessions[0] && (
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? "rgba(59, 130, 246, 0.2)"
                                      : "rgba(59, 130, 246, 0.15)",
                                  }}
                                >
                                  <BarChart3
                                    className="w-5 h-5"
                                    style={{
                                      color: isDarkMode ? "#3b82f6" : "#2563eb",
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-semibold ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    Zoom Session
                                  </p>
                                  <p
                                    className={`text-xs truncate ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {
                                      studentData.student.zoomSessions[0]
                                        .wpos_wpdatatable_24?.ustazname
                                    }{" "}
                                    •{" "}
                                    {formatDateShort(
                                      studentData.student.zoomSessions[0]
                                        .sent_time
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Recent Attendance */}
                            {studentData.student.attendance
                              .recentRecords[0] && (
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor:
                                      studentData.student.attendance.recentRecords[0].status?.toLowerCase() ===
                                        "present" ||
                                      studentData.student.attendance.recentRecords[0].status?.toLowerCase() ===
                                        "attended"
                                        ? isDarkMode
                                          ? "rgba(34, 197, 94, 0.2)"
                                          : "rgba(34, 197, 94, 0.15)"
                                        : isDarkMode
                                        ? "rgba(239, 68, 68, 0.2)"
                                        : "rgba(239, 68, 68, 0.15)",
                                  }}
                                >
                                  <Calendar
                                    className="w-5 h-5"
                                    style={{
                                      color:
                                        studentData.student.attendance.recentRecords[0].status?.toLowerCase() ===
                                          "present" ||
                                        studentData.student.attendance.recentRecords[0].status?.toLowerCase() ===
                                          "attended"
                                          ? isDarkMode
                                            ? "#22c55e"
                                            : "#16a34a"
                                          : isDarkMode
                                          ? "#ef4444"
                                          : "#dc2626",
                                    }}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-semibold ${
                                      isDarkMode
                                        ? "text-white"
                                        : "text-gray-900"
                                    }`}
                                  >
                                    Attendance:{" "}
                                    {studentData.student.attendance.recentRecords[0].status?.toLowerCase() ===
                                      "present" ||
                                    studentData.student.attendance.recentRecords[0].status?.toLowerCase() ===
                                      "attended"
                                      ? "Present"
                                      : "Absent"}
                                  </p>
                                  <p
                                    className={`text-xs ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {formatDateShort(
                                      studentData.student.attendance
                                        .recentRecords[0].date
                                    )}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Teacher & Class Info */}
                        <div
                          className={`relative p-5 rounded-2xl shadow-xl border-2 overflow-hidden ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          {/* Decorative corner accent */}
                          <div
                            className="absolute top-0 right-0 w-32 h-32 opacity-10"
                            style={{
                              background:
                                "radial-gradient(circle at top right, #8b5cf6 0%, transparent 70%)",
                            }}
                          />

                          <div className="flex items-center gap-4 mb-4 relative z-10">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br from-purple-600 to-purple-700 text-white">
                              <Users className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-medium mb-0.5 ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Teacher
                              </p>
                              <h3
                                className={`text-base font-bold truncate ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {studentData.student.teacher.ustazname}
                              </h3>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 relative z-10">
                            <div
                              className={`p-3 rounded-xl ${
                                isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <p
                                  className={`text-[10px] font-medium ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Schedule
                                </p>
                              </div>
                              <p
                                className={`text-sm font-bold ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {formatDayPackage(
                                  studentData.student.daypackages
                                )}
                              </p>
                            </div>

                            <div
                              className={`p-3 rounded-xl ${
                                isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <BookOpen className="w-4 h-4 text-orange-600" />
                                <p
                                  className={`text-[10px] font-medium ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                >
                                  Package
                                </p>
                              </div>
                              <p
                                className={`text-sm font-bold truncate ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {studentData.student.package}
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Attendance Tab */}
                    {currentTab === "attendance" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Attendance Summary Card */}
                        <div
                          className={`p-4 rounded-2xl ${
                            isDarkMode ? "bg-gray-800" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3
                              className={`text-lg font-semibold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Attendance Record
                            </h3>
                            <button
                              onClick={() => toggleSection("attendance")}
                              className="p-1"
                            >
                              {expandedSections.attendance ? (
                                <ChevronUp
                                  className={`w-4 h-4 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                />
                              ) : (
                                <ChevronDown
                                  className={`w-4 h-4 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="text-center">
                              <div
                                className={`text-2xl font-bold ${
                                  isDarkMode
                                    ? "text-green-400"
                                    : "text-green-600"
                                }`}
                              >
                                {studentData.student.attendance.presentDays}
                              </div>
                              <div
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Present
                              </div>
                            </div>
                            <div className="text-center">
                              <div
                                className={`text-2xl font-bold ${
                                  isDarkMode ? "text-red-400" : "text-red-600"
                                }`}
                              >
                                {studentData.student.attendance.absentDays}
                              </div>
                              <div
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Absent
                              </div>
                            </div>
                            <div className="text-center">
                              <div
                                className={`text-2xl font-bold ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {studentData.student.attendance.totalDays}
                              </div>
                              <div
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-500"
                                }`}
                              >
                                Total Days
                              </div>
                            </div>
                          </div>

                          {expandedSections.attendance && (
                            <div className="space-y-2">
                              {studentData.student.attendance.recentRecords
                                .slice(0, 5)
                                .map((record, index) => (
                                  <div
                                    key={record.id}
                                    className={`flex items-center justify-between p-3 rounded-xl ${
                                      isDarkMode
                                        ? "bg-gray-700/50"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`w-2 h-2 rounded-full ${
                                          record.status?.toLowerCase() ===
                                            "present" ||
                                          record.status?.toLowerCase() ===
                                            "attended"
                                            ? isDarkMode
                                              ? "bg-green-400"
                                              : "bg-green-500"
                                            : isDarkMode
                                            ? "bg-red-400"
                                            : "bg-red-500"
                                        }`}
                                      />
                                      <div>
                                        <span
                                          className={`text-sm font-medium ${
                                            isDarkMode
                                              ? "text-white"
                                              : "text-gray-900"
                                          }`}
                                        >
                                          {formatDate(record.date)}
                                        </span>
                                        <div
                                          className={`text-xs ${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {new Date(
                                            record.date
                                          ).toLocaleDateString("en-US", {
                                            weekday: "long",
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                    <div
                                      className={`text-xs font-medium px-2 py-1 rounded-full ${
                                        record.status?.toLowerCase() ===
                                          "present" ||
                                        record.status?.toLowerCase() ===
                                          "attended"
                                          ? isDarkMode
                                            ? "bg-green-900/30 text-green-300"
                                            : "bg-green-100 text-green-700"
                                          : isDarkMode
                                          ? "bg-red-900/30 text-red-300"
                                          : "bg-red-100 text-red-700"
                                      }`}
                                    >
                                      {record.status}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Tests Tab */}
                    {currentTab === "tests" &&
                      studentData.student.testResults.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          <div
                            className={`p-4 rounded-2xl ${
                              isDarkMode ? "bg-gray-800" : "bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-4">
                              <h3
                                className={`text-lg font-semibold ${
                                  isDarkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                Test Results
                              </h3>
                              <button
                                onClick={() => toggleSection("tests")}
                                className="p-1"
                              >
                                {expandedSections.tests ? (
                                  <ChevronUp
                                    className={`w-4 h-4 ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  />
                                ) : (
                                  <ChevronDown
                                    className={`w-4 h-4 ${
                                      isDarkMode
                                        ? "text-gray-400"
                                        : "text-gray-500"
                                    }`}
                                  />
                                )}
                              </button>
                            </div>

                            {expandedSections.tests && (
                              <div className="space-y-3">
                                {studentData.student.testResults.map(
                                  (test, index) => (
                                    <div
                                      key={test.testId}
                                      className={`flex items-center justify-between p-3 rounded-xl ${
                                        isDarkMode
                                          ? "bg-gray-700/50"
                                          : "bg-gray-50"
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3">
                                        <div
                                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                            test.passed
                                              ? isDarkMode
                                                ? "bg-green-600"
                                                : "bg-green-100"
                                              : isDarkMode
                                              ? "bg-red-600"
                                              : "bg-red-100"
                                          }`}
                                        >
                                          {test.passed ? (
                                            <CheckCircle
                                              className={`w-4 h-4 ${
                                                isDarkMode
                                                  ? "text-white"
                                                  : "text-green-600"
                                              }`}
                                            />
                                          ) : (
                                            <XCircle
                                              className={`w-4 h-4 ${
                                                isDarkMode
                                                  ? "text-white"
                                                  : "text-red-600"
                                              }`}
                                            />
                                          )}
                                        </div>
                                        <div>
                                          <div
                                            className={`font-medium ${
                                              isDarkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                            }`}
                                          >
                                            {test.testName}
                                          </div>
                                          <div
                                            className={`text-xs ${
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            {formatDate(
                                              test.appointmentDate ||
                                                test.testId
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="text-right">
                                        <div
                                          className={`text-lg font-bold ${
                                            test.passed
                                              ? isDarkMode
                                                ? "text-green-400"
                                                : "text-green-600"
                                              : isDarkMode
                                              ? "text-red-400"
                                              : "text-red-600"
                                          }`}
                                        >
                                          {test.score}%
                                        </div>
                                        <div
                                          className={`text-xs ${
                                            test.passed
                                              ? isDarkMode
                                                ? "text-green-300"
                                                : "text-green-700"
                                              : isDarkMode
                                              ? "text-red-300"
                                              : "text-red-700"
                                          }`}
                                        >
                                          {test.passed ? "Passed" : "Failed"}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                    {/* Terbia Tab */}
                    {currentTab === "terbia" && studentData.terbiaProgress && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div
                          className={`p-4 rounded-2xl ${
                            isDarkMode ? "bg-gray-800" : "bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3
                              className={`text-lg font-semibold ${
                                isDarkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              Terbia Progress
                            </h3>
                            <button
                              onClick={() => toggleSection("terbia")}
                              className="p-1"
                            >
                              {expandedSections.terbia ? (
                                <ChevronUp
                                  className={`w-4 h-4 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                />
                              ) : (
                                <ChevronDown
                                  className={`w-4 h-4 ${
                                    isDarkMode
                                      ? "text-gray-400"
                                      : "text-gray-500"
                                  }`}
                                />
                              )}
                            </button>
                          </div>

                          {expandedSections.terbia &&
                            studentData.terbiaProgress.hasProgress && (
                              <>
                                <div className="mb-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <span
                                      className={`font-medium ${
                                        isDarkMode
                                          ? "text-white"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {studentData.terbiaProgress.activePackage}
                                    </span>
                                    <div
                                      className={`px-3 py-1 rounded-full ${
                                        isDarkMode
                                          ? "bg-orange-600 text-white"
                                          : "bg-orange-100 text-orange-700"
                                      }`}
                                    >
                                      <span className="text-sm font-bold">
                                        {studentData.terbiaProgress
                                          .overallProgress?.overallPercent || 0}
                                        %
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    className={`w-full rounded-full h-2 ${
                                      isDarkMode ? "bg-gray-700" : "bg-gray-200"
                                    }`}
                                  >
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${
                                          studentData.terbiaProgress
                                            .overallProgress?.overallPercent ||
                                          0
                                        }%`,
                                      }}
                                      transition={{ duration: 1.5, delay: 0.5 }}
                                      className={`h-2 rounded-full ${
                                        isDarkMode
                                          ? "bg-orange-500"
                                          : "bg-orange-500"
                                      }`}
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="text-center">
                                    <div
                                      className={`text-xl font-bold ${
                                        isDarkMode
                                          ? "text-white"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {studentData.terbiaProgress
                                        .overallProgress?.completedCourses || 0}
                                    </div>
                                    <div
                                      className={`text-xs ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Completed
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    <div
                                      className={`text-xl font-bold ${
                                        isDarkMode
                                          ? "text-white"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {studentData.terbiaProgress
                                        .overallProgress?.totalCourses || 0}
                                    </div>
                                    <div
                                      className={`text-xs ${
                                        isDarkMode
                                          ? "text-gray-400"
                                          : "text-gray-500"
                                      }`}
                                    >
                                      Total Courses
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                        </div>
                      </motion.div>
                    )}

                    {/* Payments Tab */}
                    {currentTab === "payments" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        {/* Current Month Status Banner */}
                        {(() => {
                          const currentMonthPayment = getCurrentMonthStatus();

                          if (!currentMonthPayment) {
                            return (
                              <div
                                className="relative overflow-hidden rounded-3xl p-5 shadow-lg border-2"
                                style={{
                                  background: isDarkMode
                                    ? "linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%)"
                                    : "linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.03) 100%)",
                                  borderColor: isDarkMode
                                    ? "rgba(245, 158, 11, 0.4)"
                                    : "rgba(245, 158, 11, 0.3)",
                                }}
                              >
                                <div
                                  className="absolute inset-0 opacity-10"
                                  style={{
                                    background:
                                      "radial-gradient(circle at 70% 30%, white 0%, transparent 50%)",
                                  }}
                                />
                                <div className="relative z-10">
                                  <div className="flex items-start gap-4">
                                    <div
                                      className="p-3 rounded-2xl shadow-xl"
                                      style={{
                                        backgroundColor: isDarkMode
                                          ? "rgba(255, 255, 255, 0.1)"
                                          : "rgba(255, 255, 255, 0.7)",
                                        color: isDarkMode
                                          ? "#f59e0b"
                                          : "#d97706",
                                      }}
                                    >
                                      <HelpCircle className="w-10 h-10" />
                                    </div>
                                    <div className="flex-1">
                                      <h3
                                        className={`text-lg font-bold mb-1 ${
                                          isDarkMode
                                            ? "text-white"
                                            : "text-gray-900"
                                        }`}
                                      >
                                        Payment Status
                                      </h3>
                                      <p
                                        className={`text-sm font-medium ${
                                          isDarkMode
                                            ? "text-gray-300"
                                            : "text-gray-600"
                                        }`}
                                      >
                                        No payment record found for this month.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const isPaid = currentMonthPayment.status === "Paid";
                          const isFree = currentMonthPayment.isFreeMonth;
                          const isPartial =
                            currentMonthPayment.type === "partial" ||
                            currentMonthPayment.type === "prizepartial";
                          const paidAmount = currentMonthPayment.amount || 0;
                          const fullAmount = studentData.student.classfee;
                          const remainingAmount = fullAmount - paidAmount;

                          let bgGradient,
                            borderColor,
                            icon,
                            title,
                            message,
                            iconColor;

                          if (isFree) {
                            bgGradient = isDarkMode
                              ? "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)"
                              : "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.03) 100%)";
                            borderColor = isDarkMode
                              ? "rgba(168, 85, 247, 0.4)"
                              : "rgba(168, 85, 247, 0.3)";
                            icon = <Sparkles className="w-10 h-10" />;
                            iconColor = isDarkMode ? "#a855f7" : "#9333ea";
                            title = "Free Month";
                            message = "This month is free for your child!";
                          } else if (isPartial) {
                            bgGradient = isDarkMode
                              ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)"
                              : "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%)";
                            borderColor = isDarkMode
                              ? "rgba(59, 130, 246, 0.4)"
                              : "rgba(59, 130, 246, 0.3)";
                            icon = <CreditCard className="w-10 h-10" />;
                            iconColor = isDarkMode ? "#3b82f6" : "#2563eb";
                            title = "Partial Payment";
                            message =
                              "A partial payment has been made for this month.";
                          } else if (isPaid) {
                            bgGradient = isDarkMode
                              ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%)"
                              : "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.03) 100%)";
                            borderColor = isDarkMode
                              ? "rgba(34, 197, 94, 0.4)"
                              : "rgba(34, 197, 94, 0.3)";
                            icon = <CheckCircle className="w-10 h-10" />;
                            iconColor = isDarkMode ? "#22c55e" : "#16a34a";
                            title = "All Paid Up!";
                            message =
                              "This month's payment has been received. Thank you!";
                          } else {
                            bgGradient = isDarkMode
                              ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)"
                              : "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 100%)";
                            borderColor = isDarkMode
                              ? "rgba(239, 68, 68, 0.4)"
                              : "rgba(239, 68, 68, 0.3)";
                            icon = <Clock className="w-10 h-10" />;
                            iconColor = isDarkMode ? "#ef4444" : "#dc2626";
                            title = "Payment Required";
                            message = "Payment for this month is pending.";
                          }

                          return (
                            <div
                              className="relative overflow-hidden rounded-3xl p-5 shadow-lg border-2"
                              style={{
                                background: bgGradient,
                                borderColor: borderColor,
                              }}
                            >
                              <div
                                className="absolute inset-0 opacity-10"
                                style={{
                                  background:
                                    "radial-gradient(circle at 70% 30%, white 0%, transparent 50%)",
                                }}
                              />
                              <div className="relative z-10">
                                <div className="flex items-start gap-4 mb-4">
                                  <div
                                    className="p-3 rounded-2xl shadow-xl"
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? "rgba(255, 255, 255, 0.1)"
                                        : "rgba(255, 255, 255, 0.7)",
                                      color: iconColor,
                                    }}
                                  >
                                    {icon}
                                  </div>
                                  <div className="flex-1">
                                    <h3
                                      className={`text-lg font-bold mb-1 ${
                                        isDarkMode
                                          ? "text-white"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {title}
                                    </h3>
                                    <p
                                      className={`text-sm font-medium mb-3 ${
                                        isDarkMode
                                          ? "text-gray-300"
                                          : "text-gray-600"
                                      }`}
                                    >
                                      {message}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                      <div
                                        className="px-3 py-2 rounded-xl"
                                        style={{
                                          backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.05)"
                                            : "rgba(0, 0, 0, 0.03)",
                                        }}
                                      >
                                        <p
                                          className={`text-[10px] font-medium mb-0.5 ${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {isPartial
                                            ? "Amount Paid"
                                            : "Monthly Fee"}
                                        </p>
                                        <p
                                          className={`text-base font-bold ${
                                            isDarkMode
                                              ? "text-white"
                                              : "text-gray-900"
                                          }`}
                                        >
                                      {isFree
                                        ? "Free Month"
                                        : isPartial
                                        ? formatCurrencyValue(paidAmount, currency)
                                        : formatCurrencyValue(
                                            studentData.student.classfee,
                                            currency
                                          )}
                                        </p>
                                      </div>
                                      <div
                                        className="px-3 py-2 rounded-xl"
                                        style={{
                                          backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.05)"
                                            : "rgba(0, 0, 0, 0.03)",
                                        }}
                                      >
                                        <p
                                          className={`text-[10px] font-medium mb-0.5 ${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {isPartial ? "Remaining" : "Status"}
                                        </p>
                                        <p
                                          className="text-base font-bold"
                                          style={{ color: iconColor }}
                                        >
                                      {isFree
                                        ? "Free"
                                        : isPartial
                                        ? formatCurrencyValue(
                                            remainingAmount,
                                            currency
                                          )
                                        : isPaid
                                        ? "Paid"
                                        : "Unpaid"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Payment Summary Cards */}
                        <div
                          className={`p-5 rounded-2xl shadow-xl border-2 ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700"
                              : "bg-white border-gray-200"
                          }`}
                        >
                          <h3
                            className={`text-lg font-bold mb-4 flex items-center gap-2 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            <CreditCard className="w-5 h-5" />
                            Payment Summary
                          </h3>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div
                              className={`p-3 rounded-lg ${
                                isDarkMode ? "bg-gray-700" : "bg-green-50"
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  isDarkMode
                                    ? "text-gray-400"
                                    : "text-green-600"
                                }`}
                              >
                                Total Deposits
                              </p>
                              <p
                                className={`text-lg font-bold ${
                                  isDarkMode ? "text-white" : "text-green-700"
                                }`}
                              >
                                {formatCurrencyValue(
                                  studentData.student.payments?.summary
                                    ?.totalDeposits || 0,
                                  currency
                                )}
                              </p>
                            </div>
                            <div
                              className={`p-3 rounded-lg ${
                                isDarkMode ? "bg-gray-700" : "bg-blue-50"
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-blue-600"
                                }`}
                              >
                                Monthly Payments
                              </p>
                              <p
                                className={`text-lg font-bold ${
                                  isDarkMode ? "text-white" : "text-blue-700"
                                }`}
                              >
                                {formatCurrencyValue(
                                  studentData.student.payments?.summary
                                    ?.totalMonthlyPayments || 0,
                                  currency
                                )}
                              </p>
                            </div>
                            <div
                              className={`p-3 rounded-lg ${
                                isDarkMode ? "bg-gray-700" : "bg-purple-50"
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  isDarkMode
                                    ? "text-gray-400"
                                    : "text-purple-600"
                                }`}
                              >
                                Remaining Balance
                              </p>
                              <p
                                className={`text-lg font-bold ${
                                  isDarkMode ? "text-white" : "text-purple-700"
                                }`}
                              >
                                {formatCurrencyValue(
                                  studentData.student.payments?.summary
                                    ?.remainingBalance || 0,
                                  currency
                                )}
                              </p>
                            </div>
                            <div
                              className={`p-3 rounded-lg ${
                                isDarkMode ? "bg-gray-700" : "bg-orange-50"
                              }`}
                            >
                              <p
                                className={`text-xs ${
                                  isDarkMode
                                    ? "text-gray-400"
                                    : "text-orange-600"
                                }`}
                              >
                                Paid Months
                              </p>
                              <p
                                className={`text-lg font-bold ${
                                  isDarkMode ? "text-white" : "text-orange-700"
                                }`}
                              >
                                {studentData.student.payments?.summary
                                  ?.paidMonths || 0}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Deposit History */}
                        {studentData.student.payments?.deposits &&
                          studentData.student.payments.deposits.length > 0 && (
                            <div
                              className={`p-5 rounded-2xl shadow-xl border-2 ${
                                isDarkMode
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3
                                  className={`text-lg font-bold flex items-center gap-2 ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  <Trophy className="w-5 h-5" />
                                  Deposit History
                                </h3>
                                <div
                                  className="px-3 py-1 rounded-full text-xs font-bold"
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? "rgba(34, 197, 94, 0.2)"
                                      : "rgba(34, 197, 94, 0.15)",
                                    color: isDarkMode ? "#22c55e" : "#16a34a",
                                  }}
                                >
                                  {studentData.student.payments.deposits.length}{" "}
                                  Total
                                </div>
                              </div>

                              <div className="space-y-3">
                                {studentData.student.payments.deposits
                                  .slice(0, 5)
                                  .map((deposit, index) => (
                                    <div
                                      key={index}
                                      className="relative p-4 rounded-xl shadow-sm border-l-4 transition-all hover:shadow-md"
                                      style={{
                                        backgroundColor: isDarkMode
                                          ? "rgba(255, 255, 255, 0.03)"
                                          : "rgba(0, 0, 0, 0.01)",
                                        borderLeftColor:
                                          deposit.status === "Approved"
                                            ? isDarkMode
                                              ? "#22c55e"
                                              : "#16a34a"
                                            : deposit.status === "pending"
                                            ? isDarkMode
                                              ? "#f59e0b"
                                              : "#d97706"
                                            : isDarkMode
                                            ? "#ef4444"
                                            : "#dc2626",
                                      }}
                                    >
                                      <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                          <p
                                            className="text-xl font-bold"
                                            style={{
                                              color:
                                                deposit.status === "Approved"
                                                  ? isDarkMode
                                                    ? "#22c55e"
                                                    : "#16a34a"
                                                  : isDarkMode
                                                  ? "#ffffff"
                                                  : "#111827",
                                            }}
                                          >
                                            {formatCurrencyValue(
                                              deposit.amount,
                                              deposit.currency || currency
                                            )}
                                          </p>
                                          <p
                                            className={`text-sm font-medium mb-1 ${
                                              isDarkMode
                                                ? "text-gray-300"
                                                : "text-gray-700"
                                            }`}
                                          >
                                            {deposit.reason}
                                          </p>
                                          {deposit.transactionId && (
                                            <p
                                              className={`text-[10px] font-mono ${
                                                isDarkMode
                                                  ? "text-gray-400"
                                                  : "text-gray-500"
                                              }`}
                                            >
                                              TX: {deposit.transactionId}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                          <div
                                            className="px-2.5 py-1 rounded-lg text-xs font-bold"
                                            style={{
                                              backgroundColor:
                                                deposit.status === "Approved"
                                                  ? isDarkMode
                                                    ? "rgba(34, 197, 94, 0.2)"
                                                    : "rgba(34, 197, 94, 0.15)"
                                                  : deposit.status === "pending"
                                                  ? isDarkMode
                                                    ? "rgba(245, 158, 11, 0.2)"
                                                    : "rgba(245, 158, 11, 0.15)"
                                                  : isDarkMode
                                                  ? "rgba(239, 68, 68, 0.2)"
                                                  : "rgba(239, 68, 68, 0.15)",
                                              color:
                                                deposit.status === "Approved"
                                                  ? isDarkMode
                                                    ? "#22c55e"
                                                    : "#16a34a"
                                                  : deposit.status === "pending"
                                                  ? isDarkMode
                                                    ? "#f59e0b"
                                                    : "#d97706"
                                                  : isDarkMode
                                                  ? "#ef4444"
                                                  : "#dc2626",
                                            }}
                                          >
                                            {deposit.status}
                                          </div>
                                          <p
                                            className={`text-[10px] font-medium ${
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            {new Date(
                                              deposit.date
                                            ).toLocaleDateString("en-US", {
                                              month: "short",
                                              day: "numeric",
                                              year: "numeric",
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                        {/* Monthly Payment History */}
                        {studentData.student.payments?.monthlyPayments &&
                          studentData.student.payments.monthlyPayments.length >
                            0 && (
                            <div
                              className={`p-5 rounded-2xl shadow-xl border-2 ${
                                isDarkMode
                                  ? "bg-gray-800 border-gray-700"
                                  : "bg-white border-gray-200"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3
                                  className={`text-lg font-bold flex items-center gap-2 ${
                                    isDarkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  <Calendar className="w-5 h-5" />
                                  Monthly Breakdown
                                </h3>
                                <div
                                  className="px-3 py-1 rounded-full text-xs font-bold"
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? "rgba(59, 130, 246, 0.2)"
                                      : "rgba(59, 130, 246, 0.15)",
                                    color: isDarkMode ? "#3b82f6" : "#2563eb",
                                  }}
                                >
                                  {studentData.student.payments.summary
                                    ?.paidMonths || 0}
                                  /
                                  {
                                    studentData.student.payments.monthlyPayments
                                      .length
                                  }
                                </div>
                              </div>

                              <div className="space-y-3">
                                {studentData.student.payments.monthlyPayments
                                  .slice(0, 8)
                                  .map((payment, index) => {
                                    const isPaid = payment.status === "Paid";
                                    const isFree = payment.isFreeMonth;
                                    const isPartial =
                                      payment.type === "partial" ||
                                      payment.type === "prizepartial";
                                    const isCurrentMonth = (() => {
                                      const currentDate = new Date();
                                      const currentMonth = `${currentDate.getFullYear()}-${String(
                                        currentDate.getMonth() + 1
                                      ).padStart(2, "0")}`;
                                      return payment.month === currentMonth;
                                    })();

                                    return (
                                      <div
                                        key={index}
                                        className="relative p-4 rounded-xl shadow-sm border-l-4 transition-all"
                                        style={{
                                          backgroundColor: isDarkMode
                                            ? "rgba(255, 255, 255, 0.03)"
                                            : "rgba(0, 0, 0, 0.01)",
                                          borderLeftColor: isFree
                                            ? isDarkMode
                                              ? "#a855f7"
                                              : "#9333ea"
                                            : isPartial
                                            ? isDarkMode
                                              ? "#3b82f6"
                                              : "#2563eb"
                                            : isPaid
                                            ? isDarkMode
                                              ? "#22c55e"
                                              : "#16a34a"
                                            : isDarkMode
                                            ? "#f59e0b"
                                            : "#d97706",
                                          ...(isCurrentMonth && {
                                            boxShadow: `0 0 0 2px ${
                                              isDarkMode ? "#3b82f6" : "#2563eb"
                                            }`,
                                          }),
                                        }}
                                      >
                                        {isCurrentMonth && (
                                          <div
                                            className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse"
                                            style={{
                                              backgroundColor: "#3b82f6",
                                              color: "#ffffff",
                                            }}
                                          >
                                            CURRENT MONTH
                                          </div>
                                        )}

                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                              <p
                                                className={`text-base font-bold ${
                                                  isDarkMode
                                                    ? "text-white"
                                                    : "text-gray-900"
                                                }`}
                                              >
                                                {new Date(
                                                  payment.month + "-01"
                                                ).toLocaleDateString("en-US", {
                                                  month: "long",
                                                  year: "numeric",
                                                })}
                                              </p>
                                              {isFree && (
                                                <Sparkles
                                                  className="w-4 h-4"
                                                  style={{
                                                    color: isDarkMode
                                                      ? "#a855f7"
                                                      : "#9333ea",
                                                  }}
                                                />
                                              )}
                                            </div>

                                            <p
                                              className={`text-sm font-bold ${
                                                isDarkMode
                                                  ? "text-gray-300"
                                                  : "text-gray-700"
                                              }`}
                                            >
                                              {isFree
                                                ? "Free Month"
                                                : formatCurrencyValue(
                                                    payment.amount,
                                                    payment.currency || currency
                                                  )}
                                            </p>
                                            {isFree && payment.freeReason && (
                                              <p
                                                className="text-xs mt-1"
                                                style={{
                                                  color: isDarkMode
                                                    ? "#a855f7"
                                                    : "#9333ea",
                                                }}
                                              >
                                                {payment.freeReason}
                                              </p>
                                            )}
                                          </div>

                                          <div className="flex flex-col items-end gap-1">
                                            <div
                                              className="px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                                              style={{
                                                backgroundColor: isFree
                                                  ? isDarkMode
                                                    ? "rgba(168, 85, 247, 0.2)"
                                                    : "rgba(168, 85, 247, 0.15)"
                                                  : isPartial
                                                  ? isDarkMode
                                                    ? "rgba(59, 130, 246, 0.2)"
                                                    : "rgba(59, 130, 246, 0.15)"
                                                  : isPaid
                                                  ? isDarkMode
                                                    ? "rgba(34, 197, 94, 0.2)"
                                                    : "rgba(34, 197, 94, 0.15)"
                                                  : isDarkMode
                                                  ? "rgba(245, 158, 11, 0.2)"
                                                  : "rgba(245, 158, 11, 0.15)",
                                                color: isFree
                                                  ? isDarkMode
                                                    ? "#a855f7"
                                                    : "#9333ea"
                                                  : isPartial
                                                  ? isDarkMode
                                                    ? "#3b82f6"
                                                    : "#2563eb"
                                                  : isPaid
                                                  ? isDarkMode
                                                    ? "#22c55e"
                                                    : "#16a34a"
                                                  : isDarkMode
                                                  ? "#f59e0b"
                                                  : "#d97706",
                                              }}
                                            >
                                              {isFree ? (
                                                <Sparkles className="w-3 h-3" />
                                              ) : isPartial ? (
                                                <CreditCard className="w-3 h-3" />
                                              ) : isPaid ? (
                                                <CheckCircle className="w-3 h-3" />
                                              ) : (
                                                <Clock className="w-3 h-3" />
                                              )}
                                              {isFree
                                                ? "Free"
                                                : isPartial
                                                ? "Partial"
                                                : payment.status}
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}
                      </motion.div>
                    )}

                    {/* Schedule Tab */}
                    {currentTab === "schedule" && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                      >
                        <div
                          className={`p-4 rounded-2xl ${
                            isDarkMode ? "bg-gray-800" : "bg-white"
                          }`}
                        >
                          <h3
                            className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            <Clock className="w-5 h-5" />
                            Scheduled Times
                          </h3>
                          <div className="space-y-2">
                            {studentData.student.occupiedTimes &&
                            studentData.student.occupiedTimes.length > 0 ? (
                              studentData.student.occupiedTimes
                                .slice(0, 10)
                                .map((time, index) => (
                                  <div
                                    key={index}
                                    className={`p-3 rounded-lg ${
                                      isDarkMode ? "bg-gray-700" : "bg-gray-50"
                                    }`}
                                  >
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <Clock
                                            className={`w-4 h-4 ${
                                              isDarkMode
                                                ? "text-blue-400"
                                                : "text-blue-600"
                                            }`}
                                          />
                                          <p
                                            className={`text-sm font-semibold ${
                                              isDarkMode
                                                ? "text-white"
                                                : "text-gray-900"
                                            }`}
                                          >
                                            {time.timeSlot}
                                          </p>
                                        </div>
                                        <p
                                          className={`text-xs ${
                                            isDarkMode
                                              ? "text-gray-400"
                                              : "text-gray-500"
                                          }`}
                                        >
                                          {formatDayPackage(time.dayPackage)} •{" "}
                                          {time.teacher}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <div
                                          className={`px-2 py-1 rounded-full text-xs ${
                                            isDarkMode
                                              ? "bg-blue-900/30 text-blue-300"
                                              : "bg-blue-100 text-blue-700"
                                          }`}
                                        >
                                          {time.occupiedAt}
                                        </div>
                                        {time.endAt && (
                                          <p
                                            className={`text-xs mt-1 ${
                                              isDarkMode
                                                ? "text-gray-400"
                                                : "text-gray-500"
                                            }`}
                                          >
                                            Until {time.endAt}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                            ) : (
                              <div className="text-center py-6 text-gray-500">
                                <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">
                                  No scheduled times found
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
