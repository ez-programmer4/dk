"use client";

import { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiTrash2,
  FiRefreshCw,
  FiSearch,
  FiUser,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiUsers,
  FiSettings,
} from "react-icons/fi";
import { toast } from "@/components/ui/use-toast";

interface Student {
  wdt_ID: number;
  name: string | null;
  phoneno: string | null;
  classfeeCurrency: string;
}

interface Config {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  packages: Array<{
    id: number;
    name: string;
    duration: number;
    price: number;
    currency: string;
  }>;
}

interface StudentConfig {
  studentId: number;
  student: Student;
  config: Config | null;
}

export default function StudentSubscriptionPackagesPage() {
  const [studentConfigs, setStudentConfigs] = useState<StudentConfig[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const loadStudentConfigs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/student-subscription-packages");
      const data = await response.json();
      if (data.success) {
        setStudentConfigs(data.students || []);
      } else {
        setError(data.error || "Failed to load student configurations");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load student configurations");
      toast({
        title: "Error",
        description: "Failed to load student configurations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStudents = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/students?limit=1000");
      const data = await response.json();
      if (data.success && data.students) {
        setStudents(data.students);
      }
    } catch (err: any) {
      console.error("Failed to load students:", err);
    }
  }, []);

  const loadConfigs = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/subscription-package-configs");
      const data = await response.json();
      if (data.success && data.configs) {
        setConfigs(data.configs.filter((c: Config) => c.isActive));
      }
    } catch (err: any) {
      console.error("Failed to load configs:", err);
    }
  }, []);

  useEffect(() => {
    loadStudentConfigs();
  }, [loadStudentConfigs]);

  useEffect(() => {
    loadStudents();
    loadConfigs();
  }, [loadStudents, loadConfigs]);

  const handleAddConfig = async () => {
    if (!selectedStudentId || !selectedConfigId) {
      toast({
        title: "Error",
        description: "Please select both a student and a config",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/student-subscription-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          configId: selectedConfigId,
          isActive: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: data.message || "Configuration added successfully",
        });
        setShowAddModal(false);
        setSelectedStudentId(null);
        setSelectedConfigId(null);
        loadStudentConfigs();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add configuration",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to add configuration",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfig = async (studentId: number, studentName: string, configName: string) => {
    if (!confirm(`Are you sure you want to remove config "${configName}" from student "${studentName}"?`)) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/student-subscription-packages?studentId=${studentId}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Configuration removed successfully",
        });
        loadStudentConfigs();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to remove configuration",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Failed to remove configuration",
        variant: "destructive",
      });
    }
  };

  const filteredConfigs = studentConfigs.filter((sc) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sc.student.name?.toLowerCase().includes(search) ||
      sc.student.phoneno?.toLowerCase().includes(search) ||
      sc.config?.name?.toLowerCase().includes(search) ||
      String(sc.student.wdt_ID).includes(search)
    );
  });

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FiUsers className="w-8 h-8 text-blue-600" />
          Student Subscription Package Configurations
        </h1>
        <p className="text-gray-600">
          Assign subscription package configs to students. Students will only see packages from their assigned config.
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by student name, phone, or config name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              Assign Config
            </button>
            <button
              onClick={loadStudentConfigs}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center gap-2"
            >
              <FiRefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Configurations Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <FiRefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">Loading configurations...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="p-8 text-center">
            <FiPackage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">
              No student configurations found. Assign a config to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Config
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Packages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConfigs.map((sc) => (
                  <tr key={sc.studentId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {sc.student.name || "No Name"}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {sc.student.wdt_ID} | {sc.student.phoneno || "No Phone"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {sc.config ? (
                        <div className="flex items-center">
                          <FiSettings className="w-4 h-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {sc.config.name}
                            </div>
                            {sc.config.description && (
                              <div className="text-sm text-gray-500">
                                {sc.config.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No config</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sc.config ? (
                        <>
                          <div className="text-sm text-gray-900">
                            {sc.config.packages.length} package{sc.config.packages.length !== 1 ? "s" : ""}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {sc.config.packages.slice(0, 2).map((p) => p.name).join(", ")}
                            {sc.config.packages.length > 2 && "..."}
                          </div>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {sc.config && sc.config.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FiCheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <FiXCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      -
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {sc.config && (
                        <button
                          onClick={() =>
                            handleDeleteConfig(
                              sc.studentId,
                              sc.student.name || "Unknown",
                              sc.config!.name
                            )
                          }
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 ml-auto"
                        >
                          <FiTrash2 className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Configuration Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Assign Config to Student</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <select
                  value={selectedStudentId || ""}
                  onChange={(e) =>
                    setSelectedStudentId(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.wdt_ID} value={student.wdt_ID}>
                      {student.wdt_ID} - {student.name || "No Name"} ({student.phoneno || "No Phone"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Config
                </label>
                <select
                  value={selectedConfigId || ""}
                  onChange={(e) =>
                    setSelectedConfigId(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a config</option>
                  {configs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name} ({config.packages.length} packages)
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Assign Config
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedStudentId(null);
                  setSelectedConfigId(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
