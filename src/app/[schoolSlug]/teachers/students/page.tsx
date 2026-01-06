"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiSend,
  FiUser,
  FiCheck,
  FiClock,
  FiLink2,
  FiAlertTriangle,
  FiX,
  FiRefreshCcw,
  FiFilter,
  FiSearch,
  FiCopy,
  FiChevronDown,
  FiChevronUp,
  FiCalendar,
  FiBookOpen,
  FiTarget,
  FiUsers,
  FiActivity,
  FiPhone,
  FiVideo,
  FiPackage,
  FiTrendingUp,
  FiCheckCircle,
} from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/use-toast";
import { daypackageIncludesToday } from "@/lib/daypackage-utils";
import { useParams } from "next/navigation";

// Types

type Group = {
  group: string;
  students: Array<{
    id: number;
    name: string | null;
    phone: string | null;
    subject: string | null;
    pack: string | null;
    daypackages: string | null;
    occupied: Array<{ time_slot: string; daypackage: string }>;
  }>;
};

type ModalType = "zoom" | "attendance" | null;

// Utils

function safeIncludes(haystack: unknown, needle: string): boolean {
  if (!needle) return true;
  if (typeof haystack === "string") {
    return haystack.toLowerCase().includes(needle.toLowerCase());
  }
  return false;
}

function safeStartsWith(haystack: unknown, needle: string): boolean {
  if (!needle) return true;
  if (typeof haystack === "string") {
    return haystack.toLowerCase().startsWith(needle.toLowerCase());
  }
  return false;
}

