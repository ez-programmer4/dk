"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FiBarChart,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiTarget,
  FiActivity,
  FiRefreshCw,
} from "react-icons/fi";
import { useBranding } from "../layout";

interface AnalyticsData {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  totalRevenue: number;
  monthlyGrowth: number;
  conversionRate: number;
  averageFee: number;
  topPackage: string;
  recentActivity: Array<{
    id: number;
    action: string;
    date: string;
    studentName: string;
  }>;
}

export default function RegistralAnalyticsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("30");

  // Use branding colors for styling
  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  useEffect(() => {
    fetchAnalytics();
  }, [schoolSlug, session?.user?.name, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/registral/${schoolSlug}/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl shadow-xl">
                <FiBarChart className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  Performance Analytics
                </h1>
                <p className="text-gray-600 text-lg">Track your registration performance and insights</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 3 months</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={fetchAnalytics}
                className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-6 text-white shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiUsers className="h-8 w-8 text-blue-200" />
                  <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                    analytics.monthlyGrowth > 0
                      ? "bg-green-200 text-green-800"
                      : "bg-red-200 text-red-800"
                  }`}>
                    {analytics.monthlyGrowth > 0 ? "+" : ""}{analytics.monthlyGrowth}%
                  </span>
                </div>
                <div className="text-3xl font-bold mb-2">{analytics.totalStudents}</div>
                <div className="text-blue-100">Total Students</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-3xl p-6 text-white shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiTrendingUp className="h-8 w-8 text-green-200" />
                </div>
                <div className="text-3xl font-bold mb-2">{analytics.conversionRate}%</div>
                <div className="text-green-100">Conversion Rate</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl p-6 text-white shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiDollarSign className="h-8 w-8 text-purple-200" />
                </div>
                <div className="text-3xl font-bold mb-2">${analytics.totalRevenue.toLocaleString()}</div>
                <div className="text-purple-100">Total Revenue</div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-6 text-white shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <FiTarget className="h-8 w-8 text-orange-200" />
                </div>
                <div className="text-3xl font-bold mb-2">${analytics.averageFee}</div>
                <div className="text-orange-100">Average Fee</div>
              </motion.div>
            </div>

            {/* Charts and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Status Breakdown */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-3xl shadow-2xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiActivity className="text-teal-600" />
                  Student Status Breakdown
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Active Students</span>
                    </div>
                    <span className="font-bold text-green-600">{analytics.activeStudents}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Completed Students</span>
                    </div>
                    <span className="font-bold text-blue-600">{analytics.completedStudents}</span>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                      <span className="font-medium text-gray-900">Top Package</span>
                    </div>
                    <span className="font-bold text-orange-600">{analytics.topPackage}</span>
                  </div>
                </div>
              </motion.div>

              {/* Recent Activity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-3xl shadow-2xl p-8"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FiCalendar className="text-teal-600" />
                  Recent Activity
                </h3>

                <div className="space-y-4">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center">
                          <FiActivity size={16} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.action}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.studentName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Performance Insights */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-3xl shadow-2xl p-8"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FiBarChart className="text-teal-600" />
                Performance Insights
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl">
                  <div className="text-2xl font-bold text-teal-600 mb-2">
                    {analytics.monthlyGrowth > 0 ? "+" : ""}{analytics.monthlyGrowth}%
                  </div>
                  <div className="text-gray-600 font-medium">Monthly Growth</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Student registrations this month
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {Math.round((analytics.activeStudents / analytics.totalStudents) * 100)}%
                  </div>
                  <div className="text-gray-600 font-medium">Retention Rate</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Active students out of total
                  </div>
                </div>

                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    ${Math.round(analytics.totalRevenue / analytics.totalStudents)}
                  </div>
                  <div className="text-gray-600 font-medium">Revenue per Student</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Average earnings per registration
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
