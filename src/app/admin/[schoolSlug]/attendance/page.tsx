"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AttendanceAnalytics } from "./components/AttendanceAnalytics";
import { useSession } from "next-auth/react";
import {
  FiBarChart,
  FiUsers,
  FiTrendingUp,
  FiFilter,
  FiCalendar,
  FiTarget,
  FiActivity,
  FiClock,
} from "react-icons/fi";

interface Controller {
  code: string;
  name: string;
}

export default function AttendancePage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const [controllers, setControllers] = useState<Controller[]>([]);
  const [selectedController, setSelectedController] = useState<string>("");
  const [latenessRecords, setLatenessRecords] = useState<any[]>([]);
  const [latenessLoading, setLatenessLoading] = useState(false);
  const [latenessError, setLatenessError] = useState<string | null>(null);
  const [teacherFilter, setTeacherFilter] = useState("");

  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchControllers = async () => {
      try {
        const res = await fetch(`/api/admin/${schoolSlug}/control-options`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch controllers");
        const controllerData = await res.json();
        setControllers(
          Array.isArray(controllerData.controllers)
            ? controllerData.controllers
            : []
        );
      } catch (err) {}
    };
    if (schoolSlug) {
      fetchControllers();
    }
  }, [schoolSlug]);

  useEffect(() => {
    if (session?.user?.role === "admin") {
      fetchLatenessRecords();
    }
  }, [session]);

  async function fetchLatenessRecords() {
    setLatenessLoading(true);
    setLatenessError(null);
    try {
      const res = await fetch(`/api/admin/${schoolSlug}/lateness`);
      if (!res.ok) throw new Error("Failed to fetch lateness records");
      const data = await res.json();
      setLatenessRecords(data.latenessData || []);
    } catch (e: any) {
      setLatenessError(e.message);
    } finally {
      setLatenessLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Enhanced Header + Stats with School Branding */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 lg:p-10">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-transparent to-indigo-50/30 rounded-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzkyQUMiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+PC9zdmc+')] opacity-30" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                <FiBarChart className="h-8 w-8 text-white" />
              </div>
              <div>
                {/* Status & School Info */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex items-center gap-2 text-green-600 font-medium text-sm bg-green-50 px-3 py-1 rounded-full border border-green-200">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    System Online
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-md font-medium">
                    School: {schoolSlug}
                  </span>
                </div>

                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent mb-3">
                  Attendance Analytics
                </h1>
                <p className="text-gray-600 text-lg font-medium">
                  Analyze attendance trends and performance for {schoolSlug}{" "}
                  institution
                </p>
              </div>
            </div>

            {/* Enhanced Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:ml-auto">
              <div className="group bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <FiUsers className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {controllers.length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium truncate">
                      Controllers
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-green-600 font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <FiTrendingUp className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      Live
                    </div>
                    <div className="text-sm text-gray-600 font-medium truncate">
                      Trends
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                      <span className="text-xs text-blue-600 font-medium">
                        Real-time
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <FiActivity className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      {latenessRecords.length}
                    </div>
                    <div className="text-sm text-gray-600 font-medium truncate">
                      Records
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                      <span className="text-xs text-purple-600 font-medium">
                        Tracked
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="group bg-gradient-to-br from-white to-gray-50/50 p-6 rounded-2xl border border-gray-200/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <FiClock className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-2xl font-bold text-gray-900 mb-1">
                      Active
                    </div>
                    <div className="text-sm text-gray-600 font-medium truncate">
                      Status
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <div className="w-1 h-1 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs text-emerald-600 font-medium">
                        Healthy
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Controls with School Branding */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 shadow-lg sticky top-4 z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              <div className="lg:col-span-6">
                <label className="block text-sm font-bold text-black mb-3">
                  <FiFilter className="inline h-4 w-4 mr-2" />
                  Filter by Controller
                </label>
                <select
                  value={selectedController}
                  onChange={(e) => setSelectedController(e.target.value)}
                  className="w-full px-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-black bg-white text-gray-900 shadow-sm transition-all duration-200 text-base"
                >
                  <option value="">All Controllers</option>
                  {Array.isArray(controllers) &&
                    controllers.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="lg:col-span-6">
                <label className="block text-sm font-bold text-black mb-3">
                  <FiTarget className="inline h-4 w-4 mr-2" />
                  Analysis Scope
                </label>
                <div className="flex gap-3">
                  <div className="flex-1 bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2">
                      <FiBarChart className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">
                        {selectedController
                          ? "Controller Specific"
                          : "Institution Wide"}
                      </span>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      {selectedController
                        ? "Analyzing selected controller data"
                        : "Analyzing all controllers"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Analytics Component with School Branding */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl shadow-lg">
                  <FiTrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Analytics Dashboard
                  </h2>
                  <p className="text-gray-600 font-medium">
                    {selectedController
                      ? `Showing data for selected controller • ${schoolSlug}`
                      : `Showing data for all controllers • ${schoolSlug}`}
                  </p>
                </div>
              </div>

              {/* School Info Badge */}
              <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-semibold text-blue-700">
                  {schoolSlug}
                </span>
                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-md">
                  School Data
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <AttendanceAnalytics controllerCode={selectedController} />
          </div>
        </div>

        {/* Enhanced Lateness Records Section (Admin Only) */}
        {session?.user?.role === "admin" && (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
                    <FiClock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      Lateness Records
                    </h2>
                    <p className="text-gray-600 font-medium">
                      Track and monitor attendance punctuality for {schoolSlug}
                    </p>
                  </div>
                </div>

                {/* School Performance Badge */}
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200/50">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-orange-700">
                    Performance Tracking
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
