"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  FiUser,
  FiPhone,
  FiClock,
  FiEye,
  FiEyeOff,
  FiCopy,
  FiRefreshCw,
  FiKey,
  FiCalendar,
  FiCheck,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useBranding } from "../layout";

interface Teacher {
  ustazid: string;
  ustazname: string;
  phone: string;
  schedule: string;
  password: string;
  created_at: string;
}

export default function ControllerTeachers() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  useEffect(() => {
    if (schoolSlug) {
      fetchTeachers();
    }
  }, [schoolSlug]);

  const fetchTeachers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/controller/${schoolSlug}/teachers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTeachers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (teacherId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teacherId)) {
        newSet.delete(teacherId);
      } else {
        newSet.add(teacherId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setNotification({ message: "Copied to clipboard!", type: "success" });
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      setNotification({ message: "Failed to copy", type: "error" });
      setTimeout(() => setNotification(null), 3000);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans"
      style={{ "--primary-color": primaryColor, "--secondary-color": secondaryColor } as React.CSSProperties}
    >
      <div className="w-full max-w-7xl mx-auto">
        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                notification.type === "success"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {notification.message}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                My Teachers for {schoolName}
              </h1>
              <p className="text-gray-600 mt-2 text-sm">
                Manage teachers assigned to you and view their credentials.
              </p>
            </div>

            <button
              onClick={fetchTeachers}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary-color)] text-white rounded-lg hover:opacity-90 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-24 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500">
              Error: {error}
            </div>
          ) : teachers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No teachers assigned to you yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((teacher) => (
                <motion.div
                  key={teacher.ustazid}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center mb-4">
                    <div className="bg-[var(--primary-color)] rounded-full p-3 mr-4">
                      <FiUser className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {teacher.ustazname}
                      </h3>
                      <p className="text-sm text-gray-500">ID: {teacher.ustazid}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <FiPhone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{teacher.phone || 'No phone'}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <FiClock className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">{teacher.schedule || 'No schedule'}</span>
                    </div>

                    <div className="flex items-center text-sm">
                      <FiCalendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">
                        Joined {new Date(teacher.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                          <FiKey className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="font-mono text-sm">
                            {visiblePasswords.has(teacher.ustazid)
                              ? teacher.password
                              : "••••••••"}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => togglePasswordVisibility(teacher.ustazid)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title={visiblePasswords.has(teacher.ustazid) ? "Hide password" : "Show password"}
                          >
                            {visiblePasswords.has(teacher.ustazid) ? (
                              <FiEyeOff className="h-4 w-4" />
                            ) : (
                              <FiEye className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={() => copyToClipboard(teacher.password)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Copy password"
                          >
                            <FiCopy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={`/controller/${schoolSlug}/teachers/${teacher.ustazid}/lateness`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--secondary-color)] text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium"
                    >
                      <FiEye className="h-4 w-4" />
                      View Details
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
