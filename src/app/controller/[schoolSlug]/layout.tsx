"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams, usePathname } from "next/navigation";
import React, { useEffect, useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiUser,
  FiDollarSign,
  FiPlus,
  FiBarChart,
  FiCalendar,
  FiSettings,
  FiLogOut,
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiClipboard,
  FiAward,
  FiClock,
  FiTarget,
  FiActivity,
  FiChevronDown,
  FiChevronRight,
  FiStar,
  FiMail,
  FiBell,
  FiSearch,
  FiBookOpen,
  FiPieChart,
  FiZap,
  FiHeart,
  FiShield,
  FiTrendingDown,
  FiCheckSquare,
  FiMonitor,
  FiBriefcase,
  FiFileText,
  FiX,
} from "react-icons/fi";

interface SchoolBranding {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  name: string;
  theme: string;
  supportEmail: string;
}

const BrandingContext = createContext<SchoolBranding | null>(null);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  // Return default branding if context is not available yet
  if (!context) {
    return {
      primaryColor: "#0f766e",
      secondaryColor: "#06b6d4",
      logo: "/logo.svg",
      name: "Quran Academy",
      theme: "light",
      supportEmail: "support@academy.com",
    };
  }
  return context;
};

export default function ControllerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  const [schoolSlug, setSchoolSlug] = useState<string>("");
  const [branding, setBranding] = useState<SchoolBranding | null>(null);

  // Quick stats for the sidebar
  const [sidebarStats, setSidebarStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    monthlyEarnings: 0,
    activeAlerts: 0,
  });

  // Header state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [systemStatus, setSystemStatus] = useState("online");

  // Enhanced sidebar state
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (params.schoolSlug) {
      setSchoolSlug(params.schoolSlug as string);
    }
  }, [params.schoolSlug]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    if (status === "authenticated" && session?.user) {
      const userRole = (session.user as any).role;
      const userSchoolSlug = (session.user as any).schoolSlug;

      if (userRole !== "controller") {
        router.replace("/login");
        return;
      }

      if (userSchoolSlug && userSchoolSlug !== schoolSlug) {
        router.push(`/controller/${userSchoolSlug}/dashboard`);
        return;
      }

      if (!userSchoolSlug) {
        router.push("/login");
        return;
      }
    }
  }, [status, session, router, schoolSlug]);

  useEffect(() => {
    if (schoolSlug) {
      const fetchBranding = async () => {
        try {
          const response = await fetch(
            `/api/controller/${schoolSlug}/branding`
          );
          if (response.ok) {
            const data = await response.json();
            setBranding(data);
          } else {
            // If API fails, use fallback branding
            const fallbackBranding = {
              name: `${
                schoolSlug.charAt(0).toUpperCase() + schoolSlug.slice(1)
              } Academy`,
              logo: "/logo.svg",
              primaryColor: "#0f766e",
              secondaryColor: "#06b6d4",
              theme: "light",
              supportEmail: `support@${schoolSlug}.com`,
            };
            setBranding(fallbackBranding);
          }
        } catch (error) {
          console.error("Failed to fetch branding:", error);
          // Use fallback branding on error
          const fallbackBranding = {
            name: `${
              schoolSlug.charAt(0).toUpperCase() + schoolSlug.slice(1)
            } Academy`,
            logo: "/logo.svg",
            primaryColor: "#0f766e",
            secondaryColor: "#06b6d4",
            theme: "light",
            supportEmail: `support@${schoolSlug}.com`,
          };
          setBranding(fallbackBranding);
        }
      };
      fetchBranding();
    }
  }, [schoolSlug]);

  // Fetch sidebar stats
  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        // Fetch teachers count
        const teachersRes = await fetch(
          `/api/controller/${schoolSlug}/teachers`
        );
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setSidebarStats((prev) => ({
            ...prev,
            totalTeachers: teachersData.length || 0,
          }));
        }

        // Fetch student count
        const studentsRes = await fetch(
          `/api/controller/${schoolSlug}/students?limit=1`
        );
        if (studentsRes.ok) {
          const studentData = await studentsRes.json();
          setSidebarStats((prev) => ({
            ...prev,
            totalStudents: studentData.total || 0,
          }));
        }

        // Fetch earnings
        const earningsRes = await fetch(
          `/api/controller/${schoolSlug}/earnings`
        );
        if (earningsRes.ok) {
          const earningsData = await earningsRes.json();
          setSidebarStats((prev) => ({
            ...prev,
            monthlyEarnings: earningsData.earnings?.reward || 0,
          }));
        }
      } catch (error) {
        console.error("Failed to fetch sidebar stats:", error);
      }
    };

    if (schoolSlug) {
      fetchSidebarStats();
    }
  }, [schoolSlug]);

  // Mobile detection and responsive handling
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
      if (mobile && !mobileSidebarOpen) {
        setSidebarCollapsed(true); // Collapse sidebar on mobile by default
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mobileSidebarOpen]);

  // Handle global search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implement search logic here - could navigate to search results page
    if (query.trim()) {
      // For now, just navigate to students page with search
      router.push(
        `/controller/${schoolSlug}/students?search=${encodeURIComponent(query)}`
      );
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  // Quick actions
  const quickActions = [
    {
      label: "View Students",
      icon: FiUsers,
      action: () => router.push(`/controller/${schoolSlug}/students`),
      shortcut: "Ctrl+S",
    },
    {
      label: "Attendance List",
      icon: FiCheckSquare,
      action: () => router.push(`/controller/${schoolSlug}/attendance-list`),
      shortcut: "Ctrl+A",
    },
    {
      label: "View Earnings",
      icon: FiDollarSign,
      action: () => router.push(`/controller/${schoolSlug}/earnings`),
      shortcut: "Ctrl+E",
    },
  ];

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const logoUrl = branding?.logo || "/logo.svg";
  const schoolName =
    branding?.name ||
    `${schoolSlug.charAt(0).toUpperCase() + schoolSlug.slice(1)} Academy`;
  const supportEmail = branding?.supportEmail || `support@${schoolSlug}.com`;

  const navGroups = [
    {
      id: "main",
      label: "Main",
      icon: FiHome,
      defaultExpanded: true,
      items: [
        {
          href: `/controller/${schoolSlug}/dashboard`,
          label: "Dashboard",
          icon: FiHome,
          description: "Overview & Statistics",
        },
      ],
    },
    {
      id: "teachers",
      label: "Teacher Management",
      icon: FiUsers,
      defaultExpanded: true,
      items: [
        {
          href: `/controller/${schoolSlug}/teachers`,
          label: "My Teachers",
          icon: FiUsers,
          description: `${sidebarStats.totalTeachers} Assigned Teachers`,
        },
        
        
      ],
    },
    {
      id: "students",
      label: "Student Oversight",
      icon: FiMonitor,
      defaultExpanded: true,
      items: [
        {
          href: `/controller/${schoolSlug}/students`,
          label: "All Students",
          icon: FiUsers,
          description: `${sidebarStats.totalStudents} Total Students`,
        },
        {
          href: `/controller/${schoolSlug}/attendance-list`,
          label: "Attendance List",
          icon: FiCheckSquare,
          description: "Real-time Monitoring",
        },
        
      ],
    },
   
    {
      id: "tools",
      label: "Tools & Settings",
      icon: FiSettings,
      defaultExpanded: false,
      items: [
        {
          href: `/controller/${schoolSlug}/settings`,
          label: "Settings",
          icon: FiSettings,
          description: "Account & Preferences",
        },
      ],
    },
  ];

  // Enhanced Navigation Search Component
  const NavigationSearch = ({
    searchQuery,
    setSearchQuery,
    primaryColor,
    secondaryColor,
  }: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    primaryColor: string;
    secondaryColor: string;
  }) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <div className="px-4 mb-4">
        <div
          className={`relative transition-all duration-300 rounded-xl overflow-hidden ${
            isFocused ? "shadow-lg" : "shadow-sm"
          }`}
          style={{
            background: isFocused
              ? `linear-gradient(135deg, ${primaryColor}08, ${secondaryColor}06)`
              : `linear-gradient(135deg, ${primaryColor}05, ${secondaryColor}03)`,
            backdropFilter: "blur(12px)",
            border: isFocused ? `1px solid ${primaryColor}20` : "1px solid rgba(255,255,255,0.2)",
          }}
        >
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch
              className={`w-4 h-4 transition-colors duration-300 ${
                isFocused ? "text-gray-600" : "text-gray-400"
              }`}
            />
          </div>
          <input
            type="text"
            placeholder="Search navigation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className="w-full pl-12 pr-4 py-3 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none transition-all duration-300"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <FiX className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
            </button>
          )}
        </div>
      </div>
    );
  };

  // Enhanced Quick Stats Component
  const QuickStatsWidget = ({
    stats,
    primaryColor,
    secondaryColor,
  }: {
    stats: {
      totalTeachers: number;
      totalStudents: number;
      monthlyEarnings: number;
      activeAlerts: number;
    };
    primaryColor: string;
    secondaryColor: string;
  }) => {
    const statItems = [
      {
        label: "Teachers",
        value: stats.totalTeachers,
        icon: FiUsers,
        color: "#0f766e",
        trend: "+5%",
        trendUp: true,
      },
      {
        label: "Students",
        value: stats.totalStudents,
        icon: FiBookOpen,
        color: "#06b6d4",
        trend: "+12%",
        trendUp: true,
      },
      {
        label: "Earnings",
        value: stats.monthlyEarnings,
        icon: FiDollarSign,
        color: "#10B981",
        trend: "+8%",
        trendUp: true,
      },
      {
        label: "Alerts",
        value: stats.activeAlerts,
        icon: FiBell,
        color: "#F59E0B",
        trend: "-3%",
        trendUp: false,
      },
    ];

    return (
      <div className="px-4 mb-6">
        <div className="grid grid-cols-2 gap-3">
          {statItems.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="group relative overflow-hidden rounded-xl p-4 transition-all duration-300 hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${stat.color}10, ${stat.color}05)`,
                border: `1px solid ${stat.color}20`,
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Animated background */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(circle at 70% 30%, ${stat.color}15 0%, transparent 70%)`,
                }}
              />

              <div className="relative flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{stat.label}</p>
                    <p className="text-sm font-bold text-gray-900">
                      {stat.label === "Earnings" ? `$${stat.value}` : stat.value}
                    </p>
                  </div>
                </div>

                <div className={`flex items-center text-xs font-medium ${
                  stat.trendUp ? "text-green-600" : "text-red-600"
                }`}>
                  {stat.trendUp ? (
                    <FiTrendingUp className="w-3 h-3 mr-1" />
                  ) : (
                    <FiTrendingDown className="w-3 h-3 mr-1" />
                  )}
                  {stat.trend}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Enhanced NavGroup Component - Ultra Modern & Interactive
  const NavGroup = ({
    group,
    pathname,
    primaryColor,
    secondaryColor,
    schoolSlug,
    isCollapsed = false,
  }: {
    group: any;
    pathname: string;
    primaryColor: string;
    secondaryColor: string;
    schoolSlug: string;
    isCollapsed?: boolean;
  }) => {
    const [isExpanded, setIsExpanded] = useState(group.defaultExpanded);
    const [hoveredItem, setHoveredItem] = useState<string | null>(null);
    const [isGroupHovered, setIsGroupHovered] = useState(false);

    return (
      <div className="mb-4">
        {/* Ultra-modern card container with glassmorphism */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/20 shadow-lg transition-all duration-500 group"
          style={{
            background: isGroupHovered
              ? `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}12 100%)`
              : `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}08 100%)`,
            backdropFilter: "blur(16px)",
            boxShadow: isGroupHovered
              ? `0 8px 32px -4px ${primaryColor}20, 0 4px 16px -2px ${secondaryColor}15`
              : `0 4px 16px -2px ${primaryColor}10`,
          }}
          onMouseEnter={() => setIsGroupHovered(true)}
          onMouseLeave={() => setIsGroupHovered(false)}
        >
          {/* Animated background gradient */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${primaryColor}15 0%, transparent 70%)`,
            }}
          />

          {/* Group header with enhanced interactions */}
          {isCollapsed ? (
            /* Collapsed: Just icon with tooltip */
            <div className="relative group/collapsed mb-4">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="relative w-full flex justify-center py-3 transition-all duration-300 group/header z-10"
              >
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 transform ${
                      isExpanded ? "scale-110 rotate-3" : "scale-100 rotate-0"
                    }`}
                    style={{
                      background: isExpanded
                        ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                        : `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}20)`,
                      boxShadow: isExpanded
                        ? `0 8px 24px -4px ${primaryColor}50`
                        : `0 4px 12px -2px ${primaryColor}20`,
                    }}
                  >
                    <group.icon
                      className={`w-6 h-6 transition-all duration-300 ${
                        isExpanded
                          ? "text-white scale-110"
                          : "text-gray-600 group-hover/header:text-gray-800"
                      }`}
                    />
                  </div>

                  {/* Pulsing ring animation */}
                  {isExpanded && (
                    <div
                      className="absolute inset-0 rounded-xl animate-ping"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}25)`,
                      }}
                    />
                  )}
                </div>
              </button>

              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover/collapsed:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-xl">
                {group.label}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            </div>
          ) : (
            /* Expanded: Full header */
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative w-full flex items-center justify-between px-5 py-4 text-left transition-all duration-300 group/header z-10"
            >
              <div className="flex items-center">
                {/* Icon container with pulsing effect */}
                <div className="relative mr-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 transform ${
                      isExpanded ? "scale-110 rotate-3" : "scale-100 rotate-0"
                    }`}
                    style={{
                      background: isExpanded
                        ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                        : `linear-gradient(135deg, ${primaryColor}25, ${secondaryColor}20)`,
                      boxShadow: isExpanded
                        ? `0 8px 24px -4px ${primaryColor}50`
                        : `0 4px 12px -2px ${primaryColor}20`,
                    }}
                  >
                    <group.icon
                      className={`w-5 h-5 transition-all duration-300 ${
                        isExpanded
                          ? "text-white scale-110"
                          : "text-gray-600 group-hover/header:text-gray-800"
                      }`}
                    />
                  </div>

                  {/* Pulsing ring animation */}
                  {isExpanded && (
                    <div
                      className="absolute inset-0 rounded-xl animate-ping"
                      style={{
                        background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}25)`,
                      }}
                    />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-900 group-hover/header:text-gray-800 transition-colors">
                    {group.label}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>
              </div>

              {/* Enhanced chevron with rotation animation */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500 font-medium">
                    {isExpanded ? "Active" : "Ready"}
                  </span>
                </div>
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <FiChevronRight className="w-5 h-5 text-gray-500 group-hover/header:text-gray-700 transition-colors" />
                </motion.div>
              </div>
            </button>
          )}

          {/* Enhanced expandable content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{
                  duration: 0.4,
                  ease: [0.4, 0.0, 0.2, 1],
                  opacity: { duration: 0.3 }
                }}
                className="relative border-t border-white/30"
              >
                {/* Subtle gradient overlay */}
                <div
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: `linear-gradient(180deg, ${primaryColor}02 0%, transparent 100%)`,
                  }}
                />

                <div className="relative py-3">
                  {group.items.map((item: any, index: number) => {
                    const isActive = pathname === item.href;
                    const isHovered = hoveredItem === item.href;

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                          delay: index * 0.08,
                          duration: 0.4,
                          ease: [0.4, 0.0, 0.2, 1]
                        }}
                        onMouseEnter={() => setHoveredItem(item.href)}
                        onMouseLeave={() => setHoveredItem(null)}
                      >
                        {isCollapsed ? (
                          /* Collapsed: Icon only with tooltip */
                          <div className="relative group/item-collapsed mb-2">
                            <Link
                              href={item.href}
                              className={`group/item relative flex justify-center py-3 px-2 text-sm transition-all duration-300 rounded-xl overflow-hidden ${
                                isActive
                                  ? "text-white shadow-xl"
                                  : "text-gray-700 hover:text-gray-900"
                              }`}
                              style={
                                isActive
                                  ? {
                                      background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                      boxShadow: `0 8px 32px -8px ${primaryColor}60, 0 4px 16px -4px ${secondaryColor}40`,
                                    }
                                  : isHovered
                                  ? {
                                      background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}08)`,
                                      boxShadow: `0 4px 16px -4px ${primaryColor}20`,
                                    }
                                  : {
                                      background: "transparent",
                                    }
                              }
                            >
                              {/* Active state glow effect */}
                              {isActive && (
                                <>
                                  <div
                                    className="absolute inset-0 opacity-30"
                                    style={{
                                      background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}30)`,
                                    }}
                                  />
                                  <div
                                    className="absolute left-0 top-0 bottom-0 w-1"
                                    style={{ backgroundColor: secondaryColor }}
                                  />
                                </>
                              )}

                              {/* Icon with enhanced animations */}
                              <div className="relative">
                                <item.icon
                                  className={`w-5 h-5 transition-all duration-300 ${
                                    isActive
                                      ? "text-white scale-110"
                                      : isHovered
                                      ? "text-gray-700 scale-105"
                                      : "text-gray-500"
                                  }`}
                                />

                                {/* Hover glow effect */}
                                {isHovered && !isActive && (
                                  <div
                                    className="absolute inset-0 rounded-full blur-sm opacity-50"
                                    style={{ backgroundColor: primaryColor }}
                                  />
                                )}
                              </div>
                            </Link>

                            {/* Tooltip */}
                            <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover/item-collapsed:opacity-100 transition-opacity duration-200 pointer-events-none z-20 shadow-xl">
                              {item.label}
                              <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                            </div>
                          </div>
                        ) : (
                          /* Expanded: Full item */
                          <Link
                            href={item.href}
                            className={`group/item relative flex items-center px-6 py-3.5 mx-2 mb-1 text-sm transition-all duration-300 rounded-xl overflow-hidden ${
                              isActive
                                ? "text-white shadow-xl"
                                : "text-gray-700 hover:text-gray-900"
                            }`}
                            style={
                              isActive
                                ? {
                                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                    boxShadow: `0 8px 32px -8px ${primaryColor}60, 0 4px 16px -4px ${secondaryColor}40`,
                                  }
                                : isHovered
                                ? {
                                    background: `linear-gradient(135deg, ${primaryColor}10, ${secondaryColor}08)`,
                                    boxShadow: `0 4px 16px -4px ${primaryColor}20`,
                                  }
                                : {
                                    background: "transparent",
                                  }
                            }
                          >
                            {/* Animated background on hover */}
                            <div
                              className={`absolute inset-0 transition-opacity duration-300 ${
                                isHovered && !isActive ? "opacity-100" : "opacity-0"
                              }`}
                              style={{
                                background: `radial-gradient(circle at 30% 70%, ${primaryColor}15 0%, transparent 60%)`,
                              }}
                            />

                            {/* Active state glow effect */}
                            {isActive && (
                              <>
                                <div
                                  className="absolute inset-0 opacity-30"
                                  style={{
                                    background: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}30)`,
                                  }}
                                />
                                <div
                                  className="absolute left-0 top-0 bottom-0 w-1"
                                  style={{ backgroundColor: secondaryColor }}
                                />
                              </>
                            )}

                            {/* Icon with enhanced animations */}
                            <div className="relative mr-4">
                              <item.icon
                                className={`w-4 h-4 transition-all duration-300 ${
                                  isActive
                                    ? "text-white scale-110"
                                    : isHovered
                                    ? "text-gray-700 scale-105"
                                    : "text-gray-500"
                                }`}
                              />

                              {/* Hover glow effect */}
                              {isHovered && !isActive && (
                                <div
                                  className="absolute inset-0 rounded-full blur-sm opacity-50"
                                  style={{ backgroundColor: primaryColor }}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0 relative z-10">
                              <div
                                className={`font-semibold truncate transition-colors ${
                                  isActive ? "text-white" : "text-gray-900"
                                }`}
                              >
                                {item.label}
                              </div>
                              <div
                                className={`text-xs mt-1 truncate transition-colors ${
                                  isActive ? "text-white/90" : "text-gray-500"
                                }`}
                              >
                                {item.description}
                              </div>
                            </div>

                            {/* Enhanced hover indicator */}
                            <div className="relative ml-3">
                              <div
                                className={`w-2 h-8 rounded-full transition-all duration-300 ${
                                  isActive
                                    ? "bg-white/40 scale-110"
                                    : isHovered
                                    ? "bg-gray-400 scale-105"
                                    : "bg-transparent"
                                }`}
                              />

                              {/* Animated particles on hover */}
                              {isHovered && !isActive && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div
                                    className="w-1 h-1 rounded-full animate-bounce"
                                    style={{
                                      backgroundColor: primaryColor,
                                      animationDelay: "0ms",
                                    }}
                                  />
                                  <div
                                    className="w-1 h-1 rounded-full animate-bounce ml-1"
                                    style={{
                                      backgroundColor: secondaryColor,
                                      animationDelay: "100ms",
                                    }}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Tooltip on hover */}
                            {isHovered && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-20 shadow-xl"
                              >
                                {item.label}
                                <div className="absolute left-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-l-gray-900"></div>
                              </motion.div>
                            )}
                          </Link>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500"
        />
      </div>
    );
  }

  return (
    <BrandingContext.Provider value={branding}>
      <div
        className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50"
        style={
          {
            "--primary-color": primaryColor,
            "--secondary-color": secondaryColor,
          } as React.CSSProperties
        }
      >
        {/* Custom Scrollbar Styles */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .sidebar-scroll::-webkit-scrollbar {
              width: 6px;
            }
            .sidebar-scroll::-webkit-scrollbar-track {
              background: transparent;
            }
            .sidebar-scroll::-webkit-scrollbar-thumb {
              background: ${primaryColor}40;
              border-radius: 3px;
              transition: background 0.3s ease;
            }
            .sidebar-scroll::-webkit-scrollbar-thumb:hover {
              background: ${primaryColor}60;
            }
            .sidebar-scroll {
              scrollbar-width: thin;
              scrollbar-color: ${primaryColor}40 transparent;
            }
          `
        }} />

        {/* Enhanced Professional Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="sticky top-0 z-40 border-b border-gray-200 shadow-sm"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}08 0%, ${secondaryColor}05 100%)`,
            backdropFilter: "blur(12px)",
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-20">
              {/* Left Section - Logo & School Info */}
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-white rounded-xl p-2 shadow-lg ring-1 ring-gray-200/50">
                    <img
                      src={logoUrl}
                      alt={`${schoolName} Logo`}
                      className="h-10 w-10 rounded-lg object-cover"
                      onError={(e) => {
                        if (e.currentTarget.src !== "/logo.svg") {
                          e.currentTarget.src = "/logo.svg";
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900 leading-tight">
                    {schoolName}
                  </h1>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-gray-600 font-medium">
                        Online
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      Controller Portal
                    </span>
                  </div>
                </div>
              </div>

              {/* Center Section - Search & Quick Actions */}
              <div className="hidden sm:flex items-center space-x-3 flex-1 max-w-md mx-4 sm:mx-8">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students, teachers..."
                    className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Right Section - Actions & User */}
              <div className="flex items-center space-x-3">
                {/* Sidebar Toggle Button */}
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200"
                  title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                >
                  <motion.div
                    animate={{ rotate: sidebarCollapsed ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <FiChevronRight className="w-5 h-5" />
                  </motion.div>
                </button>

                {/* Mobile Sidebar Menu Button */}
                {isMobile && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    className="p-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm"
                    title={mobileSidebarOpen ? "Close Menu" : "Open Menu"}
                  >
                    <motion.div
                      animate={{ rotate: mobileSidebarOpen ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiSettings className="w-6 h-6" />
                    </motion.div>
                  </motion.button>
                )}

                {/* Notifications */}
                <div className="relative">
                  <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                    <FiBell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                      3
                    </span>
                  </button>
                </div>

                {/* User Menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/70 backdrop-blur-sm transition-all duration-200 border border-transparent hover:border-gray-200/50">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <FiUser className="w-4 h-4 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-semibold text-gray-900 leading-tight">
                        {session?.user?.name?.split(" ")[0]}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {session?.user?.role}
                      </p>
                    </div>
                    <FiChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {session?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session?.user?.name || "No email"}
                      </p>
                    </div>
                    <div className="py-2">
                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiUser className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiSettings className="w-4 h-4" />
                        <span>Preferences</span>
                      </button>
                      <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <FiActivity className="w-4 h-4" />
                        <span>Activity Log</span>
                      </button>
                      <div className="border-t border-gray-100 my-2"></div>
                      <button
                        onClick={() =>
                          signOut({ callbackUrl: `${window.location.origin}/login`, redirect: true })
                        }
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiLogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Breadcrumb Navigation */}
        <div className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex py-2 sm:py-3" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link
                    href={`/controller/${schoolSlug}/dashboard`}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                </li>
                <li className="flex items-center">
                  <FiChevronRight className="w-4 h-4 text-gray-400 mx-2" />
                  <span className="text-gray-900 text-sm font-medium capitalize">
                    {pathname.split("/").pop()?.replace("-", " ") || "Home"}
                  </span>
                </li>
              </ol>
            </nav>
          </div>
        </div>
 
        {/* Enhanced Sidebar */}
        <motion.nav
          initial={{ x: isMobile ? -1000 : -300 }}
          animate={{
            x: isMobile ? (mobileSidebarOpen ? 0 : -1000) : 0,
            width: isMobile ? "100vw" : (sidebarCollapsed ? 72 : 320)
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`bg-gradient-to-b from-white via-gray-50 to-white shadow-xl border-r border-gray-200 fixed top-20 left-0 z-40 ${
            isMobile ? 'h-full' : 'h-[calc(100vh-5rem)]'
          } ${isMobile && !mobileSidebarOpen ? 'hidden' : ''}`}
          style={{
            background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}08 100%)`,
          }}
        >
            {/* Entire Sidebar Content - Scrollable */}
            <div className="h-full overflow-y-auto sidebar-scroll">
              {/* Sidebar Header with School Branding */}
            <div
              className="relative p-6 border-b border-gray-200"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}15 100%)`,
              }}
            >
              {/* Mobile Close Button */}
              {isMobile && (
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="absolute top-4 right-4 p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all duration-200 z-50"
                  title="Close Menu"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-current to-transparent"
                  style={{ color: primaryColor }}
                />
                <div
                  className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-gradient-to-tr from-current to-transparent"
                  style={{ color: secondaryColor }}
                />
              </div>

              <div className="relative">
                {/* School Logo & Info */}
                <div className="flex items-center mb-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg ring-2 ring-white/50">
                      <img
                        src={logoUrl}
                        alt={`${schoolName} Logo`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          if (e.currentTarget.src !== "/logo.svg") {
                            e.currentTarget.src = "/logo.svg";
                          }
                        }}
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-sm">
                      <FiZap className="w-2.5 h-2.5 text-white m-0.5" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">
                      {schoolName}
                    </h2>
                    <p className="text-xs text-gray-600 font-medium">
                      Controller Portal
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/50">
                    <div className="flex items-center">
                      <FiUsers className="w-4 h-4 text-blue-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Teachers
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {sidebarStats.totalTeachers}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/50">
                    <div className="flex items-center">
                      <FiBookOpen className="w-4 h-4 text-green-500 mr-2" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">
                          Students
                        </p>
                        <p className="text-sm font-bold text-gray-900">
                          {sidebarStats.totalStudents}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Quick Stats - Hidden when collapsed on desktop */}
            {(!sidebarCollapsed || isMobile) && (
              <QuickStatsWidget
                stats={sidebarStats}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            )}

            {/* Navigation Search - Hidden when collapsed on desktop */}
            {(!sidebarCollapsed || isMobile) && (
              <NavigationSearch
                searchQuery={sidebarSearchQuery}
                setSearchQuery={setSidebarSearchQuery}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
              />
            )}

            {/* Navigation Groups */}
            <div className={`${isMobile ? 'px-6' : 'px-4'} pb-4 space-y-2`}>
              {navGroups
                .filter((group) => {
                  if (!sidebarSearchQuery) return true;
                  const groupMatches = group.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase());
                  const itemMatches = group.items.some((item: any) =>
                    item.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
                    item.description.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
                  );
                  return groupMatches || itemMatches;
                })
                .map((group) => {
                  // Filter items within groups if search query exists
                  const filteredGroup = sidebarSearchQuery
                    ? {
                        ...group,
                        items: group.items.filter((item: any) =>
                          item.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
                          group.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
                        ),
                      }
                    : group;

                  return (
                    <NavGroup
                      key={group.id}
                      group={filteredGroup}
                      pathname={pathname}
                      primaryColor={primaryColor}
                      secondaryColor={secondaryColor}
                      schoolSlug={schoolSlug}
                      isCollapsed={sidebarCollapsed && !isMobile}
                    />
                  );
                })}

              {/* No results message */}
              {sidebarSearchQuery && navGroups.every((group) =>
                !group.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) &&
                !group.items.some((item: any) =>
                  item.label.toLowerCase().includes(sidebarSearchQuery.toLowerCase()) ||
                  item.description.toLowerCase().includes(sidebarSearchQuery.toLowerCase())
                )
              ) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12 px-4"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <FiSearch className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    No navigation items found
                  </h3>
                  <p className="text-xs text-gray-500">
                    Try adjusting your search query
                  </p>
                </motion.div>
              )}
            </div>

            {/* User Profile Section */}
            <div className={`${isMobile ? 'p-6' : 'p-4'} border-t border-gray-200 bg-gray-50/50`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                    <FiUser className="w-4 h-4 text-white" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-32">
                      {session?.user?.name}
                    </p>
                    <p className="text-xs text-gray-600 capitalize">
                      {session?.user?.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    signOut({ callbackUrl: "/login", redirect: true })
                  }
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title="Logout"
                >
                  <FiLogOut size={16} />
                </button>
              </div>
            </div>
            </div> {/* End scrollable container */}
          </motion.nav>

          {/* Mobile Sidebar Backdrop */}
          {isMobile && mobileSidebarOpen && (
            <div
              className="fixed inset-0 z-30"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}90 0%, ${secondaryColor}85 100%)`,
                backdropFilter: "blur(8px)",
              }}
              onClick={() => setMobileSidebarOpen(false)}
            />
          )}

        {/* Main Content */}
        <motion.main
          animate={{
            paddingLeft: isMobile ? 0 : (sidebarCollapsed ? 72 : 320),
            marginTop: isMobile ? "5rem" : "5rem"
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`min-h-[calc(100vh-5rem)] transition-all duration-300 ${
            isMobile ? 'p-4 sm:p-6' : 'p-8'
          }`}
        >
          <AnimatePresence mode="wait">{children}</AnimatePresence>
        </motion.main>
      </div>
    </BrandingContext.Provider>
  );
}

