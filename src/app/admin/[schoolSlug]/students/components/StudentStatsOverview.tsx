"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiTrendingUp,
  FiTrendingDown,
  FiActivity,
  FiTarget,
  FiPercent,
} from "react-icons/fi";

interface StatsAPI {
  overview: {
    totalStudents: number;
    totalActive: number;
    totalNotYet: number;
    activeRate: string;
  };
  monthly: {
    registered: number;
    started: number;
    left: number;
    conversionRate: string;
    retentionRate: string;
  };
  lifecycle: {
    prospects: number;
    active: number;
    churned: number;
    conversionRate: string;
  };
  payments: {
    currentMonth: {
      totalStudents: number;
      paidStudents: number;
      pendingStudents: number;
    };
  };
}

interface StudentStatsOverviewProps {
  stats: StatsAPI | null;
  statsLoading: boolean;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  bgColor,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  color: string;
  bgColor: string;
  trend?: "up" | "down" | "neutral";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-black text-gray-900 mb-1">{value}</p>
        <p className="text-xs text-gray-500">{subtitle}</p>
      </div>
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center ${bgColor}`}
      >
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
    {trend && (
      <div className="flex items-center mt-2">
        {trend === "up" ? (
          <FiTrendingUp className="h-4 w-4 text-green-500 mr-1" />
        ) : trend === "down" ? (
          <FiTrendingDown className="h-4 w-4 text-red-500 mr-1" />
        ) : (
          <FiActivity className="h-4 w-4 text-gray-500 mr-1" />
        )}
        <span className="text-xs text-gray-500">
          {trend === "up" ? "Increasing" : trend === "down" ? "Decreasing" : "Stable"}
        </span>
      </div>
    )}
  </motion.div>
);

export const StudentStatsOverview: React.FC<StudentStatsOverviewProps> = ({
  stats,
  statsLoading,
}) => {
  if (statsLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm animate-pulse"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const overviewCards = [
    {
      title: "Total Students",
      value: stats?.overview?.totalStudents?.toLocaleString() || "0",
      subtitle: "Registered learners",
      icon: FiUsers,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "up" as const,
    },
    {
      title: "Active Students",
      value: stats?.overview?.totalActive?.toLocaleString() || "0",
      subtitle: `${stats?.overview?.activeRate || "0"}% of total`,
      icon: FiCheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up" as const,
    },
    {
      title: "Pending Activation",
      value: stats?.overview?.totalNotYet?.toLocaleString() || "0",
      subtitle: "Awaiting to start",
      icon: FiClock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "neutral" as const,
    },
    {
      title: "Conversion Rate",
      value: `${stats?.lifecycle?.conversionRate || "0"}%`,
      subtitle: "Prospects to active",
      icon: FiTarget,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "up" as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {overviewCards.map((card, index) => (
        <StatCard key={index} {...card} />
      ))}
    </div>
  );
};


















