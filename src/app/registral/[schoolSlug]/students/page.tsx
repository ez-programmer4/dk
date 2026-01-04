"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiUser,
  FiPhone,
  FiCalendar,
  FiBook,
  FiDollarSign,
  FiMapPin,
  FiEye,
  FiEdit,
  FiChevronDown,
  FiChevronUp,
  FiTrendingUp,
  FiUsers,
  FiBarChart,
  FiDownload,
  FiPlus,
  FiX,
  FiSave,
} from "react-icons/fi";
import { useBranding } from "../layout";

interface Student {
  id: number;
  name: string;
  phoneno: string;
  status: string;
  startdate: string;
  registrationdate: string;
  package: string;
  subject: string;
  daypackages: string;
  classfee: number;
  classfeeCurrency: string;
  country: string;
  ustazname: string;
  rigistral: string;
  refer: string;
}

interface StudentStats {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  totalRevenue: number;
  averageFee: number;
}

export default function RegistralStudentsPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const branding = useBranding();
  const { data: session } = useSession();
  const router = useRouter();

  // Use branding colors for styling
  const primaryColor = branding?.primaryColor || "#0f766e";
  const secondaryColor = branding?.secondaryColor || "#06b6d4";
  const schoolName = branding?.name || "Quran Academy";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const itemsPerPage = 10;

  // Student form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phoneno: "",
    classfee: "",
    classfeeCurrency: "ETB",
    startdate: "",
    status: "active",
    package: "",
    subject: "",
    daypackages: "",
    country: "",
    refer: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/admin/${schoolSlug}/students?registral=${encodeURIComponent(session?.user?.name || "")}&page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(searchQuery)}&status=${statusFilter}`
      );

      if (!response.ok) throw new Error("Failed to fetch students");

      const data = await response.json();
      setStudents(data.students || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [schoolSlug, session?.user?.name, currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    if (session?.user?.name) {
      fetchStudents();
    }
  }, [fetchStudents, session?.user?.name]);

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleAddStudent = () => {
    setEditingStudent(null);
    setFormData({
      name: "",
      phoneno: "",
      classfee: "",
      classfeeCurrency: "ETB",
      startdate: "",
      status: "active",
      package: "",
      subject: "",
      daypackages: "",
      country: "",
      refer: "",
    });
    setShowAddForm(true);
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      phoneno: student.phoneno,
      classfee: student.classfee.toString(),
      classfeeCurrency: student.classfeeCurrency,
      startdate: student.startdate,
      status: student.status,
      package: student.package,
      subject: student.subject,
      daypackages: student.daypackages,
      country: student.country,
      refer: student.refer,
    });
    setShowAddForm(true);
  };

  const handleSaveStudent = async () => {
    if (!formData.name.trim() || !formData.phoneno.trim()) {
      alert("Name and phone number are required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        classfee: formData.classfee ? parseFloat(formData.classfee) : 0,
        schoolSlug,
        rigistral: session?.user?.name,
        registrationdate: editingStudent ? undefined : new Date().toISOString().split('T')[0],
        isSimpleStudent: true, // Flag for simple student creation
      };

      const url = editingStudent
        ? `/api/registrations?id=${editingStudent.id}&schoolSlug=${schoolSlug}`
        : `/api/registrations?schoolSlug=${schoolSlug}`;

      const response = await fetch(url, {
        method: editingStudent ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save student");

      setShowAddForm(false);
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Failed to save student");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingStudent(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "not yet":
        return "bg-blue-100 text-blue-800";
      case "leave":
        return "bg-red-100 text-red-800";
      case "completed":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && students.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl shadow-xl">
                <FiUsers className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  My Students
                </h1>
                <p className="text-gray-600 text-lg">Manage students you've registered</p>
              </div>
            </div>
            <button
              onClick={handleAddStudent}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <FiPlus className="h-4 w-4" />
              Add Student
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <FiUsers className="h-8 w-8 text-blue-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Students</p>
                    <p className="text-3xl font-bold">{stats.activeStudents}</p>
                  </div>
                  <FiTrendingUp className="h-8 w-8 text-green-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Completed</p>
                    <p className="text-3xl font-bold">{stats.completedStudents}</p>
                  </div>
                  <FiBarChart className="h-8 w-8 text-purple-200" />
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <FiDollarSign className="h-8 w-8 text-emerald-200" />
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>

        {/* Add/Edit Student Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingStudent ? "Edit Student" : "Add New Student"}
                </h2>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Required Fields */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="Enter student full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="text"
                    value={formData.phoneno}
                    onChange={(e) => setFormData({ ...formData, phoneno: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                {/* Optional Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class Fee
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={formData.classfee}
                      onChange={(e) => setFormData({ ...formData, classfee: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                      placeholder="0"
                    />
                    <select
                      value={formData.classfeeCurrency}
                      onChange={(e) => setFormData({ ...formData, classfeeCurrency: e.target.value })}
                      className="px-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    >
                      <option value="ETB">ETB</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startdate}
                    onChange={(e) => setFormData({ ...formData, startdate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                  >
                    <option value="active">Active</option>
                    <option value="not yet">Not Yet</option>
                    <option value="leave">On Leave</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                {/* Optional database-dependent fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.package}
                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="e.g., Basic, Premium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="e.g., Quran, Arabic"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day Package (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.daypackages}
                    onChange={(e) => setFormData({ ...formData, daypackages: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="e.g., MWF, TTS, All days"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="e.g., Ethiopia, USA"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referral (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.refer}
                    onChange={(e) => setFormData({ ...formData, refer: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                    placeholder="Referral information"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8">
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveStudent}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="h-4 w-4" />
                      {editingStudent ? "Update Student" : "Save Student"}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="not yet">Not Yet</option>
                <option value="leave">On Leave</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={fetchStudents}
                className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-xl hover:bg-teal-200 transition-colors"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </motion.div>

        {/* Students Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {students.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <React.Fragment key={student.id}>
                      <motion.tr
                        className="hover:bg-gray-50 transition-colors"
                        whileHover={{ scale: 1.01 }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-teal-100 text-teal-800 rounded-full flex items-center justify-center font-medium">
                              {student.name?.charAt(0)?.toUpperCase() || "?"}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                Teacher: {student.ustazname || "Not assigned"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <FiPhone className="text-gray-400 mr-2" size={14} />
                            <span className="text-sm text-gray-900">
                              {student.phoneno}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${getStatusColor(
                              student.status
                            )}`}
                          >
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.package}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {student.classfee ? (
                            <>
                              {student.classfeeCurrency || "ETB"} {student.classfee.toLocaleString()}
                            </>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.startdate ? (
                            <div className="flex items-center">
                              <FiCalendar className="text-gray-400 mr-2" size={14} />
                              {new Date(student.startdate).toLocaleDateString()}
                            </div>
                          ) : (
                            "Not set"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit Student"
                            >
                              <FiEdit size={18} />
                            </button>
                            <button
                              onClick={() => toggleRow(student.id)}
                              className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              title={expandedRow === student.id ? "Collapse Details" : "Expand Details"}
                            >
                              {expandedRow === student.id ? (
                                <FiChevronUp size={18} />
                              ) : (
                                <FiChevronDown size={18} />
                              )}
                            </button>
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded Row */}
                      {expandedRow === student.id && (
                        <motion.tr
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-gray-50"
                        >
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              <div className="flex items-start gap-3">
                                <FiUser className="text-teal-600 mt-1" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                                  <p className="text-base text-gray-900">{student.name}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <FiPhone className="text-teal-600 mt-1" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Phone Number</p>
                                  <p className="text-base text-gray-900">{student.phoneno}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <FiBook className="text-teal-600 mt-1" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Subject</p>
                                  <p className="text-base text-gray-900">{student.subject || "Not specified"}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <FiMapPin className="text-teal-600 mt-1" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Country</p>
                                  <p className="text-base text-gray-900">{student.country || "Not specified"}</p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <FiCalendar className="text-teal-600 mt-1" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Registration Date</p>
                                  <p className="text-base text-gray-900">
                                    {student.registrationdate
                                      ? new Date(student.registrationdate).toLocaleDateString()
                                      : "Not available"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-start gap-3">
                                <FiDollarSign className="text-teal-600 mt-1" size={16} />
                                <div>
                                  <p className="text-sm font-medium text-gray-500">Day Package</p>
                                  <p className="text-base text-gray-900">{student.daypackages || "Not specified"}</p>
                                </div>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <FiUsers className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-600 mb-4">No Students Found</h3>
              <p className="text-gray-500 text-lg">
                {searchQuery || statusFilter !== "all"
                  ? "No students match your current filters. Try adjusting your search criteria."
                  : "You haven't registered any students yet. Start by registering your first student!"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <button
                  onClick={() => router.push(`/registral/${schoolSlug}/registration`)}
                  className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl shadow-lg text-white bg-teal-600 hover:bg-teal-700 transition-all duration-300"
                >
                  <FiUser className="mr-2" />
                  Register First Student
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
