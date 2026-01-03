"use client";

import React, { useEffect, useState } from "react";
import {
  FiUser,
  FiLoader,
  FiAlertTriangle,
  FiUsers,
  FiCheckCircle,
  FiClock,
  FiBarChart,
  FiDollarSign,
  FiXCircle,
  FiEye,
  FiTrendingUp,
  FiTrendingDown,
  FiArrowRight,
  FiFilter,
  FiSearch,
  FiDownload,
  FiCalendar,
  FiBell,
  FiRefreshCw,
  FiArrowUp,
  FiArrowDown,
  FiPrinter,
  FiMail,
  FiMessageCircle,
  FiX,
} from "react-icons/fi";

import StudentList from "@/app/components/StudentList";
import { useSession } from "next-auth/react";
import StudentPayment from "@/app/components/StudentPayment";
import ControllerLayout from "@/app/components/ControllerLayout";
import { toast } from "react-hot-toast";
import { formatCurrency } from "@/lib/formatCurrency";
import { useRouter } from "next/navigation";

interface Student {
  id: number;
  name: string;
  phoneno: string;
  classfee: number;
  classfeeCurrency?: string;
  startdate: string;
  control: string;
  status: string;
  ustaz: string;
  package: string;
  subject: string;
  country: string;
  rigistral: string;
  daypackages: string;
  isTrained: boolean;
  refer: string;
  registrationdate: string;
  selectedTime: string;
  exitdate: string | null;
  teacher: {
    ustazname: string;
  };
  progress: string;
  chatId: string | null;
}

interface Deposit {
  id: number;
  paymentId?: number;
  studentid: number;
  studentname: string;
  paymentdate: string;
  transactionid: string;
  paidamount: number;
  reason: string;
  status: string;
  source?: string;
  providerReference?: string;
  currency?: string;
}

interface MonthlyPayment {
  id: number;
  studentid: number;
  studentname: string;
  month: string;
  paid_amount: number;
  payment_status: string;
  payment_type: string;
  source?: string;
  providerReference?: string;
  depositPaymentId?: number;
  depositTransactionId?: string;
  depositDate?: string;
  currency?: string;
}

interface PaymentStats {
  currentMonth: {
    month: string;
    paid: number;
    notPaid: number;
    total: number;
    totalPaid: number;
    totalExpected: number;
    percentage: number;
  };
  lastMonth: {
    month: string;
    paid: number;
    notPaid: number;
    total: number;
    totalPaid: number;
    totalExpected: number;
    percentage: number;
  };
  studentDetails: Array<{
    studentId: number;
    studentName: string;
    currentMonth: {
      paid: boolean;
      amount: number;
      expected: number;
      status: string;
    };
    lastMonth: {
      paid: boolean;
      amount: number;
      expected: number;
      status: string;
    };
    totalPayments: number;
    currency: string;
  }>;
}

