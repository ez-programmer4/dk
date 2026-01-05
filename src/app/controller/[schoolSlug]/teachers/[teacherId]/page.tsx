"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiClock,
  FiCalendar,
  FiMail,
  FiMapPin,
  FiEye,
  FiTrendingUp,
  FiUsers,
  FiActivity,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useBranding } from "@/app/controller/[schoolSlug]/layout";

interface Teacher {
  ustazid: string;
  ustazname: string;
  phone: string;
  schedule: string;
  password: string;
  created_at: string;
}

interface TeacherStats {
  totalStudents: number;
  activeStudents: number;
  totalClasses: number;
  averageRating: number;
}

interface OccupiedSlot {
  id: string;
  dayPackage: string;
  timeSlot: string;
  occupiedAt: string;
  student: {
    id: number;
    name: string;
    phone: string;
    classFee: number;
    status: string;
  } | null;
}

export default function TeacherDetails() {
  const params = useParams();
  const router = useRouter();
  const schoolSlug = params.schoolSlug as string;
  const teacherId = params.teacherId as string;
  const branding = useBranding();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clearingTimeSlot, setClearingTimeSlot] = useState<string | null>(null);

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  useEffect(() => {
    fetchTeacherDetails();
  }, [schoolSlug, teacherId]);

  const fetchTeacherDetails = async () => {
    try {
      setLoading(true);

      // Fetch teacher basic info
      const teacherResponse = await fetch(
        `/api/controller/${schoolSlug}/teachers/${teacherId}`
      );

      if (!teacherResponse.ok) {
        if (teacherResponse.status === 403) {
          throw new Error("You don't have access to this teacher's information");
        }
        throw new Error("Failed to fetch teacher details");
      }

      const teacherData = await teacherResponse.json();
      setTeacher(teacherData);

      // Fetch teacher stats (students, classes, etc.)
      const statsResponse = await fetch(
        `/api/controller/${schoolSlug}/teachers/${teacherId}/stats`
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        // Set default stats if API doesn't exist yet
        setStats({
          totalStudents: 0,
          activeStudents: 0,
          totalClasses: 0,
          averageRating: 0,
        });
      }

      // Fetch occupied time slots
      const slotsResponse = await fetch(
        `/api/controller/${schoolSlug}/teachers/${teacherId}/occupied-slots`
      );

      if (slotsResponse.ok) {
        const slotsData = await slotsResponse.json();
        setOccupiedSlots(slotsData.occupiedSlots || []);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClearTimeSlot = async (slot: OccupiedSlot) => {
    if (!confirm(`Are you sure you want to clear this time slot?\n\nDay Package: ${slot.dayPackage}\nTime Slot: ${slot.timeSlot}\nStudent: ${slot.student?.name || 'No student assigned'}`)) {
      return;
    }

    setClearingTimeSlot(slot.id);
    try {
      const response = await fetch(
        `/api/controller/${schoolSlug}/teachers/${teacherId}/clear-time-slot`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dayPackage: slot.dayPackage,
            timeSlot: slot.timeSlot,
            studentId: slot.student?.id?.toString()
          })
        }
      );

      if (response.ok) {
        // Remove the cleared slot from the list
        setOccupiedSlots(prev => prev.filter(s => s.id !== slot.id));
        alert("Time slot cleared successfully");
      } else {
        const errorData = await response.json();
        alert(`Failed to clear time slot: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      alert("Error clearing time slot");
    } finally {
      setClearingTimeSlot(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">
                <FiActivity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error</h3>
                <p className="text-red-600 mt-1">{error || "Teacher not found"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 mr-2" />
            Back to Teachers
          </button>

          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Teacher Details
                </h1>
                <div className="flex items-center text-gray-600">
                  <FiUser className="w-5 h-5 mr-2" />
                  <span className="font-medium">
                    {teacher.ustazname}
                  </span>
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-sm">ID: {teacher.ustazid}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push(`/controller/${schoolSlug}/teachers/${teacherId}/lateness`)}
                  className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <FiClock className="w-4 h-4" />
                  View Lateness
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 mr-4">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalStudents || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 mr-4">
                <FiActivity className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.activeStudents || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 mr-4">
                <FiCalendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Classes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.totalClasses || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 mr-4">
                <FiTrendingUp className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.averageRating?.toFixed(1) || "N/A"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Occupied Time Slots */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Occupied Time Slots</h2>
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {occupiedSlots.length} active
            </span>
          </div>

          {occupiedSlots.length === 0 ? (
            <div className="text-center py-8">
              <FiCalendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No occupied time slots</p>
              <p className="text-sm text-gray-400 mt-1">All time slots are available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {occupiedSlots.map((slot) => (
                <div key={slot.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        <div className="flex items-center">
                          <FiCalendar className="w-4 h-4 text-blue-500 mr-2" />
                          <span className="font-medium text-gray-900">{slot.dayPackage}</span>
                        </div>
                        <div className="flex items-center">
                          <FiClock className="w-4 h-4 text-green-500 mr-2" />
                          <span className="text-gray-700">{slot.timeSlot}</span>
                        </div>
                      </div>

                      {slot.student ? (
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center">
                            <FiUser className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="font-medium text-gray-900">{slot.student.name}</span>
                          </div>
                          <div className="flex items-center">
                            <FiPhone className="w-4 h-4 text-gray-400 mr-1" />
                            <span className="text-gray-600">{slot.student.phone}</span>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            slot.student.status === 'Active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {slot.student.status}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">
                          No student assigned to this slot
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-1">
                        Occupied at: {new Date(slot.occupiedAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() => handleClearTimeSlot(slot)}
                      disabled={clearingTimeSlot === slot.id}
                      className="ml-4 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center space-x-2"
                    >
                      {clearingTimeSlot === slot.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Clearing...</span>
                        </>
                      ) : (
                        <>
                          <span>Clear Slot</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Teacher Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Basic Information */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>

            <div className="space-y-4">
              <div className="flex items-center">
                <FiUser className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{teacher.ustazname}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiPhone className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{teacher.phone || "Not provided"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiClock className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Schedule</p>
                  <p className="font-medium text-gray-900">{teacher.schedule || "Not set"}</p>
                </div>
              </div>

              <div className="flex items-center">
                <FiCalendar className="w-5 h-5 text-gray-400 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Join Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(teacher.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-center">
                <div className="w-5 h-5 bg-gray-300 rounded mr-3 flex items-center justify-center">
                  <span className="text-xs text-gray-600">🔒</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Password</p>
                  <div className="flex items-center space-x-2">
                    <p className="font-mono text-sm text-gray-900">
                      {teacher.password && teacher.password.startsWith("$2")
                        ? "•••••••• (Hashed - cannot decrypt)"
                        : teacher.password || "Not set"}
                    </p>
                    {teacher.password && !teacher.password.startsWith("$2") && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(teacher.password || "");
                          alert("Password copied to clipboard!");
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Copy password"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Additional Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-900">Active</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Account Status</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  <span className="text-sm text-gray-900">Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>

            <div className="space-y-3">
              <button
                onClick={() => router.push(`/controller/${schoolSlug}/teachers/${teacherId}/lateness`)}
                className="w-full flex items-center justify-between p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors border border-orange-200"
              >
                <div className="flex items-center">
                  <FiClock className="w-5 h-5 text-orange-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-orange-900">View Lateness Records</p>
                    <p className="text-sm text-orange-700">Check attendance and punctuality</p>
                  </div>
                </div>
                <FiArrowLeft className="w-5 h-5 text-orange-600 transform rotate-180" />
              </button>

              <button
                onClick={() => router.push(`/controller/${schoolSlug}/students?teacher=${teacherId}`)}
                className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
              >
                <div className="flex items-center">
                  <FiUsers className="w-5 h-5 text-blue-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-blue-900">View Students</p>
                    <p className="text-sm text-blue-700">See all students assigned to this teacher</p>
                  </div>
                </div>
                <FiArrowLeft className="w-5 h-5 text-blue-600 transform rotate-180" />
              </button>


              <button
                onClick={() => router.push(`/controller/${schoolSlug}/teachers/${teacherId}/schedule`)}
                className="w-full flex items-center justify-between p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
              >
                <div className="flex items-center">
                  <FiCalendar className="w-5 h-5 text-green-600 mr-3" />
                  <div className="text-left">
                    <p className="font-medium text-green-900">View Schedule</p>
                    <p className="text-sm text-green-700">Check class schedule and availability</p>
                  </div>
                </div>
                <FiArrowLeft className="w-5 h-5 text-green-600 transform rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
