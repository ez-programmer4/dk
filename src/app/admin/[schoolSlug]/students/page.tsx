"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Toaster, toast } from "react-hot-toast";
import { FiArrowLeft } from "react-icons/fi";

// Import our refactored components
import { StudentStatsOverview } from "./components/StudentStatsOverview";
import { StudentChartsSection } from "./components/StudentChartsSection";
import { AdvancedAnalytics } from "./components/AdvancedAnalytics";
import { StudentFilters } from "./components/StudentFilters";
import { StudentListSection } from "./components/StudentListSection";
import { FiBarChart } from "react-icons/fi";

// Import our custom hook
import { useStudentData } from "./hooks/useStudentData";

interface Student {
  id: number;
  name: string;
  status: string;
  startDate: string | null;
  ustazName?: string;
  phone?: string;
  email?: string;
  registrationDate?: string;
  package?: string | null;
  subject?: string | null;
  daypackages?: string | null;
  classfee?: number | null;
  classfeeCurrency?: string | null;
  country?: string | null;
  progress?: string | null;
  chatId?: string | null;
  ustaz?: string | null;
  controller?: string | null;
  controllerCode?: string | null;
}

interface StatsAPI {
  overview: {
    totalStudents: number;
    totalActive: number;
    totalNotYet: number;
    activeRate: string;
  };
  monthly: {
    registered: number;
    started: number;
    left: number;
    conversionRate: string;
    retentionRate: string;
  };
  lifecycle: {
    prospects: number;
    active: number;
    churned: number;
    conversionRate: string;
  };
  trends: {
    registrations: Array<{ month: string; monthName: string; count: number }>;
    activations: Array<{ month: string; monthName: string; count: number }>;
  };
  breakdowns: {
    packages: Array<{ name: string; count: number; percentage: string }>;
  };
  payments: {
    currentMonth: {
      totalStudents: number;
      paidStudents: number;
      pendingStudents: number;
    };
  };
  attendance: {
    monthly: {
      present: number;
      absent: number;
      excused: number;
      total: number;
      attendanceRate: string;
    };
  };
  engagement: {
    withPhone: number;
    withTelegram: number;
    withReferral: number;
    contactRate: string;
    telegramRate: string;
    referralRate: string;
  };
  assignments: {
    assigned: number;
    unassigned: number;
    assignmentRate: string;
  };
}

// Inline KPI Dashboard component to avoid import issues
const StudentKPIDashboard: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200/50 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <FiBarChart className="h-5 w-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">
          Student KPI Dashboard
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {stats?.overview?.totalStudents || 0}
          </div>
          <div className="text-sm text-gray-600">Total Students</div>
        </div>
        <div className="text-center p-4 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {stats?.overview?.totalActive || 0}
          </div>
          <div className="text-sm text-gray-600">Active Students</div>
        </div>
        <div className="text-center p-4 bg-purple-50 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {stats?.lifecycle?.conversionRate || "0"}%
          </div>
          <div className="text-sm text-gray-600">Conversion Rate</div>
        </div>
      </div>
    </div>
  );
};

export default function StudentsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;

  // Student detail modal state (keeping for view functionality)
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
    // Redirect to registral registration page for adding new student
    router.push(`/registral/${schoolSlug}/registration`);
  };

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setShowStudentDetail(true);
  };

  const handleEditStudent = (student: any) => {
    // Redirect to registral registration page for editing
    router.push(`/registral/${schoolSlug}/registration?id=${student.id}`);
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
                <h1 className="text-2xl font-bold text-gray-900">
                  Student Management
                </h1>
                <p className="text-sm text-gray-600">
                  Manage and monitor student data
                </p>
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

          {/* Insights Dashboard */}
          <StudentKPIDashboard stats={stats} />

          {/* Charts Section */}
          <StudentChartsSection stats={stats} />

          {/* Advanced Analytics */}
          <AdvancedAnalytics stats={stats} />

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
            <p>
              <strong>Name:</strong> {selectedStudent.name}
            </p>
            <p>
              <strong>Phone:</strong> {selectedStudent.phone}
            </p>
            <p>
              <strong>Status:</strong> {selectedStudent.status}
            </p>
            <button
              onClick={() => setShowStudentDetail(false)}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
