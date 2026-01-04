"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
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
} from "react-icons/fi";
import { signOut } from "next-auth/react";

interface SchoolBranding {
  primaryColor: string;
  secondaryColor: string;
  logo: string;
  name: string;
  theme: string;
}

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
          const response = await fetch(`/api/admin/${schoolSlug}/branding`);
          if (response.ok) {
            const data = await response.json();
            setBranding(data);
          }
        } catch (error) {
          console.error("Failed to fetch branding:", error);
        }
      };
      fetchBranding();
    }
  }, [schoolSlug]);

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const logoUrl = branding?.logo || "/logo.png";
  const schoolName = branding?.name || "Darulkubra Quran Academy";

  const navItems = [
    {
      href: `/registral/${schoolSlug}/dashboard`,
      label: "Dashboard",
      icon: FiHome,
    },
    {
      href: `/registral/${schoolSlug}/registration`,
      label: "Registration",
      icon: FiPlus,
    },
    {
      href: `/registral/${schoolSlug}/students`,
      label: "My Students",
      icon: FiUsers,
    },
    {
      href: `/registral/${schoolSlug}/analytics`,
      label: "Analytics",
      icon: FiBarChart,
    },
    {
      href: `/registral/${schoolSlug}/earnings`,
      label: "Earnings",
      icon: FiDollarSign,
    },
    {
      href: `/registral/${schoolSlug}/settings`,
      label: "Settings",
      icon: FiSettings,
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
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
                  e.currentTarget.src = "/logo.png";
                }}
              />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{schoolName}</h1>
                <p className="text-xs text-gray-500">Registral Portal</p>
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
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-teal-50 text-teal-700 shadow-md"
                          : "text-gray-700 hover:bg-gray-50 hover:text-teal-600"
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
          <AnimatePresence mode="wait">
            {children}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
