"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FiCalendar,
  FiBarChart,
  FiGift,
  FiAward,
  FiCheck,
  FiLogOut,
  FiUsers,
  FiBook,
  FiInfo,
  FiPackage,
} from "react-icons/fi";

const navSections = [
  {
    heading: "Main",
    items: [
      { href: "/controller", label: "Dashboard", icon: FiBarChart },
      { href: "/controller/subscriptions", label: "Subscriptions", icon: FiPackage },
      { href: "/attendance-list", label: "Attendance List", icon: FiCalendar },
      { href: "/controller/student-analytics", label: "Terbiya", icon: FiBook },
      { href: "/analytics", label: "Analytics", icon: FiBarChart },
      { href: "/controller/ratings", label: "Ustaz Rating", icon: FiBarChart },
      { href: "/controller/teachers", label: "Teachers Info", icon: FiInfo },
    ],
  },
  {
    heading: "Management",
    items: [
      { href: "/controller/earnings", label: "Earnings", icon: FiAward },
      { href: "/controller/quality", label: "Quality Review", icon: FiCheck },
    ],
  },
];

export default function ControllerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full h-full bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col shadow-2xl">
      {/* Enhanced Header */}
      <div className="relative flex items-center justify-center h-20 border-b border-gray-700/50 bg-gradient-to-r from-indigo-900/50 via-purple-900/30 to-indigo-900/50 flex-shrink-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-indigo-600/10"></div>
        <Link 
          href="/controller" 
          className="relative z-10 flex items-center gap-3 text-white group"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-2 shadow-lg group-hover:scale-110 transition-transform">
              <FiBarChart className="h-6 w-6 text-white" />
            </div>
          </div>
          <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            Controller Panel
          </span>
        </Link>
      </div>

      {/* Enhanced Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-5 overflow-y-auto scrollbar-thin scrollbar-thumb-indigo-600/50 scrollbar-track-gray-800/50">
        {navSections.map((section) => (
          <div key={section.heading}>
            <div className="text-xs font-bold uppercase text-indigo-300/70 mb-3 pl-3 tracking-wider">
              {section.heading}
            </div>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const isActive =
                  item.href === "/controller"
                    ? pathname === item.href
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300
                      ${
                        isActive
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02]"
                          : "text-gray-300 hover:bg-gray-700/50 hover:text-white hover:translate-x-1"
                      }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                    )}
                    <item.icon 
                      className={`h-5 w-5 flex-shrink-0 transition-transform ${
                        isActive 
                          ? "text-white scale-110" 
                          : "text-gray-400 group-hover:text-indigo-400 group-hover:scale-110"
                      }`} 
                    />
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/10 to-transparent"></div>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="my-5 border-t border-gray-700/50" />
          </div>
        ))}
      </nav>

      {/* Enhanced Footer */}
      <div className="px-3 py-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-900/50 flex-shrink-0 backdrop-blur-sm">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-300 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-700/20 hover:text-red-300 hover:border-red-500/30 border border-transparent transition-all duration-300 group"
        >
          <FiLogOut className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
