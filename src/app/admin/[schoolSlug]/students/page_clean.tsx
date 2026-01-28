"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Toaster, toast } from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";

// Import our refactored components
import { StudentStatsOverview } from "./components/StudentStatsOverview";
import { StudentChartsSection } from "./components/StudentChartsSection";
import { StudentFilters } from "./components/StudentFilters";
import { StudentListSection } from "./components/StudentListSection";

// Import our custom hook
import { useStudentData } from "./hooks/useStudentData";

export default function StudentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [showStudentDetail, setShowStudentDetail] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Use our custom hook for data management
  const {
    students,
    loading,
    page,
    setPage,
    totalPages,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    stats,
    statsLoading,
    refetchStudents,
    refetchStats,
  } = useStudentData();

  // Handler functions
  const handleRefresh = () => {
    refetchStudents();
    refetchStats();
    toast.success("Data refreshed!");
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    toast.success("Export feature coming soon!");
  };

  const handleAddStudent = () => {
    setIsModalOpen(true);
  };

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
    setIsModalOpen(true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Toaster position="top-center" />

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
                <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                <p className="text-sm text-gray-600">Manage and monitor student data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <StudentStatsOverview stats={stats} statsLoading={statsLoading} />

          {/* Charts Section */}
          <StudentChartsSection stats={stats} />

          {/* Filters */}
          <StudentFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onRefresh={handleRefresh}
            onExport={handleExport}
            onAddStudent={handleAddStudent}
          />

          {/* Students List */}
          <StudentListSection
            students={students}
            loading={loading}
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onViewStudent={handleViewStudent}
            onEditStudent={handleEditStudent}
          />
        </div>
      </div>

      {/* Student Detail Modal - Simplified placeholder */}
      {showStudentDetail && selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Student Details</h2>
            <p><strong>Name:</strong> {selectedStudent.name}</p>
            <p><strong>Phone:</strong> {selectedStudent.phone}</p>
            <p><strong>Status:</strong> {selectedStudent.status}</p>
            <button
              onClick={() => setShowStudentDetail(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Student Modal - Simplified placeholder */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              {editingStudent ? "Edit Student" : "Add New Student"}
            </h2>
            <p>Student form will be implemented here...</p>
            <button
              onClick={() => {
                setIsModalOpen(false);
                setEditingStudent(null);
              }}
              className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}












