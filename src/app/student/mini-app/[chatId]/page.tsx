"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { I18nProvider, useI18n } from "@/lib/i18n";
import {
  Calendar,
  BookOpen,
  Award,
  Target,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  GraduationCap,
  BarChart3,
  FileText,
  Sun,
  Moon,
  Star,
  Zap,
  Heart,
  Sparkles,
  Trophy,
  Activity,
  BookMarked,
  Brain,
  ChevronRight,
  RefreshCw,
  Settings,
  User,
  Mail,
  Phone,
  ArrowLeft,
  ArrowRight,
  ArrowDown,
  Home,
  Eye,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  CreditCard,
  X,
  Maximize2,
  Minimize2,
  Filter,
  Bell,
  Shield,
  HelpCircle,
  ExternalLink,
  MapPin,
  Package,
  Info,
  Calculator,
} from "lucide-react";

interface StudentData {
  student: {
    wdt_ID: number;
    name: string;
    package: string;
    subject: string;
    classfee: number;
    classfeeCurrency?: string;
    daypackages: string;
    startdate: string | null;
    registrationdate: string | null;
    status: string | null;
    phoneno: string | null;
    country: string | null;
    subscriptionPackageConfigId?: number | null;
    teacher: string;
  };
  stats: {
    attendancePercent: number;
    totalZoomSessions: number;
    testsThisMonth: number;
    terbiaProgress: number;
  };
  attendance: {
    presentDays: number;
    permissionDays: number;
    absentDays: number;
    totalDays: number;
    thisMonth: Array<{
      date: string;
      status: "present" | "absent" | "permission";
      surah?: string | null;
      lesson?: string | null;
      pagesRead?: number | null;
      level?: string | null;
      notes?: string | null;
    }>;
  };
  recentTests: Array<{
    testName: string;
    date: string;
    score: number;
    passed: boolean;
    passingResult: number;
  }>;
  terbia: {
    courseName: string;
    progressPercent: number;
    completedChapters: number;
    totalChapters: number;
  } | null;
  recentZoomSessions: Array<{
    date: string;
    teacher: string;
  }>;
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
      creditBalance: number; // Credit balance available for future payments
      paidMonths: number;
      unpaidMonths: number;
    };
    deposits: Array<{
      id: number;
      amount: number;
      reason: string;
      date: string;
      status: string;
      transactionId: string;
      source?: "chapa" | "stripe" | "manual";
      currency?: string;
      isCredit?: boolean; // Indicates if this is a credit (negative amount)
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
    }>;
    paidMonths: Array<{
      month: string;
      amount: number;
      type: string;
      isFreeMonth: boolean;
      freeReason: string | null;
    }>;
    unpaidMonths: Array<{
      month: string;
      amount: number;
      status: string;
    }>;
  };
}

// Telegram ThemeParams interface
interface ThemeParams {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  link_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
  header_bg_color?: string;
  bottom_bar_bg_color?: string;
  accent_text_color?: string;
  section_bg_color?: string;
  section_header_text_color?: string;
  section_separator_color?: string;
  subtitle_text_color?: string;
  destructive_text_color?: string;
}

// Telegram WebApp interface
interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  requestFullscreen: () => void;
  exitFullscreen: () => void;
  openLink: (url: string, options?: { try_instant_view?: boolean }) => void;
  platform: string;
  isExpanded: boolean;
  isActive: boolean;
  isFullscreen: boolean;
  safeAreaInset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  contentSafeAreaInset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  themeParams: ThemeParams;
  HapticFeedback?: {
    impactOccurred: (
      style: "light" | "medium" | "heavy" | "rigid" | "soft"
    ) => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  onEvent: (event: string, handler: () => void) => void;
  offEvent: (event: string, handler: () => void) => void;
}

interface StudentListItem {
  id: number;
  name: string;
  package: string;
  subject: string;
  teacher: string;
}

