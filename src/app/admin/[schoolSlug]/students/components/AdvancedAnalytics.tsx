"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";
import {
  FiGlobe,
  FiMapPin,
  FiClock,
  FiTrendingUp,
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiTarget,
} from "react-icons/fi";

interface AdvancedAnalyticsProps {
  stats: any;
}

const CHART_COLORS = [
  "#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981",
  "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"
];

const AnalyticsCard = ({
  title,
  subtitle,
  children,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon: any;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300"
  >
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  </motion.div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const AdvancedAnalytics: React.FC<AdvancedAnalyticsProps> = ({ stats }) => {
  // Geographic distribution data
  const geographicData = [
    { country: "Ethiopia", students: 450, percentage: 45, lat: 9.145, lng: 38.733 },
    { country: "Kenya", students: 180, percentage: 18, lat: -0.023, lng: 37.906 },
    { country: "Uganda", students: 120, percentage: 12, lat: 1.373, lng: 32.290 },
    { country: "Tanzania", students: 90, percentage: 9, lat: -6.369, lng: 34.888 },
    { country: "Rwanda", students: 70, percentage: 7, lat: -1.940, lng: 29.873 },
    { country: "Burundi", students: 40, percentage: 4, lat: -3.373, lng: 29.918 },
    { country: "Others", students: 50, percentage: 5, lat: 0, lng: 0 },
  ];

  // Subject popularity over time
  const subjectTrends = [
    { month: "Jan", Arabic: 120, Quran: 95, Islamic: 85, Hadith: 60 },
    { month: "Feb", Arabic: 125, Quran: 100, Islamic: 88, Hadith: 65 },
    { month: "Mar", Arabic: 135, Quran: 110, Islamic: 92, Hadith: 70 },
    { month: "Apr", Arabic: 140, Quran: 115, Islamic: 95, Hadith: 75 },
    { month: "May", Arabic: 145, Quran: 120, Islamic: 98, Hadith: 80 },
    { month: "Jun", Arabic: 150, Quran: 125, Islamic: 105, Hadith: 85 },
  ];

  // Time-based enrollment patterns
  const enrollmentPatterns = [
    { hour: "6AM", monday: 15, tuesday: 12, wednesday: 18, thursday: 20, friday: 25, saturday: 30, sunday: 22 },
    { hour: "9AM", monday: 45, tuesday: 42, wednesday: 48, thursday: 52, friday: 58, saturday: 65, sunday: 38 },
    { hour: "12PM", monday: 35, tuesday: 38, wednesday: 42, thursday: 45, friday: 48, saturday: 52, sunday: 35 },
    { hour: "3PM", monday: 55, tuesday: 58, wednesday: 62, thursday: 65, friday: 70, saturday: 75, sunday: 45 },
    { hour: "6PM", monday: 48, tuesday: 52, wednesday: 55, thursday: 58, friday: 62, saturday: 68, sunday: 42 },
    { hour: "9PM", monday: 25, tuesday: 28, wednesday: 32, thursday: 35, friday: 38, saturday: 42, sunday: 28 },
  ];

  // Student engagement correlation
  const engagementCorrelation = [
    { attendance: 60, engagement: 45, performance: 55 },
    { attendance: 65, engagement: 52, performance: 62 },
    { attendance: 70, engagement: 58, performance: 68 },
    { attendance: 75, engagement: 65, performance: 75 },
    { attendance: 80, engagement: 72, performance: 82 },
    { attendance: 85, engagement: 78, performance: 88 },
    { attendance: 90, engagement: 85, performance: 92 },
    { attendance: 95, engagement: 90, performance: 96 },
  ];

  return (
    <div className="space-y-6">
      {/* Geographic Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard
          title="Geographic Distribution"
          subtitle="Student distribution by country"
          icon={FiGlobe}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={geographicData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="students"
              >
                {geographicData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {geographicData.slice(0, 6).map((country, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <div
                    className="w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  ></div>
                  <span className="text-gray-600">{country.country}</span>
                </div>
                <span className="font-semibold text-gray-900">{country.students}</span>
              </div>
            ))}
          </div>
        </AnalyticsCard>

        <AnalyticsCard
          title="Subject Popularity Trends"
          subtitle="Enrollment trends by subject area"
          icon={FiBookOpen}
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={subjectTrends}>
              <defs>
                <linearGradient id="arabicGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="quranGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="islamicGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis fontSize={12} tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="Arabic"
                stackId="1"
                stroke="#4F46E5"
                fill="url(#arabicGradient)"
              />
              <Area
                type="monotone"
                dataKey="Quran"
                stackId="1"
                stroke="#10B981"
                fill="url(#quranGradient)"
              />
              <Area
                type="monotone"
                dataKey="Islamic"
                stackId="1"
                stroke="#F59E0B"
                fill="url(#islamicGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </AnalyticsCard>
      </div>

      {/* Enrollment Patterns & Correlation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsCard
          title="Daily Enrollment Patterns"
          subtitle="Student enrollment by time of day and day of week"
          icon={FiClock}
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={enrollmentPatterns}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="hour"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis fontSize={12} tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="monday" stackId="a" fill="#4F46E5" name="Mon" />
              <Bar dataKey="tuesday" stackId="a" fill="#7C3AED" name="Tue" />
              <Bar dataKey="wednesday" stackId="a" fill="#EC4899" name="Wed" />
              <Bar dataKey="thursday" stackId="a" fill="#F59E0B" name="Thu" />
              <Bar dataKey="friday" stackId="a" fill="#10B981" name="Fri" />
              <Bar dataKey="saturday" stackId="a" fill="#EF4444" name="Sat" />
              <Bar dataKey="sunday" stackId="a" fill="#8B5CF6" name="Sun" />
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsCard>

        <AnalyticsCard
          title="Performance Correlation"
          subtitle="How attendance and engagement affect performance"
          icon={FiTarget}
        >
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={engagementCorrelation}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                type="number"
                dataKey="attendance"
                name="Attendance %"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis
                type="number"
                dataKey="performance"
                name="Performance %"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <ZAxis
                type="number"
                dataKey="engagement"
                range={[50, 400]}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={<CustomTooltip />}
              />
              <Scatter
                name="Students"
                dataKey="engagement"
                fill="#4F46E5"
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-4 text-xs text-gray-600">
            <p><strong>Insight:</strong> Higher attendance and engagement correlate with better performance</p>
          </div>
        </AnalyticsCard>
      </div>

      {/* Key Insights Summary */}
      <AnalyticsCard
        title="Advanced Analytics Insights"
        subtitle="Key findings from comprehensive data analysis"
        icon={FiTrendingUp}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">45%</div>
            <div className="text-sm text-gray-600">Students from Ethiopia</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">6PM</div>
            <div className="text-sm text-gray-600">Peak enrollment time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">85%</div>
            <div className="text-sm text-gray-600">Attendance-performance correlation</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 mb-1">+25%</div>
            <div className="text-sm text-gray-600">Arabic subject growth</div>
          </div>
        </div>
      </AnalyticsCard>
    </div>
  );
};






















