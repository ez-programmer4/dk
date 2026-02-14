"use client";

import Link from "next/link";
import { ReactNode, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  DollarSign,
  Crown,
  FileText,
  Menu,
  X,
  ChevronRight,
  Shield,
  Activity,
  Database,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const navigation = [
    {
      name: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Analytics",
      badge: "New",
    },
    {
      name: "Schools",
      href: "/super-admin/schools",
      icon: Building2,
      description: "Manage Schools",
      badge: null,
    },
    {
      name: "Payments",
      href: "/super-admin/payments",
      icon: DollarSign,
      description: "Financial Overview",
      badge: null,
    },
    {
      name: "Payment Approvals",
      href: "/super-admin/payments/approvals",
      icon: FileText,
      description: "Review Submissions",
      badge: null,
    },
    {
      name: "Premium Features",
      href: "/super-admin/premium-features",
      icon: Crown,
      description: "Feature Management",
      badge: "Pro",
    },
    {
      name: "Settings",
      href: "/super-admin/settings",
      icon: Settings,
      description: "System Configuration",
      badge: null,
    },
  ];

  const sidebarVariants = {
    open: { x: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
    closed: { x: "-100%", transition: { type: "spring" as const, stiffness: 300, damping: 30 } },
  };

  const overlayVariants = {
    open: { opacity: 1, transition: { duration: 0.2 } },
    closed: { opacity: 0, transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={overlayVariants}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={isMobile ? (sidebarOpen ? "open" : "closed") : "open"}
        variants={sidebarVariants}
        className={`${
          isMobile
            ? "fixed inset-y-0 left-0 z-50 w-80"
            : "relative w-80 flex-shrink-0"
        } bg-white shadow-xl border-r border-gray-200 h-screen`}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Logo Section */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 opacity-5" />
            <div className="relative flex items-center justify-center h-20 px-6 border-b border-gray-200">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="flex items-center space-x-3"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 rounded-xl blur opacity-20" />
                  <div className="relative bg-gradient-to-r from-gray-800 to-gray-600 p-3 rounded-xl">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    Super Admin
                  </h1>
                  <p className="text-xs text-gray-500 font-medium">Management Portal</p>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Enhanced Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              return (
                <motion.div
                  key={item.name}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={item.href} onClick={() => isMobile && setSidebarOpen(false)}>
                    <div
                      className={`group relative flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-gradient-to-r from-gray-800 to-gray-600 text-white shadow-lg shadow-gray-500/25"
                          : "text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-600 rounded-xl"
                          initial={false}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                      )}
                      <div className="relative flex items-center w-full">
                        <div className={`p-2 rounded-lg mr-3 transition-colors ${
                          isActive
                            ? "bg-white/20"
                            : "bg-gray-100 group-hover:bg-gray-200"
                        }`}>
                          <item.icon className={`w-5 h-5 ${
                            isActive ? "text-white" : "text-gray-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className={`font-semibold text-sm ${
                              isActive ? "text-white" : "text-gray-700"
                            }`}>
                              {item.name}
                            </span>
                            {item.badge && (
                              <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                item.badge === "New"
                                  ? "bg-green-500 text-white"
                                  : item.badge === "Pro"
                                  ? "bg-black text-white"
                                  : "bg-gray-600 text-white"
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-0.5 ${
                            isActive ? "text-white/70" : "text-gray-500"
                          }`}>
                            {item.description}
                          </p>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${
                          isActive ? "text-white" : "text-gray-400 group-hover:translate-x-1"
                        }`} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          {/* Enhanced Footer */}
          <div className="p-4 border-t border-white/20">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {/* User Status */}
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-gray-800 to-gray-600 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Super Admin</p>
                  <p className="text-xs text-gray-600">Active Session</p>
                </div>
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                className="w-full justify-start bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all duration-300"
                onClick={() => signOut({ callbackUrl: "/super-admin/login" })}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 transition-all duration-300">
        {/* Mobile Header */}
        {isMobile && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(true)}
                className="hover:bg-gray-50 hover:text-gray-700"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <h1 className="font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Super Admin Portal
              </h1>
              <div className="w-9" /> {/* Spacer for centering */}
            </div>
          </motion.div>
        )}

        <main className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,.15) 1px, transparent 0)`,
              backgroundSize: '20px 20px'
            }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative py-8 px-4 sm:px-6 lg:px-10"
          >
            <div className="max-w-[2000px] mx-auto w-full">
              {children}
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
