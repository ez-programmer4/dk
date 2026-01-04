"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useParams, usePathname } from "next/navigation";
import React, { useEffect, useState, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FiUser, FiDollarSign, FiPlus, FiBarChart, FiCalendar, FiSettings,
  FiLogOut, FiHome, FiUsers, FiTrendingUp, FiClipboard, FiAward,
  FiClock, FiTarget, FiActivity, FiChevronDown, FiStar, FiMail,
  FiBell, FiSearch, FiBookOpen, FiPieChart, FiZap, FiHeart, FiShield,
  FiTrendingDown,
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
  if (!context) {
    throw new Error("useBranding must be used within a BrandingProvider");
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

      if (!userSchoolSlug && schoolSlug !== "darulkubra") {
        router.push("/login");
        return;
      }
    }
  }, [status, session, router, schoolSlug]);

  useEffect(() => {
    if (schoolSlug) {
      const fetchBranding = async () => {
        try {
          const response = await fetch(`/api/controller/${schoolSlug}/branding`);
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
          console.error("Failed to fetch branding:", error);
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

  const navItems = [
    {
      href: `/controller/${schoolSlug}/dashboard`,
      label: "Dashboard",
      icon: FiHome,
    },
    {
      href: `/controller/${schoolSlug}/teachers`,
      label: "My Teachers",
      icon: FiUsers,
    },
    {
      href: `/controller/${schoolSlug}/earnings`,
      label: "Earnings",
      icon: FiDollarSign,
    },
    {
      href: `/controller/${schoolSlug}/student-analytics`,
      label: "Student Analytics",
      icon: FiBarChart,
    },
    {
      href: `/controller/${schoolSlug}/subscriptions`,
      label: "Subscriptions",
      icon: FiClipboard,
    },
    {
      href: `/controller/${schoolSlug}/quality`,
      label: "Quality Review",
      icon: FiAward,
    },
    {
      href: `/controller/${schoolSlug}/ratings`,
      label: "Teacher Ratings",
      icon: FiStar,
    },
  ];

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
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <img
                  src={logoUrl}
                  alt={`${schoolName} Logo`}
                  className="h-10 w-10 rounded-lg mr-3"
                  onError={(e) => {
                    if (e.currentTarget.src !== "/logo.svg") {
                      e.currentTarget.src = "/logo.svg";
                    }
                  }}
                />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {schoolName}
                  </h1>
                  <p className="text-xs text-gray-500">Controller Portal</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {session?.user?.role}
                  </p>
                </div>
                <button
                  onClick={() =>
                    signOut({ callbackUrl: "/login", redirect: true })
                  }
                  className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  title="Logout"
                >
                  <FiLogOut size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.header>

        <div className="flex">
          {/* Sidebar */}
          <motion.nav
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            className="w-64 bg-white shadow-lg border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16"
          >
            <div className="p-6">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                          isActive
                            ? "bg-[var(--primary-color)] text-white shadow-md"
                            : "text-gray-700 hover:bg-gray-50 hover:text-[var(--primary-color)]"
                        }`}
                      >
                        <item.icon className="mr-3 h-5 w-5" />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
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
