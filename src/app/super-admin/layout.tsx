"use client";

import Link from "next/link";
import { ReactNode } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

interface SuperAdminLayoutProps {
  children: ReactNode;
}

export default function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const navigation = [
    {
      name: "Dashboard",
      href: "/super-admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Schools",
      href: "/super-admin/schools",
      icon: Building2,
    },
    {
      name: "School Registrations",
      href: "/super-admin/school-registrations",
      icon: FileText,
    },
    {
      name: "Payments",
      href: "/super-admin/payments",
      icon: DollarSign,
    },
    {
      name: "Premium Features",
      href: "/super-admin/premium-features",
      icon: Crown,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b">
            <div className="flex items-center space-x-2">
              <Crown className="w-8 h-8 text-purple-600" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Super Admin
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link key={item.name} href={item.href}>
                <div className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: "/super-admin/login" })}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="py-8 px-6 lg:px-10">
          <div className="max-w-[1800px] mx-auto w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
