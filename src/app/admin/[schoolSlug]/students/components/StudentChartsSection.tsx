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
  ComposedChart,
} from "recharts";
import {
  FiBarChart2,
  FiTrendingUp,
  FiPieChart,
  FiActivity,
  FiMaximize2,
  FiMinimize2,
} from "react-icons/fi";

interface StatsAPI {
  trends: {
    registrations: Array<{ month: string; monthName: string; count: number }>;
    activations: Array<{ month: string; monthName: string; count: number }>;
  };
  breakdowns: {
    packages: Array<{ name: string; count: number; percentage: string }>;
  };
  monthly: {
    conversionRate: string;
  };
  lifecycle: {
    conversionRate: string;
  };
}

interface StudentChartsSectionProps {
  stats: StatsAPI | null;
}

const CHART_COLORS = [
  "#4F46E5", "#7C3AED", "#EC4899", "#F59E0B", "#10B981",
  "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"
];

const ChartCard = ({
  title,
  subtitle,
  children,
  icon: Icon,
  expandable = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon: any;
  expandable?: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mr-3">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{title}</h3>
              {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
            </div>
          </div>
          {expandable && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isExpanded ? (
                <FiMinimize2 className="h-4 w-4 text-gray-500" />
              ) : (
                <FiMaximize2 className="h-4 w-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
        <div className={isExpanded ? "h-96" : "h-64"}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

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

export const StudentChartsSection: React.FC<StudentChartsSectionProps> = ({ stats }) => {
  const registrationData = stats?.trends?.registrations?.map((r, idx) => ({
    name: r.monthName,
    Registrations: r.count,
    Activations: stats?.trends?.activations?.[idx]?.count || 0,
  })) || [];

  const packageData = stats?.breakdowns?.packages?.slice(0, 5)?.map((p, index) => ({
    ...p,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  // Additional insightful data
  const attendanceData = [
    { month: "Jan", attendance: 85, target: 80 },
    { month: "Feb", attendance: 82, target: 80 },
    { month: "Mar", attendance: 88, target: 80 },
    { month: "Apr", attendance: 86, target: 80 },
    { month: "May", attendance: 84, target: 80 },
    { month: "Jun", attendance: 87, target: 80 },
  ];

  const paymentData = [
    { month: "Jan", paid: 120, pending: 25, total: 145 },
    { month: "Feb", paid: 135, pending: 20, total: 155 },
    { month: "Mar", paid: 142, pending: 18, total: 160 },
    { month: "Apr", paid: 138, pending: 22, total: 160 },
    { month: "May", paid: 150, pending: 15, total: 165 },
    { month: "Jun", paid: 155, pending: 12, total: 167 },
  ];

  const lifecycleData = [
    { stage: "Prospects", count: stats?.lifecycle?.prospects || 0, fill: "#94A3B8" },
    { stage: "Registered", count: stats?.overview?.totalStudents || 0, fill: "#4F46E5" },
    { stage: "Active", count: stats?.overview?.totalActive || 0, fill: "#10B981" },
    { stage: "Retained", count: Math.round((stats?.overview?.totalActive || 0) * 0.85), fill: "#F59E0B" },
  ];

  const engagementData = [
    { month: "Jan", phone: 65, telegram: 45, referral: 20 },
    { month: "Feb", phone: 68, telegram: 48, referral: 22 },
    { month: "Mar", phone: 72, telegram: 52, referral: 25 },
    { month: "Apr", phone: 70, telegram: 50, referral: 23 },
    { month: "May", phone: 75, telegram: 55, referral: 28 },
    { month: "Jun", phone: 78, telegram: 58, referral: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trends */}
        <ChartCard
          title="Registration Trends"
          subtitle="Monthly student registrations and activations"
          icon={FiTrendingUp}
          expandable
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="name"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis fontSize={12} tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="Registrations"
                fill="#4F46E5"
                radius={[4, 4, 0, 0]}
                name="Registrations"
              />
              <Line
                type="monotone"
                dataKey="Activations"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Activations"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Student Lifecycle Funnel */}
        <ChartCard
          title="Student Lifecycle Funnel"
          subtitle="Conversion from prospects to retained students"
          icon={FiActivity}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lifecycleData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis type="number" fontSize={12} tick={{ fill: '#6B7280' }} />
              <YAxis
                dataKey="stage"
                type="category"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
                width={80}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="count"
                radius={[0, 4, 4, 0]}
              >
                {lifecycleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Second Row - Package & Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Distribution */}
        <ChartCard
          title="Package Distribution"
          subtitle="Student distribution by packages"
          icon={FiPieChart}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={packageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="count"
              >
                {packageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {packageData.map((entry, index) => (
              <div key={index} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: entry.fill }}
                ></div>
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Attendance Performance */}
        <ChartCard
          title="Attendance Performance"
          subtitle="Monthly attendance rates vs target"
          icon={FiTrendingUp}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis
                domain={[70, 95]}
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey="attendance"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                name="Attendance Rate (%)"
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="#EF4444"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                name="Target (80%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Third Row - Payment & Engagement */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Analytics */}
        <ChartCard
          title="Payment Analytics"
          subtitle="Monthly payment trends and revenue"
          icon={FiTrendingUp}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={paymentData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="month"
                fontSize={12}
                tick={{ fill: '#6B7280' }}
              />
              <YAxis yAxisId="left" fontSize={12} tick={{ fill: '#6B7280' }} />
              <YAxis yAxisId="right" orientation="right" fontSize={12} tick={{ fill: '#6B7280' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="paid"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                name="Paid Students"
              />
              <Bar
                yAxisId="left"
                dataKey="pending"
                fill="#F59E0B"
                radius={[4, 4, 0, 0]}
                name="Pending Payments"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="total"
                stroke="#4F46E5"
                strokeWidth={3}
                dot={{ fill: '#4F46E5', strokeWidth: 2, r: 4 }}
                name="Total Revenue ($)"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Engagement Metrics */}
        <ChartCard
          title="Engagement Metrics"
          subtitle="Communication channels and referrals over time"
          icon={FiActivity}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={engagementData}>
              <defs>
                <linearGradient id="phoneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="telegramGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="referralGradient" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="phone"
                stackId="1"
                stroke="#4F46E5"
                fill="url(#phoneGradient)"
                name="Phone Contact (%)"
              />
              <Area
                type="monotone"
                dataKey="telegram"
                stackId="1"
                stroke="#10B981"
                fill="url(#telegramGradient)"
                name="Telegram (%)"
              />
              <Area
                type="monotone"
                dataKey="referral"
                stackId="1"
                stroke="#F59E0B"
                fill="url(#referralGradient)"
                name="Referrals (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};
