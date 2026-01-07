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
      const userRole = session.user.role;
      const userSchoolSlug = session.user.schoolSlug;

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
        {
          href: `/controller/${schoolSlug}/ratings`,
          label: "Teacher Ratings",
          icon: FiStar,
          description: "Performance Reviews",
        },
        {
          href: `/controller/${schoolSlug}/quality`,
          label: "Quality Review",
          icon: FiAward,
          description: "Teaching Standards",
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
        {
          href: `/controller/${schoolSlug}/student-analytics`,
          label: "Student Analytics",
          icon: FiBarChart,
          description: "Progress Tracking",
        },
      ],
    },
    {
      id: "business",
      label: "Business & Reports",
      icon: FiBriefcase,
      defaultExpanded: false,
      items: [
        {
          href: `/controller/${schoolSlug}/earnings`,
          label: "Earnings",
          icon: FiDollarSign,
          description: `$${sidebarStats.monthlyEarnings} This Month`,
        },
        {
          href: `/controller/${schoolSlug}/subscriptions`,
          label: "Subscriptions",
          icon: FiClipboard,
          description: "Package Management",
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

  // Enhanced NavGroup Component - Aesthetic & Professional
  const NavGroup = ({
    group,
    pathname,
    primaryColor,
    secondaryColor,
    schoolSlug,
  }: {
    group: any;
    pathname: string;
    primaryColor: string;
    secondaryColor: string;
    schoolSlug: string;
  }) => {
    const [isExpanded, setIsExpanded] = useState(group.defaultExpanded);

    return (
      <div className="mb-3">
        {/* Card-like container for groups */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50/70 transition-all duration-200 group"
          >
            <div className="flex items-center">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mr-3 transition-all duration-200"
                style={{
                  background: isExpanded
                    ? `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                    : `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                }}
              >
                <group.icon
                  className={`w-4 h-4 transition-colors duration-200 ${
                    isExpanded ? "text-white" : ""
                  }`}
                  style={{ color: isExpanded ? "white" : primaryColor }}
                />
              </div>
              <span className="text-sm font-semibold text-gray-900 group-hover:text-gray-800">
                {group.label}
              </span>
            </div>
            <div className="flex items-center">
              <span className="text-xs text-gray-500 mr-2 transition-opacity duration-200">
                {isExpanded ? "Collapse" : `${group.items.length} items`}
              </span>
              {isExpanded ? (
                <FiChevronDown className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
              ) : (
                <FiChevronRight className="w-4 h-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="border-t border-gray-100/70"
              >
                <div className="py-2">
                  {group.items.map((item: any, index: number) => {
                    const isActive = pathname === item.href;

                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                      >
                        <Link
                          href={item.href}
                          className={`group relative flex items-center px-5 py-3 text-sm transition-all duration-200 border-l-4 ${
                            isActive
                              ? "bg-gradient-to-r text-white shadow-sm border-l-transparent"
                              : "text-gray-700 hover:bg-gray-50/80 hover:text-gray-900 hover:border-l-gray-300 border-l-transparent"
                          }`}
                          style={
                            isActive
                              ? {
                                  background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                  boxShadow: `0 2px 8px -2px ${primaryColor}40`,
                                }
                              : {}
                          }
                        >
                          {/* Active indicator line */}
                          {isActive && (
                            <div
                              className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full"
                              style={{ backgroundColor: secondaryColor }}
                            />
                          )}

                          <item.icon
                            className={`w-4 h-4 mr-3.5 transition-all duration-200 ${
                              isActive
                                ? "text-white scale-110"
                                : "text-gray-500 group-hover:text-gray-700 group-hover:scale-105"
                            }`}
                          />

                          <div className="flex-1 min-w-0">
                            <div
                              className={`font-medium truncate transition-colors ${
                                isActive ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {item.label}
                            </div>
                            <div
                              className={`text-xs mt-0.5 truncate transition-colors ${
                                isActive ? "text-white/90" : "text-gray-500"
                              }`}
                            >
                              {item.description}
                            </div>
                          </div>

                          {/* Hover indicator */}
                          <div
                            className={`w-1 h-6 rounded-full transition-all duration-200 ${
                              isActive
                                ? "bg-white/30"
                                : "bg-transparent group-hover:bg-gray-300"
                            }`}
                          />
                        </Link>
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
              <div className="flex items-center space-x-4">
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
              <div className="hidden md:flex items-center space-x-3 flex-1 max-w-md mx-8">
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
                {/* Mobile Menu Button */}
                <button className="lg:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                  <FiSearch className="w-5 h-5" />
                </button>

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
                          signOut({ callbackUrl: "/login", redirect: true })
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
            <nav className="flex py-3" aria-label="Breadcrumb">
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
 
        <div className="flex">
          {/* Enhanced Sidebar */}
          <motion.nav
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="w-80 bg-gradient-to-b from-white via-gray-50 to-white shadow-xl border-r border-gray-200 min-h-[calc(100vh-5rem)] sticky top-20 overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}05 0%, ${secondaryColor}08 100%)`,
            }}
          >
            {/* Sidebar Header with School Branding */}
            <div
              className="relative p-6 border-b border-gray-200"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}10 0%, ${secondaryColor}15 100%)`,
              }}
            >
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

            {/* Navigation Groups */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-2">
                {navGroups.map((group) => (
                  <NavGroup
                    key={group.id}
                    group={group}
                    pathname={pathname}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    schoolSlug={schoolSlug}
                  />
                ))}
              </div>
            </div>

            {/* User Profile Section */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
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
          </motion.nav>

          {/* Main Content */}
          <main className="flex-1 p-8">
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </main>
        </div>
      </div>
    </BrandingContext.Provider>
  );
}

