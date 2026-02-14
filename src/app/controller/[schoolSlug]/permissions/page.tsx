"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FiClock,
  FiCheck,
  FiX,
  FiUser,
  FiCalendar,
  FiMessageSquare,
} from "react-icons/fi";

interface PermissionRequest {
  id: number;
  teacherId: string;
  teacherName: string;
  requestedDates: string;
  reasonCategory: string;
  reasonDetails: string;
  status: "Pending" | "Approved" | "Rejected";
  createdAt: string;
  schoolId: string;
}

export default function ControllerPermissionsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  const [permissions, setPermissions] = useState<PermissionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  useEffect(() => {
    fetchPermissions();
  }, [schoolSlug]);

  const fetchPermissions = async () => {
    try {
      const response = await fetch(`/api/controller/${schoolSlug}/permissions`);
      if (response.ok) {
        const data = await response.json();
        setPermissions(data);
      }
    } catch (error) {
      console.error("Failed to fetch permissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: "Approved" | "Rejected") => {
    try {
      const response = await fetch(`/api/controller/${schoolSlug}/permissions`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status }),
      });

      if (response.ok) {
        fetchPermissions(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update permission:", error);
    }
  };

  const filteredPermissions = permissions.filter(permission => {
    if (filter === "all") return true;
    return permission.status.toLowerCase() === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8 font-sans">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-md">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                Permission Requests
              </h1>
              <p className="text-gray-600 mt-2">
                Review and manage permission requests from your teachers for {schoolSlug}.
              </p>
            </div>

            <div className="flex gap-2">
              {["all", "pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === status
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {status !== "all" && (
                    <span className="ml-1">
                      ({permissions.filter(p => p.status.toLowerCase() === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {filteredPermissions.length === 0 ? (
            <div className="text-center py-12">
              <FiClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === "all" ? "No permission requests" : `No ${filter} requests`}
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "There are no permission requests at this time."
                  : `There are no ${filter} permission requests.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPermissions.map((permission) => (
                <motion.div
                  key={permission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FiUser className="h-5 w-5 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {permission.teacherName}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          permission.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : permission.status === "Approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {permission.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiCalendar className="h-4 w-4" />
                          <span>{permission.requestedDates}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiMessageSquare className="h-4 w-4" />
                          <span>{permission.reasonCategory}</span>
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {permission.reasonDetails}
                      </p>
                    </div>

                    {permission.status === "Pending" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusUpdate(permission.id, "Approved")}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <FiCheck className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(permission.id, "Rejected")}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <FiX className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}
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
































