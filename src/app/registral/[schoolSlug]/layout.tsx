"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FiUser,
  FiDollarSign,
  FiPlus,
  FiBarChart,
  FiCalendar,
  FiSettings,
  FiLogOut,
  FiHome,
  FiTrendingUp,
  FiClipboard,
  FiUsers,
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
} from "react-icons/fi";
import { signOut } from "next-auth/react";

interface SchoolBranding {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  name: string;
  theme: string;
  supportEmail?: string;
}

const BrandingContext = createContext<SchoolBranding | null>(null);

export const useBranding = () => {
  const context = useContext(BrandingContext);
  return context;
};

export default function RegistralLayout({
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

      // Only allow registral role
      if (userRole !== "registral") {
        router.replace("/login");
        return;
      }

      // Check if user has access to this school
      if (userSchoolSlug && userSchoolSlug !== schoolSlug) {
        // If user is trying to access a different school than their own, redirect
        router.push(`/registral/${userSchoolSlug}/dashboard`);
        return;
      }

      // If user doesn't have school access but is trying to access registral, redirect to login
      if (!userSchoolSlug && schoolSlug !== "darulkubra") {
        router.push("/login");
        return;
      }
    }
  }, [status, session, router, schoolSlug]);

  // Fetch school branding
  useEffect(() => {
    if (schoolSlug) {
      const fetchBranding = async () => {
        try {
          const response = await fetch(`/api/registral/${schoolSlug}/branding`);
          if (response.ok) {
            const data = await response.json();
            setBranding(data);
          } else {
            // If API fails, use fallback branding
            const fallbackBranding = {
              name:
                schoolSlug === "darulkubra"
                  ? "Darulkubra Quran Academy"
                  : `${
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
          // Use fallback branding on error
          const fallbackBranding = {
            name:
              schoolSlug === "darulkubra"
                ? "Darulkubra Quran Academy"
                : `${
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

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const logoUrl = branding?.logo || "/logo.svg";
  const schoolName =
    branding?.name ||
    (schoolSlug === "darulkubra"
      ? "Darulkubra Quran Academy"
      : `${schoolSlug.charAt(0).toUpperCase() + schoolSlug.slice(1)} Academy`);
  const supportEmail = branding?.supportEmail || `support@${schoolSlug}.com`;

  // Quick stats for the sidebar
  const [sidebarStats, setSidebarStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    monthlyEarnings: 0,
    pendingRegistrations: 0,
  });

  // Header state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [systemStatus, setSystemStatus] = useState("online");

  // Fetch sidebar stats
  useEffect(() => {
    const fetchSidebarStats = async () => {
      try {
        // Fetch student count
        const studentsRes = await fetch(
          `/api/admin/${schoolSlug}/students/count`
        );
        if (studentsRes.ok) {
          const studentData = await studentsRes.json();
          setSidebarStats((prev) => ({
            ...prev,
            totalStudents: studentData.total || 0,
            activeStudents: studentData.active || 0,
          }));
        }

        // Fetch earnings
        const earningsRes = await fetch(
          `/api/registral/${schoolSlug}/earnings`
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
        `/registral/${schoolSlug}/students?search=${encodeURIComponent(query)}`
      );
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  // Quick actions
  const quickActions = [
    {
      label: "New Student",
      icon: FiPlus,
      action: () => router.push(`/registral/${schoolSlug}/registration`),
      shortcut: "Ctrl+N",
    },
    {
      label: "View Students",
      icon: FiUsers,
      action: () => router.push(`/registral/${schoolSlug}/students`),
      shortcut: "Ctrl+S",
    },
    {
      label: "Earnings Report",
      icon: FiDollarSign,
      action: () => router.push(`/registral/${schoolSlug}/earnings`),
      shortcut: "Ctrl+E",
    },
  ];

  const navGroups = [
    {
      id: "main",
      label: "Main",
      icon: FiHome,
      defaultExpanded: true,
      items: [
        {
          href: `/registral/${schoolSlug}/dashboard`,
          label: "Dashboard",
          icon: FiHome,
          description: "Overview & Statistics",
        },
        {
          href: `/registral/${schoolSlug}/registration`,
          label: "New Registration",
          icon: FiPlus,
          description: "Register New Student",
        },
      ],
    },
    {
      id: "students",
      label: "Student Management",
      icon: FiUsers,
      defaultExpanded: true,
      items: [
        {
          href: `/registral/${schoolSlug}/students`,
          label: "My Students",
          icon: FiUsers,
          description: `${sidebarStats.totalStudents} Total Students`,
        },
        {
          href: `/registral/${schoolSlug}/analytics`,
          label: "Performance",
          icon: FiTrendingUp,
          description: "Student Progress",
        },
      ],
    },
    {
      id: "business",
      label: "Business",
      icon: FiDollarSign,
      defaultExpanded: false,
      items: [
        {
          href: `/registral/${schoolSlug}/earnings`,
          label: "Earnings",
          icon: FiDollarSign,
          description: `$${sidebarStats.monthlyEarnings} This Month`,
        },
        {
          href: `/registral/${schoolSlug}/analytics`,
          label: "Analytics",
          icon: FiPieChart,
          description: "Business Insights",
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
          href: `/registral/${schoolSlug}/settings`,
          label: "Settings",
          icon: FiSettings,
          description: "Account & Preferences",
        },
      ],
    },
  ];

  // NavGroup Component
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
      <div className="bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200/50 overflow-hidden shadow-sm">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/50 transition-colors"
        >
          <div className="flex items-center">
            <group.icon
              className="w-5 h-5 mr-3"
              style={{ color: primaryColor }}
            />
            <span className="text-sm font-semibold text-gray-900">
              {group.label}
            </span>
          </div>
          {isExpanded ? (
            <FiChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <FiChevronRight className="w-4 h-4 text-gray-500" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-t border-gray-100/50"
            >
              <div className="py-1">
                {group.items.map((item: any) => {
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center px-4 py-2.5 text-sm transition-all duration-200 ${
                        isActive
                          ? "bg-gradient-to-r text-white shadow-sm"
                          : "text-gray-700 hover:bg-gray-100/70 hover:text-gray-900"
                      }`}
                      style={
                        isActive
                          ? {
                              background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                              boxShadow: `0 2px 4px -1px ${primaryColor}30`,
                            }
                          : {}
                      }
                    >
                      <item.icon
                        className={`w-4 h-4 mr-3 transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-gray-500 group-hover:text-gray-700"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium truncate ${
                            isActive ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {item.label}
                        </div>
                        {item.description && (
                          <div
                            className={`text-xs truncate ${
                              isActive ? "text-white/80" : "text-gray-500"
                            }`}
                          >
                            {item.description}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full shadow-sm" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
    <div
      className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50"
      style={
        {
          "--primary-color": primaryColor,
          "--secondary-color": secondaryColor,
        } as React.CSSProperties
      }
    >
      {/* Enhanced Header */}
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
                    Registral Portal
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
                  placeholder="Search students, registrations..."
                  className="w-full pl-10 pr-4 py-2 bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-200 placeholder-gray-400"
                />
              </div>
            </div>

            {/* Right Section - Actions & User */}
            <div className="flex items-center space-x-3">
              {/* Quick Actions */}
              <div className="hidden lg:flex items-center space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    (window.location.href = `/registral/${schoolSlug}/registration`)
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition-all duration-200"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                  }}
                >
                  <FiPlus className="w-4 h-4" />
                  <span>New Registration</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    (window.location.href = `/registral/${schoolSlug}/students`)
                  }
                  className="flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-700 hover:bg-white hover:shadow-sm rounded-xl text-sm font-medium transition-all duration-200"
                >
                  <FiUsers className="w-4 h-4" />
                  <span>Students</span>
                </motion.button>
              </div>

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
                      {session?.user?.email || "No email"}
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

        {/* Breadcrumb Navigation */}
        <div className="bg-white/50 backdrop-blur-sm border-t border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex py-3" aria-label="Breadcrumb">
              <ol className="flex items-center space-x-2">
                <li>
                  <Link
                    href={`/registral/${schoolSlug}/dashboard`}
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
      </motion.header>

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
                    Registral Portal
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
                        Students
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        {sidebarStats.totalStudents}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-white/50">
                  <div className="flex items-center">
                    <FiDollarSign className="w-4 h-4 text-green-500 mr-2" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">
                        Earnings
                      </p>
                      <p className="text-sm font-bold text-gray-900">
                        ${sidebarStats.monthlyEarnings}
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
          <BrandingContext.Provider value={branding}>
            <AnimatePresence mode="wait">{children}</AnimatePresence>
          </BrandingContext.Provider>
        </main>
      </div>
    </div>
  );
}