export default function Controller() {
  const [students, setStudents] = useState<Student[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [monthlyPayments, setMonthlyPayments] = useState<MonthlyPayment[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [showDeposits, setShowDeposits] = useState(false);
  const [loadingDeposits, setLoadingDeposits] = useState(false);
  const [loadingPaymentStats, setLoadingPaymentStats] = useState(false);
  const [showPaymentList, setShowPaymentList] = useState(true);
  const [paymentListFilter, setPaymentListFilter] = useState<
    "all" | "paid" | "notPaid" | "overdue"
  >("all");
  const [paymentListSearch, setPaymentListSearch] = useState("");
  const [sortField, setSortField] = useState<
    "name" | "currentMonth" | "lastMonth" | "totalPayments" | "status"
  >("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "controller") {
      fetchData();
      fetchPaymentStats();
    } else if (status === "unauthenticated") {
      setError("Unauthorized access");
      setLoading(false);
    }
  }, [status, session]);

  const fetchData = async () => {
    try {
      const studentsRes = await fetch("/api/controller/students", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!studentsRes.ok) {
        const errorData = await studentsRes.json();
        throw new Error(errorData.error || "Failed to fetch students");
      }

      const studentsData = await studentsRes.json();
      const processedStudents = studentsData.map((student: any) => ({
        id: student.id ?? 0,
        name: student.name ?? "Unknown",
        phoneno: student.phoneno ?? "",
        classfee: student.classfee ?? 0,
        classfeeCurrency: student.classfeeCurrency ?? "ETB",
        startdate: student.startdate ?? "",
        control: student.control ?? "",
        status: student.status ?? "unknown",
        ustaz: student.ustaz ?? "",
        package: student.package ?? "",
        subject: student.subject ?? "",
        country: student.country ?? "",
        rigistral: student.rigistral ?? "",
        daypackages: student.daypackages ?? "",
        isTrained: Boolean(student.isTrained ?? false),
        refer: student.refer ?? "",
        registrationdate: student.registrationdate ?? "",
        selectedTime: student.selectedTime ?? "",
        exitdate: student.exitdate ?? null,
        teacher: {
          ustazname: student.teacher?.ustazname ?? student.ustaz ?? "N/A",
        },
        progress: student.progress ?? "",
        chatId: student.chatId ?? null,
      }));
      setStudents(processedStudents);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data");
      toast.error(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const fetchDeposits = async () => {
    setLoadingDeposits(true);
    try {
      const depositsRes = await fetch("/api/controller/deposits", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!depositsRes.ok) {
        const errorData = await depositsRes.json();
        throw new Error(errorData.error || "Failed to fetch deposits");
      }

      const depositsData = await depositsRes.json();
      setDeposits(depositsData.deposits || []);
      setMonthlyPayments(depositsData.monthlyPayments || []);
      setShowDeposits(true);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch deposits");
    } finally {
      setLoadingDeposits(false);
    }
  };

  const fetchPaymentStats = async () => {
    setLoadingPaymentStats(true);
    try {
      const statsRes = await fetch("/api/controller/payment-stats", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!statsRes.ok) {
        const errorData = await statsRes.json();
        throw new Error(errorData.error || "Failed to fetch payment stats");
      }

      const statsData = await statsRes.json();
      setPaymentStats(statsData);
    } catch (err: any) {
      console.error("Failed to fetch payment stats:", err);
      // Don't show error toast for payment stats, just log it
    } finally {
      setLoadingPaymentStats(false);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
  };

  const handleUpdate = (updatedStudent: Student) => {
    setStudents(
      students.map((s) => {
        const safeStudent = {
          ...updatedStudent,
          id: updatedStudent.id ?? 0,
          name: updatedStudent.name ?? "Unknown",
          phoneno: updatedStudent.phoneno ?? "",
          classfee: updatedStudent.classfee ?? 0,
          startdate: updatedStudent.startdate ?? "",
          control: updatedStudent.control ?? "",
          status: updatedStudent.status ?? "unknown",
          ustaz: updatedStudent.ustaz ?? "",
          package: updatedStudent.package ?? "",
          subject: updatedStudent.subject ?? "",
          country: updatedStudent.country ?? "",
          rigistral: updatedStudent.rigistral ?? "",
          daypackages: updatedStudent.daypackages ?? "",
          isTrained: Boolean(updatedStudent.isTrained ?? false),
          refer: updatedStudent.refer ?? "",
          registrationdate: updatedStudent.registrationdate ?? "",
          selectedTime: updatedStudent.selectedTime ?? "",
          teacher: {
            ustazname:
              updatedStudent.teacher?.ustazname ??
              updatedStudent.ustaz ??
              "N/A",
          },
          progress: updatedStudent.progress ?? "",
          chatId: updatedStudent.chatId ?? null,
          exitdate: updatedStudent.exitdate ?? null,
        };
        return s.id === updatedStudent.id ? safeStudent : s;
      })
    );
    setEditingStudent(null);
    toast.success("Student information updated successfully");
  };

  const handleDelete = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      const response = await fetch(`/api/controller/students/${studentId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to delete student");

      setStudents(students.filter((s) => s.id !== studentId));
      toast.success("Student deleted successfully");
    } catch (error) {
      toast.error("Failed to delete student");
    }
  };

  const handleStatusUpdate = async (studentId: number, newStatus: string) => {
    // Refresh the student list and payment stats to get updated data
    await Promise.all([fetchData(), fetchPaymentStats()]);
  };

  // Export payment data to CSV
  const exportPaymentDataToCSV = () => {
    if (!paymentStats) return;

    const filteredData = paymentStats.studentDetails.filter((student) => {
      const matchesSearch = student.studentName
        .toLowerCase()
        .includes(paymentListSearch.toLowerCase());

      if (paymentListFilter === "all") return matchesSearch;
      if (paymentListFilter === "paid")
        return matchesSearch && student.currentMonth.paid;
      if (paymentListFilter === "notPaid")
        return matchesSearch && !student.currentMonth.paid;
      if (paymentListFilter === "overdue")
        return (
          matchesSearch && !student.currentMonth.paid && !student.lastMonth.paid
        );

      return matchesSearch;
    });

    // Create CSV content
    let csvContent =
      "Student Name,Phone,Current Month Status,Current Month Paid,Current Month Expected,Last Month Status,Last Month Paid,Last Month Expected,Total Payments,Status\n";

    filteredData.forEach((student) => {
      const studentInfo = students.find((s) => s.id === student.studentId);
      const status =
        !student.currentMonth.paid && !student.lastMonth.paid
          ? "Overdue"
          : student.currentMonth.paid
          ? "Up to Date"
          : "Pending";

      csvContent += `"${student.studentName}","${
        studentInfo?.phoneno || ""
      }","${student.currentMonth.paid ? "Paid" : "Not Paid"}","${
        student.currentMonth.amount
      }","${student.currentMonth.expected}","${
        student.lastMonth.paid ? "Paid" : "Not Paid"
      }","${student.lastMonth.amount}","${student.lastMonth.expected}","${
        student.totalPayments
      }","${status}"\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payment_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Payment data exported successfully!");
  };

  // Sort payment data
  const getSortedPaymentData = () => {
    if (!paymentStats) return [];

    let filtered = paymentStats.studentDetails.filter((student) => {
      const matchesSearch = student.studentName
        .toLowerCase()
        .includes(paymentListSearch.toLowerCase());

      if (paymentListFilter === "all") return matchesSearch;
      if (paymentListFilter === "paid")
        return matchesSearch && student.currentMonth.paid;
      if (paymentListFilter === "notPaid")
        return matchesSearch && !student.currentMonth.paid;
      if (paymentListFilter === "overdue")
        return (
          matchesSearch && !student.currentMonth.paid && !student.lastMonth.paid
        );

      return matchesSearch;
    });

    // Sort data
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.studentName.localeCompare(b.studentName);
          break;
        case "currentMonth":
          comparison =
            a.currentMonth.paid === b.currentMonth.paid
              ? 0
              : a.currentMonth.paid
              ? 1
              : -1;
          break;
        case "lastMonth":
          comparison =
            a.lastMonth.paid === b.lastMonth.paid
              ? 0
              : a.lastMonth.paid
              ? 1
              : -1;
          break;
        case "totalPayments":
          comparison = a.totalPayments - b.totalPayments;
          break;
        case "status":
          const aOverdue = !a.currentMonth.paid && !a.lastMonth.paid;
          const bOverdue = !b.currentMonth.paid && !b.lastMonth.paid;
          comparison = aOverdue === bOverdue ? 0 : aOverdue ? 1 : -1;
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return filtered;
  };

  // Handle sort
  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Toggle student selection
  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  // Select all filtered students
  const selectAllFiltered = () => {
    const filteredIds = getSortedPaymentData().map((s) => s.studentId);
    setSelectedStudents(filteredIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedStudents([]);
  };

  // Send reminders to selected students
  const sendRemindersToSelected = () => {
    if (selectedStudents.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    toast.success(
      `Reminder notifications sent to ${selectedStudents.length} student(s)`
    );
    // TODO: Implement actual reminder sending logic
  };

  // Calculate payment trends
  const getPaymentTrends = () => {
    if (!paymentStats) return null;

    const currentPaid = paymentStats.currentMonth.paid;
    const lastPaid = paymentStats.lastMonth.paid;
    const trend = currentPaid - lastPaid;
    const trendPercentage =
      lastPaid > 0
        ? ((trend / lastPaid) * 100).toFixed(1)
        : currentPaid > 0
        ? "100"
        : "0";

    return {
      trend,
      trendPercentage,
      isImproving: trend > 0,
      isDeclining: trend < 0,
    };
  };

  // Calculate statistics
  const totalStudents = students.length;
  const activeStudents = students.filter(
    (s) => s.status == "active" || s.status == "Active"
  ).length;
  const notYetStudents = students.filter(
    (s) => s.status == "not yet" || s.status == "Not yet"
  ).length;
  const leaveStudents = students.filter(
    (s) => s.status?.toLowerCase() === "leave"
  ).length;

  if (loading) {
    return (
      <ControllerLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black mx-auto mb-6"></div>
            <p className="text-black font-medium text-lg">
              Loading your dashboard...
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Please wait while we fetch the data
            </p>
          </div>
        </div>
      </ControllerLayout>
    );
  }

  if (error) {
    return (
      <ControllerLayout>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="p-8 bg-red-50 rounded-full w-fit mx-auto mb-8">
              <FiAlertTriangle className="h-16 w-16 text-red-500" />
            </div>
            <h3 className="text-3xl font-bold text-black mb-4">
              Error Loading Dashboard
            </h3>
            <p className="text-red-600 text-xl mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105"
            >
              Retry
            </button>
          </div>
        </div>
      </ControllerLayout>
    );
  }

  return (
    <ControllerLayout>
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Header + Stats */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center gap-8 mb-8">
              <div className="flex items-center gap-6">
                <div className="p-4 bg-black rounded-2xl shadow-lg">
                  <FiUser className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black mb-2">
                    Controller Dashboard
                  </h1>
                  <p className="text-gray-600 text-base sm:text-lg lg:text-xl">
                    Manage and monitor your assigned students
                  </p>
                </div>
              </div>

              {/* View Deposits Button */}
              <div className="lg:ml-auto">
                <button
                  onClick={fetchDeposits}
                  disabled={loadingDeposits}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-lg"
                >
                  {loadingDeposits ? (
                    <FiLoader className="h-5 w-5 animate-spin" />
                  ) : (
                    <FiDollarSign className="h-5 w-5" />
                  )}
                  {loadingDeposits ? "Loading..." : "View Deposits"}
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <FiUsers className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-600">
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {totalStudents}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-600 rounded-lg">
                    <FiCheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-600">
                      Active Students
                    </p>
                    <p className="text-2xl font-bold text-green-900">
                      {activeStudents}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-2xl p-6 border border-yellow-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-600 rounded-lg">
                    <FiClock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-yellow-600">
                      Pending Students
                    </p>
                    <p className="text-2xl font-bold text-yellow-900">
                      {notYetStudents}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Stats - Current Month */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-2xl p-6 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-600 rounded-lg">
                    <FiDollarSign className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-emerald-600">
                      Paid This Month
                    </p>
                    <p className="text-2xl font-bold text-emerald-900">
                      {loadingPaymentStats ? (
                        <FiLoader className="h-6 w-6 animate-spin inline" />
                      ) : (
                        paymentStats?.currentMonth.paid || 0
                      )}
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      {paymentStats?.currentMonth.percentage || 0}% of total
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Stats - Not Paid Current Month */}
              <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-6 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <FiXCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Not Paid This Month
                    </p>
                    <p className="text-2xl font-bold text-red-900">
                      {loadingPaymentStats ? (
                        <FiLoader className="h-6 w-6 animate-spin inline" />
                      ) : (
                        paymentStats?.currentMonth.notPaid || 0
                      )}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      {paymentStats?.currentMonth.total
                        ? Math.round(
                            (paymentStats.currentMonth.notPaid /
                              paymentStats.currentMonth.total) *
                              100
                          )
                        : 0}
                      % overdue
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment Stats - Last Month */}
              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600 rounded-lg">
                    <FiBarChart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-600">
                      Last Month Paid
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {loadingPaymentStats ? (
                        <FiLoader className="h-6 w-6 animate-spin inline" />
                      ) : (
                        paymentStats?.lastMonth.paid || 0
                      )}
                    </p>
                    <p className="text-xs text-purple-700 mt-1">
                      {paymentStats?.lastMonth.percentage || 0}% paid
                    </p>
                  </div>
                </div>
              </div>

              {/* Leave Students Stat */}
              <div className="bg-gradient-to-br from-red-50 to-rose-100 rounded-2xl p-6 border border-red-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-600 rounded-lg">
                    <FiXCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-600">
                      Leave Students
                    </p>
                    <p className="text-2xl font-bold text-red-900">
                      {leaveStudents}
                    </p>
                    <p className="text-xs text-red-700 mt-1">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Section */}
            {paymentStats && (
              <div className="mt-8 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiBarChart className="h-6 w-6 text-gray-700" />
                  Payment Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Current Month Details */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Current Month ({paymentStats.currentMonth.month})
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Paid:
                        </span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(
                            paymentStats.currentMonth.totalPaid,
                            "ETB"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expected:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(
                            paymentStats.currentMonth.totalExpected,
                            "ETB"
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${paymentStats.currentMonth.percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Last Month Details */}
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Last Month ({paymentStats.lastMonth.month})
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Total Paid:
                        </span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(
                            paymentStats.lastMonth.totalPaid,
                            "ETB"
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expected:</span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(
                            paymentStats.lastMonth.totalExpected,
                            "ETB"
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${paymentStats.lastMonth.percentage}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Student Payment List Section */}
            {paymentStats && (
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden mt-8">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-600 to-purple-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <FiBarChart className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">
                          Student Payment Details
                        </h2>
                        <p className="text-indigo-100">
                          View detailed payment status for all students
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowPaymentList(!showPaymentList)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                      {showPaymentList ? (
                        <FiXCircle className="h-6 w-6" />
                      ) : (
                        <FiEye className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>

                {showPaymentList && (
                  <div className="p-6">
                    {/* Action Bar */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 max-w-md">
                        <div className="relative flex-1">
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by student name..."
                            value={paymentListSearch}
                            onChange={(e) =>
                              setPaymentListSearch(e.target.value)
                            }
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <FiFilter className="text-gray-600" />
                        <select
                          value={paymentListFilter}
                          onChange={(e) =>
                            setPaymentListFilter(e.target.value as any)
                          }
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="all">All Students</option>
                          <option value="paid">Paid This Month</option>
                          <option value="notPaid">Not Paid This Month</option>
                          <option value="overdue">Overdue</option>
                        </select>
                        <button
                          onClick={fetchPaymentStats}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                          title="Refresh payment data"
                        >
                          <FiRefreshCw size={16} />
                          Refresh
                        </button>
                        <button
                          onClick={exportPaymentDataToCSV}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                          title="Export to CSV"
                        >
                          <FiDownload size={16} />
                          Export CSV
                        </button>
                        {selectedStudents.length > 0 && (
                          <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 rounded-lg border border-indigo-200">
                            <span className="text-sm font-medium text-indigo-700">
                              {selectedStudents.length} selected
                            </span>
                            <button
                              onClick={clearSelection}
                              className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment List Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50 border-b-2 border-gray-200">
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedStudents.length > 0 &&
                                    selectedStudents.length ===
                                      getSortedPaymentData().length
                                  }
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      selectAllFiltered();
                                    } else {
                                      clearSelection();
                                    }
                                  }}
                                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <button
                                  onClick={() => handleSort("name")}
                                  className="flex items-center gap-1 hover:text-indigo-600"
                                >
                                  Student Name
                                  {sortField === "name" &&
                                    (sortDirection === "asc" ? (
                                      <FiArrowUp size={14} />
                                    ) : (
                                      <FiArrowDown size={14} />
                                    ))}
                                </button>
                              </div>
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">
                              <button
                                onClick={() => handleSort("currentMonth")}
                                className="flex items-center gap-1 hover:text-indigo-600"
                              >
                                Current Month
                                {sortField === "currentMonth" &&
                                  (sortDirection === "asc" ? (
                                    <FiArrowUp size={14} />
                                  ) : (
                                    <FiArrowDown size={14} />
                                  ))}
                              </button>
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">
                              <button
                                onClick={() => handleSort("lastMonth")}
                                className="flex items-center gap-1 hover:text-indigo-600"
                              >
                                Last Month
                                {sortField === "lastMonth" &&
                                  (sortDirection === "asc" ? (
                                    <FiArrowUp size={14} />
                                  ) : (
                                    <FiArrowDown size={14} />
                                  ))}
                              </button>
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">
                              <button
                                onClick={() => handleSort("totalPayments")}
                                className="flex items-center gap-1 hover:text-indigo-600"
                              >
                                Total Payments
                                {sortField === "totalPayments" &&
                                  (sortDirection === "asc" ? (
                                    <FiArrowUp size={14} />
                                  ) : (
                                    <FiArrowDown size={14} />
                                  ))}
                              </button>
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">
                              <button
                                onClick={() => handleSort("status")}
                                className="flex items-center gap-1 hover:text-indigo-600"
                              >
                                Status
                                {sortField === "status" &&
                                  (sortDirection === "asc" ? (
                                    <FiArrowUp size={14} />
                                  ) : (
                                    <FiArrowDown size={14} />
                                  ))}
                              </button>
                            </th>
                            <th className="text-left py-3 px-4 font-semibold text-gray-700 uppercase text-sm">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {getSortedPaymentData().map((studentDetail) => {
                            const student = students.find(
                              (s) => s.id === studentDetail.studentId
                            );
                            const isOverdue =
                              !studentDetail.currentMonth.paid &&
                              !studentDetail.lastMonth.paid;

                            return (
                              <tr
                                key={studentDetail.studentId}
                                className={`hover:bg-gray-50 transition-colors ${
                                  isOverdue ? "bg-red-50/50" : ""
                                }`}
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedStudents.includes(
                                        studentDetail.studentId
                                      )}
                                      onChange={() =>
                                        toggleStudentSelection(
                                          studentDetail.studentId
                                        )
                                      }
                                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-100 to-purple-200 text-indigo-800 rounded-full flex items-center justify-center font-bold flex-shrink-0">
                                      {studentDetail.studentName
                                        ?.charAt(0)
                                        ?.toUpperCase() || "?"}
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">
                                        {studentDetail.studentName}
                                      </p>
                                      {student && (
                                        <p className="text-xs text-gray-500">
                                          {student.phoneno}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Current Month */}
                                <td className="py-4 px-4">
                                  <div className="space-y-1">
                                    {studentDetail.currentMonth.paid ? (
                                      <div className="flex items-center gap-2">
                                        <FiCheckCircle
                                          className="text-green-600"
                                          size={16}
                                        />
                                        <span className="text-sm font-medium text-green-700">
                                          Paid
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <FiXCircle
                                          className="text-red-600"
                                          size={16}
                                        />
                                        <span className="text-sm font-medium text-red-700">
                                          Not Paid
                                        </span>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600">
                                      {formatCurrency(
                                        studentDetail.currentMonth.amount,
                                        studentDetail.currency
                                      )}{" "}
                                      /{" "}
                                      {formatCurrency(
                                        studentDetail.currentMonth.expected,
                                        studentDetail.currency
                                      )}
                                    </div>
                                    {studentDetail.currentMonth.amount > 0 &&
                                      studentDetail.currentMonth.amount <
                                        studentDetail.currentMonth.expected && (
                                        <div className="text-xs text-yellow-600">
                                          Partial payment
                                        </div>
                                      )}
                                  </div>
                                </td>

                                {/* Last Month */}
                                <td className="py-4 px-4">
                                  <div className="space-y-1">
                                    {studentDetail.lastMonth.paid ? (
                                      <div className="flex items-center gap-2">
                                        <FiCheckCircle
                                          className="text-green-600"
                                          size={16}
                                        />
                                        <span className="text-sm font-medium text-green-700">
                                          Paid
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <FiXCircle
                                          className="text-gray-400"
                                          size={16}
                                        />
                                        <span className="text-sm font-medium text-gray-500">
                                          Not Paid
                                        </span>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-600">
                                      {formatCurrency(
                                        studentDetail.lastMonth.amount,
                                        studentDetail.currency
                                      )}{" "}
                                      /{" "}
                                      {formatCurrency(
                                        studentDetail.lastMonth.expected,
                                        studentDetail.currency
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Total Payments */}
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                    <FiTrendingUp
                                      className="text-indigo-600"
                                      size={16}
                                    />
                                    <span className="text-sm font-semibold text-gray-900">
                                      {studentDetail.totalPayments} months
                                    </span>
                                  </div>
                                </td>

                                {/* Status */}
                                <td className="py-4 px-4">
                                  {isOverdue ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-300 animate-pulse">
                                      <FiAlertTriangle size={12} />
                                      Overdue
                                    </span>
                                  ) : studentDetail.currentMonth.paid ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                                      <FiCheckCircle size={12} />
                                      Up to Date
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                                      <FiClock size={12} />
                                      Pending
                                    </span>
                                  )}
                                </td>

                                {/* Action */}
                                <td className="py-4 px-4">
                                  <button
                                    onClick={() => {
                                      if (student) {
                                        router.push(
                                          `/paymentmanagement/${student.id}`
                                        );
                                      }
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                                  >
                                    <FiDollarSign size={14} />
                                    View Details
                                    <FiArrowRight size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {paymentStats.studentDetails.filter((student) => {
                        const matchesSearch = student.studentName
                          .toLowerCase()
                          .includes(paymentListSearch.toLowerCase());

                        if (paymentListFilter === "all") return matchesSearch;
                        if (paymentListFilter === "paid")
                          return matchesSearch && student.currentMonth.paid;
                        if (paymentListFilter === "notPaid")
                          return matchesSearch && !student.currentMonth.paid;
                        if (paymentListFilter === "overdue")
                          return (
                            matchesSearch &&
                            !student.currentMonth.paid &&
                            !student.lastMonth.paid
                          );

                        return matchesSearch;
                      }).length === 0 &&
                        getSortedPaymentData().length === 0 && (
                          <div className="text-center py-12">
                            <div className="p-8 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                              <FiUsers className="h-16 w-16 text-gray-400" />
                            </div>
                            <p className="text-gray-600 font-medium">
                              No students found matching your criteria
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Payment Trends */}
                    {paymentStats && (
                      <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <FiTrendingUp className="text-indigo-600" />
                          Payment Trends
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                              Month-over-Month
                            </p>
                            {(() => {
                              const trends = getPaymentTrends();
                              if (!trends) return null;
                              return (
                                <div className="flex items-center gap-2">
                                  {trends.isImproving ? (
                                    <FiTrendingUp
                                      className="text-green-600"
                                      size={20}
                                    />
                                  ) : trends.isDeclining ? (
                                    <FiTrendingDown
                                      className="text-red-600"
                                      size={20}
                                    />
                                  ) : (
                                    <FiBarChart
                                      className="text-gray-600"
                                      size={20}
                                    />
                                  )}
                                  <span
                                    className={`text-2xl font-bold ${
                                      trends.isImproving
                                        ? "text-green-600"
                                        : trends.isDeclining
                                        ? "text-red-600"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    {trends.trend > 0 ? "+" : ""}
                                    {trends.trend}
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ({trends.trendPercentage}%)
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                              Payment Rate
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-3">
                                <div
                                  className="bg-indigo-600 h-3 rounded-full transition-all"
                                  style={{
                                    width: `${paymentStats.currentMonth.percentage}%`,
                                  }}
                                ></div>
                              </div>
                              <span className="text-lg font-bold text-indigo-600">
                                {paymentStats.currentMonth.percentage}%
                              </span>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-2">
                              Collection Efficiency
                            </p>
                            <div className="flex items-center gap-2">
                              <FiDollarSign
                                className="text-green-600"
                                size={20}
                              />
                              <span className="text-2xl font-bold text-green-600">
                                {paymentStats.currentMonth.totalExpected > 0
                                  ? Math.round(
                                      (paymentStats.currentMonth.totalPaid /
                                        paymentStats.currentMonth
                                          .totalExpected) *
                                        100
                                    )
                                  : 0}
                                %
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bulk Actions for Selected Students */}
                    {selectedStudents.length > 0 && (
                      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FiBell className="text-yellow-600" size={20} />
                            <span className="font-semibold text-yellow-900">
                              {selectedStudents.length} student(s) selected
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={sendRemindersToSelected}
                              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors flex items-center gap-2 text-sm"
                            >
                              <FiBell size={14} />
                              Send Reminders
                            </button>
                            <button
                              onClick={clearSelection}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                            >
                              Clear Selection
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Summary Footer */}
                    <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FiCheckCircle className="text-green-600" size={20} />
                          <span className="text-sm font-medium text-green-700">
                            Paid This Month
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-green-900">
                          {
                            paymentStats.studentDetails.filter(
                              (s) => s.currentMonth.paid
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FiXCircle className="text-red-600" size={20} />
                          <span className="text-sm font-medium text-red-700">
                            Not Paid
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-red-900">
                          {
                            paymentStats.studentDetails.filter(
                              (s) => !s.currentMonth.paid
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FiAlertTriangle
                            className="text-yellow-600"
                            size={20}
                          />
                          <span className="text-sm font-medium text-yellow-700">
                            Overdue
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-900">
                          {
                            paymentStats.studentDetails.filter(
                              (s) => !s.currentMonth.paid && !s.lastMonth.paid
                            ).length
                          }
                        </p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FiTrendingUp className="text-indigo-600" size={20} />
                          <span className="text-sm font-medium text-indigo-700">
                            Total Students
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-indigo-900">
                          {paymentStats.studentDetails.length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Deposit Management Modal */}
          {showDeposits && (
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <FiDollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Deposits & Monthly Payments
                      </h2>
                      <p className="text-blue-100">
                        View deposits and resulting monthly payments
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDeposits(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <FiXCircle className="h-6 w-6 text-white" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {deposits.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-8 bg-gray-100 rounded-full w-fit mx-auto mb-8">
                      <FiDollarSign className="h-16 w-16 text-gray-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      No Deposits Found
                    </h3>
                    <p className="text-gray-600">
                      No deposits found for the current month.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deposits.map((deposit) => (
                      <div
                        key={deposit.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <FiUser className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {deposit.studentname}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {deposit.transactionid}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(
                                  deposit.paidamount,
                                  deposit.currency
                                )}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(
                                  deposit.paymentdate
                                ).toLocaleDateString()}
                              </p>
                            </div>

                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full ${
                                deposit.status === "approved"
                                  ? "bg-green-100 text-green-800"
                                  : deposit.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {deposit.status?.charAt(0)?.toUpperCase() +
                                deposit.status?.slice(1) || "Unknown"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Monthly Payments from Deposits */}
                {monthlyPayments.length > 0 && (
                  <div className="mt-8">
                    <div className="mb-4 pb-2 border-b border-gray-200">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FiCheckCircle className="h-5 w-5 text-green-600" />
                        Monthly Payments from Deposits
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        These monthly payments were automatically created from
                        approved deposits
                      </p>
                    </div>
                    <div className="space-y-3">
                      {monthlyPayments.map((mp) => (
                        <div
                          key={mp.id}
                          className="bg-green-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <FiCheckCircle className="h-5 w-5 text-green-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900">
                                  {mp.studentname}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  Month: {mp.month}
                                </p>
                                {mp.depositTransactionId && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    From deposit: {mp.depositTransactionId}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="text-lg font-bold text-gray-900">
                                  {formatCurrency(mp.paid_amount, mp.currency)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {mp.payment_type === "auto"
                                    ? "Auto"
                                    : "Partial"}
                                </p>
                              </div>

                              <span
                                className={`px-3 py-1 text-sm font-medium rounded-full ${
                                  mp.payment_status === "Paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {mp.payment_status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Student List */}
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 sm:p-8 lg:p-10 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-black rounded-xl">
                  <FiUsers className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-black">
                    Student Management
                  </h2>
                  <p className="text-gray-600">
                    View and manage your assigned students
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 lg:p-10">
              <StudentList
                students={students}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusUpdate={handleStatusUpdate}
                user={
                  session?.user
                    ? {
                        name: session.user.name ?? "Unknown",
                        username: session.user.username ?? "",
                        role: session.user.role ?? "controller",
                      }
                    : null
                }
              />
            </div>
          </div>
        </div>

        {/* Student Payment Modal */}
        {editingStudent && (
          <StudentPayment
            student={editingStudent}
            onClose={() => setEditingStudent(null)}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </ControllerLayout>
  );
}