// Student Selection Screen Component
function StudentSelectionScreen({
  students,
  onSelectStudent,
  themeParams,
  isDarkMode,
  safeAreaInset,
  contentSafeAreaInset,
  tgWebApp,
}: {
  students: StudentListItem[];
  onSelectStudent: (id: number) => void;
  themeParams: ThemeParams;
  isDarkMode: boolean;
  safeAreaInset: { top: number; bottom: number; left: number; right: number };
  contentSafeAreaInset: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  tgWebApp: TelegramWebApp | null;
}) {
  const { t } = useI18n(); // Add translation support
  const headerPaddingTop = safeAreaInset.top > 0 ? safeAreaInset.top + 16 : 16;

  // Generate colors for avatars
  const getAvatarColor = (index: number) => {
    const colors = [
      "rgba(59, 130, 246, 0.2)", // blue
      "rgba(236, 72, 153, 0.2)", // pink
      "rgba(34, 197, 94, 0.2)", // green
      "rgba(249, 115, 22, 0.2)", // orange
      "rgba(168, 85, 247, 0.2)", // purple
    ];
    return colors[index % colors.length];
  };

  const getAvatarBorderColor = (index: number) => {
    const colors = [
      "#2563eb", // blue
      "#ec4899", // pink
      "#22c55e", // green
      "#f97316", // orange
      "#a855f7", // purple
    ];
    return colors[index % colors.length];
  };

  return (
    <div
      className="min-h-screen transition-all duration-300"
      style={{
        backgroundColor:
          themeParams.bg_color || (isDarkMode ? "#111827" : "#f9fafb"),
        color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827"),
        paddingLeft: `${contentSafeAreaInset.left || 0}px`,
        paddingRight: `${contentSafeAreaInset.right || 0}px`,
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-50 border-b transition-all duration-300"
        style={{
          backgroundColor:
            themeParams.header_bg_color ||
            themeParams.bg_color ||
            (isDarkMode ? "#1f2937" : "#ffffff"),
          borderColor:
            themeParams.section_separator_color ||
            (isDarkMode ? "#374151" : "#e5e7eb"),
          paddingTop: `${headerPaddingTop}px`,
          paddingLeft: `${safeAreaInset.left || 0}px`,
          paddingRight: `${safeAreaInset.right || 0}px`,
        }}
      >
        <div className="px-4 py-6">
          <div className="text-center mb-8">
            <Users
              className="w-16 h-16 mx-auto mb-4"
              style={{
                color:
                  themeParams.button_color ||
                  themeParams.accent_text_color ||
                  "#3b82f6",
              }}
            />
            <h1
              className="text-2xl font-bold mb-2"
              style={{
                color:
                  themeParams.text_color ||
                  (isDarkMode ? "#ffffff" : "#111827"),
              }}
            >
              {t("selectAccount")}
            </h1>
            <p
              className="text-sm"
              style={{
                color:
                  themeParams.hint_color ||
                  themeParams.subtitle_text_color ||
                  (isDarkMode ? "#9ca3af" : "#6b7280"),
              }}
            >
              {t("chooseStudent")}
            </p>
          </div>

          {/* Student Cards - Vertical list with circular avatars */}
          <div className="space-y-3 max-w-md mx-auto">
            {students.map((student, index) => {
              const avatarColor = getAvatarBorderColor(index);
              return (
                <motion.button
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => {
                    if (tgWebApp?.HapticFeedback?.impactOccurred) {
                      tgWebApp.HapticFeedback.impactOccurred("medium");
                    }
                    onSelectStudent(student.id);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl shadow-md border-2 transition-all active:scale-98 hover:shadow-lg"
                  style={{
                    backgroundColor:
                      themeParams.section_bg_color ||
                      themeParams.secondary_bg_color ||
                      (isDarkMode ? "#1f2937" : "#ffffff"),
                    borderColor:
                      themeParams.section_separator_color ||
                      (isDarkMode
                        ? "rgba(55, 65, 81, 0.5)"
                        : "rgba(229, 231, 235, 0.5)"),
                  }}
                >
                  {/* Circular Avatar */}
                  <div className="relative flex-shrink-0">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg relative overflow-hidden"
                      style={{
                        backgroundColor: `${avatarColor}30`,
                        border: `3px solid ${avatarColor}`,
                        color: avatarColor,
                      }}
                    >
                      <span className="relative z-10 font-extrabold">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                      {/* Gradient shimmer */}
                      <div
                        className="absolute inset-0 opacity-10"
                        style={{
                          background: `radial-gradient(circle at 30% 30%, ${avatarColor} 0%, transparent 70%)`,
                        }}
                      />
                    </div>
                    {/* Active indicator for first student */}
                    {index === 0 && (
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border-2 animate-pulse"
                        style={{
                          backgroundColor:
                            themeParams.accent_text_color || "#10b981",
                          borderColor:
                            themeParams.section_bg_color ||
                            (isDarkMode ? "#1f2937" : "#ffffff"),
                        }}
                      >
                        <Star className="w-3.5 h-3.5 text-white fill-white" />
                      </div>
                    )}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 text-left min-w-0">
                    <h3
                      className="text-base font-bold mb-1 truncate"
                      style={{
                        color:
                          themeParams.text_color ||
                          (isDarkMode ? "#ffffff" : "#111827"),
                      }}
                    >
                      {student.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <div
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: `${avatarColor}20`,
                          color: avatarColor,
                        }}
                      >
                        {student.package}
                      </div>
                      {index === 0 && (
                        <div
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                          style={{
                            backgroundColor: themeParams.accent_text_color
                              ? `${themeParams.accent_text_color}20`
                              : "rgba(16, 185, 129, 0.2)",
                            color: themeParams.accent_text_color || "#10b981",
                          }}
                        >
                          {t("active")}
                        </div>
                      )}
                    </div>
                    <p
                      className="text-xs flex items-center gap-1.5 mb-1"
                      style={{
                        color:
                          themeParams.hint_color ||
                          themeParams.subtitle_text_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span className="truncate">{student.subject}</span>
                    </p>
                    <p
                      className="text-xs flex items-center gap-1.5"
                      style={{
                        color:
                          themeParams.hint_color ||
                          themeParams.subtitle_text_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    >
                      <User className="w-3.5 h-3.5" />
                      <span className="truncate">{student.teacher}</span>
                    </p>
                  </div>

                  {/* Arrow indicator with color */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: `${avatarColor}15`,
                    }}
                  >
                    <ChevronRight
                      className="w-5 h-5"
                      style={{
                        color: avatarColor,
                      }}
                    />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Helpful tip */}
          <div
            className="mt-6 p-4 rounded-2xl border text-center"
            style={{
              backgroundColor:
                themeParams.section_bg_color ||
                (isDarkMode
                  ? "rgba(59, 130, 246, 0.1)"
                  : "rgba(59, 130, 246, 0.05)"),
              borderColor:
                themeParams.section_separator_color ||
                (isDarkMode
                  ? "rgba(59, 130, 246, 0.3)"
                  : "rgba(59, 130, 246, 0.2)"),
            }}
          >
            <HelpCircle
              className="w-8 h-8 mx-auto mb-2"
              style={{
                color:
                  themeParams.button_color ||
                  themeParams.accent_text_color ||
                  "#3b82f6",
              }}
            />
            <p
              className="text-xs"
              style={{
                color:
                  themeParams.hint_color ||
                  themeParams.subtitle_text_color ||
                  (isDarkMode ? "#9ca3af" : "#6b7280"),
              }}
            >
              {t("tapToView")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentMiniAppInner({
  params,
  selectedStudentId: externalSelectedStudentId,
  onStudentSelected,
  students: externalStudents,
  loadingStudents: externalLoadingStudents,
}: {
  params: { chatId: string };
  selectedStudentId?: number | null;
  onStudentSelected?: (id: number | null) => void;
  students?: StudentListItem[];
  loadingStudents?: boolean;
}) {
  const { t, lang, setLang } = useI18n();
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [internalStudents, setInternalStudents] = useState<StudentListItem[]>(
    []
  );
  const students = externalStudents ?? internalStudents;
  const [internalSelectedStudentId, setInternalSelectedStudentId] = useState<
    number | null
  >(null);
  const selectedStudentId =
    externalSelectedStudentId ?? internalSelectedStudentId;
  const setSelectedStudentId = (id: number | null) => {
    if (onStudentSelected) {
      onStudentSelected(id);
    } else {
      setInternalSelectedStudentId(id);
    }
  };
  const [loading, setLoading] = useState(true);
  const [internalLoadingStudents, setInternalLoadingStudents] = useState(true);
  const loadingStudents = externalLoadingStudents ?? internalLoadingStudents;
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");
  const [showContentSection, setShowContentSection] = useState(true); // Start with content visible
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({
    attendance: true,
    tests: true,
    terbia: true,
    zoom: true,
  });

  // Payment states
  const [depositAmount, setDepositAmount] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [subscriptionPackages, setSubscriptionPackages] = useState<
    Array<{
      id: number;
      name: string;
      duration: number;
      price: number;
      currency: string;
      description: string | null;
      paymentLink: string | null;
      purchaseCount: number;
    }>
  >([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showPaymentSummaryModal, setShowPaymentSummaryModal] = useState(false);
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState<
    number | null
  >(null);
  const [unpaidMonthsData, setUnpaidMonthsData] = useState<
    Array<{
      month: string;
      monthName: string;
      amount: number;
      status: string;
      isPartial: boolean;
      paidAmount?: number;
    }>
  >([]);
  const [activeSubscriptions, setActiveSubscriptions] = useState<Set<number>>(
    new Set()
  );
  const [currentSubscriptionId, setCurrentSubscriptionId] = useState<
    number | null
  >(null);
  const [currentSubscriptionPackageId, setCurrentSubscriptionPackageId] =
    useState<number | null>(null);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedUpgradePackage, setSelectedUpgradePackage] = useState<
    (typeof subscriptionPackages)[0] | null
  >(null);
  const [downgradeLoading, setDowngradeLoading] = useState(false);
  const [showDowngradeModal, setShowDowngradeModal] = useState(false);
  const [selectedDowngradePackage, setSelectedDowngradePackage] = useState<
    (typeof subscriptionPackages)[0] | null
  >(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showOtherSubscriptions, setShowOtherSubscriptions] = useState(false);
  const [currentSubscriptionDetails, setCurrentSubscriptionDetails] = useState<{
    id: number;
    packageName: string;
    startDate: string;
    endDate: string;
    nextBillingDate: string | null;
    status: string;
    createdAt?: string;
  } | null>(null);

  // Terms of Service agreement state
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Current time state for real-time updates (updates every minute)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Telegram WebApp state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [safeAreaInset, setSafeAreaInset] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [contentSafeAreaInset, setContentSafeAreaInset] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });
  const [themeParams, setThemeParams] = useState<ThemeParams>({});
  const [tgWebApp, setTgWebApp] = useState<TelegramWebApp | null>(null);

  // Load students list first (only if not provided externally)
  useEffect(() => {
    if (!externalStudents) {
      loadStudentsList();
    } else {
      setInternalLoadingStudents(false);
    }
  }, [params.chatId, externalStudents]);

  // Handle reload from payment return page
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const shouldReload = searchParams.get("reload") === "true";
      if (shouldReload) {
        // Remove reload parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("reload");
        newUrl.searchParams.delete("timestamp");
        window.history.replaceState({}, "", newUrl.toString());
        // Force reload student data
        if (selectedStudentId) {
          loadStudentData();
          loadSubscriptionPackages(selectedStudentId);
        }
      }
    }
  }, []);

  // Load student data when a student is selected
  useEffect(() => {
    if (selectedStudentId) {
      loadStudentData();
    }
  }, [selectedStudentId, params.chatId]);

  // Update current time every minute to refresh days remaining calculation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Load subscription packages for non-ETB students (per selected student)
  useEffect(() => {
    const abortController = new AbortController();

    if (
      studentData?.student?.classfeeCurrency &&
      studentData.student.classfeeCurrency !== "ETB" &&
      selectedStudentId
    ) {
      setActiveSubscriptions(new Set());
      loadSubscriptionPackages(selectedStudentId, abortController.signal);
    } else {
      // Clear subscription state when switching to ETB student or no student selected
      setSubscriptionPackages([]);
      setActiveSubscriptions(new Set());
    }

    return () => {
      abortController.abort();
    };
  }, [
    studentData?.student?.classfeeCurrency,
    selectedStudentId,
    studentData?.student?.wdt_ID,
  ]);

  // Check for pending subscriptions when student data is loaded
  // This handles payment links that don't redirect to our return page
  useEffect(() => {
    const abortController = new AbortController();

    if (selectedStudentId && studentData?.student?.wdt_ID) {
      // Wait a bit for subscriptions to load, then check for pending ones
      // Check multiple times to catch subscriptions that are still processing
      const timer1 = setTimeout(() => {
        checkAndFinalizePendingSubscriptions(abortController.signal);
      }, 3000); // Wait 3 seconds after page load to allow webhook to process

      const timer2 = setTimeout(() => {
        checkAndFinalizePendingSubscriptions(abortController.signal);
      }, 8000); // Check again after 8 seconds

      const timer3 = setTimeout(() => {
        checkAndFinalizePendingSubscriptions(abortController.signal);
      }, 15000); // Final check after 15 seconds

      return () => {
        abortController.abort();
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }

    return () => {
      abortController.abort();
    };
  }, [selectedStudentId, studentData?.student?.wdt_ID]);

  // Also check when subscription packages are loaded (in case they load after student data)
  useEffect(() => {
    const abortController = new AbortController();

    if (
      selectedStudentId &&
      studentData?.student?.wdt_ID &&
      subscriptionPackages.length > 0
    ) {
      // Check for pending subscriptions after packages are loaded
      const timer = setTimeout(() => {
        checkAndFinalizePendingSubscriptions(abortController.signal);
      }, 2000); // Wait 2 seconds after packages load

      return () => {
        abortController.abort();
        clearTimeout(timer);
      };
    }

    return () => {
      abortController.abort();
    };
  }, [
    subscriptionPackages.length,
    selectedStudentId,
    studentData?.student?.wdt_ID,
  ]);

  const loadSubscriptionPackages = async (
    studentIdParam?: number | null,
    abortSignal?: AbortSignal
  ): Promise<void> => {
    setLoadingPackages(true);
    // Capture the target studentId at the start to prevent race conditions
    // If studentIdParam is provided, use it; otherwise use selectedStudentId from state
    const targetStudentId = studentIdParam ?? selectedStudentId;
    // Also capture the current selectedStudentId to detect if it changes during fetch
    const initialSelectedStudentId = selectedStudentId;

    try {
      // Include studentId in the request to filter packages
      const studentIdQueryString = targetStudentId
        ? `?studentId=${targetStudentId}`
        : "";
      const response = await fetch(
        `/api/student/subscription-packages${studentIdQueryString}`,
        {
          signal: abortSignal,
          cache: "no-store", // Prevent caching - always fetch fresh data
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSubscriptionPackages(result.packages || []);
        }
      }
      // Also load active subscriptions for this student
      if (targetStudentId) {
        try {
          const subResponse = await fetch(
            `/api/student/subscriptions?studentId=${targetStudentId}`,
            { signal: abortSignal }
          );
          if (subResponse.ok) {
            const subResult = await subResponse.json();
            if (subResult.success && subResult.subscriptions) {
              // IMPORTANT: Check if selectedStudentId has changed while we were fetching
              // If targetStudentId was provided, check if it still matches current selectedStudentId
              // If no param was provided, check if selectedStudentId changed from initial value
              const shouldSkip = targetStudentId
                ? selectedStudentId !== null &&
                  selectedStudentId !== targetStudentId
                : selectedStudentId !== initialSelectedStudentId;

              if (shouldSkip) {
                return;
              }

              const activePackageIds = new Set<number>();
              const now = new Date();
              let foundActiveSubscription: any = null;
              let foundCancelledSubscription: any = null;

              subResult.subscriptions.forEach((sub: any) => {
                // Check if subscription is not expired
                const isNotExpired = sub.endDate && new Date(sub.endDate) > now;

                if (isNotExpired && sub.packageId) {
                  // packageId might be string, convert to number
                  const pkgId =
                    typeof sub.packageId === "string"
                      ? parseInt(sub.packageId, 10)
                      : sub.packageId;
                  if (!isNaN(pkgId)) {
                    activePackageIds.add(pkgId);

                    // Store subscriptions - prioritize ACTIVE over cancelled
                    // This ensures that after resubscription, the new active subscription is shown
                    if (sub.status === "active") {
                      // Always prioritize active subscriptions (including resubscriptions)
                      if (!foundActiveSubscription) {
                        foundActiveSubscription = sub;
                      } else {
                        // If we already have an active subscription, use the most recent one
                        const existingDate = new Date(
                          foundActiveSubscription.createdAt ||
                            foundActiveSubscription.startDate ||
                            0
                        );
                        const newDate = new Date(
                          sub.createdAt || sub.startDate || 0
                        );
                        if (newDate > existingDate) {
                          foundActiveSubscription = sub;
                        }
                      }
                    } else if (
                      sub.status === "cancelled" &&
                      !foundCancelledSubscription
                    ) {
                      // Only store cancelled if we don't have an active one
                      foundCancelledSubscription = sub;
                    }
                  }
                }
              });

              // CRITICAL: Only use cancelled subscription if NO active subscription exists
              // This ensures that after resubscription, the new active subscription takes priority
              // Active subscriptions (including resubscriptions) always take priority over cancelled ones
              if (!foundActiveSubscription && foundCancelledSubscription) {
                foundActiveSubscription = foundCancelledSubscription;
              }

              // Store current subscription details for upgrade and cancel
              if (foundActiveSubscription) {
                const subId =
                  typeof foundActiveSubscription.id === "string"
                    ? parseInt(foundActiveSubscription.id, 10)
                    : foundActiveSubscription.id;
                const pkgId =
                  typeof foundActiveSubscription.packageId === "string"
                    ? parseInt(foundActiveSubscription.packageId, 10)
                    : foundActiveSubscription.packageId;

                if (!isNaN(subId)) {
                  setCurrentSubscriptionId(subId);
                }
                if (!isNaN(pkgId)) {
                  setCurrentSubscriptionPackageId(pkgId);
                }

                // Store full subscription details for cancel modal
                // Handle both direct package object and nested package
                const packageName =
                  foundActiveSubscription.package?.name ||
                  (typeof foundActiveSubscription.package === "string"
                    ? foundActiveSubscription.package
                    : "Unknown Package");

                // IMPORTANT: Always use the status from the API response
                // The API should return the correct status from the database
                // On page reload, currentSubscriptionDetails is null, so we rely on API status
                const apiStatus = foundActiveSubscription.status || "active";

                // Debug logging
                console.log(
                  "[Subscription Status] API Status:",
                  apiStatus,
                  "Subscription ID:",
                  subId
                );
                console.log("[Subscription Status] Found Subscription:", {
                  id: foundActiveSubscription.id,
                  status: foundActiveSubscription.status,
                  endDate: foundActiveSubscription.endDate,
                });

                // Use API status directly - it should be correct from the database
                // IMPORTANT: Active status always takes priority over cancelled
                // This ensures resubscriptions are immediately reflected
                let finalStatus =
                  apiStatus === "cancelled" ? "cancelled" : apiStatus;

                // Only preserve cancelled if we just cancelled it AND there's no newer active subscription
                // If there's a newer active subscription (resubscription), use that instead
                if (
                  currentSubscriptionDetails &&
                  currentSubscriptionDetails.status === "cancelled" &&
                  currentSubscriptionDetails.id === subId &&
                  finalStatus !== "cancelled"
                ) {
                  // Check if this is the same subscription ID - if so, use API status (might be resubscribed)
                  // If API says active, it means user resubscribed - use active status
                  if (apiStatus === "active") {
                    finalStatus = "active";
                    console.log(
                      "[Subscription Status] Resubscription detected - using active status from API"
                    );
                  } else {
                  // We just cancelled it but API hasn't updated yet - preserve cancelled status
                  finalStatus = "cancelled";
                  console.log(
                    "[Subscription Status] Preserving cancelled status from currentSubscriptionDetails"
                  );
                  }
                }

                console.log("[Subscription Status] Final Status:", finalStatus);

                // IMPORTANT: createdAt must be the ORIGINAL subscription creation date
                // This is critical for proration calculations after upgrades
                // After an upgrade, startDate changes but createdAt should remain the original
                const subscriptionCreatedAt =
                  foundActiveSubscription.createdAt ||
                  foundActiveSubscription.startDate ||
                  new Date().toISOString();

                const subscriptionStartDate =
                  foundActiveSubscription.startDate ||
                  foundActiveSubscription.createdAt ||
                  new Date().toISOString();

                console.log(
                  "[Load Subscriptions] Setting subscription details:",
                  {
                    subscriptionId: subId,
                    createdAt: subscriptionCreatedAt,
                    startDate: subscriptionStartDate,
                    status: finalStatus,
                    packageId: pkgId,
                    packageName: packageName,
                  }
                );

                setCurrentSubscriptionDetails({
                  id: subId,
                  packageName: packageName,
                  startDate: subscriptionStartDate,
                  endDate:
                    foundActiveSubscription.endDate || new Date().toISOString(),
                  nextBillingDate:
                    foundActiveSubscription.nextBillingDate || null,
                  status: finalStatus,
                  createdAt: subscriptionCreatedAt, // Always use createdAt from API - this is the original creation date
                });
              } else {
                setCurrentSubscriptionId(null);
                setCurrentSubscriptionPackageId(null);
                setCurrentSubscriptionDetails(null);
              }

              // Final check before setting state
              const finalShouldSkip = targetStudentId
                ? selectedStudentId !== null &&
                  selectedStudentId !== targetStudentId
                : selectedStudentId !== initialSelectedStudentId;

              if (finalShouldSkip) {
                return;
              }

              setActiveSubscriptions(activePackageIds);
            } else {
              // No subscriptions found - clear the set for this student
              const finalShouldSkip = targetStudentId
                ? selectedStudentId !== null &&
                  selectedStudentId !== targetStudentId
                : selectedStudentId !== initialSelectedStudentId;

              if (finalShouldSkip) {
                return;
              }
              setActiveSubscriptions(new Set());
              setCurrentSubscriptionId(null);
              setCurrentSubscriptionPackageId(null);
              setCurrentSubscriptionDetails(null);
            }
          }
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") {
            return; // Request was aborted, ignore
          }
          // Silently handle errors - they're not critical for UI
        }
      } else {
        // No targetStudentId - clear subscriptions
        setActiveSubscriptions(new Set());
        setCurrentSubscriptionId(null);
        setCurrentSubscriptionPackageId(null);
        setCurrentSubscriptionDetails(null);
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Request was aborted, ignore
      }
      // Silently handle errors - they're not critical for UI
    } finally {
      setLoadingPackages(false);
    }
  };

  // Check for pending subscriptions and finalize them
  // This handles the case where payment links don't redirect to our return page
  const checkAndFinalizePendingSubscriptions = async (
    abortSignal?: AbortSignal
  ) => {
    if (!selectedStudentId || !studentData?.student?.wdt_ID) {
      return;
    }

    const studentId = selectedStudentId;

    try {
      let packageIdToCheck: number | null = null;

      // First, check if we have subscription metadata in sessionStorage (from payment link)
      if (typeof window !== "undefined") {
        const subscriptionMeta = sessionStorage.getItem("dk_subscription_meta");
        if (subscriptionMeta) {
          try {
            const meta = JSON.parse(subscriptionMeta);
            packageIdToCheck = meta.packageId;
          } catch (err) {
            // Silently handle parse errors
          }
        }
      }

      // If we have a specific packageId from sessionStorage, check that first
      if (packageIdToCheck) {
        console.log(
          "[MiniApp] Found packageId in sessionStorage, checking first:",
          {
            packageId: packageIdToCheck,
            studentId,
          }
        );

        const verifyResponse = await fetch(
          "/api/payments/stripe/verify-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: String(studentId),
              packageId: String(packageIdToCheck),
              // No sessionId - will find by metadata
            }),
            signal: abortSignal,
          }
        );

        console.log(
          "[MiniApp] verify-session response (from sessionStorage):",
          {
            status: verifyResponse.status,
            ok: verifyResponse.ok,
            packageId: packageIdToCheck,
          }
        );

        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json();
          console.log(
            "[MiniApp] verify-session result (from sessionStorage):",
            verifyResult
          );

          if (verifyResult.verified && verifyResult.finalized) {
            console.log(
              "[MiniApp] ✅ Subscription finalized from sessionStorage"
            );
            // Clear sessionStorage
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("dk_subscription_meta");
            }
            // Reload subscriptions to show updated status
            setTimeout(() => {
              loadSubscriptionPackages(studentId);
            }, 1000);
            return; // Success, no need to check other packages
          } else {
            console.log("[MiniApp] ⚠️ Subscription not finalized:", {
              verified: verifyResult.verified,
              finalized: verifyResult.finalized,
              message: verifyResult.message,
            });
          }
        } else {
          const errorText = await verifyResponse.text();
          console.error(
            "[MiniApp] verify-session failed (from sessionStorage):",
            {
              status: verifyResponse.status,
              error: errorText,
            }
          );
        }
      }

      // Also check all packages with payment links (webhook might have set packageId in metadata)
      // This handles cases where sessionStorage was cleared but subscription exists in Stripe
      if (subscriptionPackages.length > 0) {
        console.log(
          "[MiniApp] Checking all packages for pending subscriptions...",
          {
            studentId,
            packageCount: subscriptionPackages.length,
            packageIdToCheck,
          }
        );

        // Try each package with payment link to see if there's a pending subscription
        for (const pkg of subscriptionPackages) {
          if (abortSignal?.aborted) break;
          if (!pkg.paymentLink) continue; // Only check packages with payment links

          // Skip if we already checked this package from sessionStorage
          if (packageIdToCheck && pkg.id === packageIdToCheck) {
            console.log(
              "[MiniApp] Skipping package (already checked):",
              pkg.id
            );
            continue;
          }

          console.log("[MiniApp] Checking package for pending subscription:", {
            packageId: pkg.id,
            packageName: pkg.name,
          });

          try {
            const verifyResponse = await fetch(
              "/api/payments/stripe/verify-session",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  studentId: String(studentId),
                  packageId: String(pkg.id),
                  // No sessionId - will find by metadata
                }),
                signal: abortSignal,
              }
            );

            console.log("[MiniApp] verify-session response:", {
              packageId: pkg.id,
              status: verifyResponse.status,
              ok: verifyResponse.ok,
            });

            if (verifyResponse.ok) {
              const verifyResult = await verifyResponse.json();
              console.log("[MiniApp] verify-session result:", {
                packageId: pkg.id,
                verified: verifyResult.verified,
                finalized: verifyResult.finalized,
                message: verifyResult.message,
              });

              if (verifyResult.verified && verifyResult.finalized) {
                console.log(
                  "[MiniApp] ✅ Successfully finalized pending subscription:",
                  {
                    packageId: pkg.id,
                    subscription: verifyResult.subscription,
                  }
                );

                // Clear sessionStorage if it exists
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem("dk_subscription_meta");
                }
                // Reload subscriptions to show updated status (including resubscription)
                setTimeout(() => {
                  loadSubscriptionPackages(studentId);
                  // Also reload student data to get latest subscription status
                  loadStudentData(true);
                }, 1000);
                break; // Only finalize one at a time
              } else if (verifyResult.verified && !verifyResult.finalized) {
                console.log(
                  "[MiniApp] ⚠️ Subscription verified but not finalized:",
                  {
                    packageId: pkg.id,
                    reason: verifyResult.message || verifyResult.error,
                  }
                );
              }
            } else {
              const errorText = await verifyResponse.text();
              console.error("[MiniApp] verify-session failed:", {
                packageId: pkg.id,
                status: verifyResponse.status,
                error: errorText,
              });
            }
          } catch (err: any) {
            if (err instanceof Error && err.name === "AbortError") {
              console.log("[MiniApp] Request aborted, stopping check");
              break; // Request was aborted, stop checking
            }
            console.error(
              "[MiniApp] Error checking for pending subscription:",
              {
                packageId: pkg.id,
                error: err,
              }
            );
          }
        }

        console.log(
          "[MiniApp] Finished checking all packages for pending subscriptions"
        );
      }
    } catch (err: any) {
      if (err instanceof Error && err.name === "AbortError") {
        return; // Request was aborted, ignore
      }
      // Silently handle errors
    }
  };

  const loadStudentsList = async () => {
    setInternalLoadingStudents(true);
    setError("");

    try {
      const response = await fetch(
        `/api/student/mini-app/${params.chatId}?list=true`
      );
      const data = await response.json();

      if (data.success) {
        const studentsList = data.students || [];
        setInternalStudents(studentsList);
        // Auto-select if only one student (and not already selected externally)
        if (studentsList.length === 1 && !externalSelectedStudentId) {
          setSelectedStudentId(studentsList[0].id);
        }
      } else {
        setError(data.error || "Failed to load students");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setInternalLoadingStudents(false);
    }
  };

  const loadStudentData = async (isRefresh = false) => {
    if (!selectedStudentId) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch(
        `/api/student/mini-app/${params.chatId}?studentId=${selectedStudentId}`
      );
      const data = await response.json();

      if (data.success) {
        setStudentData(data.data);
      } else {
        setError(data.error || "Failed to load data");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadStudentData(true);
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

  // Listen for bottom nav tab changes
  useEffect(() => {
    const handler = (e: any) => {
      if (e?.detail) {
        setCurrentTab(e.detail);
        setShowContentSection(true);
      }
    };
    window.addEventListener("dk:setTab", handler);
    return () => window.removeEventListener("dk:setTab", handler);
  }, []);

  const handleBackFromContent = () => {
    // Go back to overview
    setCurrentTab("overview");
    setShowContentSection(true);
    window.dispatchEvent(new CustomEvent("dk:setTab", { detail: "overview" }));
  };

  // Apply Telegram theme to document root as CSS variables
  const applyThemeToDocument = (params: ThemeParams) => {
    const root = document.documentElement;

    if (params.bg_color) {
      root.style.setProperty("--tg-theme-bg-color", params.bg_color);
    }
    if (params.text_color) {
      root.style.setProperty("--tg-theme-text-color", params.text_color);
    }
    if (params.hint_color) {
      root.style.setProperty("--tg-theme-hint-color", params.hint_color);
    }
    if (params.link_color) {
      root.style.setProperty("--tg-theme-link-color", params.link_color);
    }
    if (params.button_color) {
      root.style.setProperty("--tg-theme-button-color", params.button_color);
    }
    if (params.button_text_color) {
      root.style.setProperty(
        "--tg-theme-button-text-color",
        params.button_text_color
      );
    }
    if (params.secondary_bg_color) {
      root.style.setProperty(
        "--tg-theme-secondary-bg-color",
        params.secondary_bg_color
      );
    }
    if (params.header_bg_color) {
      root.style.setProperty(
        "--tg-theme-header-bg-color",
        params.header_bg_color
      );
    }
    if (params.bottom_bar_bg_color) {
      root.style.setProperty(
        "--tg-theme-bottom-bar-bg-color",
        params.bottom_bar_bg_color
      );
    }
    if (params.accent_text_color) {
      root.style.setProperty(
        "--tg-theme-accent-text-color",
        params.accent_text_color
      );
    }
    if (params.section_bg_color) {
      root.style.setProperty(
        "--tg-theme-section-bg-color",
        params.section_bg_color
      );
    }
    if (params.section_header_text_color) {
      root.style.setProperty(
        "--tg-theme-section-header-text-color",
        params.section_header_text_color
      );
    }
    if (params.section_separator_color) {
      root.style.setProperty(
        "--tg-theme-section-separator-color",
        params.section_separator_color
      );
    }
    if (params.subtitle_text_color) {
      root.style.setProperty(
        "--tg-theme-subtitle-text-color",
        params.subtitle_text_color
      );
    }
    if (params.destructive_text_color) {
      root.style.setProperty(
        "--tg-theme-destructive-text-color",
        params.destructive_text_color
      );
    }
  };

  // Initialize Telegram WebApp
  useEffect(() => {
    try {
      const tg = (window as any)?.Telegram?.WebApp as
        | TelegramWebApp
        | undefined;
      if (tg) {
        tg.ready?.();
        setTgWebApp(tg);

        // Initialize state from WebApp
        setIsFullscreen(!!tg.isFullscreen);
        setIsActive(!!tg.isActive);

        // Initialize safe area insets
        if (tg.safeAreaInset) {
          setSafeAreaInset(tg.safeAreaInset);
        }
        if (tg.contentSafeAreaInset) {
          setContentSafeAreaInset(tg.contentSafeAreaInset);
        }

        // Initialize theme params
        if (tg.themeParams) {
          setThemeParams(tg.themeParams);
          applyThemeToDocument(tg.themeParams);
        }

        // Event handlers
        const handleActivated = () => setIsActive(true);
        const handleDeactivated = () => setIsActive(false);
        const handleSafeAreaChanged = () => {
          if (tg.safeAreaInset) setSafeAreaInset(tg.safeAreaInset);
        };
        const handleContentSafeAreaChanged = () => {
          if (tg.contentSafeAreaInset)
            setContentSafeAreaInset(tg.contentSafeAreaInset);
        };
        const handleFullscreenChanged = () => {
          setIsFullscreen(!!tg.isFullscreen);
        };
        const handleFullscreenFailed = () => {
          setIsFullscreen(false);
        };
        const handleThemeChanged = () => {
          if (tg.themeParams) {
            setThemeParams(tg.themeParams);
            applyThemeToDocument(tg.themeParams);
          }
        };

        // Subscribe to events
        if (tg.onEvent) {
          tg.onEvent("activated", handleActivated);
          tg.onEvent("deactivated", handleDeactivated);
          tg.onEvent("safeAreaChanged", handleSafeAreaChanged);
          tg.onEvent("contentSafeAreaChanged", handleContentSafeAreaChanged);
          tg.onEvent("fullscreenChanged", handleFullscreenChanged);
          tg.onEvent("fullscreenFailed", handleFullscreenFailed);
          tg.onEvent("themeChanged", handleThemeChanged);
        }

        // Cleanup
        return () => {
          if (tg.offEvent) {
            tg.offEvent("activated", handleActivated);
            tg.offEvent("deactivated", handleDeactivated);
            tg.offEvent("safeAreaChanged", handleSafeAreaChanged);
            tg.offEvent("contentSafeAreaChanged", handleContentSafeAreaChanged);
            tg.offEvent("fullscreenChanged", handleFullscreenChanged);
            tg.offEvent("fullscreenFailed", handleFullscreenFailed);
            tg.offEvent("themeChanged", handleThemeChanged);
          }
        };
      }
    } catch (error) {
      // Silently handle initialization errors
    }
  }, []);

  // Fullscreen functions
  const handleRequestFullscreen = () => {
    if (tgWebApp?.requestFullscreen) {
      tgWebApp.requestFullscreen();
    }
  };

  const handleExitFullscreen = () => {
    if (tgWebApp?.exitFullscreen) {
      tgWebApp.exitFullscreen();
    }
  };

  const goBack = () => {
    // In a real app, this would navigate back
    window.history.back();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Convert day package abbreviations to readable format with translations
  const formatDayPackage = (dayPackage: string) => {
    const packageMap: { [key: string]: string } = {
      MWF: t("mwf"),
      TTS: t("tts"),
      "All days": t("allDays"),
      "All Days": t("allDays"),
      Sunday: t("sundayOnly"),
    };

    // Return mapped value or original if not found
    return packageMap[dayPackage] || dayPackage;
  };

  // Format currency helper
  const formatCurrencyValue = (amount: number, currency?: string | null) => {
    // Use provided currency, or fallback to student's currency, or default to ETB
    const getCurrency = (curr: string | null | undefined): string => {
      if (!curr || typeof curr !== "string") return "";
      const trimmed = curr.trim();
      return trimmed !== "" ? trimmed.toUpperCase() : "";
    };

    const providedCurrency = getCurrency(currency);
    const studentCurrency = getCurrency(studentData?.student?.classfeeCurrency);
    const curr = providedCurrency || studentCurrency || "ETB";

    const symbol =
      curr === "USD"
        ? "$"
        : curr === "EUR"
        ? "€"
        : curr === "GBP"
        ? "£"
        : "ETB ";
    return `${symbol}${amount.toLocaleString()}`;
  };

  const safeHexToRgb = (color?: string | null) => {
    if (!color || typeof color !== "string") return null;
    let hex = color.trim();
    if (!hex.startsWith("#")) return null;
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((char) => char + char)
        .join("");
    }
    if (hex.length !== 6) return null;
    const bigint = parseInt(hex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
  };

  const withAlpha = (color: string, alpha: number) => {
    const rgb = safeHexToRgb(color);
    if (!rgb) {
      // Fallback: assume color already includes alpha or is named color
      return color;
    }
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  };

  const getThemeAccentColor = (
    fallbackLight = "#3b82f6",
    fallbackDark = "#60a5fa"
  ) => {
    return (
      themeParams.button_color ||
      themeParams.accent_text_color ||
      (isDarkMode ? fallbackDark : fallbackLight)
    );
  };

  const getThemeSurfaceColor = (
    fallbackLight = "#ffffff",
    fallbackDark = "#1f2937"
  ) => {
    return (
      themeParams.section_bg_color ||
      themeParams.secondary_bg_color ||
      themeParams.bg_color ||
      (isDarkMode ? fallbackDark : fallbackLight)
    );
  };

  const getThemeGradient = (alphaStart = 0.18, alphaEnd = 0.05) => {
    const accent = getThemeAccentColor();
    const start = withAlpha(accent, alphaStart);
    const end = withAlpha(accent, alphaEnd);
    return `linear-gradient(135deg, ${start} 0%, ${end} 100%)`;
  };

  // Handle deposit amount input
  const handleDepositAmountInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    setDepositAmount(cleaned);
  };

  // Calculate unpaid months for payment summary
  const calculateUnpaidMonths = () => {
    if (!studentData?.payments?.monthlyPayments || !studentData?.student)
      return [];

    const monthlyFee = Number(studentData.student.classfee) || 0;
    const unpaidMonths: Array<{
      month: string;
      monthName: string;
      amount: number;
      status: string;
      isPartial: boolean;
      paidAmount?: number;
    }> = [];

    studentData.payments.monthlyPayments.forEach((payment: any) => {
      const isPaid = payment.status === "Paid";
      const isFree = payment.isFreeMonth;
      const isPartial =
        payment.type === "partial" || payment.type === "prizepartial";
      const paidAmount = payment.amount || 0;
      const remainingAmount = monthlyFee - paidAmount;

      if (!isPaid && !isFree) {
        const monthDate = new Date(payment.month + "-01");
        const monthName = monthDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });

        unpaidMonths.push({
          month: payment.month,
          monthName,
          amount: isPartial ? remainingAmount : monthlyFee,
          status: payment.status || "Unpaid",
          isPartial,
          paidAmount: isPartial ? paidAmount : undefined,
        });
      }
    });

    // Sort by month (oldest first)
    unpaidMonths.sort((a, b) => a.month.localeCompare(b.month));

    return unpaidMonths;
  };

  // Handle showing payment summary before checkout
  const handleShowPaymentSummary = () => {
    if (!studentData || !depositAmount) return;

    const amount = parseFloat(depositAmount.replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert(
        t("invalidDepositAmount") ||
          "Enter a valid deposit amount greater than zero."
      );
      return;
    }

    // Calculate unpaid months
    const unpaid = calculateUnpaidMonths();
    setUnpaidMonthsData(unpaid);
    setPendingPaymentAmount(amount);
    setTermsAccepted(false); // Reset terms agreement when opening modal
    setShowPaymentSummaryModal(true);
  };

  // Handle deposit payment initiation (after summary confirmation)
  const handleInitiateDeposit = async () => {
    if (!studentData || !pendingPaymentAmount) return;

    setShowPaymentSummaryModal(false);
    setCheckoutLoading(true);
    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: params.chatId,
          studentId: studentData.student.wdt_ID, // Always include studentId to prevent wrong attribution
          provider:
            studentData.student.classfeeCurrency === "ETB" ? "chapa" : "stripe",
          amount: pendingPaymentAmount,
          currency: studentData.student.classfeeCurrency,
          mode: "deposit",
        }),
      });

      const result = await response.json();
      if (result.success && result.checkoutUrl) {
        // Store checkout metadata
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "dk_checkout_meta",
            JSON.stringify({
              txRef: result.txRef,
              studentId: studentData.student.wdt_ID,
              chatId: params.chatId,
            })
          );
        }
        // Open payment URL
        if (tgWebApp?.openLink) {
          tgWebApp.openLink(result.checkoutUrl);
        } else if (typeof window !== "undefined") {
          window.open(result.checkoutUrl, "_blank");
        }
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("success");
        }
      } else {
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("error");
        }
        alert(
          result.error ||
            t("paymentInitFailed") ||
            "Unable to start payment. Please try again."
        );
      }
    } catch (err: any) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert(
        t("paymentGatewayError") ||
          "Payment gateway returned an error. Please check your payment details and try again."
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Handle subscription cancellation
  const handleCancel = async () => {
    if (!currentSubscriptionId) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert("Subscription information not available");
      return;
    }

    setCancelLoading(true);

    try {
      const response = await fetch(
        `/api/student/subscriptions/${currentSubscriptionId}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("success");
        }

        // Update status immediately in currentSubscriptionDetails
        // This ensures the UI updates instantly without waiting for reload
        if (currentSubscriptionDetails) {
          setCurrentSubscriptionDetails({
            ...currentSubscriptionDetails,
            status: "cancelled",
          });
        }

        // Close modal
        setShowCancelModal(false);

        // Don't reload at all - the status is already updated in state and database
        // The cancelled status will persist until page refresh, and on refresh it will
        // be correctly loaded from the database with status "cancelled"
        // Only reload if user manually refreshes or navigates away and back

        // Show success message
        alert(
          t("cancelSuccess") ||
            "Subscription will be cancelled at the end of the current period. You will continue to have access until then."
        );
      } else {
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("error");
        }
        alert(
          result.error || "Failed to cancel subscription. Please try again."
        );
      }
    } catch (err: any) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  // Handle subscription downgrade
  const handleDowngrade = async (pkg: (typeof subscriptionPackages)[0]) => {
    if (!currentSubscriptionId || !studentData?.student.wdt_ID) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert("Subscription information not available");
      return;
    }

    setDowngradeLoading(true);

    try {
      const response = await fetch(
        `/api/student/subscriptions/${currentSubscriptionId}/downgrade`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPackageId: pkg.id,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("success");
        }

        // Close modal
        setShowDowngradeModal(false);
        setSelectedDowngradePackage(null);

        // Reload subscription data
        setTimeout(() => {
          if (selectedStudentId) {
            loadSubscriptionPackages(selectedStudentId);
          }
        }, 1000);

        // Show success message with credit information
        let successMessage =
          result.message ||
          t("downgradeSuccess") ||
          "Your subscription has been downgraded successfully.";

        if (result.credit && result.credit.amount > 0) {
          successMessage = result.credit.message || successMessage;
        }

        alert(successMessage);
      } else {
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("error");
        }
        alert(
          result.error || "Failed to downgrade subscription. Please try again."
        );
      }
    } catch (err: any) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert("Failed to downgrade subscription. Please try again.");
    } finally {
      setDowngradeLoading(false);
    }
  };

  // Handle subscription upgrade
  const handleUpgrade = async (pkg: (typeof subscriptionPackages)[0]) => {
    if (!currentSubscriptionId || !studentData?.student.wdt_ID) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert("Subscription information not available");
      return;
    }

    setUpgradeLoading(true);

    try {
      const response = await fetch(
        `/api/student/subscriptions/${currentSubscriptionId}/upgrade`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newPackageId: pkg.id,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("success");
        }

        // Close modal immediately
        setShowUpgradeModal(false);
        setSelectedUpgradePackage(null);

        // Clear current subscription details to force reload
        setCurrentSubscriptionDetails(null);
        setCurrentSubscriptionId(null);
        setCurrentSubscriptionPackageId(null);

        // Reload subscriptions immediately and wait for it to complete
        // This ensures the proration calculation uses the correct createdAt date
        if (selectedStudentId) {
          // Wait a bit for the database to be updated, then reload
          await new Promise((resolve) => setTimeout(resolve, 1500));
          await loadSubscriptionPackages(selectedStudentId);

          // Reload again after a short delay to ensure webhook has processed
          setTimeout(async () => {
            if (selectedStudentId) {
              await loadSubscriptionPackages(selectedStudentId);
            }
          }, 2000);
        }

        // Show success message
        alert(
          t("upgradeSuccess") ||
            "Subscription upgraded successfully! You will be charged immediately."
        );
      } else {
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("error");
        }
        alert(
          result.error || "Failed to upgrade subscription. Please try again."
        );
      }
    } catch (err: any) {
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert("Failed to upgrade subscription. Please try again.");
    } finally {
      setUpgradeLoading(false);
    }
  };

  // Handle subscription package click - Use payment link if available, otherwise dynamic checkout
  const handleSubscribe = async (pkg: (typeof subscriptionPackages)[0]) => {
    console.log("[handleSubscribe] Called", {
      packageId: pkg.id,
      packageName: pkg.name,
      studentId: studentData?.student.wdt_ID,
      hasStudentData: !!studentData,
    });

    if (!studentData?.student.wdt_ID) {
      console.error("[handleSubscribe] Student information not available");
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert("Student information not available");
      return;
    }

    console.log("[handleSubscribe] Setting checkoutLoading to true");
    setCheckoutLoading(true);

    try {
      console.log("[handleSubscribe] Package details:", {
        hasPaymentLink: !!pkg.paymentLink,
        paymentLink: pkg.paymentLink || "none",
        packageId: pkg.id,
        packageName: pkg.name,
      });

      // ALWAYS use dynamic checkout session to ensure metadata is included
      // This fixes the issue where payment links don't include studentId/packageId
      console.log("[Subscribe] Creating dynamic subscription checkout", {
          studentId: studentData.student.wdt_ID,
          packageId: pkg.id,
          packageName: pkg.name,
        });

        const response = await fetch("/api/payments/stripe/subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: studentData.student.wdt_ID,
            packageId: pkg.id,
          }),
        });

        console.log(
          "[Subscribe] API response status:",
          response.status,
          response.statusText
        );

        const result = await response.json();
        console.log("[Subscribe] API response data:", result);
      console.log("[Subscribe] Response check:", {
        ok: response.ok,
        status: response.status,
        hasSuccess: !!result.success,
        hasCheckoutUrl: !!result.checkoutUrl,
        checkoutUrl: result.checkoutUrl,
        resultKeys: Object.keys(result),
      });

        if (!response.ok) {
          console.error("[Subscribe] API error:", result);
          if (tgWebApp?.HapticFeedback?.notificationOccurred) {
            tgWebApp.HapticFeedback.notificationOccurred("error");
          }
          alert(
            result.error ||
              result.details ||
              `Error: ${response.status} ${response.statusText}. Unable to start subscription. Please try again.`
          );
          setCheckoutLoading(false);
          return;
        }

      // Check if we have a valid checkout URL
      if (!result.checkoutUrl) {
        console.error("[Subscribe] No checkout URL in response:", result);
        if (tgWebApp?.HapticFeedback?.notificationOccurred) {
          tgWebApp.HapticFeedback.notificationOccurred("error");
        }
        alert(
          "Checkout session was created but no URL was returned. Please try again or contact support."
        );
        setCheckoutLoading(false);
        return;
      }

        if (result.success && result.checkoutUrl) {
          console.log("[Subscribe] Checkout URL received:", result.checkoutUrl);
        console.log("[Subscribe] Telegram WebApp available:", {
          hasTgWebApp: !!tgWebApp,
          hasOpenLink: !!tgWebApp?.openLink,
          tgWebAppType: typeof tgWebApp,
        });

        // Store checkout metadata for return page (minimal - most data comes from webhook)
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "dk_checkout_meta",
              JSON.stringify({
                txRef: result.txRef,
                studentId: studentData.student.wdt_ID,
                chatId: params.chatId,
                packageId: pkg.id,
              })
            );
          console.log("[Subscribe] Stored checkout metadata in sessionStorage");
          }

        // Open checkout URL - try multiple methods
        console.log("[Subscribe] Attempting to open checkout URL...");
        let opened = false;

        // Method 1: Telegram WebApp openLink (preferred for Telegram)
          if (tgWebApp?.openLink) {
          try {
            console.log("[Subscribe] Trying Telegram WebApp openLink...");
            tgWebApp.openLink(result.checkoutUrl);
            opened = true;
            console.log("[Subscribe] ✅ Opened via Telegram WebApp openLink");
          } catch (openError) {
            console.error(
              "[Subscribe] Error opening via Telegram WebApp:",
              openError
            );
          }
        }

        // Method 2: window.location.href (works in all browsers, including Telegram)
        if (!opened && typeof window !== "undefined") {
          try {
            console.log("[Subscribe] Trying window.location.href...");
            window.location.href = result.checkoutUrl;
            opened = true;
            console.log("[Subscribe] ✅ Redirected via window.location.href");
          } catch (locationError) {
            console.error(
              "[Subscribe] Error redirecting via window.location:",
              locationError
            );
          }
        }

        // Method 3: window.open as fallback
        if (!opened && typeof window !== "undefined") {
          try {
            console.log("[Subscribe] Trying window.open as fallback...");
            const newWindow = window.open(result.checkoutUrl, "_blank");
            if (newWindow) {
              opened = true;
              console.log("[Subscribe] ✅ Opened via window.open");
          } else {
              console.warn(
                "[Subscribe] window.open returned null (popup blocked?)"
              );
            }
          } catch (openError) {
            console.error(
              "[Subscribe] Error opening via window.open:",
              openError
            );
          }
        }

        if (!opened) {
          console.error(
            "[Subscribe] ❌ Failed to open checkout URL - all methods failed"
            );
            alert(
            `Checkout URL created but cannot be opened automatically.\n\nPlease copy this URL and open it manually:\n\n${result.checkoutUrl}`
            );
          }

          if (tgWebApp?.HapticFeedback?.notificationOccurred) {
            tgWebApp.HapticFeedback.notificationOccurred("success");
          }

        // Don't set loading to false immediately - let the redirect happen
        // setCheckoutLoading(false);
        } else {
        console.error("[Subscribe] Invalid response format:", result);
        console.error(
          "[Subscribe] Expected: { success: true, checkoutUrl: '...' }"
        );
          if (tgWebApp?.HapticFeedback?.notificationOccurred) {
            tgWebApp.HapticFeedback.notificationOccurred("error");
          }
          alert(
            result.error ||
              result.details ||
            "Unable to start subscription. Invalid response from server."
          );
        setCheckoutLoading(false);
      }
    } catch (err: any) {
      console.error("[Subscribe] Error creating subscription checkout:", err);
      if (tgWebApp?.HapticFeedback?.notificationOccurred) {
        tgWebApp.HapticFeedback.notificationOccurred("error");
      }
      alert(
        `Failed to create subscription checkout: ${
          err.message || "Unknown error"
        }. Please try again.`
      );
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Get current month payment status
  const getCurrentMonthStatus = () => {
    if (!studentData?.payments?.monthlyPayments) return null;

    const currentDate = new Date();
    const currentMonth = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}`;

    const currentMonthPayment = studentData.payments.monthlyPayments.find(
      (p: any) => p.month === currentMonth
    );

    return currentMonthPayment;
  };

  // Generate colors for avatars
  const getAvatarColor = (index: number) => {
    const colors = [
      "rgba(59, 130, 246, 0.2)", // blue
      "rgba(236, 72, 153, 0.2)", // pink
      "rgba(34, 197, 94, 0.2)", // green
      "rgba(249, 115, 22, 0.2)", // orange
      "rgba(168, 85, 247, 0.2)", // purple
    ];
    return colors[index % colors.length];
  };

  const getAvatarBorderColor = (index: number) => {
    const colors = [
      "#2563eb", // blue
      "#ec4899", // pink
      "#22c55e", // green
      "#f97316", // orange
      "#a855f7", // purple
    ];
    return colors[index % colors.length];
  };

  // Show student selection screen if multiple students and none selected
  // OR if no student selected at all
  if (!selectedStudentId && !loadingStudents) {
    if (students.length > 1) {
      return (
        <StudentSelectionScreen
          students={students}
          onSelectStudent={(id) => setSelectedStudentId(id)}
          themeParams={themeParams}
          isDarkMode={isDarkMode}
          safeAreaInset={safeAreaInset}
          contentSafeAreaInset={contentSafeAreaInset}
          tgWebApp={tgWebApp}
        />
      );
    }
    // If only one student but not selected yet, auto-select it
    if (students.length === 1) {
      setSelectedStudentId(students[0].id);
      return null; // Will re-render with selected student
    }
  }

  if (loadingStudents || loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor:
            themeParams.bg_color || (isDarkMode ? "#111827" : "#f9fafb"),
          paddingLeft: `${contentSafeAreaInset.left || 0}px`,
          paddingRight: `${contentSafeAreaInset.right || 0}px`,
        }}
      >
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-20"
              style={{
                backgroundColor:
                  themeParams.button_color ||
                  themeParams.accent_text_color ||
                  "#3b82f6",
              }}
            />
            <div
              className="absolute inset-0 rounded-full animate-spin border-4 border-transparent"
              style={{
                borderTopColor:
                  themeParams.button_color ||
                  themeParams.accent_text_color ||
                  "#3b82f6",
                borderRightColor:
                  themeParams.button_color ||
                  themeParams.accent_text_color ||
                  "#3b82f6",
              }}
            />
          </div>
          <p
            className="text-lg font-semibold mb-2"
            style={{
              color:
                themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827"),
            }}
          >
            {t ? t("loadingProgress") : "Loading your progress..."}
          </p>
          <p
            className="text-sm"
            style={{
              color:
                themeParams.hint_color ||
                themeParams.subtitle_text_color ||
                (isDarkMode ? "#9ca3af" : "#6b7280"),
            }}
          >
            {t ? t("pleaseWait") : "Please wait a moment"}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor:
            themeParams.bg_color || (isDarkMode ? "#111827" : "#f9fafb"),
          paddingLeft: `${contentSafeAreaInset.left || 0}px`,
          paddingRight: `${contentSafeAreaInset.right || 0}px`,
        }}
      >
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
            style={{
              backgroundColor: themeParams.destructive_text_color
                ? `${themeParams.destructive_text_color}20`
                : "rgba(239, 68, 68, 0.1)",
            }}
          >
            <XCircle
              className="w-12 h-12"
              style={{
                color:
                  themeParams.destructive_text_color ||
                  (isDarkMode ? "#f87171" : "#ef4444"),
              }}
            />
          </div>
          <h2
            className="text-xl font-bold mb-3"
            style={{
              color:
                themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827"),
            }}
          >
            {t ? t("error") : "Error"}
          </h2>
          <p
            className="text-base mb-6"
            style={{
              color:
                themeParams.hint_color ||
                themeParams.subtitle_text_color ||
                (isDarkMode ? "#9ca3af" : "#6b7280"),
            }}
          >
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="py-3 px-6 rounded-xl font-semibold transition-all active:scale-95 shadow-md"
            style={{
              backgroundColor:
                themeParams.button_color ||
                themeParams.accent_text_color ||
                "#3b82f6",
              color:
                themeParams.button_text_color ||
                (isDarkMode ? "#ffffff" : "#ffffff"),
            }}
          >
            {t ? t("retry") : "Try Again"}
          </button>
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor:
            themeParams.bg_color || (isDarkMode ? "#111827" : "#f9fafb"),
          paddingLeft: `${contentSafeAreaInset.left || 0}px`,
          paddingRight: `${contentSafeAreaInset.right || 0}px`,
        }}
      >
        <div className="text-center max-w-md">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg"
            style={{
              backgroundColor:
                themeParams.secondary_bg_color ||
                (isDarkMode ? "#374151" : "#f3f4f6"),
            }}
          >
            <Users
              className="w-12 h-12"
              style={{
                color:
                  themeParams.hint_color ||
                  themeParams.subtitle_text_color ||
                  (isDarkMode ? "#9ca3af" : "#6b7280"),
              }}
            />
          </div>
          <h2
            className="text-xl font-bold mb-3"
            style={{
              color:
                themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827"),
            }}
          >
            {t ? t("noDataTitle") : "No Data Found"}
          </h2>
          <p
            className="text-base"
            style={{
              color:
                themeParams.hint_color ||
                themeParams.subtitle_text_color ||
                (isDarkMode ? "#9ca3af" : "#6b7280"),
            }}
          >
            {t ? t("noDataSubtitle") : "Unable to load your progress data."}
          </p>
        </div>
      </div>
    );
  }

  // Calculate header padding using safe area insets - compact for more content space
  const headerPaddingTop = safeAreaInset.top > 0 ? safeAreaInset.top + 8 : 8;

  return (
    <div
      className="min-h-screen transition-all duration-300"
      style={{
        backgroundColor:
          themeParams.bg_color || (isDarkMode ? "#111827" : "#f9fafb"),
        color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827"),
        paddingTop: `${(safeAreaInset.top || 0) + 16}px`,
        paddingBottom: `${(safeAreaInset.bottom || 0) + 145}px`,
        paddingLeft: `${contentSafeAreaInset.left || 0}px`,
        paddingRight: `${contentSafeAreaInset.right || 0}px`,
      }}
    >
      {/* Integrated Bottom Header/Navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl border-t shadow-2xl"
        style={{
          backgroundColor:
            themeParams.bottom_bar_bg_color ||
            themeParams.header_bg_color ||
            (isDarkMode
              ? "rgba(17, 24, 39, 0.98)"
              : "rgba(255, 255, 255, 0.98)"),
          borderColor:
            themeParams.section_separator_color ||
            (isDarkMode ? "rgba(55, 65, 81, 0.6)" : "rgba(229, 231, 235, 0.6)"),
          paddingBottom: `${safeAreaInset.bottom || 8}px`,
          paddingLeft: `${safeAreaInset.left || 0}px`,
          paddingRight: `${safeAreaInset.right || 0}px`,
        }}
      >
        {/* Student Profile Bar */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center justify-between">
            {/* Student Avatar & Info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Avatar with multiple student indicator */}
              <button
                onClick={() => {
                  if (students.length > 1) {
                    if (tgWebApp?.HapticFeedback?.impactOccurred) {
                      tgWebApp.HapticFeedback.impactOccurred("light");
                    }
                    setSelectedStudentId(null);
                  }
                }}
                className="relative flex-shrink-0"
                disabled={students.length <= 1}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-lg border-3 transition-all active:scale-95 relative overflow-hidden"
                  style={{
                    backgroundColor:
                      students.length > 0
                        ? `${getAvatarBorderColor(
                            students.findIndex(
                              (s) => s.id === selectedStudentId
                            )
                          )}30`
                        : themeParams.button_color ||
                          themeParams.accent_text_color ||
                          "#3b82f6",
                    borderColor:
                      students.length > 0
                        ? getAvatarBorderColor(
                            students.findIndex(
                              (s) => s.id === selectedStudentId
                            )
                          )
                        : themeParams.button_color ||
                          themeParams.accent_text_color ||
                          "#3b82f6",
                    borderWidth: "3px",
                    color:
                      students.length > 0
                        ? getAvatarBorderColor(
                            students.findIndex(
                              (s) => s.id === selectedStudentId
                            )
                          )
                        : themeParams.button_text_color || "#ffffff",
                  }}
                >
                  <span className="relative z-10 font-extrabold">
                    {studentData?.student?.name?.charAt(0).toUpperCase() || "S"}
                  </span>
                  {/* Gradient shimmer */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      background:
                        students.length > 0
                          ? `radial-gradient(circle at 30% 30%, ${getAvatarBorderColor(
                              students.findIndex(
                                (s) => s.id === selectedStudentId
                              )
                            )} 0%, transparent 70%)`
                          : "radial-gradient(circle at 30% 30%, #3b82f6 0%, transparent 70%)",
                    }}
                  />
                </div>
                {students.length > 1 && (
                  <div
                    className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-lg border-2 animate-pulse"
                    style={{
                      backgroundColor:
                        themeParams.destructive_text_color || "#ef4444",
                      borderColor:
                        themeParams.bottom_bar_bg_color ||
                        (isDarkMode ? "#111827" : "#ffffff"),
                      color: "#ffffff",
                    }}
                  >
                    {students.length}
                  </div>
                )}
              </button>

              {/* Student Info */}
              <div className="flex-1 min-w-0">
                <h1
                  className="text-sm font-bold truncate"
                  style={{
                    color:
                      themeParams.text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  {studentData?.student?.name || "Dashboard"}
                </h1>
                <div className="flex items-center gap-2 text-[10px]">
                  <span
                    style={{
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {studentData?.student?.subject}
                  </span>
                  <span
                    style={{
                      color:
                        themeParams.hint_color ||
                        (isDarkMode ? "#4b5563" : "#d1d5db"),
                    }}
                  >
                    •
                  </span>
                  <span
                    className="font-semibold"
                    style={{
                      color: themeParams.accent_text_color || "#10b981",
                    }}
                  >
                    {formatCurrencyValue(
                      studentData?.student?.classfee || 0,
                      studentData?.student?.classfeeCurrency
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              {tgWebApp && (
                <button
                  onClick={
                    isFullscreen
                      ? handleExitFullscreen
                      : handleRequestFullscreen
                  }
                  className="p-2 rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor:
                      themeParams.secondary_bg_color ||
                      (isDarkMode
                        ? "rgba(55, 65, 81, 0.6)"
                        : "rgba(243, 244, 246, 0.9)"),
                    color:
                      themeParams.text_color ||
                      (isDarkMode ? "#ffffff" : "#374151"),
                  }}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              )}

              <button
                onClick={() =>
                  setLang ? setLang((lang === "en" ? "am" : "en") as any) : null
                }
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all active:scale-95"
                style={{
                  backgroundColor:
                    themeParams.secondary_bg_color ||
                    (isDarkMode
                      ? "rgba(55, 65, 81, 0.6)"
                      : "rgba(243, 244, 246, 0.9)"),
                  color:
                    themeParams.text_color ||
                    (isDarkMode ? "#e5e7eb" : "#374151"),
                }}
              >
                {lang === "en" ? "አማ" : "EN"}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Integrated */}
        <div className="px-2 pb-1">
          <div className="grid grid-cols-3 gap-1">
            {[
              {
                id: "overview",
                icon: Home,
                label: t ? t("overview") : "Overview",
              },
              {
                id: "terbia",
                icon: BookOpen,
                label: t ? t("terbia") : "Terbia",
              },
              {
                id: "attendance",
                icon: Calendar,
                label: t ? t("attendance") : "Attendance",
              },
              { id: "tests", icon: Trophy, label: t ? t("tests") : "Tests" },
              {
                id: "payments",
                icon: CreditCard,
                label: t ? t("payments") : "Payments",
              },
              {
                id: "schedule",
                icon: Clock,
                label: t ? t("schedule") : "Schedule",
              },
            ].map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    window.dispatchEvent(
                      new CustomEvent("dk:setTab", { detail: item.id })
                    );
                  }}
                  className="flex flex-col items-center py-2 rounded-xl transition-all active:scale-95"
                  style={{
                    backgroundColor: isActive
                      ? themeParams.button_color
                        ? `${themeParams.button_color}20`
                        : isDarkMode
                        ? "rgba(59, 130, 246, 0.2)"
                        : "rgba(59, 130, 246, 0.15)"
                      : "transparent",
                  }}
                >
                  <Icon
                    className="w-5 h-5 mb-0.5"
                    style={{
                      color: isActive
                        ? themeParams.button_color ||
                          themeParams.accent_text_color ||
                          "#3b82f6"
                        : themeParams.hint_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      strokeWidth: isActive ? 2.5 : 2,
                    }}
                  />
                  <span
                    className="text-[9px] font-semibold"
                    style={{
                      color: isActive
                        ? themeParams.button_color ||
                          themeParams.accent_text_color ||
                          "#3b82f6"
                        : themeParams.hint_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content - Scrollable from top */}
      <div className="px-3 py-4 pb-4">
        {/* Overview Tab - Show by default */}
        {currentTab === "overview" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Student Details Card */}
            <div
              className="relative overflow-hidden rounded-3xl p-5 shadow-lg"
              style={{
                background: themeParams.button_color
                  ? `linear-gradient(135deg, ${themeParams.button_color}25 0%, ${themeParams.button_color}08 100%)`
                  : isDarkMode
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.08) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.18) 0%, rgba(59, 130, 246, 0.05) 100%)",
                border: `1px solid ${
                  themeParams.section_separator_color ||
                  (isDarkMode
                    ? "rgba(59, 130, 246, 0.4)"
                    : "rgba(59, 130, 246, 0.25)")
                }`,
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-2.5">
                  {studentData.student.phoneno && (
                    <div className="flex items-center gap-2">
                      <Phone
                        className="w-4 h-4"
                        style={{
                          color:
                            themeParams.button_color ||
                            themeParams.accent_text_color ||
                            (isDarkMode ? "#60a5fa" : "#3b82f6"),
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        {studentData.student.phoneno}
                      </span>
                    </div>
                  )}
                  {studentData.student.country && (
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="w-4 h-4"
                        style={{
                          color:
                            themeParams.button_color ||
                            themeParams.accent_text_color ||
                            (isDarkMode ? "#60a5fa" : "#3b82f6"),
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        {studentData.student.country}
                      </span>
                    </div>
                  )}
                  {studentData.student.startdate && (
                    <div className="flex items-center gap-2">
                      <Calendar
                        className="w-4 h-4"
                        style={{
                          color:
                            themeParams.button_color ||
                            themeParams.accent_text_color ||
                            (isDarkMode ? "#60a5fa" : "#3b82f6"),
                        }}
                      />
                      <span
                        className="text-sm font-medium"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        Started{" "}
                        {new Date(
                          studentData.student.startdate
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                  {studentData.student.status && (
                    <div className="inline-flex">
                      <div
                        className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                        style={{
                          backgroundColor:
                            studentData.student.status.toLowerCase() ===
                            "active"
                              ? isDarkMode
                                ? "rgba(34, 197, 94, 0.25)"
                                : "rgba(34, 197, 94, 0.2)"
                              : isDarkMode
                              ? "rgba(249, 115, 22, 0.25)"
                              : "rgba(249, 115, 22, 0.2)",
                          color:
                            studentData.student.status.toLowerCase() ===
                            "active"
                              ? isDarkMode
                                ? "#22c55e"
                                : "#15803d"
                              : isDarkMode
                              ? "#f97316"
                              : "#ea580c",
                        }}
                      >
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        {studentData.student.status}
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl"
                  style={{
                    backgroundColor:
                      themeParams.button_color ||
                      themeParams.accent_text_color ||
                      "#3b82f6",
                    color: themeParams.button_text_color || "#ffffff",
                  }}
                >
                  <GraduationCap className="w-9 h-9" />
                </div>
              </div>
            </div>

            {/* Quick Access Grid - More detailed */}
            <div className="grid grid-cols-2 gap-3">
              {/* Attendance Card */}
              <button
                onClick={() => {
                  setCurrentTab("attendance");
                  window.dispatchEvent(
                    new CustomEvent("dk:setTab", { detail: "attendance" })
                  );
                }}
                className="p-4 rounded-2xl shadow-sm border text-left transition-all active:scale-95"
                style={{
                  backgroundColor:
                    themeParams.section_bg_color ||
                    themeParams.secondary_bg_color ||
                    (isDarkMode ? "#1f2937" : "#ffffff"),
                  borderColor:
                    themeParams.section_separator_color ||
                    (isDarkMode
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(34, 197, 94, 0.2)"),
                }}
              >
                <CheckCircle
                  className="w-8 h-8 mb-2"
                  style={{
                    color: isDarkMode ? "#22c55e" : "#16a34a",
                  }}
                />
                <div
                  className="text-2xl font-bold mb-1"
                  style={{
                    color:
                      themeParams.text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  {studentData.stats.attendancePercent}%
                </div>
                <div
                  className="text-xs font-medium mb-2"
                  style={{
                    color:
                      themeParams.hint_color ||
                      themeParams.subtitle_text_color ||
                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                  {t("attendanceRate")}
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px]">
                  <span
                    className="text-center font-semibold"
                    style={{
                      color: isDarkMode ? "#22c55e" : "#16a34a",
                    }}
                  >
                    {studentData.attendance.presentDays} {t("present")}
                  </span>
                  <span
                    className="text-center font-semibold"
                    style={{
                      color: isDarkMode ? "#3b82f6" : "#2563eb",
                    }}
                  >
                    {studentData.attendance.permissionDays} Perm
                  </span>
                  <span
                    className="text-center font-semibold"
                    style={{
                      color: isDarkMode ? "#ef4444" : "#dc2626",
                    }}
                  >
                    {studentData.attendance.absentDays} {t("absent")}
                  </span>
                </div>
              </button>

              {/* Tests Card */}
              <button
                onClick={() => {
                  setCurrentTab("tests");
                  window.dispatchEvent(
                    new CustomEvent("dk:setTab", { detail: "tests" })
                  );
                }}
                className="p-4 rounded-2xl shadow-sm border text-left transition-all active:scale-95"
                style={{
                  backgroundColor:
                    themeParams.section_bg_color ||
                    themeParams.secondary_bg_color ||
                    (isDarkMode ? "#1f2937" : "#ffffff"),
                  borderColor:
                    themeParams.section_separator_color ||
                    (isDarkMode
                      ? "rgba(168, 85, 247, 0.3)"
                      : "rgba(168, 85, 247, 0.2)"),
                }}
              >
                <Trophy
                  className="w-8 h-8 mb-2"
                  style={{
                    color: isDarkMode ? "#a855f7" : "#9333ea",
                  }}
                />
                <div
                  className="text-2xl font-bold mb-1"
                  style={{
                    color:
                      themeParams.text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  {studentData.stats.testsThisMonth}
                </div>
                <div
                  className="text-xs font-medium mb-2"
                  style={{
                    color:
                      themeParams.hint_color ||
                      themeParams.subtitle_text_color ||
                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                  {t("testsThisMonth")}
                </div>
                <div className="text-[10px]">
                  <span
                    style={{
                      color: isDarkMode ? "#a855f7" : "#9333ea",
                    }}
                  >
                    {studentData.recentTests.filter((t) => t.passed).length}{" "}
                    {t("passed")}
                  </span>
                </div>
              </button>

              {/* Zoom Sessions Card */}
              <button
                onClick={() => {
                  setCurrentTab("schedule");
                  window.dispatchEvent(
                    new CustomEvent("dk:setTab", { detail: "schedule" })
                  );
                }}
                className="p-4 rounded-2xl shadow-sm border text-left transition-all active:scale-95"
                style={{
                  backgroundColor:
                    themeParams.section_bg_color ||
                    themeParams.secondary_bg_color ||
                    (isDarkMode ? "#1f2937" : "#ffffff"),
                  borderColor:
                    themeParams.section_separator_color ||
                    (isDarkMode
                      ? "rgba(59, 130, 246, 0.3)"
                      : "rgba(59, 130, 246, 0.2)"),
                }}
              >
                <BarChart3
                  className="w-8 h-8 mb-2"
                  style={{
                    color: isDarkMode ? "#3b82f6" : "#2563eb",
                  }}
                />
                <div
                  className="text-2xl font-bold mb-1"
                  style={{
                    color:
                      themeParams.text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  {studentData.stats.totalZoomSessions}
                </div>
                <div
                  className="text-xs font-medium mb-2"
                  style={{
                    color:
                      themeParams.hint_color ||
                      themeParams.subtitle_text_color ||
                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                  {t("zoomSessions")}
                </div>
                <div className="text-[10px]">
                  <span
                    style={{
                      color: isDarkMode ? "#3b82f6" : "#2563eb",
                    }}
                  >
                    {t("last30Days")}
                  </span>
                </div>
              </button>

              {/* Payments Card */}
              <button
                onClick={() => {
                  setCurrentTab("payments");
                  window.dispatchEvent(
                    new CustomEvent("dk:setTab", { detail: "payments" })
                  );
                }}
                className="p-4 rounded-2xl shadow-sm border text-left transition-all active:scale-95"
                style={{
                  backgroundColor:
                    themeParams.section_bg_color ||
                    themeParams.secondary_bg_color ||
                    (isDarkMode ? "#1f2937" : "#ffffff"),
                  borderColor:
                    themeParams.section_separator_color ||
                    (isDarkMode
                      ? "rgba(239, 68, 68, 0.3)"
                      : "rgba(239, 68, 68, 0.2)"),
                }}
              >
                <CreditCard
                  className="w-8 h-8 mb-2"
                  style={{
                    color: isDarkMode ? "#ef4444" : "#dc2626",
                  }}
                />
                <div
                  className="text-xl font-bold mb-1"
                  style={{
                    color:
                      themeParams.text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  ${studentData.payments.summary.remainingBalance}
                </div>
                <div
                  className="text-xs font-medium mb-2"
                  style={{
                    color:
                      themeParams.hint_color ||
                      themeParams.subtitle_text_color ||
                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                  {t("balance")}
                </div>
                <div className="text-[10px]">
                  <span
                    style={{
                      color: isDarkMode ? "#10b981" : "#059669",
                    }}
                  >
                    {studentData.payments.summary.paidMonths} {t("monthsPaid")}
                  </span>
                </div>
              </button>
            </div>

            {/* Recent Activity Timeline */}
            <div
              className="p-5 rounded-2xl shadow-md border"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
                borderColor:
                  themeParams.section_separator_color ||
                  (isDarkMode
                    ? "rgba(55, 65, 81, 0.3)"
                    : "rgba(229, 231, 235, 0.5)"),
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-base font-bold flex items-center gap-2"
                  style={{
                    color:
                      themeParams.text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  <Activity className="w-5 h-5" />
                  {t("recentActivity")}
                </h3>
              </div>

              <div className="space-y-3">
                {/* Recent Test */}
                {studentData.recentTests[0] && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: studentData.recentTests[0].passed
                          ? isDarkMode
                            ? "rgba(34, 197, 94, 0.2)"
                            : "rgba(34, 197, 94, 0.15)"
                          : isDarkMode
                          ? "rgba(239, 68, 68, 0.2)"
                          : "rgba(239, 68, 68, 0.15)",
                      }}
                    >
                      {studentData.recentTests[0].passed ? (
                        <CheckCircle
                          className="w-5 h-5"
                          style={{
                            color: isDarkMode ? "#22c55e" : "#16a34a",
                          }}
                        />
                      ) : (
                        <XCircle
                          className="w-5 h-5"
                          style={{
                            color: isDarkMode ? "#ef4444" : "#dc2626",
                          }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        {studentData.recentTests[0].testName}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color:
                            themeParams.hint_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        Score: {studentData.recentTests[0].score}% •{" "}
                        {formatDate(studentData.recentTests[0].date)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recent Zoom Session */}
                {studentData.recentZoomSessions[0] && (
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
                        className="text-sm font-semibold"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        Zoom Session
                      </p>
                      <p
                        className="text-xs truncate"
                        style={{
                          color:
                            themeParams.hint_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {studentData.recentZoomSessions[0].teacher} •{" "}
                        {formatDate(studentData.recentZoomSessions[0].date)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Recent Attendance */}
                {studentData.attendance.thisMonth[0] && (
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor:
                          studentData.attendance.thisMonth[0].status ===
                          "present"
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
                            studentData.attendance.thisMonth[0].status ===
                            "present"
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
                        className="text-sm font-semibold"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        Attendance:{" "}
                        {studentData.attendance.thisMonth[0].status ===
                        "present"
                          ? "Present"
                          : "Absent"}
                      </p>
                      <p
                        className="text-xs"
                        style={{
                          color:
                            themeParams.hint_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {formatDate(studentData.attendance.thisMonth[0].date)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Teacher & Class Info Card */}
            <div
              className="p-5 rounded-2xl shadow-md border"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
                borderColor:
                  themeParams.section_separator_color ||
                  (isDarkMode
                    ? "rgba(55, 65, 81, 0.3)"
                    : "rgba(229, 231, 235, 0.5)"),
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    color:
                      themeParams.button_color ||
                      themeParams.accent_text_color ||
                      "#8b5cf6",
                  }}
                >
                  <User className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-xs font-medium mb-0.5"
                    style={{
                      color:
                        themeParams.hint_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {t("yourTeacher")}
                  </p>
                  <h3
                    className="text-base font-bold truncate"
                    style={{
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                    }}
                  >
                    {studentData.student.teacher}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor:
                      themeParams.secondary_bg_color ||
                      (isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.02)"),
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar
                      className="w-4 h-4"
                      style={{
                        color:
                          themeParams.accent_text_color ||
                          (isDarkMode ? "#3b82f6" : "#2563eb"),
                      }}
                    />
                    <p
                      className="text-[10px] font-medium"
                      style={{
                        color:
                          themeParams.hint_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    >
                      {t("scheduleLabel")}
                    </p>
                  </div>
                  <p
                    className="text-sm font-bold"
                    style={{
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                    }}
                  >
                    {formatDayPackage(studentData.student.daypackages)}
                  </p>
                </div>

                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor:
                      themeParams.secondary_bg_color ||
                      (isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.02)"),
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen
                      className="w-4 h-4"
                      style={{
                        color:
                          themeParams.accent_text_color ||
                          (isDarkMode ? "#f97316" : "#ea580c"),
                      }}
                    />
                    <p
                      className="text-[10px] font-medium"
                      style={{
                        color:
                          themeParams.hint_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    >
                      {t("packageLabel")}
                    </p>
                  </div>
                  <p
                    className="text-sm font-bold truncate"
                    style={{
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                    }}
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
            {/* Attendance Trend Chart */}
            <div
              className="p-5 rounded-2xl shadow-sm border"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
                borderColor:
                  themeParams.section_separator_color ||
                  (isDarkMode
                    ? "rgba(55, 65, 81, 0.3)"
                    : "rgba(229, 231, 235, 0.5)"),
              }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp
                  className="w-5 h-5"
                  style={{
                    color:
                      themeParams.accent_text_color ||
                      themeParams.button_color ||
                      (isDarkMode ? "#60a5fa" : "#3b82f6"),
                  }}
                />
                <h3
                  className="text-lg font-semibold"
                  style={{
                    color:
                      themeParams.text_color ||
                      themeParams.section_header_text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  Attendance Trend
                </h3>
              </div>

              {/* Visual Timeline */}
              <div className="space-y-3">
                {/* Days of the month */}
                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const now = new Date();
                    const year = now.getFullYear();
                    const month = now.getMonth();
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const firstDayOfWeek = new Date(year, month, 1).getDay();

                    // Create attendance map for quick lookup
                    const attendanceMap = new Map();
                    studentData.attendance.thisMonth.forEach((record) => {
                      const day = new Date(record.date).getDate();
                      attendanceMap.set(day, record.status);
                    });

                    const cells = [];

                    // Add day labels
                    const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
                    dayLabels.forEach((label, idx) => {
                      cells.push(
                        <div
                          key={`label-${idx}`}
                          className="text-center text-xs font-semibold pb-1"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                          }}
                        >
                          {label}
                        </div>
                      );
                    });

                    // Add empty cells for days before month starts
                    for (let i = 0; i < firstDayOfWeek; i++) {
                      cells.push(
                        <div key={`empty-${i}`} className="aspect-square" />
                      );
                    }

                    // Add cells for each day of the month
                    for (let day = 1; day <= daysInMonth; day++) {
                      const status = attendanceMap.get(day);
                      const isToday = day === now.getDate();

                      cells.push(
                        <div
                          key={`day-${day}`}
                          className="aspect-square rounded-lg flex items-center justify-center text-xs font-semibold transition-all border"
                          style={{
                            backgroundColor:
                              status === "present"
                                ? isDarkMode
                                  ? "rgba(34, 197, 94, 0.3)"
                                  : "rgba(34, 197, 94, 0.25)"
                                : status === "permission"
                                ? isDarkMode
                                  ? "rgba(59, 130, 246, 0.3)"
                                  : "rgba(59, 130, 246, 0.25)"
                                : status === "absent"
                                ? isDarkMode
                                  ? "rgba(239, 68, 68, 0.3)"
                                  : "rgba(239, 68, 68, 0.25)"
                                : isDarkMode
                                ? "rgba(55, 65, 81, 0.2)"
                                : "rgba(229, 231, 235, 0.3)",
                            borderColor: isToday
                              ? themeParams.button_color ||
                                (isDarkMode ? "#60a5fa" : "#3b82f6")
                              : "transparent",
                            borderWidth: isToday ? "2px" : "1px",
                            color: status
                              ? status === "present"
                                ? isDarkMode
                                  ? "#22c55e"
                                  : "#16a34a"
                                : status === "permission"
                                ? isDarkMode
                                  ? "#3b82f6"
                                  : "#2563eb"
                                : isDarkMode
                                ? "#ef4444"
                                : "#dc2626"
                              : themeParams.hint_color ||
                                (isDarkMode ? "#6b7280" : "#9ca3af"),
                          }}
                        >
                          {day}
                        </div>
                      );
                    }

                    return cells;
                  })()}
                </div>

                {/* Legend */}
                <div
                  className="flex items-center justify-center gap-4 pt-3 border-t"
                  style={{
                    borderColor:
                      themeParams.section_separator_color ||
                      (isDarkMode
                        ? "rgba(55, 65, 81, 0.3)"
                        : "rgba(229, 231, 235, 0.5)"),
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-3 h-3 rounded ${
                        isDarkMode ? "bg-green-400" : "bg-green-500"
                      }`}
                    />
                    <span
                      className="text-xs"
                      style={{
                        color:
                          themeParams.hint_color ||
                          (isDarkMode ? "#d1d5db" : "#4b5563"),
                      }}
                    >
                      Present
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-3 h-3 rounded ${
                        isDarkMode ? "bg-blue-400" : "bg-blue-500"
                      }`}
                    />
                    <span
                      className="text-xs"
                      style={{
                        color:
                          themeParams.hint_color ||
                          (isDarkMode ? "#d1d5db" : "#4b5563"),
                      }}
                    >
                      Permission
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-3 h-3 rounded ${
                        isDarkMode ? "bg-red-400" : "bg-red-500"
                      }`}
                    />
                    <span
                      className="text-xs"
                      style={{
                        color:
                          themeParams.hint_color ||
                          (isDarkMode ? "#d1d5db" : "#4b5563"),
                      }}
                    >
                      Absent
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Summary Card */}
            <div
              className="p-4 rounded-2xl shadow-sm border"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
                borderColor:
                  themeParams.section_separator_color ||
                  (isDarkMode
                    ? "rgba(55, 65, 81, 0.3)"
                    : "rgba(229, 231, 235, 0.5)"),
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-semibold"
                  style={{
                    color:
                      themeParams.text_color ||
                      themeParams.section_header_text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  {t("attendanceRecord")}
                </h3>
                <button
                  onClick={() => toggleSection("attendance")}
                  className="p-1"
                >
                  {expandedSections.attendance ? (
                    <ChevronUp
                      className="w-4 h-4"
                      style={{
                        color:
                          themeParams.hint_color ||
                          themeParams.subtitle_text_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    />
                  ) : (
                    <ChevronDown
                      className="w-4 h-4"
                      style={{
                        color:
                          themeParams.hint_color ||
                          themeParams.subtitle_text_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    />
                  )}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    {studentData.attendance.presentDays}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {t("present")}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    {studentData.attendance.permissionDays}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    Permission
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${
                      isDarkMode ? "text-red-400" : "text-red-600"
                    }`}
                  >
                    {studentData.attendance.absentDays}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {t("absent")}
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className="text-2xl font-bold"
                    style={{
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                    }}
                  >
                    {studentData.attendance.totalDays}
                  </div>
                  <div
                    className="text-xs"
                    style={{
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    Total
                  </div>
                </div>
              </div>

              {expandedSections.attendance && (
                <div className="space-y-3">
                  {studentData.attendance.thisMonth.map((day, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl border shadow-md transition-all hover:shadow-lg"
                      style={{
                        backgroundColor:
                          themeParams.section_bg_color ||
                          themeParams.secondary_bg_color ||
                          (isDarkMode ? "#1f2937" : "#ffffff"),
                        borderColor:
                          day.status === "present"
                            ? isDarkMode
                              ? "rgba(34, 197, 94, 0.4)"
                              : "rgba(34, 197, 94, 0.3)"
                            : day.status === "permission"
                            ? isDarkMode
                              ? "rgba(59, 130, 246, 0.4)"
                              : "rgba(59, 130, 246, 0.3)"
                            : isDarkMode
                            ? "rgba(239, 68, 68, 0.4)"
                            : "rgba(239, 68, 68, 0.3)",
                      }}
                    >
                      {/* Date and Status Row */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              day.status === "present"
                                ? isDarkMode
                                  ? "bg-green-400"
                                  : "bg-green-500"
                                : day.status === "permission"
                                ? isDarkMode
                                  ? "bg-blue-400"
                                  : "bg-blue-500"
                                : isDarkMode
                                ? "bg-red-400"
                                : "bg-red-500"
                            }`}
                          />
                          <div>
                            <span
                              className="text-sm font-bold"
                              style={{
                                color:
                                  themeParams.text_color ||
                                  (isDarkMode ? "#ffffff" : "#111827"),
                              }}
                            >
                              {formatDate(day.date)}
                            </span>
                            <div
                              className="text-xs"
                              style={{
                                color:
                                  themeParams.hint_color ||
                                  themeParams.subtitle_text_color ||
                                  (isDarkMode ? "#9ca3af" : "#6b7280"),
                              }}
                            >
                              {new Date(day.date).toLocaleDateString("en-US", {
                                weekday: "long",
                              })}
                            </div>
                          </div>
                        </div>
                        <div
                          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                          style={{
                            backgroundColor:
                              day.status === "present"
                                ? isDarkMode
                                  ? "rgba(34, 197, 94, 0.25)"
                                  : "rgba(34, 197, 94, 0.2)"
                                : day.status === "permission"
                                ? isDarkMode
                                  ? "rgba(59, 130, 246, 0.25)"
                                  : "rgba(59, 130, 246, 0.2)"
                                : isDarkMode
                                ? "rgba(239, 68, 68, 0.25)"
                                : "rgba(239, 68, 68, 0.2)",
                            color:
                              day.status === "present"
                                ? isDarkMode
                                  ? "#22c55e"
                                  : "#16a34a"
                                : day.status === "permission"
                                ? isDarkMode
                                  ? "#3b82f6"
                                  : "#2563eb"
                                : isDarkMode
                                ? "#ef4444"
                                : "#dc2626",
                          }}
                        >
                          {day.status === "present" ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              {t("present")}
                            </>
                          ) : day.status === "permission" ? (
                            <>
                              <Shield className="w-3.5 h-3.5" />
                              Permission
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" />
                              {t("absent")}
                            </>
                          )}
                        </div>
                      </div>

                      {/* Surah and Lesson Info - Only show for Present/Permission */}
                      {(day.status === "present" ||
                        day.status === "permission") &&
                        (day.surah || day.lesson) && (
                          <div
                            className="pt-3 border-t space-y-2"
                            style={{
                              borderColor:
                                themeParams.section_separator_color ||
                                (isDarkMode
                                  ? "rgba(55, 65, 81, 0.3)"
                                  : "rgba(229, 231, 235, 0.5)"),
                            }}
                          >
                            {day.surah && (
                              <div className="flex items-center gap-2">
                                <BookOpen
                                  className="w-4 h-4"
                                  style={{
                                    color:
                                      themeParams.accent_text_color ||
                                      (isDarkMode ? "#8b5cf6" : "#7c3aed"),
                                  }}
                                />
                                <div className="flex-1">
                                  <div
                                    className="text-[10px] font-medium"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    Surah
                                  </div>
                                  <div
                                    className="text-sm font-semibold"
                                    style={{
                                      color:
                                        themeParams.text_color ||
                                        (isDarkMode ? "#ffffff" : "#111827"),
                                    }}
                                  >
                                    {day.surah}
                                  </div>
                                </div>
                                {day.pagesRead && (
                                  <div
                                    className="px-2 py-1 rounded-lg text-xs font-bold"
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? "rgba(139, 92, 246, 0.2)"
                                        : "rgba(139, 92, 246, 0.15)",
                                      color: isDarkMode ? "#a78bfa" : "#7c3aed",
                                    }}
                                  >
                                    {day.pagesRead} pg
                                  </div>
                                )}
                              </div>
                            )}
                            {day.lesson && (
                              <div className="flex items-center gap-2">
                                <BookMarked
                                  className="w-4 h-4"
                                  style={{
                                    color:
                                      themeParams.button_color ||
                                      (isDarkMode ? "#60a5fa" : "#3b82f6"),
                                  }}
                                />
                                <div className="flex-1">
                                  <div
                                    className="text-[10px] font-medium"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    Lesson
                                  </div>
                                  <div
                                    className="text-sm font-semibold"
                                    style={{
                                      color:
                                        themeParams.text_color ||
                                        (isDarkMode ? "#ffffff" : "#111827"),
                                    }}
                                  >
                                    {day.lesson}
                                  </div>
                                </div>
                                {day.level && (
                                  <div
                                    className="px-2 py-1 rounded-lg text-xs font-bold"
                                    style={{
                                      backgroundColor: isDarkMode
                                        ? "rgba(59, 130, 246, 0.2)"
                                        : "rgba(59, 130, 246, 0.15)",
                                      color: isDarkMode ? "#60a5fa" : "#3b82f6",
                                    }}
                                  >
                                    {day.level}
                                  </div>
                                )}
                              </div>
                            )}
                            {day.notes && (
                              <div
                                className="mt-2 p-2 rounded-lg text-xs"
                                style={{
                                  backgroundColor: isDarkMode
                                    ? "rgba(255, 255, 255, 0.05)"
                                    : "rgba(0, 0, 0, 0.03)",
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#d1d5db" : "#4b5563"),
                                }}
                              >
                                💭 {day.notes}
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tests Tab */}
        {currentTab === "tests" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  themeParams.bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-semibold"
                  style={{
                    color:
                      themeParams.text_color ||
                      themeParams.section_header_text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  {t("testResults")}
                </h3>
                <button onClick={() => toggleSection("tests")} className="p-1">
                  {expandedSections.tests ? (
                    <ChevronUp
                      className={`w-4 h-4 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  ) : (
                    <ChevronDown
                      className={`w-4 h-4 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    />
                  )}
                </button>
              </div>

              {expandedSections.tests && (
                <div className="space-y-3">
                  {studentData.recentTests.map((test, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl shadow-sm border"
                      style={{
                        backgroundColor:
                          themeParams.section_bg_color ||
                          themeParams.secondary_bg_color ||
                          (isDarkMode ? "#1f2937" : "#ffffff"),
                        borderColor:
                          themeParams.section_separator_color ||
                          (isDarkMode
                            ? "rgba(55, 65, 81, 0.3)"
                            : "rgba(229, 231, 235, 0.5)"),
                      }}
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
                                isDarkMode ? "text-white" : "text-green-600"
                              }`}
                            />
                          ) : (
                            <XCircle
                              className={`w-4 h-4 ${
                                isDarkMode ? "text-white" : "text-red-600"
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <div
                            className="font-medium"
                            style={{
                              color:
                                themeParams.text_color ||
                                (isDarkMode ? "#ffffff" : "#111827"),
                            }}
                          >
                            {test.testName}
                          </div>
                          <div
                            className={`text-xs ${
                              themeParams.hint_color ||
                              themeParams.subtitle_text_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280")
                            }`}
                          >
                            {formatDate(test.date)}
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
                          {test.passed ? t("passed") : t("failed")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Terbia Tab */}
        {currentTab === "terbia" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div
              className="p-4 rounded-2xl"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  themeParams.bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className="text-lg font-semibold"
                  style={{
                    color:
                      themeParams.text_color ||
                      themeParams.section_header_text_color ||
                      (isDarkMode ? "#ffffff" : "#111827"),
                  }}
                >
                  {t("terbiaLearning")}
                </h3>
              </div>

              <div className="text-center py-4">
                <p
                  className="text-sm mb-5 font-medium"
                  style={{
                    color:
                      themeParams.hint_color ||
                      themeParams.subtitle_text_color ||
                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                  🎓 {t("startLearning")}
                </p>
                <Link
                  href={`https://t.me/Dkterbiabot?startapp=${studentData.student.wdt_ID}`}
                >
                  <button
                    className="relative w-full overflow-hidden rounded-2xl p-5 shadow-2xl transition-all active:scale-98 border-2 group block no-underline cursor-pointer"
                    style={{
                      background: themeParams.button_color
                        ? `linear-gradient(135deg, ${themeParams.button_color} 0%, ${themeParams.button_color}dd 100%)`
                        : "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                      borderColor: themeParams.button_color || "#fb923c",
                    }}
                  >
                    {/* Animated background effect */}
                    <div
                      className="absolute inset-0 opacity-20"
                      style={{
                        background:
                          "radial-gradient(circle at 80% 50%, white 0%, transparent 50%)",
                        animation: "pulse 2s ease-in-out infinite",
                      }}
                    />

                    <div className="relative z-10 flex items-center justify-center gap-3">
                      <div className="flex items-center justify-center">
                        <BookOpen
                          className="w-7 h-7 transition-transform group-active:rotate-12"
                          style={{
                            color: themeParams.button_text_color || "#ffffff",
                          }}
                        />
                      </div>
                      <div className="text-left">
                        <div
                          className="text-lg font-bold"
                          style={{
                            color: themeParams.button_text_color || "#ffffff",
                          }}
                        >
                          {t("launchTerbia")}
                        </div>
                        <div
                          className="text-xs opacity-90"
                          style={{
                            color: themeParams.button_text_color || "#ffffff",
                          }}
                        >
                          {t("beginCourses")}
                        </div>
                      </div>
                      <ChevronRight
                        className="w-6 h-6 ml-auto transition-transform group-active:translate-x-1"
                        style={{
                          color: themeParams.button_text_color || "#ffffff",
                        }}
                      />
                    </div>

                    {/* Sparkle effects */}
                    <div
                      className="absolute top-2 right-2"
                      style={{
                        color: themeParams.button_text_color || "#ffffff",
                        opacity: 0.6,
                      }}
                    >
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* Payments Tab - Professional UI */}
        {currentTab === "payments" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Professional Payment Statistics Dashboard */}
            {(() => {
              const payments = studentData?.payments;
              const totalDeposits = payments?.summary?.totalDeposits || 0;
              const totalMonthly = payments?.summary?.totalMonthlyPayments || 0;
              const creditBalance = payments?.summary?.creditBalance || 0; // Credit balance available
              // Remaining balance = deposits - monthly payments (credits are separate and will be applied to future payments)
              const remainingBalance = payments?.summary?.remainingBalance || 0;
              const paidMonths = payments?.summary?.paidMonths || 0;
              const unpaidMonths = payments?.summary?.unpaidMonths || 0;
              const totalMonths = paidMonths + unpaidMonths;
              const paymentProgress =
                totalMonths > 0 ? (paidMonths / totalMonths) * 100 : 0;
              const accent = getThemeAccentColor();

              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                  {/* Total Deposits Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2"
                    style={{
                      background: `linear-gradient(135deg, ${withAlpha(
                        accent,
                        0.15
                      )} 0%, ${withAlpha(accent, 0.08)} 100%)`,
                      borderColor: withAlpha(accent, 0.3),
                      boxShadow: `0 10px 30px -10px ${withAlpha(accent, 0.3)}`,
                    }}
                  >
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20"
                      style={{
                        background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Trophy
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{ color: accent }}
                        />
                        <span
                          className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                          }}
                        >
                          {t("totalDeposits")}
                        </span>
                      </div>
                      <div
                        className="text-xl sm:text-2xl font-extrabold mb-1"
                        style={{ color: accent }}
                      >
                        {formatCurrencyValue(
                          totalDeposits,
                          studentData?.student?.classfeeCurrency
                        )}
                      </div>
                      <div
                        className="text-[9px] sm:text-xs font-medium"
                        style={{
                          color:
                            themeParams.hint_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {payments?.deposits?.length || 0}{" "}
                        {t("transactions") || "transactions"}
                      </div>
                    </div>
                  </motion.div>

                  {/* Monthly Payments Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2"
                    style={{
                      background: `linear-gradient(135deg, ${withAlpha(
                        "#22c55e",
                        0.15
                      )} 0%, ${withAlpha("#22c55e", 0.08)} 100%)`,
                      borderColor: withAlpha("#22c55e", 0.3),
                      boxShadow: `0 10px 30px -10px ${withAlpha(
                        "#22c55e",
                        0.3
                      )}`,
                    }}
                  >
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20"
                      style={{
                        background: `radial-gradient(circle, #22c55e 0%, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{ color: "#22c55e" }}
                        />
                        <span
                          className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                          }}
                        >
                          {t("monthlyPayments")}
                        </span>
                      </div>
                      <div
                        className="text-xl sm:text-2xl font-extrabold mb-1"
                        style={{ color: "#22c55e" }}
                      >
                        {formatCurrencyValue(
                          totalMonthly,
                          studentData?.student?.classfeeCurrency
                        )}
                      </div>
                      <div
                        className="text-[9px] sm:text-xs font-medium"
                        style={{
                          color:
                            themeParams.hint_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {paidMonths} / {totalMonths} {t("months")}
                      </div>
                    </div>
                  </motion.div>

                  {/* Remaining Balance Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2"
                    style={{
                      background: `linear-gradient(135deg, ${withAlpha(
                        "#f59e0b",
                        0.15
                      )} 0%, ${withAlpha("#f59e0b", 0.08)} 100%)`,
                      borderColor: withAlpha("#f59e0b", 0.3),
                      boxShadow: `0 10px 30px -10px ${withAlpha(
                        "#f59e0b",
                        0.3
                      )}`,
                    }}
                  >
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20"
                      style={{
                        background: `radial-gradient(circle, #f59e0b 0%, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{ color: "#f59e0b" }}
                        />
                        <span
                          className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                          }}
                        >
                          {t("remainingBalance")}
                        </span>
                      </div>
                      <div
                        className="text-xl sm:text-2xl font-extrabold mb-1"
                        style={{ color: "#f59e0b" }}
                      >
                        {formatCurrencyValue(
                          remainingBalance,
                          studentData?.student?.classfeeCurrency
                        )}
                      </div>
                      <div
                        className="text-[9px] sm:text-xs font-medium"
                        style={{
                          color:
                            themeParams.hint_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {unpaidMonths} {t("unpaidMonths")}
                      </div>
                      {/* Show credit balance if available */}
                      {creditBalance > 0 && (
                        <div
                          className="mt-2 pt-2 border-t text-[9px] sm:text-xs font-semibold"
                          style={{
                            borderColor: withAlpha("#f59e0b", 0.2),
                            color: isDarkMode ? "#22c55e" : "#16a34a",
                          }}
                        >
                          +
                          {formatCurrencyValue(
                            creditBalance,
                            studentData?.student?.classfeeCurrency
                          )}{" "}
                          {t("creditAvailable") || "credit available"}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Payment Progress Card */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border-2"
                    style={{
                      background: `linear-gradient(135deg, ${withAlpha(
                        "#3b82f6",
                        0.15
                      )} 0%, ${withAlpha("#3b82f6", 0.08)} 100%)`,
                      borderColor: withAlpha("#3b82f6", 0.3),
                      boxShadow: `0 10px 30px -10px ${withAlpha(
                        "#3b82f6",
                        0.3
                      )}`,
                    }}
                  >
                    <div
                      className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20"
                      style={{
                        background: `radial-gradient(circle, #3b82f6 0%, transparent 70%)`,
                      }}
                    />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3
                          className="w-4 h-4 sm:w-5 sm:h-5"
                          style={{ color: "#3b82f6" }}
                        />
                        <span
                          className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                          }}
                        >
                          {t("paymentProgress") || "Progress"}
                        </span>
                      </div>
                      <div
                        className="text-xl sm:text-2xl font-extrabold mb-2"
                        style={{ color: "#3b82f6" }}
                      >
                        {Math.round(paymentProgress)}%
                      </div>
                      <div
                        className="relative h-2 rounded-full overflow-hidden"
                        style={{
                          backgroundColor: withAlpha("#3b82f6", 0.1),
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${paymentProgress}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)`,
                            boxShadow: `0 0 10px ${withAlpha("#3b82f6", 0.5)}`,
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })()}

            {/* Current Month Status Banner */}
            {(() => {
              const currentMonthPayment = getCurrentMonthStatus();

              // Handle case when no current month payment exists
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
                    {/* Animated background */}
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
                            color: isDarkMode ? "#f59e0b" : "#d97706",
                          }}
                        >
                          <HelpCircle className="w-10 h-10" />
                        </div>
                        <div className="flex-1">
                          <h3
                            className="text-lg font-bold mb-1"
                            style={{
                              color:
                                themeParams.text_color ||
                                (isDarkMode ? "#ffffff" : "#111827"),
                            }}
                          >
                            {t("paymentStatus")}
                          </h3>
                          <p
                            className="text-sm font-medium mb-3"
                            style={{
                              color:
                                themeParams.hint_color ||
                                (isDarkMode ? "#d1d5db" : "#4b5563"),
                            }}
                          >
                            {t("noPaymentRecord")}
                          </p>

                          {/* Current month details */}
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
                                className="text-[10px] font-medium mb-0.5"
                                style={{
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                {t("monthlyFee")}
                              </p>
                              <p
                                className="text-base font-bold"
                                style={{
                                  color:
                                    themeParams.text_color ||
                                    (isDarkMode ? "#ffffff" : "#111827"),
                                }}
                              >
                                {formatCurrencyValue(
                                  studentData.student.classfee,
                                  studentData.student.classfeeCurrency
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
                                className="text-[10px] font-medium mb-0.5"
                                style={{
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                {t("status")}
                              </p>
                              <p
                                className="text-base font-bold"
                                style={{
                                  color: isDarkMode ? "#f59e0b" : "#d97706",
                                }}
                              >
                                {t("noPayments")}
                              </p>
                            </div>
                          </div>
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

              let bgGradient, borderColor, icon, title, message, iconColor;

              if (isFree) {
                bgGradient = isDarkMode
                  ? "linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(168, 85, 247, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(168, 85, 247, 0.03) 100%)";
                borderColor = isDarkMode
                  ? "rgba(168, 85, 247, 0.4)"
                  : "rgba(168, 85, 247, 0.3)";
                icon = <Sparkles className="w-10 h-10" />;
                iconColor = isDarkMode ? "#a855f7" : "#9333ea";
                title = t("freeMonth");
                message = t("currentMonthFree");
              } else if (isPartial) {
                bgGradient = isDarkMode
                  ? "linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.03) 100%)";
                borderColor = isDarkMode
                  ? "rgba(59, 130, 246, 0.4)"
                  : "rgba(59, 130, 246, 0.3)";
                icon = <CreditCard className="w-10 h-10" />;
                iconColor = isDarkMode ? "#3b82f6" : "#2563eb";
                title = t("partialPayment");
                message = t("currentMonthPartial");
              } else if (isPaid) {
                bgGradient = isDarkMode
                  ? "linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.03) 100%)";
                borderColor = isDarkMode
                  ? "rgba(34, 197, 94, 0.4)"
                  : "rgba(34, 197, 94, 0.3)";
                icon = <CheckCircle className="w-10 h-10" />;
                iconColor = isDarkMode ? "#22c55e" : "#16a34a";
                title = t("allPaidUp");
                message = t("currentMonthPaid");
              } else {
                bgGradient = isDarkMode
                  ? "linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.05) 100%)"
                  : "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.03) 100%)";
                borderColor = isDarkMode
                  ? "rgba(239, 68, 68, 0.4)"
                  : "rgba(239, 68, 68, 0.3)";
                icon = <Clock className="w-10 h-10" />;
                iconColor = isDarkMode ? "#ef4444" : "#dc2626";
                title = t("paymentRequired");
                message = t("currentMonthUnpaid");
              }

              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-xl border-2"
                  style={{
                    background: bgGradient,
                    borderColor: borderColor,
                    boxShadow: `0 20px 60px -15px ${withAlpha(iconColor, 0.3)}`,
                  }}
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none">
                  <div
                      className="absolute w-64 h-64 rounded-full blur-3xl -top-16 -right-16 animate-pulse"
                    style={{
                        background: `radial-gradient(circle, ${iconColor} 0%, transparent 70%)`,
                        animationDuration: "4s",
                      }}
                    />
                    <div
                      className="absolute w-48 h-48 rounded-full blur-2xl bottom-0 left-0 animate-pulse"
                      style={{
                        background: `radial-gradient(circle, ${iconColor} 0%, transparent 70%)`,
                        animationDuration: "5s",
                        animationDelay: "1s",
                    }}
                  />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-start gap-4 mb-4">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="p-4 rounded-2xl shadow-xl"
                        style={{
                          backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.15)"
                            : "rgba(255, 255, 255, 0.8)",
                          color: iconColor,
                        }}
                      >
                        {icon}
                      </motion.div>
                      <div className="flex-1">
                        <motion.h3
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className="text-xl sm:text-2xl font-extrabold mb-2"
                          style={{
                            color:
                              themeParams.text_color ||
                              (isDarkMode ? "#ffffff" : "#111827"),
                          }}
                        >
                          {title}
                        </motion.h3>
                        <p
                          className="text-sm font-medium mb-3"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#d1d5db" : "#4b5563"),
                          }}
                        >
                          {message}
                        </p>

                        {/* Current month details */}
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
                              className="text-[10px] font-medium mb-0.5"
                              style={{
                                color:
                                  themeParams.hint_color ||
                                  (isDarkMode ? "#9ca3af" : "#6b7280"),
                              }}
                            >
                              {isPartial ? t("amountPaid") : t("monthlyFee")}
                            </p>
                            <p
                              className="text-base font-bold"
                              style={{
                                color:
                                  themeParams.text_color ||
                                  (isDarkMode ? "#ffffff" : "#111827"),
                              }}
                            >
                              {isFree
                                ? t("freeMonth")
                                : isPartial
                                ? formatCurrencyValue(
                                    paidAmount,
                                    studentData.student.classfeeCurrency
                                  )
                                : formatCurrencyValue(
                                    studentData.student.classfee,
                                    studentData.student.classfeeCurrency
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
                              className="text-[10px] font-medium mb-0.5"
                              style={{
                                color:
                                  themeParams.hint_color ||
                                  (isDarkMode ? "#9ca3af" : "#6b7280"),
                              }}
                            >
                              {isPartial ? t("amountRemaining") : t("status")}
                            </p>
                            <p
                              className="text-base font-bold"
                              style={{
                                color: iconColor,
                              }}
                            >
                              {isFree
                                ? t("freeMonth")
                                : isPartial
                                ? formatCurrencyValue(
                                    remainingAmount,
                                    studentData.student.classfeeCurrency
                                  )
                                : isPaid
                                ? t("paid")
                                : t("unpaid")}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })()}

            {/* Add Deposit Section - Only for ETB currency */}
            {studentData?.student?.classfeeCurrency === "ETB" && (
              <div
                className="rounded-3xl border-2 p-5 shadow-lg transition-colors"
                style={{
                  backgroundColor:
                    themeParams.section_bg_color ||
                    themeParams.secondary_bg_color ||
                    (isDarkMode ? "#1f2937" : "#ffffff"),
                  borderColor: isDarkMode
                    ? "rgba(15, 118, 110, 0.4)"
                    : "rgba(15, 118, 110, 0.3)",
                }}
              >
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3
                          className="text-lg font-semibold mb-2"
                          style={{
                            color:
                              themeParams.text_color ||
                              (isDarkMode ? "#ffffff" : "#111827"),
                          }}
                        >
                          {t("addDeposit") || "Add Deposit"}
                        </h3>
                        {/* Payment Gateway Selector (ETB -> Chapa active, Stripe disabled) */}
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className="text-xs font-medium"
                            style={{
                              color:
                                themeParams.hint_color ||
                                (isDarkMode ? "#9ca3af" : "#6b7280"),
                            }}
                          >
                            {t("paymentGateway") || "Payment Gateway"}:
                          </span>
                          <div className="flex items-center gap-2">
                            <div
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: "rgba(15, 118, 110, 0.18)",
                                color: "#0f766e",
                                border: "1px solid rgba(15, 118, 110, 0.4)",
                              }}
                              title="Chapa"
                            >
                              <span
                                className="w-4 h-4 rounded-full inline-flex items-center justify-center font-extrabold"
                                style={{
                                  backgroundColor: "#0f766e",
                                  color: "#ffffff",
                                  lineHeight: 1,
                                  fontSize: "9px",
                                }}
                              >
                                C
                              </span>
                              {t("chapa") || "Chapa"}
                            </div>
                            <div
                              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold opacity-50"
                              style={{
                                backgroundColor: "rgba(107,114,128,0.12)",
                                color: isDarkMode ? "#9ca3af" : "#6b7280",
                                border: `1px dashed ${
                                  isDarkMode
                                    ? "rgba(156,163,175,0.4)"
                                    : "rgba(107,114,128,0.35)"
                                }`,
                              }}
                              title={
                                t("stripeNotAvailableForETB") ||
                                "Stripe is used for USD, not ETB"
                              }
                            >
                              <span
                                className="w-4 h-4 rounded-full inline-flex items-center justify-center font-extrabold"
                                style={{
                                  backgroundColor: "#635bff",
                                  color: "#ffffff",
                                  lineHeight: 1,
                                  fontSize: "9px",
                                }}
                              >
                                S
                              </span>
                              {t("stripe") || "Stripe"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="relative">
                          <span
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold"
                            style={{
                              color:
                                themeParams.hint_color ||
                                (isDarkMode ? "#9ca3af" : "#6b7280"),
                            }}
                          >
                            ETB
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={depositAmount}
                            onChange={(event) =>
                              handleDepositAmountInput(event.target.value)
                            }
                            className="w-full rounded-xl border px-10 py-3 text-base font-semibold shadow-sm focus:outline-none focus:ring-2"
                            style={{
                              borderColor: "rgba(15, 118, 110, 0.4)",
                              backgroundColor:
                                themeParams.secondary_bg_color ||
                                (isDarkMode ? "#374151" : "#f9fafb"),
                              color:
                                themeParams.text_color ||
                                (isDarkMode ? "#ffffff" : "#111827"),
                              boxShadow: "0 0 0 1px rgba(15, 118, 110, 0.22)",
                            }}
                            placeholder={String(
                              studentData?.student?.classfee ?? ""
                            )}
                          />
                        </div>
                        {/* Quick amount chips */}
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            {
                              label: t("classFee") || "Class fee",
                              value: Number(
                                studentData?.student?.classfee || 0
                              ),
                            },
                            {
                              label: t("tripleFee") || "3 x fee",
                              value:
                                Number(studentData?.student?.classfee || 0) * 3,
                            },
                            {
                              label: t("remaining") || "Remaining",
                              value: Number(
                                studentData?.payments?.summary
                                  ?.remainingBalance || 0
                              ),
                            },
                          ]
                            .filter((x) => x.value > 0)
                            .map((chip, idx) => (
                              <button
                                key={idx}
                                onClick={() =>
                                  setDepositAmount(String(chip.value))
                                }
                                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
                                style={{
                                  backgroundColor: "rgba(15, 118, 110, 0.15)",
                                  color: "#0f766e",
                                  border: "1px solid rgba(15, 118, 110, 0.35)",
                                }}
                              >
                                {chip.label}:{" "}
                                {formatCurrencyValue(
                                  chip.value,
                                  studentData?.student?.classfeeCurrency
                                )}
                              </button>
                            ))}
                        </div>

                        <p
                          className="text-[11px]"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                          }}
                        >
                          {t("autoApplyInfo") ||
                            "After provider confirmation, deposits are auto-applied to your unpaid months (past and future, up to 12 months ahead)."}
                        </p>
                        <p
                          className="text-[11px]"
                          style={{
                            color:
                              themeParams.hint_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                          }}
                        >
                          {t("secureByChapa") ||
                            "Securely processed by Chapa for ETB payments."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 items-stretch">
                      <button
                        onClick={handleShowPaymentSummary}
                        disabled={
                          checkoutLoading || !studentData || !depositAmount
                        }
                        className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-semibold shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
                        style={{
                          backgroundColor: checkoutLoading
                            ? "rgba(15, 118, 110, 0.8)"
                            : "#0f766e",
                          color: "#ffffff",
                        }}
                      >
                        {checkoutLoading ? (
                          <span className="flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            {t("processingPayment") || "Processing..."}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <span
                              className="w-5 h-5 rounded-full inline-flex items-center justify-center font-extrabold"
                              style={{
                                backgroundColor: "#ffffff",
                                color: "#0f766e",
                                lineHeight: 1,
                                fontSize: "10px",
                              }}
                            >
                              C
                            </span>
                            {t("payWithChapa") || "Pay with Chapa"}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Subscription Packages Section - Only for non-ETB currency */}
            {studentData?.student?.classfeeCurrency &&
              studentData.student.classfeeCurrency !== "ETB" && (
                <div className="w-full space-y-8">
                  {/* Removed duplicate subscription card - using Premium Active Subscription Hero Card instead */}

                  {/* Premium Header Section - Only show when no active subscription or showOtherSubscriptions is true */}
                  {(!currentSubscriptionId ||
                    showOtherSubscriptions ||
                    currentSubscriptionDetails?.status === "cancelled") && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="relative overflow-hidden rounded-[2rem] border-2 shadow-[0_25px_70px_-20px_rgba(0,0,0,0.25)] px-8 py-12 md:px-12 text-center"
                      style={{
                        background: `linear-gradient(135deg, ${withAlpha(
                          getThemeAccentColor(),
                          0.12
                        )} 0%, ${withAlpha(
                          getThemeAccentColor(),
                          0.05
                        )} 50%, ${withAlpha(
                          getThemeAccentColor(),
                          0.08
                        )} 100%)`,
                        borderColor: withAlpha(getThemeAccentColor(), 0.3),
                        backdropFilter: "blur(20px)",
                      }}
                    >
                      {/* Animated background orbs */}
                      <div className="absolute inset-0 opacity-25 pointer-events-none">
                        <div
                          className="absolute w-64 h-64 rounded-full blur-3xl -top-16 -right-16 animate-pulse"
                          style={{
                            background: `radial-gradient(circle, ${withAlpha(
                              getThemeAccentColor(),
                              0.6
                            )} 0%, transparent 70%)`,
                            animationDuration: "4s",
                          }}
                        />
                        <div
                          className="absolute w-56 h-56 rounded-full blur-3xl bottom-0 left-0 animate-pulse"
                          style={{
                            background: `radial-gradient(circle, ${withAlpha(
                              getThemeAccentColor(),
                              0.4
                            )} 0%, transparent 70%)`,
                            animationDuration: "5s",
                            animationDelay: "1s",
                          }}
                        />
                      </div>

                      <div className="relative z-10 space-y-4">
                        {/* Premium badge */}
                        <motion.div
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border-2 shadow-lg"
                          style={{
                            borderColor: withAlpha(getThemeAccentColor(), 0.5),
                            backgroundColor: withAlpha(
                              getThemeAccentColor(),
                              isDarkMode ? 0.25 : 0.15
                            ),
                            backdropFilter: "blur(10px)",
                          }}
                        >
                          <Sparkles
                            className="w-4 h-4"
                            style={{ color: getThemeAccentColor() }}
                          />
                          <span
                            className="text-xs font-bold uppercase tracking-[0.2em]"
                                style={{
                              color: getThemeAccentColor(),
                            }}
                          >
                            {t("premiumPlans") || "Premium Plans"}
                          </span>
                              </motion.div>

                        {/* Main heading */}
                        <motion.h2
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                          className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
                                    style={{
                            background: `linear-gradient(135deg, ${
                              themeParams.text_color ||
                              (isDarkMode ? "#ffffff" : "#0f172a")
                            } 0%, ${withAlpha(
                                              getThemeAccentColor(),
                              0.8
                                            )} 100%)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                                    }}
                                  >
                          {t("subscriptionPackages") || "Subscription Packages"}
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                          className="text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed"
                                    style={{
                            color:
                              themeParams.subtitle_text_color ||
                              themeParams.hint_color ||
                              (isDarkMode ? "#d1d5db" : "#4b5563"),
                                    }}
                                  >
                          {t("choosePackage") ||
                            "Choose the perfect plan for your learning journey"}
                        </motion.p>
                                </div>
                    </motion.div>
                  )}

                  {loadingPackages ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="text-center">
                        <RefreshCw
                          className="w-8 h-8 animate-spin mx-auto mb-3"
                                  style={{
                            color: getThemeAccentColor(),
                                  }}
                        />
                        <p
                          className="text-sm"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                              themeParams.subtitle_text_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                          {t("loadingPackages") || "Loading packages..."}
                        </p>
                              </div>
                            </div>
                  ) : subscriptionPackages.length > 0 ? (
                    <>
                      {/* Premium Active Subscription Hero Card */}
                      {currentSubscriptionDetails &&
                        currentSubscriptionPackageId &&
                        (() => {
                          const activePackage = subscriptionPackages.find(
                            (p) => p.id === currentSubscriptionPackageId
                          );
                          if (!activePackage) return null;

                          const startDate = new Date(
                            currentSubscriptionDetails.startDate
                          );
                          const endDate = new Date(
                            currentSubscriptionDetails.endDate
                          );
                          // Use currentTime state for real-time updates
                          const now = currentTime;

                          // Normalize dates to start of day for accurate day calculations
                          const startOfStartDate = new Date(startDate);
                          startOfStartDate.setHours(0, 0, 0, 0);
                          const startOfEndDate = new Date(endDate);
                          startOfEndDate.setHours(0, 0, 0, 0);
                          const startOfNow = new Date(now);
                          startOfNow.setHours(0, 0, 0, 0);

                          // Calculate total days using package duration (consistent with system)
                          // Use package duration * 30 days for standardization
                          const totalDays = activePackage.duration * 30;

                          // Calculate days used from start date to now
                          const daysUsedRaw = Math.floor(
                            (startOfNow.getTime() -
                              startOfStartDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );

                          // Calculate days used (ensure it's never negative and never exceeds totalDays)
                          const daysUsed = Math.max(
                            0,
                            Math.min(totalDays, daysUsedRaw)
                          );

                          // Calculate days remaining
                          const daysRemaining = Math.max(
                            0,
                            totalDays - daysUsed
                          );

                          // Calculate progress percentage
                          const progressPercent =
                            totalDays > 0
                              ? Math.min(
                                  100,
                                  Math.max(0, (daysUsed / totalDays) * 100)
                                )
                              : 0;
                          const accent = getThemeAccentColor();

                          return (
                            <motion.div
                              initial={{ opacity: 0, y: 30, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="relative mb-8 rounded-[2.5rem] border-2 overflow-hidden group"
                                style={{
                                background: `linear-gradient(135deg, ${withAlpha(
                                  accent,
                                  0.25
                                )} 0%, ${withAlpha(
                                  accent,
                                  0.12
                                )} 50%, ${withAlpha(accent, 0.18)} 100%)`,
                                borderColor: withAlpha(accent, 0.5),
                                boxShadow: `0 25px 80px -20px ${withAlpha(
                                  accent,
                                  0.5
                                )}, 0 0 0 1px ${withAlpha(accent, 0.1)}`,
                                }}
                              >
                              {/* Enhanced Animated background with real-time effects */}
                              <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <motion.div
                                  className="absolute w-96 h-96 rounded-full blur-3xl -top-32 -right-32"
                                  animate={{
                                    scale: [1, 1.15, 1],
                                    opacity: [0.2, 0.3, 0.2],
                                  }}
                                  transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                  }}
                                  style={{
                                    background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
                                  }}
                                />
                              <motion.div
                                  className="absolute w-80 h-80 rounded-full blur-3xl bottom-0 left-0"
                                  animate={{
                                    scale: [1, 1.1, 1],
                                    opacity: [0.15, 0.25, 0.15],
                                  }}
                                  transition={{
                                    duration: 5,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: 1,
                                  }}
                                style={{
                                    background: `radial-gradient(circle, ${accent} 0%, transparent 70%)`,
                                  }}
                                />
                                {/* Real-time shimmer effect */}
                                <motion.div
                                    className="absolute inset-0"
                                  animate={{
                                    backgroundPosition: [
                                      "0% 0%",
                                      "100% 100%",
                                      "0% 0%",
                                    ],
                                  }}
                                  transition={{
                                    duration: 8,
                                    repeat: Infinity,
                                    ease: "linear",
                                  }}
                                    style={{
                                    background: `linear-gradient(135deg, transparent 0%, ${withAlpha(
                                      accent,
                                        0.1
                                    )} 50%, transparent 100%)`,
                                    backgroundSize: "200% 200%",
                                    }}
                                  />
                                </div>

                              <div className="relative z-10 p-6 sm:p-8 md:p-10">
                                {/* Header with badge */}
                                <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
                                  <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-3">
                                    <div
                                        className="px-4 py-2 rounded-full border-2 shadow-lg"
                                      style={{
                                          background: `linear-gradient(135deg, ${accent} 0%, ${withAlpha(
                                            accent,
                                            0.8
                                        )} 100%)`,
                                          borderColor: withAlpha(accent, 0.3),
                                      }}
                                    >
                                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white flex items-center gap-2">
                                          <CheckCircle className="w-3.5 h-3.5" />
                                          {t("activeSubscription") ||
                                            "ACTIVE SUBSCRIPTION"}
                                        </span>
                                    </div>
                                    </div>
                                    <h2
                                      className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2"
                                      style={{
                                        background: `linear-gradient(135deg, ${
                                          themeParams.text_color ||
                                          (isDarkMode ? "#ffffff" : "#111827")
                                        } 0%, ${accent} 100%)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                      }}
                                    >
                                      {activePackage.name}
                                    </h2>
                                  <p
                                      className="text-sm sm:text-base font-medium"
                                    style={{
                                      color:
                                          themeParams.hint_color ||
                                          (isDarkMode ? "#d1d5db" : "#6b7280"),
                                    }}
                                  >
                                      {t("yourCurrentPlan") ||
                                        "Your current active subscription plan"}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <div
                                      className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1"
                                      style={{
                                        background: `linear-gradient(135deg, ${accent} 0%, ${withAlpha(
                                          accent,
                                          0.7
                                        )} 100%)`,
                                        WebkitBackgroundClip: "text",
                                        WebkitTextFillColor: "transparent",
                                        backgroundClip: "text",
                                      }}
                                    >
                                      {formatCurrencyValue(
                                        activePackage.price,
                                        activePackage.currency
                                      )}
                                    </div>
                                  <p
                                      className="text-xs sm:text-sm font-semibold uppercase tracking-wide"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                      {activePackage.duration}{" "}
                                      {activePackage.duration === 1
                                        ? t("month")
                                        : t("months")}
                                  </p>
                                </div>
                                </div>

                                {/* Progress Timeline */}
                                <div className="mb-6">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <Calendar
                                        className="w-4 h-4"
                                        style={{ color: accent }}
                                      />
                                      <span
                                        className="text-xs sm:text-sm font-semibold"
                                  style={{
                                          color:
                                            themeParams.text_color ||
                                            (isDarkMode
                                              ? "#ffffff"
                                              : "#111827"),
                                        }}
                                      >
                                        {t("subscriptionProgress") ||
                                          "Subscription Progress"}
                                      </span>
                                    </div>
                                    <span
                                      className="text-xs sm:text-sm font-bold"
                                      style={{ color: accent }}
                                    >
                                      {Math.round(progressPercent)}%{" "}
                                      {t("complete") || "Complete"}
                                    </span>
                                  </div>

                                  {/* Enhanced Progress Bar with Real-time Animation */}
                                    <div
                                    className="relative h-4 rounded-full overflow-hidden mb-4 shadow-inner"
                                      style={{
                                      backgroundColor: withAlpha(accent, 0.1),
                                      boxShadow: `inset 0 2px 4px ${withAlpha(
                                        accent,
                                          0.1
                                      )}`,
                                      }}
                                  >
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${progressPercent}%` }}
                                      transition={{
                                        duration: 0.8,
                                        ease: "easeOut",
                                      }}
                                      className="h-full rounded-full relative overflow-hidden"
                                        style={{
                                        background: `linear-gradient(90deg, ${accent} 0%, ${withAlpha(
                                          accent,
                                          0.8
                                        )} 50%, ${accent} 100%)`,
                                        boxShadow: `0 0 20px ${withAlpha(
                                          accent,
                                          0.5
                                        )}, 0 0 10px ${withAlpha(accent, 0.3)}`,
                                        }}
                                      >
                                      {/* Real-time shimmer effect on progress bar */}
                                      <motion.div
                                        className="absolute inset-0"
                                        animate={{
                                          x: ["-100%", "100%"],
                                        }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                          ease: "linear",
                                        }}
                                          style={{
                                          background: `linear-gradient(90deg, transparent 0%, ${withAlpha(
                                            "#ffffff",
                                            0.3
                                          )} 50%, transparent 100%)`,
                                          width: "50%",
                                        }}
                                      />
                                      {/* Glow effect */}
                                      <div
                                        className="absolute inset-0"
                                        style={{
                                          background: `radial-gradient(circle at right, ${withAlpha(
                                            accent,
                                            0.4
                                          )} 0%, transparent 70%)`,
                                          }}
                                        />
                                    </motion.div>
                                      </div>

                                  {/* Enhanced Timeline with Hover Effects */}
                                  <div className="grid grid-cols-3 gap-2 sm:gap-4">
                                    <motion.div
                                      whileHover={{ scale: 1.05, y: -2 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-center p-3 rounded-xl transition-all duration-300 cursor-default"
                                      style={{
                                        backgroundColor: withAlpha(accent, 0.1),
                                      }}
                                    >
                                      <div
                                        className="text-xs font-semibold mb-1 uppercase tracking-wide"
                                        style={{
                                          color:
                                            themeParams.hint_color ||
                                            (isDarkMode
                                              ? "#9ca3af"
                                              : "#6b7280"),
                                        }}
                                      >
                                        {t("startDate") || "Start Date"}
                                    </div>
                                      <div
                                        className="text-sm font-bold"
                                      style={{
                                        color:
                                          themeParams.text_color ||
                                            (isDarkMode
                                              ? "#ffffff"
                                              : "#111827"),
                                      }}
                                    >
                                        {startDate.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                      })}
                                  </div>
                                </motion.div>
                              <motion.div
                                      whileHover={{ scale: 1.05, y: -2 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-center p-3 rounded-xl transition-all duration-300 cursor-default relative overflow-hidden group"
                                style={{
                                        backgroundColor: withAlpha(
                                          accent,
                                          0.15
                                        ),
                                        border: `2px solid ${withAlpha(
                                          accent,
                                          0.3
                                        )}`,
                                }}
                              >
                                      {/* Pulsing indicator for days remaining */}
                                      <motion.div
                                        className="absolute top-2 right-2 w-2 h-2 rounded-full"
                                        animate={{
                                          scale: [1, 1.3, 1],
                                          opacity: [0.7, 1, 0.7],
                                        }}
                                        transition={{
                                          duration: 2,
                                          repeat: Infinity,
                                          ease: "easeInOut",
                                        }}
                                    style={{
                                          backgroundColor: accent,
                                          boxShadow: `0 0 10px ${accent}`,
                                    }}
                                  />
                                    <div
                                        className="text-xs font-semibold mb-1 uppercase tracking-wide"
                                      style={{
                                          color: accent,
                                      }}
                                    >
                                        {t("daysRemaining") || "Days Remaining"}
                                    </div>
                                      <div
                                        className="text-lg sm:text-xl font-extrabold"
                                        style={{ color: accent }}
                                      >
                                        {daysRemaining}
                                      </div>
                                    </motion.div>
                                    <motion.div
                                      whileHover={{ scale: 1.05, y: -2 }}
                                      transition={{ duration: 0.2 }}
                                      className="text-center p-3 rounded-xl transition-all duration-300 cursor-default"
                                      style={{
                                        backgroundColor: withAlpha(accent, 0.1),
                                      }}
                                    >
                                      <div
                                        className="text-xs font-semibold mb-1 uppercase tracking-wide"
                                      style={{
                                        color:
                                          themeParams.hint_color ||
                                            (isDarkMode
                                              ? "#9ca3af"
                                              : "#6b7280"),
                                      }}
                                    >
                                        {t("endDate") || "End Date"}
                                  </div>
                                      <div
                                        className="text-sm font-bold"
                                    style={{
                                      color:
                                        themeParams.text_color ||
                                            (isDarkMode
                                              ? "#ffffff"
                                              : "#111827"),
                                    }}
                                  >
                                        {endDate.toLocaleDateString("en-US", {
                                          month: "short",
                                          day: "numeric",
                                        })}
                                </div>
                              </motion.div>
                                  </div>
                            </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col gap-3">
                                  {/* Other Subscriptions Button - Only show when subscription is active (not cancelled) */}
                                  {currentSubscriptionDetails.status !==
                                    "cancelled" && (
                                    <motion.button
                                      onClick={() =>
                                        setShowOtherSubscriptions(
                                          !showOtherSubscriptions
                                        )
                                      }
                                      whileHover={{ scale: 1.02, y: -2 }}
                                      whileTap={{ scale: 0.97 }}
                                      className="w-full px-6 py-3.5 rounded-xl font-bold text-sm border-2 transition-all touch-manipulation relative overflow-hidden group shadow-lg"
                              style={{
                                        background: `linear-gradient(135deg, ${
                                          isDarkMode
                                            ? withAlpha(
                                  getThemeAccentColor(),
                                                0.15
                                              )
                                            : withAlpha(
                                  getThemeAccentColor(),
                                                0.08
                                              )
                                        } 0%, ${
                                          isDarkMode
                                            ? withAlpha(
                                                getThemeAccentColor(),
                                                0.1
                                              )
                                            : withAlpha(
                                                getThemeAccentColor(),
                                                0.05
                                              )
                                        } 100%)`,
                                borderColor: withAlpha(
                                  getThemeAccentColor(),
                                          isDarkMode ? 0.5 : 0.4
                                        ),
                                        color: getThemeAccentColor(),
                                        boxShadow: `0 10px 30px -10px ${withAlpha(
                                          getThemeAccentColor(),
                                          0.3
                                        )}`,
                                }}
                              >
                                      {/* Hover glow effect */}
                                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                    <div
                                          className="absolute inset-0"
                                      style={{
                                            background: `radial-gradient(circle at center, ${withAlpha(
                                          getThemeAccentColor(),
                                          0.15
                                            )} 0%, transparent 70%)`,
                                      }}
                                      />
                                    </div>
                                      <div className="relative z-10 flex items-center justify-center gap-2.5">
                                        <Package className="w-4.5 h-4.5" />
                                        <span>
                                          {showOtherSubscriptions
                                            ? t("hideOtherSubscriptions") ||
                                              "Hide Other Subscriptions"
                                            : t("otherSubscriptions") ||
                                              "Other Subscriptions"}
                                    </span>
                                  </div>
                                    </motion.button>
                                  )}

                                  {/* Cancel or Subscribe Again Button */}
                                  {currentSubscriptionDetails.status ===
                                  "cancelled" ? (
                                    (() => {
                                      const cancelledPackage =
                                        subscriptionPackages.find(
                                          (p) =>
                                            p.id ===
                                            currentSubscriptionPackageId
                                        );
                                      return cancelledPackage ? (
                                        <motion.button
                                          onClick={() =>
                                            handleSubscribe(cancelledPackage)
                                          }
                                          whileHover={{ scale: 1.02, y: -2 }}
                                          whileTap={{ scale: 0.97 }}
                                          className="w-full px-6 py-3.5 rounded-xl font-bold text-sm border-2 transition-all touch-manipulation relative overflow-hidden group shadow-lg"
                          style={{
                                            background: `linear-gradient(135deg, ${getThemeAccentColor()} 0%, ${withAlpha(
                                              getThemeAccentColor(),
                                              0.85
                                            )} 100%)`,
                                            borderColor: getThemeAccentColor(),
                                            color: "#ffffff",
                                            boxShadow: `0 10px 30px -10px ${withAlpha(
                                              getThemeAccentColor(),
                                              0.5
                                            )}`,
                                          }}
                                        >
                                          {/* Hover shimmer effect */}
                                          <motion.div
                                            className="absolute inset-0 opacity-0 group-hover:opacity-100"
                                            animate={{
                                              backgroundPosition: [
                                                "0% 0%",
                                                "100% 100%",
                                                "0% 0%",
                                              ],
                                            }}
                                            transition={{
                                              duration: 2,
                                              repeat: Infinity,
                                              ease: "linear",
                                            }}
                                  style={{
                                              background: `linear-gradient(135deg, transparent 0%, ${withAlpha(
                                                "#ffffff",
                                                0.2
                                              )} 50%, transparent 100%)`,
                                              backgroundSize: "200% 200%",
                                  }}
                                          />
                                          <div className="relative z-10 flex items-center justify-center gap-2.5">
                                            <CheckCircle className="w-4.5 h-4.5" />
                                            <span>
                                              {t("subscribeAgain") ||
                                                "Subscribe Again"}
                                </span>
                              </div>
                                        </motion.button>
                                      ) : null;
                                    })()
                                  ) : (
                              <motion.button
                                onClick={() => setShowCancelModal(true)}
                                      whileHover={{ scale: 1.02, y: -2 }}
                                      whileTap={{ scale: 0.97 }}
                                      className="w-full px-6 py-3.5 rounded-xl font-bold text-sm border-2 transition-all touch-manipulation relative overflow-hidden group shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, ${
                                    isDarkMode
                                      ? "rgba(239, 68, 68, 0.15)"
                                      : "rgba(239, 68, 68, 0.08)"
                                        } 0%, ${
                                    isDarkMode
                                            ? "rgba(239, 68, 68, 0.1)"
                                            : "rgba(239, 68, 68, 0.05)"
                                        } 100%)`,
                                        borderColor: isDarkMode
                                      ? "rgba(239, 68, 68, 0.5)"
                                          : "rgba(239, 68, 68, 0.4)",
                                        color: isDarkMode
                                          ? "#f87171"
                                          : "#dc2626",
                                        boxShadow: `0 10px 30px -10px ${withAlpha(
                                          "#ef4444",
                                          0.3
                                        )}`,
                                }}
                              >
                                      {/* Hover glow effect */}
                                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div
                                    className="absolute inset-0"
                                    style={{
                                            background: `radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%)`,
                                    }}
                                  />
                                </div>
                                      <div className="relative z-10 flex items-center justify-center gap-2.5">
                                        <XCircle className="w-4.5 h-4.5" />
                                      <span>
                                        {t("cancelSubscription") ||
                                          "Cancel Subscription"}
                                      </span>
                                </div>
                              </motion.button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                          );
                        })()}

                      {/* Packages Grid - Only show when no active subscription or showOtherSubscriptions is true */}
                      {(!currentSubscriptionId ||
                        showOtherSubscriptions ||
                        currentSubscriptionDetails?.status === "cancelled") && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                      {subscriptionPackages.map((pkg, idx) => {
                        const isPopular = pkg.purchaseCount > 0;
                            const isSubscribed = activeSubscriptions.has(
                              pkg.id
                            );
                        const isCurrentPackage =
                          currentSubscriptionPackageId === pkg.id;

                        // Check if this package is a valid upgrade
                        const currentPackage = subscriptionPackages.find(
                          (p) => p.id === currentSubscriptionPackageId
                        );
                        const canUpgrade =
                          currentSubscriptionId &&
                          !isSubscribed &&
                          !isCurrentPackage &&
                          currentPackage &&
                          (pkg.price > currentPackage.price ||
                            pkg.duration > currentPackage.duration);
                        const canDowngrade =
                          currentSubscriptionId &&
                          !isSubscribed &&
                          !isCurrentPackage &&
                          currentPackage &&
                          (pkg.price < currentPackage.price ||
                            pkg.duration < currentPackage.duration);

                        const accent = getThemeAccentColor();
                        const isHighlighted = isSubscribed || isPopular;

                        // Premium card styling
                        const cardBackground = isSubscribed
                          ? `linear-gradient(135deg, ${withAlpha(
                              accent,
                              0.2
                                )} 0%, ${withAlpha(
                              accent,
                                  0.08
                                )} 50%, ${withAlpha(accent, 0.12)} 100%)`
                          : isPopular
                          ? `linear-gradient(135deg, ${withAlpha(
                              accent,
                              0.12
                            )} 0%, ${withAlpha(accent, 0.04)} 100%)`
                          : getThemeSurfaceColor();

                        const borderColor = isSubscribed
                          ? withAlpha(accent, 0.6)
                          : isPopular
                          ? withAlpha(accent, 0.4)
                          : themeParams.section_separator_color ||
                            (isDarkMode
                              ? "rgba(55, 65, 81, 0.5)"
                              : "rgba(229, 231, 235, 0.8)");

                        const glowShadow = isSubscribed
                          ? `0 20px 60px -15px ${withAlpha(
                              accent,
                              0.6
                            )}, 0 0 0 1px ${withAlpha(accent, 0.1)}`
                          : isPopular
                          ? `0 15px 45px -10px ${withAlpha(accent, 0.4)}`
                          : isDarkMode
                          ? "0 10px 30px -10px rgba(0,0,0,0.5)"
                          : "0 10px 30px -10px rgba(15, 23, 42, 0.15)";

                        // Enhanced features list with more details
                        const features = [
                          {
                            icon: Calendar,
                            text: `${pkg.duration} ${
                              pkg.duration === 1
                                ? t("month") || "month"
                                : t("months") || "months"
                            } ${t("access") || "access"}`,
                            highlight: true,
                          },
                          {
                            icon: Sparkles,
                            text:
                              t("allPremiumFeatures") ||
                              "All premium features included",
                            highlight: false,
                          },
                          {
                            icon: Users,
                                text:
                                  t("prioritySupport") || "Priority support",
                            highlight: false,
                          },
                          {
                            icon: CheckCircle,
                                text:
                                  t("unlimitedAccess") || "Unlimited access",
                            highlight: false,
                          },
                          {
                            icon: Package,
                            text:
                                  t("advancedAnalytics") ||
                                  "Advanced analytics",
                            highlight: false,
                          },
                        ];

                        return (
                          <motion.div
                            key={pkg.id}
                            initial={{ opacity: 0, y: 30, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{
                              delay: idx * 0.1,
                              duration: 0.5,
                              ease: "easeOut",
                            }}
                            whileHover={{
                                  y: -12,
                                  scale: 1.02,
                                  transition: {
                                    duration: 0.3,
                                    ease: "easeOut",
                                  },
                            }}
                                className="relative flex flex-col rounded-[2rem] border-2 p-8 overflow-hidden group transition-all duration-300"
                            style={{
                              borderColor,
                              background: cardBackground,
                              boxShadow: glowShadow,
                              backdropFilter: "blur(20px)",
                                  transition:
                                    "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            }}
                          >
                                {/* Enhanced Premium background effects with real-time animations */}
                            <div className="absolute inset-0 opacity-15 pointer-events-none">
                                  <motion.div
                                    className="absolute w-40 h-40 rounded-full blur-3xl -top-10 -right-10"
                                    whileHover={{ scale: 1.5 }}
                                    animate={{
                                      scale: [1, 1.1, 1],
                                      opacity: [0.15, 0.25, 0.15],
                                    }}
                                    transition={{
                                      duration: 4,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                    }}
                                style={{
                                  background: `radial-gradient(circle, ${withAlpha(
                                    accent,
                                    0.6
                                  )} 0%, transparent 70%)`,
                                }}
                              />
                                  <motion.div
                                    className="absolute w-32 h-32 rounded-full blur-2xl bottom-0 left-0"
                                    whileHover={{ scale: 1.25 }}
                                    animate={{
                                      scale: [1, 1.08, 1],
                                      opacity: [0.1, 0.2, 0.1],
                                    }}
                                    transition={{
                                      duration: 5,
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                      delay: 1,
                                    }}
                                style={{
                                  background: `radial-gradient(circle, ${withAlpha(
                                    accent,
                                    0.4
                                  )} 0%, transparent 70%)`,
                                }}
                              />
                                  {/* Real-time shimmer overlay */}
                                  <motion.div
                                    className="absolute inset-0"
                                    animate={{
                                      backgroundPosition: [
                                        "0% 0%",
                                        "100% 100%",
                                        "0% 0%",
                                      ],
                                    }}
                                    transition={{
                                      duration: 6,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }}
                                    style={{
                                      background: `linear-gradient(135deg, transparent 0%, ${withAlpha(
                                        accent,
                                        0.08
                                      )} 50%, transparent 100%)`,
                                      backgroundSize: "200% 200%",
                                    }}
                                  />
                            </div>

                                {/* Enhanced Popular/Active ribbon with animation */}
                            {(isSubscribed || isPopular) && (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{
                                      type: "spring",
                                      stiffness: 200,
                                      delay: idx * 0.1 + 0.3,
                                    }}
                                className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl rounded-tr-[2rem] shadow-lg z-20"
                                style={{
                                  background: `linear-gradient(135deg, ${accent} 0%, ${withAlpha(
                                    accent,
                                    0.8
                                  )} 100%)`,
                                      boxShadow: `0 4px 15px ${withAlpha(
                                        accent,
                                        0.4
                                      )}`,
                                }}
                              >
                                    <motion.span
                                      animate={{
                                        opacity: [0.9, 1, 0.9],
                                      }}
                                      transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                      }}
                                      className="text-[10px] font-bold uppercase tracking-[0.15em] text-white flex items-center gap-1.5"
                                    >
                                  {isSubscribed ? (
                                    <>
                                          <motion.div
                                            animate={{ rotate: [0, 360] }}
                                            transition={{
                                              duration: 3,
                                              repeat: Infinity,
                                              ease: "linear",
                                            }}
                                          >
                                      <CheckCircle className="w-3 h-3" />
                                          </motion.div>
                                      {t("active") || "ACTIVE"}
                                    </>
                                  ) : (
                                    <>
                                      <Star className="w-3 h-3 fill-current" />
                                      {t("popular") || "POPULAR"}
                                    </>
                                  )}
                                    </motion.span>
                                  </motion.div>
                            )}

                            <div className="relative z-10 flex flex-col h-full">
                              {/* Header */}
                              <div className="mb-6">
                                <p
                                  className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {t("plan") || "PLAN"}
                                </p>
                                <h3
                                  className="text-3xl font-extrabold mb-3 leading-tight"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                  {pkg.name}
                                </h3>
                                {pkg.description && (
                                  <p
                                    className="text-sm leading-relaxed"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                            (isDarkMode
                                              ? "#d1d5db"
                                              : "#6b7280"),
                                    }}
                                  >
                                    {pkg.description}
                                  </p>
                                )}
                              </div>

                              {/* Price section */}
                              <div
                                className="mb-8 pb-8 border-b"
                                style={{
                                  borderColor: withAlpha(accent, 0.15),
                                }}
                              >
                                <div className="flex items-baseline gap-2 mb-1">
                                  <span
                                    className="text-5xl font-extrabold leading-none"
                                    style={{
                                      background: `linear-gradient(135deg, ${accent} 0%, ${withAlpha(
                                        accent,
                                        0.7
                                      )} 100%)`,
                                      WebkitBackgroundClip: "text",
                                      WebkitTextFillColor: "transparent",
                                      backgroundClip: "text",
                                    }}
                                  >
                                    {pkg.currency === "USD"
                                      ? "$"
                                      : pkg.currency === "EUR"
                                      ? "€"
                                      : pkg.currency === "GBP"
                                      ? "£"
                                      : ""}
                                    {pkg.price.toLocaleString()}
                                  </span>
                                </div>
                                <p
                                  className="text-sm font-semibold uppercase tracking-wide"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {pkg.duration === 1
                                    ? t("perMonth") || "per month"
                                    : `${pkg.duration} ${
                                        t("months") || "months"
                                      }`}
                                </p>
                              </div>

                              {/* Enhanced Features List with Icons */}
                              <div className="flex-1 space-y-3 mb-8">
                                {features.map((feature, featureIdx) => {
                                  const FeatureIcon = feature.icon;
                                  return (
                                    <motion.div
                                      key={featureIdx}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{
                                            delay:
                                              idx * 0.1 + featureIdx * 0.05,
                                      }}
                                      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                                        feature.highlight
                                          ? "border-2"
                                          : "border border-transparent"
                                      }`}
                                      style={{
                                        backgroundColor: feature.highlight
                                          ? withAlpha(accent, 0.08)
                                          : "transparent",
                                        borderColor: feature.highlight
                                          ? withAlpha(accent, 0.2)
                                          : "transparent",
                                      }}
                                    >
                                      <div
                                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md ${
                                              feature.highlight
                                                ? "scale-110"
                                                : ""
                                        }`}
                                        style={{
                                          background: feature.highlight
                                            ? `linear-gradient(135deg, ${withAlpha(
                                                accent,
                                                0.25
                                              )} 0%, ${withAlpha(
                                                accent,
                                                0.15
                                              )} 100%)`
                                            : `linear-gradient(135deg, ${withAlpha(
                                                accent,
                                                0.18
                                              )} 0%, ${withAlpha(
                                                accent,
                                                0.1
                                              )} 100%)`,
                                          color: accent,
                                        }}
                                      >
                                        <FeatureIcon className="w-5 h-5" />
                                      </div>
                                      <p
                                        className={`text-sm leading-relaxed pt-1.5 flex-1 ${
                                          feature.highlight
                                            ? "font-bold"
                                            : "font-medium"
                                        }`}
                                        style={{
                                          color: feature.highlight
                                            ? accent
                                            : themeParams.text_color ||
                                              (isDarkMode
                                                ? "#f3f4f6"
                                                : "#111827"),
                                        }}
                                      >
                                        {feature.text}
                                      </p>
                                    </motion.div>
                                  );
                                })}

                                {/* Social Proof */}
                                {pkg.purchaseCount > 0 && (
                                  <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{
                                          delay:
                                            idx * 0.1 + features.length * 0.05,
                                    }}
                                    className="flex items-center gap-3 p-3 rounded-xl border-2 mt-4"
                                    style={{
                                          backgroundColor: withAlpha(
                                            accent,
                                            0.08
                                          ),
                                      borderColor: withAlpha(accent, 0.2),
                                    }}
                                  >
                                    <div
                                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                                      style={{
                                        background: `linear-gradient(135deg, ${withAlpha(
                                          accent,
                                          0.25
                                        )} 0%, ${withAlpha(
                                          accent,
                                          0.15
                                        )} 100%)`,
                                        color: accent,
                                      }}
                                    >
                                      <Users className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1">
                                      <p
                                        className="text-sm font-bold mb-0.5"
                                        style={{
                                          color: accent,
                                        }}
                                      >
                                        {pkg.purchaseCount}{" "}
                                        {pkg.purchaseCount === 1
                                          ? t("activeSubscriber") ||
                                            "active subscriber"
                                          : t("activeSubscribers") ||
                                            "active subscribers"}
                                      </p>
                                      <p
                                        className="text-xs font-medium"
                                        style={{
                                          color:
                                            themeParams.hint_color ||
                                            (isDarkMode
                                              ? "#9ca3af"
                                              : "#6b7280"),
                                        }}
                                      >
                                        {t("trustedByStudents") ||
                                          "Trusted by students worldwide"}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </div>

                              {/* Premium CTA Button */}
                              <motion.button
                                onClick={() => {
                                      console.log(
                                        "[Subscribe Button] Clicked",
                                        {
                                    packageId: pkg.id,
                                    packageName: pkg.name,
                                    isSubscribed,
                                    canUpgrade,
                                    canDowngrade,
                                    checkoutLoading,
                                    upgradeLoading,
                                    downgradeLoading,
                                        }
                                      );

                                  if (canUpgrade) {
                                    console.log(
                                      "[Subscribe Button] Opening upgrade modal"
                                    );
                                    setSelectedUpgradePackage(pkg);
                                    setShowUpgradeModal(true);
                                  } else if (canDowngrade) {
                                        // Downgrade functionality hidden for now (kept for future use)
                                        // setSelectedDowngradePackage(pkg);
                                        // setShowDowngradeModal(true);
                                    console.log(
                                          "[Subscribe Button] Downgrade disabled - feature hidden"
                                    );
                                  } else if (!isSubscribed) {
                                    console.log(
                                      "[Subscribe Button] Calling handleSubscribe"
                                    );
                                    handleSubscribe(pkg);
                                  } else {
                                    console.warn(
                                      "[Subscribe Button] No action taken - already subscribed and cannot upgrade/downgrade"
                                    );
                                  }
                                }}
                                disabled={
                                  checkoutLoading ||
                                  upgradeLoading ||
                                  downgradeLoading ||
                                      (isSubscribed && !canUpgrade)
                                      // Downgrade disabled - feature hidden
                                }
                                className="group relative w-full rounded-2xl px-6 py-4 font-bold overflow-hidden transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-xl"
                                style={{
                                  border:
                                    isSubscribed && !canUpgrade
                                          ? `2px solid ${withAlpha(
                                              accent,
                                              0.3
                                            )}`
                                          : `2px solid ${withAlpha(
                                              accent,
                                              0.2
                                            )}`,
                                  color:
                                    isSubscribed && !canUpgrade
                                      ? accent
                                      : themeParams.button_text_color ||
                                        "#ffffff",
                                  background:
                                    isSubscribed && !canUpgrade
                                      ? withAlpha(accent, 0.08)
                                      : `linear-gradient(135deg, ${accent} 0%, ${withAlpha(
                                          accent,
                                          0.85
                                        )} 100%)`,
                                  boxShadow:
                                    isSubscribed && !canUpgrade
                                      ? "none"
                                      : `0 20px 50px -15px ${withAlpha(
                                          accent,
                                          0.8
                                        )}, 0 0 0 1px ${withAlpha(
                                          accent,
                                          0.1
                                        )}`,
                                }}
                                whileHover={
                                  !isSubscribed || canUpgrade
                                    ? {
                                        scale: 1.02,
                                        boxShadow: `0 25px 60px -10px ${withAlpha(
                                          accent,
                                          0.9
                                        )}, 0 0 0 1px ${withAlpha(
                                          accent,
                                          0.2
                                        )}`,
                                      }
                                    : {}
                                }
                                whileTap={
                                  !isSubscribed || canUpgrade
                                    ? { scale: 0.98 }
                                    : {}
                                }
                              >
                                {/* Shimmer effect on hover */}
                                {(canUpgrade || !isSubscribed) && (
                                  <motion.span
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100"
                                    initial={false}
                                    animate={{
                                      background: [
                                        `linear-gradient(90deg, transparent 0%, ${withAlpha(
                                          "#ffffff",
                                          0.2
                                        )} 50%, transparent 100%)`,
                                        `linear-gradient(90deg, transparent 0%, ${withAlpha(
                                          "#ffffff",
                                          0.2
                                        )} 50%, transparent 100%)`,
                                      ],
                                    }}
                                    transition={{
                                      duration: 2,
                                      repeat: Infinity,
                                      ease: "linear",
                                    }}
                                    style={{
                                      backgroundPosition: "200% 0",
                                    }}
                                  />
                                )}

                                {/* Button content */}
                                <div className="relative z-10 flex items-center justify-between">
                                  {upgradeLoading && canUpgrade ? (
                                    <div className="flex items-center gap-3 w-full justify-center">
                                      <RefreshCw className="w-5 h-5 animate-spin" />
                                      <span className="text-base">
                                        {t("upgrading") || "Upgrading..."}
                                      </span>
                                    </div>
                                  ) : checkoutLoading ? (
                                        // Downgrade loading state removed - feature hidden
                                    <div className="flex items-center gap-3 w-full justify-center">
                                      <RefreshCw className="w-5 h-5 animate-spin" />
                                      <span className="text-base">
                                        {t("processing") || "Processing..."}
                                      </span>
                                    </div>
                                      ) : isSubscribed && !canUpgrade ? (
                                    <div className="flex items-center gap-3 w-full justify-center">
                                      <CheckCircle className="w-5 h-5" />
                                      <span className="text-base">
                                        {t("subscribed") || "Subscribed"}
                                      </span>
                                    </div>
                                  ) : canUpgrade ? (
                                    <>
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                          style={{
                                            backgroundColor: withAlpha(
                                              "#ffffff",
                                              0.2
                                            ),
                                          }}
                                        >
                                          <TrendingUp className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90 mb-0.5">
                                                {t("upgradeNow") ||
                                                  "UPGRADE NOW"}
                                          </div>
                                          <div className="text-lg font-extrabold">
                                            {t("upgrade") || "Upgrade"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                                        <span>
                                          {t("chargeImmediately") ||
                                            "Charge immediately"}
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                      </div>
                                    </>
                                      ) : (
                                        // Downgrade button hidden - feature disabled for now
                                    <>
                                      <div className="flex items-center gap-3">
                                        <div
                                          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                                          style={{
                                            backgroundColor: withAlpha(
                                              "#ffffff",
                                              0.2
                                            ),
                                          }}
                                        >
                                          <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                          <div className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90 mb-0.5">
                                            {t("instantAccess") ||
                                              "INSTANT ACCESS"}
                                          </div>
                                          <div className="text-lg font-extrabold">
                                            {t("subscribeNow") ||
                                              "Subscribe Now"}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm font-semibold opacity-90">
                                        <span>
                                          {t("secureSpot") || "Secure spot"}
                                        </span>
                                        <ArrowRight className="w-4 h-4" />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                      )}
                    </>
                  ) : (
                    <div
                      className="p-12 rounded-2xl text-center border border-dashed"
                      style={{
                        backgroundColor:
                          themeParams.secondary_bg_color ||
                          (isDarkMode
                            ? "rgba(255, 255, 255, 0.02)"
                            : "rgba(0, 0, 0, 0.01)"),
                        borderColor:
                          themeParams.section_separator_color ||
                          (isDarkMode
                            ? "rgba(55, 65, 81, 0.3)"
                            : "rgba(229, 231, 235, 0.5)"),
                      }}
                    >
                      <div
                        className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: withAlpha(
                            getThemeAccentColor(),
                            0.12
                          ),
                        }}
                      >
                        <Package
                          className="w-8 h-8"
                          style={{
                            color: getThemeAccentColor(),
                          }}
                        />
                      </div>
                      <p
                        className="text-base font-medium mb-2"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        {t("noPackagesAvailable") ||
                          "No subscription packages available"}
                      </p>
                      <p
                        className="text-sm mb-3"
                        style={{
                          color:
                            themeParams.hint_color ||
                            themeParams.subtitle_text_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {studentData?.student?.subscriptionPackageConfigId
                          ? "No packages have been assigned to your subscription configuration. Please contact support."
                          : "Subscription packages are not currently available. Please check back later or contact support."}
                      </p>
                      {studentData?.student?.subscriptionPackageConfigId && (
                        <div
                          className="mt-4 p-3 rounded-xl text-xs"
                          style={{
                            backgroundColor: withAlpha(
                              getThemeAccentColor(),
                              0.1
                            ),
                            border: `1px solid ${withAlpha(
                              getThemeAccentColor(),
                              0.2
                            )}`,
                            color: getThemeAccentColor(),
                          }}
                        >
                          <strong>Note:</strong> Your account is configured for
                          a specific package group. Packages need to be assigned
                          to this group by an administrator.
                        </div>
                      )}
                      <p
                        className="text-sm mt-4"
                        style={{
                          color:
                            themeParams.hint_color ||
                            themeParams.subtitle_text_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {t("checkBackLater") ||
                          "Check back later for new packages"}
                      </p>
                    </div>
                  )}
                </div>
              )}

            {/* Premium Upgrade Confirmation Modal - Mobile Optimized */}
            {showUpgradeModal &&
              selectedUpgradePackage &&
              currentSubscriptionPackageId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(12px)",
                    paddingLeft: `${contentSafeAreaInset.left || 0}px`,
                    paddingRight: `${contentSafeAreaInset.right || 0}px`,
                  }}
                  onClick={() => {
                    if (!upgradeLoading) {
                      setShowUpgradeModal(false);
                      setSelectedUpgradePackage(null);
                    }
                  }}
                >
                  <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-lg sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] border-2 border-b-0 sm:border-b-2 p-6 sm:p-8 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.5)] sm:shadow-[0_30px_80px_-10px_rgba(0,0,0,0.5)] overflow-y-auto"
                    style={{
                      background: `linear-gradient(135deg, ${
                        themeParams.section_bg_color ||
                        themeParams.secondary_bg_color ||
                        (isDarkMode ? "#1f2937" : "#ffffff")
                      } 0%, ${
                        themeParams.secondary_bg_color ||
                        (isDarkMode ? "#111827" : "#f9fafb")
                      } 100%)`,
                      borderColor: withAlpha(getThemeAccentColor(), 0.4),
                      backdropFilter: "blur(20px)",
                      paddingBottom: `${(safeAreaInset.bottom || 0) + 24}px`,
                    }}
                  >
                    {/* Background gradient */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div
                        className="absolute w-64 h-64 rounded-full blur-3xl -top-20 -right-20"
                        style={{
                          background: `radial-gradient(circle, ${getThemeAccentColor()} 0%, transparent 70%)`,
                        }}
                      />
                    </div>

                    {/* Mobile drag handle */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 sm:hidden">
                      <div
                        className="w-12 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            themeParams.hint_color ||
                            (isDarkMode ? "#4b5563" : "#d1d5db"),
                        }}
                      />
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => {
                        if (!upgradeLoading) {
                          setShowUpgradeModal(false);
                          setSelectedUpgradePackage(null);
                        }
                      }}
                      disabled={upgradeLoading}
                      className="absolute top-6 right-6 p-3 rounded-xl transition-all disabled:opacity-50 active:scale-95 z-20 touch-manipulation"
                      style={{
                        backgroundColor: withAlpha(getThemeAccentColor(), 0.1),
                        color:
                          themeParams.text_color ||
                          (isDarkMode ? "#ffffff" : "#111827"),
                        minWidth: "44px",
                        minHeight: "44px",
                      }}
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 space-y-5 sm:space-y-6 mt-4 sm:mt-0">
                      {/* Premium Header */}
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.1, type: "spring" }}
                          className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-5 rounded-2xl flex items-center justify-center shadow-xl"
                          style={{
                            background: `linear-gradient(135deg, ${getThemeAccentColor()} 0%, ${withAlpha(
                              getThemeAccentColor(),
                              0.7
                            )} 100%)`,
                          }}
                        >
                          <TrendingUp className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                        </motion.div>
                        <h3
                          className="text-2xl sm:text-3xl font-extrabold mb-2 sm:mb-3 px-2"
                          style={{
                            background: `linear-gradient(135deg, ${
                              themeParams.text_color ||
                              (isDarkMode ? "#ffffff" : "#111827")
                            } 0%, ${withAlpha(
                              getThemeAccentColor(),
                              0.8
                            )} 100%)`,
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            backgroundClip: "text",
                          }}
                        >
                          {t("upgradeSubscription") || "Upgrade Subscription"}
                        </h3>
                        <div
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full mb-4 mx-2"
                          style={{
                            backgroundColor: withAlpha(
                              getThemeAccentColor(),
                              0.1
                            ),
                          }}
                        >
                          <Info
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: getThemeAccentColor() }}
                          />
                          <p
                            className="text-xs sm:text-sm font-semibold text-center"
                            style={{
                              color: getThemeAccentColor(),
                            }}
                          >
                            {t("upgradeConfirmation") ||
                              "You will be charged immediately for the upgrade"}
                          </p>
                        </div>
                      </div>

                      {/* Premium Package Comparison */}
                      {(() => {
                        const currentPackage = subscriptionPackages.find(
                          (p) => p.id === currentSubscriptionPackageId
                        );
                        if (!currentPackage) return null;

                        const priceDifference =
                          selectedUpgradePackage.price - currentPackage.price;
                        const durationDifference =
                          selectedUpgradePackage.duration -
                          currentPackage.duration;

                        return (
                          <div className="space-y-3 sm:space-y-4">
                            {/* Current Package */}
                            <div
                              className="p-4 sm:p-5 rounded-2xl border-2 relative overflow-hidden"
                              style={{
                                backgroundColor: withAlpha(
                                  getThemeAccentColor(),
                                  0.05
                                ),
                                borderColor: withAlpha(
                                  getThemeAccentColor(),
                                  0.2
                                ),
                              }}
                            >
                              <div className="absolute top-3 right-3">
                                <span
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                                  style={{
                                    backgroundColor: withAlpha(
                                      getThemeAccentColor(),
                                      0.15
                                    ),
                                    color: getThemeAccentColor(),
                                  }}
                                >
                                  {t("current") || "CURRENT"}
                                </span>
                              </div>
                              <div className="pr-16 sm:pr-20">
                                <h4
                                  className="text-base sm:text-lg font-extrabold mb-2"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                  {currentPackage.name}
                                </h4>
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span
                                    className="text-xl sm:text-2xl font-extrabold"
                                    style={{
                                      color: getThemeAccentColor(),
                                    }}
                                  >
                                    {formatCurrencyValue(
                                      currentPackage.price,
                                      currentPackage.currency
                                    )}
                                  </span>
                                  <span
                                    className="text-xs font-semibold uppercase tracking-wide"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    / {currentPackage.duration}{" "}
                                    {currentPackage.duration === 1
                                      ? t("month") || "month"
                                      : t("months") || "months"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Arrow with upgrade indicator */}
                            <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                              <div
                                className="flex-1 h-px"
                                style={{
                                  background: `linear-gradient(90deg, transparent 0%, ${withAlpha(
                                    getThemeAccentColor(),
                                    0.3
                                  )} 50%, transparent 100%)`,
                                }}
                              />
                              <div
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, ${getThemeAccentColor()} 0%, ${withAlpha(
                                    getThemeAccentColor(),
                                    0.7
                                  )} 100%)`,
                                }}
                              >
                                <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                              </div>
                              <div
                                className="flex-1 h-px"
                                style={{
                                  background: `linear-gradient(90deg, transparent 0%, ${withAlpha(
                                    getThemeAccentColor(),
                                    0.3
                                  )} 50%, transparent 100%)`,
                                }}
                              />
                            </div>

                            {/* New Package */}
                            <div
                              className="p-4 sm:p-5 rounded-2xl border-2 relative overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, ${withAlpha(
                                  getThemeAccentColor(),
                                  0.15
                                )} 0%, ${withAlpha(
                                  getThemeAccentColor(),
                                  0.08
                                )} 100%)`,
                                borderColor: getThemeAccentColor(),
                                boxShadow: `0 10px 30px -10px ${withAlpha(
                                  getThemeAccentColor(),
                                  0.4
                                )}`,
                              }}
                            >
                              <div className="absolute top-3 right-3">
                                <span
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white"
                                  style={{
                                    backgroundColor: getThemeAccentColor(),
                                  }}
                                >
                                  {t("new") || "NEW"}
                                </span>
                              </div>
                              <div className="pr-16 sm:pr-20">
                                <h4
                                  className="text-base sm:text-lg font-extrabold mb-2"
                                  style={{
                                    color: getThemeAccentColor(),
                                  }}
                                >
                                  {selectedUpgradePackage.name}
                                </h4>
                                <div className="flex flex-wrap items-baseline gap-2">
                                  <span
                                    className="text-xl sm:text-2xl font-extrabold"
                                    style={{
                                      color: getThemeAccentColor(),
                                    }}
                                  >
                                    {formatCurrencyValue(
                                      selectedUpgradePackage.price,
                                      selectedUpgradePackage.currency
                                    )}
                                  </span>
                                  <span
                                    className="text-xs font-semibold uppercase tracking-wide"
                                    style={{
                                      color: withAlpha(
                                        getThemeAccentColor(),
                                        0.7
                                      ),
                                    }}
                                  >
                                    / {selectedUpgradePackage.duration}{" "}
                                    {selectedUpgradePackage.duration === 1
                                      ? t("month") || "month"
                                      : t("months") || "months"}
                                  </span>
                                </div>
                                {(priceDifference > 0 ||
                                  durationDifference > 0) && (
                                  <div
                                    className="mt-3 pt-3 border-t"
                                    style={{
                                      borderColor: withAlpha(
                                        getThemeAccentColor(),
                                        0.2
                                      ),
                                    }}
                                  >
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                      <TrendingUp
                                        className="w-3.5 h-3.5"
                                        style={{ color: getThemeAccentColor() }}
                                      />
                                      <span
                                        style={{ color: getThemeAccentColor() }}
                                      >
                                        {priceDifference > 0 &&
                                          `+${formatCurrencyValue(
                                            priceDifference,
                                            selectedUpgradePackage.currency
                                          )}`}
                                        {durationDifference > 0 &&
                                          ` • +${durationDifference} ${
                                            durationDifference === 1
                                              ? t("month") || "month"
                                              : t("months") || "months"
                                          }`}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Proration Breakdown */}
                      {(() => {
                        const currentPackage = subscriptionPackages.find(
                          (p) => p.id === currentSubscriptionPackageId
                        );
                        if (!currentPackage || !currentSubscriptionDetails)
                          return null;

                        // Calculate proration
                        // IMPORTANT: Use startDate as the primary source (it reflects the actual subscription start)
                        // If startDate was changed, it should be used for accurate proration calculation
                        const now = new Date();

                        // Use startDate as the primary source (it can be updated/changed)
                        // Fallback to createdAt only if startDate is not available
                        // This ensures the calculation updates when startDate is changed
                        const originalStartDateStr: string | null =
                          currentSubscriptionDetails.startDate ||
                          currentSubscriptionDetails.createdAt ||
                          null;

                        if (!originalStartDateStr) {
                          console.error(
                            "[Proration] Missing startDate and createdAt",
                            currentSubscriptionDetails
                          );
                          return null;
                        }

                        const originalStartDate = new Date(
                          originalStartDateStr
                        );

                        console.log("[Proration Frontend] Using start date:", {
                          startDate: currentSubscriptionDetails.startDate,
                          createdAt: currentSubscriptionDetails.createdAt,
                          using: originalStartDateStr,
                          originalStartDate: originalStartDate.toISOString(),
                        });

                        // Validate the date is not invalid
                        if (isNaN(originalStartDate.getTime())) {
                          console.error(
                            "[Proration] Invalid originalStartDate:",
                            originalStartDateStr
                          );
                          return null;
                        }

                        // Calculate total days using standardized 30 days per month
                        // This matches the backend: totalDays = currentDuration * 30
                        // This ensures consistent proration calculations regardless of actual calendar days
                        const totalDays = currentPackage.duration * 30; // Standardized: months × 30 days

                        // Calculate days used from original start to now (using actual calendar days)
                        // This matches the backend: upgradeDate - originalStartDate
                        const daysUsedMs =
                          now.getTime() - originalStartDate.getTime();
                        const daysUsed = Math.max(
                          0,
                          Math.floor(daysUsedMs / (1000 * 60 * 60 * 24))
                        );

                        // Calculate days remaining (using standardized total days)
                        const daysRemaining = Math.max(0, totalDays - daysUsed);

                        // Calculate monthly rates
                        const currentMonthlyRate =
                          currentPackage.price / currentPackage.duration;
                        const newMonthlyRate =
                          selectedUpgradePackage.price /
                          selectedUpgradePackage.duration;

                        // Calculate daily rates using standardized 30 days per month
                        // This matches the backend: currentDailyRate = currentPrice / totalDays
                        // where totalDays = duration * 30
                        const currentDailyRate =
                          currentPackage.price / totalDays; // $150 / 90 = $1.67/day
                        const newDailyRate = newMonthlyRate / 30; // For new plan, use standard 30 days/month

                        // Calculate credit for unused time at old package rate
                        const creditAmount =
                          Math.round(currentDailyRate * daysRemaining * 100) /
                          100;

                        // Net amount: new package price minus credit
                        const netAmount =
                          Math.round(
                            (selectedUpgradePackage.price - creditAmount) * 100
                          ) / 100;

                        // Debug logging with more details
                        const timeDiffMs =
                          now.getTime() - originalStartDate.getTime();
                        const timeDiffDays = timeDiffMs / (1000 * 60 * 60 * 24);

                        console.log("[Proration Frontend] Calculation:", {
                          originalStartDate: originalStartDate.toISOString(),
                          now: now.toISOString(),
                          timeDifference: {
                            milliseconds: timeDiffMs,
                            days: timeDiffDays.toFixed(2),
                            hours: (timeDiffMs / (1000 * 60 * 60)).toFixed(2),
                          },
                          totalDays: `${totalDays} (${currentPackage.duration} months × 30 days)`,
                          daysUsed,
                          daysRemaining,
                          currentPackageDuration: currentPackage.duration,
                          currentPackagePrice: currentPackage.price,
                          newPackagePrice: selectedUpgradePackage.price,
                          currentDailyRate: currentDailyRate.toFixed(2),
                          creditAmount: creditAmount.toFixed(2),
                          netAmount: netAmount.toFixed(2),
                          subscriptionDetails: {
                          createdAt: currentSubscriptionDetails.createdAt,
                          startDate: currentSubscriptionDetails.startDate,
                            endDate: currentSubscriptionDetails.endDate,
                          subscriptionId: currentSubscriptionDetails.id,
                          },
                        });

                        // Warn if daysUsed is 0 but startDate is in the past
                        if (daysUsed === 0 && originalStartDate < now) {
                          console.warn(
                            "[Proration Frontend] ⚠️ daysUsed is 0 but startDate is in the past!",
                            {
                              originalStartDate:
                                originalStartDate.toISOString(),
                              now: now.toISOString(),
                              timeDiffDays: timeDiffDays.toFixed(2),
                              startDate: currentSubscriptionDetails.startDate,
                              createdAt: currentSubscriptionDetails.createdAt,
                            }
                          );
                        }

                        // Warn if createdAt is missing or equals startDate (which might be wrong after upgrade)
                        if (
                          !currentSubscriptionDetails.createdAt ||
                          currentSubscriptionDetails.createdAt ===
                            currentSubscriptionDetails.startDate
                        ) {
                          console.warn(
                            "[Proration Frontend] ⚠️ createdAt missing or equals startDate! This may cause incorrect calculations.",
                            {
                              createdAt: currentSubscriptionDetails.createdAt,
                              startDate: currentSubscriptionDetails.startDate,
                              subscriptionId: currentSubscriptionDetails.id,
                            }
                          );
                        }

                        return (
                          <div
                            className="p-4 sm:p-5 rounded-2xl border-2 space-y-3 sm:space-y-4"
                            style={{
                              backgroundColor: withAlpha(
                                getThemeAccentColor(),
                                0.08
                              ),
                              borderColor: withAlpha(
                                getThemeAccentColor(),
                                0.3
                              ),
                            }}
                          >
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                              <Calculator
                                className="w-5 h-5 flex-shrink-0"
                                style={{ color: getThemeAccentColor() }}
                              />
                              <h4
                                className="text-base sm:text-lg font-bold"
                                style={{
                                  color:
                                    themeParams.text_color ||
                                    (isDarkMode ? "#ffffff" : "#111827"),
                                }}
                              >
                                {t("prorationBreakdown") ||
                                  "Proration Breakdown"}
                              </h4>
                            </div>

                            <div className="space-y-3">
                              {/* Current Package Details */}
                              <div
                                className="p-3 sm:p-4 rounded-xl mb-2 sm:mb-3"
                                style={{
                                  backgroundColor: withAlpha(
                                    getThemeAccentColor(),
                                    0.05
                                  ),
                                }}
                              >
                                <div
                                  className="text-[10px] sm:text-xs font-semibold mb-2 uppercase tracking-wide"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {t("currentPackage") || "Current Package"}
                                </div>
                                <div className="space-y-2 sm:space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex justify-between items-center gap-2">
                                <span
                                      className="flex-shrink-0"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                      {currentPackage.name}:
                                </span>
                                <span
                                      className="font-semibold text-right break-words"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                      {formatCurrencyValue(
                                        currentPackage.price,
                                        currentPackage.currency
                                      )}{" "}
                                      / {currentPackage.duration}{" "}
                                      {t("months") || "months"}
                                </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-2">
                                    <span
                                      className="flex-shrink-0"
                                      style={{
                                        color:
                                          themeParams.hint_color ||
                                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                                      }}
                                    >
                                      {t("monthlyRate") || "Monthly Rate"}:
                                    </span>
                                    <span
                                      className="font-semibold text-right"
                                      style={{
                                        color:
                                          themeParams.text_color ||
                                          (isDarkMode ? "#ffffff" : "#111827"),
                                      }}
                                    >
                                      {formatCurrencyValue(
                                        currentMonthlyRate,
                                        currentPackage.currency
                                      )}{" "}
                                      / {t("month") || "month"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center gap-2">
                                    <span
                                      className="flex-shrink-0"
                                      style={{
                                        color:
                                          themeParams.hint_color ||
                                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                                      }}
                                    >
                                      {t("dailyRate") || "Daily Rate"}:
                                    </span>
                                    <span
                                      className="font-semibold text-right"
                                      style={{
                                        color:
                                          themeParams.text_color ||
                                          (isDarkMode ? "#ffffff" : "#111827"),
                                      }}
                                    >
                                      {formatCurrencyValue(
                                        currentDailyRate,
                                        currentPackage.currency
                                      )}{" "}
                                      / {t("day") || "day"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Days Information - Mobile Optimized */}
                              <div
                                className="grid grid-cols-2 gap-3 p-3 rounded-xl"
                                style={{
                                  backgroundColor: withAlpha(
                                    getThemeAccentColor(),
                                    0.03
                                  ),
                                }}
                              >
                                <div>
                                  <div
                                    className="text-[10px] sm:text-xs font-medium mb-1"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    {t("daysUsed") || "Days Used"}
                                  </div>
                                  <div
                                    className="text-base sm:text-lg font-bold"
                                    style={{
                                      color:
                                        themeParams.text_color ||
                                        (isDarkMode ? "#ffffff" : "#111827"),
                                    }}
                                  >
                                    {daysUsed} / {totalDays}
                                  </div>
                                </div>
                                <div>
                                  <div
                                    className="text-[10px] sm:text-xs font-medium mb-1"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    {t("daysRemaining") || "Days Remaining"}
                                  </div>
                                  <div
                                    className="text-base sm:text-lg font-bold"
                                    style={{
                                      color: getThemeAccentColor(),
                                    }}
                                  >
                                    {daysRemaining}
                                  </div>
                                </div>
                              </div>

                              {/* Credit Calculation Details - Mobile Optimized */}
                              {creditAmount > 0.01 && (
                                <>
                                  <div
                                    className="p-3 sm:p-4 rounded-xl"
                                    style={{
                                      backgroundColor: withAlpha(
                                        "#10b981",
                                        0.08
                                      ),
                                    }}
                                  >
                                    <div
                                      className="text-[10px] sm:text-xs font-semibold mb-2 uppercase tracking-wide"
                                      style={{ color: "#10b981" }}
                                    >
                                      {t("creditCalculation") ||
                                        "Credit Calculation"}
                                    </div>
                                    <div className="space-y-2 text-xs sm:text-sm">
                                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                  <span
                                          className="break-words"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                              (isDarkMode
                                                ? "#9ca3af"
                                                : "#6b7280"),
                                          }}
                                        >
                                          {daysRemaining} {t("days") || "days"}{" "}
                                          ×{" "}
                                          {formatCurrencyValue(
                                            currentDailyRate,
                                            currentPackage.currency
                                          )}
                                          :
                                        </span>
                                        <span
                                          className="font-bold text-base sm:text-lg sm:font-semibold"
                                          style={{ color: "#10b981" }}
                                        >
                                          {formatCurrencyValue(
                                            creditAmount,
                                            selectedUpgradePackage.currency
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Credit Amount - Mobile Card Style */}
                                  <div
                                    className="p-3 sm:p-4 rounded-xl flex justify-between items-center"
                                    style={{
                                      backgroundColor: withAlpha(
                                        "#10b981",
                                        0.1
                                      ),
                                      border: `2px solid ${withAlpha(
                                        "#10b981",
                                        0.3
                                      )}`,
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center"
                                        style={{
                                          backgroundColor: withAlpha(
                                            "#10b981",
                                            0.2
                                          ),
                                        }}
                                      >
                                        <span
                                          className="text-lg sm:text-xl font-bold"
                                          style={{ color: "#10b981" }}
                                        >
                                          +
                                        </span>
                                      </div>
                                      <span
                                        className="text-xs sm:text-sm font-medium"
                                        style={{
                                          color:
                                            themeParams.hint_color ||
                                            (isDarkMode
                                              ? "#9ca3af"
                                              : "#6b7280"),
                                    }}
                                  >
                                    {t("unusedTimeCredit") ||
                                      "Unused Time Credit"}
                                  </span>
                                    </div>
                                  <span
                                      className="text-lg sm:text-xl font-bold"
                                    style={{
                                      color: "#10b981",
                                    }}
                                  >
                                    {formatCurrencyValue(
                                      creditAmount,
                                      selectedUpgradePackage.currency
                                    )}
                                  </span>
                                </div>
                                </>
                              )}

                              {/* New Package Details */}
                              <div
                                className="p-3 rounded-xl"
                                style={{
                                  backgroundColor: withAlpha(
                                    getThemeAccentColor(),
                                    0.05
                                  ),
                                }}
                              >
                                <div
                                  className="text-xs font-semibold mb-2 uppercase tracking-wide"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {t("newPackage") || "New Package"}
                                </div>
                                <div className="space-y-1.5 text-sm">
                                  <div className="flex justify-between">
                                <span
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                      {selectedUpgradePackage.name}:
                                </span>
                                <span
                                  className="font-semibold"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                  {formatCurrencyValue(
                                    selectedUpgradePackage.price,
                                    selectedUpgradePackage.currency
                                      )}{" "}
                                      / {selectedUpgradePackage.duration}{" "}
                                      {t("months") || "months"}
                                </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span
                                      style={{
                                        color:
                                          themeParams.hint_color ||
                                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                                      }}
                                    >
                                      {t("monthlyRate") || "Monthly Rate"}:
                                    </span>
                                    <span
                                      className="font-semibold"
                                      style={{
                                        color:
                                          themeParams.text_color ||
                                          (isDarkMode ? "#ffffff" : "#111827"),
                                      }}
                                    >
                                      {formatCurrencyValue(
                                        newMonthlyRate,
                                        selectedUpgradePackage.currency
                                      )}{" "}
                                      / {t("month") || "month"}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span
                                      style={{
                                        color:
                                          themeParams.hint_color ||
                                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                                      }}
                                    >
                                      {t("dailyRate") || "Daily Rate"}:
                                    </span>
                                    <span
                                      className="font-semibold"
                                      style={{
                                        color:
                                          themeParams.text_color ||
                                          (isDarkMode ? "#ffffff" : "#111827"),
                                      }}
                                    >
                                      {formatCurrencyValue(
                                        newDailyRate,
                                        selectedUpgradePackage.currency
                                      )}{" "}
                                      / {t("day") || "day"}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Net Calculation Details - Mobile Optimized */}
                              <div
                                className="p-4 sm:p-5 rounded-xl mt-2 border-2"
                                style={{
                                  backgroundColor: withAlpha(
                                    getThemeAccentColor(),
                                    0.12
                                  ),
                                  borderColor: withAlpha(
                                    getThemeAccentColor(),
                                    0.4
                                  ),
                                }}
                              >
                                <div
                                  className="text-[10px] sm:text-xs font-semibold mb-3 uppercase tracking-wide"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {t("netCalculation") || "Net Calculation"}
                                </div>
                                <div className="space-y-2 sm:space-y-1.5 text-xs sm:text-sm">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                    <span
                                      className="break-words"
                                      style={{
                                        color:
                                          themeParams.hint_color ||
                                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                                      }}
                                    >
                                      {t("newPackagePrice") ||
                                        "New Package Price"}
                                      :
                                    </span>
                                    <span
                                      className="font-bold text-base sm:text-lg sm:font-semibold"
                                      style={{
                                        color:
                                          themeParams.text_color ||
                                          (isDarkMode ? "#ffffff" : "#111827"),
                                      }}
                                    >
                                      {formatCurrencyValue(
                                        selectedUpgradePackage.price,
                                        selectedUpgradePackage.currency
                                      )}
                                    </span>
                                  </div>
                                  {creditAmount > 0.01 && (
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2">
                                      <span
                                        className="break-words"
                                        style={{
                                          color:
                                            themeParams.hint_color ||
                                            (isDarkMode
                                              ? "#9ca3af"
                                              : "#6b7280"),
                                        }}
                                      >
                                        {t("minusCredit") || "Minus Credit"}:
                                      </span>
                                      <span
                                        className="font-bold text-base sm:text-lg sm:font-semibold"
                                        style={{ color: "#10b981" }}
                                      >
                                        -{" "}
                                        {formatCurrencyValue(
                                          creditAmount,
                                          selectedUpgradePackage.currency
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  <div
                                    className="h-px my-2 sm:my-1"
                                style={{
                                  backgroundColor: withAlpha(
                                    getThemeAccentColor(),
                                    0.2
                                  ),
                                }}
                              />
                                  <div
                                    className="p-3 sm:p-4 rounded-xl flex justify-between items-center"
                                    style={{
                                      backgroundColor: withAlpha(
                                        getThemeAccentColor(),
                                        0.15
                                      ),
                                      border: `2px solid ${withAlpha(
                                        getThemeAccentColor(),
                                        0.4
                                      )}`,
                                    }}
                                  >
                                <span
                                      className="text-sm sm:text-base font-bold"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                      {t("amountToCharge") ||
                                        "Amount to Charge"}
                                </span>
                                <span
                                      className="text-xl sm:text-2xl font-extrabold"
                                  style={{
                                    color: getThemeAccentColor(),
                                  }}
                                >
                                  {formatCurrencyValue(
                                    netAmount,
                                    selectedUpgradePackage.currency
                                  )}
                                </span>
                                  </div>
                                </div>
                              </div>

                              {/* Calculation Details */}
                              <div
                                className="text-xs pt-2 border-t"
                                style={{
                                  borderColor: withAlpha(
                                    getThemeAccentColor(),
                                    0.1
                                  ),
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                <p className="leading-relaxed">
                                  {t("prorationExplanation") ||
                                    `You've used ${daysUsed} of ${totalDays} days. You'll receive a credit of ${formatCurrencyValue(
                                      creditAmount,
                                      selectedUpgradePackage.currency
                                    )} for the remaining ${daysRemaining} days. The new package costs ${formatCurrencyValue(
                                      selectedUpgradePackage.price,
                                      selectedUpgradePackage.currency
                                    )}, so you'll be charged ${formatCurrencyValue(
                                      netAmount,
                                      selectedUpgradePackage.currency
                                    )} today.`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Premium Warning Box */}
                      <div
                        className="p-4 rounded-2xl border-2 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${
                            isDarkMode
                              ? "rgba(245, 158, 11, 0.2)"
                              : "rgba(245, 158, 11, 0.12)"
                          } 0%, ${
                            isDarkMode
                              ? "rgba(245, 158, 11, 0.1)"
                              : "rgba(245, 158, 11, 0.06)"
                          } 100%)`,
                          borderColor: isDarkMode
                            ? "rgba(245, 158, 11, 0.4)"
                            : "rgba(245, 158, 11, 0.3)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: isDarkMode
                                ? "rgba(245, 158, 11, 0.2)"
                                : "rgba(245, 158, 11, 0.15)",
                            }}
                          >
                            <Clock
                              className="w-5 h-5"
                              style={{
                                color: isDarkMode ? "#fbbf24" : "#d97706",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p
                              className="text-sm font-bold mb-1"
                              style={{
                                color: isDarkMode ? "#fbbf24" : "#d97706",
                              }}
                            >
                              {t("immediateCharge") || "Immediate Charge"}
                            </p>
                            <p
                              className="text-xs leading-relaxed"
                              style={{
                                color: isDarkMode ? "#fcd34d" : "#92400e",
                              }}
                            >
                              {t("upgradeWarning") ||
                                "You will be charged immediately for the prorated difference. Your subscription will be upgraded right away."}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Premium Action Buttons - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-2 sticky bottom-0 bg-inherit pb-2 sm:pb-0">
                        <motion.button
                          onClick={() => {
                            if (!upgradeLoading) {
                              setShowUpgradeModal(false);
                              setSelectedUpgradePackage(null);
                            }
                          }}
                          disabled={upgradeLoading}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 px-6 py-4 sm:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg touch-manipulation min-h-[56px] sm:min-h-[48px]"
                          style={{
                            backgroundColor:
                              themeParams.secondary_bg_color ||
                              (isDarkMode
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(0, 0, 0, 0.04)"),
                            color:
                              themeParams.text_color ||
                              (isDarkMode ? "#ffffff" : "#111827"),
                            border: `2px solid ${
                              themeParams.section_separator_color ||
                              (isDarkMode
                                ? "rgba(55, 65, 81, 0.3)"
                                : "rgba(229, 231, 235, 0.5)")
                            }`,
                          }}
                        >
                          {t("cancel") || "Cancel"}
                        </motion.button>
                        <motion.button
                          onClick={() => handleUpgrade(selectedUpgradePackage)}
                          disabled={upgradeLoading}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 px-6 py-4 sm:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl touch-manipulation min-h-[56px] sm:min-h-[48px]"
                          style={{
                            background: `linear-gradient(135deg, ${getThemeAccentColor()} 0%, ${withAlpha(
                              getThemeAccentColor(),
                              0.85
                            )} 100%)`,
                            color: themeParams.button_text_color || "#ffffff",
                            boxShadow: `0 15px 40px -10px ${withAlpha(
                              getThemeAccentColor(),
                              0.6
                            )}`,
                          }}
                        >
                          {upgradeLoading ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span className="text-base sm:text-sm">
                                {t("upgrading") || "Upgrading..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-5 h-5" />
                              <span className="text-base sm:text-sm">
                                {t("upgrade") || "Upgrade"}
                              </span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

            {/* Premium Downgrade Confirmation Modal */}
            {showDowngradeModal &&
              selectedDowngradePackage &&
              currentSubscriptionPackageId && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                  style={{
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                    backdropFilter: "blur(12px)",
                    paddingLeft: `${contentSafeAreaInset.left || 0}px`,
                    paddingRight: `${contentSafeAreaInset.right || 0}px`,
                  }}
                  onClick={() => {
                    if (!downgradeLoading) {
                      setShowDowngradeModal(false);
                      setSelectedDowngradePackage(null);
                    }
                  }}
                >
                  <motion.div
                    initial={{ y: "100%", opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: "100%", opacity: 0 }}
                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-lg sm:max-w-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] border-2 border-b-0 sm:border-b-2 p-6 sm:p-8 md:p-10 shadow-[0_-20px_60px_-10px_rgba(59,130,246,0.5)] sm:shadow-[0_40px_100px_-20px_rgba(59,130,246,0.5)] overflow-y-auto"
                    style={{
                      background: `linear-gradient(145deg, ${
                        themeParams.section_bg_color ||
                        themeParams.secondary_bg_color ||
                        (isDarkMode ? "#1f2937" : "#ffffff")
                      } 0%, ${
                        themeParams.secondary_bg_color ||
                        (isDarkMode ? "#111827" : "#f9fafb")
                      } 50%, ${
                        themeParams.section_bg_color ||
                        (isDarkMode ? "#1f2937" : "#ffffff")
                      } 100%)`,
                      borderColor: withAlpha("#3b82f6", 0.5),
                      backdropFilter: "blur(30px)",
                      paddingBottom: `${(safeAreaInset.bottom || 0) + 24}px`,
                    }}
                  >
                    {/* Mobile drag handle */}
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 sm:hidden">
                      <div
                        className="w-12 h-1.5 rounded-full"
                        style={{
                          backgroundColor:
                            themeParams.hint_color ||
                            (isDarkMode ? "#4b5563" : "#d1d5db"),
                        }}
                      />
                    </div>

                    {/* Premium background effects */}
                    <div className="absolute inset-0 opacity-15 pointer-events-none">
                      <div
                        className="absolute w-96 h-96 rounded-full blur-3xl -top-32 -right-32 animate-pulse"
                        style={{
                          background: `radial-gradient(circle, rgba(59, 130, 246, 0.7) 0%, transparent 70%)`,
                          animationDuration: "4s",
                        }}
                      />
                    </div>

                    {/* Close button */}
                    <button
                      onClick={() => {
                        if (!downgradeLoading) {
                          setShowDowngradeModal(false);
                          setSelectedDowngradePackage(null);
                        }
                      }}
                      disabled={downgradeLoading}
                      className="absolute top-6 right-6 p-3 rounded-xl transition-all disabled:opacity-50 active:scale-95 z-20 shadow-lg touch-manipulation"
                      style={{
                        backgroundColor: withAlpha("#3b82f6", 0.15),
                        color:
                          themeParams.text_color ||
                          (isDarkMode ? "#ffffff" : "#111827"),
                        minWidth: "44px",
                        minHeight: "44px",
                      }}
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10 space-y-5 sm:space-y-6 mt-4 sm:mt-0">
                      {/* Premium Header */}
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            delay: 0.1,
                            type: "spring",
                            stiffness: 200,
                          }}
                          className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 sm:mb-6 rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl"
                          style={{
                            background: `linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)`,
                            boxShadow: `0 25px 50px -15px rgba(59, 130, 246, 0.6)`,
                          }}
                        >
                          <ArrowDown className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
                        </motion.div>
                        <motion.h3
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-3 sm:mb-4 tracking-tight px-2"
                          style={{
                            color:
                              themeParams.text_color ||
                              (isDarkMode ? "#ffffff" : "#111827"),
                          }}
                        >
                          Downgrade Subscription
                        </motion.h3>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed px-2"
                          style={{
                            color:
                              themeParams.hint_color ||
                              themeParams.subtitle_text_color ||
                              (isDarkMode ? "#d1d5db" : "#6b7280"),
                          }}
                        >
                          Your subscription will be downgraded at the end of
                          your current billing period. You'll continue to have
                          access to your current plan until then.
                        </motion.p>
                      </div>

                      {/* Package Comparison */}
                      {(() => {
                        const currentPackage = subscriptionPackages.find(
                          (p) => p.id === currentSubscriptionPackageId
                        );
                        if (!currentPackage) return null;

                        const priceDifference =
                          currentPackage.price - selectedDowngradePackage.price;
                        const durationDifference =
                          currentPackage.duration -
                          selectedDowngradePackage.duration;

                        return (
                          <div className="space-y-4">
                            {/* Current Package */}
                            <div
                              className="p-5 rounded-2xl border-2 relative overflow-hidden"
                              style={{
                                backgroundColor: withAlpha(
                                  getThemeAccentColor(),
                                  0.05
                                ),
                                borderColor: withAlpha(
                                  getThemeAccentColor(),
                                  0.2
                                ),
                              }}
                            >
                              <div className="absolute top-3 right-3">
                                <span
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide"
                                  style={{
                                    backgroundColor: withAlpha(
                                      getThemeAccentColor(),
                                      0.15
                                    ),
                                    color: getThemeAccentColor(),
                                  }}
                                >
                                  CURRENT
                                </span>
                              </div>
                              <div className="pr-16">
                                <h4
                                  className="text-lg font-extrabold mb-2"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                  {currentPackage.name}
                                </h4>
                                <div className="flex items-baseline gap-2">
                                  <span
                                    className="text-2xl font-extrabold"
                                    style={{
                                      color: getThemeAccentColor(),
                                    }}
                                  >
                                    {formatCurrencyValue(
                                      currentPackage.price,
                                      currentPackage.currency
                                    )}
                                  </span>
                                  <span
                                    className="text-xs font-semibold uppercase tracking-wide"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    / {currentPackage.duration}{" "}
                                    {currentPackage.duration === 1
                                      ? "month"
                                      : "months"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="flex items-center justify-center gap-3">
                              <div
                                className="flex-1 h-px"
                                style={{
                                  background: `linear-gradient(90deg, transparent 0%, ${withAlpha(
                                    "#3b82f6",
                                    0.3
                                  )} 50%, transparent 100%)`,
                                }}
                              />
                              <div
                                className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                                style={{
                                  background: `linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)`,
                                }}
                              >
                                <ArrowDown className="w-6 h-6 text-white" />
                              </div>
                              <div
                                className="flex-1 h-px"
                                style={{
                                  background: `linear-gradient(90deg, transparent 0%, ${withAlpha(
                                    "#3b82f6",
                                    0.3
                                  )} 50%, transparent 100%)`,
                                }}
                              />
                            </div>

                            {/* New Package */}
                            <div
                              className="p-5 rounded-2xl border-2 relative overflow-hidden"
                              style={{
                                background: `linear-gradient(135deg, ${withAlpha(
                                  "#3b82f6",
                                  0.15
                                )} 0%, ${withAlpha("#3b82f6", 0.08)} 100%)`,
                                borderColor: "#3b82f6",
                                boxShadow: `0 10px 30px -10px ${withAlpha(
                                  "#3b82f6",
                                  0.4
                                )}`,
                              }}
                            >
                              <div className="absolute top-3 right-3">
                                <span
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide text-white"
                                  style={{
                                    backgroundColor: "#3b82f6",
                                  }}
                                >
                                  NEW
                                </span>
                              </div>
                              <div className="pr-16">
                                <h4
                                  className="text-lg font-extrabold mb-2"
                                  style={{
                                    color: "#3b82f6",
                                  }}
                                >
                                  {selectedDowngradePackage.name}
                                </h4>
                                <div className="flex items-baseline gap-2">
                                  <span
                                    className="text-2xl font-extrabold"
                                    style={{
                                      color: "#3b82f6",
                                    }}
                                  >
                                    {formatCurrencyValue(
                                      selectedDowngradePackage.price,
                                      selectedDowngradePackage.currency
                                    )}
                                  </span>
                                  <span
                                    className="text-xs font-semibold uppercase tracking-wide"
                                    style={{
                                      color: withAlpha("#3b82f6", 0.7),
                                    }}
                                  >
                                    / {selectedDowngradePackage.duration}{" "}
                                    {selectedDowngradePackage.duration === 1
                                      ? "month"
                                      : "months"}
                                  </span>
                                </div>
                                {(priceDifference > 0 ||
                                  durationDifference > 0) && (
                                  <div
                                    className="mt-3 pt-3 border-t"
                                    style={{
                                      borderColor: withAlpha("#3b82f6", 0.2),
                                    }}
                                  >
                                    <div className="flex items-center gap-2 text-xs font-semibold">
                                      <ArrowDown
                                        className="w-3.5 h-3.5"
                                        style={{ color: "#3b82f6" }}
                                      />
                                      <span style={{ color: "#3b82f6" }}>
                                        {priceDifference > 0 &&
                                          `-${formatCurrencyValue(
                                            priceDifference,
                                            selectedDowngradePackage.currency
                                          )}`}
                                        {durationDifference > 0 &&
                                          ` • -${durationDifference} ${
                                            durationDifference === 1
                                              ? "month"
                                              : "months"
                                          }`}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Info Box */}
                      <div
                        className="p-5 rounded-2xl border-2 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${
                            isDarkMode
                              ? "rgba(59, 130, 246, 0.2)"
                              : "rgba(59, 130, 246, 0.12)"
                          } 0%, ${
                            isDarkMode
                              ? "rgba(59, 130, 246, 0.1)"
                              : "rgba(59, 130, 246, 0.06)"
                          } 100%)`,
                          borderColor: isDarkMode
                            ? "rgba(59, 130, 246, 0.4)"
                            : "rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                            style={{
                              background: `linear-gradient(135deg, ${withAlpha(
                                "#3b82f6",
                                0.2
                              )} 0%, ${withAlpha("#3b82f6", 0.1)} 100%)`,
                            }}
                          >
                            <Clock
                              className="w-6 h-6"
                              style={{
                                color: "#3b82f6",
                              }}
                            />
                          </div>
                          <div className="flex-1">
                            <p
                              className="text-base font-bold mb-2"
                              style={{
                                color: "#3b82f6",
                              }}
                            >
                              Effective at Period End
                            </p>
                            <p
                              className="text-sm leading-relaxed"
                              style={{
                                color: isDarkMode ? "#93c5fd" : "#1e40af",
                              }}
                            >
                              Your downgrade will take effect at the end of your
                              current billing period. You'll continue to have
                              full access to your current plan until then.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Proration Breakdown */}
                      {(() => {
                        const currentPackage = subscriptionPackages.find(
                          (p) => p.id === currentSubscriptionPackageId
                        );
                        if (!currentPackage || !currentSubscriptionDetails)
                          return null;

                        // Calculate proration
                        const now = new Date();
                        const startDate = new Date(
                          currentSubscriptionDetails.startDate
                        );
                        const endDate = new Date(
                          currentSubscriptionDetails.endDate
                        );

                        // Calculate total days using standardized 30 days per month
                        const totalDays = currentPackage.duration * 30; // Standardized: months × 30 days

                        const daysUsedMs = now.getTime() - startDate.getTime();
                        const daysUsed = Math.max(
                          0,
                          Math.floor(daysUsedMs / (1000 * 60 * 60 * 24))
                        );
                        const daysRemaining = Math.max(0, totalDays - daysUsed);

                        const currentMonthlyRate =
                          currentPackage.price / currentPackage.duration;
                        const newMonthlyRate =
                          selectedDowngradePackage.price /
                          selectedDowngradePackage.duration;

                        // Calculate daily rates using standardized 30 days per month
                        const currentDailyRate =
                          currentPackage.price / totalDays;
                        const creditAmount =
                          Math.round(currentDailyRate * daysRemaining * 100) /
                          100;
                        const netAmount =
                          Math.round(
                            (selectedDowngradePackage.price - creditAmount) *
                              100
                          ) / 100;
                        const netCredit =
                          netAmount < 0 ? Math.abs(netAmount) : 0;

                        return (
                          <div
                            className="p-5 rounded-2xl border-2 space-y-4"
                            style={{
                              backgroundColor: withAlpha("#3b82f6", 0.08),
                              borderColor: withAlpha("#3b82f6", 0.3),
                            }}
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Calculator
                                className="w-5 h-5"
                                style={{ color: "#3b82f6" }}
                              />
                              <h4
                                className="text-lg font-bold"
                                style={{
                                  color:
                                    themeParams.text_color ||
                                    (isDarkMode ? "#ffffff" : "#111827"),
                                }}
                              >
                                {t("prorationBreakdown") ||
                                  "Proration Breakdown"}
                              </h4>
                            </div>

                            <div className="space-y-3">
                              {/* Days Information */}
                              <div className="flex justify-between items-center text-sm">
                                <span
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {t("daysUsed") || "Days Used"}:
                                </span>
                                <span
                                  className="font-semibold"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                  {daysUsed} / {totalDays} {t("days") || "days"}
                                </span>
                              </div>

                              {/* Credit Amount */}
                              {creditAmount > 0.01 && (
                                <div className="flex justify-between items-center text-sm">
                                  <span
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    {t("unusedTimeCredit") ||
                                      "Unused Time Credit"}
                                    :
                                  </span>
                                  <span
                                    className="font-semibold"
                                    style={{
                                      color: "#22c55e",
                                    }}
                                  >
                                    +
                                    {formatCurrencyValue(
                                      creditAmount,
                                      selectedDowngradePackage.currency
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* New Package Price */}
                              <div className="flex justify-between items-center text-sm">
                                <span
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {t("newPackagePrice") || "New Package Price"}:
                                </span>
                                <span
                                  className="font-semibold"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                  {formatCurrencyValue(
                                    selectedDowngradePackage.price,
                                    selectedDowngradePackage.currency
                                  )}
                                </span>
                              </div>

                              {/* Divider */}
                              <div
                                className="h-px my-2"
                                style={{
                                  backgroundColor: withAlpha("#3b82f6", 0.2),
                                }}
                              />

                              {/* Net Credit or Charge */}
                              {netCredit > 0 ? (
                                <div className="flex justify-between items-center">
                                  <span
                                    className="text-base font-bold"
                                    style={{
                                      color:
                                        themeParams.text_color ||
                                        (isDarkMode ? "#ffffff" : "#111827"),
                                    }}
                                  >
                                    {t("netCredit") || "Net Credit"}:
                                  </span>
                                  <span
                                    className="text-xl font-extrabold"
                                    style={{
                                      color: "#22c55e",
                                    }}
                                  >
                                    +
                                    {formatCurrencyValue(
                                      netCredit,
                                      selectedDowngradePackage.currency
                                    )}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex justify-between items-center">
                                  <span
                                    className="text-base font-bold"
                                    style={{
                                      color:
                                        themeParams.text_color ||
                                        (isDarkMode ? "#ffffff" : "#111827"),
                                    }}
                                  >
                                    {t("amountToCharge") || "Amount to Charge"}:
                                  </span>
                                  <span
                                    className="text-xl font-extrabold"
                                    style={{
                                      color: "#3b82f6",
                                    }}
                                  >
                                    {formatCurrencyValue(
                                      Math.abs(netAmount),
                                      selectedDowngradePackage.currency
                                    )}
                                  </span>
                                </div>
                              )}

                              {/* Calculation Details */}
                              <div
                                className="text-xs pt-2 border-t"
                                style={{
                                  borderColor: withAlpha("#3b82f6", 0.1),
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                <p className="leading-relaxed">
                                  {netCredit > 0
                                    ? t("downgradeCreditExplanation") ||
                                      `You've used ${daysUsed} of ${totalDays} days. You'll receive a credit of ${formatCurrencyValue(
                                        creditAmount,
                                        selectedDowngradePackage.currency
                                      )} for the remaining ${daysRemaining} days. After applying this credit to the new package price of ${formatCurrencyValue(
                                        selectedDowngradePackage.price,
                                        selectedDowngradePackage.currency
                                      )}, you'll receive a net credit of ${formatCurrencyValue(
                                        netCredit,
                                        selectedDowngradePackage.currency
                                      )} on your account.`
                                    : t("downgradeChargeExplanation") ||
                                      `You've used ${daysUsed} of ${totalDays} days. You'll receive a credit of ${formatCurrencyValue(
                                        creditAmount,
                                        selectedDowngradePackage.currency
                                      )} for the remaining ${daysRemaining} days. The new package costs ${formatCurrencyValue(
                                        selectedDowngradePackage.price,
                                        selectedDowngradePackage.currency
                                      )}, so you'll be charged ${formatCurrencyValue(
                                        Math.abs(netAmount),
                                        selectedDowngradePackage.currency
                                      )} today.`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Action Buttons - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-2 sticky bottom-0 bg-inherit pb-2 sm:pb-0">
                        <motion.button
                          onClick={() => {
                            if (!downgradeLoading) {
                              setShowDowngradeModal(false);
                              setSelectedDowngradePackage(null);
                            }
                          }}
                          disabled={downgradeLoading}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 px-6 py-4 sm:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg touch-manipulation min-h-[56px] sm:min-h-[48px]"
                          style={{
                            backgroundColor:
                              themeParams.secondary_bg_color ||
                              (isDarkMode
                                ? "rgba(255, 255, 255, 0.08)"
                                : "rgba(0, 0, 0, 0.04)"),
                            color:
                              themeParams.text_color ||
                              (isDarkMode ? "#ffffff" : "#111827"),
                            border: `2px solid ${
                              themeParams.section_separator_color ||
                              (isDarkMode
                                ? "rgba(55, 65, 81, 0.3)"
                                : "rgba(229, 231, 235, 0.5)")
                            }`,
                          }}
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          onClick={() =>
                            handleDowngrade(selectedDowngradePackage)
                          }
                          disabled={downgradeLoading}
                          whileTap={{ scale: 0.97 }}
                          className="flex-1 px-6 py-4 sm:py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl touch-manipulation min-h-[56px] sm:min-h-[48px]"
                          style={{
                            background: `linear-gradient(135deg, #3b82f6 0%, #2563eb 85%)`,
                            color: "#ffffff",
                            boxShadow: `0 15px 40px -10px ${withAlpha(
                              "#3b82f6",
                              0.6
                            )}`,
                          }}
                        >
                          {downgradeLoading ? (
                            <>
                              <RefreshCw className="w-5 h-5 animate-spin" />
                              <span className="text-base sm:text-sm">
                                Downgrading...
                              </span>
                            </>
                          ) : (
                            <>
                              <ArrowDown className="w-5 h-5" />
                              <span className="text-base sm:text-sm">
                                Downgrade
                              </span>
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

            {/* Elegant Cancel Subscription Modal - Redesigned */}
            {showCancelModal && currentSubscriptionDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(12px)",
                  paddingLeft: `${contentSafeAreaInset.left || 0}px`,
                  paddingRight: `${contentSafeAreaInset.right || 0}px`,
                }}
                onClick={() => {
                  if (!cancelLoading) {
                    setShowCancelModal(false);
                  }
                }}
              >
                <motion.div
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "100%", opacity: 0 }}
                  transition={{ type: "spring", damping: 30, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-lg sm:max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] border-2 border-b-0 sm:border-b-2 p-6 sm:p-8 md:p-10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.5)] sm:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] overflow-y-auto"
                  style={{
                    background: `linear-gradient(145deg, ${
                      themeParams.section_bg_color ||
                      themeParams.secondary_bg_color ||
                      (isDarkMode ? "#1f2937" : "#ffffff")
                    } 0%, ${
                      themeParams.secondary_bg_color ||
                      (isDarkMode ? "#111827" : "#f9fafb")
                    } 100%)`,
                    borderColor: isDarkMode
                      ? "rgba(100, 116, 139, 0.4)"
                      : "rgba(148, 163, 184, 0.3)",
                    backdropFilter: "blur(30px)",
                    paddingBottom: `${(safeAreaInset.bottom || 0) + 24}px`,
                  }}
                >
                  {/* Mobile drag handle */}
                  <div className="absolute top-3 left-1/2 transform -translate-x-1/2 sm:hidden">
                    <div
                      className="w-12 h-1.5 rounded-full"
                      style={{
                        backgroundColor:
                          themeParams.hint_color ||
                          (isDarkMode ? "#4b5563" : "#d1d5db"),
                      }}
                    />
                  </div>

                  {/* Elegant background effects */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div
                      className="absolute w-72 h-72 rounded-full blur-3xl -top-24 -right-24"
                      style={{
                        background: `radial-gradient(circle, ${withAlpha(
                          getThemeAccentColor(),
                          0.4
                        )} 0%, transparent 70%)`,
                      }}
                    />
                    <div
                      className="absolute w-64 h-64 rounded-full blur-3xl bottom-0 left-0"
                      style={{
                        background: `radial-gradient(circle, ${withAlpha(
                          getThemeAccentColor(),
                          0.3
                        )} 0%, transparent 70%)`,
                      }}
                    />
                  </div>

                  {/* Close button */}
                  <button
                    onClick={() => {
                      if (!cancelLoading) {
                        setShowCancelModal(false);
                      }
                    }}
                    disabled={cancelLoading}
                    className="absolute top-6 right-6 p-3 rounded-xl transition-all disabled:opacity-50 active:scale-95 z-20 shadow-lg touch-manipulation"
                    style={{
                      backgroundColor: withAlpha(
                        themeParams.hint_color || "#9ca3af",
                        0.1
                      ),
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                      minWidth: "44px",
                      minHeight: "44px",
                    }}
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="relative z-10 space-y-6 sm:space-y-8 mt-4 sm:mt-0">
                    {/* Elegant Header */}
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{
                          delay: 0.1,
                          type: "spring",
                          stiffness: 200,
                        }}
                        className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 sm:mb-6 rounded-3xl flex items-center justify-center shadow-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${
                            isDarkMode ? "#64748b" : "#94a3b8"
                          } 0%, ${isDarkMode ? "#475569" : "#64748b"} 50%, ${
                            isDarkMode ? "#334155" : "#475569"
                          } 100%)`,
                          boxShadow: `0 20px 40px -10px ${withAlpha(
                            "#64748b",
                            0.4
                          )}`,
                        }}
                      >
                        <Info className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-3 sm:mb-4 tracking-tight"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        {t("cancelSubscription") || "Cancel Subscription"}
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm sm:text-base md:text-lg font-medium max-w-2xl mx-auto leading-relaxed px-2"
                        style={{
                          color:
                            themeParams.hint_color ||
                            themeParams.subtitle_text_color ||
                            (isDarkMode ? "#d1d5db" : "#6b7280"),
                        }}
                      >
                        {t("cancelConfirmation") ||
                          "Your subscription will remain active until the end of your current billing period. You can reactivate anytime."}
                      </motion.p>
                    </div>

                    {/* Premium Subscription Details Card with Enhanced Design & Timeline */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="p-6 sm:p-8 rounded-3xl border-2 relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${
                          isDarkMode
                            ? "rgba(239, 68, 68, 0.18)"
                            : "rgba(239, 68, 68, 0.1)"
                        } 0%, ${
                          isDarkMode
                            ? "rgba(239, 68, 68, 0.1)"
                            : "rgba(239, 68, 68, 0.05)"
                        } 100%)`,
                        borderColor: isDarkMode
                          ? "rgba(239, 68, 68, 0.5)"
                          : "rgba(239, 68, 68, 0.35)",
                        boxShadow: `0 20px 60px -15px ${withAlpha(
                          isDarkMode ? "#ef4444" : "#dc2626",
                          0.3
                        )}`,
                      }}
                    >
                      {/* Animated background effect */}
                      <div className="absolute inset-0 opacity-5 pointer-events-none">
                        <div
                          className="absolute w-64 h-64 rounded-full blur-3xl top-0 right-0"
                          style={{
                            background: `radial-gradient(circle, ${
                              isDarkMode ? "#ef4444" : "#dc2626"
                            } 0%, transparent 70%)`,
                          }}
                        />
                      </div>

                      <div className="relative z-10 space-y-6">
                        {/* Package Info */}
                        <div className="flex items-center justify-between pb-5 border-b-2">
                          <div className="flex items-center gap-4">
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.5, type: "spring" }}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xl"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  isDarkMode ? "#ef4444" : "#dc2626"
                                } 0%, ${
                                  isDarkMode ? "#b91c1c" : "#b91c1c"
                                } 100%)`,
                                boxShadow: `0 10px 30px -10px ${withAlpha(
                                  isDarkMode ? "#ef4444" : "#dc2626",
                                  0.5
                                )}`,
                              }}
                            >
                              <Package className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                            </motion.div>
                            <div>
                              <span
                                className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] block mb-2"
                                style={{
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                {t("currentPackage") || "CURRENT PACKAGE"}
                              </span>
                              <span
                                className="text-xl sm:text-2xl font-extrabold block"
                                style={{
                                  color:
                                    themeParams.text_color ||
                                    (isDarkMode ? "#ffffff" : "#111827"),
                                }}
                              >
                                {currentSubscriptionDetails.packageName}
                              </span>
                            </div>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring" }}
                            className="px-4 py-2 rounded-xl border-2"
                              style={{
                                background: `linear-gradient(135deg, ${withAlpha(
                                isDarkMode ? "#ef4444" : "#dc2626",
                                0.15
                                )} 0%, ${withAlpha(
                                isDarkMode ? "#ef4444" : "#dc2626",
                                0.08
                                )} 100%)`,
                              borderColor: withAlpha(
                                isDarkMode ? "#ef4444" : "#dc2626",
                                0.3
                              ),
                              }}
                            >
                            <span
                              className="text-xs font-bold uppercase tracking-wide"
                                style={{
                                  color: isDarkMode ? "#f87171" : "#dc2626",
                                }}
                            >
                              {t("active") || "ACTIVE"}
                            </span>
                          </motion.div>
                            </div>

                        {/* Visual Timeline */}
                        {(() => {
                          const startDate = new Date(
                            currentSubscriptionDetails.startDate
                          );
                          const endDate = new Date(
                            currentSubscriptionDetails.endDate
                          );
                          const now = currentTime;
                          const totalDays = Math.floor(
                            (endDate.getTime() - startDate.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          const daysUsed = Math.max(
                            0,
                            Math.min(
                              totalDays,
                              Math.floor(
                                (now.getTime() - startDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )
                          );
                          const daysRemaining = Math.max(
                            0,
                            totalDays - daysUsed
                          );
                          const progressPercent =
                            totalDays > 0 ? (daysUsed / totalDays) * 100 : 0;

                          return (
                            <div className="space-y-4">
                              {/* Timeline Progress Bar */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                              <span
                                    className="text-xs font-bold uppercase tracking-wide"
                                style={{
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                    {t("subscriptionTimeline") ||
                                      "SUBSCRIPTION TIMELINE"}
                              </span>
                              <span
                                    className="text-xs font-bold"
                                style={{
                                      color: isDarkMode ? "#f87171" : "#dc2626",
                                }}
                              >
                                    {Math.round(progressPercent)}%{" "}
                                    {t("complete") || "COMPLETE"}
                              </span>
                            </div>
                                <div
                                  className="relative h-4 rounded-full overflow-hidden"
                                  style={{
                                    backgroundColor: withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.15
                                    ),
                                  }}
                                >
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progressPercent}%` }}
                                    transition={{
                                      duration: 1,
                                      delay: 0.7,
                                      ease: "easeOut",
                                    }}
                                    className="h-full rounded-full relative overflow-hidden"
                                    style={{
                                      background: `linear-gradient(90deg, ${
                                        isDarkMode ? "#ef4444" : "#dc2626"
                                      } 0%, ${
                                        isDarkMode ? "#b91c1c" : "#b91c1c"
                                      } 100%)`,
                                      boxShadow: `0 0 20px ${withAlpha(
                                        isDarkMode ? "#ef4444" : "#dc2626",
                                        0.5
                                      )}`,
                                    }}
                                  >
                                    <div className="absolute inset-0 bg-white opacity-20 animate-pulse" />
                                  </motion.div>
                          </div>
                        </div>

                              {/* Date Cards Grid */}
                              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                                {/* Start Date */}
                            <div
                                  className="p-4 rounded-2xl text-center border-2"
                              style={{
                                background: `linear-gradient(135deg, ${withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                  0.1
                                    )} 0%, ${withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.05
                                )} 100%)`,
                                    borderColor: withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.25
                                    ),
                              }}
                            >
                                  <div
                                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mb-2"
                                style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    {t("startDate") || "START"}
                                  </div>
                                  <div
                                    className="text-sm sm:text-base font-extrabold"
                                    style={{
                                      color:
                                        themeParams.text_color ||
                                        (isDarkMode ? "#ffffff" : "#111827"),
                                    }}
                                  >
                                    {startDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </div>
                                </div>

                                {/* Days Remaining - Highlighted */}
                                <div
                                  className="p-4 rounded-2xl text-center border-2 relative overflow-hidden"
                                  style={{
                                    background: `linear-gradient(135deg, ${
                                      isDarkMode ? "#ef4444" : "#dc2626"
                                    } 0%, ${
                                      isDarkMode ? "#b91c1c" : "#b91c1c"
                                    } 100%)`,
                                    borderColor: withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.5
                                    ),
                                    boxShadow: `0 10px 30px -10px ${withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.4
                                    )}`,
                                  }}
                                >
                                  <div className="absolute inset-0 opacity-10">
                                    <div
                                      className="absolute w-20 h-20 rounded-full blur-xl top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                      style={{
                                        background: `radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%)`,
                                }}
                              />
                            </div>
                                  <div className="relative z-10">
                                    <div className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mb-2 text-white opacity-90">
                                      {t("daysRemaining") || "DAYS LEFT"}
                                    </div>
                                    <div className="text-2xl sm:text-3xl font-extrabold text-white">
                                      {daysRemaining}
                                    </div>
                                  </div>
                                </div>

                                {/* End Date */}
                                <div
                                  className="p-4 rounded-2xl text-center border-2"
                                  style={{
                                    background: `linear-gradient(135deg, ${withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.1
                                    )} 0%, ${withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.05
                                    )} 100%)`,
                                    borderColor: withAlpha(
                                      isDarkMode ? "#ef4444" : "#dc2626",
                                      0.25
                                    ),
                                  }}
                                >
                                  <div
                                    className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide mb-2"
                                style={{
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                    {t("accessUntil") || "END DATE"}
                                  </div>
                                  <div
                                    className="text-sm sm:text-base font-extrabold"
                                style={{
                                  color: isDarkMode ? "#f87171" : "#dc2626",
                                }}
                              >
                                    {endDate.toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                            </div>
                          </div>
                        </div>
                            </div>
                          );
                        })()}
                      </div>
                    </motion.div>

                    {/* Enhanced Information Section with FAQs */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="space-y-4 sm:space-y-5"
                    >
                      {/* What Happens Next - Enhanced */}
                      <div
                        className="p-6 sm:p-7 rounded-3xl border-2 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${
                            isDarkMode
                              ? "rgba(59, 130, 246, 0.22)"
                              : "rgba(59, 130, 246, 0.14)"
                          } 0%, ${
                            isDarkMode
                              ? "rgba(59, 130, 246, 0.12)"
                              : "rgba(59, 130, 246, 0.08)"
                          } 100%)`,
                          borderColor: isDarkMode
                            ? "rgba(59, 130, 246, 0.5)"
                            : "rgba(59, 130, 246, 0.35)",
                          boxShadow: `0 15px 40px -10px ${withAlpha(
                            isDarkMode ? "#3b82f6" : "#2563eb",
                            0.25
                          )}`,
                        }}
                      >
                        {/* Background effect */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none">
                          <div
                            className="absolute w-56 h-56 rounded-full blur-3xl top-0 right-0"
                            style={{
                              background: `radial-gradient(circle, ${
                                isDarkMode ? "#3b82f6" : "#2563eb"
                              } 0%, transparent 70%)`,
                              }}
                            />
                          </div>

                        <div className="relative z-10">
                          <div className="flex items-start gap-4 mb-5">
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.6, type: "spring" }}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  isDarkMode ? "#3b82f6" : "#2563eb"
                                } 0%, ${
                                  isDarkMode ? "#1e40af" : "#1e3a8a"
                                } 100%)`,
                                boxShadow: `0 10px 30px -10px ${withAlpha(
                                  isDarkMode ? "#3b82f6" : "#2563eb",
                                  0.5
                                )}`,
                              }}
                            >
                              <Info className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                            </motion.div>
                          <div className="flex-1">
                            <p
                                className="text-lg sm:text-xl font-extrabold mb-3"
                              style={{
                                color: isDarkMode ? "#60a5fa" : "#2563eb",
                              }}
                            >
                                {t("whatHappensNext") || "What Happens Next?"}
                            </p>
                              <ul className="space-y-3">
                              {[
                                  {
                                    text:
                                      t("keepAccessUntilEnd") ||
                                "You'll keep full access until the end of your billing period",
                                    icon: Shield,
                                  },
                                  {
                                    text:
                                      t("noRefunds") ||
                                "No refunds will be issued for the remaining time",
                                    icon: CreditCard,
                                  },
                                  {
                                    text:
                                      t("noAutoRenewal") ||
                                "Your subscription will not renew automatically",
                                    icon: XCircle,
                                  },
                                  {
                                    text:
                                      t("canResubscribe") ||
                                "You can resubscribe anytime in the future",
                                    icon: RefreshCw,
                                  },
                              ].map((item, idx) => (
                                  <motion.li
                                  key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.7 + idx * 0.1 }}
                                    className="flex items-start gap-3"
                                  >
                                    <div
                                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                  style={{
                                        background: `linear-gradient(135deg, ${withAlpha(
                                          isDarkMode ? "#3b82f6" : "#2563eb",
                                          0.2
                                        )} 0%, ${withAlpha(
                                          isDarkMode ? "#3b82f6" : "#2563eb",
                                          0.1
                                        )} 100%)`,
                                  }}
                                >
                                      <item.icon
                                        className="w-4 h-4"
                                    style={{
                                          color: isDarkMode
                                        ? "#60a5fa"
                                        : "#2563eb",
                                    }}
                                  />
                                    </div>
                                    <span
                                      className="text-sm sm:text-base leading-relaxed flex-1"
                                      style={{
                                        color: isDarkMode
                                          ? "#93c5fd"
                                          : "#1e40af",
                                      }}
                                    >
                                      {item.text}
                                  </span>
                                  </motion.li>
                              ))}
                            </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Alternative Options - Enhanced */}
                      <div
                        className="p-6 sm:p-7 rounded-3xl border-2 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${
                            isDarkMode
                              ? "rgba(34, 197, 94, 0.18)"
                              : "rgba(34, 197, 94, 0.1)"
                          } 0%, ${
                            isDarkMode
                              ? "rgba(34, 197, 94, 0.1)"
                              : "rgba(34, 197, 94, 0.05)"
                          } 100%)`,
                          borderColor: isDarkMode
                            ? "rgba(34, 197, 94, 0.4)"
                            : "rgba(34, 197, 94, 0.3)",
                          boxShadow: `0 15px 40px -10px ${withAlpha(
                            isDarkMode ? "#22c55e" : "#16a34a",
                            0.25
                          )}`,
                        }}
                      >
                        {/* Background effect */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none">
                          <div
                            className="absolute w-56 h-56 rounded-full blur-3xl bottom-0 left-0"
                            style={{
                              background: `radial-gradient(circle, ${
                                isDarkMode ? "#22c55e" : "#16a34a"
                              } 0%, transparent 70%)`,
                              }}
                            />
                          </div>

                        <div className="relative z-10">
                          <div className="flex items-start gap-4">
                            <motion.div
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ delay: 0.8, type: "spring" }}
                              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  isDarkMode ? "#22c55e" : "#16a34a"
                                } 0%, ${
                                  isDarkMode ? "#15803d" : "#15803d"
                                } 100%)`,
                                boxShadow: `0 10px 30px -10px ${withAlpha(
                                  isDarkMode ? "#22c55e" : "#16a34a",
                                  0.5
                                )}`,
                              }}
                            >
                              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                            </motion.div>
                          <div className="flex-1">
                            <p
                                className="text-lg sm:text-xl font-extrabold mb-2"
                              style={{
                                color: isDarkMode ? "#4ade80" : "#16a34a",
                              }}
                            >
                                {t("considerAlternatives") ||
                                  "Consider These Alternatives"}
                            </p>
                            <p
                                className="text-sm sm:text-base leading-relaxed mb-4"
                              style={{
                                color: isDarkMode ? "#86efac" : "#15803d",
                              }}
                            >
                                {t("beforeCancelMessage") ||
                                  "Before you cancel, consider these options that might better suit your needs:"}
                            </p>
                              <ul className="space-y-3">
                              {[
                                  {
                                    text:
                                      t("downgradeOption") ||
                                "Downgrade to a lower tier plan",
                                    icon: TrendingUp,
                                  },
                                  {
                                    text:
                                      t("pauseOption") ||
                                "Pause your subscription temporarily",
                                    icon: Clock,
                                  },
                                  {
                                    text:
                                      t("contactSupport") ||
                                "Contact support for special arrangements",
                                    icon: HelpCircle,
                                  },
                              ].map((item, idx) => (
                                  <motion.li
                                  key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.9 + idx * 0.1 }}
                                    className="flex items-start gap-3"
                                  >
                                    <div
                                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                                  style={{
                                        background: `linear-gradient(135deg, ${withAlpha(
                                          isDarkMode ? "#22c55e" : "#16a34a",
                                          0.2
                                        )} 0%, ${withAlpha(
                                          isDarkMode ? "#22c55e" : "#16a34a",
                                          0.1
                                        )} 100%)`,
                                  }}
                                >
                                      <item.icon
                                        className="w-4 h-4"
                                    style={{
                                          color: isDarkMode
                                        ? "#4ade80"
                                        : "#16a34a",
                                    }}
                                  />
                                    </div>
                                    <span
                                      className="text-sm sm:text-base leading-relaxed flex-1"
                                      style={{
                                        color: isDarkMode
                                          ? "#86efac"
                                          : "#15803d",
                                      }}
                                    >
                                      {item.text}
                                  </span>
                                  </motion.li>
                              ))}
                            </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Elegant Action Buttons */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t-2 sticky bottom-0 bg-inherit pb-2 sm:pb-0"
                      style={{
                        borderColor: withAlpha(getThemeAccentColor(), 0.2),
                      }}
                    >
                      <motion.button
                        onClick={() => {
                          if (!cancelLoading) {
                            setShowCancelModal(false);
                          }
                        }}
                        disabled={cancelLoading}
                        whileTap={{ scale: 0.97 }}
                        className="flex-1 px-6 py-4 sm:py-5 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg relative overflow-hidden touch-manipulation min-h-[56px] sm:min-h-[52px]"
                        style={{
                          background: `linear-gradient(135deg, ${
                            themeParams.secondary_bg_color ||
                            (isDarkMode
                              ? "rgba(255, 255, 255, 0.1)"
                              : "rgba(0, 0, 0, 0.05)")
                          } 0%, ${
                            themeParams.secondary_bg_color ||
                            (isDarkMode
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.02)")
                          } 100%)`,
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                          border: `2px solid ${
                            themeParams.section_separator_color ||
                            (isDarkMode
                              ? "rgba(55, 65, 81, 0.4)"
                              : "rgba(229, 231, 235, 0.6)")
                          }`,
                        }}
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `radial-gradient(circle at center, ${
                                themeParams.secondary_bg_color ||
                                (isDarkMode
                                  ? "rgba(255, 255, 255, 0.1)"
                                  : "rgba(0, 0, 0, 0.05)")
                              } 0%, transparent 70%)`,
                            }}
                          />
                        </div>
                        <div className="relative z-10 flex items-center justify-center gap-3">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-base">
                            {t("keepSubscription") || "Keep Subscription"}
                          </span>
                        </div>
                      </motion.button>
                      <motion.button
                        onClick={handleCancel}
                        disabled={cancelLoading}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 px-8 py-5 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl relative overflow-hidden group"
                        style={{
                          background: `linear-gradient(135deg, ${
                            isDarkMode ? "#dc2626" : "#ef4444"
                          } 0%, ${isDarkMode ? "#b91c1c" : "#dc2626"} 50%, ${
                            isDarkMode ? "#991b1b" : "#b91c1c"
                          } 100%)`,
                          color: "#ffffff",
                          boxShadow: `0 20px 50px -15px ${withAlpha(
                            isDarkMode ? "#dc2626" : "#ef4444",
                            0.6
                          )}`,
                        }}
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div
                            className="absolute inset-0"
                            style={{
                              background: `radial-gradient(circle at center, rgba(255, 255, 255, 0.2) 0%, transparent 70%)`,
                            }}
                          />
                        </div>
                        <div className="relative z-10 flex items-center justify-center gap-3">
                          {cancelLoading ? (
                            <>
                              <RefreshCw className="w-6 h-6 animate-spin" />
                              <span className="text-base">
                                {t("cancelling") || "Cancelling..."}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-6 h-6" />
                              <span className="text-base">
                                {t("cancelSubscription") ||
                                  "Cancel Subscription"}
                              </span>
                            </>
                          )}
                        </div>
                      </motion.button>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Professional Payment Summary Section - Enhanced */}
            {(() => {
              const payments = studentData?.payments;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl p-5 sm:p-6 border-2 shadow-xl"
              style={{
                    background: `linear-gradient(135deg, ${withAlpha(
                      getThemeAccentColor(),
                      0.12
                    )} 0%, ${withAlpha(getThemeAccentColor(), 0.06)} 100%)`,
                    borderColor: withAlpha(getThemeAccentColor(), 0.3),
                    boxShadow: `0 20px 60px -15px ${withAlpha(
                      getThemeAccentColor(),
                      0.2
                    )}`,
              }}
            >
                  {/* Animated background */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div
                      className="absolute w-72 h-72 rounded-full blur-3xl -top-24 -right-24 animate-pulse"
                  style={{
                        background: `radial-gradient(circle, ${getThemeAccentColor()} 0%, transparent 70%)`,
                        animationDuration: "4s",
                      }}
                    />
                  </div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-5 sm:mb-6">
                      <div className="flex items-center gap-3">
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ delay: 0.1, type: "spring" }}
                          className="p-3 rounded-2xl shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${getThemeAccentColor()} 0%, ${withAlpha(
                              getThemeAccentColor(),
                              0.7
                            )} 100%)`,
                  }}
                >
                          <BarChart3 className="w-6 h-6 text-white" />
                        </motion.div>
                        <div>
                          <motion.h3
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl sm:text-2xl font-extrabold mb-1"
                    style={{
                              background: `linear-gradient(135deg, ${
                                themeParams.text_color ||
                                (isDarkMode ? "#ffffff" : "#111827")
                              } 0%, ${getThemeAccentColor()} 100%)`,
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                    }}
                          >
                            {t("paymentSummary") || "Payment Summary"}
                          </motion.h3>
                          <p
                            className="text-xs sm:text-sm font-medium"
                  style={{
                    color:
                                themeParams.hint_color ||
                                (isDarkMode ? "#9ca3af" : "#6b7280"),
                  }}
                >
                            {t("overviewOfPayments") ||
                              "Complete overview of your payment history"}
                          </p>
                        </div>
                      </div>
              </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      {/* Total Deposits */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="p-4 rounded-xl border-2 relative overflow-hidden"
                  style={{
                          background: `linear-gradient(135deg, ${withAlpha(
                            "#22c55e",
                            0.12
                          )} 0%, ${withAlpha("#22c55e", 0.06)} 100%)`,
                          borderColor: withAlpha("#22c55e", 0.3),
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy
                            className="w-4 h-4"
                            style={{ color: "#22c55e" }}
                          />
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color:
                        themeParams.hint_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {t("totalDeposits")}
                          </span>
                        </div>
                  <p
                          className="text-xl sm:text-2xl font-extrabold"
                          style={{ color: "#22c55e" }}
                  >
                    {formatCurrencyValue(
                            payments?.summary?.totalDeposits || 0,
                      studentData?.student?.classfeeCurrency || "ETB"
                    )}
                  </p>
                      </motion.div>

                      {/* Monthly Payments */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="p-4 rounded-xl border-2 relative overflow-hidden"
                  style={{
                          background: `linear-gradient(135deg, ${withAlpha(
                            "#3b82f6",
                            0.12
                          )} 0%, ${withAlpha("#3b82f6", 0.06)} 100%)`,
                          borderColor: withAlpha("#3b82f6", 0.3),
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Calendar
                            className="w-4 h-4"
                            style={{ color: "#3b82f6" }}
                          />
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color:
                        themeParams.hint_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {t("monthlyPayments")}
                          </span>
                        </div>
                  <p
                          className="text-xl sm:text-2xl font-extrabold"
                          style={{ color: "#3b82f6" }}
                  >
                    {formatCurrencyValue(
                            payments?.summary?.totalMonthlyPayments || 0,
                      studentData?.student?.classfeeCurrency || "ETB"
                    )}
                  </p>
                      </motion.div>

                      {/* Remaining Balance */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                        className="p-4 rounded-xl border-2 relative overflow-hidden"
                  style={{
                          background: `linear-gradient(135deg, ${withAlpha(
                            "#f59e0b",
                            0.12
                          )} 0%, ${withAlpha("#f59e0b", 0.06)} 100%)`,
                          borderColor: withAlpha("#f59e0b", 0.3),
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CreditCard
                            className="w-4 h-4"
                            style={{ color: "#f59e0b" }}
                          />
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color:
                        themeParams.hint_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {t("remainingBalance")}
                          </span>
                        </div>
                  <p
                          className="text-xl sm:text-2xl font-extrabold"
                          style={{ color: "#f59e0b" }}
                  >
                    {formatCurrencyValue(
                            payments?.summary?.remainingBalance || 0,
                      studentData?.student?.classfeeCurrency || "ETB"
                    )}
                  </p>
                      </motion.div>

                      {/* Paid Months */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="p-4 rounded-xl border-2 relative overflow-hidden"
                  style={{
                          background: `linear-gradient(135deg, ${withAlpha(
                            "#a855f7",
                            0.12
                          )} 0%, ${withAlpha("#a855f7", 0.06)} 100%)`,
                          borderColor: withAlpha("#a855f7", 0.3),
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle
                            className="w-4 h-4"
                            style={{ color: "#a855f7" }}
                          />
                          <span
                            className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{
                      color:
                        themeParams.hint_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    {t("paidMonths")}
                          </span>
                        </div>
                  <p
                          className="text-xl sm:text-2xl font-extrabold"
                          style={{ color: "#a855f7" }}
                  >
                          {payments?.summary?.paidMonths || 0}
                  </p>
                      </motion.div>
                </div>
              </div>
                </motion.div>
              );
            })()}

            {/* Deposit History - Mobile Optimized */}
            <div
              className="rounded-2xl border p-4 sm:p-5 shadow-sm"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
                borderColor:
                  themeParams.section_separator_color ||
                  (isDarkMode
                    ? "rgba(55, 65, 81, 0.3)"
                    : "rgba(229, 231, 235, 0.5)"),
              }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div
                    className="p-2 sm:p-2.5 rounded-xl flex-shrink-0"
                    style={{
                      backgroundColor:
                        themeParams.secondary_bg_color ||
                        (isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)"),
                    }}
                  >
                    <Trophy
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{
                        color:
                          themeParams.accent_text_color ||
                          themeParams.button_color ||
                          (isDarkMode ? "#60a5fa" : "#3b82f6"),
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-base sm:text-lg font-bold mb-0.5 truncate"
                      style={{
                        color:
                          themeParams.text_color ||
                          themeParams.section_header_text_color ||
                          (isDarkMode ? "#ffffff" : "#111827"),
                      }}
                    >
                      {t("depositHistory")}
                    </h3>
                    <p
                      className="text-[10px] sm:text-xs truncate"
                      style={{
                        color:
                          themeParams.hint_color ||
                          themeParams.subtitle_text_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    >
                      {t("recentDeposits") || "Recent payment deposits"}
                    </p>
                  </div>
                </div>
                <div
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ml-2"
                  style={{
                    backgroundColor:
                      themeParams.secondary_bg_color ||
                      (isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.02)"),
                    color:
                      themeParams.accent_text_color ||
                      themeParams.button_color ||
                      (isDarkMode ? "#60a5fa" : "#3b82f6"),
                    border: `1px solid ${
                      themeParams.section_separator_color ||
                      (isDarkMode
                        ? "rgba(55, 65, 81, 0.3)"
                        : "rgba(229, 231, 235, 0.5)")
                    }`,
                  }}
                >
                  {studentData?.payments?.deposits?.length || 0}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                {studentData?.payments?.deposits
                  ?.slice(0, 5)
                  .map((deposit: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all active:shadow-md touch-manipulation"
                      style={{
                        backgroundColor:
                          themeParams.section_bg_color ||
                          themeParams.secondary_bg_color ||
                          (isDarkMode ? "#1f2937" : "#ffffff"),
                        borderColor:
                          themeParams.section_separator_color ||
                          (isDarkMode
                            ? "rgba(55, 65, 81, 0.3)"
                            : "rgba(229, 231, 235, 0.5)"),
                        borderLeftWidth: "3px",
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
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 sm:mb-2.5 flex-wrap">
                            {/* Show credit indicator and negative amount for credits */}
                            {deposit.isCredit ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-green-500">
                                  +
                                </span>
                                <p
                                  className="text-base sm:text-lg font-bold"
                                  style={{
                                    color: isDarkMode ? "#22c55e" : "#16a34a",
                                  }}
                                >
                                  {formatCurrencyValue(
                                    deposit.amount,
                                    deposit.currency ||
                                      studentData?.student?.classfeeCurrency ||
                                      "ETB"
                                  )}
                                </p>
                                <span
                                  className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase"
                                  style={{
                                    backgroundColor: isDarkMode
                                      ? "rgba(34, 197, 94, 0.2)"
                                      : "rgba(34, 197, 94, 0.15)",
                                    color: isDarkMode ? "#22c55e" : "#16a34a",
                                  }}
                                >
                                  {t("credit") || "CREDIT"}
                                </span>
                              </div>
                            ) : (
                              <p
                                className="text-base sm:text-lg font-bold"
                              style={{
                                color:
                                  deposit.status === "Approved"
                                    ? isDarkMode
                                      ? "#22c55e"
                                      : "#16a34a"
                                    : themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                              }}
                            >
                              {formatCurrencyValue(
                                deposit.amount,
                                deposit.currency ||
                                  studentData?.student?.classfeeCurrency ||
                                  "ETB"
                              )}
                            </p>
                            )}
                            {/* Gateway badge */}
                            {deposit.source && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold"
                                style={{
                                  backgroundColor:
                                    themeParams.secondary_bg_color ||
                                    (isDarkMode
                                      ? "rgba(255, 255, 255, 0.05)"
                                      : "rgba(0, 0, 0, 0.02)"),
                                  color:
                                    deposit.source === "chapa"
                                      ? "#0f766e"
                                      : deposit.source === "stripe"
                                      ? "#635bff"
                                      : themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  border: `1px solid ${
                                    themeParams.section_separator_color ||
                                    (isDarkMode
                                      ? "rgba(55, 65, 81, 0.2)"
                                      : "rgba(229, 231, 235, 0.3)")
                                  }`,
                                }}
                              >
                                <span
                                  className="w-2.5 h-2.5 rounded-full inline-flex items-center justify-center font-extrabold text-[6px]"
                                  style={{
                                    backgroundColor:
                                      deposit.source === "chapa"
                                        ? "#0f766e"
                                        : deposit.source === "stripe"
                                        ? "#635bff"
                                        : isDarkMode
                                        ? "#4b5563"
                                        : "#9ca3af",
                                    color: "#ffffff",
                                  }}
                                >
                                  {deposit.source === "chapa"
                                    ? "C"
                                    : deposit.source === "stripe"
                                    ? "S"
                                    : "M"}
                                </span>
                                {deposit.source === "chapa"
                                  ? t("chapa") || "Chapa"
                                  : deposit.source === "stripe"
                                  ? t("stripe") || "Stripe"
                                  : t("manual") || "Manual"}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs sm:text-sm font-medium mb-1 sm:mb-1.5 line-clamp-2"
                            style={{
                              color:
                                themeParams.text_color ||
                                (isDarkMode ? "#e5e7eb" : "#374151"),
                            }}
                          >
                            {deposit.reason}
                          </p>
                          {deposit.transactionId && (
                            <p
                              className="text-[9px] sm:text-[10px] font-mono truncate"
                              style={{
                                color:
                                  themeParams.hint_color ||
                                  themeParams.subtitle_text_color ||
                                  (isDarkMode ? "#9ca3af" : "#6b7280"),
                              }}
                            >
                              {t("transactionId")}: {deposit.transactionId}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 sm:gap-1.5 flex-shrink-0">
                          <div
                            className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold whitespace-nowrap"
                            style={{
                              backgroundColor:
                                deposit.status === "Approved"
                                  ? isDarkMode
                                    ? "rgba(34, 197, 94, 0.15)"
                                    : "rgba(34, 197, 94, 0.1)"
                                  : deposit.status === "pending"
                                  ? isDarkMode
                                    ? "rgba(245, 158, 11, 0.15)"
                                    : "rgba(245, 158, 11, 0.1)"
                                  : isDarkMode
                                  ? "rgba(239, 68, 68, 0.15)"
                                  : "rgba(239, 68, 68, 0.1)",
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
                            {t(deposit.status.toLowerCase())}
                          </div>
                          <p
                            className="text-[9px] sm:text-[10px] font-medium whitespace-nowrap"
                            style={{
                              color:
                                themeParams.hint_color ||
                                themeParams.subtitle_text_color ||
                                (isDarkMode ? "#9ca3af" : "#6b7280"),
                            }}
                          >
                            {new Date(deposit.date).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                {(!studentData?.payments?.deposits ||
                  studentData.payments.deposits.length === 0) && (
                  <div
                    className="p-6 rounded-xl text-center border border-dashed"
                    style={{
                      backgroundColor:
                        themeParams.secondary_bg_color ||
                        (isDarkMode
                          ? "rgba(255, 255, 255, 0.02)"
                          : "rgba(0, 0, 0, 0.01)"),
                      borderColor:
                        themeParams.section_separator_color ||
                        (isDarkMode
                          ? "rgba(55, 65, 81, 0.3)"
                          : "rgba(229, 231, 235, 0.5)"),
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                    }}
                  >
                    <CreditCard
                      className="w-10 h-10 mx-auto mb-2 opacity-40"
                      style={{
                        color:
                          themeParams.hint_color ||
                          (isDarkMode ? "#6b7280" : "#9ca3af"),
                      }}
                    />
                    <p className="text-sm font-medium">{t("noPayments")}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Payment History - Mobile Optimized */}
            <div
              className="rounded-2xl border p-4 sm:p-5 shadow-sm"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
                borderColor:
                  themeParams.section_separator_color ||
                  (isDarkMode
                    ? "rgba(55, 65, 81, 0.3)"
                    : "rgba(229, 231, 235, 0.5)"),
              }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div
                    className="p-2 sm:p-2.5 rounded-xl flex-shrink-0"
                    style={{
                      backgroundColor:
                        themeParams.secondary_bg_color ||
                        (isDarkMode
                          ? "rgba(255, 255, 255, 0.05)"
                          : "rgba(0, 0, 0, 0.02)"),
                    }}
                  >
                    <Calendar
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{
                        color:
                          themeParams.accent_text_color ||
                          themeParams.button_color ||
                          (isDarkMode ? "#60a5fa" : "#3b82f6"),
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="text-base sm:text-lg font-bold mb-0.5 truncate"
                      style={{
                        color:
                          themeParams.text_color ||
                          themeParams.section_header_text_color ||
                          (isDarkMode ? "#ffffff" : "#111827"),
                      }}
                    >
                      {t("monthlyBreakdown")}
                    </h3>
                    <p
                      className="text-[10px] sm:text-xs truncate"
                      style={{
                        color:
                          themeParams.hint_color ||
                          themeParams.subtitle_text_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    >
                      {t("monthlyPaymentHistory") ||
                        "Monthly payment breakdown"}
                    </p>
                  </div>
                </div>
                <div
                  className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold flex-shrink-0 ml-2"
                  style={{
                    backgroundColor:
                      themeParams.secondary_bg_color ||
                      (isDarkMode
                        ? "rgba(255, 255, 255, 0.05)"
                        : "rgba(0, 0, 0, 0.02)"),
                    color:
                      themeParams.accent_text_color ||
                      themeParams.button_color ||
                      (isDarkMode ? "#60a5fa" : "#3b82f6"),
                    border: `1px solid ${
                      themeParams.section_separator_color ||
                      (isDarkMode
                        ? "rgba(55, 65, 81, 0.3)"
                        : "rgba(229, 231, 235, 0.5)")
                    }`,
                  }}
                >
                  {studentData?.payments?.summary?.paidMonths || 0}/
                  {studentData?.payments?.monthlyPayments?.length || 0}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                {studentData?.payments?.monthlyPayments
                  ?.slice(0, 8)
                  .map((payment: any, index: number) => {
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
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        whileTap={{ scale: 0.98 }}
                        className={`relative overflow-hidden rounded-xl border p-3 sm:p-4 transition-all active:shadow-md touch-manipulation ${
                          isCurrentMonth ? "ring-1" : ""
                        }`}
                        style={{
                          backgroundColor:
                            themeParams.section_bg_color ||
                            themeParams.secondary_bg_color ||
                            (isDarkMode ? "#1f2937" : "#ffffff"),
                          borderColor:
                            themeParams.section_separator_color ||
                            (isDarkMode
                              ? "rgba(55, 65, 81, 0.3)"
                              : "rgba(229, 231, 235, 0.5)"),
                          borderLeftWidth: "3px",
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
                            ringColor:
                              themeParams.button_color ||
                              themeParams.accent_text_color ||
                              "#3b82f6",
                          }),
                        }}
                      >
                        {isCurrentMonth && (
                          <div
                            className="absolute -top-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[8px] font-bold"
                            style={{
                              backgroundColor:
                                themeParams.button_color ||
                                themeParams.accent_text_color ||
                                "#3b82f6",
                              color: "#ffffff",
                            }}
                          >
                            {t("current") || "CURRENT"}
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2.5">
                              <div
                                className="p-1.5 rounded-lg flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    themeParams.secondary_bg_color ||
                                    (isDarkMode
                                      ? "rgba(255, 255, 255, 0.05)"
                                      : "rgba(0, 0, 0, 0.02)"),
                                }}
                              >
                                <Calendar
                                  className="w-3.5 h-3.5"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                />
                              </div>
                              <p
                                className="text-sm font-bold truncate"
                                style={{
                                  color:
                                    themeParams.text_color ||
                                    (isDarkMode ? "#ffffff" : "#111827"),
                                }}
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
                                  className="w-3.5 h-3.5 flex-shrink-0"
                                  style={{
                                    color: isDarkMode ? "#a855f7" : "#9333ea",
                                  }}
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <div>
                                <p
                                  className="font-medium mb-1"
                                  style={{
                                    color:
                                      themeParams.hint_color ||
                                      themeParams.subtitle_text_color ||
                                      (isDarkMode ? "#9ca3af" : "#6b7280"),
                                  }}
                                >
                                  {t("amount")}
                                </p>
                                <p
                                  className="text-base font-bold"
                                  style={{
                                    color:
                                      themeParams.text_color ||
                                      (isDarkMode ? "#ffffff" : "#111827"),
                                  }}
                                >
                                  {isFree
                                    ? t("freeMonth")
                                    : formatCurrencyValue(
                                        payment.amount,
                                        studentData?.student
                                          ?.classfeeCurrency || "ETB"
                                      )}
                                </p>
                              </div>
                              {isFree && payment.freeReason && (
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="font-medium mb-1"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        themeParams.subtitle_text_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    {t("reason")}
                                  </p>
                                  <p
                                    className="text-xs truncate"
                                    style={{
                                      color: isDarkMode ? "#a855f7" : "#9333ea",
                                    }}
                                  >
                                    {payment.freeReason}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <div
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5"
                              style={{
                                backgroundColor:
                                  themeParams.secondary_bg_color ||
                                  (isDarkMode
                                    ? "rgba(255, 255, 255, 0.05)"
                                    : "rgba(0, 0, 0, 0.02)"),
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
                                border: `1px solid ${
                                  isFree
                                    ? isDarkMode
                                      ? "rgba(168, 85, 247, 0.3)"
                                      : "rgba(168, 85, 247, 0.25)"
                                    : isPartial
                                    ? isDarkMode
                                      ? "rgba(59, 130, 246, 0.3)"
                                      : "rgba(59, 130, 246, 0.25)"
                                    : isPaid
                                    ? isDarkMode
                                      ? "rgba(34, 197, 94, 0.3)"
                                      : "rgba(34, 197, 94, 0.25)"
                                    : isDarkMode
                                    ? "rgba(245, 158, 11, 0.3)"
                                    : "rgba(245, 158, 11, 0.25)"
                                }`,
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
                              <span className="whitespace-nowrap">
                                {isFree
                                  ? t("freeMonth")
                                  : isPartial
                                  ? t("partialPayment")
                                  : t(payment.status.toLowerCase())}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                {(!studentData?.payments?.monthlyPayments ||
                  studentData.payments.monthlyPayments.length === 0) && (
                  <div
                    className="p-6 rounded-xl text-center border border-dashed"
                    style={{
                      backgroundColor:
                        themeParams.secondary_bg_color ||
                        (isDarkMode
                          ? "rgba(255, 255, 255, 0.02)"
                          : "rgba(0, 0, 0, 0.01)"),
                      borderColor:
                        themeParams.section_separator_color ||
                        (isDarkMode
                          ? "rgba(55, 65, 81, 0.3)"
                          : "rgba(229, 231, 235, 0.5)"),
                    }}
                  >
                    <div
                      className="w-12 h-12 mx-auto mb-3 rounded-full flex items-center justify-center"
                      style={{
                        backgroundColor:
                          themeParams.secondary_bg_color ||
                          (isDarkMode
                            ? "rgba(255, 255, 255, 0.05)"
                            : "rgba(0, 0, 0, 0.02)"),
                      }}
                    >
                      <Calendar
                        className="w-6 h-6 opacity-50"
                        style={{
                          color:
                            themeParams.hint_color ||
                            themeParams.subtitle_text_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      />
                    </div>
                    <p
                      className="text-sm font-medium mb-1"
                      style={{
                        color:
                          themeParams.text_color ||
                          (isDarkMode ? "#ffffff" : "#111827"),
                      }}
                    >
                      {t("noPayments") || "No payment history"}
                    </p>
                    <p
                      className="text-xs"
                      style={{
                        color:
                          themeParams.hint_color ||
                          themeParams.subtitle_text_color ||
                          (isDarkMode ? "#9ca3af" : "#6b7280"),
                      }}
                    >
                      {t("noMonthlyPayments") ||
                        "Monthly payment records will appear here"}
                    </p>
                  </div>
                )}
              </div>
            </div>
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
              className="p-4 rounded-2xl"
              style={{
                backgroundColor:
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  themeParams.bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff"),
              }}
            >
              <h3
                className="text-lg font-semibold mb-4 flex items-center gap-2"
                style={{
                  color:
                    themeParams.text_color ||
                    themeParams.section_header_text_color ||
                    (isDarkMode ? "#ffffff" : "#111827"),
                }}
              >
                <Clock className="w-5 h-5" />
                {t("scheduledTimes")}
              </h3>
              <div className="space-y-2">
                {studentData?.occupiedTimes
                  ?.slice(0, 10)
                  .map((time: any, index: number) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl shadow-sm border"
                      style={{
                        backgroundColor:
                          themeParams.section_bg_color ||
                          themeParams.secondary_bg_color ||
                          (isDarkMode ? "#1f2937" : "#ffffff"),
                        borderColor:
                          themeParams.section_separator_color ||
                          (isDarkMode
                            ? "rgba(55, 65, 81, 0.3)"
                            : "rgba(229, 231, 235, 0.5)"),
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock
                              className={`w-4 h-4 ${
                                isDarkMode ? "text-blue-400" : "text-blue-600"
                              }`}
                            />
                            <p
                              className="text-sm font-semibold"
                              style={{
                                color:
                                  themeParams.text_color ||
                                  (isDarkMode ? "#ffffff" : "#111827"),
                              }}
                            >
                              {time.timeSlot}
                            </p>
                          </div>
                          <p
                            className={`text-xs ${
                              themeParams.hint_color ||
                              themeParams.subtitle_text_color ||
                              (isDarkMode ? "#9ca3af" : "#6b7280")
                            }`}
                          >
                            {formatDayPackage(time.dayPackage)} • {time.teacher}
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
                                themeParams.hint_color ||
                                themeParams.subtitle_text_color ||
                                (isDarkMode ? "#9ca3af" : "#6b7280")
                              }`}
                            >
                              {t ? t("until") : "Until"} {time.endAt}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                {(!studentData?.occupiedTimes ||
                  studentData.occupiedTimes.length === 0) && (
                  <div
                    className="p-4 rounded-xl text-center border shadow-sm"
                    style={{
                      backgroundColor:
                        themeParams.section_bg_color ||
                        themeParams.secondary_bg_color ||
                        (isDarkMode ? "#1f2937" : "#ffffff"),
                      borderColor:
                        themeParams.section_separator_color ||
                        (isDarkMode
                          ? "rgba(55, 65, 81, 0.3)"
                          : "rgba(229, 231, 235, 0.5)"),
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#d1d5db" : "#4b5563"),
                    }}
                  >
                    {t ? t("noSchedule") : "No scheduled times found"}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

        {/* Payment Summary Modal - Shows unpaid months before Chapa payment */}
        {showPaymentSummaryModal && pendingPaymentAmount && studentData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(12px)",
            }}
            onClick={() => {
              if (!checkoutLoading) {
                setShowPaymentSummaryModal(false);
                setPendingPaymentAmount(null);
                setUnpaidMonthsData([]);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-[2.5rem] border-2 p-8 md:p-10 shadow-[0_40px_100px_-20px_rgba(15,118,110,0.5)] overflow-hidden my-8"
              style={{
                background: `linear-gradient(145deg, ${
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff")
                } 0%, ${
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#111827" : "#f9fafb")
                } 50%, ${
                  themeParams.section_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff")
                } 100%)`,
                borderColor: "rgba(15, 118, 110, 0.5)",
                backdropFilter: "blur(30px)",
              }}
            >
              {/* Background effects */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <div
                  className="absolute w-96 h-96 rounded-full blur-3xl -top-32 -right-32 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, rgba(15, 118, 110, 0.7) 0%, transparent 70%)`,
                    animationDuration: "4s",
                  }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={() => {
                  if (!checkoutLoading) {
                    setShowPaymentSummaryModal(false);
                    setPendingPaymentAmount(null);
                    setUnpaidMonthsData([]);
                  }
                }}
                disabled={checkoutLoading}
                className="absolute top-6 right-6 p-3 rounded-xl transition-all disabled:opacity-50 hover:scale-110 active:scale-95 z-20 shadow-lg"
                style={{
                  backgroundColor: "rgba(15, 118, 110, 0.15)",
                  color:
                    themeParams.text_color ||
                    (isDarkMode ? "#ffffff" : "#111827"),
                }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0d9488 100%)`,
                      boxShadow: `0 25px 50px -15px rgba(15, 118, 110, 0.6)`,
                    }}
                  >
                    <CreditCard className="w-12 h-12 text-white" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
                    style={{
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                    }}
                  >
                    {t("paymentSummary") || "Payment Summary"}
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-lg font-medium max-w-2xl mx-auto leading-relaxed"
                    style={{
                      color:
                        themeParams.hint_color ||
                        themeParams.subtitle_text_color ||
                        (isDarkMode ? "#d1d5db" : "#6b5563"),
                    }}
                  >
                    {t("reviewPaymentDetails") ||
                      "Review your payment details before proceeding"}
                  </motion.p>
                </div>

                {/* Payment Amount */}
                <div
                  className="p-6 rounded-2xl border-2 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(15, 118, 110, 0.15) 0%, rgba(15, 118, 110, 0.08) 100%)`,
                    borderColor: "rgba(15, 118, 110, 0.3)",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className="text-sm font-semibold mb-1 uppercase tracking-wide"
                        style={{
                          color:
                            themeParams.hint_color ||
                            (isDarkMode ? "#9ca3af" : "#6b7280"),
                        }}
                      >
                        {t("paymentAmount") || "Payment Amount"}
                      </p>
                      <p
                        className="text-3xl font-extrabold"
                        style={{
                          color: "#0f766e",
                        }}
                      >
                        {formatCurrencyValue(
                          pendingPaymentAmount,
                          studentData.student.classfeeCurrency || "ETB"
                        )}
                      </p>
                    </div>
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)`,
                      }}
                    >
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </div>

                {/* Unpaid Months List */}
                {unpaidMonthsData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4
                        className="text-lg font-bold"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        {t("unpaidMonths") || "Unpaid Months"}
                      </h4>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          color: "#ef4444",
                        }}
                      >
                        {unpaidMonthsData.length}{" "}
                        {unpaidMonthsData.length === 1
                          ? t("month") || "month"
                          : t("months") || "months"}
                      </span>
                    </div>

                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {unpaidMonthsData.map((month, idx) => (
                        <motion.div
                          key={month.month}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          className="p-4 rounded-xl border-2 flex items-center justify-between"
                          style={{
                            backgroundColor: isDarkMode
                              ? "rgba(239, 68, 68, 0.1)"
                              : "rgba(239, 68, 68, 0.05)",
                            borderColor: "rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{
                                backgroundColor: "rgba(239, 68, 68, 0.2)",
                              }}
                            >
                              <Calendar
                                className="w-5 h-5"
                                style={{ color: "#ef4444" }}
                              />
                            </div>
                            <div>
                              <p
                                className="font-semibold"
                                style={{
                                  color:
                                    themeParams.text_color ||
                                    (isDarkMode ? "#ffffff" : "#111827"),
                                }}
                              >
                                {month.monthName}
                              </p>
                              {month.isPartial &&
                                month.paidAmount !== undefined && (
                                  <p
                                    className="text-xs"
                                    style={{
                                      color:
                                        themeParams.hint_color ||
                                        (isDarkMode ? "#9ca3af" : "#6b7280"),
                                    }}
                                  >
                                    {t("partialPayment") || "Partial"}:{" "}
                                    {formatCurrencyValue(
                                      month.paidAmount,
                                      studentData.student.classfeeCurrency ||
                                        "ETB"
                                    )}{" "}
                                    {t("paid") || "paid"}
                                  </p>
                                )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p
                              className="text-lg font-bold"
                              style={{ color: "#ef4444" }}
                            >
                              {formatCurrencyValue(
                                month.amount,
                                studentData.student.classfeeCurrency || "ETB"
                              )}
                            </p>
                            {month.isPartial && (
                              <p
                                className="text-xs"
                                style={{
                                  color:
                                    themeParams.hint_color ||
                                    (isDarkMode ? "#9ca3af" : "#6b7280"),
                                }}
                              >
                                {t("remaining") || "remaining"}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Total Unpaid Amount */}
                    <div
                      className="p-4 rounded-xl border-2 flex items-center justify-between"
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(239, 68, 68, 0.1)",
                        borderColor: "rgba(239, 68, 68, 0.4)",
                      }}
                    >
                      <p
                        className="font-bold"
                        style={{
                          color:
                            themeParams.text_color ||
                            (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        {t("totalUnpaid") || "Total Unpaid Amount"}
                      </p>
                      <p
                        className="text-xl font-extrabold"
                        style={{ color: "#ef4444" }}
                      >
                        {formatCurrencyValue(
                          unpaidMonthsData.reduce(
                            (sum, month) => sum + month.amount,
                            0
                          ),
                          studentData.student.classfeeCurrency || "ETB"
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div
                  className="p-4 rounded-2xl border-2 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${
                      isDarkMode
                        ? "rgba(245, 158, 11, 0.2)"
                        : "rgba(245, 158, 11, 0.12)"
                    } 0%, ${
                      isDarkMode
                        ? "rgba(245, 158, 11, 0.1)"
                        : "rgba(245, 158, 11, 0.06)"
                    } 100%)`,
                    borderColor: isDarkMode
                      ? "rgba(245, 158, 11, 0.4)"
                      : "rgba(245, 158, 11, 0.3)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        backgroundColor: isDarkMode
                          ? "rgba(245, 158, 11, 0.2)"
                          : "rgba(245, 158, 11, 0.15)",
                      }}
                    >
                      <Info
                        className="w-5 h-5"
                        style={{
                          color: isDarkMode ? "#fbbf24" : "#d97706",
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p
                        className="text-sm font-bold mb-1"
                        style={{
                          color: isDarkMode ? "#fbbf24" : "#d97706",
                        }}
                      >
                        {t("paymentInfo") || "Payment Information"}
                      </p>
                      <p
                        className="text-xs leading-relaxed"
                        style={{
                          color: isDarkMode ? "#fcd34d" : "#92400e",
                        }}
                      >
                        {t("depositAutoApplyInfo") ||
                          "After payment confirmation, your deposit will be automatically applied to unpaid months (past and future, up to 12 months ahead)."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Terms of Service Agreement */}
                <div className="p-4 rounded-2xl border-2 relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, rgba(15, 118, 110, 0.08) 0%, rgba(15, 118, 110, 0.04) 100%)`,
                    borderColor: "rgba(15, 118, 110, 0.2)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="terms-agreement"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-2 focus:ring-2 focus:ring-teal-500"
                      style={{
                        accentColor: "#0f766e",
                        borderColor: themeParams.section_separator_color || (isDarkMode ? "rgba(55, 65, 81, 0.3)" : "rgba(229, 231, 235, 0.5)"),
                      }}
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="terms-agreement"
                        className="text-sm font-medium cursor-pointer leading-relaxed"
                        style={{
                          color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827"),
                        }}
                      >
                        I agree to the{" "}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="underline font-semibold hover:text-teal-600 transition-colors"
                          style={{
                            color: "#0f766e",
                          }}
                        >
                          DarulKubra Terms of Service & Policies
                        </button>
                        {" "}and understand the payment terms.
                      </label>
                      {!termsAccepted && (
                        <p className="text-xs mt-2 font-medium" style={{ color: "#ef4444" }}>
                          You must agree to the terms before proceeding with payment.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <motion.button
                    onClick={() => {
                      if (!checkoutLoading) {
                        setShowPaymentSummaryModal(false);
                        setPendingPaymentAmount(null);
                        setUnpaidMonthsData([]);
                      }
                    }}
                    disabled={checkoutLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 shadow-lg"
                    style={{
                      backgroundColor:
                        themeParams.secondary_bg_color ||
                        (isDarkMode
                          ? "rgba(255, 255, 255, 0.08)"
                          : "rgba(0, 0, 0, 0.04)"),
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                      border: `2px solid ${
                        themeParams.section_separator_color ||
                        (isDarkMode
                          ? "rgba(55, 65, 81, 0.3)"
                          : "rgba(229, 231, 235, 0.5)")
                      }`,
                    }}
                  >
                    {t("cancel") || "Cancel"}
                  </motion.button>
                  <motion.button
                    onClick={handleInitiateDeposit}
                    disabled={checkoutLoading || !termsAccepted}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-6 py-4 rounded-2xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)`,
                      color: "#ffffff",
                      boxShadow: `0 15px 40px -10px rgba(15, 118, 110, 0.6)`,
                    }}
                  >
                    {checkoutLoading ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>{t("processing") || "Processing..."}</span>
                      </>
                    ) : (
                      <>
                        <span
                          className="w-5 h-5 rounded-full inline-flex items-center justify-center font-extrabold"
                          style={{
                            backgroundColor: "#ffffff",
                            color: "#0f766e",
                            lineHeight: 1,
                            fontSize: "10px",
                          }}
                        >
                          C
                        </span>
                        <span>{t("payWithChapa") || "Pay with Chapa"}</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Terms of Service Modal */}
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              backdropFilter: "blur(12px)",
            }}
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] border-2 p-8 md:p-10 shadow-[0_40px_100px_-20px_rgba(15,118,110,0.5)] overflow-hidden my-8 overflow-y-auto"
              style={{
                background: `linear-gradient(145deg, ${
                  themeParams.section_bg_color ||
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff")
                } 0%, ${
                  themeParams.secondary_bg_color ||
                  (isDarkMode ? "#111827" : "#f9fafb")
                } 50%, ${
                  themeParams.section_bg_color ||
                  (isDarkMode ? "#1f2937" : "#ffffff")
                } 100%)`,
                borderColor: "rgba(15, 118, 110, 0.5)",
                backdropFilter: "blur(30px)",
              }}
            >
              {/* Background effects */}
              <div className="absolute inset-0 opacity-15 pointer-events-none">
                <div
                  className="absolute w-96 h-96 rounded-full blur-3xl -top-32 -right-32 animate-pulse"
                  style={{
                    background: `radial-gradient(circle, rgba(15, 118, 110, 0.7) 0%, transparent 70%)`,
                    animationDuration: "4s",
                  }}
                />
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowTermsModal(false)}
                className="absolute top-6 right-6 p-3 rounded-xl transition-all hover:scale-110 active:scale-95 z-20 shadow-lg"
                style={{
                  backgroundColor: "rgba(15, 118, 110, 0.15)",
                  color:
                    themeParams.text_color ||
                    (isDarkMode ? "#ffffff" : "#111827"),
                }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative z-10 space-y-6">
                {/* Header */}
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      delay: 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center shadow-2xl"
                    style={{
                      background: `linear-gradient(135deg, #0f766e 0%, #14b8a6 50%, #0d9488 100%)`,
                      boxShadow: `0 25px 50px -15px rgba(15, 118, 110, 0.6)`,
                    }}
                  >
                    <FileText className="w-12 h-12 text-white" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight"
                    style={{
                      color:
                        themeParams.text_color ||
                        (isDarkMode ? "#ffffff" : "#111827"),
                    }}
                  >
                    DarulKubra – Terms of Service & Policies
                  </motion.h3>
                </div>

                {/* Terms Content */}
                <div className="space-y-6 text-sm leading-relaxed max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      1. Terms of Service
                    </h4>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      By using DarulKubra's website, mobile applications, dashboards, or related services, you agree to the following:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>You will use DarulKubra services only for lawful purposes.</li>
                      <li>DarulKubra may update these terms from time to time; continued use constitutes acceptance of the most recent version.</li>
                      <li>DarulKubra is not liable for service interruptions or issues caused by misuse, technical failures outside our control, or third-party providers relied upon for service delivery.</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      2. Data Usage Policy
                    </h4>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      No Selling of Data
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      DarulKubra does not sell or rent personal information to third parties.
                    </p>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Limited Sharing
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Data may be shared with trusted third-party service providers (such as SMS gateways, email platforms, hosting providers, or payment processors) strictly as necessary to deliver services and communications.
                    </p>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Data Protection
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Reasonable technical and organizational measures are used to safeguard user data. Users are responsible for maintaining the confidentiality of their account credentials.
                    </p>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Types of Data Collected
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      This may include name, email address, phone number, account details, billing status, and usage information related to class access, subscriptions, or notifications.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      3. Communication & Opt-In Policy
                    </h4>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      By signing up with DarulKubra, you agree to receive communications via email, SMS, and/or phone, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>One-Time Passwords (OTP)</li>
                      <li>Class reminders, schedules, and meeting links</li>
                      <li>Assignment and deadline notifications</li>
                      <li>Account, billing, and service alerts</li>
                      <li>Educational resources and program announcements</li>
                      <li>Occasional promotional or community updates</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Opt-In
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Providing contact information constitutes consent to receive these communications. Preference management options will be made available where applicable.
                    </p>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Opt-Out
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li><strong>Email:</strong> Unsubscribe using the link provided in emails</li>
                      <li><strong>SMS/Phone:</strong> Reply "STOP" or follow instructions in the message</li>
                    </ul>
                    <p className="font-semibold" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Important: Opting out of promotional messages does not stop essential service communications (e.g., OTPs, billing notices, class reminders).
                    </p>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Consent & Carrier Disclaimer
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      By providing a phone number, you confirm authorization to receive messages. Standard carrier rates and data charges may apply. DarulKubra is not responsible for carrier fees.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      4. Payment Processing
                    </h4>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Payments are processed securely through Stripe or other trusted third-party payment providers.</li>
                      <li>DarulKubra does not store full payment details (e.g., card numbers or CVV).</li>
                      <li>Payment providers comply with PCI-DSS or equivalent standards.</li>
                      <li>DarulKubra may receive limited, non-sensitive payment data (e.g., last four digits, payment status) for records and support.</li>
                      <li>By paying, you also agree to the terms and privacy policies of the applicable payment provider (e.g., Stripe's Terms of Service and Privacy Policy).</li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5. Subscription Cancellation Policy
                    </h4>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.1 Right to Cancel
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Subscribers may cancel their DarulKubra subscription at any time using one of the official cancellation methods listed below.
                    </p>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.2 Official Methods of Cancellation
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Cancellation requests are accepted only through the following verified channels:
                    </p>
                    <h6 className="text-base font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.2.1 Stripe Customer Dashboard
                    </h6>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Subscribers may cancel directly through Stripe's official customer billing portal associated with their DarulKubra subscription:<br/>
                      <a href="https://dashboard.stripe.com/" target="_blank" rel="noopener noreferrer" className="underline text-blue-500">https://dashboard.stripe.com/</a><br/>
                      Access requires authenticated Stripe customer credentials.
                    </p>
                    <h6 className="text-base font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.2.2 DarulKubra Dashboard
                    </h6>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Cancellation may be completed through DarulKubra's official platforms, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-6" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>DarulKubra web-based dashboard</li>
                      <li>DarulKubra Telegram Mini App</li>
                    </ul>
                    <h6 className="text-base font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.2.3 Official WhatsApp Business Accounts
                    </h6>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Subscribers may request cancellation by messaging DarulKubra through its official WhatsApp business accounts, including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-6" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Sales Team</li>
                      <li>Control Team</li>
                      <li>Management Team</li>
                    </ul>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Requests must originate from the subscriber's registered phone number or verified account credentials.
                    </p>
                    <h6 className="text-base font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.2.4 Customer Service Phone Line
                    </h6>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Subscribers may cancel by calling DarulKubra's official customer service line and requesting cancellation.
                    </p>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.3 Verification & Authorization
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      For cancellations submitted via messaging or phone:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>DarulKubra may verify subscriber identity before processing.</li>
                      <li>Unverifiable or unauthorized requests may be rejected or delayed.</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.4 Effective Date of Cancellation
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Cancellations take effect at the end of the current billing period.</li>
                      <li>Access remains active until the paid period ends.</li>
                      <li>No further charges will be applied after cancellation is processed.</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.5 Billing Cycles & Plan Types
                    </h5>
                    <h6 className="text-base font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Monthly Subscriptions
                    </h6>
                    <ul className="list-disc list-inside space-y-1 ml-6" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>May be canceled at any time.</li>
                      <li>Cancellation prevents future renewals but does not shorten the current paid period.</li>
                    </ul>
                    <h6 className="text-base font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      Annual or Prepaid Subscriptions
                    </h6>
                    <ul className="list-disc list-inside space-y-1 ml-6" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Non-refundable once the billing cycle begins, unless required by law or explicitly stated otherwise.</li>
                      <li>Cancellation prevents automatic renewal at the end of the term.</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.6 Refund Policy
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Payments already processed are non-refundable, including partially used periods.</li>
                      <li>No prorated refunds for unused time unless required by applicable law.</li>
                      <li>Failure to cancel before renewal does not qualify for a refund.</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.7 Free Trials (If Applicable)
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Must be canceled before the trial period ends to avoid charges.</li>
                      <li>Once converted, standard subscription terms apply.</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.8 Processing Time & Charge Cutoff
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Cancellation requests must be submitted before the next billing date to avoid renewal.</li>
                      <li>Requests received after a charge has been processed apply to the next billing cycle.</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.9 Cancellation Confirmation & Records
                    </h5>
                    <ul className="list-disc list-inside space-y-1 ml-4" style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      <li>Confirmation will be issued via email, dashboard notice, or messaging platform.</li>
                      <li>The timestamp recorded in DarulKubra's or Stripe's system is the official cancellation time.</li>
                      <li>Subscribers are responsible for retaining confirmation records.</li>
                    </ul>
                    <h5 className="text-lg font-semibold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      5.10 Disputes & Chargebacks
                    </h5>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      Subscribers agree to use the official cancellation methods before initiating disputes or chargebacks.<br/>
                      Unauthorized chargebacks for valid charges may result in account suspension or termination.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      6. Service Modifications or Termination
                    </h4>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      DarulKubra may modify, suspend, or discontinue services at any time.<br/>
                      If DarulKubra terminates a subscription before the end of a paid period, a prorated refund may be issued at DarulKubra's discretion.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      7. Governing Priority
                    </h4>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      In the event of any conflict between verbal representations and this document, this written policy governs.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-bold" style={{ color: themeParams.text_color || (isDarkMode ? "#ffffff" : "#111827") }}>
                      8. Official Contact Channels
                    </h4>
                    <p style={{ color: themeParams.hint_color || (isDarkMode ? "#d1d5db" : "#6b5563") }}>
                      All official support and cancellation channels are published on DarulKubra's website and official communication platforms.
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <div className="flex justify-center pt-4">
                  <motion.button
                    onClick={() => setShowTermsModal(false)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-8 py-4 rounded-2xl font-bold transition-all shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)`,
                      color: "#ffffff",
                      boxShadow: `0 15px 40px -10px rgba(15, 118, 110, 0.6)`,
                    }}
                  >
                    {t("close") || "Close"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
    </div>
  );
}

export default function StudentMiniApp({
  params,
}: {
  params: { chatId: string };
}) {
  const [selectedStudentId, setSelectedStudentId] = React.useState<
    number | null
  >(null);
  const [students, setStudents] = React.useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = React.useState(true);

  React.useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch(
          `/api/student/mini-app/${params.chatId}?list=true`
        );
        const data = await response.json();
        if (data.success) {
          setStudents(data.students || []);
          if (data.students && data.students.length === 1) {
            setSelectedStudentId(data.students[0].id);
          }
        }
      } catch (err) {
        // Silently handle errors
      } finally {
        setLoadingStudents(false);
      }
    };
    loadStudents();
  }, [params.chatId]);

  return (
    <I18nProvider>
      <StudentMiniAppInner
        params={params}
        selectedStudentId={selectedStudentId}
        onStudentSelected={setSelectedStudentId}
        students={students}
        loadingStudents={loadingStudents}
      />
    </I18nProvider>
  );
}
