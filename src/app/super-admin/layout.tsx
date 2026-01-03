"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import {
  Crown,
  LayoutDashboard,
  Building2,
  BarChart3,
  Users,
  Settings,
  LogOut,
  TrendingUp,
  CreditCard,
  FileText,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const pathname = usePathname();

  const navigation = [
    {
      name: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
      description: "Overview & Quick Actions",
    },
    {
      name: "Schools",
      href: "/super-admin/schools",
      icon: Building2,
      description: "Manage School Accounts",
    },
    {
      name: "Plans",
      href: "/super-admin/plans",
      icon: FileText,
      description: "Subscription Management",
    },
    {
      name: "Billing",
      href: "/super-admin/billing",
      icon: CreditCard,
      description: "Invoices & Payments",
    },
    {
      name: "Analytics",
      href: "/super-admin/analytics",
      icon: BarChart3,
      description: "Platform Insights",
    },
    {
      name: "Admins",
      href: "/super-admin/admins",
      icon: Shield,
      description: "User Administration",
    },
    {
      name: "Usage",
      href: "/super-admin/usage",
      icon: TrendingUp,
      description: "Resource Monitoring",
    },
    {
      name: "Settings",
      href: "/super-admin/settings",
      icon: Settings,
      description: "System Configuration",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-white/20">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-6 border-b border-gray-100/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Crown className="w-10 h-10 text-indigo-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Super Admin
                </span>
                <p className="text-xs text-gray-500 -mt-1">Platform Control Center</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-8 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div className={cn(
                    "group relative flex items-center px-4 py-4 text-gray-700 rounded-2xl transition-all duration-200 hover:scale-[1.02]",
                    isActive
                      ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                      : "hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:shadow-md"
                  )}>
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                    )}

                    <div className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-xl mr-4 transition-all",
                      isActive
                        ? "bg-white/20"
                        : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
                    )}>
                      <item.icon className={cn(
                        "w-5 h-5",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-indigo-600"
                      )} />
                    </div>

                    <div className="flex-1">
                      <span className={cn(
                        "font-semibold text-sm",
                        isActive ? "text-white" : "text-gray-700 group-hover:text-indigo-900"
                      )}>
                        {item.name}
                      </span>
                      <p className={cn(
                        "text-xs mt-0.5",
                        isActive ? "text-white/80" : "text-gray-500 group-hover:text-indigo-600"
                      )}>
                        {item.description}
                      </p>
                    </div>

                    {/* Hover effect */}
                    {!isActive && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 to-purple-600/0 group-hover:from-indigo-500/5 group-hover:to-purple-600/5 transition-all duration-200"></div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-6 border-t border-gray-100/50 bg-gradient-to-r from-gray-50/50 to-indigo-50/50">
            <div className="flex items-center space-x-3 mb-4 p-3 bg-white/50 rounded-xl backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Super Administrator</p>
                <p className="text-xs text-gray-500">Full Platform Access</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start bg-white/50 hover:bg-white border-gray-200 hover:border-indigo-300 transition-all duration-200"
              onClick={() => signOut({ callbackUrl: "/super-admin/login" })}
            >
              <LogOut className="w-4 h-4 mr-3 text-gray-600" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-72">
        <main className="min-h-screen">
          <div className="max-w-[2000px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      <div className="fixed inset-0 z-40 bg-black/50 lg:hidden hidden">
        {/* Mobile sidebar trigger would go here */}
      </div>
    </div>
  );
}
