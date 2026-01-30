"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiAward,
  FiTrendingUp,
  FiUsers,
  FiStar,
  FiCheckCircle,
  FiAlertTriangle,
} from "react-icons/fi";

interface QualityMetric {
  id: string;
  title: string;
  value: number;
  trend: "up" | "down" | "stable";
  status: "excellent" | "good" | "needs_improvement";
  description: string;
}

export default function ControllerQualityPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [metrics, setMetrics] = useState<QualityMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for quality metrics
    const mockMetrics: QualityMetric[] = [
      {
        id: "attendance",
        title: "Average Attendance Rate",
        value: 87.5,
        trend: "up",
        status: "good",
        description: "Student attendance across all classes",
      },
      {
        id: "satisfaction",
        title: "Parent Satisfaction",
        value: 92.3,
        trend: "up",
        status: "excellent",
        description: "Based on feedback surveys",
      },
      {
        id: "progress",
        title: "Student Progress Rate",
        value: 78.9,
        trend: "stable",
        status: "good",
        description: "Students showing improvement",
      },
      {
        id: "retention",
        title: "Student Retention",
        value: 94.2,
        trend: "up",
        status: "excellent",
        description: "Students continuing their studies",
      },
    ];

    setTimeout(() => {
      setMetrics(mockMetrics);
      setLoading(false);
    }, 1000);
  }, [schoolSlug]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
        return "text-green-600 bg-green-100";
      case "good":
        return "text-blue-600 bg-blue-100";
      case "needs_improvement":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent":
        return <FiCheckCircle className="h-5 w-5" />;
      case "good":
        return <FiTrendingUp className="h-5 w-5" />;
      case "needs_improvement":
        return <FiAlertTriangle className="h-5 w-5" />;
      default:
        return <FiStar className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
              Quality Review Dashboard
            </h1>
            <p className="text-gray-600">
              Monitor and analyze the quality metrics for {schoolSlug} institution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {metrics.map((metric) => (
              <motion.div
                key={metric.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${getStatusColor(metric.status)}`}>
                    {getStatusIcon(metric.status)}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status.replace("_", " ")}
                  </span>
                </div>

                <div className="mb-2">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">
                    {metric.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {metric.value}%
                  </p>
                </div>

                <p className="text-xs text-gray-500">
                  {metric.description}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <div className="flex items-center gap-3 mb-4">
              <FiAward className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Quality Insights</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Excellent Parent Satisfaction</p>
                  <p className="text-sm text-gray-600">
                    Parents are highly satisfied with the teaching quality and student progress.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Strong Student Retention</p>
                  <p className="text-sm text-gray-600">
                    High retention rate indicates students are engaged and motivated.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Attendance Improvement Needed</p>
                  <p className="text-sm text-gray-600">
                    Focus on improving attendance rates through better engagement strategies.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}




















