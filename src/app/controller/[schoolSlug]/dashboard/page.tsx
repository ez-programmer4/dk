"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiUsers, FiClock, FiDollarSign, FiTrendingUp, FiAward, FiBarChart,
  FiActivity, FiTarget, FiCalendar, FiEye,
} from "react-icons/fi";
import { useBranding } from "../layout";

export default function ControllerDashboard() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();

  const [teachers, setTeachers] = useState<any[]>([]);
  const [pendingPermissions, setPendingPermissions] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  useEffect(() => {
    if (schoolSlug) {
      fetchDashboard();
    }
  }, [schoolSlug]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const [teachersRes, permissionsRes, earningsRes, analyticsRes] = await Promise.all([
        fetch(`/api/controller/${schoolSlug}/teachers`),
        fetch(`/api/controller/${schoolSlug}/permissions?status=Pending`),
        fetch(`/api/controller/${schoolSlug}/earnings?month=${new Date().toISOString().slice(0, 7)}`),
        fetch(`/api/controller/${schoolSlug}/student-analytics`),
      ]);

      setTeachers(teachersRes.ok ? await teachersRes.json() : []);
      setPendingPermissions(
        permissionsRes.ok ? await permissionsRes.json() : []
      );
      setEarnings(earningsRes.ok ? await earningsRes.json() : null);
      setAnalytics(analyticsRes.ok ? await analyticsRes.json() : null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans"
      style={{ "--primary-color": primaryColor, "--secondary-color": secondaryColor } as React.CSSProperties}
    >
      <div className="w-full max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Controller Dashboard for {schoolName}
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                Welcome! Manage your teachers, earnings, and student analytics for {schoolName}.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
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
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8"
            >
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 shadow-md border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Assigned Teachers</p>
                    <p className="text-3xl font-bold text-blue-900 mt-1">{teachers.length}</p>
                  </div>
                  <FiUsers className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 shadow-md border border-teal-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-teal-700">Pending Permissions</p>
                    <p className="text-3xl font-bold text-teal-900 mt-1">{pendingPermissions.length}</p>
                  </div>
                  <FiClock className="h-8 w-8 text-teal-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 shadow-md border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Monthly Earnings</p>
                    <p className="text-3xl font-bold text-green-900 mt-1">
                      {earnings?.reward ? `$${earnings.reward}` : '$0'}
                    </p>
                  </div>
                  <FiDollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 shadow-md border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">Active Students</p>
                    <p className="text-3xl font-bold text-purple-900 mt-1">
                      {analytics?.totalStudents || 0}
                    </p>
                  </div>
                  <FiActivity className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Teachers Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Assigned Teachers</h2>
            <a
              href={`/controller/${schoolSlug}/teachers`}
              className="px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition-colors"
            >
              View All Teachers
            </a>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No teachers assigned to you yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Schedule
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teachers.slice(0, 5).map((teacher) => (
                    <tr key={teacher.ustazid} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {teacher.ustazname}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{teacher.phone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{teacher.schedule || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <a
                          href={`/controller/${schoolSlug}/teachers/${teacher.ustazid}/lateness`}
                          className="text-[var(--primary-color)] hover:text-[var(--secondary-color)] transition-colors"
                        >
                          View Details
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pending Permissions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pending Permission Requests</h2>
            <a
              href={`/controller/${schoolSlug}/permissions`}
              className="px-4 py-2 bg-[var(--secondary-color)] text-white rounded-lg hover:opacity-90 transition-colors"
            >
              Review All
            </a>
          </div>

          {loading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : pendingPermissions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No pending permission requests.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teacher
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pendingPermissions.slice(0, 5).map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {req.teacherId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{req.requestedDates}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{req.reasonCategory}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">{req.reasonDetails}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
