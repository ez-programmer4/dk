"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiCalendar,
  FiTarget,
  FiAward,
  FiRefreshCw,
} from "react-icons/fi";
import { useBranding } from "../layout";

export default function ControllerEarningsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();

  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  useEffect(() => {
    if (schoolSlug) {
      fetchEarnings();
    }
  }, [schoolSlug, selectedMonth]);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/controller/${schoolSlug}/earnings?month=${selectedMonth}`);
      if (response.ok) {
        const data = await response.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans"
      style={{ "--primary-color": primaryColor, "--secondary-color": secondaryColor } as React.CSSProperties}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Earnings Overview for {schoolName}
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                Track your monthly earnings and performance metrics.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary-color)] focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - i);
                  const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                  const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
                  return (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  );
                })}
              </select>

              <button
                onClick={fetchEarnings}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition-colors"
              >
                <FiRefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-6 shadow-md border border-gray-100 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </motion.div>
              ))}
            </div>
          ) : earnings ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-md border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Total Reward</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                      ${earnings.reward || 0}
                    </p>
                  </div>
                  <FiDollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-md border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Total Registrations</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">
                      {earnings.totalReg || 0}
                    </p>
                  </div>
                  <FiUsers className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 shadow-md border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-700">Success Registrations</p>
                    <p className="text-3xl font-bold text-teal-900 mt-1">
                      {earnings.successReg || 0}
                    </p>
                  </div>
                  <FiTarget className="h-8 w-8 text-teal-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-md border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Reading Students</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">
                      {earnings.reading || 0}
                    </p>
                  </div>
                  <FiAward className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No earnings data available for the selected month.
            </div>
          )}

          {earnings && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Earnings Breakdown</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-700">Reading Earnings</span>
                    <FiBookOpen className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">
                    ${(earnings.reading || 0) * 50}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">
                    {earnings.reading || 0} students × $50
                  </p>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-amber-700">Hifz Earnings</span>
                    <FiStar className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-amber-900">
                    ${(earnings.hifz || 0) * 100}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {earnings.hifz || 0} students × $100
                  </p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6 border border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-red-700">Not Successful</span>
                    <FiTrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-900">
                    {earnings.notSuccess || 0}
                  </p>
                  <p className="text-xs text-red-600 mt-1">
                    Students not meeting criteria
                  </p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-6 border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-indigo-700">Performance Level</span>
                    <FiAward className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">
                    {earnings.level || 'N/A'}
                  </p>
                  <p className="text-xs text-indigo-600 mt-1">
                    Based on monthly performance
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