export default function AssignedStudents() {
  const { toast } = useToast();
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Server-to-Server OAuth is always available (no individual teacher connection needed)
  const [zoomOAuthConnected, setZoomOAuthConnected] = useState(true);
  const [checkingOAuth, setCheckingOAuth] = useState(false);
  const [modal, setModal] = useState<{
    type: ModalType;
    studentId: number | null;
  }>({ type: null, studentId: null });
  const [forms, setForms] = useState<
    Record<
      number,
      {
        link: string;
        meetingId?: string;
        startUrl?: string;
        meetingCreated?: boolean;
      }
    >
  >({});
  const [attend, setAttend] = useState<
    Record<
      number,
      {
        status: string;
        level?: string;
        surah?: string;
        ayah?: string;
        notes?: string;
        nextClass?: string;
      }
    >
  >({});
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [subjectFilter, setSubjectFilter] = useState<string>("");
  const [packageFilter, setPackageFilter] = useState<string>("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sendingLink, setSendingLink] = useState<Set<number>>(new Set());
  const [markingAttendance, setMarkingAttendance] = useState<Set<number>>(
    new Set()
  );

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/${schoolSlug}/teachers/students/assigned`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();

      const groupsMap = new Map<string, Group["students"]>();
      data.students.forEach((student: any) => {
        const groupKey = student.subject || "No Subject";
        if (!groupsMap.has(groupKey)) {
          groupsMap.set(groupKey, []);
        }
        groupsMap.get(groupKey)!.push({
          id: student.wdt_ID,
          name: student.name,
          phone: student.phone,
          subject: student.subject,
          pack: student.package,
          daypackages: student.daypackages,
          occupied: student.occupiedTimes || [],
        });
      });

      const groups: Group[] = Array.from(groupsMap.entries()).map(
        ([group, students]) => ({
          group,
          students: students.sort((a, b) =>
            (a.name || "").localeCompare(b.name || "")
          ),
        })
      );

      setGroups(groups);
    } catch (err) {
      setError("Failed to load students. Please try again.");
      console.error("Error loading students:", err);
    } finally {
      setLoading(false);
    }
  }, [schoolSlug]);

  const checkZoomStatus = useCallback(async () => {
    try {
      setCheckingOAuth(true);
      const res = await fetch(`/api/${schoolSlug}/teachers/students/zoom-status`);
      if (res.ok) {
        const data = await res.json();
        setZoomOAuthConnected(data.connected);
      }
    } catch (err) {
      console.error("Error checking Zoom status:", err);
    } finally {
      setCheckingOAuth(false);
    }
  }, [schoolSlug]);

  const loadAttendanceStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/${schoolSlug}/teachers/students/attendance-status`);
      if (!res.ok) throw new Error("Failed to fetch attendance status");
      const data = await res.json();

      const attendanceMap: Record<number, any> = {};
      data.attendance.forEach((record: any) => {
        attendanceMap[record.student_id] = {
          status: record.status,
          level: record.level,
          surah: record.surah,
          ayah: record.ayah,
          notes: record.notes,
          nextClass: record.next_class,
        };
      });
      setAttend(attendanceMap);
    } catch (err) {
      console.error("Error loading attendance status:", err);
    }
  }, [schoolSlug]);

  useEffect(() => {
    loadStudents();
    checkZoomStatus();
    loadAttendanceStatus();
  }, [loadStudents, checkZoomStatus, loadAttendanceStatus]);

  const filteredGroups = useMemo(() => {
    return groups
      .map((group) => ({
        ...group,
        students: group.students.filter((student) => {
          const matchesSearch = !searchQuery ||
            safeIncludes(student.name, searchQuery) ||
            safeIncludes(student.subject, searchQuery) ||
            safeIncludes(student.pack, searchQuery);

          const matchesStatus = !statusFilter ||
            (statusFilter === "present" && attend[student.id]?.status === "present") ||
            (statusFilter === "absent" && attend[student.id]?.status !== "present");

          const matchesSubject = !subjectFilter ||
            safeIncludes(student.subject, subjectFilter);

          const matchesPackage = !packageFilter ||
            safeIncludes(student.pack, packageFilter);

          return matchesSearch && matchesStatus && matchesSubject && matchesPackage;
        }),
      }))
      .filter((group) => group.students.length > 0);
  }, [groups, searchQuery, statusFilter, subjectFilter, packageFilter, attend]);

  const toggleGroup = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  const sendZoomLink = async (studentId: number) => {
    if (!forms[studentId]?.link) return;

    setSendingLink((prev) => new Set(prev).add(studentId));
    try {
      const res = await fetch(`/api/${schoolSlug}/teachers/students/${studentId}/zoom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          link: forms[studentId].link,
          meetingId: forms[studentId].meetingId,
          startUrl: forms[studentId].startUrl,
        }),
      });

      if (!res.ok) throw new Error("Failed to send Zoom link");

      toast({
        title: "Success",
        description: "Zoom link sent successfully!",
      });

      // Clear form
      setForms((prev) => ({
        ...prev,
        [studentId]: { link: "" },
      }));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send Zoom link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingLink((prev) => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  const markAttendance = async (studentId: number) => {
    const attendanceData = attend[studentId];
    if (!attendanceData) return;

    setMarkingAttendance((prev) => new Set(prev).add(studentId));
    try {
      const res = await fetch(`/api/${schoolSlug}/teachers/students/${studentId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attendanceData),
      });

      if (!res.ok) throw new Error("Failed to mark attendance");

      toast({
        title: "Success",
        description: "Attendance marked successfully!",
      });

      // Reload data
      loadAttendanceStatus();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingAttendance((prev) => {
        const newSet = new Set(prev);
        newSet.delete(studentId);
        return newSet;
      });
    }
  };

  if (loading && groups.length === 0) {
    return <PageLoading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Enhanced Header with School Branding */}
        <div className="relative overflow-hidden bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 via-teal-600/10 to-cyan-600/10 rounded-3xl"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl blur-lg opacity-30"></div>
                <div className="relative bg-gradient-to-r from-green-600 to-teal-600 p-4 rounded-2xl shadow-xl">
                  <FiUsers className="w-8 h-8 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  My Students
                </h1>
                <p className="text-slate-600 mt-2 text-lg">Manage your assigned students and track their progress</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <FiBookOpen className="w-4 h-4" />
                    <span>{filteredGroups.reduce((total, group) => total + group.students.length, 0)} Active Students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <FiCheckCircle className="w-4 h-4" />
                    <span>{Object.values(attend).filter(a => a.status === 'present').length} Present Today</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={loadStudents}
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="sm"
              >
                <FiRefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl shadow-lg">
              <FiFilter className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800">Filter & Search</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative group">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-4 h-4" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white hover:shadow-md"
              />
            </div>

            <div className="relative group">
              <FiTrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:bg-white hover:shadow-md appearance-none"
              >
                <option value="">All Status</option>
                <option value="present">Present Today</option>
                <option value="absent">Absent Today</option>
              </select>
            </div>

            <div className="relative group">
              <FiBookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-purple-500 transition-colors w-4 h-4" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 hover:bg-white hover:shadow-md appearance-none"
              >
                <option value="">All Subjects</option>
                {Array.from(new Set(groups.flatMap(g => g.students.map(s => s.subject)))).filter(Boolean).map(subject => (
                  <option key={subject} >{subject}</option>
                ))}
              </select>
            </div>

            <div className="relative group">
              <FiPackage className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors w-4 h-4" />
              <select
                value={packageFilter}
                onChange={(e) => setPackageFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 hover:bg-white hover:shadow-md appearance-none"
              >
                <option value="">All Packages</option>
                {Array.from(new Set(groups.flatMap(g => g.students.map(s => s.pack)))).filter(Boolean).map(pack => (
                  <option key={pack} >{pack}</option>
                ))} 
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || statusFilter || subjectFilter || packageFilter) && (
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-200">
              <span className="text-sm text-slate-600 font-medium">Active filters:</span>
              {searchQuery && (
                <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery('')} className="hover:bg-blue-200 rounded-full p-0.5">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              {statusFilter && (
                <span className="bg-green-100 text-green-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  Status: {statusFilter}
                  <button onClick={() => setStatusFilter('')} className="hover:bg-green-200 rounded-full p-0.5">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              {subjectFilter && (
                <span className="bg-purple-100 text-purple-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  Subject: {subjectFilter}
                  <button onClick={() => setSubjectFilter('')} className="hover:bg-purple-200 rounded-full p-0.5">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
              {packageFilter && (
                <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  Package: {packageFilter}
                  <button onClick={() => setPackageFilter('')} className="hover:bg-orange-200 rounded-full p-0.5">
                    <FiX className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-xl">
                <FiAlertTriangle className="text-red-600 w-5 h-5" />
              </div>
              <div>
                <h3 className="text-red-800 font-semibold">Error Loading Students</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Student Groups */}
        <div className="space-y-6">
          {filteredGroups.map((group) => (
            <div key={group.group} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/50 overflow-hidden hover:shadow-2xl transition-all duration-300">
              <button
                onClick={() => toggleGroup(group.group)}
                className="w-full px-6 py-5 flex items-center justify-between hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/50 transition-all duration-300 group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <FiBookOpen className="text-white w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                      {group.group}
                    </h3>
                    <p className="text-slate-600 text-sm">Student Group</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-gradient-to-r from-green-500 to-teal-600 text-white text-sm px-4 py-2 rounded-full shadow-lg font-medium">
                    {group.students.length} students
                  </span>
                  <div className="bg-slate-100 p-2 rounded-xl transition-all duration-300 group-hover:bg-slate-200">
                    {expandedGroups.has(group.group) ? (
                      <FiChevronUp className="text-slate-600 w-5 h-5" />
                    ) : (
                      <FiChevronDown className="text-slate-600 w-5 h-5" />
                    )}
                  </div>
                </div>
              </button>

              {expandedGroups.has(group.group) && (
                <div className="border-t border-slate-200/50">
                  <div className="divide-y divide-slate-200/50">
                    {group.students.map((student) => (
                      <div key={student.id} className="p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-30"></div>
                              <div className="relative w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                <FiUser className="text-white w-6 h-6" />
                              </div>
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-800 text-lg">{student.name || "Unknown Student"}</h4>
                              <p className="text-slate-600 text-sm">{student.pack} • {student.daypackages}</p>
                              {student.subject && (
                                <p className="text-slate-500 text-xs mt-1">📚 {student.subject}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {daypackageIncludesToday(student.daypackages) && (
                              <span className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs px-3 py-2 rounded-full shadow-lg font-medium">
                                📅 Today
                              </span>
                            )}
                            {attend[student.id]?.status === "present" && (
                              <span className="bg-gradient-to-r from-green-500 to-teal-600 text-white text-xs px-3 py-2 rounded-full shadow-lg font-medium">
                                ✅ Present
                              </span>
                            )}
                            {attend[student.id]?.status === "absent" && (
                              <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs px-3 py-2 rounded-full shadow-lg font-medium">
                                ❌ Absent
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Enhanced Zoom Link Section */}
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-xl p-4 border border-blue-200/50">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
                                <FiVideo className="w-4 h-4 text-white" />
                              </div>
                              <h5 className="font-semibold text-slate-800">Zoom Meeting</h5>
                            </div>
                            <div className="space-y-3">
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  placeholder="Enter Zoom meeting link..."
                                  value={forms[student.id]?.link || ""}
                                  onChange={(e) => setForms(prev => ({
                                    ...prev,
                                    [student.id]: { ...prev[student.id], link: e.target.value }
                                  }))}
                                  className="flex-1 px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                                />
                                <Button
                                  onClick={() => sendZoomLink(student.id)}
                                  disabled={!forms[student.id]?.link || sendingLink.has(student.id)}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                  size="sm"
                                >
                                  {sendingLink.has(student.id) ? (
                                    <FiRefreshCcw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FiSend className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                              {forms[student.id]?.link && (
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <FiLink2 className="w-3 h-3" />
                                  Link ready to send
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Enhanced Attendance Section */}
                          <div className="bg-gradient-to-br from-emerald-50 to-green-50/50 rounded-xl p-4 border border-emerald-200/50">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-2 rounded-lg shadow-lg">
                                <FiCheckCircle className="w-4 h-4 text-white" />
                              </div>
                              <h5 className="font-semibold text-slate-800">Today's Attendance</h5>
                            </div>
                            <div className="space-y-3">
                              <select
                                value={attend[student.id]?.status || ""}
                                onChange={(e) => setAttend(prev => ({
                                  ...prev,
                                  [student.id]: { ...prev[student.id], status: e.target.value }
                                }))}
                                className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                <option value="">Select Status</option>
                                <option value="present">✅ Present</option>
                                <option value="absent">❌ Absent</option>
                              </select>
                              <Button
                                onClick={() => markAttendance(student.id)}
                                disabled={!attend[student.id]?.status || markingAttendance.has(student.id)}
                                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                                size="sm"
                              >
                                {markingAttendance.has(student.id) ? (
                                  <FiRefreshCcw className="w-4 h-4 animate-spin mr-2" />
                                ) : (
                                  <FiCheck className="w-4 h-4 mr-2" />
                                )}
                                Mark Attendance
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Enhanced Additional Attendance Fields */}
                        {attend[student.id]?.status === "present" && (
                          <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50/50 rounded-xl p-4 border border-amber-200/50">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-2 rounded-lg shadow-lg">
                                <FiTarget className="w-4 h-4 text-white" />
                              </div>
                              <h5 className="font-semibold text-slate-800">Progress Details</h5>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <input
                                type="text"
                                placeholder="Level/Surah"
                                value={attend[student.id]?.level || ""}
                                onChange={(e) => setAttend(prev => ({
                                  ...prev,
                                  [student.id]: { ...prev[student.id], level: e.target.value }
                                }))}
                                className="px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                              />
                              <input
                                type="text"
                                placeholder="Surah"
                                value={attend[student.id]?.surah || ""}
                                onChange={(e) => setAttend(prev => ({
                                  ...prev,
                                  [student.id]: { ...prev[student.id], surah: e.target.value }
                                }))}
                                className="px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                              />
                              <input
                                type="text"
                                placeholder="Ayah"
                                value={attend[student.id]?.ayah || ""}
                                onChange={(e) => setAttend(prev => ({
                                  ...prev,
                                  [student.id]: { ...prev[student.id], ayah: e.target.value }
                                }))}
                                className="px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200"
                              />
                            </div>
                          </div>
                        )}

                        {/* Enhanced Notes Section */}
                        {attend[student.id]?.status && (
                          <div className="mt-4 bg-gradient-to-r from-purple-50 to-indigo-50/50 rounded-xl p-4 border border-purple-200/50">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 rounded-lg shadow-lg">
                                <FiCopy className="w-4 h-4 text-white" />
                              </div>
                              <h5 className="font-semibold text-slate-800">Session Notes</h5>
                            </div>
                            <textarea
                              placeholder="Add notes about today's session..."
                              value={attend[student.id]?.notes || ""}
                              onChange={(e) => setAttend(prev => ({
                                ...prev,
                                [student.id]: { ...prev[student.id], notes: e.target.value }
                              }))}
                              className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm shadow-sm hover:shadow-md transition-all duration-200 resize-none"
                              rows={3}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && !loading && (
          <div className="text-center py-16 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/50">
            <div className="bg-gradient-to-r from-slate-400 to-slate-500 p-4 rounded-full w-fit mx-auto mb-4 shadow-lg">
              <FiUsers className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No Students Found</h3>
            <p className="text-slate-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
