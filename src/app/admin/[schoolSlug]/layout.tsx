"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  Home,
  Users,
  Calendar,
  DollarSign,
  Settings,
  Star,
  LogOut,
  X,
  Shield,
  UserCheck,
  Award,
  Coins,
  FileText,
  Clock,
  Timer,
  Package,
  Receipt,
  ChevronDown,
  ChevronRight,
  BarChart3,
  GraduationCap,
  CreditCard,
  Cog,
  UserCog,
  TrendingUp,
} from "lucide-react";
import Header from "./components/Header";
import { useSession, signOut } from "next-auth/react";

interface SchoolBranding {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  name?: string;
  theme?: "light" | "dark" | "system";
}

const navGroups = [
  {
    id: "main",
    label: "Main",
    icon: Home,
    items: [{ href: "", label: "Dashboard", icon: Home }],
  },
  {
    id: "users",
    label: "User Management",
    icon: UserCog,
    items: [
      { href: "/users", label: "Users", icon: Users },
      { href: "/students", label: "Students", icon: Users },
    ],
  },
  {
    id: "academic",
    label: "Academic",
    icon: GraduationCap,
    items: [
      { href: "/teacher-schedules", label: "Daily Attendance", icon: Clock },
      { href: "/teacher-durations", label: "Teaching Durations", icon: Timer },
      { href: "/permissions", label: "Permissions", icon: Shield },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    items: [
      { href: "/lateness", label: "Lateness Analytics", icon: UserCheck },
      { href: "/ustaz", label: "Teacher Ratings", icon: Star },
      { href: "/quality", label: "Quality Review", icon: Award },
    ],
  },
  {
    id: "financial",
    label: "Financial",
    icon: CreditCard,
    items: [
      { href: "/teacher-payments", label: "Teacher Payments", icon: Coins },
      { href: "/pending-deposits", label: "Pending Deposits", icon: Receipt },
      {
        href: "/controller-earnings",
        label: "Controller Earnings",
        icon: DollarSign,
      },
      { href: "/registrar-earnings", label: "Registrar Earnings", icon: Award },
    ],
  },
  {
    id: "configuration",
    label: "Configuration",
    icon: Cog,
    items: [
      { href: "/settings", label: "Settings", icon: Settings },
      {
        href: "/deduction-adjustments",
        label: "Deduction Adjustment",
        icon: Calendar,
      },
      {
        href: "/package-deductions",
        label: "Package Deductions",
        icon: Settings,
      },
      {
        href: "/package-salaries",
        label: "Package Salaries",
        icon: DollarSign,
      },
      {
        href: "/student-config",
        label: "Student Configuration",
        icon: Settings,
      },
      { href: "/on-progress", label: "On Progress Student", icon: Users },
    ],
  },
];

const SidebarContent = ({
  schoolSlug,
  branding,
}: {
  schoolSlug: string;
  branding?: SchoolBranding | null;
}) => {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {
      main: true,
      users: true,
      academic: false,
      analytics: false,
      financial: false,
      configuration: false,
    }
  );

  // Enhanced branding with defaults
  const primaryColor = branding?.primaryColor || "#4F46E5";
  const secondaryColor = branding?.secondaryColor || "#7C3AED";
  const logoUrl = branding?.logoUrl;
  const schoolName = branding?.name || "School Admin";

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isGroupActive = (group: (typeof navGroups)[0]) => {
    return group.items.some((item) => {
      const fullHref = `/admin/${schoolSlug}${item.href}`;
      return item.href === ""
        ? pathname === fullHref
        : pathname.startsWith(fullHref);
    });
  };

  return (
    <div
      className="flex flex-col h-full min-h-0 relative overflow-hidden"
      style={
        {
          "--primary-color": primaryColor,
          "--secondary-color": secondaryColor,
        } as React.CSSProperties
      }
    >
      {/* Enhanced Background with Branding */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-color)] via-[var(--primary-color)]/95 to-[var(--secondary-color)]/90" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />

      {/* Professional Header Section with Enhanced Branding */}
      <div className="relative flex-shrink-0 p-6 border-b border-white/10 backdrop-blur-sm bg-white/5">
        <Link
          href={`/admin/${schoolSlug}`}
          className="flex items-center gap-4 text-white group"
        >
          <div className="relative">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt={`${schoolName} Logo`}
                  className="h-14 w-14 rounded-xl shadow-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-br from-white/20 to-white/10 rounded-xl shadow-lg ring-2 ring-white/20 group-hover:ring-white/40 transition-all duration-300">
                <Shield className="h-6 w-6 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white leading-tight truncate group-hover:text-white/90 transition-colors">
              {schoolName}
            </h1>
            <p className="text-sm text-white/70 font-medium">
              Administration Portal
            </p>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-2 px-2 py-1 bg-green-500/20 rounded-full border border-green-400/30">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-green-300">
                  Online
                </span>
              </div>
              <span className="text-xs text-white/60 font-medium">v2.1.0</span>
            </div>
          </div>
        </Link>

        {/* School Stats */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/10 rounded-lg p-2 border border-white/20">
            <div className="text-xs text-white/70 font-medium">Students</div>
            <div className="text-sm font-bold text-white">1,247</div>
          </div>
          <div className="bg-white/10 rounded-lg p-2 border border-white/20">
            <div className="text-xs text-white/70 font-medium">Teachers</div>
            <div className="text-sm font-bold text-white">89</div>
          </div>
        </div>
      </div>

      {/* Enhanced Grouped Navigation */}
      <nav className="relative flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="space-y-2">
          {navGroups.map((group) => {
            const isExpanded = expandedGroups[group.id];
            const groupIsActive = isGroupActive(group);

            return (
              <div key={group.id} className="space-y-1">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 group ${
                    groupIsActive
                      ? "bg-white/15 text-white shadow-lg ring-1 ring-white/20"
                      : "text-white/90 hover:bg-white/10 hover:text-white hover:shadow-md"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg transition-all duration-300 ${
                      groupIsActive
                        ? "bg-white/20"
                        : "bg-white/10 group-hover:bg-white/15"
                    }`}
                  >
                    <group.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-left">{group.label}</span>
                  <div
                    className={`transition-transform duration-300 ${
                      isExpanded ? "rotate-0" : "-rotate-90"
                    }`}
                  >
                    <ChevronDown className="h-4 w-4 text-white/60" />
                  </div>
                </button>

                {/* Group Items */}
                {isExpanded && (
                  <div className="ml-6 space-y-1">
                    {group.items.map((item) => {
                      const fullHref = `/admin/${schoolSlug}${item.href}`;
                      const isActive =
                        item.href === ""
                          ? pathname === fullHref
                          : pathname.startsWith(fullHref);

                      return (
                        <Link
                          key={item.label}
                          href={fullHref}
                          className={`group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-300 overflow-hidden ${
                            isActive
                              ? "bg-white/20 text-white shadow-md ring-1 ring-white/30 transform scale-[1.02]"
                              : "text-white/70 hover:bg-white/10 hover:text-white hover:scale-[1.01]"
                          }`}
                        >
                          {/* Active Indicator */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
                          )}

                          {/* Icon */}
                          <div
                            className={`relative p-1 rounded-md transition-all duration-300 ${
                              isActive
                                ? "bg-white/20"
                                : "bg-white/5 group-hover:bg-white/10"
                            }`}
                          >
                            <item.icon
                              className={`h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110 ${
                                isActive ? "text-white" : "text-white/80"
                              }`}
                            />
                          </div>

                          {/* Label */}
                          <span
                            className={`relative ${
                              isActive
                                ? "text-white font-semibold"
                                : "text-white/80 group-hover:text-white"
                            }`}
                          >
                            {item.label}
                          </span>

                          {/* Glow Effect */}
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-lg animate-pulse" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>

      {/* Enhanced Footer with Branding */}
      <div className="relative flex-shrink-0 p-4 border-t border-white/10 bg-gradient-to-t from-black/20 to-transparent backdrop-blur-sm">
        <div className="space-y-3">
          {/* User Session Info */}
          <div className="px-3 py-3 bg-white/10 rounded-lg border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-white/20 to-white/10 rounded-full flex items-center justify-center">
                <UserCog className="h-4 w-4 text-white/80" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white/90 truncate">
                  Admin Session
                </p>
                <p className="text-xs text-white/60">Active • Multi-tenant</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group">
              <Settings className="h-4 w-4 text-white/70 group-hover:text-white" />
            </button>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors group">
              <TrendingUp className="h-4 w-4 text-white/70 group-hover:text-white" />
            </button>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="group relative w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/90 hover:text-white transition-all duration-300 bg-white/10 hover:bg-red-500/20 border border-white/20 hover:border-red-400/30 hover:shadow-lg hover:scale-[1.02] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-1.5 bg-white/10 rounded-lg group-hover:bg-red-500/20 transition-colors duration-300">
              <LogOut className="h-4 w-4 group-hover:text-red-300 transition-colors duration-300" />
            </div>
            <span className="relative font-semibold">Sign Out Securely</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default function SchoolAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schoolBranding, setSchoolBranding] = useState<SchoolBranding | null>(
    null
  );
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();

  const schoolSlug = params.schoolSlug as string;

  // Check if user has access to this school and fetch branding
  useEffect(() => {
    if (session?.user) {
      const userSchoolId = session.user.schoolId;
      const userSchoolSlug = session.user.schoolSlug;

      // If user is trying to access a different school than their own, redirect
      if (userSchoolSlug && userSchoolSlug !== schoolSlug) {
        router.push(`/admin/${userSchoolSlug}`);
        return;
      }

      // If user doesn't have school access but is trying to access admin, redirect to login
      if (!userSchoolId && session.user.role === "admin") {
        router.push("/login");
        return;
      }

      // Fetch school branding
      const fetchBranding = async () => {
        try {
          const response = await fetch(`/api/admin/${schoolSlug}/branding`);
          if (response.ok) {
            const branding = await response.json();
            setSchoolBranding(branding);
          }
        } catch (error) {
          console.error("Failed to fetch school branding:", error);
        }
      };

      if (userSchoolId) {
        fetchBranding();
      }
    }
  }, [session, schoolSlug, router]);

  const currentNavItem = navGroups
    .flatMap((group) => group.items)
    .reverse()
    .find((item) => pathname.startsWith(`/admin/${schoolSlug}${item.href}`));
  const pageTitle = currentNavItem ? currentNavItem.label : "Dashboard";

  return (
    <div className="flex min-h-screen bg-slate-50 text-gray-900">
      {sidebarOpen && (
        <div
          className="fixed inset-0 flex z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          {/* Enhanced Backdrop */}
          <div
            className="fixed inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/90 to-black/95 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Enhanced Mobile Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full shadow-2xl overflow-hidden">
            {/* Mobile Header with Close Button */}
            <div className="absolute top-4 right-4 z-10">
              <button
                type="button"
                className="flex items-center justify-center h-10 w-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 shadow-lg"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent schoolSlug={schoolSlug} branding={schoolBranding} />
          </div>

          {/* Spacer */}
          <div className="flex-shrink-0 w-4" aria-hidden="true" />
        </div>
      )}

      {/* Enhanced Static Sidebar for Large Screens */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="w-80 h-screen sticky top-0 overflow-hidden shadow-2xl">
          <SidebarContent schoolSlug={schoolSlug} branding={schoolBranding} />
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <Header
          pageTitle={`${pageTitle} - ${schoolBranding?.name || schoolSlug}`}
          userName={session?.user?.name || "Admin"}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 sm:p-8 lg:p-10">
          <div className="max-w-7xl mx-auto">
            {/* Page Content with Enhanced Background */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6 sm:p-8 lg:p-10 min-h-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
