"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import {
  FiCalendar,
  FiUsers,
  FiClock,
  FiFilter,
  FiRefreshCw,
  FiLink,
  FiCheckCircle,
  FiArrowLeft,
} from "react-icons/fi";

interface AttendanceRecord {
  student_id: number;
  studentName: string;
  ustazName: string;
  controllerName: string;
  scheduledAt: string | null;
  links: {
    id: number;
    link: string;
    sent_time: string | null;
    clicked_at: string | null;
    expiration_date: string | null;
    report: number | null;
    tracking_token: string | null;
  }[];
  attendance_status: string;
  absentDaysCount: number;
  daypackages: string;
}

interface Controller {
  code: string;
  name: string;
}

interface Teacher {
  id: number;
  name: string;
  controllerId: string;
}

export default function TeacherSchedulesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedController, setSelectedController] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [attendanceFilter, setAttendanceFilter] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Check authentication and role
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    } else if (status === "authenticated" && session?.user?.role !== "admin") {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  // Fetch controllers and attendance data
  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "admin") {
      fetchControllers();
      fetchAttendanceData();
    }
  }, [
    status,
    session,
    selectedDate,
    selectedController,
    selectedTeacher,
    attendanceFilter,
    studentStatusFilter,
    currentPage,
  ]);

  // Fetch teachers when controller changes
  useEffect(() => {
    if (selectedController) {
      fetchTeachers(selectedController);
      setSelectedTeacher(""); // Reset teacher selection when controller changes
    } else {
      setTeachers([]);
      setSelectedTeacher("");
    }
  }, [selectedController]);

  const fetchControllers = async () => {
    try {
      const response = await fetch("/api/control-options");
      if (response.ok) {
        const data = await response.json();
        setControllers(data.controllers || []);
      }
    } catch (error) {
      console.error("Error fetching controllers:", error);
    }
  };

  const fetchTeachers = async (controllerId: string) => {
    try {
      const response = await fetch(
        `/api/admin/teachers?controlId=${controllerId}`
      );
      if (response.ok) {
        const data = await response.json();

        setTeachers(data.teachers || []);
      } else {
        console.error("Failed to fetch teachers, status:", response.status);
        setTeachers([]);
      }
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        page: currentPage.toString(),
        limit: "20",
        ...(selectedController && { controllerId: selectedController }),
        ...(selectedTeacher && { teacherId: selectedTeacher }),
        ...(attendanceFilter && { attendanceStatus: attendanceFilter }),
        ...(studentStatusFilter && { studentStatus: studentStatusFilter }),
      });

      const response = await fetch(
        `/api/admin/daily-attendance?${params.toString()}`,
        {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAttendanceData(data.integratedData || []);
        setTotalRecords(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error("Attendance API error:", errorData);
        toast.error(
          `Failed to fetch attendance data: ${
            errorData.error || "Unknown error"
          }`
        );
      }
    } catch (error) {
      console.error("Error fetching attendance data:", error);
      toast.error("Error fetching attendance data");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "permission":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "--";
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "--";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-8 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mb-4"></div>
              <p className="text-gray-900 font-semibold">
                Loading teacher schedules...
              </p>
              <p className="text-gray-600 text-sm mt-1">
                Please wait while we fetch the data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || session?.user?.role !== "admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push(`/admin/${schoolSlug}`)}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <FiArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Teacher Schedules
                </h1>
                <p className="text-sm text-gray-600">
                  Monitor daily attendance and zoom link activity
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <FiFilter className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                Filters & Controls
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiCalendar className="h-4 w-4 text-blue-500" />
                  Select Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiUsers className="h-4 w-4 text-green-500" />
                  Controller
                </label>
                <select
                  value={selectedController}
                  onChange={(e) => setSelectedController(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Controllers</option>
                  {controllers.map((controller) => (
                    <option key={controller.code} value={controller.code}>
                      {controller.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiUsers className="h-4 w-4 text-purple-500" />
                  Teacher
                </label>
                <select
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                  disabled={!selectedController}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedController
                      ? "All Teachers"
                      : "Select Controller First"}
                  </option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiCheckCircle className="h-4 w-4 text-orange-500" />
                  Status
                </label>
                <select
                  value={attendanceFilter}
                  onChange={(e) => {
                    setAttendanceFilter(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Status</option>
                  <option value="Present">✅ Present</option>
                  <option value="Absent">❌ Absent</option>
                  <option value="Not taken">⏳ Not Taken</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiUsers className="h-4 w-4 text-teal-500" />
                  Student Status
                </label>
                <select
                  value={studentStatusFilter}
                  onChange={(e) => {
                    setStudentStatusFilter(e.target.value);
                  }}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white/50 backdrop-blur-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">All Students</option>
                  <option value="Active">🟢 Active</option>
                  <option value="Not yet">🟡 Not Yet</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <FiRefreshCw className="h-4 w-4 text-pink-500" />
                  Actions
                </label>
                <button
                  onClick={fetchAttendanceData}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <FiRefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>

          {/* Attendance Data Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <FiCalendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Daily Attendance & Zoom Links
                    </h2>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedDate).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      • {attendanceData.length} students
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full border border-green-200">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-xs font-semibold text-green-700">
                      Real-time
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Updated: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr className="border-b border-gray-200/50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiUsers className="h-4 w-4" />
                        Student
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiUsers className="h-4 w-4" />
                        Teacher
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiClock className="h-4 w-4" />
                        Scheduled
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiLink className="h-4 w-4" />
                        Zoom Link
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <FiCheckCircle className="h-4 w-4" />
                        Attendance
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-200/30">
                  {attendanceData.map((record) => (
                    <tr
                      key={record.student_id}
                      className="hover:bg-gray-50/50 transition-colors duration-200"
                    >
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-bold text-black">
                            {record.studentName}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {record.student_id}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-700">{record.ustazName}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-gray-700">
                          {record.scheduledAt
                            ? formatTime(record.scheduledAt)
                            : "Not scheduled"}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {record.links.length > 0 ? (
                          <div className="space-y-1">
                            {record.links.map((link) => (
                              <div key={link.id} className="text-sm">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-1 rounded text-xs font-medium ${
                                      link.sent_time
                                        ? "bg-green-100 text-green-800"
                                        : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {link.sent_time ? "Sent" : "Not sent"}
                                  </span>
                                  {link.clicked_at && (
                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                      Clicked
                                    </span>
                                  )}
                                </div>
                                {link.sent_time && (
                                  <div className="text-xs text-gray-500">
                                    Sent: {formatTime(link.sent_time)}
                                    {link.clicked_at &&
                                      ` | Clicked: ${formatTime(
                                        link.clicked_at
                                      )}`}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">
                            No links
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getAttendanceStatusColor(
                            record.attendance_status
                          )}`}
                        >
                          {record.attendance_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {attendanceData.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FiCalendar className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Attendance Data
                </h3>
                <p className="text-gray-600">
                  No students found for the selected date and filters.
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages} • {totalRecords} total
                students
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
